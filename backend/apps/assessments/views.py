"""
Views for Assessments app.
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.core.permissions import IsTeacher
from .models import Assignment, Submission, Assessment, Grade, ReportCard
from .serializers import (
    AssignmentSerializer, SubmissionSerializer, AssessmentSerializer,
    GradeSerializer, ReportCardSerializer
)


class AssignmentViewSet(viewsets.ModelViewSet):
    """ViewSet for Assignment."""
    
    queryset = Assignment.objects.filter(is_deleted=False)
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by tenant and optionally class/subject."""
        user = self.request.user
        queryset = self.queryset
        
        if user.tenant:
            queryset = queryset.filter(tenant=user.tenant)
        
        # Filter by class
        class_id = self.request.query_params.get('class')
        if class_id:
            queryset = queryset.filter(class_obj_id=class_id)
        
        # Filter by subject
        subject_id = self.request.query_params.get('subject')
        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)
        
        # Students see only their assignments
        if user.role == 'student' and hasattr(user, 'student_profile'):
            queryset = queryset.filter(
                class_obj=user.student_profile.current_class,
                stream=user.student_profile.current_stream
            )
        
        return queryset


class SubmissionViewSet(viewsets.ModelViewSet):
    """ViewSet for Submission."""
    
    queryset = Submission.objects.filter(is_deleted=False)
    serializer_class = SubmissionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        queryset = self.queryset
        
        if user.tenant:
            queryset = queryset.filter(assignment__tenant=user.tenant)
        
        # Students see only their submissions
        if user.role == 'student' and hasattr(user, 'student_profile'):
            queryset = queryset.filter(student=user.student_profile)
        
        # Filter by assignment
        assignment_id = self.request.query_params.get('assignment')
        if assignment_id:
            queryset = queryset.filter(assignment_id=assignment_id)
        
        return queryset


class AssessmentViewSet(viewsets.ModelViewSet):
    """ViewSet for Assessment."""
    
    queryset = Assessment.objects.filter(is_deleted=False)
    serializer_class = AssessmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        queryset = self.queryset
        
        if user.tenant:
            queryset = queryset.filter(tenant=user.tenant)
        
        # Filter by class
        class_id = self.request.query_params.get('class')
        if class_id:
            queryset = queryset.filter(class_obj_id=class_id)
        
        return queryset


class GradeViewSet(viewsets.ModelViewSet):
    """ViewSet for Grade."""
    
    queryset = Grade.objects.filter(is_deleted=False)
    serializer_class = GradeSerializer
    permission_classes = [IsAuthenticated, IsTeacher]
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        queryset = self.queryset
        
        if user.tenant:
            queryset = queryset.filter(assessment__tenant=user.tenant)
        
        # Filter by assessment
        assessment_id = self.request.query_params.get('assessment')
        if assessment_id:
            queryset = queryset.filter(assessment_id=assessment_id)
        
        # Filter by student
        student_id = self.request.query_params.get('student')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        
        return queryset


class ReportCardViewSet(viewsets.ModelViewSet):
    """ViewSet for ReportCard."""
    
    queryset = ReportCard.objects.filter(is_deleted=False)
    serializer_class = ReportCardSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        queryset = self.queryset
        
        if user.tenant:
            queryset = queryset.filter(student__tenant=user.tenant)
        
        # Students see only their report cards
        if user.role == 'student' and hasattr(user, 'student_profile'):
            queryset = queryset.filter(student=user.student_profile)
        
        # Parents see their children's report cards
        elif user.role == 'parent' and hasattr(user, 'guardian_profile'):
            from apps.students.models import StudentGuardian
            student_ids = StudentGuardian.objects.filter(
                guardian=user.guardian_profile
            ).values_list('student_id', flat=True)
            queryset = queryset.filter(student_id__in=student_ids)
        
        return queryset




