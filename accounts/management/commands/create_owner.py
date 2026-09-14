import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import models


class Command(BaseCommand):
    help = "Creates an initial superuser with role='owner' non-interactively if one does not exist."

    def handle(self, *args, **options):
        username = os.environ.get("DJANGO_SUPERUSER_USERNAME")
        email = os.environ.get("DJANGO_SUPERUSER_EMAIL")
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD")

        if not username or not email or not password:
            self.stdout.write(
                self.style.WARNING(
                    "Missing one or more required environment variables "
                    "(DJANGO_SUPERUSER_USERNAME, DJANGO_SUPERUSER_EMAIL, DJANGO_SUPERUSER_PASSWORD). "
                    "Skipping owner creation."
                )
            )
            return

        User = get_user_model()

        if User.objects.filter(models.Q(email=email) | models.Q(username=username)).exists():
            self.stdout.write(
                self.style.SUCCESS(
                    f"Superuser/Owner with username '{username}' or email '{email}' already exists. Skipping creation."
                )
            )
            return

        User.objects.create_superuser(
            username=username,
            email=email,
            password=password,
            role="owner"
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully created superuser '{username}' ({email}) with role 'owner'."
            )
        )
