from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from menu.models import MenuCategory, MenuItem
from inventory.models import Ingredient
from accounts.models import Staff
from django.core.files.uploadedfile import SimpleUploadedFile
from unittest.mock import patch
import json

class MenuItemUploadTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.owner = Staff.objects.create_user(
            username="owner",
            email="owner@test.com",
            password="password123",
            role="owner"
        )
        self.category = MenuCategory.objects.create(name="Main Course", display_order=1)
        self.ingredient = Ingredient.objects.create(
            name="Tomato",
            quantity_on_hand=100,
            unit_of_measure="kg",
            reorder_threshold=10,
            cost_per_unit=2.50
        )
        self.client.force_authenticate(user=self.owner)

    @patch("cloudinary.uploader.upload")
    def test_create_menu_item_multipart(self, mock_upload):
        mock_upload.return_value = {
            "public_id": "test_id",
            "version": "123",
            "url": "http://res.cloudinary.com/test/image/upload/v123/test.gif",
            "secure_url": "https://res.cloudinary.com/test/image/upload/v123/test.gif"
        }
        gif_bytes = b'GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;'
        image = SimpleUploadedFile("test.gif", gif_bytes, content_type="image/gif")
        payload = {
            "name": "Burger",
            "description": "Tasty burger",
            "price": "12.50",
            "category_id": self.category.id,
            "ingredients": json.dumps([
                {"ingredient_id": self.ingredient.id, "quantity_required": 2}
            ]),
            "avatar": image
        }
        response = self.client.post("/api/v1/menu/items/", payload, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    @patch("cloudinary.uploader.upload")
    def test_update_menu_item_multipart(self, mock_upload):
        mock_upload.return_value = {
            "public_id": "test_id",
            "version": "123",
            "url": "http://res.cloudinary.com/test/image/upload/v123/pizza.gif",
            "secure_url": "https://res.cloudinary.com/test/image/upload/v123/pizza.gif"
        }
        item = MenuItem.objects.create(
            name="Pizza",
            description="Cheese pizza",
            price="10.00",
            category=self.category
        )
        gif_bytes = b'GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;'
        image = SimpleUploadedFile("pizza.gif", gif_bytes, content_type="image/gif")
        payload = {
            "name": "Pizza Extra Cheese",
            "avatar": image
        }
        response = self.client.patch(f"/api/v1/menu/items/{item.id}/", payload, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Pizza Extra Cheese")
