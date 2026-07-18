from django.contrib.auth.models import AbstractUser
from django.db import models

class Staff(AbstractUser):
    class RoleChoices(models.TextChoices):
        OWNER = "owner", "Owner"
        MANAGER = "manager", "Manager"
        CHEF = "chef", "Chef"   
        WAITER = "waiter", "Waiter" 
        CASHIER = "cashier", "Cashier"  
    
    role = models.CharField(max_length=10, choices=RoleChoices.choices)
    phone_number = models.CharField(max_length=10, blank=True)
    hire_date = models.DateField(null=True, blank=True)
    must_change_password = models.BooleanField(default=True)


    



