"""WSGI config for csquare project."""

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'csquare.settings.local')

application = get_wsgi_application()
