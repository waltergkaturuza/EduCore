"""
Admin configuration for LMS app.
"""
from django.contrib import admin
from .models import Course, Lesson, Quiz, Question, QuizAttempt


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['title', 'subject', 'class_obj', 'is_published', 'created_at']
    list_filter = ['tenant', 'subject', 'is_published']
    search_fields = ['title', 'description']


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'content_type', 'order', 'is_published']
    list_filter = ['content_type', 'is_published']
    search_fields = ['title', 'description']


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'max_score', 'is_published']
    list_filter = ['is_published', 'allow_multiple_attempts']
    search_fields = ['title', 'description']


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['question_text', 'quiz', 'question_type', 'points', 'order']
    list_filter = ['question_type']
    search_fields = ['question_text']


@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ['student', 'quiz', 'score', 'percentage', 'is_passed', 'submitted_at']
    list_filter = ['is_passed', 'submitted_at']
    search_fields = ['student__user__email', 'quiz__title']



