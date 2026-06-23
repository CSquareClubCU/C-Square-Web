"""
Production settings.
Uses PostgreSQL, Azure Communication Services email, and strict security headers.
All values come from Azure App Service environment configuration — never hardcoded.
"""

import os
from .base import *

# ---------------------------------------------------------------------------
# Core
# ---------------------------------------------------------------------------

DEBUG = False

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')

# Prevent the Django secret key from being missing silently in prod
if not SECRET_KEY or 'insecure' in SECRET_KEY:
    raise ValueError('DJANGO_SECRET_KEY must be set to a secure value in production.')


# ---------------------------------------------------------------------------
# Database — Azure PostgreSQL Flexible Server
# ---------------------------------------------------------------------------

import dj_database_url  # noqa: E402 — installed via psycopg2-binary + dj-database-url

DATABASES = {
    'default': dj_database_url.config(
        env='DATABASE_URL',
        conn_max_age=600,
        ssl_require=True,
    )
}


# ---------------------------------------------------------------------------
# Email — Django SMTP backend with Gmail
# EMAIL_HOST, EMAIL_PORT, EMAIL_USE_TLS are inherited from base.py.
# Only the backend and credentials need to be explicitly set here.
# ---------------------------------------------------------------------------

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'


# ---------------------------------------------------------------------------
# CORS — lock down to the production frontend domain only
# ---------------------------------------------------------------------------

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = os.environ.get('CORS_ALLOWED_ORIGINS', '').split(',')
CORS_ALLOW_CREDENTIALS = True


# ---------------------------------------------------------------------------
# Security headers — required for production deployment
# ---------------------------------------------------------------------------

SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000          # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'


# ---------------------------------------------------------------------------
# Static files — collected to staticfiles/ and served by Azure App Service
# ---------------------------------------------------------------------------

STATIC_ROOT = BASE_DIR / 'staticfiles'


# ---------------------------------------------------------------------------
# DRF — browsable API disabled in production (JSON only)
# ---------------------------------------------------------------------------

REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
}
