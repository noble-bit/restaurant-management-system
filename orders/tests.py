from decimal import Decimal
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import Staff
from inventory.models import Ingredient, StockMovement
from menu.models import MenuCategory, MenuItem, MenuItemIngredient
from orders.exceptions import InvalidStatusTransition, OrderPermissionDenied
from orders.models import Order, OrderItem
from orders.services import place_order, update_order_status


class OrderLifecycleTestCase(TestCase):
    def setUp(self):
        # Create staff members for different roles
        self.owner = Staff.objects.create_user(
            username="owner_user", email="owner@test.com", password="password123", role="owner"
        )
        self.manager = Staff.objects.create_user(
            username="manager_user", email="manager@test.com", password="password123", role="manager"
        )
        self.waiter = Staff.objects.create_user(
            username="waiter_user", email="waiter@test.com", password="password123", role="waiter"
        )
        self.chef = Staff.objects.create_user(
            username="chef_user", email="chef@test.com", password="password123", role="chef"
        )
        self.cashier = Staff.objects.create_user(
            username="cashier_user", email="cashier@test.com", password="password123", role="cashier"
        )

        # Create ingredient and menu item
        self.ingredient = Ingredient.objects.create(
            name="Flour",
            quantity_on_hand=Decimal("100.00"),
            unit_of_measure=Ingredient.UnitOfMeasure.KILOGRAMS,
            reorder_threshold=Decimal("10.00"),
            cost_per_unit=Decimal("2.00"),
        )
        self.category = MenuCategory.objects.create(name="Main", display_order=1)
        self.menu_item = MenuItem.objects.create(
            category=self.category,
            name="Pizza",
            price=Decimal("15.00"),
            is_active=True,
        )
        MenuItemIngredient.objects.create(
            menu_item=self.menu_item,
            ingredient=self.ingredient,
            quantity_required=Decimal("2.00"),
        )

        self.client = APIClient()

    def test_place_order_and_transition_lifecycle(self):
        # Place order as waiter
        order = place_order(
            staff=self.waiter,
            validated_data={
                "order_type": "dine_in",
                "table_number": "T1",
                "items": [{"menu_item_id": self.menu_item.id, "quantity": 2, "note": ""}],
            },
        )
        # 2 pizza * 2kg = 4kg deducted
        self.ingredient.refresh_from_db()
        self.assertEqual(self.ingredient.quantity_on_hand, Decimal("96.00"))
        self.assertEqual(order.status, Order.StatusChoices.PENDING)

        # Chef moves PENDING -> PREPARING
        update_order_status(order, Order.StatusChoices.PREPARING, staff=self.chef)
        self.assertEqual(order.status, Order.StatusChoices.PREPARING)

        # Chef moves PREPARING -> READY
        update_order_status(order, Order.StatusChoices.READY, staff=self.chef)
        self.assertEqual(order.status, Order.StatusChoices.READY)

        # Waiter moves READY -> SERVED
        update_order_status(order, Order.StatusChoices.SERVED, staff=self.waiter)
        self.assertEqual(order.status, Order.StatusChoices.SERVED)

        # Cashier moves SERVED -> PAID
        update_order_status(order, Order.StatusChoices.PAID, staff=self.cashier)
        self.assertEqual(order.status, Order.StatusChoices.PAID)

    def test_invalid_status_transition_raises_exception(self):
        order = place_order(
            staff=self.waiter,
            validated_data={
                "order_type": "dine_in",
                "table_number": "T1",
                "items": [{"menu_item_id": self.menu_item.id, "quantity": 1}],
            },
        )
        # Cannot move PENDING directly to PAID
        with self.assertRaises(InvalidStatusTransition):
            update_order_status(order, Order.StatusChoices.PAID, staff=self.cashier)

    def test_unauthorized_role_transition_raises_exception(self):
        order = place_order(
            staff=self.waiter,
            validated_data={
                "order_type": "dine_in",
                "table_number": "T1",
                "items": [{"menu_item_id": self.menu_item.id, "quantity": 1}],
            },
        )
        # Waiter cannot move PENDING -> PREPARING (only chef/manager/owner)
        with self.assertRaises(OrderPermissionDenied):
            update_order_status(order, Order.StatusChoices.PREPARING, staff=self.waiter)

    def test_order_cancellation_reverses_stock(self):
        order = place_order(
            staff=self.waiter,
            validated_data={
                "order_type": "dine_in",
                "table_number": "T1",
                "items": [{"menu_item_id": self.menu_item.id, "quantity": 3}],
            },
        )
        # Initial 100 - (3 * 2) = 94
        self.ingredient.refresh_from_db()
        self.assertEqual(self.ingredient.quantity_on_hand, Decimal("94.00"))

        # Waiter cancels PENDING order
        update_order_status(order, Order.StatusChoices.CANCELLED, staff=self.waiter)
        self.assertEqual(order.status, Order.StatusChoices.CANCELLED)

        # Stock is restored (+6) -> 100
        self.ingredient.refresh_from_db()
        self.assertEqual(self.ingredient.quantity_on_hand, Decimal("100.00"))

        # Verify StockMovement recorded ORDER_REVERSAL
        reversal_movement = StockMovement.objects.filter(
            ingredient=self.ingredient, reason=StockMovement.ReasonChoices.ORDER_REVERSAL
        ).first()
        self.assertIsNotNone(reversal_movement)
        self.assertEqual(reversal_movement.quantity_delta, Decimal("6.00"))

    def test_order_list_view_and_filtering(self):
        order1 = place_order(
            staff=self.waiter,
            validated_data={
                "order_type": "dine_in",
                "table_number": "T1",
                "items": [{"menu_item_id": self.menu_item.id, "quantity": 1}],
            },
        )
        order2 = place_order(
            staff=self.waiter,
            validated_data={
                "order_type": "takeout",
                "table_number": "",
                "items": [{"menu_item_id": self.menu_item.id, "quantity": 1}],
            },
        )
        update_order_status(order2, Order.StatusChoices.PREPARING, staff=self.chef)

        self.client.force_authenticate(user=self.chef)
        response = self.client.get("/api/v1/orders/?status=pending,preparing")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data
        self.assertEqual(len(results), 2)

    def test_update_status_api_endpoint(self):
        order = place_order(
            staff=self.waiter,
            validated_data={
                "order_type": "dine_in",
                "table_number": "T1",
                "items": [{"menu_item_id": self.menu_item.id, "quantity": 1}],
            },
        )

        self.client.force_authenticate(user=self.chef)
        response = self.client.patch(
            f"/api/v1/orders/{order.id}/status/",
            {"status": "preparing"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "preparing")

        # Invalid transition attempt via API returns 400
        response = self.client.patch(
            f"/api/v1/orders/{order.id}/status/",
            {"status": "paid"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Unauthorized transition attempt via API returns 403
        self.client.force_authenticate(user=self.waiter)
        response = self.client.patch(
            f"/api/v1/orders/{order.id}/status/",
            {"status": "ready"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
