class AppError(Exception):
    """
    Domain-level exception raised by service functions.

    Services raise AppError — views never catch raw exceptions.
    The custom_exception_handler in core/handlers.py converts these
    into the standard API error response shape:

        { "error": { "code": "...", "message": "...", "fields": {} } }

    Usage in services:
        raise AppError(
            code='REGISTRATION_CLOSED',
            message='Registration for this event has closed.',
            status=400,
        )

        raise AppError(
            code='VALIDATION_ERROR',
            message='Invalid input.',
            fields={'email': 'Enter a valid email address.'},
        )

    Shorthand positional:
        raise AppError('NOT_FOUND', 'Event not found.', 404)
        # -> code='NOT_FOUND', message='...', status=404, fields={}
    """

    def __init__(self, code: str, message: str, status: int = 400, *, fields: dict | None = None):
        self.code = code
        self.message = message
        self.status = status
        self.fields = fields or {}
        super().__init__(message)
