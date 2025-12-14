"""
Views for School Admin app - Comprehensive ViewSets with advanced features.
"""
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Sum, Max
from django.utils import timezone
from datetime import timedelta

from apps.core.permissions import IsTenantAdmin
from .models import (
    SchoolProfile, AcademicConfiguration, AdmissionApplication,
    StudentDocument, StudentLifecycleEvent, TimetableVersion,
    AttendanceAlert, AttendanceOfflineSync, ExamCycle, GradeModeration, PostLockGradeChange,
    FeeStructureEnhanced, PaymentReconciliation, StaffRecord, StaffAppraisal, LeaveRequest,
    DashboardMetrics, CommunicationChannel, MessageTemplate, CommunicationCampaign,
    CommunicationLog, EventInvitation, RSVPResponse, ReportTemplate, GeneratedReport,
    AnalyticsQuery, MinistryExportFormat, MinistryExport
)
from .serializers import (
    SchoolProfileSerializer, AcademicConfigurationSerializer, AdmissionApplicationSerializer,
    StudentDocumentSerializer, StudentLifecycleEventSerializer, TimetableVersionSerializer,
    AttendanceAlertSerializer, ExamCycleSerializer, GradeModerationSerializer,
    FeeStructureEnhancedSerializer, PaymentReconciliationSerializer, StaffRecordSerializer,
    StaffAppraisalSerializer, LeaveRequestSerializer, DashboardMetricsSerializer,
    CommunicationChannelSerializer, MessageTemplateSerializer, CommunicationCampaignSerializer,
    CommunicationLogSerializer, EventInvitationSerializer, RSVPResponseSerializer,
    ReportTemplateSerializer, GeneratedReportSerializer, AnalyticsQuerySerializer,
    MinistryExportFormatSerializer, MinistryExportSerializer
)
from .business_logic import DashboardMetricsCalculator


# ============================================================================
# 1. EXECUTIVE DASHBOARD
# ============================================================================

class DashboardMetricsViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Dashboard Metrics."""
    
    queryset = DashboardMetrics.objects.all()
    serializer_class = DashboardMetricsSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering_fields = ['calculated_at']
    ordering = ['-calculated_at']
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        return self.queryset.filter(tenant=user.tenant)
    
    @action(detail=False, methods=['post'])
    def calculate(self, request):
        """Calculate and update dashboard metrics."""
        user = request.user
        tenant = user.tenant
        
        if not tenant:
            return Response({'error': 'User has no tenant'}, status=status.HTTP_400_BAD_REQUEST)
        
        metrics = DashboardMetricsCalculator.calculate_all_metrics(tenant)
        
        if metrics:
            serializer = self.get_serializer(metrics)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Failed to calculate metrics'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def latest(self, request):
        """Get latest metrics."""
        user = request.user
        tenant = user.tenant
        
        if not tenant:
            return Response({'error': 'User has no tenant'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get the most recent metrics, ordered by calculated_at
        metrics = DashboardMetrics.objects.filter(tenant=tenant).order_by('-calculated_at').first()
        
        if not metrics:
            # Calculate if not exists
            try:
                metrics = DashboardMetricsCalculator.calculate_all_metrics(tenant)
            except Exception as e:
                return Response({
                    'error': 'Failed to calculate metrics',
                    'detail': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        if metrics:
            serializer = self.get_serializer(metrics)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'No metrics available'}, status=status.HTTP_404_NOT_FOUND)


# ============================================================================
# 2. SCHOOL PROFILE & GOVERNANCE
# ============================================================================

class SchoolProfileViewSet(viewsets.ModelViewSet):
    """ViewSet for School Profile."""
    
    queryset = SchoolProfile.objects.all()
    serializer_class = SchoolProfileSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        return self.queryset.filter(tenant=user.tenant)
    
    def perform_create(self, serializer):
        """Set tenant on create."""
        serializer.save(tenant=self.request.user.tenant)


class AcademicConfigurationViewSet(viewsets.ModelViewSet):
    """ViewSet for Academic Configuration."""
    
    queryset = AcademicConfiguration.objects.all()
    serializer_class = AcademicConfigurationSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        return self.queryset.filter(tenant=user.tenant)
    
    def perform_create(self, serializer):
        """Set tenant on create."""
        serializer.save(tenant=self.request.user.tenant)


# ============================================================================
# 3. ADMISSIONS PIPELINE
# ============================================================================

class AdmissionApplicationViewSet(viewsets.ModelViewSet):
    """ViewSet for Admission Applications."""
    
    queryset = AdmissionApplication.objects.all()
    serializer_class = AdmissionApplicationSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['stage', 'academic_year', 'applied_class']
    search_fields = ['first_name', 'last_name', 'application_number', 'email', 'phone']
    ordering_fields = ['application_date', 'created_at']
    ordering = ['-application_date']
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        return self.queryset.filter(tenant=user.tenant)
    
    def perform_create(self, serializer):
        """Set tenant and generate application number."""
        tenant = self.request.user.tenant
        serializer.save(tenant=tenant)
        
        # Generate application number if not provided
        instance = serializer.instance
        if not instance.application_number:
            year = timezone.now().year
            count = AdmissionApplication.objects.filter(tenant=tenant, application_date__year=year).count()
            instance.application_number = f"APP-{year}-{count+1:04d}"
            instance.save()
    
    @action(detail=True, methods=['post'])
    def move_stage(self, request, pk=None):
        """Move application to next stage."""
        application = self.get_object()
        new_stage = request.data.get('stage')
        
        if new_stage not in dict(AdmissionApplication._meta.get_field('stage').choices):
            return Response({'error': 'Invalid stage'}, status=status.HTTP_400_BAD_REQUEST)
        
        application.stage = new_stage
        application.save()
        
        serializer = self.get_serializer(application)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def send_acceptance_letter(self, request, pk=None):
        """Send acceptance letter."""
        application = self.get_object()
        
        # TODO: Implement email/SMS sending
        application.acceptance_letter_sent = True
        application.acceptance_letter_sent_at = timezone.now()
        application.save()
        
        serializer = self.get_serializer(application)
        return Response(serializer.data)


# ============================================================================
# 4. STUDENT RECORDS
# ============================================================================

class StudentDocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for Student Documents."""
    
    queryset = StudentDocument.objects.all()
    serializer_class = StudentDocumentSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['document_type', 'is_verified']
    search_fields = ['title', 'student__user__first_name', 'student__user__last_name']
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        return self.queryset.filter(student__tenant=user.tenant)
    
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Verify a document."""
        document = self.get_object()
        document.is_verified = True
        document.verified_by = request.user
        document.verified_at = timezone.now()
        document.save()
        
        serializer = self.get_serializer(document)
        return Response(serializer.data)


class StudentLifecycleEventViewSet(viewsets.ModelViewSet):
    """ViewSet for Student Lifecycle Events."""
    
    queryset = StudentLifecycleEvent.objects.all()
    serializer_class = StudentLifecycleEventSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['event_type']
    ordering_fields = ['event_date']
    ordering = ['-event_date']
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        return self.queryset.filter(student__tenant=user.tenant)
    
    def perform_create(self, serializer):
        """Set performed_by on create."""
        serializer.save(performed_by=self.request.user)


# ============================================================================
# 5. TIMETABLE ENGINE
# ============================================================================

class TimetableVersionViewSet(viewsets.ModelViewSet):
    """ViewSet for Timetable Versions."""
    
    queryset = TimetableVersion.objects.all()
    serializer_class = TimetableVersionSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['academic_year', 'is_active', 'is_published', 'generation_method']
    search_fields = ['name']
    ordering_fields = ['version_number', 'created_at']
    ordering = ['-version_number']
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        return self.queryset.filter(tenant=user.tenant)
    
    def perform_create(self, serializer):
        """Set tenant and generated_by."""
        tenant = self.request.user.tenant
        max_version = TimetableVersion.objects.filter(
            tenant=tenant,
            academic_year=serializer.validated_data['academic_year']
        ).aggregate(max_v=Max('version_number'))['max_v'] or 0
        
        serializer.save(
            tenant=tenant,
            generated_by=self.request.user,
            version_number=max_version + 1
        )
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish a timetable version."""
        version = self.get_object()
        
        # Unpublish other versions
        TimetableVersion.objects.filter(
            tenant=version.tenant,
            academic_year=version.academic_year,
            is_published=True
        ).update(is_published=False)
        
        version.is_published = True
        version.published_at = timezone.now()
        version.save()
        
        serializer = self.get_serializer(version)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a timetable version."""
        version = self.get_object()
        
        # Deactivate other versions
        TimetableVersion.objects.filter(
            tenant=version.tenant,
            academic_year=version.academic_year,
            is_active=True
        ).update(is_active=False)
        
        version.is_active = True
        version.save()
        
        serializer = self.get_serializer(version)
        return Response(serializer.data)


# ============================================================================
# 6. ATTENDANCE INTELLIGENCE
# ============================================================================

class AttendanceAlertViewSet(viewsets.ModelViewSet):
    """ViewSet for Attendance Alerts."""
    
    queryset = AttendanceAlert.objects.all()
    serializer_class = AttendanceAlertSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['alert_type', 'severity', 'is_sent']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        return self.queryset.filter(student__tenant=user.tenant)
    
    @action(detail=True, methods=['post'])
    def send_alert(self, request, pk=None):
        """Send an attendance alert."""
        alert = self.get_object()
        
        # TODO: Implement SMS/Email sending
        alert.is_sent = True
        alert.sent_at = timezone.now()
        alert.sent_to = ['parent', 'admin']  # Simplified
        alert.save()
        
        serializer = self.get_serializer(alert)
        return Response(serializer.data)


# ============================================================================
# 7. EXAM LIFECYCLE
# ============================================================================

class ExamCycleViewSet(viewsets.ModelViewSet):
    """ViewSet for Exam Cycles."""
    
    queryset = ExamCycle.objects.all()
    serializer_class = ExamCycleSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['academic_year', 'term', 'exam_type', 'status', 'is_locked']
    search_fields = ['name']
    ordering_fields = ['start_date', 'created_at']
    ordering = ['-start_date']
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        return self.queryset.filter(tenant=user.tenant)
    
    def perform_create(self, serializer):
        """Set tenant on create."""
        serializer.save(tenant=self.request.user.tenant)
    
    @action(detail=True, methods=['post'])
    def lock(self, request, pk=None):
        """Lock an exam cycle."""
        exam_cycle = self.get_object()
        
        exam_cycle.is_locked = True
        exam_cycle.locked_by = request.user
        exam_cycle.locked_at = timezone.now()
        exam_cycle.status = 'locked'
        exam_cycle.save()
        
        serializer = self.get_serializer(exam_cycle)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def unlock(self, request, pk=None):
        """Unlock an exam cycle."""
        exam_cycle = self.get_object()
        
        exam_cycle.is_locked = False
        exam_cycle.locked_by = None
        exam_cycle.locked_at = None
        exam_cycle.save()
        
        serializer = self.get_serializer(exam_cycle)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def approve_moderation(self, request, pk=None):
        """Approve moderation for an exam cycle."""
        exam_cycle = self.get_object()
        
        exam_cycle.moderation_status = 'approved'
        exam_cycle.moderated_by = request.user
        exam_cycle.moderated_at = timezone.now()
        exam_cycle.save()
        
        serializer = self.get_serializer(exam_cycle)
        return Response(serializer.data)


class GradeModerationViewSet(viewsets.ModelViewSet):
    """ViewSet for Grade Moderation."""
    
    queryset = GradeModeration.objects.all()
    serializer_class = GradeModerationSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['stage', 'is_approved', 'exam_cycle']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        return self.queryset.filter(grade__assessment__tenant=user.tenant)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a grade moderation."""
        moderation = self.get_object()
        
        moderation.is_approved = True
        moderation.approved_by = request.user
        moderation.approved_at = timezone.now()
        
        # Update the grade if moderated score is different
        if moderation.moderated_score and moderation.moderated_score != moderation.original_score:
            moderation.grade.score = moderation.moderated_score
            moderation.grade.save()
        
        moderation.save()
        
        serializer = self.get_serializer(moderation)
        return Response(serializer.data)


# ============================================================================
# 8. FINANCE & FEES
# ============================================================================

class FeeStructureEnhancedViewSet(viewsets.ModelViewSet):
    """ViewSet for Enhanced Fee Structures."""
    
    queryset = FeeStructureEnhanced.objects.all()
    serializer_class = FeeStructureEnhancedSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['academic_year', 'is_active', 'currency']
    search_fields = ['name']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        return self.queryset.filter(tenant=user.tenant)
    
    def perform_create(self, serializer):
        """Set tenant on create."""
        serializer.save(tenant=self.request.user.tenant)


class PaymentReconciliationViewSet(viewsets.ModelViewSet):
    """ViewSet for Payment Reconciliation."""
    
    queryset = PaymentReconciliation.objects.all()
    serializer_class = PaymentReconciliationSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['status']
    ordering_fields = ['reconciliation_date']
    ordering = ['-reconciliation_date']
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        return self.queryset.filter(tenant=user.tenant)
    
    def perform_create(self, serializer):
        """Set tenant and calculate reconciliation."""
        tenant = self.request.user.tenant
        reconciliation_date = serializer.validated_data.get('reconciliation_date', timezone.now().date())
        
        # Calculate expected and received amounts
        from apps.fees.models import FeeInvoice, Payment
        
        expected = FeeInvoice.objects.filter(
            tenant=tenant,
            due_date__lte=reconciliation_date
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        received = Payment.objects.filter(
            tenant=tenant,
            payment_date__lte=reconciliation_date,
            status='completed'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        difference = expected - received
        
        # Breakdown by payment method
        breakdown = Payment.objects.filter(
            tenant=tenant,
            payment_date__lte=reconciliation_date,
            status='completed'
        ).values('payment_method').annotate(total=Sum('amount'))
        breakdown = {item['payment_method']: float(item['total']) for item in breakdown}
        
        status_value = 'reconciled' if abs(difference) < 1 else 'discrepancy'
        
        serializer.save(
            tenant=tenant,
            expected_amount=expected,
            received_amount=received,
            difference=difference,
            breakdown=breakdown,
            status=status_value,
            reconciled_by=self.request.user
        )


# ============================================================================
# 9. STAFF & HCM
# ============================================================================

class StaffRecordViewSet(viewsets.ModelViewSet):
    """ViewSet for Staff Records."""
    
    queryset = StaffRecord.objects.all()
    serializer_class = StaffRecordSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['employment_type', 'department']
    search_fields = ['user__first_name', 'user__last_name', 'employee_number']
    ordering_fields = ['hire_date', 'created_at']
    ordering = ['-hire_date']
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        return self.queryset.filter(tenant=user.tenant)
    
    def perform_create(self, serializer):
        """Set tenant and generate employee number."""
        tenant = self.request.user.tenant
        instance = serializer.save(tenant=tenant)
        
        # Generate employee number if not provided
        if not instance.employee_number:
            year = timezone.now().year
            count = StaffRecord.objects.filter(tenant=tenant, hire_date__year=year).count()
            instance.employee_number = f"EMP-{year}-{count+1:04d}"
            instance.save()


class StaffAppraisalViewSet(viewsets.ModelViewSet):
    """ViewSet for Staff Appraisals."""
    
    queryset = StaffAppraisal.objects.all()
    serializer_class = StaffAppraisalSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['appraisal_period']
    ordering_fields = ['appraisal_date']
    ordering = ['-appraisal_date']
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        return self.queryset.filter(staff__tenant=user.tenant)
    
    def perform_create(self, serializer):
        """Set appraised_by and calculate overall score."""
        instance = serializer.save(appraised_by=self.request.user)
        
        # Calculate overall score (weighted average)
        scores = [
            instance.attendance_score or 0,
            instance.lesson_completion_score or 0,
            instance.student_outcomes_score or 0,
            instance.parent_feedback_score or 0,
        ]
        valid_scores = [s for s in scores if s > 0]
        
        if valid_scores:
            instance.overall_score = sum(valid_scores) / len(valid_scores)
            instance.save()


class LeaveRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for Leave Requests."""
    
    queryset = LeaveRequest.objects.all()
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['leave_type', 'status']
    ordering_fields = ['start_date', 'created_at']
    ordering = ['-start_date']
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        return self.queryset.filter(staff__tenant=user.tenant)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a leave request."""
        leave_request = self.get_object()
        
        leave_request.status = 'approved'
        leave_request.approved_by = request.user
        leave_request.approved_at = timezone.now()
        leave_request.save()
        
        # Update leave balance
        if leave_request.leave_type == 'annual':
            leave_request.staff.annual_leave_balance -= leave_request.days_requested
        elif leave_request.leave_type == 'sick':
            leave_request.staff.sick_leave_balance -= leave_request.days_requested
        leave_request.staff.save()
        
        serializer = self.get_serializer(leave_request)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a leave request."""
        leave_request = self.get_object()
        rejection_reason = request.data.get('rejection_reason', '')
        
        leave_request.status = 'rejected'
        leave_request.approved_by = request.user
        leave_request.approved_at = timezone.now()
        leave_request.rejection_reason = rejection_reason
        leave_request.save()
        
        serializer = self.get_serializer(leave_request)
        return Response(serializer.data)

