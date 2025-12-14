"""
URLs for LMS app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CourseViewSet, LessonViewSet, QuizViewSet,
    QuestionViewSet, QuizAttemptViewSet
)

router = DefaultRouter()
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'lessons', LessonViewSet, basename='lesson')
router.register(r'quizzes', QuizViewSet, basename='quiz')
router.register(r'questions', QuestionViewSet, basename='question')
router.register(r'quiz-attempts', QuizAttemptViewSet, basename='quiz-attempt')

urlpatterns = [
    path('', include(router.urls)),
]




