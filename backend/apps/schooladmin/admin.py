"""
Admin configuration for School Admin app.
"""
from django.contrib import admin
from .models import (
    SchoolProfile, AcademicConfiguration, AdmissionApplication,
    StudentDocument, StudentLifecycleEvent, TimetableVersion, TimetableSlotEnhanced,
    AttendanceAlert, AttendanceOfflineSync, ExamCycle, GradeModeration, PostLockGradeChange,
    FeeStructureEnhanced, PaymentReconciliation, StaffRecord, StaffAppraisal, LeaveRequest,
    DashboardMetrics, CommunicationChannel, MessageTemplate, CommunicationCampaign,
    CommunicationLog, EventInvitation, RSVPResponse, ReportTemplate, GeneratedReport,
    AnalyticsQuery, MinistryExportFormat, MinistryExport
)


@admin.register(SchoolProfile)
class SchoolProfileAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'ministry_registration_number', 'accreditation_status', 'accreditation_expiry']
    list_filter = ['accreditation_status']
    search_fields = ['tenant__name', 'ministry_registration_number']


@admin.register(AcademicConfiguration)
class AcademicConfigurationAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'curriculum_framework', 'grading_system', 'report_card_approval_required']
    list_filter = ['curriculum_framework', 'grading_system']


@admin.register(AdmissionApplication)
class AdmissionApplicationAdmin(admin.ModelAdmin):
    list_display = ['application_number', 'first_name', 'last_name', 'applied_class', 'stage', 'application_date']
    list_filter = ['stage', 'academic_year', 'tenant']
    search_fields = ['first_name', 'last_name', 'application_number', 'email']
    date_hierarchy = 'application_date'


@admin.register(StudentDocument)
class StudentDocumentAdmin(admin.ModelAdmin):
    list_display = ['student', 'document_type', 'title', 'is_verified', 'verified_at']
    list_filter = ['document_type', 'is_verified']
    search_fields = ['student__user__first_name', 'student__user__last_name', 'title']


@admin.register(StudentLifecycleEvent)
class StudentLifecycleEventAdmin(admin.ModelAdmin):
    list_display = ['student', 'event_type', 'event_date', 'from_class', 'to_class']
    list_filter = ['event_type', 'event_date']
    search_fields = ['student__user__first_name', 'student__user__last_name']
    date_hierarchy = 'event_date'


@admin.register(TimetableVersion)
class TimetableVersionAdmin(admin.ModelAdmin):
    list_display = ['name', 'academic_year', 'version_number', 'is_active', 'is_published']
    list_filter = ['is_active', 'is_published', 'generation_method']
    search_fields = ['name', 'academic_year__name']


@admin.register(AttendanceAlert)
class AttendanceAlertAdmin(admin.ModelAdmin):
    list_display = ['student', 'alert_type', 'severity', 'is_sent', 'created_at']
    list_filter = ['alert_type', 'severity', 'is_sent']
    search_fields = ['student__user__first_name', 'student__user__last_name']


@admin.register(ExamCycle)
class ExamCycleAdmin(admin.ModelAdmin):
    list_display = ['name', 'academic_year', 'term', 'exam_type', 'status', 'is_locked']
    list_filter = ['exam_type', 'status', 'is_locked', 'moderation_required']
    search_fields = ['name', 'academic_year__name']


@admin.register(GradeModeration)
class GradeModerationAdmin(admin.ModelAdmin):
    list_display = ['grade', 'stage', 'original_score', 'moderated_score', 'is_approved']
    list_filter = ['stage', 'is_approved']
    search_fields = ['grade__student__user__first_name', 'grade__student__user__last_name']


@admin.register(StaffRecord)
class StaffRecordAdmin(admin.ModelAdmin):
    list_display = ['user', 'employee_number', 'employment_type', 'department', 'position', 'hire_date']
    list_filter = ['employment_type', 'department']
    search_fields = ['user__first_name', 'user__last_name', 'employee_number']


@admin.register(StaffAppraisal)
class StaffAppraisalAdmin(admin.ModelAdmin):
    list_display = ['staff', 'appraisal_period', 'appraisal_date', 'overall_score']
    list_filter = ['appraisal_date']
    search_fields = ['staff__user__first_name', 'staff__user__last_name', 'appraisal_period']


@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ['staff', 'leave_type', 'start_date', 'end_date', 'days_requested', 'status']
    list_filter = ['leave_type', 'status']
    search_fields = ['staff__user__first_name', 'staff__user__last_name']
    date_hierarchy = 'start_date'


@admin.register(DashboardMetrics)
class DashboardMetricsAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'calculated_at', 'total_enrollment', 'total_teachers', 'attendance_percentage_today']
    list_filter = ['calculated_at']
    search_fields = ['tenant__name']
    readonly_fields = ['calculated_at']


@admin.register(CommunicationChannel)
class CommunicationChannelAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'channel_type', 'is_enabled', 'provider']
    list_filter = ['channel_type', 'is_enabled']
    search_fields = ['tenant__name', 'provider']


@admin.register(MessageTemplate)
class MessageTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'tenant', 'template_type', 'is_active']
    list_filter = ['template_type', 'is_active']
    search_fields = ['name', 'tenant__name']


@admin.register(CommunicationCampaign)
class CommunicationCampaignAdmin(admin.ModelAdmin):
    list_display = ['name', 'tenant', 'campaign_type', 'status', 'total_recipients', 'sent_count', 'scheduled_at']
    list_filter = ['campaign_type', 'status']
    search_fields = ['name', 'tenant__name']
    date_hierarchy = 'scheduled_at'


@admin.register(CommunicationLog)
class CommunicationLogAdmin(admin.ModelAdmin):
    list_display = ['recipient_name', 'channel', 'status', 'sent_at']
    list_filter = ['channel', 'status', 'recipient_type']
    search_fields = ['recipient_name', 'recipient_contact']
    date_hierarchy = 'sent_at'


@admin.register(EventInvitation)
class EventInvitationAdmin(admin.ModelAdmin):
    list_display = ['event_name', 'tenant', 'event_type', 'event_date', 'rsvp_required', 'total_invited']
    list_filter = ['event_type', 'rsvp_required']
    search_fields = ['event_name', 'tenant__name']
    date_hierarchy = 'event_date'


@admin.register(ReportTemplate)
class ReportTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'tenant', 'report_type', 'template_format', 'is_active', 'is_ministry_format']
    list_filter = ['report_type', 'template_format', 'is_active', 'is_ministry_format']
    search_fields = ['name', 'tenant__name']


@admin.register(GeneratedReport)
class GeneratedReportAdmin(admin.ModelAdmin):
    list_display = ['report_name', 'tenant', 'report_type', 'format', 'status', 'generated_at']
    list_filter = ['report_type', 'format', 'status']
    search_fields = ['report_name', 'tenant__name']
    date_hierarchy = 'generated_at'
    readonly_fields = ['generated_at']


@admin.register(AnalyticsQuery)
class AnalyticsQueryAdmin(admin.ModelAdmin):
    list_display = ['name', 'tenant', 'query_type', 'visualization_type', 'is_shared']
    list_filter = ['query_type', 'visualization_type', 'is_shared']
    search_fields = ['name', 'tenant__name']


@admin.register(MinistryExportFormat)
class MinistryExportFormatAdmin(admin.ModelAdmin):
    list_display = ['format_name', 'tenant', 'format_type', 'ministry_department', 'is_active']
    list_filter = ['format_type', 'is_active']
    search_fields = ['format_name', 'tenant__name', 'ministry_department']


@admin.register(MinistryExport)
class MinistryExportAdmin(admin.ModelAdmin):
    list_display = ['export_name', 'tenant', 'export_format', 'status', 'submitted_to_ministry', 'exported_at']
    list_filter = ['status', 'submitted_to_ministry']
    search_fields = ['export_name', 'tenant__name']
    date_hierarchy = 'exported_at'
    readonly_fields = ['exported_at']

