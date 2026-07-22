import os
import sys

# Add backend directory to sys.path
backend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

from django.core.wsgi import get_wsgi_application
from django.core.management import call_command

# Auto-migrate SQLite on Vercel serverless initialization
try:
    call_command('migrate', interactive=False)
except Exception as e:
    print(f"Migration note: {e}")

app = get_wsgi_application()
