#!/bin/sh
set -e

python manage.py migrate
python manage.py create_owner || true
exec gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
