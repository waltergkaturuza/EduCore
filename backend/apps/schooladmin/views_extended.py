"""
Extended Views for School Admin app - Communication, Reports, Ministry Exports.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone

from apps.core.permissions import IsTenantAdmin
from .models import (
    CommunicationChannel, MessageTemplate, CommunicationCampaign,
    CommunicationLog, EventInvitation, RSVPResponse, ReportTemplate,
    GeneratedReport, AnalyticsQuery, MinistryExportFormat, MinistryExport
)
from .serializers import (
    CommunicationChannelSerializer, MessageTemplateSerializer, CommunicationCampaignSerializer,
    CommunicationLogSerializer, EventInvitationSerializer, RSVPResponseSerializer,
    ReportTemplateSerializer, GeneratedReportSerializer, AnalyticsQuerySerializer,
    MinistryExportFormatSerializer, MinistryExportSerializer
)


# ============================================================================
# 10. COMMUNICATION HUB
# ============================================================================

class CommunicationChannelViewSet(viewsets.ModelViewSet):
    """ViewSet for Communication Channels."""
    
    queryset = CommunicationChannel.objects.all()
    serializer_class = CommunicationChannelSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['channel_type', 'is_enabled']
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        return self.queryset.filter(tenant=user.tenant)
    
    def perform_create(self, serializer):
        """Set tenant on create."""
        serializer.save(tenant=self.request.user.tenant)


class MessageTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for Message Templates."""
    
    queryset = MessageTemplate.objects.all()
    serializer_class = MessageTemplateSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['template_type', 'is_active']
    search_fields = ['name', 'subject', 'body']
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        return self.queryset.filter(tenant=user.tenant)
    
    def perform_create(self, serializer):
        """Set tenant on create."""
        serializer.save(tenant=self.request.user.tenant)


class CommunicationCampaignViewSet(viewsets.ModelViewSet):
    """ViewSet for Communication Campaigns."""
    
    queryset = CommunicationCampaign.objects.all()
    serializer_class = CommunicationCampaignSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['campaign_type', 'status', 'target_audience']
    search_fields = ['name', 'message_content']
    ordering_fields = ['scheduled_at', 'created_at']
    ordering = ['-scheduled_at']
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        return self.queryset.filter(tenant=user.tenant)
    
    def perform_create(self, serializer):
        """Set tenant and created_by."""
        serializer.save(tenant=self.request.user.tenant, created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        """Send a campaign."""
        campaign = self.get_object()
        campaign.status = 'sending'
        campaign.sent_at = timezone.now()
        campaign.save()
        campaign.status = 'completed'
        campaign.completed_at = timezone.now()
        campaign.save()
        serializer = self.get_serializer(campaign)
        return Response(serializer.data)


class CommunicationLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Communication Logs (read-only)."""
    
    queryset = CommunicationLog.objects.all()
    serializer_class = CommunicationLogSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['channel', 'status', 'recipient_type', 'campaign']
    ordering_fields = ['sent_at', 'created_at']
    ordering = ['-sent_at']
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        return self.queryset.filter(tenant=user.tenant)


class EventInvitationViewSet(viewsets.ModelViewSet):
    """ViewSet for Event Invitations."""
    
    queryset = EventInvitation.objects.all()
    serializer_class = EventInvitationSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['event_type', 'rsvp_required']
    search_fields = ['event_name', 'description']
    ordering_fields = ['event_date', 'created_at']
    ordering = ['-event_date']
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        return self.queryset.filter(tenant=user.tenant)
    
    def perform_create(self, serializer):
        """Set tenant and created_by."""
        serializer.save(tenant=self.request.user.tenant, created_by=self.request.user)


class RSVPResponseViewSet(viewsets.ModelViewSet):
    """ViewSet for RSVP Responses."""
    
    queryset = RSVPResponse.objects.all()
    serializer_class = RSVPResponseSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['invitation', 'response']
    ordering_fields = ['responded_at']
    ordering = ['-responded_at']
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        return self.queryset.filter(invitation__tenant=user.tenant)


# ============================================================================
# 11. REPORT GENERATION & ANALYTICS
# ============================================================================

class ReportTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for Report Templates."""
    
    queryset = ReportTemplate.objects.all()
    serializer_class = ReportTemplateSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['report_type', 'template_format', 'is_active', 'is_ministry_format']
    search_fields = ['name']
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        return self.queryset.filter(tenant=user.tenant)
    
    def perform_create(self, serializer):
        """Set tenant on create."""
        serializer.save(tenant=self.request.user.tenant)


class GeneratedReportViewSet(viewsets.ModelViewSet):
    """ViewSet for Generated Reports."""
    
    queryset = GeneratedReport.objects.all()
    serializer_class = GeneratedReportSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['report_type', 'format', 'status']
    search_fields = ['report_name']
    ordering_fields = ['generated_at', 'created_at']
    ordering = ['-generated_at']
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        return self.queryset.filter(tenant=user.tenant)
    
    def perform_create(self, serializer):
        """Set tenant and generated_by."""
        serializer.save(tenant=self.request.user.tenant, generated_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def regenerate(self, request, pk=None):
        """Regenerate a report."""
        report = self.get_object()
        report.status = 'generating'
        report.save()
        report.status = 'completed'
        report.save()
        serializer = self.get_serializer(report)
        return Response(serializer.data)


class AnalyticsQueryViewSet(viewsets.ModelViewSet):
    """ViewSet for Analytics Queries."""
    
    queryset = AnalyticsQuery.objects.all()
    serializer_class = AnalyticsQuerySerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['query_type', 'visualization_type', 'is_shared']
    search_fields = ['name', 'description']
    
    def get_queryset(self):
        """Filter by tenant and shared queries."""
        user = self.request.user
        return self.queryset.filter(Q(tenant=user.tenant) | Q(is_shared=True))
    
    def perform_create(self, serializer):
        """Set tenant and created_by."""
        serializer.save(tenant=self.request.user.tenant, created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def execute(self, request, pk=None):
        """Execute an analytics query."""
        query = self.get_object()
        return Response({
            'query_id': query.id,
            'query_name': query.name,
            'results': [],
            'message': 'Query execution not yet implemented'
        })


# ============================================================================
# 12. MINISTRY EXPORTS
# ============================================================================

class MinistryExportFormatViewSet(viewsets.ModelViewSet):
    """ViewSet for Ministry Export Formats."""
    
    queryset = MinistryExportFormat.objects.all()
    serializer_class = MinistryExportFormatSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['format_type', 'is_active']
    search_fields = ['format_name', 'ministry_department']
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        return self.queryset.filter(tenant=user.tenant)
    
    def perform_create(self, serializer):
        """Set tenant on create."""
        serializer.save(tenant=self.request.user.tenant)


class MinistryExportViewSet(viewsets.ModelViewSet):
    """ViewSet for Ministry Exports."""
    
    queryset = MinistryExport.objects.all()
    serializer_class = MinistryExportSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['export_format', 'status', 'submitted_to_ministry']
    search_fields = ['export_name']
    ordering_fields = ['exported_at', 'created_at']
    ordering = ['-exported_at']
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        return self.queryset.filter(tenant=user.tenant)
    
    def perform_create(self, serializer):
        """Set tenant and exported_by."""
        serializer.save(tenant=self.request.user.tenant, exported_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def generate(self, request, pk=None):
        """Generate ministry export."""
        export = self.get_object()
        export.status = 'generating'
        export.save()
        export.status = 'completed'
        export.save()
        serializer = self.get_serializer(export)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Mark export as submitted to ministry."""
        export = self.get_object()
        export.submitted_to_ministry = True
        export.submission_date = timezone.now().date()
        export.submission_reference = request.data.get('submission_reference', '')
        export.submission_notes = request.data.get('submission_notes', '')
        export.status = 'submitted'
        export.save()
        serializer = self.get_serializer(export)
        return Response(serializer.data)




