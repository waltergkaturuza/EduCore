"""
Admin configuration for Fees app.
"""
from django.contrib import admin
from .models import FeeStructure, FeeInvoice, Payment, PaymentPlan


@admin.register(FeeStructure)
class FeeStructureAdmin(admin.ModelAdmin):
    list_display = ['name', 'tenant', 'academic_year', 'class_obj', 'total_amount', 'is_active']
    list_filter = ['tenant', 'academic_year', 'is_active']


@admin.register(FeeInvoice)
class FeeInvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'student', 'total_amount', 'paid_amount', 'balance', 'status', 'due_date']
    list_filter = ['status', 'tenant', 'academic_year']
    search_fields = ['invoice_number', 'student__user__email', 'student__student_id']
    readonly_fields = ['balance', 'status']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['payment_number', 'invoice', 'amount', 'payment_method', 'payment_date', 'status']
    list_filter = ['status', 'payment_method', 'tenant', 'payment_date']
    search_fields = ['payment_number', 'transaction_reference']


@admin.register(PaymentPlan)
class PaymentPlanAdmin(admin.ModelAdmin):
    list_display = ['invoice', 'number_of_installments', 'installment_amount', 'frequency', 'is_active']
    list_filter = ['frequency', 'is_active']




