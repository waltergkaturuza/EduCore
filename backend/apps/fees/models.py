"""
Fee models: Fee Structures, Invoices, Payments.
"""
from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
from apps.core.models import BaseModel


class FeeStructure(BaseModel):
    """Fee structure for a class or student."""
    
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='fee_structures')
    academic_year = models.ForeignKey('academics.AcademicYear', on_delete=models.CASCADE, related_name='fee_structures')
    name = models.CharField(max_length=200, help_text="e.g., Form 1 Fees 2024")
    
    # Applicable to
    class_obj = models.ForeignKey(
        'academics.Class',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='fee_structures',
        help_text="If null, applies to all classes"
    )
    
    # Fee Items
    tuition_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    development_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    library_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    sports_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    other_fees = models.JSONField(default=dict, help_text="Additional fees as key-value pairs")
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'fee_structures'
        ordering = ['-academic_year', 'name']
    
    def __str__(self):
        return f"{self.name} - {self.academic_year.name}"
    
    @property
    def total_amount(self):
        """Calculate total fee amount."""
        total = self.tuition_fee + self.development_fee + self.library_fee + self.sports_fee
        if self.other_fees:
            total += sum(Decimal(str(v)) for v in self.other_fees.values())
        return total


class FeeInvoice(BaseModel):
    """Fee invoice for a student."""
    
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='fee_invoices')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='fee_invoices')
    academic_year = models.ForeignKey('academics.AcademicYear', on_delete=models.CASCADE, related_name='fee_invoices')
    term = models.ForeignKey('academics.Term', on_delete=models.SET_NULL, null=True, blank=True, related_name='fee_invoices')
    fee_structure = models.ForeignKey(FeeStructure, on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    
    invoice_number = models.CharField(max_length=50, unique=True)
    issue_date = models.DateField()
    due_date = models.DateField()
    
    # Amounts
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('partial', 'Partially Paid'),
            ('paid', 'Paid'),
            ('overdue', 'Overdue'),
            ('cancelled', 'Cancelled'),
        ],
        default='pending'
    )
    
    # Concessions/Scholarships
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    discount_reason = models.TextField(blank=True)
    
    remarks = models.TextField(blank=True)
    
    class Meta:
        db_table = 'fee_invoices'
        ordering = ['-issue_date']
        indexes = [
            models.Index(fields=['student', 'status']),
            models.Index(fields=['tenant', 'status']),
        ]
    
    def __str__(self):
        return f"{self.invoice_number} - {self.student.user.full_name}"
    
    def save(self, *args, **kwargs):
        """Calculate balance on save."""
        self.balance = self.total_amount - self.paid_amount - self.discount_amount
        
        # Update status
        if self.balance <= 0:
            self.status = 'paid'
        elif self.paid_amount > 0:
            self.status = 'partial'
        elif self.due_date and self.due_date < models.functions.Now():
            self.status = 'overdue'
        else:
            self.status = 'pending'
        
        super().save(*args, **kwargs)


class Payment(BaseModel):
    """Payment record."""
    
    invoice = models.ForeignKey(FeeInvoice, on_delete=models.CASCADE, related_name='payments')
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='payments')
    
    payment_number = models.CharField(max_length=50, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    payment_date = models.DateField()
    payment_method = models.CharField(
        max_length=50,
        choices=[
            ('cash', 'Cash'),
            ('bank', 'Bank Transfer'),
            ('ecocash', 'EcoCash'),
            ('onemoney', 'OneMoney'),
            ('paynow', 'Paynow'),
            ('other', 'Other'),
        ],
        default='cash'
    )
    transaction_reference = models.CharField(max_length=100, blank=True, help_text="Transaction ID/Reference")
    
    # Payment Gateway Data
    gateway_response = models.JSONField(default=dict, null=True, blank=True)
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('completed', 'Completed'),
            ('failed', 'Failed'),
            ('refunded', 'Refunded'),
        ],
        default='pending'
    )
    
    received_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='received_payments',
        limit_choices_to={'role__in': ['admin', 'teacher']}
    )
    remarks = models.TextField(blank=True)
    
    class Meta:
        db_table = 'payments'
        ordering = ['-payment_date']
        indexes = [
            models.Index(fields=['invoice', 'status']),
            models.Index(fields=['tenant', 'payment_date']),
        ]
    
    def __str__(self):
        return f"{self.payment_number} - {self.amount}"
    
    def save(self, *args, **kwargs):
        """Update invoice paid amount on save."""
        super().save(*args, **kwargs)
        
        # Update invoice paid amount
        if self.status == 'completed':
            invoice = self.invoice
            invoice.paid_amount = invoice.payments.filter(status='completed').aggregate(
                total=models.Sum('amount')
            )['total'] or Decimal('0.00')
            invoice.save()


class PaymentPlan(BaseModel):
    """Payment plan for installment payments."""
    
    invoice = models.ForeignKey(FeeInvoice, on_delete=models.CASCADE, related_name='payment_plans')
    number_of_installments = models.IntegerField(validators=[MinValueValidator(2)])
    installment_amount = models.DecimalField(max_digits=10, decimal_places=2)
    start_date = models.DateField()
    frequency = models.CharField(
        max_length=20,
        choices=[
            ('weekly', 'Weekly'),
            ('monthly', 'Monthly'),
            ('quarterly', 'Quarterly'),
        ],
        default='monthly'
    )
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'payment_plans'
    
    def __str__(self):
        return f"Payment Plan - {self.invoice.invoice_number}"



