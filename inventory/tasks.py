from celery import shared_task  # type: ignore[import]
from django.conf import settings
from django.core.mail import send_mail
from django.db.models import F
from .models import Ingredient


@shared_task(bind=True)
def check_low_stock(self):
    low_stock_items = list(
        Ingredient.objects.filter(
            quantity_on_hand__lt=F("reorder_threshold"),
            is_active=True,
            is_low_stock_alerted=False,
        )
    )

    if not low_stock_items:
        return "No new low-stock ingredients."

    lines = [
        f"- {i.name}: {i.quantity_on_hand}{i.unit_of_measure} "
        f"(threshold: {i.reorder_threshold}{i.unit_of_measure})"
        for i in low_stock_items
    ]

    message = "The following ingredients have dropped below their reorder threshold:\n\n" + "\n".join(lines)


    send_mail(
        subject="Low Stock Alert",
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=settings.STOCK_ALERT_RECIPIENTS,
        fail_silently=False,
    )

    Ingredient.objects.filter(id__in=[i.id for i in low_stock_items]).update(is_low_stock_alerted=True)

    return f"Alerted on {len(low_stock_items)} ingredient(s)."





