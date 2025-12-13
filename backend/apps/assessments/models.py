"""
Assessment models: Assignments, Grades, Report Cards.
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.core.models import BaseModel


class Assignment(BaseModel):
    """Assignment/Homework."""
    
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='assignments')
    academic_year = models.ForeignKey('academics.AcademicYear', on_delete=models.CASCADE, related_name='assignments')
    term = models.ForeignKey('academics.Term', on_delete=models.CASCADE, related_name='assignments', null=True, blank=True)
    subject = models.ForeignKey('academics.Subject', on_delete=models.CASCADE, related_name='assignments')
    class_obj = models.ForeignKey('academics.Class', on_delete=models.CASCADE, related_name='assignments')
    stream = models.ForeignKey('academics.Stream', on_delete=models.SET_NULL, null=True, blank=True, related_name='assignments')
    teacher = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='assignments',
        limit_choices_to={'role': 'teacher'}
    )
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    due_date = models.DateTimeField()
    max_score = models.DecimalField(max_digits=5, decimal_places=2, default=100.00)
    attachment = models.FileField(upload_to='assignments/', null=True, blank=True)
    
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'assignments'
        ordering = ['-due_date']
    
    def __str__(self):
        return f"{self.title} - {self.subject.name}"


class Submission(BaseModel):
    """Student submission for an assignment."""
    
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='submissions')
    
    content = models.TextField(blank=True)
    attachment = models.FileField(upload_to='submissions/', null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    is_submitted = models.BooleanField(default=False)
    
    # Grading
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    feedback = models.TextField(blank=True)
    graded_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='graded_submissions',
        limit_choices_to={'role__in': ['admin', 'teacher']}
    )
    graded_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'submissions'
        unique_together = ['assignment', 'student']
        ordering = ['-submitted_at']
    
    def __str__(self):
        return f"{self.student.user.full_name} - {self.assignment.title}"


class Assessment(BaseModel):
    """Assessment/Test/Exam."""
    
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='assessments')
    academic_year = models.ForeignKey('academics.AcademicYear', on_delete=models.CASCADE, related_name='assessments')
    term = models.ForeignKey('academics.Term', on_delete=models.CASCADE, related_name='assessments', null=True, blank=True)
    subject = models.ForeignKey('academics.Subject', on_delete=models.CASCADE, related_name='assessments')
    class_obj = models.ForeignKey('academics.Class', on_delete=models.CASCADE, related_name='assessments')
    stream = models.ForeignKey('academics.Stream', on_delete=models.SET_NULL, null=True, blank=True, related_name='assessments')
    
    name = models.CharField(max_length=200)
    assessment_type = models.CharField(
        max_length=50,
        choices=[
            ('test', 'Test'),
            ('quiz', 'Quiz'),
            ('exam', 'Exam'),
            ('project', 'Project'),
            ('other', 'Other'),
        ],
        default='test'
    )
    date = models.DateField()
    max_score = models.DecimalField(max_digits=5, decimal_places=2, default=100.00)
    weight = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        help_text="Weight percentage for final grade calculation"
    )
    
    class Meta:
        db_table = 'assessments'
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.name} - {self.subject.name}"


class Grade(BaseModel):
    """Grade/Score for an assessment."""
    
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='grades')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='grades')
    
    score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        null=True,
        blank=True
    )
    letter_grade = models.CharField(max_length=5, blank=True, help_text="A, B, C, etc.")
    remarks = models.TextField(blank=True)
    
    entered_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='entered_grades',
        limit_choices_to={'role__in': ['admin', 'teacher']}
    )
    
    class Meta:
        db_table = 'grades'
        unique_together = ['assessment', 'student']
        ordering = ['-assessment__date']
    
    def __str__(self):
        return f"{self.student.user.full_name} - {self.assessment.name} - {self.score}"
    
    def save(self, *args, **kwargs):
        """Calculate percentage and letter grade on save."""
        if self.score and self.assessment.max_score:
            self.percentage = (self.score / self.assessment.max_score) * 100
            
            # Calculate letter grade (simple scale)
            if self.percentage >= 80:
                self.letter_grade = 'A'
            elif self.percentage >= 70:
                self.letter_grade = 'B'
            elif self.percentage >= 60:
                self.letter_grade = 'C'
            elif self.percentage >= 50:
                self.letter_grade = 'D'
            else:
                self.letter_grade = 'F'
        
        super().save(*args, **kwargs)


class ReportCard(BaseModel):
    """Report card for a student in a term."""
    
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='report_cards')
    academic_year = models.ForeignKey('academics.AcademicYear', on_delete=models.CASCADE, related_name='report_cards')
    term = models.ForeignKey('academics.Term', on_delete=models.CASCADE, related_name='report_cards')
    class_obj = models.ForeignKey('academics.Class', on_delete=models.CASCADE, related_name='report_cards')
    
    # Summary
    total_subjects = models.IntegerField(default=0)
    total_score = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    average_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    overall_grade = models.CharField(max_length=5, blank=True)
    position = models.IntegerField(null=True, blank=True)
    total_students = models.IntegerField(null=True, blank=True)
    
    # Comments
    class_teacher_comment = models.TextField(blank=True)
    principal_comment = models.TextField(blank=True)
    
    # Status
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'report_cards'
        unique_together = ['student', 'academic_year', 'term']
        ordering = ['-academic_year', '-term']
    
    def __str__(self):
        return f"{self.student.user.full_name} - {self.term.name} ({self.academic_year.name})"



