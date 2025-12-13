"""
URLs for Students app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StudentViewSet, GuardianViewSet,
    StudentGuardianViewSet, EnrollmentViewSet
)

router = DefaultRouter()
router.register(r'students', StudentViewSet, basename='student')
router.register(r'guardians', GuardianViewSet, basename='guardian')
router.register(r'student-guardians', StudentGuardianViewSet, basename='student-guardian')
router.register(r'enrollments', EnrollmentViewSet, basename='enrollment')

urlpatterns = [
    path('', include(router.urls)),
]



