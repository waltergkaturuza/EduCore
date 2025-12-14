"""
Views for Academics app.
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.core.permissions import IsTeacher
from .models import AcademicYear, Term, Subject, Class, Stream, TimetableSlot
from .serializers import (
    AcademicYearSerializer, TermSerializer, SubjectSerializer,
    ClassSerializer, StreamSerializer, TimetableSlotSerializer
)


class AcademicYearViewSet(viewsets.ModelViewSet):
    """ViewSet for AcademicYear."""
    
    queryset = AcademicYear.objects.filter(is_deleted=False)
    serializer_class = AcademicYearSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        if user.tenant:
            return self.queryset.filter(tenant=user.tenant)
        return self.queryset.none()


class TermViewSet(viewsets.ModelViewSet):
    """ViewSet for Term."""
    
    queryset = Term.objects.filter(is_deleted=False)
    serializer_class = TermSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by tenant via academic year."""
        user = self.request.user
        if user.tenant:
            return self.queryset.filter(academic_year__tenant=user.tenant)
        return self.queryset.none()


class SubjectViewSet(viewsets.ModelViewSet):
    """ViewSet for Subject."""
    
    queryset = Subject.objects.filter(is_deleted=False, is_active=True)
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        if user.tenant:
            return self.queryset.filter(tenant=user.tenant)
        return self.queryset.none()


class ClassViewSet(viewsets.ModelViewSet):
    """ViewSet for Class."""
    
    queryset = Class.objects.filter(is_deleted=False)
    serializer_class = ClassSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        if user.tenant:
            return self.queryset.filter(tenant=user.tenant)
        return self.queryset.none()


class StreamViewSet(viewsets.ModelViewSet):
    """ViewSet for Stream."""
    
    queryset = Stream.objects.filter(is_deleted=False)
    serializer_class = StreamSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by tenant via class."""
        user = self.request.user
        if user.tenant:
            return self.queryset.filter(class_obj__tenant=user.tenant)
        return self.queryset.none()


class TimetableSlotViewSet(viewsets.ModelViewSet):
    """ViewSet for TimetableSlot."""
    
    queryset = TimetableSlot.objects.filter(is_deleted=False)
    serializer_class = TimetableSlotSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by tenant and optionally class/stream."""
        user = self.request.user
        queryset = self.queryset
        
        if user.tenant:
            queryset = queryset.filter(tenant=user.tenant)
        
        # Filter by class if provided
        class_id = self.request.query_params.get('class')
        if class_id:
            queryset = queryset.filter(class_obj_id=class_id)
        
        # Filter by stream if provided
        stream_id = self.request.query_params.get('stream')
        if stream_id:
            queryset = queryset.filter(stream_id=stream_id)
        
        # Filter by teacher if teacher role
        if user.role == 'teacher':
            queryset = queryset.filter(teacher=user)
        
        return queryset




