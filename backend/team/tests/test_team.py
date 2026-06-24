"""
Tests for the team app.
Covers models, services, and all 5 API endpoints.
"""

import uuid
from unittest.mock import patch

import pytest

from core.exceptions import AppError
from team.models import TeamMember
from team import services
from users.models import User, UserRole


@pytest.fixture
def api_client():
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        email='admin@cuchd.in', full_name='Admin', role=UserRole.ADMIN,
        is_staff=True, is_superuser=True,
    )


@pytest.fixture
def student(db):
    return User.objects.create_user(
        email='student@cuchd.in', full_name='Student', role=UserRole.STUDENT,
    )


@pytest.fixture
def member(db):
    return TeamMember.objects.create(
        full_name='Alice Chen', designation='President', display_order=1,
    )


# ---------------------------------------------------------------------------
# Model Tests
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestTeamMemberModel:
    def test_has_uuid_pk(self, member):
        assert isinstance(member.id, uuid.UUID)

    def test_default_is_active(self, member):
        assert member.is_active is True

    def test_str_representation(self, member):
        assert 'Alice Chen' in str(member)
        assert 'President' in str(member)


# ---------------------------------------------------------------------------
# Service Tests
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestTeamServices:
    def test_create_team_member(self):
        member = services.create_team_member({
            'full_name': 'Bob Smith', 'designation': 'VP', 'display_order': 2,
        })
        assert member.full_name == 'Bob Smith'
        assert TeamMember.objects.filter(pk=member.pk).exists()

    def test_update_team_member(self, member):
        updated = services.update_team_member(member, {'designation': 'Technical Lead'})
        assert updated.designation == 'Technical Lead'
        # persisted
        member.refresh_from_db()
        assert member.designation == 'Technical Lead'

    def test_deactivate_team_member(self, member):
        services.deactivate_team_member(member)
        member.refresh_from_db()
        assert member.is_active is False

    def test_deactivated_member_still_in_db(self, member):
        services.deactivate_team_member(member)
        assert TeamMember.objects.filter(pk=member.pk).exists()

    def test_get_team_member_or_404_raises(self):
        with pytest.raises(AppError) as exc:
            services.get_team_member_or_404(uuid.uuid4())
        assert exc.value.code == 'NOT_FOUND'


# ---------------------------------------------------------------------------
# View Tests
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestTeamMemberListView:
    def test_public_list_returns_active_only(self, api_client, member):
        # Create inactive
        TeamMember.objects.create(full_name='Inactive', designation='X', is_active=False)
        response = api_client.get('/api/team/')
        assert response.status_code == 200
        names = [m['full_name'] for m in response.data]
        assert 'Alice Chen' in names
        assert 'Inactive' not in names

    def test_public_list_no_auth_required(self, api_client, member):
        response = api_client.get('/api/team/')
        assert response.status_code == 200

    def test_ordered_by_display_order(self, api_client):
        TeamMember.objects.create(full_name='Z Member', designation='X', display_order=99)
        TeamMember.objects.create(full_name='A Member', designation='Y', display_order=1)
        response = api_client.get('/api/team/')
        assert response.data[0]['full_name'] == 'A Member'

    def test_admin_can_create_member(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)
        response = api_client.post(
            '/api/team/',
            {'full_name': 'New Member', 'designation': 'Dev', 'display_order': 5},
            format='json',
        )
        assert response.status_code == 201
        assert response.data['full_name'] == 'New Member'

    def test_student_cannot_create_member(self, api_client, student):
        api_client.force_authenticate(user=student)
        response = api_client.post('/api/team/', {'full_name': 'X', 'designation': 'Y'}, format='json')
        assert response.status_code == 403

    def test_create_missing_fields_returns_400(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)
        response = api_client.post('/api/team/', {}, format='json')
        assert response.status_code == 400


@pytest.mark.django_db
class TestTeamMemberDetailView:
    def test_admin_can_patch(self, api_client, admin_user, member):
        api_client.force_authenticate(user=admin_user)
        response = api_client.patch(
            f'/api/team/{member.id}/',
            {'designation': 'VP'},
            format='json',
        )
        assert response.status_code == 200
        assert response.data['designation'] == 'VP'

    def test_admin_can_soft_delete(self, api_client, admin_user, member):
        api_client.force_authenticate(user=admin_user)
        response = api_client.delete(f'/api/team/{member.id}/')
        assert response.status_code == 204
        member.refresh_from_db()
        assert member.is_active is False  # soft delete — still in DB

    def test_student_cannot_delete(self, api_client, student, member):
        api_client.force_authenticate(user=student)
        response = api_client.delete(f'/api/team/{member.id}/')
        assert response.status_code == 403

    def test_nonexistent_member_returns_404(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)
        valid_nonexistent_id = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'
        response = api_client.patch(f'/api/team/{valid_nonexistent_id}/', {'designation': 'X'}, format='json')
        assert response.status_code == 404
