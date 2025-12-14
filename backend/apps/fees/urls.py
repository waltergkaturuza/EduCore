"""
URLs for Fees app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FeeStructureViewSet, FeeInvoiceViewSet,
    PaymentViewSet, PaymentPlanViewSet
)

router = DefaultRouter()
router.register(r'structures', FeeStructureViewSet, basename='fee-structure')
router.register(r'invoices', FeeInvoiceViewSet, basename='fee-invoice')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'payment-plans', PaymentPlanViewSet, basename='payment-plan')

urlpatterns = [
    path('', include(router.urls)),
]




