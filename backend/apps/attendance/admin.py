"""
Admin configuration for Attendance app.
"""
from django.contrib import admin
from .models import Attendance, PeriodAttendance


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['student', 'date', 'status', 'class_obj', 'marked_by']
    list_filter = ['status', 'date', 'tenant', 'class_obj']
    search_fields = ['student__user__email', 'student__student_id']
    date_hierarchy = 'date'


@admin.register(PeriodAttendance)
class PeriodAttendanceAdmin(admin.ModelAdmin):
    list_display = ['student', 'timetable_slot', 'date', 'status', 'marked_by']
    list_filter = ['status', 'date', 'tenant']
    search_fields = ['student__user__email']




