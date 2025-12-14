"""
Admin configuration for Teachers app.
"""
from django.contrib import admin
from .models import (
    TeacherDashboardMetrics, LessonPlan, LessonTemplate,
    TeacherAnalytics, CPDRecord, OfflineSync,
    TeacherResource, TeacherCommunity
)


@admin.register(TeacherDashboardMetrics)
class TeacherDashboardMetricsAdmin(admin.ModelAdmin):
    list_display = ['teacher', 'calculated_at', 'today_classes_count', 'pending_assignments_to_mark', 'is_online']
    list_filter = ['calculated_at', 'is_online', 'tenant']
    search_fields = ['teacher__email', 'teacher__first_name', 'teacher__last_name']
    readonly_fields = ['calculated_at']


@admin.register(LessonPlan)
class LessonPlanAdmin(admin.ModelAdmin):
    list_display = ['title', 'teacher', 'subject', 'class_obj', 'status', 'scheduled_date']
    list_filter = ['status', 'curriculum_framework', 'blooms_taxonomy_level', 'scheduled_date']
    search_fields = ['title', 'topic', 'teacher__email']
    filter_horizontal = ['linked_assessments']


@admin.register(LessonTemplate)
class LessonTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'teacher', 'subject', 'is_school_wide', 'usage_count']
    list_filter = ['is_school_wide', 'is_personal', 'subject']
    search_fields = ['name', 'description']


@admin.register(TeacherAnalytics)
class TeacherAnalyticsAdmin(admin.ModelAdmin):
    list_display = ['teacher', 'academic_year', 'term', 'calculated_at', 'lesson_completion_rate']
    list_filter = ['academic_year', 'term', 'calculated_at']
    search_fields = ['teacher__email']


@admin.register(CPDRecord)
class CPDRecordAdmin(admin.ModelAdmin):
    list_display = ['title', 'teacher', 'cpd_type', 'cpd_points', 'completion_date', 'is_verified']
    list_filter = ['cpd_type', 'is_verified', 'provider_type', 'completion_date']
    search_fields = ['title', 'teacher__email', 'provider']


@admin.register(OfflineSync)
class OfflineSyncAdmin(admin.ModelAdmin):
    list_display = ['teacher', 'sync_status', 'last_sync_at', 'device_type']
    list_filter = ['sync_status', 'device_type', 'last_sync_at']
    search_fields = ['teacher__email', 'device_id']


@admin.register(TeacherResource)
class TeacherResourceAdmin(admin.ModelAdmin):
    list_display = ['title', 'teacher', 'resource_type', 'is_public', 'download_count']
    list_filter = ['resource_type', 'is_public', 'subject']
    search_fields = ['title', 'description', 'teacher__email']
    filter_horizontal = ['shared_with']


@admin.register(TeacherCommunity)
class TeacherCommunityAdmin(admin.ModelAdmin):
    list_display = ['name', 'community_type', 'subject', 'is_active']
    list_filter = ['community_type', 'is_active', 'subject']
    search_fields = ['name', 'description']
    filter_horizontal = ['members', 'moderators']


