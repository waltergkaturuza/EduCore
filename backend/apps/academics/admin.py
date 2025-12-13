"""
Admin configuration for Academics app.
"""
from django.contrib import admin
from .models import AcademicYear, Term, Subject, Class, Stream, TimetableSlot


@admin.register(AcademicYear)
class AcademicYearAdmin(admin.ModelAdmin):
    list_display = ['name', 'tenant', 'start_date', 'end_date', 'is_current']
    list_filter = ['tenant', 'is_current']


@admin.register(Term)
class TermAdmin(admin.ModelAdmin):
    list_display = ['name', 'academic_year', 'start_date', 'end_date', 'is_current']
    list_filter = ['academic_year', 'is_current']


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'tenant', 'is_core', 'is_active']
    list_filter = ['tenant', 'is_core', 'is_active']
    search_fields = ['code', 'name']


@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    list_display = ['name', 'tenant', 'academic_year', 'level', 'class_teacher', 'capacity']
    list_filter = ['tenant', 'academic_year']
    search_fields = ['name']


@admin.register(Stream)
class StreamAdmin(admin.ModelAdmin):
    list_display = ['name', 'class_obj', 'capacity']
    list_filter = ['class_obj']


@admin.register(TimetableSlot)
class TimetableSlotAdmin(admin.ModelAdmin):
    list_display = ['subject', 'class_obj', 'stream', 'teacher', 'day_of_week', 'start_time', 'end_time']
    list_filter = ['tenant', 'academic_year', 'day_of_week']
    search_fields = ['subject__name', 'teacher__email']



