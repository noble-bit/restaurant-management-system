from collections import defaultdict
from decimal import Decimal
from django.db import transaction

from inventory.exceptions import InsufficientStockError
from inventory.services import deduct_stock_bulk, reverse_order_deduction
from menu.models import MenuItem

from .exceptions import (
    InvalidStatusTransition,
    MenuItemNotActive,
    MenuItemOutOfStock,
    OrderPermissionDenied,
)
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


def _rebuild_order_ingredient_needs(order):
    """
    Rebuilds aggregate ingredient requirements for an existing Order instance.
    Walks all OrderItems and their corresponding MenuItem ingredients to produce
    {ingredient_id: total_quantity}, matching the payload structure passed to deduct_stock_bulk.
    """
    ingredient_quantities = defaultdict(Decimal)
    for item in order.items.all():
        ordered_qty = Decimal(item.quantity)
        for recipe_item in item.menu_item.ingredients.all():
            ingredient_quantities[recipe_item.ingredient_id] += recipe_item.quantity_required * ordered_qty
    return dict(ingredient_quantities)


# The state machine transition rules are separated into two distinct dictionaries:
# 1. ALLOWED_TRANSITIONS defines structural workflow validity (which state progression is logically allowed).
# 2. TRANSITION_ROLES defines role-based authorization matrix (which staff roles are allowed to trigger a valid transition).
# Keeping structural validity separate from role authorization avoids overloading a single structure and allows
# role permission overrides (e.g. manager/owner overrides) without corrupting the state graph logic.

ALLOWED_TRANSITIONS = {
    Order.StatusChoices.PENDING:   [Order.StatusChoices.PREPARING, Order.StatusChoices.CANCELLED],
    Order.StatusChoices.PREPARING: [Order.StatusChoices.READY, Order.StatusChoices.CANCELLED],
    Order.StatusChoices.READY:     [Order.StatusChoices.SERVED],
    Order.StatusChoices.SERVED:    [Order.StatusChoices.PAID],
    Order.StatusChoices.PAID:      [],
    Order.StatusChoices.CANCELLED: [],
}

TRANSITION_ROLES = {
    (Order.StatusChoices.PENDING, Order.StatusChoices.PREPARING): {"chef"},
    (Order.StatusChoices.PREPARING, Order.StatusChoices.READY): {"chef"},
    (Order.StatusChoices.READY, Order.StatusChoices.SERVED): {"waiter"},
    (Order.StatusChoices.SERVED, Order.StatusChoices.PAID): {"cashier"},
    (Order.StatusChoices.PENDING, Order.StatusChoices.CANCELLED): {"waiter", "manager", "owner"},
    (Order.StatusChoices.PREPARING, Order.StatusChoices.CANCELLED): {"manager", "owner"},
}


@transaction.atomic
def update_order_status(order, new_status, staff):
    """
    Updates the status of an existing order following ALLOWED_TRANSITIONS workflow and
    TRANSITION_ROLES authorization checks. If the order is cancelled, ingredient stock is reversed.
    """
    current = order.status

    if new_status not in ALLOWED_TRANSITIONS.get(current, []):
        raise InvalidStatusTransition(
            f"Cannot move order from {current} to {new_status}."
        )

    allowed_roles = TRANSITION_ROLES.get((current, new_status), set())
    if staff.role not in allowed_roles and staff.role not in ("owner", "manager"):
        raise OrderPermissionDenied(
            f"Role '{staff.role}' cannot perform this transition."
        )

    if new_status == Order.StatusChoices.CANCELLED:
        ingredient_quantities = _rebuild_order_ingredient_needs(order)
        if ingredient_quantities:
            reverse_order_deduction(ingredient_quantities, staff=staff)

    order.status = new_status
    order.save(update_fields=["status", "updated_at"])
    return order
