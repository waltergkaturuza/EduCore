"""
Serializers for Students app.
"""
from rest_framework import serializers
from .models import Student, Guardian, StudentGuardian, Enrollment


class StudentSerializer(serializers.ModelSerializer):
    """Serializer for Student."""
    
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    current_class_name = serializers.CharField(source='current_class.name', read_only=True)
    current_stream_name = serializers.CharField(source='current_stream.name', read_only=True)
    
    class Meta:
        model = Student
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'user')


class GuardianSerializer(serializers.ModelSerializer):
    """Serializer for Guardian."""
    
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = Guardian
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'user')


class StudentGuardianSerializer(serializers.ModelSerializer):
    """Serializer for StudentGuardian relationship."""
    
    student_name = serializers.CharField(source='student.user.full_name', read_only=True)
    guardian_name = serializers.CharField(source='guardian.user.full_name', read_only=True)
    
    class Meta:
        model = StudentGuardian
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class EnrollmentSerializer(serializers.ModelSerializer):
    """Serializer for Enrollment."""
    
    student_name = serializers.CharField(source='student.user.full_name', read_only=True)
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    stream_name = serializers.CharField(source='stream.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    
    class Meta:
        model = Enrollment
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')




