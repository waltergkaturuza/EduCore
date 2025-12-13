"""
Serializers for School Admin app.
"""
from rest_framework import serializers
from .models import (
    SchoolProfile, AcademicConfiguration, AdmissionApplication,
    StudentDocument, StudentLifecycleEvent, TimetableVersion, TimetableSlotEnhanced,
    AttendanceAlert, AttendanceOfflineSync, ExamCycle, GradeModeration, PostLockGradeChange,
    FeeStructureEnhanced, PaymentReconciliation, StaffRecord, StaffAppraisal, LeaveRequest,
    DashboardMetrics, CommunicationChannel, MessageTemplate, CommunicationCampaign,
    CommunicationLog, EventInvitation, RSVPResponse, ReportTemplate, GeneratedReport,
    AnalyticsQuery, MinistryExportFormat, MinistryExport
)


class SchoolProfileSerializer(serializers.ModelSerializer):
    """Serializer for School Profile."""
    
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    
    class Meta:
        model = SchoolProfile
        fields = [
            'id', 'tenant', 'tenant_name', 'ministry_registration_number',
            'registration_certificate', 'accreditation_status', 'accreditation_expiry',
            'constitution', 'policies', 'logo', 'primary_color', 'secondary_color',
            'letterhead_template', 'principal_signature', 'bursar_signature',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')


class AcademicConfigurationSerializer(serializers.ModelSerializer):
    """Serializer for Academic Configuration."""
    
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    
    class Meta:
        model = AcademicConfiguration
        fields = [
            'id', 'tenant', 'tenant_name', 'curriculum_framework', 'grading_system',
            'grading_scale', 'promotion_rules', 'subject_weights', 'assessment_rubrics',
            'report_card_approval_required', 'approval_workflow', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')


class AdmissionApplicationSerializer(serializers.ModelSerializer):
    """Serializer for Admission Application."""
    
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    applied_class_name = serializers.CharField(source='applied_class.name', read_only=True, allow_null=True)
    
    class Meta:
        model = AdmissionApplication
        fields = [
            'id', 'tenant', 'tenant_name', 'academic_year', 'academic_year_name',
            'first_name', 'last_name', 'date_of_birth', 'gender', 'phone', 'email',
            'address', 'applied_class', 'applied_class_name', 'application_number',
            'application_date', 'stage', 'documents', 'interview_date', 'interview_notes',
            'interview_score', 'acceptance_letter_sent', 'acceptance_letter_sent_at',
            'enrollment_contract_signed', 'pre_invoice_created', 'pre_invoice',
            'notes', 'communication_log', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'application_number', 'created_at', 'updated_at')


class StudentDocumentSerializer(serializers.ModelSerializer):
    """Serializer for Student Document."""
    
    student_name = serializers.CharField(source='student.user.full_name', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = StudentDocument
        fields = [
            'id', 'student', 'student_name', 'document_type', 'title', 'file',
            'description', 'is_verified', 'verified_by', 'verified_by_name',
            'verified_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'verified_at', 'created_at', 'updated_at')


class StudentLifecycleEventSerializer(serializers.ModelSerializer):
    """Serializer for Student Lifecycle Event."""
    
    student_name = serializers.CharField(source='student.user.full_name', read_only=True)
    from_class_name = serializers.CharField(source='from_class.name', read_only=True, allow_null=True)
    to_class_name = serializers.CharField(source='to_class.name', read_only=True, allow_null=True)
    performed_by_name = serializers.CharField(source='performed_by.full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = StudentLifecycleEvent
        fields = [
            'id', 'student', 'student_name', 'event_type', 'event_date',
            'from_class', 'from_class_name', 'to_class', 'to_class_name',
            'reason', 'notes', 'performed_by', 'performed_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')


class TimetableVersionSerializer(serializers.ModelSerializer):
    """Serializer for Timetable Version."""
    
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    generated_by_name = serializers.CharField(source='generated_by.full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = TimetableVersion
        fields = [
            'id', 'tenant', 'tenant_name', 'academic_year', 'academic_year_name',
            'name', 'version_number', 'is_active', 'is_published', 'published_at',
            'generated_by', 'generated_by_name', 'generation_method', 'generation_metadata',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')


class AttendanceAlertSerializer(serializers.ModelSerializer):
    """Serializer for Attendance Alert."""
    
    student_name = serializers.CharField(source='student.user.full_name', read_only=True)
    
    class Meta:
        model = AttendanceAlert
        fields = [
            'id', 'student', 'student_name', 'alert_type', 'severity', 'message',
            'is_sent', 'sent_to', 'sent_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'sent_at', 'created_at', 'updated_at')


class ExamCycleSerializer(serializers.ModelSerializer):
    """Serializer for Exam Cycle."""
    
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    term_name = serializers.CharField(source='term.name', read_only=True)
    moderated_by_name = serializers.CharField(source='moderated_by.full_name', read_only=True, allow_null=True)
    locked_by_name = serializers.CharField(source='locked_by.full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = ExamCycle
        fields = [
            'id', 'tenant', 'tenant_name', 'academic_year', 'academic_year_name',
            'term', 'term_name', 'name', 'exam_type', 'status', 'start_date', 'end_date',
            'moderation_required', 'moderation_status', 'moderated_by', 'moderated_by_name',
            'moderated_at', 'is_locked', 'locked_by', 'locked_by_name', 'locked_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'moderated_at', 'locked_at', 'created_at', 'updated_at')


class GradeModerationSerializer(serializers.ModelSerializer):
    """Serializer for Grade Moderation."""
    
    student_name = serializers.CharField(source='grade.student.user.full_name', read_only=True)
    assessment_name = serializers.CharField(source='grade.assessment.name', read_only=True)
    moderated_by_name = serializers.CharField(source='moderated_by.full_name', read_only=True, allow_null=True)
    approved_by_name = serializers.CharField(source='approved_by.full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = GradeModeration
        fields = [
            'id', 'grade', 'exam_cycle', 'student_name', 'assessment_name',
            'stage', 'original_score', 'moderated_score', 'moderation_reason',
            'moderated_by', 'moderated_by_name', 'moderated_at', 'is_approved',
            'approved_by', 'approved_by_name', 'approved_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'moderated_at', 'approved_at', 'created_at', 'updated_at')


class FeeStructureEnhancedSerializer(serializers.ModelSerializer):
    """Serializer for Enhanced Fee Structure."""
    
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    
    class Meta:
        model = FeeStructureEnhanced
        fields = [
            'id', 'tenant', 'tenant_name', 'academic_year', 'academic_year_name',
            'name', 'base_amount', 'variable_pricing_rules', 'allow_installments',
            'installment_config', 'scholarship_rules', 'waiver_rules', 'currency',
            'exchange_rate', 'inflation_adjustment_enabled', 'inflation_rate',
            'late_payment_penalty', 'penalty_grace_period_days', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')


class PaymentReconciliationSerializer(serializers.ModelSerializer):
    """Serializer for Payment Reconciliation."""
    
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    reconciled_by_name = serializers.CharField(source='reconciled_by.full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = PaymentReconciliation
        fields = [
            'id', 'tenant', 'tenant_name', 'reconciliation_date', 'expected_amount',
            'received_amount', 'difference', 'breakdown', 'status', 'reconciled_by',
            'reconciled_by_name', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')


class StaffRecordSerializer(serializers.ModelSerializer):
    """Serializer for Staff Record."""
    
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    
    class Meta:
        model = StaffRecord
        fields = [
            'id', 'user', 'user_name', 'user_email', 'tenant', 'tenant_name',
            'employee_number', 'employment_type', 'hire_date', 'contract_start',
            'contract_end', 'contract_document', 'qualifications', 'certifications',
            'department', 'position', 'annual_leave_balance', 'sick_leave_balance',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')


class StaffAppraisalSerializer(serializers.ModelSerializer):
    """Serializer for Staff Appraisal."""
    
    staff_name = serializers.CharField(source='staff.user.full_name', read_only=True)
    appraised_by_name = serializers.CharField(source='appraised_by.full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = StaffAppraisal
        fields = [
            'id', 'staff', 'staff_name', 'appraisal_period', 'appraisal_date',
            'attendance_score', 'lesson_completion_score', 'student_outcomes_score',
            'parent_feedback_score', 'overall_score', 'supervisor_comments',
            'employee_comments', 'pd_goals', 'pd_completed', 'appraised_by',
            'appraised_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')


class LeaveRequestSerializer(serializers.ModelSerializer):
    """Serializer for Leave Request."""
    
    staff_name = serializers.CharField(source='staff.user.full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = LeaveRequest
        fields = [
            'id', 'staff', 'staff_name', 'leave_type', 'start_date', 'end_date',
            'days_requested', 'reason', 'status', 'approved_by', 'approved_by_name',
            'approved_at', 'rejection_reason', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'approved_at', 'created_at', 'updated_at')


class DashboardMetricsSerializer(serializers.ModelSerializer):
    """Serializer for Dashboard Metrics."""
    
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    
    class Meta:
        model = DashboardMetrics
        fields = [
            'id', 'tenant', 'tenant_name', 'calculated_at',
            'total_enrollment', 'enrollment_by_gender', 'enrollment_by_grade', 'enrollment_by_stream',
            'total_teachers', 'active_teachers', 'teacher_utilization_ratio', 'student_teacher_ratio',
            'attendance_today', 'attendance_percentage_today', 'chronic_absenteeism_count',
            'chronic_absenteeism_risk_index', 'academic_performance_index', 'average_grade',
            'fee_collection_today', 'fee_collection_term', 'fee_collection_year',
            'fee_collection_vs_target', 'outstanding_fees_30_days', 'outstanding_fees_60_days',
            'outstanding_fees_90_days', 'teachers_active_today', 'parents_active_today',
            'students_active_today', 'missing_marks_count', 'late_attendance_count',
            'compliance_alerts', 'dropout_risk_count', 'exam_failure_prediction',
            'teacher_overload_alerts', 'revenue_forecast', 'at_risk_students',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'calculated_at', 'created_at', 'updated_at')


class CommunicationChannelSerializer(serializers.ModelSerializer):
    """Serializer for Communication Channel."""
    
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    
    class Meta:
        model = CommunicationChannel
        fields = [
            'id', 'tenant', 'tenant_name', 'channel_type', 'is_enabled', 'provider',
            'api_key', 'api_secret', 'configuration', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')
        extra_kwargs = {
            'api_key': {'write_only': True},
            'api_secret': {'write_only': True},
        }


class MessageTemplateSerializer(serializers.ModelSerializer):
    """Serializer for Message Template."""
    
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    
    class Meta:
        model = MessageTemplate
        fields = [
            'id', 'tenant', 'tenant_name', 'name', 'template_type', 'subject', 'body',
            'variables', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')


class CommunicationCampaignSerializer(serializers.ModelSerializer):
    """Serializer for Communication Campaign."""
    
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True, allow_null=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = CommunicationCampaign
        fields = [
            'id', 'tenant', 'tenant_name', 'name', 'campaign_type', 'template', 'template_name',
            'target_audience', 'target_list', 'message_content', 'scheduled_at', 'status',
            'total_recipients', 'sent_count', 'delivered_count', 'failed_count', 'opened_count',
            'sent_at', 'completed_at', 'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'sent_count', 'delivered_count', 'failed_count', 'opened_count', 'sent_at', 'completed_at', 'created_at', 'updated_at')


class CommunicationLogSerializer(serializers.ModelSerializer):
    """Serializer for Communication Log."""
    
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    campaign_name = serializers.CharField(source='campaign.name', read_only=True, allow_null=True)
    
    class Meta:
        model = CommunicationLog
        fields = [
            'id', 'tenant', 'tenant_name', 'campaign', 'campaign_name', 'channel',
            'recipient_type', 'recipient_id', 'recipient_name', 'recipient_contact',
            'subject', 'message', 'status', 'provider_message_id', 'provider_response',
            'error_message', 'sent_at', 'delivered_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'sent_at', 'delivered_at', 'created_at', 'updated_at')


class EventInvitationSerializer(serializers.ModelSerializer):
    """Serializer for Event Invitation."""
    
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = EventInvitation
        fields = [
            'id', 'tenant', 'tenant_name', 'event_name', 'event_type', 'description',
            'event_date', 'location', 'target_audience', 'target_list', 'rsvp_required',
            'rsvp_deadline', 'total_invited', 'rsvp_yes', 'rsvp_no', 'rsvp_pending',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'total_invited', 'rsvp_yes', 'rsvp_no', 'rsvp_pending', 'created_at', 'updated_at')


class RSVPResponseSerializer(serializers.ModelSerializer):
    """Serializer for RSVP Response."""
    
    invitation_name = serializers.CharField(source='invitation.event_name', read_only=True)
    
    class Meta:
        model = RSVPResponse
        fields = [
            'id', 'invitation', 'invitation_name', 'respondent_type', 'respondent_id',
            'respondent_name', 'response', 'notes', 'responded_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'responded_at', 'created_at', 'updated_at')


class ReportTemplateSerializer(serializers.ModelSerializer):
    """Serializer for Report Template."""
    
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    
    class Meta:
        model = ReportTemplate
        fields = [
            'id', 'tenant', 'tenant_name', 'name', 'report_type', 'template_format',
            'template_file', 'query_config', 'fields_config', 'filters_config',
            'is_active', 'is_ministry_format', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')


class GeneratedReportSerializer(serializers.ModelSerializer):
    """Serializer for Generated Report."""
    
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True, allow_null=True)
    generated_by_name = serializers.CharField(source='generated_by.full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = GeneratedReport
        fields = [
            'id', 'tenant', 'tenant_name', 'template', 'template_name', 'report_name',
            'report_type', 'format', 'file', 'file_size', 'parameters', 'date_range_start',
            'date_range_end', 'status', 'record_count', 'generation_time_seconds',
            'generated_by', 'generated_by_name', 'generated_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'file_size', 'generation_time_seconds', 'generated_at', 'created_at', 'updated_at')


class AnalyticsQuerySerializer(serializers.ModelSerializer):
    """Serializer for Analytics Query."""
    
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = AnalyticsQuery
        fields = [
            'id', 'tenant', 'tenant_name', 'name', 'description', 'query_type',
            'query_config', 'visualization_type', 'is_shared', 'created_by',
            'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')


class MinistryExportFormatSerializer(serializers.ModelSerializer):
    """Serializer for Ministry Export Format."""
    
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    
    class Meta:
        model = MinistryExportFormat
        fields = [
            'id', 'tenant', 'tenant_name', 'format_name', 'format_type', 'ministry_department',
            'format_specification', 'template_file', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')


class MinistryExportSerializer(serializers.ModelSerializer):
    """Serializer for Ministry Export."""
    
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    export_format_name = serializers.CharField(source='export_format.format_name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True, allow_null=True)
    term_name = serializers.CharField(source='term.name', read_only=True, allow_null=True)
    exported_by_name = serializers.CharField(source='exported_by.full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = MinistryExport
        fields = [
            'id', 'tenant', 'tenant_name', 'export_format', 'export_format_name',
            'export_name', 'file', 'file_size', 'academic_year', 'academic_year_name',
            'term', 'term_name', 'date_range_start', 'date_range_end', 'status',
            'submitted_to_ministry', 'submission_date', 'submission_reference',
            'submission_notes', 'exported_by', 'exported_by_name', 'exported_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'file_size', 'exported_at', 'created_at', 'updated_at')

