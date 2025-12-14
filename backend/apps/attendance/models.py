"""
Attendance models.
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.core.models import BaseModel


class Attendance(BaseModel):
    """Daily attendance record for a student."""
    
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='attendances')
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='attendances')
    academic_year = models.ForeignKey('academics.AcademicYear', on_delete=models.CASCADE, related_name='attendances')
    class_obj = models.ForeignKey('academics.Class', on_delete=models.CASCADE, related_name='attendances')
    stream = models.ForeignKey('academics.Stream', on_delete=models.SET_NULL, null=True, blank=True, related_name='attendances')
    
    date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=[
            ('present', 'Present'),
            ('absent', 'Absent'),
            ('late', 'Late'),
            ('excused', 'Excused'),
        ],
        default='present'
    )
    remarks = models.TextField(blank=True)
    marked_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='marked_attendances',
        limit_choices_to={'role__in': ['admin', 'teacher']}
    )
    
    class Meta:
        db_table = 'attendances'
        unique_together = ['student', 'date']
        ordering = ['-date']
        indexes = [
            models.Index(fields=['student', 'date']),
            models.Index(fields=['tenant', 'date']),
            models.Index(fields=['class_obj', 'date']),
        ]
    
    def __str__(self):
        return f"{self.student.user.full_name} - {self.date} - {self.status}"


class PeriodAttendance(BaseModel):
    """Period-based attendance (for secondary schools with periods)."""
    
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='period_attendances')
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='period_attendances')
    timetable_slot = models.ForeignKey('academics.TimetableSlot', on_delete=models.CASCADE, related_name='period_attendances')
    
    date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=[
            ('present', 'Present'),
            ('absent', 'Absent'),
            ('late', 'Late'),
            ('excused', 'Excused'),
        ],
        default='present'
    )
    remarks = models.TextField(blank=True)
    marked_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='marked_period_attendances',
        limit_choices_to={'role__in': ['admin', 'teacher']}
    )
    
    class Meta:
        db_table = 'period_attendances'
        unique_together = ['student', 'timetable_slot', 'date']
        ordering = ['-date', 'timetable_slot__start_time']
    
    def __str__(self):
        return f"{self.student.user.full_name} - {self.timetable_slot.subject.name} - {self.date}"




