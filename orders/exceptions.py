class MenuItemNotActive(Exception):
    """Raised when a requested menu item is not active or does not exist."""
    pass


class MenuItemOutOfStock(Exception):
    """Raised when there is insufficient stock for menu item ingredients."""
    pass
