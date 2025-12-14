"""
Teacher Module Models
Professional Teaching Workspace - World-Class Specification
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from apps.core.models import BaseModel
import json


# ============================================================================
# 1. TEACHER DASHBOARD METRICS
# ============================================================================

class TeacherDashboardMetrics(BaseModel):
    """Teacher-specific dashboard metrics and widgets."""
    
    teacher = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='dashboard_metrics', limit_choices_to={'role': 'teacher'})
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='teacher_dashboard_metrics')
    
    calculated_at = models.DateTimeField(auto_now=True)
    
    # Today's metrics
    today_classes_count = models.IntegerField(default=0)
    next_class_countdown_minutes = models.IntegerField(null=True, blank=True)
    pending_attendance_count = models.IntegerField(default=0)
    pending_lesson_plans_count = models.IntegerField(default=0)
    pending_assignments_to_mark = models.IntegerField(default=0)
    upcoming_exams_count = models.IntegerField(default=0)
    unread_messages_count = models.IntegerField(default=0)
    announcements_count = models.IntegerField(default=0)
    cpd_reminders_count = models.IntegerField(default=0)
    
    # Smart widgets data (JSON)
    students_at_risk = models.JSONField(default=list, blank=True)
    class_performance_trend = models.JSONField(default=dict, blank=True)
    suggested_remedial_actions = models.JSONField(default=list, blank=True)
    teaching_insights = models.JSONField(default=list, blank=True)
    workload_balance_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # System status
    is_online = models.BooleanField(default=True)
    last_sync_at = models.DateTimeField(null=True, blank=True)
    pending_offline_actions = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'teacher_dashboard_metrics'
        ordering = ['-calculated_at']
        unique_together = ['teacher', 'calculated_at']
    
    def __str__(self):
        return f"Dashboard Metrics - {self.teacher.email} - {self.calculated_at}"


# ============================================================================
# 2. LESSON PLANNER & CURRICULUM MAPPING
# ============================================================================

class LessonPlan(BaseModel):
    """Advanced lesson plan with curriculum mapping."""
    
    teacher = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='lesson_plans', limit_choices_to={'role': 'teacher'})
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='lesson_plans')
    subject = models.ForeignKey('academics.Subject', on_delete=models.CASCADE, related_name='lesson_plans')
    class_obj = models.ForeignKey('academics.Class', on_delete=models.CASCADE, related_name='lesson_plans')
    stream = models.ForeignKey('academics.Stream', on_delete=models.SET_NULL, null=True, blank=True, related_name='lesson_plans')
    academic_year = models.ForeignKey('academics.AcademicYear', on_delete=models.CASCADE, related_name='lesson_plans')
    term = models.ForeignKey('academics.Term', on_delete=models.CASCADE, related_name='lesson_plans', null=True, blank=True)
    
    # Core lesson information
    title = models.CharField(max_length=200)
    topic = models.CharField(max_length=200)
    lesson_number = models.IntegerField(null=True, blank=True)
    
    # Objectives & outcomes
    objectives = models.JSONField(default=list)  # List of learning objectives
    learning_outcomes = models.JSONField(default=list)  # Expected outcomes
    
    # Curriculum mapping
    curriculum_framework = models.CharField(
        max_length=50,
        choices=[
            ('zimsec', 'ZIMSEC'),
            ('cambridge', 'Cambridge'),
            ('ib', 'International Baccalaureate'),
            ('custom', 'Custom'),
        ],
        default='zimsec'
    )
    curriculum_topics = models.JSONField(default=list)  # Mapped curriculum topics
    syllabus_reference = models.CharField(max_length=200, blank=True)
    
    # Bloom's taxonomy
    blooms_taxonomy_level = models.CharField(
        max_length=50,
        choices=[
            ('remember', 'Remember'),
            ('understand', 'Understand'),
            ('apply', 'Apply'),
            ('analyze', 'Analyze'),
            ('evaluate', 'Evaluate'),
            ('create', 'Create'),
        ],
        default='understand'
    )
    
    # Teaching methods
    teaching_methods = models.JSONField(default=list)  # ['lecture', 'group_work', 'practical', etc.]
    teaching_aids = models.JSONField(default=list)  # List of teaching aids needed
    activities = models.JSONField(default=list)  # Planned activities
    
    # Duration
    planned_duration_minutes = models.IntegerField(validators=[MinValueValidator(1)])
    actual_duration_minutes = models.IntegerField(null=True, blank=True)
    
    # Linkages
    linked_homework = models.ForeignKey('assessments.Assignment', on_delete=models.SET_NULL, null=True, blank=True, related_name='linked_lesson_plans')
    linked_assessments = models.ManyToManyField('assessments.Assignment', blank=True, related_name='linked_lessons')
    
    # AI suggestions (stored as JSON)
    ai_suggested_objectives = models.JSONField(default=list, blank=True)
    ai_suggested_activities = models.JSONField(default=list, blank=True)
    ai_suggested_assessments = models.JSONField(default=list, blank=True)
    
    # Lesson lifecycle
    status = models.CharField(
        max_length=20,
        choices=[
            ('draft', 'Draft'),
            ('scheduled', 'Scheduled'),
            ('delivered', 'Delivered'),
            ('reviewed', 'Reviewed'),
        ],
        default='draft'
    )
    
    # Scheduling
    scheduled_date = models.DateField(null=True, blank=True)
    scheduled_time = models.TimeField(null=True, blank=True)
    delivered_date = models.DateField(null=True, blank=True)
    delivered_time = models.TimeField(null=True, blank=True)
    
    # Teacher reflection
    teacher_reflection = models.TextField(blank=True)
    lesson_effectiveness_rating = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    student_engagement_score = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(10)]
    )
    
    # Content
    content = models.TextField(blank=True)
    resources = models.JSONField(default=list)  # Links, files, etc.
    notes = models.TextField(blank=True)
    
    # Template reference
    template = models.ForeignKey('LessonTemplate', on_delete=models.SET_NULL, null=True, blank=True, related_name='lesson_plans')
    
    class Meta:
        db_table = 'lesson_plans'
        ordering = ['-scheduled_date', '-scheduled_time']
        indexes = [
            models.Index(fields=['teacher', 'status']),
            models.Index(fields=['subject', 'class_obj']),
            models.Index(fields=['scheduled_date']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.subject.name} - {self.class_obj.name}"


class LessonTemplate(BaseModel):
    """Reusable lesson plan templates."""
    
    teacher = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='lesson_templates', null=True, blank=True, limit_choices_to={'role': 'teacher'})
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='lesson_templates')
    subject = models.ForeignKey('academics.Subject', on_delete=models.CASCADE, related_name='lesson_templates', null=True, blank=True)
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Template structure (same as LessonPlan but as template)
    default_objectives = models.JSONField(default=list)
    default_teaching_methods = models.JSONField(default=list)
    default_activities = models.JSONField(default=list)
    default_blooms_level = models.CharField(max_length=50, blank=True)
    
    # Scope
    is_school_wide = models.BooleanField(default=False)  # If True, available to all teachers in tenant
    is_personal = models.BooleanField(default=True)  # Personal template
    
    usage_count = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'lesson_templates'
        ordering = ['-usage_count', 'name']
    
    def __str__(self):
        return f"{self.name} - {self.teacher.email if self.teacher else 'School-wide'}"


# ============================================================================
# 3. TEACHER ANALYTICS
# ============================================================================

class TeacherAnalytics(BaseModel):
    """Teacher-level performance analytics and insights."""
    
    teacher = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='teacher_analytics', limit_choices_to={'role': 'teacher'})
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='teacher_analytics')
    academic_year = models.ForeignKey('academics.AcademicYear', on_delete=models.CASCADE, related_name='teacher_analytics')
    term = models.ForeignKey('academics.Term', on_delete=models.CASCADE, related_name='teacher_analytics', null=True, blank=True)
    
    calculated_at = models.DateTimeField(auto_now=True)
    
    # Student analytics (JSON)
    individual_learning_trajectories = models.JSONField(default=dict, blank=True)
    topic_mastery_heatmap = models.JSONField(default=dict, blank=True)
    weakness_identification = models.JSONField(default=list, blank=True)
    growth_vs_baseline = models.JSONField(default=dict, blank=True)
    
    # Class analytics (JSON)
    pass_fail_distribution = models.JSONField(default=dict, blank=True)
    subject_difficulty_index = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    attendance_performance_correlation = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    gender_performance_insights = models.JSONField(default=dict, blank=True)
    
    # Teacher self-analytics
    lesson_completion_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    assessment_turnaround_hours = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    class_improvement_trend = models.JSONField(default=dict, blank=True)
    peer_benchmarking = models.JSONField(default=dict, blank=True)  # Anonymous comparison
    
    class Meta:
        db_table = 'teacher_analytics'
        ordering = ['-calculated_at']
    
    def __str__(self):
        return f"Analytics - {self.teacher.email} - {self.academic_year.name}"


# ============================================================================
# 4. CPD & PROFESSIONAL GROWTH
# ============================================================================

class CPDRecord(BaseModel):
    """Continuing Professional Development record."""
    
    teacher = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='cpd_records', limit_choices_to={'role': 'teacher'})
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='cpd_records')
    
    # CPD details
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    cpd_type = models.CharField(
        max_length=50,
        choices=[
            ('internal_training', 'Internal Training'),
            ('external_course', 'External Course'),
            ('workshop', 'Workshop'),
            ('conference', 'Conference'),
            ('online_course', 'Online Course'),
            ('certification', 'Certification'),
            ('mentorship', 'Mentorship'),
            ('other', 'Other'),
        ]
    )
    
    # Dates
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    completion_date = models.DateField(null=True, blank=True)
    
    # Points & credits
    cpd_points = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    hours = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Provider
    provider = models.CharField(max_length=200, blank=True)
    provider_type = models.CharField(
        max_length=50,
        choices=[
            ('school', 'School'),
            ('external', 'External'),
            ('online', 'Online Platform'),
        ],
        default='school'
    )
    
    # Certification
    certificate_file = models.FileField(upload_to='cpd_certificates/', null=True, blank=True)
    certificate_number = models.CharField(max_length=100, blank=True)
    is_verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_cpd_records')
    verified_at = models.DateTimeField(null=True, blank=True)
    
    # Skills & competencies
    skills_gained = models.JSONField(default=list)  # List of skills
    competencies_addressed = models.JSONField(default=list)
    
    # Integration
    linked_to_appraisal = models.BooleanField(default=False)
    appraisal_id = models.IntegerField(null=True, blank=True)  # Reference to StaffAppraisal
    
    class Meta:
        db_table = 'cpd_records'
        ordering = ['-completion_date', '-start_date']
    
    def __str__(self):
        return f"{self.title} - {self.teacher.email} - {self.cpd_points} points"


# ============================================================================
# 5. OFFLINE SYNC & MOBILE SUPPORT
# ============================================================================

class OfflineSync(BaseModel):
    """Offline sync tracking for teacher mobile app."""
    
    teacher = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='offline_syncs', limit_choices_to={'role': 'teacher'})
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='offline_syncs')
    
    # Sync status
    last_sync_at = models.DateTimeField(null=True, blank=True)
    last_successful_sync_at = models.DateTimeField(null=True, blank=True)
    sync_status = models.CharField(
        max_length=20,
        choices=[
            ('synced', 'Synced'),
            ('pending', 'Pending'),
            ('conflict', 'Conflict'),
            ('error', 'Error'),
        ],
        default='synced'
    )
    
    # Pending actions
    pending_actions = models.JSONField(default=list)  # List of actions to sync
    conflict_resolutions = models.JSONField(default=list)  # Resolved conflicts
    
    # Device info
    device_id = models.CharField(max_length=200, blank=True)
    device_type = models.CharField(max_length=50, blank=True)  # 'mobile', 'tablet', etc.
    app_version = models.CharField(max_length=50, blank=True)
    
    class Meta:
        db_table = 'offline_syncs'
        ordering = ['-last_sync_at']
        unique_together = ['teacher', 'device_id']
    
    def __str__(self):
        return f"Sync - {self.teacher.email} - {self.sync_status}"


# ============================================================================
# 6. TEACHER RESOURCES & COLLABORATION
# ============================================================================

class TeacherResource(BaseModel):
    """Shared teaching resources."""
    
    teacher = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='shared_resources', limit_choices_to={'role': 'teacher'})
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='teacher_resources')
    subject = models.ForeignKey('academics.Subject', on_delete=models.CASCADE, related_name='teacher_resources', null=True, blank=True)
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    resource_type = models.CharField(
        max_length=50,
        choices=[
            ('lesson_plan', 'Lesson Plan'),
            ('worksheet', 'Worksheet'),
            ('presentation', 'Presentation'),
            ('video', 'Video'),
            ('assessment', 'Assessment'),
            ('activity', 'Activity'),
            ('other', 'Other'),
        ]
    )
    
    file = models.FileField(upload_to='teacher_resources/', null=True, blank=True)
    url = models.URLField(blank=True)
    
    # Sharing
    is_public = models.BooleanField(default=False)  # Available to all teachers in tenant
    shared_with = models.ManyToManyField('users.User', blank=True, related_name='shared_resources_received')
    
    # Metadata
    tags = models.JSONField(default=list)
    grade_levels = models.JSONField(default=list)
    
    # Engagement
    download_count = models.IntegerField(default=0)
    rating_average = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    rating_count = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'teacher_resources'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.teacher.email}"


class TeacherCommunity(BaseModel):
    """Teacher community groups and discussions."""
    
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='teacher_communities')
    subject = models.ForeignKey('academics.Subject', on_delete=models.CASCADE, related_name='teacher_communities', null=True, blank=True)
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    community_type = models.CharField(
        max_length=50,
        choices=[
            ('subject', 'Subject Community'),
            ('grade_level', 'Grade Level'),
            ('general', 'General Discussion'),
            ('mentorship', 'Mentorship Group'),
        ],
        default='general'
    )
    
    members = models.ManyToManyField('users.User', related_name='teacher_communities', limit_choices_to={'role': 'teacher'})
    moderators = models.ManyToManyField('users.User', blank=True, related_name='moderated_communities', limit_choices_to={'role': 'teacher'})
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'teacher_communities'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} - {self.tenant.name}"


# ============================================================================
# 7. CLASS STREAM & ANNOUNCEMENTS (Google Classroom-like)
# ============================================================================

class ClassTopic(BaseModel):
    """Topics/Categories for organizing classwork (like Google Classroom)."""
    
    class_obj = models.ForeignKey('academics.Class', on_delete=models.CASCADE, related_name='topics')
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='class_topics')
    
    name = models.CharField(max_length=100)
    order = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'class_topics'
        ordering = ['order', 'name']
        unique_together = ['class_obj', 'name']
    
    def __str__(self):
        return f"{self.name} - {self.class_obj.name}"


class ClassPost(BaseModel):
    """Class posts for Stream and Classwork (announcements, assignments, materials, questions)."""
    
    POST_TYPE_CHOICES = [
        ('announcement', 'Announcement'),
        ('assignment', 'Assignment'),
        ('quiz', 'Quiz'),
        ('question', 'Question'),
        ('material', 'Material'),
        ('reused_post', 'Reused Post'),
    ]
    
    class_obj = models.ForeignKey('academics.Class', on_delete=models.CASCADE, related_name='posts')
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='class_posts')
    teacher = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='class_posts', limit_choices_to={'role': 'teacher'})
    subject = models.ForeignKey('academics.Subject', on_delete=models.CASCADE, related_name='class_posts', null=True, blank=True)
    topic = models.ForeignKey(ClassTopic, on_delete=models.SET_NULL, null=True, blank=True, related_name='posts')
    
    post_type = models.CharField(max_length=20, choices=POST_TYPE_CHOICES, default='announcement')
    
    # Content
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    attachments = models.JSONField(default=list)  # List of file URLs/IDs
    
    # Linked items (for assignment, quiz, question, material)
    linked_assignment = models.ForeignKey('assessments.Assignment', on_delete=models.SET_NULL, null=True, blank=True, related_name='class_posts')
    linked_quiz = models.ForeignKey('ClassQuiz', on_delete=models.SET_NULL, null=True, blank=True, related_name='class_posts')
    linked_question = models.ForeignKey('ClassQuestion', on_delete=models.SET_NULL, null=True, blank=True, related_name='class_posts')
    
    # Scheduling
    scheduled_time = models.DateTimeField(null=True, blank=True)  # For scheduled posts
    is_draft = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    
    # Reuse
    reused_from = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='reused_posts')
    is_reused = models.BooleanField(default=False)
    
    # Engagement
    comment_count = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'class_posts'
        ordering = ['-published_at', '-created_at']
        indexes = [
            models.Index(fields=['class_obj', 'post_type']),
            models.Index(fields=['teacher', 'is_draft']),
            models.Index(fields=['scheduled_time']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.class_obj.name}"


class ClassQuestion(BaseModel):
    """Questions for class discussions (short answer, multiple choice)."""
    
    QUESTION_TYPE_CHOICES = [
        ('short_answer', 'Short Answer'),
        ('multiple_choice', 'Multiple Choice'),
    ]
    
    post = models.OneToOneField(ClassPost, on_delete=models.CASCADE, related_name='question')
    class_obj = models.ForeignKey('academics.Class', on_delete=models.CASCADE, related_name='questions')
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='class_questions')
    teacher = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='class_questions', limit_choices_to={'role': 'teacher'})
    
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPE_CHOICES, default='short_answer')
    question_text = models.TextField()
    
    # For multiple choice
    options = models.JSONField(default=list)  # List of option strings
    correct_answer = models.CharField(max_length=200, blank=True)  # For multiple choice, the correct option index/string
    
    # Settings
    is_required = models.BooleanField(default=True)
    due_date = models.DateTimeField(null=True, blank=True)
    points = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Responses tracking
    response_count = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'class_questions'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.question_text[:50]}... - {self.class_obj.name}"


class QuestionResponse(BaseModel):
    """Student response to a class question."""
    
    question = models.ForeignKey(ClassQuestion, on_delete=models.CASCADE, related_name='responses')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='question_responses')
    
    answer = models.TextField()
    is_correct = models.BooleanField(null=True, blank=True)  # For multiple choice auto-grading
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    graded_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='graded_question_responses')
    
    class Meta:
        db_table = 'question_responses'
        unique_together = ['question', 'student']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.student.user.full_name} - {self.question.question_text[:30]}..."


class ClassQuiz(BaseModel):
    """Quizzes with auto-grading (Google Classroom Quiz-like)."""
    
    post = models.OneToOneField(ClassPost, on_delete=models.CASCADE, related_name='quiz')
    class_obj = models.ForeignKey('academics.Class', on_delete=models.CASCADE, related_name='quizzes')
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='class_quizzes')
    teacher = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='class_quizzes', limit_choices_to={'role': 'teacher'})
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Quiz settings
    due_date = models.DateTimeField(null=True, blank=True)
    time_limit_minutes = models.IntegerField(null=True, blank=True)
    max_attempts = models.IntegerField(default=1)
    shuffle_questions = models.BooleanField(default=False)
    show_results_immediately = models.BooleanField(default=True)
    allow_retake = models.BooleanField(default=False)
    
    # Scoring
    total_points = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    passing_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Questions (stored as JSON or FK relationship)
    questions = models.JSONField(default=list)  # List of quiz question objects
    
    class Meta:
        db_table = 'class_quizzes'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.class_obj.name}"


class ClassQuizAttempt(BaseModel):
    """Student attempt at a class quiz."""
    
    quiz = models.ForeignKey(ClassQuiz, on_delete=models.CASCADE, related_name='attempts')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='class_quiz_attempts')
    
    attempt_number = models.IntegerField(default=1)
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    
    # Answers (stored as JSON)
    answers = models.JSONField(default=dict)  # {question_id: answer}
    
    # Auto-graded results
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    is_passed = models.BooleanField(null=True, blank=True)
    auto_graded_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'class_quiz_attempts'
        ordering = ['-submitted_at', '-started_at']
        indexes = [
            models.Index(fields=['quiz', 'student', 'attempt_number']),
        ]
    
    def __str__(self):
        return f"{self.student.user.full_name} - {self.quiz.title} - Attempt {self.attempt_number}"


class PostComment(BaseModel):
    """Comments on class posts."""
    
    post = models.ForeignKey(ClassPost, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='post_comments')
    student = models.ForeignKey('students.Student', on_delete=models.SET_NULL, null=True, blank=True, related_name='post_comments')
    
    content = models.TextField()
    is_private = models.BooleanField(default=False)  # Private comment to student
    
    class Meta:
        db_table = 'post_comments'
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.author.full_name} - {self.post.title[:30]}..."


class AssignmentRubric(BaseModel):
    """Rubrics for assignments (Google Classroom-like)."""
    
    assignment = models.ForeignKey('assessments.Assignment', on_delete=models.CASCADE, related_name='rubrics')
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='assignment_rubrics')
    teacher = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='assignment_rubrics', limit_choices_to={'role': 'teacher'})
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Rubric criteria (stored as JSON)
    # Format: [{"criterion": "Clarity", "levels": [{"points": 10, "description": "Excellent"}, ...]}, ...]
    criteria = models.JSONField(default=list)
    
    total_points = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    class Meta:
        db_table = 'assignment_rubrics'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.assignment.title}"


class RubricGrade(BaseModel):
    """Graded rubric for a student submission."""
    
    rubric = models.ForeignKey(AssignmentRubric, on_delete=models.CASCADE, related_name='grades')
    submission = models.ForeignKey('assessments.Submission', on_delete=models.CASCADE, related_name='rubric_grades')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='rubric_grades')
    
    # Selected levels for each criterion (stored as JSON)
    # Format: {"criterion_id": {"level_index": 1, "points": 10, "comment": "..."}, ...}
    grades = models.JSONField(default=dict)
    
    total_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    feedback = models.TextField(blank=True)
    graded_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='graded_rubrics')
    graded_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'rubric_grades'
        unique_together = ['rubric', 'submission']
        ordering = ['-graded_at']
    
    def __str__(self):
        return f"{self.student.user.full_name} - {self.rubric.title} - {self.total_score}"


class ClassCode(BaseModel):
    """Class code for student enrollment (like Google Classroom)."""
    
    class_obj = models.OneToOneField('academics.Class', on_delete=models.CASCADE, related_name='class_code')
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='class_codes')
    
    code = models.CharField(max_length=20, unique=True)
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    max_uses = models.IntegerField(null=True, blank=True)
    use_count = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'class_codes'
        indexes = [
            models.Index(fields=['code', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.code} - {self.class_obj.name}"


class GradeCategory(BaseModel):
    """Grade categories for organizing assessments (e.g., Tests 40%, Assignments 30%, etc.)."""
    
    class_obj = models.ForeignKey('academics.Class', on_delete=models.CASCADE, related_name='grade_categories')
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='grade_categories')
    subject = models.ForeignKey('academics.Subject', on_delete=models.CASCADE, related_name='grade_categories', null=True, blank=True)
    
    name = models.CharField(max_length=100)  # e.g., "Tests", "Assignments", "Projects"
    weight_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Percentage weight for final grade calculation"
    )
    drop_lowest = models.IntegerField(default=0, help_text="Number of lowest scores to drop")
    color = models.CharField(max_length=7, default='#1976d2')  # Hex color for UI
    
    class Meta:
        db_table = 'grade_categories'
        ordering = ['name']
        unique_together = ['class_obj', 'subject', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.weight_percentage}%) - {self.class_obj.name}"


