"""
Global exception handler.

Registered in settings.py as REST_FRAMEWORK['EXCEPTION_HANDLER'].
Converts ALL exceptions — AppError, DRF ValidationError, authentication errors —
into the standard project error shape:

    {
        "error": {
            "code": "ERROR_CODE",
            "message": "Human readable message.",
            "fields": {}
        }
    }

This means no view can accidentally return a non-standard error response.
"""

import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

from core.exceptions import AppError

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Intercepts all exceptions and returns the standard error shape.
    Called by DRF before the default handler.
    """

    # 1. Handle our own domain exceptions first
    if isinstance(exc, AppError):
        return Response(
            {
                'error': {
                    'code': exc.code,
                    'message': exc.message,
                    'fields': exc.fields,
                }
            },
            status=exc.status,
        )

    # 2. Let DRF handle its own exceptions (ValidationError, AuthenticationFailed, etc.)
    response = drf_exception_handler(exc, context)

    if response is not None:
        # Reformat DRF's default response into our standard shape
        error_data = response.data

        # DRF ValidationError — field-level errors are a dict or list
        if isinstance(error_data, dict):
            # Check if it looks like DRF field errors (keys are field names with list values)
            fields = {}
            non_field_messages = []

            for key, value in error_data.items():
                if key == 'detail':
                    # DRF puts auth/permission errors under 'detail'
                    non_field_messages.append(str(value))
                elif key == 'non_field_errors':
                    non_field_messages.append(
                        value[0] if isinstance(value, list) else str(value)
                    )
                else:
                    fields[key] = value[0] if isinstance(value, list) else str(value)

            message = non_field_messages[0] if non_field_messages else 'Invalid input.'
            code = _status_to_code(response.status_code)

            response.data = {
                'error': {
                    'code': code,
                    'message': message,
                    'fields': fields,
                }
            }
        elif isinstance(error_data, list):
            response.data = {
                'error': {
                    'code': 'VALIDATION_ERROR',
                    'message': error_data[0] if error_data else 'Invalid input.',
                    'fields': {},
                }
            }

        return response

    # 3. Unhandled exception — log it and return a generic 500
    logger.exception('Unhandled exception in API view: %s', exc)
    return Response(
        {
            'error': {
                'code': 'SERVER_ERROR',
                'message': 'An unexpected error occurred. Please try again later.',
                'fields': {},
            }
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


def _status_to_code(http_status: int) -> str:
    """Map HTTP status codes to our error code strings."""
    mapping = {
        400: 'VALIDATION_ERROR',
        401: 'UNAUTHORIZED',
        403: 'FORBIDDEN',
        404: 'NOT_FOUND',
        405: 'METHOD_NOT_ALLOWED',
        409: 'CONFLICT',
        429: 'RATE_LIMITED',
        500: 'SERVER_ERROR',
    }
    return mapping.get(http_status, 'ERROR')
