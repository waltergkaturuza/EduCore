"""
Serializers for Fees app.
"""
from rest_framework import serializers
from .models import FeeStructure, FeeInvoice, Payment, PaymentPlan


class FeeStructureSerializer(serializers.ModelSerializer):
    """Serializer for FeeStructure."""
    
    total_amount = serializers.ReadOnlyField()
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    
    class Meta:
        model = FeeStructure
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class FeeInvoiceSerializer(serializers.ModelSerializer):
    """Serializer for FeeInvoice."""
    
    student_name = serializers.CharField(source='student.user.full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    term_name = serializers.CharField(source='term.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    
    class Meta:
        model = FeeInvoice
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'balance', 'status')


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment."""
    
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    student_name = serializers.CharField(source='invoice.student.user.full_name', read_only=True)
    received_by_name = serializers.CharField(source='received_by.full_name', read_only=True)
    
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class PaymentPlanSerializer(serializers.ModelSerializer):
    """Serializer for PaymentPlan."""
    
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    
    class Meta:
        model = PaymentPlan
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')



