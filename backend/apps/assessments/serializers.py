"""
Serializers for Assessments app.
"""
from rest_framework import serializers
from .models import Assignment, Submission, Assessment, Grade, ReportCard


class AssignmentSerializer(serializers.ModelSerializer):
    """Serializer for Assignment."""
    
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)
    submission_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Assignment
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_submission_count(self, obj):
        return obj.submissions.filter(is_submitted=True).count()


class SubmissionSerializer(serializers.ModelSerializer):
    """Serializer for Submission."""
    
    student_name = serializers.CharField(source='student.user.full_name', read_only=True)
    assignment_title = serializers.CharField(source='assignment.title', read_only=True)
    graded_by_name = serializers.CharField(source='graded_by.full_name', read_only=True)
    
    class Meta:
        model = Submission
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class AssessmentSerializer(serializers.ModelSerializer):
    """Serializer for Assessment."""
    
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    
    class Meta:
        model = Assessment
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class GradeSerializer(serializers.ModelSerializer):
    """Serializer for Grade."""
    
    student_name = serializers.CharField(source='student.user.full_name', read_only=True)
    assessment_name = serializers.CharField(source='assessment.name', read_only=True)
    entered_by_name = serializers.CharField(source='entered_by.full_name', read_only=True)
    
    class Meta:
        model = Grade
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'percentage', 'letter_grade')


class ReportCardSerializer(serializers.ModelSerializer):
    """Serializer for ReportCard."""
    
    student_name = serializers.CharField(source='student.user.full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    term_name = serializers.CharField(source='term.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    
    class Meta:
        model = ReportCard
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')



