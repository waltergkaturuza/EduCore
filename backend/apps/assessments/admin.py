"""
Admin configuration for Assessments app.
"""
from django.contrib import admin
from .models import Assignment, Submission, Assessment, Grade, ReportCard


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ['title', 'subject', 'class_obj', 'teacher', 'due_date', 'is_published']
    list_filter = ['tenant', 'subject', 'class_obj', 'is_published']
    search_fields = ['title', 'description']


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ['student', 'assignment', 'is_submitted', 'submitted_at', 'score']
    list_filter = ['is_submitted', 'submitted_at']
    search_fields = ['student__user__email', 'assignment__title']


@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'subject', 'class_obj', 'assessment_type', 'date']
    list_filter = ['tenant', 'assessment_type', 'subject']
    search_fields = ['name']


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ['student', 'assessment', 'score', 'percentage', 'letter_grade']
    list_filter = ['assessment', 'letter_grade']
    search_fields = ['student__user__email']


@admin.register(ReportCard)
class ReportCardAdmin(admin.ModelAdmin):
    list_display = ['student', 'academic_year', 'term', 'average_score', 'overall_grade', 'is_published']
    list_filter = ['academic_year', 'term', 'is_published']
    search_fields = ['student__user__email', 'student__student_id']




