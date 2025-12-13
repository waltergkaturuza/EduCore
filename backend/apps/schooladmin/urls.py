"""
URLs for School Admin app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DashboardMetricsViewSet, SchoolProfileViewSet, AcademicConfigurationViewSet,
    AdmissionApplicationViewSet, StudentDocumentViewSet, StudentLifecycleEventViewSet,
    TimetableVersionViewSet, AttendanceAlertViewSet, ExamCycleViewSet, GradeModerationViewSet,
    FeeStructureEnhancedViewSet, PaymentReconciliationViewSet, StaffRecordViewSet,
    StaffAppraisalViewSet, LeaveRequestViewSet
)
from .views_extended import (
    CommunicationChannelViewSet, MessageTemplateViewSet, CommunicationCampaignViewSet,
    CommunicationLogViewSet, EventInvitationViewSet, RSVPResponseViewSet,
    ReportTemplateViewSet, GeneratedReportViewSet, AnalyticsQueryViewSet,
    MinistryExportFormatViewSet, MinistryExportViewSet
)

router = DefaultRouter()
router.register(r'dashboard-metrics', DashboardMetricsViewSet, basename='dashboard-metrics')
router.register(r'school-profile', SchoolProfileViewSet, basename='school-profile')
router.register(r'academic-config', AcademicConfigurationViewSet, basename='academic-config')
router.register(r'admission-applications', AdmissionApplicationViewSet, basename='admission-application')
router.register(r'student-documents', StudentDocumentViewSet, basename='student-document')
router.register(r'student-lifecycle-events', StudentLifecycleEventViewSet, basename='student-lifecycle-event')
router.register(r'timetable-versions', TimetableVersionViewSet, basename='timetable-version')
router.register(r'attendance-alerts', AttendanceAlertViewSet, basename='attendance-alert')
router.register(r'exam-cycles', ExamCycleViewSet, basename='exam-cycle')
router.register(r'grade-moderations', GradeModerationViewSet, basename='grade-moderation')
router.register(r'fee-structures-enhanced', FeeStructureEnhancedViewSet, basename='fee-structure-enhanced')
router.register(r'payment-reconciliations', PaymentReconciliationViewSet, basename='payment-reconciliation')
router.register(r'staff-records', StaffRecordViewSet, basename='staff-record')
router.register(r'staff-appraisals', StaffAppraisalViewSet, basename='staff-appraisal')
router.register(r'leave-requests', LeaveRequestViewSet, basename='leave-request')

# Communication Hub
router.register(r'communication-channels', CommunicationChannelViewSet, basename='communication-channel')
router.register(r'message-templates', MessageTemplateViewSet, basename='message-template')
router.register(r'communication-campaigns', CommunicationCampaignViewSet, basename='communication-campaign')
router.register(r'communication-logs', CommunicationLogViewSet, basename='communication-log')
router.register(r'event-invitations', EventInvitationViewSet, basename='event-invitation')
router.register(r'rsvp-responses', RSVPResponseViewSet, basename='rsvp-response')

# Reports & Analytics
router.register(r'report-templates', ReportTemplateViewSet, basename='report-template')
router.register(r'generated-reports', GeneratedReportViewSet, basename='generated-report')
router.register(r'analytics-queries', AnalyticsQueryViewSet, basename='analytics-query')

# Ministry Exports
router.register(r'ministry-export-formats', MinistryExportFormatViewSet, basename='ministry-export-format')
router.register(r'ministry-exports', MinistryExportViewSet, basename='ministry-export')

urlpatterns = [
    path('', include(router.urls)),
]

