from collections import defaultdict
from decimal import Decimal
from django.db import transaction

from inventory.exceptions import InsufficientStockError
from inventory.services import deduct_stock_bulk
from menu.models import MenuItem

from .exceptions import MenuItemNotActive, MenuItemOutOfStock
from .models import Order, OrderItem


@transaction.atomic
def place_order(staff, validated_data):
    """
    Business logic for placing a customer order.
    
    1. Validates menu item existence and activity.
    2. Calculates aggregate ingredient requirements across all ordered items.
    3. Calls deduct_stock_bulk to adjust inventory (raises MenuItemOutOfStock on insufficient stock).
    4. Creates the Order record.
    5. Creates OrderItem records snapshotting menu_item.price at order time.
    """
    items_data = validated_data["items"]
    
    # Map and validate menu items
    menu_items_by_id = {}
    for item_data in items_data:
        menu_item_id = item_data["menu_item_id"]
        try:
            menu_item = MenuItem.objects.get(id=menu_item_id)
        except MenuItem.DoesNotExist:
            raise MenuItemNotActive(f"Menu item with ID {menu_item_id} does not exist.")

        if not menu_item.is_available:
            raise MenuItemNotActive(f"Menu item '{menu_item.name}' is not currently available.")

        menu_items_by_id[menu_item_id] = menu_item

    # Aggregate required ingredient quantities across all order items
    ingredient_quantities = defaultdict(Decimal)
    for item_data in items_data:
        menu_item = menu_items_by_id[item_data["menu_item_id"]]
        ordered_qty = Decimal(item_data["quantity"])

        for recipe_item in menu_item.ingredients.all():
            ingredient_quantities[recipe_item.ingredient_id] += recipe_item.quantity_required * ordered_qty

    # Deduct stock via inventory service layer
    if ingredient_quantities:
        try:
            deduct_stock_bulk(dict(ingredient_quantities), staff=staff)
        except InsufficientStockError as exc:
            raise MenuItemOutOfStock(str(exc)) from exc

    # Create primary Order instance
    order = Order.objects.create(
        staff=staff,
        order_type=validated_data.get("order_type", Order.OrderType.DINE_IN),
        table_number=validated_data.get("table_number", ""),
    )

    # Create associated OrderItem line items snapshotting current menu price
    order_items = []
    for item_data in items_data:
        menu_item = menu_items_by_id[item_data["menu_item_id"]]
        order_items.append(
            OrderItem(
                order=order,
                menu_item=menu_item,
                quantity=item_data["quantity"],
                price_at_order=menu_item.price,
                note=item_data.get("note", ""),
            )
        )

    OrderItem.objects.bulk_create(order_items)

    return order
