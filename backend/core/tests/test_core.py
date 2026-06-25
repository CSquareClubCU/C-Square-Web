"""
Tests for core app.
- BaseModel UUID PK
- AppError exception shape
- custom_exception_handler response format
- Permission classes
"""

import uuid

import pytest
from django.test import RequestFactory
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied, ValidationError
from rest_framework.test import APIRequestFactory
from unittest.mock import MagicMock

from core.exceptions import AppError
from core.handlers import custom_exception_handler
from core.permissions import IsAdmin, IsVolunteer, IsAdminOrVolunteer, IsOwnerOrAdmin


# ---------------------------------------------------------------------------
# AppError Tests
# ---------------------------------------------------------------------------

class TestAppError:
    def test_app_error_stores_code_and_message(self):
        err = AppError(code='TEST_ERROR', message='Something failed.')
        assert err.code == 'TEST_ERROR'
        assert err.message == 'Something failed.'

    def test_app_error_default_fields_is_empty_dict(self):
        err = AppError(code='X', message='Y')
        assert err.fields == {}

    def test_app_error_default_status_is_400(self):
        err = AppError(code='X', message='Y')
        assert err.status == 400

    def test_app_error_custom_status(self):
        err = AppError(code='NOT_FOUND', message='Not found.', status=404)
        assert err.status == 404

    def test_app_error_with_fields(self):
        err = AppError(
            code='VALIDATION_ERROR',
            message='Invalid input.',
            fields={'email': 'Invalid email.'},
        )
        assert err.fields == {'email': 'Invalid email.'}

    def test_app_error_is_exception(self):
        with pytest.raises(AppError):
            raise AppError(code='X', message='Y')


# ---------------------------------------------------------------------------
# Exception Handler Tests
# ---------------------------------------------------------------------------

class TestCustomExceptionHandler:
    def _get_context(self):
        return {'request': APIRequestFactory().get('/')}

    def test_app_error_returns_standard_shape(self):
        exc = AppError(code='REGISTRATION_CLOSED', message='Registration is closed.')
        response = custom_exception_handler(exc, self._get_context())

        assert response.status_code == 400
        assert response.data['error']['code'] == 'REGISTRATION_CLOSED'
        assert response.data['error']['message'] == 'Registration is closed.'
        assert response.data['error']['fields'] == {}

    def test_app_error_404_status(self):
        exc = AppError(code='NOT_FOUND', message='Not found.', status=404)
        response = custom_exception_handler(exc, self._get_context())
        assert response.status_code == 404

    def test_drf_validation_error_reformatted(self):
        exc = ValidationError({'email': ['Enter a valid email address.']})
        response = custom_exception_handler(exc, self._get_context())

        assert response.status_code == 400
        assert 'error' in response.data
        assert response.data['error']['code'] == 'VALIDATION_ERROR'
        assert 'email' in response.data['error']['fields']

    def test_drf_auth_failed_reformatted(self):
        exc = AuthenticationFailed('Authentication credentials were not provided.')
        response = custom_exception_handler(exc, self._get_context())

        assert response.status_code == 401
        assert response.data['error']['code'] == 'UNAUTHORIZED'

    def test_drf_permission_denied_reformatted(self):
        exc = PermissionDenied('You do not have permission.')
        response = custom_exception_handler(exc, self._get_context())

        assert response.status_code == 403
        assert response.data['error']['code'] == 'FORBIDDEN'

    def test_unhandled_exception_returns_500(self):
        exc = RuntimeError('Something exploded.')
        response = custom_exception_handler(exc, self._get_context())

        assert response.status_code == 500
        assert response.data['error']['code'] == 'SERVER_ERROR'


# ---------------------------------------------------------------------------
# Permission Class Tests
# ---------------------------------------------------------------------------

def _make_request(role: str | None, authenticated: bool = True):
    """Helper: creates a mock request with a user of the given role."""
    request = MagicMock()
    request.user = MagicMock()
    request.user.is_authenticated = authenticated
    request.user.role = role
    return request


class TestIsAdmin:
    def test_admin_user_has_permission(self):
        perm = IsAdmin()
        assert perm.has_permission(_make_request('admin'), None) is True

    def test_student_user_denied(self):
        perm = IsAdmin()
        assert perm.has_permission(_make_request('student'), None) is False

    def test_volunteer_user_denied(self):
        perm = IsAdmin()
        assert perm.has_permission(_make_request('volunteer'), None) is False

    def test_unauthenticated_denied(self):
        perm = IsAdmin()
        assert perm.has_permission(_make_request(None, authenticated=False), None) is False


class TestIsVolunteer:
    def test_volunteer_has_permission(self):
        perm = IsVolunteer()
        assert perm.has_permission(_make_request('volunteer'), None) is True

    def test_admin_denied(self):
        perm = IsVolunteer()
        assert perm.has_permission(_make_request('admin'), None) is False

    def test_student_denied(self):
        perm = IsVolunteer()
        assert perm.has_permission(_make_request('student'), None) is False


class TestIsAdminOrVolunteer:
    def test_admin_has_permission(self):
        perm = IsAdminOrVolunteer()
        assert perm.has_permission(_make_request('admin'), None) is True

    def test_volunteer_has_permission(self):
        perm = IsAdminOrVolunteer()
        assert perm.has_permission(_make_request('volunteer'), None) is True

    def test_student_denied(self):
        perm = IsAdminOrVolunteer()
        assert perm.has_permission(_make_request('student'), None) is False


class TestIsOwnerOrAdmin:
    def test_owner_has_permission(self):
        perm = IsOwnerOrAdmin()
        request = _make_request('student')
        obj = MagicMock()
        obj.user = request.user
        assert perm.has_object_permission(request, None, obj) is True

    def test_admin_has_permission_override(self):
        perm = IsOwnerOrAdmin()
        request = _make_request('admin')
        obj = MagicMock()
        obj.user = MagicMock()
        assert perm.has_object_permission(request, None, obj) is True

    def test_non_owner_denied(self):
        perm = IsOwnerOrAdmin()
        request = _make_request('student')
        obj = MagicMock()
        obj.user = MagicMock()
        assert perm.has_object_permission(request, None, obj) is False

    def test_unauthenticated_anonymous_denied(self):
        perm = IsOwnerOrAdmin()
        request = _make_request(None, authenticated=False)
        obj = MagicMock()
        obj.user = MagicMock()
        assert perm.has_object_permission(request, None, obj) is False
