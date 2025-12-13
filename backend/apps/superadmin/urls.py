"""
URLs for Superadmin app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SubscriptionPlanViewSet, TenantSubscriptionViewSet, InvoiceViewSet,
    SupportTicketViewSet, AuditLogViewSet, ImpersonationSessionViewSet,
    FeatureFlagViewSet, SystemHealthViewSet, PlatformMetricsView
)
from .views_extended import (
    GlobalUserViewSet, APIKeyViewSet, PaymentGatewayViewSet,
    PaymentTransactionViewSet, LeadViewSet, BackupViewSet,
    ContentViewSet, ContentSubscriptionViewSet, ContractViewSet,
    GlobalAnnouncementViewSet, KnowledgeBaseArticleViewSet,
    OnboardingChecklistViewSet
)

router = DefaultRouter()
# Existing ViewSets
router.register(r'subscription-plans', SubscriptionPlanViewSet, basename='subscription-plan')
router.register(r'subscriptions', TenantSubscriptionViewSet, basename='subscription')
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'support-tickets', SupportTicketViewSet, basename='support-ticket')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')
router.register(r'impersonation-sessions', ImpersonationSessionViewSet, basename='impersonation-session')
router.register(r'feature-flags', FeatureFlagViewSet, basename='feature-flag')
router.register(r'system-health', SystemHealthViewSet, basename='system-health')

# New ViewSets
router.register(r'global-users', GlobalUserViewSet, basename='global-user')
router.register(r'api-keys', APIKeyViewSet, basename='api-key')
router.register(r'payment-gateways', PaymentGatewayViewSet, basename='payment-gateway')
router.register(r'payment-transactions', PaymentTransactionViewSet, basename='payment-transaction')
router.register(r'leads', LeadViewSet, basename='lead')
router.register(r'backups', BackupViewSet, basename='backup')
router.register(r'content', ContentViewSet, basename='content')
router.register(r'content-subscriptions', ContentSubscriptionViewSet, basename='content-subscription')
router.register(r'contracts', ContractViewSet, basename='contract')
router.register(r'global-announcements', GlobalAnnouncementViewSet, basename='global-announcement')
router.register(r'knowledge-base', KnowledgeBaseArticleViewSet, basename='kb-article')
router.register(r'onboarding-checklists', OnboardingChecklistViewSet, basename='onboarding-checklist')

from .views import (
    ChurnAnalysisView, TenantLTVView, ChurnRiskView,
    ConversionRateView, PaymentReconciliationView, RevenueForecastView
)

urlpatterns = [
    path('', include(router.urls)),
    path('metrics/', PlatformMetricsView.as_view(), name='platform-metrics'),
    # Business Logic Endpoints
    path('analytics/churn/', ChurnAnalysisView.as_view(), name='churn-analysis'),
    path('analytics/ltv/<int:tenant_id>/', TenantLTVView.as_view(), name='tenant-ltv'),
    path('analytics/churn-risk/<int:tenant_id>/', ChurnRiskView.as_view(), name='churn-risk'),
    path('analytics/conversion-rate/', ConversionRateView.as_view(), name='conversion-rate'),
    path('analytics/payment-reconciliation/', PaymentReconciliationView.as_view(), name='payment-reconciliation'),
    path('analytics/revenue-forecast/', RevenueForecastView.as_view(), name='revenue-forecast'),
]

