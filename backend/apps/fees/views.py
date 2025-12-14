"""
Views for Fees app.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Q
from .models import FeeStructure, FeeInvoice, Payment, PaymentPlan
from .serializers import (
    FeeStructureSerializer, FeeInvoiceSerializer,
    PaymentSerializer, PaymentPlanSerializer
)


class FeeStructureViewSet(viewsets.ModelViewSet):
    """ViewSet for FeeStructure."""
    
    queryset = FeeStructure.objects.filter(is_deleted=False, is_active=True)
    serializer_class = FeeStructureSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        if user.tenant:
            return self.queryset.filter(tenant=user.tenant)
        return self.queryset.none()


class FeeInvoiceViewSet(viewsets.ModelViewSet):
    """ViewSet for FeeInvoice."""
    
    queryset = FeeInvoice.objects.filter(is_deleted=False)
    serializer_class = FeeInvoiceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        queryset = self.queryset
        
        if user.tenant:
            queryset = queryset.filter(tenant=user.tenant)
        
        # Parents see only their children's invoices
        if user.role == 'parent' and hasattr(user, 'guardian_profile'):
            from apps.students.models import StudentGuardian
            student_ids = StudentGuardian.objects.filter(
                guardian=user.guardian_profile
            ).values_list('student_id', flat=True)
            queryset = queryset.filter(student_id__in=student_ids)
        
        # Students see only their invoices
        elif user.role == 'student' and hasattr(user, 'student_profile'):
            queryset = queryset.filter(student=user.student_profile)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset
    
    @action(detail=True, methods=['get'])
    def payments(self, request, pk=None):
        """Get payments for an invoice."""
        invoice = self.get_object()
        payments = invoice.payments.filter(is_deleted=False)
        serializer = PaymentSerializer(payments, many=True)
        return Response(serializer.data)


class PaymentViewSet(viewsets.ModelViewSet):
    """ViewSet for Payment."""
    
    queryset = Payment.objects.filter(is_deleted=False)
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        queryset = self.queryset
        
        if user.tenant:
            queryset = queryset.filter(tenant=user.tenant)
        
        # Filter by invoice
        invoice_id = self.request.query_params.get('invoice')
        if invoice_id:
            queryset = queryset.filter(invoice_id=invoice_id)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get payment summary statistics."""
        user = request.user
        if not user.tenant:
            return Response({'error': 'No tenant associated'}, status=status.HTTP_400_BAD_REQUEST)
        
        queryset = self.queryset.filter(tenant=user.tenant, status='completed')
        
        total_collected = queryset.aggregate(total=Sum('amount'))['total'] or 0
        today_collected = queryset.filter(payment_date=request.query_params.get('date', None)).aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        return Response({
            'total_collected': total_collected,
            'today_collected': today_collected,
            'total_payments': queryset.count()
        })


class PaymentPlanViewSet(viewsets.ModelViewSet):
    """ViewSet for PaymentPlan."""
    
    queryset = PaymentPlan.objects.filter(is_deleted=False)
    serializer_class = PaymentPlanSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by tenant via invoice."""
        user = self.request.user
        if user.tenant:
            return self.queryset.filter(invoice__tenant=user.tenant)
        return self.queryset.none()




