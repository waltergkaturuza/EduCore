"""
Admin configuration for Students app.
"""
from django.contrib import admin
from .models import Student, Guardian, StudentGuardian, Enrollment


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['student_id', 'user', 'tenant', 'current_class', 'status', 'admission_date']
    list_filter = ['tenant', 'status', 'current_class', 'gender']
    search_fields = ['student_id', 'user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Guardian)
class GuardianAdmin(admin.ModelAdmin):
    list_display = ['user', 'tenant', 'relationship', 'phone', 'is_primary_contact']
    list_filter = ['tenant', 'relationship', 'is_emergency_contact']
    search_fields = ['user__email', 'user__first_name', 'phone']


@admin.register(StudentGuardian)
class StudentGuardianAdmin(admin.ModelAdmin):
    list_display = ['student', 'guardian', 'relationship', 'is_primary', 'is_emergency']
    list_filter = ['relationship', 'is_primary', 'is_emergency']


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ['student', 'academic_year', 'class_obj', 'stream', 'enrollment_date']
    list_filter = ['academic_year', 'class_obj']
    search_fields = ['student__user__email', 'student__student_id']




