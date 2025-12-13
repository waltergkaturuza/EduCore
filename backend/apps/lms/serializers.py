"""
Serializers for LMS app.
"""
from rest_framework import serializers
from .models import Course, Lesson, Quiz, Question, QuizAttempt


class LessonSerializer(serializers.ModelSerializer):
    """Serializer for Lesson."""
    
    class Meta:
        model = Lesson
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class CourseSerializer(serializers.ModelSerializer):
    """Serializer for Course."""
    
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    lessons = LessonSerializer(many=True, read_only=True)
    lesson_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_lesson_count(self, obj):
        return obj.lessons.filter(is_published=True).count()


class QuestionSerializer(serializers.ModelSerializer):
    """Serializer for Question."""
    
    class Meta:
        model = Question
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class QuizSerializer(serializers.ModelSerializer):
    """Serializer for Quiz."""
    
    course_title = serializers.CharField(source='course.title', read_only=True)
    questions = QuestionSerializer(many=True, read_only=True)
    question_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Quiz
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_question_count(self, obj):
        return obj.questions.count()


class QuizAttemptSerializer(serializers.ModelSerializer):
    """Serializer for QuizAttempt."""
    
    student_name = serializers.CharField(source='student.user.full_name', read_only=True)
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    
    class Meta:
        model = QuizAttempt
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'percentage', 'is_passed')



