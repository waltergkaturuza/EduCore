"""
Student models.
"""
from django.db import models
from django.core.validators import RegexValidator
from apps.core.models import BaseModel


class Student(BaseModel):
    """Student model."""
    
    user = models.OneToOneField(
        'users.User',
        on_delete=models.CASCADE,
        related_name='student_profile',
        limit_choices_to={'role': 'student'}
    )
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='students')
    
    # Student Information
    student_id = models.CharField(max_length=50, unique=True, help_text="Unique student ID/registration number")
    admission_number = models.CharField(max_length=50, unique=True, null=True, blank=True)
    admission_date = models.DateField()
    
    # Personal Details
    date_of_birth = models.DateField()
    gender = models.CharField(
        max_length=10,
        choices=[('male', 'Male'), ('female', 'Female')]
    )
    photo = models.ImageField(upload_to='students/photos/', null=True, blank=True)
    
    # Contact
    address = models.TextField(null=True, blank=True)
    phone = models.CharField(
        max_length=20,
        validators=[RegexValidator(regex=r'^\+?263\d{9}$', message="Invalid Zimbabwe phone number")],
        null=True,
        blank=True
    )
    
    # Medical & Special Needs
    medical_conditions = models.TextField(blank=True, help_text="Any medical conditions or allergies")
    special_needs = models.TextField(blank=True, help_text="Special educational needs")
    blood_group = models.CharField(max_length=5, blank=True)
    
    # Academic
    current_class = models.ForeignKey(
        'academics.Class',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students'
    )
    current_stream = models.ForeignKey(
        'academics.Stream',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students'
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('active', 'Active'),
            ('inactive', 'Inactive'),
            ('graduated', 'Graduated'),
            ('transferred', 'Transferred'),
            ('suspended', 'Suspended'),
        ],
        default='active'
    )
    
    class Meta:
        db_table = 'students'
        ordering = ['student_id']
        indexes = [
            models.Index(fields=['student_id']),
            models.Index(fields=['tenant', 'status']),
        ]
    
    def __str__(self):
        return f"{self.user.full_name} ({self.student_id})"


class Guardian(BaseModel):
    """Parent/Guardian model."""
    
    user = models.OneToOneField(
        'users.User',
        on_delete=models.CASCADE,
        related_name='guardian_profile',
        limit_choices_to={'role': 'parent'}
    )
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='guardians')
    
    # Relationship
    relationship = models.CharField(
        max_length=50,
        choices=[
            ('father', 'Father'),
            ('mother', 'Mother'),
            ('guardian', 'Guardian'),
            ('other', 'Other'),
        ]
    )
    
    # Contact
    phone = models.CharField(
        max_length=20,
        validators=[RegexValidator(regex=r'^\+?263\d{9}$', message="Invalid Zimbabwe phone number")]
    )
    email = models.EmailField(null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    occupation = models.CharField(max_length=100, blank=True)
    
    # Emergency Contact
    is_emergency_contact = models.BooleanField(default=False)
    is_primary_contact = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'guardians'
    
    def __str__(self):
        return f"{self.user.full_name} ({self.relationship})"


class StudentGuardian(BaseModel):
    """Relationship between Student and Guardian."""
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='guardians')
    guardian = models.ForeignKey(Guardian, on_delete=models.CASCADE, related_name='students')
    relationship = models.CharField(
        max_length=50,
        choices=[
            ('father', 'Father'),
            ('mother', 'Mother'),
            ('guardian', 'Guardian'),
            ('other', 'Other'),
        ]
    )
    is_primary = models.BooleanField(default=False)
    is_emergency = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'student_guardians'
        unique_together = ['student', 'guardian']
    
    def __str__(self):
        return f"{self.student.user.full_name} - {self.guardian.user.full_name}"


class Enrollment(BaseModel):
    """Student enrollment in a class/stream for an academic year."""
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='enrollments')
    academic_year = models.ForeignKey('academics.AcademicYear', on_delete=models.CASCADE, related_name='enrollments')
    class_obj = models.ForeignKey('academics.Class', on_delete=models.CASCADE, related_name='enrollments')
    stream = models.ForeignKey('academics.Stream', on_delete=models.SET_NULL, null=True, blank=True, related_name='enrollments')
    enrollment_date = models.DateField()
    
    class Meta:
        db_table = 'enrollments'
        unique_together = ['student', 'academic_year']
        ordering = ['-enrollment_date']
    
    def __str__(self):
        return f"{self.student.user.full_name} - {self.class_obj.name} ({self.academic_year.name})"



