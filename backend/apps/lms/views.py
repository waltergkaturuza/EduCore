"""
Views for LMS app.
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.core.permissions import IsTeacher
from .models import Course, Lesson, Quiz, Question, QuizAttempt
from .serializers import (
    CourseSerializer, LessonSerializer, QuizSerializer,
    QuestionSerializer, QuizAttemptSerializer
)


class CourseViewSet(viewsets.ModelViewSet):
    """ViewSet for Course."""
    
    queryset = Course.objects.filter(is_deleted=False)
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        queryset = self.queryset
        
        if user.tenant:
            queryset = queryset.filter(tenant=user.tenant)
        
        # Students see only published courses for their class
        if user.role == 'student' and hasattr(user, 'student_profile'):
            queryset = queryset.filter(
                is_published=True,
                class_obj=user.student_profile.current_class
            )
        
        return queryset


class LessonViewSet(viewsets.ModelViewSet):
    """ViewSet for Lesson."""
    
    queryset = Lesson.objects.filter(is_deleted=False)
    serializer_class = LessonSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by tenant via course."""
        user = self.request.user
        queryset = self.queryset
        
        if user.tenant:
            queryset = queryset.filter(course__tenant=user.tenant)
        
        # Filter by course
        course_id = self.request.query_params.get('course')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        return queryset


class QuizViewSet(viewsets.ModelViewSet):
    """ViewSet for Quiz."""
    
    queryset = Quiz.objects.filter(is_deleted=False)
    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        queryset = self.queryset
        
        if user.tenant:
            queryset = queryset.filter(course__tenant=user.tenant)
        
        return queryset


class QuestionViewSet(viewsets.ModelViewSet):
    """ViewSet for Question."""
    
    queryset = Question.objects.filter(is_deleted=False)
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated, IsTeacher]
    
    def get_queryset(self):
        """Filter by tenant via quiz."""
        user = self.request.user
        queryset = self.queryset
        
        if user.tenant:
            queryset = queryset.filter(quiz__course__tenant=user.tenant)
        
        # Filter by quiz
        quiz_id = self.request.query_params.get('quiz')
        if quiz_id:
            queryset = queryset.filter(quiz_id=quiz_id)
        
        return queryset


class QuizAttemptViewSet(viewsets.ModelViewSet):
    """ViewSet for QuizAttempt."""
    
    queryset = QuizAttempt.objects.filter(is_deleted=False)
    serializer_class = QuizAttemptSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        queryset = self.queryset
        
        if user.tenant:
            queryset = queryset.filter(quiz__course__tenant=user.tenant)
        
        # Students see only their attempts
        if user.role == 'student' and hasattr(user, 'student_profile'):
            queryset = queryset.filter(student=user.student_profile)
        
        return queryset




