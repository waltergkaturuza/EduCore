"""
URLs for Academics app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AcademicYearViewSet, TermViewSet, SubjectViewSet,
    ClassViewSet, StreamViewSet, TimetableSlotViewSet
)

router = DefaultRouter()
router.register(r'academic-years', AcademicYearViewSet, basename='academic-year')
router.register(r'terms', TermViewSet, basename='term')
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'classes', ClassViewSet, basename='class')
router.register(r'streams', StreamViewSet, basename='stream')
router.register(r'timetable', TimetableSlotViewSet, basename='timetable-slot')

urlpatterns = [
    path('', include(router.urls)),
]




