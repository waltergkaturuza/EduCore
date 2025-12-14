"""
Serializers for Attendance app.
"""
from rest_framework import serializers
from .models import Attendance, PeriodAttendance


class AttendanceSerializer(serializers.ModelSerializer):
    """Serializer for Attendance."""
    
    student_name = serializers.CharField(source='student.user.full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    stream_name = serializers.CharField(source='stream.name', read_only=True)
    marked_by_name = serializers.CharField(source='marked_by.full_name', read_only=True)
    
    class Meta:
        model = Attendance
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class PeriodAttendanceSerializer(serializers.ModelSerializer):
    """Serializer for PeriodAttendance."""
    
    student_name = serializers.CharField(source='student.user.full_name', read_only=True)
    subject_name = serializers.CharField(source='timetable_slot.subject.name', read_only=True)
    marked_by_name = serializers.CharField(source='marked_by.full_name', read_only=True)
    
    class Meta:
        model = PeriodAttendance
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')




