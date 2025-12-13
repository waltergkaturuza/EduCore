"""
Views for Students app.
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.core.permissions import IsTeacher
from .models import Student, Guardian, StudentGuardian, Enrollment
from .serializers import (
    StudentSerializer, GuardianSerializer,
    StudentGuardianSerializer, EnrollmentSerializer
)


class StudentViewSet(viewsets.ModelViewSet):
    """ViewSet for Student."""
    
    queryset = Student.objects.filter(is_deleted=False)
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by tenant and optionally class/stream."""
        user = self.request.user
        queryset = self.queryset
        
        if user.tenant:
            queryset = queryset.filter(tenant=user.tenant)
        
        # Filter by class
        class_id = self.request.query_params.get('class')
        if class_id:
            queryset = queryset.filter(current_class_id=class_id)
        
        # Filter by stream
        stream_id = self.request.query_params.get('stream')
        if stream_id:
            queryset = queryset.filter(current_stream_id=stream_id)
        
        # Filter by status
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        return queryset


class GuardianViewSet(viewsets.ModelViewSet):
    """ViewSet for Guardian."""
    
    queryset = Guardian.objects.filter(is_deleted=False)
    serializer_class = GuardianSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        if user.tenant:
            return self.queryset.filter(tenant=user.tenant)
        return self.queryset.none()


class StudentGuardianViewSet(viewsets.ModelViewSet):
    """ViewSet for StudentGuardian."""
    
    queryset = StudentGuardian.objects.filter(is_deleted=False)
    serializer_class = StudentGuardianSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by tenant via student."""
        user = self.request.user
        if user.tenant:
            return self.queryset.filter(student__tenant=user.tenant)
        return self.queryset.none()


class EnrollmentViewSet(viewsets.ModelViewSet):
    """ViewSet for Enrollment."""
    
    queryset = Enrollment.objects.filter(is_deleted=False)
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        queryset = self.queryset
        
        if user.tenant:
            queryset = queryset.filter(student__tenant=user.tenant)
        
        # Filter by academic year
        academic_year_id = self.request.query_params.get('academic_year')
        if academic_year_id:
            queryset = queryset.filter(academic_year_id=academic_year_id)
        
        return queryset



