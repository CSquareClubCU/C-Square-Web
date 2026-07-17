"""
Tests for the users app.
Covers models, services, and views (API endpoints).
Follows Arrange → Act → Assert pattern throughout.
"""

import uuid
from unittest.mock import patch, MagicMock

import pytest
from django.contrib.auth import get_user_model
from django.test import RequestFactory
from rest_framework.test import APIClient

from core.exceptions import AppError
from users.models import User, UserRole
from users import services

User = get_user_model()


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def student_user(db):
    return User.objects.create_user(
        email='student@cuchd.in',
        full_name='Arjun Singh',
        role=UserRole.STUDENT,
        is_cu_student=True,
    )


@pytest.fixture
def volunteer_user(db):
    return User.objects.create_user(
        email='volunteer@cuchd.in',
        full_name='Rahul Sharma',
        role=UserRole.VOLUNTEER,
        is_cu_student=True,
    )


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        email='admin@cuchd.in',
        full_name='Priya Mehta',
        role=UserRole.ADMIN,
        is_cu_student=True,
        is_staff=True,
        is_superuser=True,
    )


@pytest.fixture
def external_user(db):
    return User.objects.create_user(
        email='user@gmail.com',
        full_name='External User',
        role=UserRole.STUDENT,
        is_cu_student=False,
    )


# ---------------------------------------------------------------------------
# Model Tests
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestUserModel:
    def test_user_has_uuid_primary_key(self, student_user):
        # UUID type check
        assert isinstance(student_user.id, uuid.UUID)

    def test_new_user_gets_student_role_by_default(self, db):
        user = User.objects.create_user(email='new@cuchd.in', full_name='New Person')
        assert user.role == UserRole.STUDENT

    def test_cu_student_email_domains(self, db):
        cuchd = User.objects.create_user(email='a@cuchd.in', full_name='A')
        cumail = User.objects.create_user(email='b@cumail.in', full_name='B')
        gmail = User.objects.create_user(email='c@gmail.com', full_name='C')
        # is_cu_student is set by the service, not the model — model stores what's given
        # Test that CU_DOMAINS detection works in the service
        assert services._is_cu_student('a@cuchd.in') is True
        assert services._is_cu_student('b@cumail.in') is True
        assert services._is_cu_student('c@gmail.com') is False

    def test_user_str_representation(self, student_user):
        assert 'Arjun Singh' in str(student_user)
        assert 'student@cuchd.in' in str(student_user)

    def test_is_admin_property(self, admin_user, student_user):
        assert admin_user.is_admin is True
        assert student_user.is_admin is False

    def test_is_volunteer_property(self, volunteer_user, student_user):
        assert volunteer_user.is_volunteer is True
        assert student_user.is_volunteer is False

    def test_user_email_is_unique(self, student_user, db):
        from django.db import IntegrityError
        with pytest.raises(IntegrityError):
            User.objects.create_user(email='student@cuchd.in', full_name='Duplicate')

    def test_profile_fields_nullable_on_creation(self, student_user):
        assert student_user.student_uid is None
        assert student_user.batch is None
        assert student_user.phone is None


# ---------------------------------------------------------------------------
# Service Tests — send_magic_link
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestSendMagicLink:
    @patch('users.services.send_magic_link_email')
    def test_does_not_create_new_user_in_db(self, mock_email, db):
        with patch('django.core.signing.TimestampSigner.sign', return_value='test-token'):
            services.send_magic_link('newstudent@cuchd.in')

        # We no longer create the user in send_magic_link
        assert not User.objects.filter(email='newstudent@cuchd.in').exists()
        mock_email.assert_called_once()

    @patch('users.services.send_magic_link_email')
    def test_email_is_normalised_to_lowercase(self, mock_email, db):
        with patch('django.core.signing.TimestampSigner.sign', return_value='token') as mock_sign:
            services.send_magic_link('  UPPER@CUCHD.IN  ')
        # Ensure it signs and sends the lowercase version
        mock_sign.assert_called_once_with('upper@cuchd.in')
        assert mock_email.call_args[1]['to'] == 'upper@cuchd.in'

    @patch('users.services.send_magic_link_email')
    def test_rate_limiting_prevents_spam(self, mock_email, db):
        from django.core.cache import cache
        cache.delete('magic_link_req_spam@cuchd.in')
        
        with patch('django.core.signing.TimestampSigner.sign', return_value='token'):
            services.send_magic_link('spam@cuchd.in')
            services.send_magic_link('spam@cuchd.in')
            services.send_magic_link('spam@cuchd.in')
            
            with pytest.raises(AppError) as exc_info:
                services.send_magic_link('spam@cuchd.in')
                
        assert exc_info.value.code == 'RATE_LIMIT_EXCEEDED'
        assert mock_email.call_count == 3



# ---------------------------------------------------------------------------
# Service Tests — verify_magic_link
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestVerifyMagicLink:
    def test_invalid_token_raises_app_error(self, db):
        request = RequestFactory().get('/')
        from django.core.signing import BadSignature
        with patch('django.core.signing.TimestampSigner.unsign', side_effect=BadSignature('Bad')):
            with pytest.raises(AppError) as exc_info:
                services.verify_magic_link('bad-token')
        assert exc_info.value.code == 'INVALID_TOKEN'
        assert exc_info.value.status == 400

    def test_expired_token_raises_app_error(self, db):
        request = RequestFactory().get('/')
        from django.core.signing import SignatureExpired
        with patch('django.core.signing.TimestampSigner.unsign', side_effect=SignatureExpired('Expired')):
            with pytest.raises(AppError) as exc_info:
                services.verify_magic_link('expired-token')
        assert exc_info.value.code == 'INVALID_TOKEN'
        assert exc_info.value.status == 400

    def test_valid_token_returns_existing_user(self, student_user):
        request = RequestFactory().get('/')
        with patch('django.core.signing.TimestampSigner.unsign', return_value='student@cuchd.in'):
            result = services.verify_magic_link('valid-token')
        assert result == student_user

    def test_valid_token_creates_new_user_if_not_exists(self, db):
        request = RequestFactory().get('/')
        assert not User.objects.filter(email='new@cuchd.in').exists()
        with patch('django.core.signing.TimestampSigner.unsign', return_value='new@cuchd.in'):
            result = services.verify_magic_link('valid-token')
        
        # User is created on verification
        assert result.email == 'new@cuchd.in'
        assert result.is_cu_student is True
        assert result.role == UserRole.STUDENT
        assert User.objects.filter(email='new@cuchd.in').exists()

    def test_admin_user_gets_is_staff_set(self, admin_user):
        admin_user.is_staff = False
        admin_user.save()
        request = RequestFactory().get('/')
        with patch('django.core.signing.TimestampSigner.unsign', return_value='admin@cuchd.in'):
            result = services.verify_magic_link('valid-token')
        # Refresh from DB
        admin_user.refresh_from_db()
        assert admin_user.is_staff is True


# ---------------------------------------------------------------------------
# Service Tests — update_user_profile
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestUpdateUserProfile:
    def test_updates_provided_fields(self, student_user):
        updated = services.update_user_profile(student_user, {
            'full_name': 'Updated Name',
            'graduation_year': 2025,
        })
        assert updated.full_name == 'Updated Name'
        assert updated.graduation_year == 2025

    def test_does_not_modify_unprovided_fields(self, student_user):
        student_user.phone = '9876543210'
        student_user.save()
        services.update_user_profile(student_user, {'full_name': 'New Name'})
        student_user.refresh_from_db()
        assert student_user.phone == '9876543210'

    def test_persists_to_database(self, student_user):
        services.update_user_profile(student_user, {'graduation_year': 2026})
        student_user.refresh_from_db()
        assert student_user.graduation_year == 2026


# ---------------------------------------------------------------------------
# Service Tests — change_user_role
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestChangeUserRole:
    def test_changes_role_to_volunteer(self, student_user, admin_user):
        result = services.change_user_role(student_user, 'volunteer', admin_user)
        assert result.role == UserRole.VOLUNTEER

    def test_changes_role_to_admin_sets_is_staff(self, student_user, admin_user):
        result = services.change_user_role(student_user, 'admin', admin_user)
        assert result.is_staff is True

    def test_demoting_from_admin_removes_is_staff(self, admin_user):
        result = services.change_user_role(admin_user, 'student', admin_user)
        assert result.is_staff is False

    def test_invalid_role_raises_app_error(self, student_user, admin_user):
        with pytest.raises(AppError) as exc_info:
            services.change_user_role(student_user, 'superuser', admin_user)
        assert exc_info.value.code == 'VALIDATION_ERROR'

    def test_persists_role_change_to_database(self, student_user, admin_user):
        services.change_user_role(student_user, 'volunteer', admin_user)
        student_user.refresh_from_db()
        assert student_user.role == UserRole.VOLUNTEER


# ---------------------------------------------------------------------------
# View Tests — Auth endpoints
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestMagicLinkView:
    def test_valid_email_returns_200(self, api_client):
        with patch('users.services.send_magic_link') as mock_send:
            response = api_client.post(
                '/api/auth/magic-link/',
                {'email': 'student@cuchd.in'},
                format='json',
            )
        assert response.status_code == 200
        assert response.data['email'] == 'student@cuchd.in'
        mock_send.assert_called_once_with('student@cuchd.in')

    def test_invalid_email_returns_400(self, api_client):
        response = api_client.post(
            '/api/auth/magic-link/',
            {'email': 'not-an-email'},
            format='json',
        )
        assert response.status_code == 400
        assert response.data['error']['code'] == 'VALIDATION_ERROR'
        assert 'email' in response.data['error']['fields']

    def test_missing_email_returns_400(self, api_client):
        response = api_client.post('/api/auth/magic-link/', {}, format='json')
        assert response.status_code == 400

    def test_no_auth_required(self, api_client):
        with patch('users.services.send_magic_link'):
            response = api_client.post(
                '/api/auth/magic-link/',
                {'email': 'any@cuchd.in'},
                format='json',
            )
        assert response.status_code != 401


@pytest.mark.django_db
class TestMagicLinkVerifyView:
    def test_valid_token_returns_200_and_user(self, api_client, student_user):
        with patch('users.services.verify_magic_link', return_value=student_user):
            with patch('users.views.login'):
                response = api_client.get('/api/auth/verify/?token=valid-token')

        assert response.status_code == 200
        assert response.data['user']['email'] == 'student@cuchd.in'

    def test_missing_token_returns_400(self, api_client):
        response = api_client.get('/api/auth/verify/')
        assert response.status_code == 400
        assert response.data['error']['code'] == 'INVALID_TOKEN'

    def test_invalid_token_returns_400(self, api_client):
        with patch('users.services.verify_magic_link',
                   side_effect=AppError('INVALID_TOKEN', 'Invalid.', status=400)):
            response = api_client.get('/api/auth/verify/?token=bad')
        assert response.status_code == 400
        assert response.data['error']['code'] == 'INVALID_TOKEN'

    def test_valid_token_with_plus_address(self, api_client):
        from django.core.signing import TimestampSigner
        from urllib.parse import urlencode

        signer = TimestampSigner()
        email = 'student+test@cuchd.in'
        token = signer.sign(email)
        query_string = urlencode({'token': token})
        
        with patch('users.views.login'):
            response = api_client.get(f'/api/auth/verify/?{query_string}')
            
        assert response.status_code == 200
        assert response.data['user']['email'] == 'student+test@cuchd.in'


@pytest.mark.django_db
class TestLogoutView:
    def test_logout_returns_200(self, api_client, student_user):
        api_client.force_authenticate(user=student_user)
        response = api_client.post('/api/auth/logout/')
        assert response.status_code == 200
        assert 'Logged out' in response.data['message']

    def test_unauthenticated_returns_401(self, api_client):
        # DRF SessionAuthentication returns 403 for unauthenticated requests
        # (no WWW-Authenticate header means DRF uses 403 instead of 401)
        response = api_client.post('/api/auth/logout/')
        assert response.status_code in (401, 403)


@pytest.mark.django_db
class TestMeView:
    def test_returns_current_user(self, api_client, student_user):
        api_client.force_authenticate(user=student_user)
        response = api_client.get('/api/auth/me/')
        assert response.status_code == 200
        assert response.data['email'] == 'student@cuchd.in'
        assert response.data['role'] == 'student'

    def test_unauthenticated_returns_401(self, api_client):
        # DRF SessionAuthentication returns 403 for unauthenticated requests
        response = api_client.get('/api/auth/me/')
        assert response.status_code in (401, 403)


@pytest.mark.django_db
class TestUserProfileView:
    def test_patch_updates_profile(self, api_client, student_user):
        api_client.force_authenticate(user=student_user)
        response = api_client.patch(
            '/api/users/me/',
            {'full_name': 'Updated Name', 'graduation_year': 2026},
            format='json',
        )
        assert response.status_code == 200
        assert response.data['full_name'] == 'Updated Name'
        assert response.data['graduation_year'] == 2026

    def test_invalid_graduation_year_returns_400(self, api_client, student_user):
        api_client.force_authenticate(user=student_user)
        response = api_client.patch(
            '/api/users/me/',
            {'graduation_year': 1999},
            format='json',
        )
        assert response.status_code == 400
        assert 'graduation_year' in response.data['error']['fields']

    def test_unauthenticated_returns_401(self, api_client):
        # DRF SessionAuthentication returns 403 for unauthenticated requests
        response = api_client.patch('/api/users/me/', {}, format='json')
        assert response.status_code in (401, 403)


@pytest.mark.django_db
class TestUserListView:
    def test_admin_can_list_users(self, api_client, admin_user, student_user):
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/users/')
        assert response.status_code == 200
        assert 'results' in response.data
        assert response.data['count'] >= 1

    def test_student_cannot_list_users(self, api_client, student_user):
        api_client.force_authenticate(user=student_user)
        response = api_client.get('/api/users/')
        assert response.status_code == 403

    def test_filter_by_role(self, api_client, admin_user, student_user, volunteer_user):
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/users/?role=volunteer')
        assert response.status_code == 200
        for user_data in response.data['results']:
            assert user_data['role'] == 'volunteer'

    def test_search_by_email(self, api_client, admin_user, student_user):
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/users/?search=arjun')
        assert response.status_code == 200
        emails = [u['email'] for u in response.data['results']]
        assert 'student@cuchd.in' in emails


@pytest.mark.django_db
class TestUserRoleView:
    def test_admin_can_change_role(self, api_client, admin_user, student_user):
        api_client.force_authenticate(user=admin_user)
        response = api_client.patch(
            f'/api/users/{student_user.id}/role/',
            {'role': 'volunteer'},
            format='json',
        )
        assert response.status_code == 200
        assert response.data['role'] == 'volunteer'

    def test_student_cannot_change_role(self, api_client, student_user, volunteer_user):
        api_client.force_authenticate(user=student_user)
        response = api_client.patch(
            f'/api/users/{volunteer_user.id}/role/',
            {'role': 'student'},
            format='json',
        )
        assert response.status_code == 403

    def test_invalid_role_returns_400(self, api_client, admin_user, student_user):
        api_client.force_authenticate(user=admin_user)
        response = api_client.patch(
            f'/api/users/{student_user.id}/role/',
            {'role': 'superadmin'},
            format='json',
        )
        assert response.status_code == 400

    def test_nonexistent_user_returns_404(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)
        response = api_client.patch(
            f'/api/users/{uuid.uuid4()}/role/',
            {'role': 'volunteer'},
            format='json',
        )
        assert response.status_code == 404
        assert response.data['error']['code'] == 'NOT_FOUND'
