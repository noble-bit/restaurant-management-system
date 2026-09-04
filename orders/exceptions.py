class MenuItemNotActive(Exception):
    """Raised when a requested menu item is not active or does not exist."""
    pass


class MenuItemOutOfStock(Exception):
    """Raised when there is insufficient stock for menu item ingredients."""
    pass


class InvalidStatusTransition(Exception):
    """Raised when an order status transition is invalid in the workflow."""
    pass


class OrderPermissionDenied(Exception):
    """Raised when a staff user does not have permission to transition an order status."""
    pass
