"""
Serializers for Teachers app.
"""
from rest_framework import serializers
from .models import (
    TeacherDashboardMetrics, LessonPlan, LessonTemplate,
    TeacherAnalytics, CPDRecord, OfflineSync,
    TeacherResource, TeacherCommunity,
    ClassTopic, ClassPost, ClassQuestion, QuestionResponse,
    ClassQuiz, ClassQuizAttempt, PostComment, AssignmentRubric,
    RubricGrade, ClassCode, GradeCategory
)


# ============================================================================
# 1. TEACHER DASHBOARD METRICS
# ============================================================================

class TeacherDashboardMetricsSerializer(serializers.ModelSerializer):
    """Serializer for Teacher Dashboard Metrics."""
    
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    teacher_email = serializers.CharField(source='teacher.email', read_only=True)
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    
    class Meta:
        model = TeacherDashboardMetrics
        fields = [
            'id', 'teacher', 'teacher_name', 'teacher_email', 'tenant', 'tenant_name',
            'calculated_at', 'today_classes_count', 'next_class_countdown_minutes',
            'pending_attendance_count', 'pending_lesson_plans_count',
            'pending_assignments_to_mark', 'upcoming_exams_count',
            'unread_messages_count', 'announcements_count', 'cpd_reminders_count',
            'students_at_risk', 'class_performance_trend', 'suggested_remedial_actions',
            'teaching_insights', 'workload_balance_score', 'is_online',
            'last_sync_at', 'pending_offline_actions', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'calculated_at', 'created_at', 'updated_at')


# ============================================================================
# 2. LESSON PLANNER
# ============================================================================

class LessonPlanSerializer(serializers.ModelSerializer):
    """Serializer for Lesson Plan."""
    
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    teacher_email = serializers.CharField(source='teacher.email', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    stream_name = serializers.CharField(source='stream.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    term_name = serializers.CharField(source='term.name', read_only=True)
    linked_homework_title = serializers.CharField(source='linked_homework.title', read_only=True)
    
    class Meta:
        model = LessonPlan
        fields = [
            'id', 'teacher', 'teacher_name', 'teacher_email', 'tenant', 'subject', 'subject_name',
            'class_obj', 'class_name', 'stream', 'stream_name', 'academic_year', 'academic_year_name',
            'term', 'term_name', 'title', 'topic', 'lesson_number', 'objectives', 'learning_outcomes',
            'curriculum_framework', 'curriculum_topics', 'syllabus_reference', 'blooms_taxonomy_level',
            'teaching_methods', 'teaching_aids', 'activities', 'planned_duration_minutes',
            'actual_duration_minutes', 'linked_homework', 'linked_homework_title',
            'linked_assessments', 'ai_suggested_objectives', 'ai_suggested_activities',
            'ai_suggested_assessments', 'status', 'scheduled_date', 'scheduled_time',
            'delivered_date', 'delivered_time', 'teacher_reflection', 'lesson_effectiveness_rating',
            'student_engagement_score', 'content', 'resources', 'notes', 'template',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')


class LessonTemplateSerializer(serializers.ModelSerializer):
    """Serializer for Lesson Template."""
    
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    
    class Meta:
        model = LessonTemplate
        fields = [
            'id', 'teacher', 'teacher_name', 'tenant', 'tenant_name', 'subject', 'subject_name',
            'name', 'description', 'default_objectives', 'default_teaching_methods',
            'default_activities', 'default_blooms_level', 'is_school_wide', 'is_personal',
            'usage_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'usage_count', 'created_at', 'updated_at')


# ============================================================================
# 3. TEACHER ANALYTICS
# ============================================================================

class TeacherAnalyticsSerializer(serializers.ModelSerializer):
    """Serializer for Teacher Analytics."""
    
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    teacher_email = serializers.CharField(source='teacher.email', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    term_name = serializers.CharField(source='term.name', read_only=True)
    
    class Meta:
        model = TeacherAnalytics
        fields = [
            'id', 'teacher', 'teacher_name', 'teacher_email', 'tenant', 'academic_year',
            'academic_year_name', 'term', 'term_name', 'calculated_at',
            'individual_learning_trajectories', 'topic_mastery_heatmap', 'weakness_identification',
            'growth_vs_baseline', 'pass_fail_distribution', 'subject_difficulty_index',
            'attendance_performance_correlation', 'gender_performance_insights',
            'lesson_completion_rate', 'assessment_turnaround_hours', 'class_improvement_trend',
            'peer_benchmarking', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'calculated_at', 'created_at', 'updated_at')


# ============================================================================
# 4. CPD RECORDS
# ============================================================================

class CPDRecordSerializer(serializers.ModelSerializer):
    """Serializer for CPD Record."""
    
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    teacher_email = serializers.CharField(source='teacher.email', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.get_full_name', read_only=True)
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    
    class Meta:
        model = CPDRecord
        fields = [
            'id', 'teacher', 'teacher_name', 'teacher_email', 'tenant', 'tenant_name',
            'title', 'description', 'cpd_type', 'start_date', 'end_date', 'completion_date',
            'cpd_points', 'hours', 'provider', 'provider_type', 'certificate_file',
            'certificate_number', 'is_verified', 'verified_by', 'verified_by_name',
            'verified_at', 'skills_gained', 'competencies_addressed', 'linked_to_appraisal',
            'appraisal_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'verified_at', 'created_at', 'updated_at')


# ============================================================================
# 5. OFFLINE SYNC
# ============================================================================

class OfflineSyncSerializer(serializers.ModelSerializer):
    """Serializer for Offline Sync."""
    
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    teacher_email = serializers.CharField(source='teacher.email', read_only=True)
    
    class Meta:
        model = OfflineSync
        fields = [
            'id', 'teacher', 'teacher_name', 'teacher_email', 'tenant',
            'last_sync_at', 'last_successful_sync_at', 'sync_status',
            'pending_actions', 'conflict_resolutions', 'device_id', 'device_type',
            'app_version', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')


# ============================================================================
# 6. TEACHER RESOURCES
# ============================================================================

class TeacherResourceSerializer(serializers.ModelSerializer):
    """Serializer for Teacher Resource."""
    
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    teacher_email = serializers.CharField(source='teacher.email', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    shared_with_names = serializers.SerializerMethodField()
    
    class Meta:
        model = TeacherResource
        fields = [
            'id', 'teacher', 'teacher_name', 'teacher_email', 'tenant', 'subject', 'subject_name',
            'title', 'description', 'resource_type', 'file', 'url', 'is_public', 'shared_with',
            'shared_with_names', 'tags', 'grade_levels', 'download_count', 'rating_average',
            'rating_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'download_count', 'rating_average', 'rating_count', 'created_at', 'updated_at')
    
    def get_shared_with_names(self, obj):
        return [user.get_full_name() for user in obj.shared_with.all()]


# ============================================================================
# 7. TEACHER COMMUNITY
# ============================================================================

class TeacherCommunitySerializer(serializers.ModelSerializer):
    """Serializer for Teacher Community."""
    
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    members_count = serializers.SerializerMethodField()
    moderators_count = serializers.SerializerMethodField()
    
    class Meta:
        model = TeacherCommunity
        fields = [
            'id', 'tenant', 'tenant_name', 'subject', 'subject_name', 'name', 'description',
            'community_type', 'members', 'moderators', 'members_count', 'moderators_count',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_members_count(self, obj):
        return obj.members.count()
    
    def get_moderators_count(self, obj):
        return obj.moderators.count()


# ============================================================================
# 8. CLASS STREAM & ANNOUNCEMENTS (Google Classroom-like)
# ============================================================================

class ClassTopicSerializer(serializers.ModelSerializer):
    """Serializer for Class Topic."""
    
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    
    class Meta:
        model = ClassTopic
        fields = [
            'id', 'class_obj', 'class_name', 'tenant', 'name', 'order',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')


class ClassPostSerializer(serializers.ModelSerializer):
    """Serializer for Class Post."""
    
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    teacher_email = serializers.CharField(source='teacher.email', read_only=True)
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    
    class Meta:
        model = ClassPost
        fields = [
            'id', 'class_obj', 'class_name', 'tenant', 'teacher', 'teacher_name',
            'teacher_email', 'subject', 'subject_name', 'topic', 'topic_name',
            'post_type', 'title', 'description', 'attachments', 'linked_assignment',
            'linked_quiz', 'linked_question', 'scheduled_time', 'is_draft',
            'published_at', 'reused_from', 'is_reused', 'comment_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'published_at', 'comment_count', 'created_at', 'updated_at')


class ClassQuestionSerializer(serializers.ModelSerializer):
    """Serializer for Class Question."""
    
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    response_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = ClassQuestion
        fields = [
            'id', 'post', 'class_obj', 'class_name', 'tenant', 'teacher', 'teacher_name',
            'question_type', 'question_text', 'options', 'correct_answer', 'is_required',
            'due_date', 'points', 'response_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'response_count', 'created_at', 'updated_at')


class QuestionResponseSerializer(serializers.ModelSerializer):
    """Serializer for Question Response."""
    
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    question_text = serializers.CharField(source='question.question_text', read_only=True)
    
    class Meta:
        model = QuestionResponse
        fields = [
            'id', 'question', 'question_text', 'student', 'student_name',
            'answer', 'is_correct', 'score', 'graded_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')


class ClassQuizSerializer(serializers.ModelSerializer):
    """Serializer for Class Quiz."""
    
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    attempts_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ClassQuiz
        fields = [
            'id', 'post', 'class_obj', 'class_name', 'tenant', 'teacher', 'teacher_name',
            'title', 'description', 'due_date', 'time_limit_minutes', 'max_attempts',
            'shuffle_questions', 'show_results_immediately', 'allow_retake',
            'total_points', 'passing_score', 'questions', 'attempts_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'attempts_count', 'created_at', 'updated_at')
    
    def get_attempts_count(self, obj):
        return obj.attempts.count()


class ClassQuizAttemptSerializer(serializers.ModelSerializer):
    """Serializer for Class Quiz Attempt."""
    
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    
    class Meta:
        model = ClassQuizAttempt
        fields = [
            'id', 'quiz', 'quiz_title', 'student', 'student_name', 'attempt_number',
            'started_at', 'submitted_at', 'is_completed', 'answers', 'score',
            'percentage', 'is_passed', 'auto_graded_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'started_at', 'auto_graded_at', 'created_at', 'updated_at')


class PostCommentSerializer(serializers.ModelSerializer):
    """Serializer for Post Comment."""
    
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    author_email = serializers.CharField(source='author.email', read_only=True)
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    
    class Meta:
        model = PostComment
        fields = [
            'id', 'post', 'author', 'author_name', 'author_email', 'student', 'student_name',
            'content', 'is_private', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')


class AssignmentRubricSerializer(serializers.ModelSerializer):
    """Serializer for Assignment Rubric."""
    
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    assignment_title = serializers.CharField(source='assignment.title', read_only=True)
    
    class Meta:
        model = AssignmentRubric
        fields = [
            'id', 'assignment', 'assignment_title', 'tenant', 'teacher', 'teacher_name',
            'title', 'description', 'criteria', 'total_points', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')


class RubricGradeSerializer(serializers.ModelSerializer):
    """Serializer for Rubric Grade."""
    
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    rubric_title = serializers.CharField(source='rubric.title', read_only=True)
    graded_by_name = serializers.CharField(source='graded_by.get_full_name', read_only=True)
    
    class Meta:
        model = RubricGrade
        fields = [
            'id', 'rubric', 'rubric_title', 'submission', 'student', 'student_name',
            'grades', 'total_score', 'feedback', 'graded_by', 'graded_by_name',
            'graded_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'graded_at', 'created_at', 'updated_at')


class ClassCodeSerializer(serializers.ModelSerializer):
    """Serializer for Class Code."""
    
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    
    class Meta:
        model = ClassCode
        fields = [
            'id', 'class_obj', 'class_name', 'tenant', 'code', 'is_active',
            'expires_at', 'max_uses', 'use_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'code', 'use_count', 'created_at', 'updated_at')


class GradeCategorySerializer(serializers.ModelSerializer):
    """Serializer for Grade Category."""
    
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    
    class Meta:
        model = GradeCategory
        fields = [
            'id', 'class_obj', 'class_name', 'tenant', 'subject', 'subject_name',
            'name', 'weight_percentage', 'drop_lowest', 'color', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')


