from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import Staff

class StaffDeleteTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.owner = Staff.objects.create_user(
            username="owner",
            email="owner@test.com",
            password="password123",
            role="owner",
            first_name="Owner",
            last_name="User"
        )
        self.staff2 = Staff.objects.create_user(
            username="staff2",
            email="staff2@test.com",
            password="password123",
            role="waiter",
            first_name="Staff",
            last_name="Two"
        )

    def test_owner_cannot_delete_self(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.delete(f"/api/v1/staff/{self.owner.id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data.get('detail'), "You cannot delete your own account.")

    def test_owner_can_delete_other_staff(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.delete(f"/api/v1/staff/{self.staff2.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.staff2.refresh_from_db()
        self.assertFalse(self.staff2.is_active)
