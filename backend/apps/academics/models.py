"""
Academic models: Academic Years, Terms, Classes, Subjects, Timetable.
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.core.models import BaseModel


class AcademicYear(BaseModel):
    """Academic year (e.g., 2024, 2025)."""
    
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='academic_years')
    name = models.CharField(max_length=50, help_text="e.g., 2024")
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'academic_years'
        unique_together = ['tenant', 'name']
        ordering = ['-start_date']
    
    def __str__(self):
        return f"{self.name} - {self.tenant.name}"


class Term(BaseModel):
    """Academic term within an academic year."""
    
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='terms')
    name = models.CharField(max_length=50, help_text="e.g., Term 1, First Term")
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'terms'
        ordering = ['start_date']
    
    def __str__(self):
        return f"{self.name} - {self.academic_year.name}"


class Subject(BaseModel):
    """Subject taught in the school."""
    
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='subjects')
    code = models.CharField(max_length=20)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    is_core = models.BooleanField(default=True, help_text="Core subject (required)")
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'subjects'
        unique_together = ['tenant', 'code']
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.code})"


class Class(BaseModel):
    """Class/Grade level (e.g., Form 1, Grade 7)."""
    
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='classes')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='classes')
    name = models.CharField(max_length=50, help_text="e.g., Form 1, Grade 7")
    level = models.IntegerField(help_text="Numeric level for ordering")
    capacity = models.IntegerField(default=40, validators=[MinValueValidator(1)])
    class_teacher = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='classes_taught',
        limit_choices_to={'role': 'teacher'}
    )
    
    class Meta:
        db_table = 'classes'
        unique_together = ['tenant', 'academic_year', 'name']
        ordering = ['level', 'name']
        verbose_name_plural = 'Classes'
    
    def __str__(self):
        return f"{self.name} - {self.academic_year.name}"


class Stream(BaseModel):
    """Stream within a class (e.g., Form 1A, Form 1B)."""
    
    class_obj = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='streams')
    name = models.CharField(max_length=50, help_text="e.g., A, B, Science")
    capacity = models.IntegerField(default=40)
    
    class Meta:
        db_table = 'streams'
        unique_together = ['class_obj', 'name']
        ordering = ['name']
    
    def __str__(self):
        return f"{self.class_obj.name} {self.name}"


class TimetableSlot(BaseModel):
    """Timetable slot for a subject in a class/stream."""
    
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='timetable_slots')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='timetable_slots')
    class_obj = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='timetable_slots', null=True, blank=True)
    stream = models.ForeignKey(Stream, on_delete=models.CASCADE, related_name='timetable_slots', null=True, blank=True)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='timetable_slots')
    teacher = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='timetable_slots',
        limit_choices_to={'role': 'teacher'}
    )
    
    # Day and Time
    day_of_week = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(6)],
        help_text="0=Monday, 6=Sunday"
    )
    start_time = models.TimeField()
    end_time = models.TimeField()
    room = models.CharField(max_length=50, blank=True)
    
    class Meta:
        db_table = 'timetable_slots'
        ordering = ['day_of_week', 'start_time']
    
    def __str__(self):
        day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        return f"{day_names[self.day_of_week]} {self.start_time}-{self.end_time} - {self.subject.name}"




