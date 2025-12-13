"""
LMS models: Courses, Lessons, Content, Quizzes.
"""
from django.db import models
from apps.core.models import BaseModel


class Course(BaseModel):
    """Course for e-learning."""
    
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='courses')
    academic_year = models.ForeignKey('academics.AcademicYear', on_delete=models.CASCADE, related_name='courses')
    subject = models.ForeignKey('academics.Subject', on_delete=models.CASCADE, related_name='courses')
    class_obj = models.ForeignKey('academics.Class', on_delete=models.CASCADE, related_name='courses')
    stream = models.ForeignKey('academics.Stream', on_delete=models.SET_NULL, null=True, blank=True, related_name='courses')
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    thumbnail = models.ImageField(upload_to='courses/thumbnails/', null=True, blank=True)
    
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'courses'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.subject.name}"


class Lesson(BaseModel):
    """Lesson within a course."""
    
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0, help_text="Order within course")
    
    # Content
    content_type = models.CharField(
        max_length=50,
        choices=[
            ('text', 'Text'),
            ('video', 'Video'),
            ('pdf', 'PDF'),
            ('link', 'External Link'),
        ],
        default='text'
    )
    content = models.TextField(blank=True, help_text="Text content or video URL")
    attachment = models.FileField(upload_to='lessons/attachments/', null=True, blank=True)
    
    is_published = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'lessons'
        ordering = ['order', 'created_at']
    
    def __str__(self):
        return f"{self.title} - {self.course.title}"


class Quiz(BaseModel):
    """Quiz/Test for a course."""
    
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='quizzes')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    max_score = models.DecimalField(max_digits=5, decimal_places=2, default=100.00)
    time_limit = models.IntegerField(null=True, blank=True, help_text="Time limit in minutes")
    passing_score = models.DecimalField(max_digits=5, decimal_places=2, default=50.00)
    
    is_published = models.BooleanField(default=False)
    allow_multiple_attempts = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'quizzes'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.course.title}"


class Question(BaseModel):
    """Question in a quiz."""
    
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(
        max_length=20,
        choices=[
            ('multiple_choice', 'Multiple Choice'),
            ('true_false', 'True/False'),
            ('short_answer', 'Short Answer'),
            ('essay', 'Essay'),
        ],
        default='multiple_choice'
    )
    order = models.IntegerField(default=0)
    points = models.DecimalField(max_digits=5, decimal_places=2, default=1.00)
    
    # For multiple choice
    options = models.JSONField(default=list, help_text="List of options for multiple choice")
    correct_answer = models.TextField(help_text="Correct answer or option index")
    
    class Meta:
        db_table = 'questions'
        ordering = ['order']
    
    def __str__(self):
        return f"{self.question_text[:50]}... - {self.quiz.title}"


class QuizAttempt(BaseModel):
    """Student attempt at a quiz."""
    
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='quiz_attempts')
    
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    is_passed = models.BooleanField(default=False)
    answers = models.JSONField(default=dict, help_text="Student answers as question_id: answer")
    
    class Meta:
        db_table = 'quiz_attempts'
        ordering = ['-started_at']
    
    def __str__(self):
        return f"{self.student.user.full_name} - {self.quiz.title} - {self.score}"



