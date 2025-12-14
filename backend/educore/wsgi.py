"""
WSGI config for EduCore project.
"""
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'educore.settings')

application = get_wsgi_application()




