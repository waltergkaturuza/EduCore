"""
Views for Attendance app.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from datetime import date
from .models import Attendance, PeriodAttendance
from .serializers import AttendanceSerializer, PeriodAttendanceSerializer
from apps.core.permissions import IsTeacher


class AttendanceViewSet(viewsets.ModelViewSet):
    """ViewSet for Attendance."""
    
    queryset = Attendance.objects.filter(is_deleted=False)
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by tenant and date range."""
        user = self.request.user
        queryset = self.queryset
        
        if user.tenant:
            queryset = queryset.filter(tenant=user.tenant)
        
        # Filter by date
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        
        # Filter by class
        class_id = self.request.query_params.get('class')
        if class_id:
            queryset = queryset.filter(class_obj_id=class_id)
        
        # Filter by student (for parents/students)
        if user.role in ['parent', 'student']:
            if user.role == 'student' and hasattr(user, 'student_profile'):
                queryset = queryset.filter(student=user.student_profile)
            elif user.role == 'parent' and hasattr(user, 'guardian_profile'):
                # Get students linked to this guardian
                from apps.students.models import StudentGuardian
                student_ids = StudentGuardian.objects.filter(
                    guardian=user.guardian_profile
                ).values_list('student_id', flat=True)
                queryset = queryset.filter(student_id__in=student_ids)
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def bulk_mark(self, request):
        """Bulk mark attendance for multiple students."""
        data = request.data
        date_str = data.get('date')
        class_id = data.get('class')
        attendances = data.get('attendances', [])  # List of {student_id: status}
        
        if not date_str or not class_id:
            return Response(
                {'error': 'date and class are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        created_count = 0
        updated_count = 0
        
        for att_data in attendances:
            student_id = att_data.get('student_id')
            status_val = att_data.get('status', 'present')
            
            attendance, created = Attendance.objects.update_or_create(
                student_id=student_id,
                date=date_str,
                defaults={
                    'status': status_val,
                    'class_obj_id': class_id,
                    'tenant': request.user.tenant,
                    'marked_by': request.user,
                }
            )
            
            if created:
                created_count += 1
            else:
                updated_count += 1
        
        return Response({
            'message': f'Attendance marked: {created_count} created, {updated_count} updated',
            'created': created_count,
            'updated': updated_count
        })


class PeriodAttendanceViewSet(viewsets.ModelViewSet):
    """ViewSet for PeriodAttendance."""
    
    queryset = PeriodAttendance.objects.filter(is_deleted=False)
    serializer_class = PeriodAttendanceSerializer
    permission_classes = [IsAuthenticated, IsTeacher]
    
    def get_queryset(self):
        """Filter by tenant."""
        user = self.request.user
        queryset = self.queryset
        
        if user.tenant:
            queryset = queryset.filter(tenant=user.tenant)
        
        # Filter by date
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        
        return queryset




