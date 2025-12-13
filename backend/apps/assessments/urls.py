"""
URLs for Assessments app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AssignmentViewSet, SubmissionViewSet, AssessmentViewSet,
    GradeViewSet, ReportCardViewSet
)

router = DefaultRouter()
router.register(r'assignments', AssignmentViewSet, basename='assignment')
router.register(r'submissions', SubmissionViewSet, basename='submission')
router.register(r'assessments', AssessmentViewSet, basename='assessment')
router.register(r'grades', GradeViewSet, basename='grade')
router.register(r'report-cards', ReportCardViewSet, basename='report-card')

urlpatterns = [
    path('', include(router.urls)),
]



