"""
Serializers for Academics app.
"""
from rest_framework import serializers
from .models import AcademicYear, Term, Subject, Class, Stream, TimetableSlot


class AcademicYearSerializer(serializers.ModelSerializer):
    """Serializer for AcademicYear."""
    
    class Meta:
        model = AcademicYear
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class TermSerializer(serializers.ModelSerializer):
    """Serializer for Term."""
    
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    
    class Meta:
        model = Term
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class SubjectSerializer(serializers.ModelSerializer):
    """Serializer for Subject."""
    
    class Meta:
        model = Subject
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class StreamSerializer(serializers.ModelSerializer):
    """Serializer for Stream."""
    
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    
    class Meta:
        model = Stream
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class ClassSerializer(serializers.ModelSerializer):
    """Serializer for Class."""
    
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    class_teacher_name = serializers.CharField(source='class_teacher.full_name', read_only=True)
    streams = StreamSerializer(many=True, read_only=True)
    
    class Meta:
        model = Class
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class TimetableSlotSerializer(serializers.ModelSerializer):
    """Serializer for TimetableSlot."""
    
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    stream_name = serializers.CharField(source='stream.name', read_only=True)
    day_name = serializers.SerializerMethodField()
    
    class Meta:
        model = TimetableSlot
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_day_name(self, obj):
        day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        return day_names[obj.day_of_week]




