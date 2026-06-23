from rest_framework.exceptions import APIException
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


class AppError(Exception):
    """
    Domain-level exception raised from services.
    Views catch this and convert it to the standard API error shape.
    """
    def __init__(self, code: str, message: str, fields: dict = None, http_status: int = 400):
        self.code = code
        self.message = message
        self.fields = fields or {}
        self.http_status = http_status
        super().__init__(message)


def custom_exception_handler(exc, context):
    """
    Custom exception handler that always returns the standard error shape:
    { "error": { "code": "...", "message": "...", "fields": {} } }
    """
    # Handle our own AppError first
    if isinstance(exc, AppError):
        return Response(
            {
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "fields": exc.fields
                }
            },
            status=exc.http_status
        )

    # Call DRF's default handler for everything else
    response = exception_handler(exc, context)

    if response is not None:
        # Re-shape DRF's default error format into our standard shape
        error_detail = response.data

        # DRF validation errors come as dicts with field-level messages
        if isinstance(error_detail, dict):
            fields = {}
            non_field_messages = []
            for key, value in error_detail.items():
                if key == 'non_field_errors':
                    non_field_messages.extend(
                        [str(v) for v in value] if isinstance(value, list) else [str(value)]
                    )
                else:
                    fields[key] = str(value[0]) if isinstance(value, list) else str(value)

            message = non_field_messages[0] if non_field_messages else 'Invalid input.'
            code = 'VALIDATION_ERROR'

            if response.status_code == 401:
                code = 'UNAUTHORIZED'
                message = 'Authentication credentials were not provided.'
            elif response.status_code == 403:
                code = 'FORBIDDEN'
                message = 'You do not have permission to perform this action.'
            elif response.status_code == 404:
                code = 'NOT_FOUND'
                message = 'The requested resource was not found.'
            elif response.status_code == 405:
                code = 'METHOD_NOT_ALLOWED'
                message = 'Method not allowed.'

            response.data = {
                "error": {
                    "code": code,
                    "message": message,
                    "fields": fields
                }
            }

    return response
