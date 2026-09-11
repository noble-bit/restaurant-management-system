from django.db import transaction
from django.db import transaction


from orders.services import update_order_status
from .models import Payment

@transaction.atomic
def process_payment(order, method, staff):

    update_order_status(order, "paid", staff=staff)

    payment = Payment.objects.create(
        order=order,
        amount=order.total_price,
        method=method,
        status=Payment.Status.COMPLETED,
        processed_by=staff
    )

    return payment

