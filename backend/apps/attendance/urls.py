"""
URLs for Attendance app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AttendanceViewSet, PeriodAttendanceViewSet

router = DefaultRouter()
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'period-attendance', PeriodAttendanceViewSet, basename='period-attendance')

urlpatterns = [
    path('', include(router.urls)),
]



