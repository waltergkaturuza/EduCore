"""
Comprehensive School Admin models for world-class school management.
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from decimal import Decimal
from apps.core.models import BaseModel


# ============================================================================
# 1. SCHOOL PROFILE & GOVERNANCE
# ============================================================================

class SchoolProfile(BaseModel):
    """Extended school profile with governance and compliance."""
    
    tenant = models.OneToOneField('tenants.Tenant', on_delete=models.CASCADE, related_name='school_profile')
    
    # Registration & Compliance
    ministry_registration_number = models.CharField(max_length=100, blank=True)
    registration_certificate = models.FileField(upload_to='school/registration/', null=True, blank=True)
    accreditation_status = models.CharField(
        max_length=50,
        choices=[
            ('accredited', 'Accredited'),
            ('provisional', 'Provisional'),
            ('pending', 'Pending'),
            ('suspended', 'Suspended'),
        ],
        default='pending'
    )
    accreditation_expiry = models.DateField(null=True, blank=True)
    
    # Governance Documents
    constitution = models.FileField(upload_to='school/governance/', null=True, blank=True)
    policies = models.JSONField(default=list, help_text="List of policy documents")
    
    # Branding
    logo = models.ImageField(upload_to='school/logo/', null=True, blank=True)
    primary_color = models.CharField(max_length=7, default='#1976D2', help_text="Hex color code")
    secondary_color = models.CharField(max_length=7, default='#424242', help_text="Hex color code")
    letterhead_template = models.FileField(upload_to='school/templates/', null=True, blank=True)
    
    # Digital Signatures
    principal_signature = models.ImageField(upload_to='school/signatures/', null=True, blank=True)
    bursar_signature = models.ImageField(upload_to='school/signatures/', null=True, blank=True)
    
    class Meta:
        db_table = 'school_profiles'
    
    def __str__(self):
        return f"Profile - {self.tenant.name}"


class AcademicConfiguration(BaseModel):
    """Academic configuration and governance settings."""
    
    tenant = models.OneToOneField('tenants.Tenant', on_delete=models.CASCADE, related_name='academic_config')
    
    # Curriculum Framework
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
    
    # Grading System
    grading_system = models.CharField(
        max_length=50,
        choices=[
            ('numeric', 'Numeric (0-100)'),
            ('letter', 'Letter Grades (A-F)'),
            ('gpa', 'GPA (0-4.0)'),
            ('competency', 'Competency-Based'),
        ],
        default='numeric'
    )
    
    # Grading Scale (JSON for flexibility)
    grading_scale = models.JSONField(
        default=dict,
        help_text="Grading scale configuration (e.g., {'A': [80, 100], 'B': [70, 79]})"
    )
    
    # Promotion Rules
    promotion_rules = models.JSONField(
        default=dict,
        help_text="Promotion criteria (e.g., {'min_average': 50, 'max_failures': 2})"
    )
    
    # Subject Weighting
    subject_weights = models.JSONField(
        default=dict,
        help_text="Subject weights for final grade calculation"
    )
    
    # Assessment Rubrics
    assessment_rubrics = models.JSONField(
        default=list,
        help_text="Assessment rubric templates"
    )
    
    # Report Card Approval Workflow
    report_card_approval_required = models.BooleanField(default=True)
    approval_workflow = models.JSONField(
        default=list,
        help_text="Approval workflow steps (e.g., ['teacher', 'hod', 'principal'])"
    )
    
    class Meta:
        db_table = 'academic_configurations'
    
    def __str__(self):
        return f"Academic Config - {self.tenant.name}"


# ============================================================================
# 2. ADMISSIONS PIPELINE (CRM-STYLE)
# ============================================================================

class AdmissionApplication(BaseModel):
    """Admission application with CRM-style pipeline."""
    
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='admission_applications')
    academic_year = models.ForeignKey('academics.AcademicYear', on_delete=models.CASCADE, related_name='admission_applications')
    
    # Applicant Information
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10, choices=[('male', 'Male'), ('female', 'Female')])
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    
    # Application Details
    applied_class = models.ForeignKey('academics.Class', on_delete=models.SET_NULL, null=True, related_name='applications')
    application_number = models.CharField(max_length=50, unique=True)
    application_date = models.DateField(default=timezone.now)
    
    # Pipeline Stage
    stage = models.CharField(
        max_length=50,
        choices=[
            ('application_received', 'Application Received'),
            ('shortlisted', 'Shortlisted'),
            ('interviewed', 'Interviewed'),
            ('accepted', 'Accepted'),
            ('enrolled', 'Enrolled'),
            ('waitlisted', 'Waitlisted'),
            ('rejected', 'Rejected'),
        ],
        default='application_received'
    )
    
    # Documents
    documents = models.JSONField(default=list, help_text="List of uploaded document URLs")
    
    # Interview
    interview_date = models.DateTimeField(null=True, blank=True)
    interview_notes = models.TextField(blank=True)
    interview_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Acceptance
    acceptance_letter_sent = models.BooleanField(default=False)
    acceptance_letter_sent_at = models.DateTimeField(null=True, blank=True)
    enrollment_contract_signed = models.BooleanField(default=False)
    
    # Fee Pre-invoicing
    pre_invoice_created = models.BooleanField(default=False)
    pre_invoice = models.ForeignKey('fees.FeeInvoice', on_delete=models.SET_NULL, null=True, blank=True, related_name='admission_applications')
    
    # Notes & Communication
    notes = models.TextField(blank=True)
    communication_log = models.JSONField(default=list, help_text="Log of emails/SMS sent")
    
    class Meta:
        db_table = 'admission_applications'
        ordering = ['-application_date']
        indexes = [
            models.Index(fields=['tenant', 'stage']),
            models.Index(fields=['academic_year', 'stage']),
        ]
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.application_number}"


# ============================================================================
# 3. ENHANCED STUDENT RECORDS (360° VIEW)
# ============================================================================

class StudentDocument(BaseModel):
    """Digital document vault for students."""
    
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(
        max_length=50,
        choices=[
            ('birth_certificate', 'Birth Certificate'),
            ('id_copy', 'ID Copy'),
            ('medical', 'Medical Records'),
            ('transfer', 'Transfer Certificate'),
            ('certificate', 'Certificate'),
            ('transcript', 'Transcript'),
            ('other', 'Other'),
        ]
    )
    title = models.CharField(max_length=200)
    file = models.FileField(upload_to='students/documents/')
    description = models.TextField(blank=True)
    is_verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_documents'
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'student_documents'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.student.user.full_name} - {self.title}"


class StudentLifecycleEvent(BaseModel):
    """Track student lifecycle events (promotion, transfer, etc.)."""
    
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='lifecycle_events')
    event_type = models.CharField(
        max_length=50,
        choices=[
            ('enrollment', 'Enrollment'),
            ('promotion', 'Promotion'),
            ('demotion', 'Demotion'),
            ('transfer_in', 'Transfer In'),
            ('transfer_out', 'Transfer Out'),
            ('suspension', 'Suspension'),
            ('withdrawal', 'Withdrawal'),
            ('graduation', 'Graduation'),
            ('alumni', 'Alumni Status'),
        ]
    )
    event_date = models.DateField()
    from_class = models.ForeignKey('academics.Class', on_delete=models.SET_NULL, null=True, blank=True, related_name='lifecycle_events_from')
    to_class = models.ForeignKey('academics.Class', on_delete=models.SET_NULL, null=True, blank=True, related_name='lifecycle_events_to')
    reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    performed_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='performed_lifecycle_events'
    )
    
    class Meta:
        db_table = 'student_lifecycle_events'
        ordering = ['-event_date']
    
    def __str__(self):
        return f"{self.student.user.full_name} - {self.event_type} - {self.event_date}"


# ============================================================================
# 4. TIMETABLE ENGINE
# ============================================================================

class TimetableVersion(BaseModel):
    """Multiple timetable versions for a school."""
    
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='timetable_versions')
    academic_year = models.ForeignKey('academics.AcademicYear', on_delete=models.CASCADE, related_name='timetable_versions')
    name = models.CharField(max_length=200, help_text="e.g., Main Timetable, Emergency Timetable")
    version_number = models.IntegerField(default=1)
    is_active = models.BooleanField(default=False)
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    
    # Generation metadata
    generated_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='generated_timetables')
    generation_method = models.CharField(
        max_length=50,
        choices=[
            ('manual', 'Manual'),
            ('ai_assisted', 'AI-Assisted'),
            ('auto', 'Automatic'),
        ],
        default='manual'
    )
    generation_metadata = models.JSONField(default=dict, help_text="AI generation parameters and results")
    
    class Meta:
        db_table = 'timetable_versions'
        unique_together = ['tenant', 'academic_year', 'version_number']
        ordering = ['-version_number']
    
    def __str__(self):
        return f"{self.name} - {self.academic_year.name} (v{self.version_number})"


class TimetableSlotEnhanced(BaseModel):
    """Enhanced timetable slot with versioning and conflict detection."""
    
    timetable_version = models.ForeignKey(TimetableVersion, on_delete=models.CASCADE, related_name='slots')
    slot = models.ForeignKey('academics.TimetableSlot', on_delete=models.CASCADE, related_name='enhanced_slots')
    
    # Conflict detection
    has_conflicts = models.BooleanField(default=False)
    conflict_details = models.JSONField(default=list, help_text="List of conflicts detected")
    
    class Meta:
        db_table = 'timetable_slots_enhanced'
        unique_together = ['timetable_version', 'slot']
    
    def __str__(self):
        return f"{self.slot} - {self.timetable_version.name}"


# ============================================================================
# 5. ENHANCED ATTENDANCE INTELLIGENCE
# ============================================================================

class AttendanceAlert(BaseModel):
    """Automated attendance alerts."""
    
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='attendance_alerts')
    alert_type = models.CharField(
        max_length=50,
        choices=[
            ('chronic_absenteeism', 'Chronic Absenteeism'),
            ('pattern_change', 'Pattern Change'),
            ('unauthorized_absence', 'Unauthorized Absence'),
            ('late_arrival', 'Late Arrival'),
        ]
    )
    severity = models.CharField(
        max_length=20,
        choices=[
            ('low', 'Low'),
            ('medium', 'Medium'),
            ('high', 'High'),
            ('critical', 'Critical'),
        ],
        default='medium'
    )
    message = models.TextField()
    is_sent = models.BooleanField(default=False)
    sent_to = models.JSONField(default=list, help_text="List of recipients (parents, admin)")
    sent_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'attendance_alerts'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.student.user.full_name} - {self.alert_type}"


class AttendanceOfflineSync(BaseModel):
    """Track offline attendance sync operations."""
    
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='offline_attendance_syncs')
    synced_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='synced_attendance')
    sync_date = models.DateTimeField(default=timezone.now)
    records_count = models.IntegerField(default=0)
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('syncing', 'Syncing'),
            ('completed', 'Completed'),
            ('failed', 'Failed'),
        ],
        default='pending'
    )
    error_message = models.TextField(blank=True)
    
    class Meta:
        db_table = 'attendance_offline_syncs'
        ordering = ['-sync_date']
    
    def __str__(self):
        return f"Sync - {self.sync_date} - {self.records_count} records"


# ============================================================================
# 6. EXAM LIFECYCLE & GOVERNANCE
# ============================================================================

class ExamCycle(BaseModel):
    """Exam cycle with lifecycle management."""
    
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='exam_cycles')
    academic_year = models.ForeignKey('academics.AcademicYear', on_delete=models.CASCADE, related_name='exam_cycles')
    term = models.ForeignKey('academics.Term', on_delete=models.CASCADE, related_name='exam_cycles')
    
    name = models.CharField(max_length=200, help_text="e.g., End of Term 1 Exams")
    exam_type = models.CharField(
        max_length=50,
        choices=[
            ('formative', 'Formative'),
            ('summative', 'Summative'),
            ('mid_term', 'Mid-Term'),
            ('final', 'Final'),
        ],
        default='summative'
    )
    
    # Lifecycle
    status = models.CharField(
        max_length=50,
        choices=[
            ('planning', 'Planning'),
            ('scheduled', 'Scheduled'),
            ('in_progress', 'In Progress'),
            ('marking', 'Marking'),
            ('moderation', 'Moderation'),
            ('approved', 'Approved'),
            ('locked', 'Locked'),
            ('published', 'Published'),
        ],
        default='planning'
    )
    
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    
    # Moderation
    moderation_required = models.BooleanField(default=True)
    moderation_status = models.CharField(
        max_length=50,
        choices=[
            ('pending', 'Pending'),
            ('in_progress', 'In Progress'),
            ('approved', 'Approved'),
            ('rejected', 'Rejected'),
        ],
        default='pending'
    )
    moderated_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='moderated_exam_cycles'
    )
    moderated_at = models.DateTimeField(null=True, blank=True)
    
    # Locking
    is_locked = models.BooleanField(default=False)
    locked_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='locked_exam_cycles'
    )
    locked_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'exam_cycles'
        ordering = ['-start_date']
    
    def __str__(self):
        return f"{self.name} - {self.term.name}"


class GradeModeration(BaseModel):
    """Grade moderation workflow."""
    
    grade = models.ForeignKey('assessments.Grade', on_delete=models.CASCADE, related_name='moderations')
    exam_cycle = models.ForeignKey(ExamCycle, on_delete=models.CASCADE, related_name='grade_moderations', null=True, blank=True)
    
    # Moderation stages
    stage = models.CharField(
        max_length=50,
        choices=[
            ('teacher_submitted', 'Teacher Submitted'),
            ('hod_review', 'HOD Review'),
            ('admin_approval', 'Admin Approval'),
            ('principal_approval', 'Principal Approval'),
        ],
        default='teacher_submitted'
    )
    
    original_score = models.DecimalField(max_digits=5, decimal_places=2)
    moderated_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    moderation_reason = models.TextField(blank=True)
    
    moderated_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='moderated_grades'
    )
    moderated_at = models.DateTimeField(null=True, blank=True)
    
    is_approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_grades',
        related_query_name='approved_grade'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'grade_moderations'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Moderation - {self.grade}"


class PostLockGradeChange(BaseModel):
    """Track grade changes after locking (with justification)."""
    
    grade = models.ForeignKey('assessments.Grade', on_delete=models.CASCADE, related_name='post_lock_changes')
    original_score = models.DecimalField(max_digits=5, decimal_places=2)
    new_score = models.DecimalField(max_digits=5, decimal_places=2)
    justification = models.TextField(help_text="Reason for change after lock")
    approved_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='approved_post_lock_changes'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'post_lock_grade_changes'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Post-Lock Change - {self.grade}"


# ============================================================================
# 7. ENHANCED FINANCE & FEES
# ============================================================================

class FeeStructureEnhanced(BaseModel):
    """Enhanced fee structure with complex pricing."""
    
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='enhanced_fee_structures')
    academic_year = models.ForeignKey('academics.AcademicYear', on_delete=models.CASCADE, related_name='enhanced_fee_structures')
    
    name = models.CharField(max_length=200)
    
    # Variable Pricing
    base_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    variable_pricing_rules = models.JSONField(
        default=dict,
        help_text="Rules for variable pricing (e.g., by class, early bird discount)"
    )
    
    # Installments
    allow_installments = models.BooleanField(default=False)
    installment_config = models.JSONField(
        default=dict,
        help_text="Installment configuration (number, frequency, etc.)"
    )
    
    # Scholarships & Waivers
    scholarship_rules = models.JSONField(default=list, help_text="Scholarship eligibility rules")
    waiver_rules = models.JSONField(default=list, help_text="Fee waiver rules")
    
    # Multi-currency
    currency = models.CharField(max_length=3, default='USD', help_text="ISO currency code")
    exchange_rate = models.DecimalField(max_digits=10, decimal_places=4, default=Decimal('1.0000'))
    
    # Inflation Adjustment
    inflation_adjustment_enabled = models.BooleanField(default=False)
    inflation_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'), help_text="Annual inflation rate %")
    
    # Penalties
    late_payment_penalty = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'), help_text="Percentage")
    penalty_grace_period_days = models.IntegerField(default=7)
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'fee_structures_enhanced'
        ordering = ['-academic_year', 'name']
    
    def __str__(self):
        return f"{self.name} - {self.academic_year.name}"


class PaymentReconciliation(BaseModel):
    """Payment reconciliation records."""
    
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='payment_reconciliations')
    reconciliation_date = models.DateField(default=timezone.now)
    
    # Totals
    expected_amount = models.DecimalField(max_digits=10, decimal_places=2)
    received_amount = models.DecimalField(max_digits=10, decimal_places=2)
    difference = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Breakdown by payment method
    breakdown = models.JSONField(default=dict, help_text="Breakdown by payment method")
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('reconciled', 'Reconciled'),
            ('discrepancy', 'Discrepancy Found'),
        ],
        default='pending'
    )
    
    reconciled_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='reconciled_payments'
    )
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'payment_reconciliations'
        ordering = ['-reconciliation_date']
    
    def __str__(self):
        return f"Reconciliation - {self.reconciliation_date}"


# ============================================================================
# 8. STAFF & HUMAN CAPITAL MANAGEMENT
# ============================================================================

class StaffRecord(BaseModel):
    """Comprehensive staff records."""
    
    user = models.OneToOneField('users.User', on_delete=models.CASCADE, related_name='staff_record')
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='staff_records')
    
    # Employment
    employee_number = models.CharField(max_length=50, unique=True)
    employment_type = models.CharField(
        max_length=50,
        choices=[
            ('full_time', 'Full-Time'),
            ('part_time', 'Part-Time'),
            ('contract', 'Contract'),
            ('volunteer', 'Volunteer'),
        ],
        default='full_time'
    )
    hire_date = models.DateField()
    contract_start = models.DateField(null=True, blank=True)
    contract_end = models.DateField(null=True, blank=True)
    contract_document = models.FileField(upload_to='staff/contracts/', null=True, blank=True)
    
    # Qualifications
    qualifications = models.JSONField(default=list, help_text="List of qualifications")
    certifications = models.JSONField(default=list, help_text="List of certifications")
    
    # Department & Role
    department = models.CharField(max_length=100, blank=True)
    position = models.CharField(max_length=100, blank=True)
    
    # Leave Management
    annual_leave_balance = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
    sick_leave_balance = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
    
    class Meta:
        db_table = 'staff_records'
    
    def __str__(self):
        return f"{self.user.full_name} - {self.employee_number}"


class StaffAppraisal(BaseModel):
    """Staff performance appraisals."""
    
    staff = models.ForeignKey(StaffRecord, on_delete=models.CASCADE, related_name='appraisals')
    appraisal_period = models.CharField(max_length=50, help_text="e.g., Q1 2024, Annual 2024")
    appraisal_date = models.DateField(default=timezone.now)
    
    # Performance Metrics
    attendance_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    lesson_completion_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    student_outcomes_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    parent_feedback_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    overall_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Comments
    supervisor_comments = models.TextField(blank=True)
    employee_comments = models.TextField(blank=True)
    
    # Professional Development
    pd_goals = models.JSONField(default=list, help_text="Professional development goals")
    pd_completed = models.JSONField(default=list, help_text="Completed professional development")
    
    appraised_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='conducted_appraisals'
    )
    
    class Meta:
        db_table = 'staff_appraisals'
        ordering = ['-appraisal_date']
    
    def __str__(self):
        return f"Appraisal - {self.staff.user.full_name} - {self.appraisal_period}"


class LeaveRequest(BaseModel):
    """Staff leave requests."""
    
    staff = models.ForeignKey(StaffRecord, on_delete=models.CASCADE, related_name='leave_requests')
    leave_type = models.CharField(
        max_length=50,
        choices=[
            ('annual', 'Annual Leave'),
            ('sick', 'Sick Leave'),
            ('personal', 'Personal Leave'),
            ('maternity', 'Maternity Leave'),
            ('paternity', 'Paternity Leave'),
            ('unpaid', 'Unpaid Leave'),
        ]
    )
    start_date = models.DateField()
    end_date = models.DateField()
    days_requested = models.DecimalField(max_digits=5, decimal_places=2)
    reason = models.TextField()
    
    # Approval
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('approved', 'Approved'),
            ('rejected', 'Rejected'),
            ('cancelled', 'Cancelled'),
        ],
        default='pending'
    )
    approved_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_leave_requests'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    
    class Meta:
        db_table = 'leave_requests'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Leave - {self.staff.user.full_name} - {self.leave_type}"


# ============================================================================
# 9. EXECUTIVE DASHBOARD METRICS (Cached for Performance)
# ============================================================================

class DashboardMetrics(BaseModel):
    """Cached dashboard metrics for performance."""
    
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='dashboard_metrics')
    calculated_at = models.DateTimeField(default=timezone.now)
    
    # Enrollment Metrics
    total_enrollment = models.IntegerField(default=0)
    enrollment_by_gender = models.JSONField(default=dict)
    enrollment_by_grade = models.JSONField(default=dict)
    enrollment_by_stream = models.JSONField(default=dict)
    
    # Teacher Metrics
    total_teachers = models.IntegerField(default=0)
    active_teachers = models.IntegerField(default=0)
    teacher_utilization_ratio = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
    student_teacher_ratio = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
    
    # Attendance Metrics
    attendance_today = models.IntegerField(default=0)
    attendance_percentage_today = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
    chronic_absenteeism_count = models.IntegerField(default=0)
    chronic_absenteeism_risk_index = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
    
    # Academic Performance
    academic_performance_index = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
    average_grade = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
    
    # Financial Metrics
    fee_collection_today = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    fee_collection_term = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    fee_collection_year = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    fee_collection_vs_target = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'), help_text="Percentage")
    outstanding_fees_30_days = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    outstanding_fees_60_days = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    outstanding_fees_90_days = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    # System Usage
    teachers_active_today = models.IntegerField(default=0)
    parents_active_today = models.IntegerField(default=0)
    students_active_today = models.IntegerField(default=0)
    
    # Compliance Alerts
    missing_marks_count = models.IntegerField(default=0)
    late_attendance_count = models.IntegerField(default=0)
    compliance_alerts = models.JSONField(default=list)
    
    # Predictive Metrics (AI)
    dropout_risk_count = models.IntegerField(default=0)
    exam_failure_prediction = models.JSONField(default=dict)
    teacher_overload_alerts = models.JSONField(default=list)
    revenue_forecast = models.JSONField(default=dict)
    at_risk_students = models.JSONField(default=list)
    
    class Meta:
        db_table = 'dashboard_metrics'
        ordering = ['-calculated_at']
        get_latest_by = 'calculated_at'
    
    def __str__(self):
        return f"Metrics - {self.tenant.name} - {self.calculated_at}"


# ============================================================================
# 10. COMMUNICATION HUB
# ============================================================================

class CommunicationChannel(BaseModel):
    """Communication channels configuration."""
    
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='communication_channels')
    channel_type = models.CharField(
        max_length=50,
        choices=[
            ('sms', 'SMS'),
            ('email', 'Email'),
            ('whatsapp', 'WhatsApp'),
            ('push', 'Push Notification'),
            ('in_app', 'In-App Notification'),
        ]
    )
    is_enabled = models.BooleanField(default=True)
    provider = models.CharField(max_length=100, blank=True, help_text="Provider name (e.g., Twilio, SendGrid)")
    api_key = models.CharField(max_length=200, blank=True, help_text="Encrypted API key")
    api_secret = models.CharField(max_length=200, blank=True, help_text="Encrypted API secret")
    configuration = models.JSONField(default=dict, help_text="Channel-specific configuration")
    
    class Meta:
        db_table = 'communication_channels'
        unique_together = ['tenant', 'channel_type']
    
    def __str__(self):
        return f"{self.channel_type} - {self.tenant.name}"


class MessageTemplate(BaseModel):
    """Message templates for communications."""
    
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='schooladmin_message_templates')
    name = models.CharField(max_length=200)
    template_type = models.CharField(
        max_length=50,
        choices=[
            ('sms', 'SMS'),
            ('email', 'Email'),
            ('whatsapp', 'WhatsApp'),
            ('announcement', 'Announcement'),
            ('alert', 'Alert'),
        ]
    )
    subject = models.CharField(max_length=200, blank=True, help_text="For email/announcements")
    body = models.TextField(help_text="Template body with variables like {{student_name}}")
    variables = models.JSONField(default=list, help_text="Available template variables")
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'schooladmin_message_templates'
        unique_together = ['tenant', 'name']
    
    def __str__(self):
        return f"{self.name} - {self.template_type}"


class CommunicationCampaign(BaseModel):
    """Communication campaigns (SMS, Email, WhatsApp broadcasts)."""
    
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='communication_campaigns')
    name = models.CharField(max_length=200)
    campaign_type = models.CharField(
        max_length=50,
        choices=[
            ('sms', 'SMS Campaign'),
            ('email', 'Email Campaign'),
            ('whatsapp', 'WhatsApp Broadcast'),
            ('announcement', 'Announcement'),
            ('emergency', 'Emergency Alert'),
        ]
    )
    template = models.ForeignKey(MessageTemplate, on_delete=models.SET_NULL, null=True, blank=True, related_name='campaigns')
    target_audience = models.CharField(
        max_length=50,
        choices=[
            ('all_students', 'All Students'),
            ('all_parents', 'All Parents'),
            ('all_teachers', 'All Teachers'),
            ('all_staff', 'All Staff'),
            ('specific_class', 'Specific Class'),
            ('specific_students', 'Specific Students'),
            ('custom', 'Custom List'),
        ]
    )
    target_list = models.JSONField(default=list, help_text="List of IDs for specific targets")
    message_content = models.TextField()
    scheduled_at = models.DateTimeField(null=True, blank=True)
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('draft', 'Draft'),
            ('scheduled', 'Scheduled'),
            ('sending', 'Sending'),
            ('completed', 'Completed'),
            ('failed', 'Failed'),
            ('cancelled', 'Cancelled'),
        ],
        default='draft'
    )
    
    # Statistics
    total_recipients = models.IntegerField(default=0)
    sent_count = models.IntegerField(default=0)
    delivered_count = models.IntegerField(default=0)
    failed_count = models.IntegerField(default=0)
    opened_count = models.IntegerField(default=0, help_text="For email/WhatsApp")
    
    sent_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_campaigns'
    )
    
    class Meta:
        db_table = 'communication_campaigns'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.campaign_type}"


class CommunicationLog(BaseModel):
    """Log of all communications sent."""
    
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='communication_logs')
    campaign = models.ForeignKey(CommunicationCampaign, on_delete=models.SET_NULL, null=True, blank=True, related_name='logs')
    channel = models.CharField(max_length=50, choices=CommunicationChannel._meta.get_field('channel_type').choices)
    
    # Recipient
    recipient_type = models.CharField(
        max_length=50,
        choices=[
            ('student', 'Student'),
            ('parent', 'Parent/Guardian'),
            ('teacher', 'Teacher'),
            ('staff', 'Staff'),
        ]
    )
    recipient_id = models.IntegerField(help_text="ID of the recipient (student, user, etc.)")
    recipient_name = models.CharField(max_length=200)
    recipient_contact = models.CharField(max_length=200, help_text="Phone/Email")
    
    # Message
    subject = models.CharField(max_length=200, blank=True)
    message = models.TextField()
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('sent', 'Sent'),
            ('delivered', 'Delivered'),
            ('failed', 'Failed'),
            ('bounced', 'Bounced'),
        ],
        default='pending'
    )
    
    # Provider response
    provider_message_id = models.CharField(max_length=200, blank=True)
    provider_response = models.JSONField(default=dict, null=True, blank=True)
    error_message = models.TextField(blank=True)
    
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'communication_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant', 'status', 'created_at']),
            models.Index(fields=['campaign', 'status']),
        ]
    
    def __str__(self):
        return f"{self.channel} to {self.recipient_name} - {self.status}"


class EventInvitation(BaseModel):
    """Event invitations and RSVP tracking."""
    
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='event_invitations')
    event_name = models.CharField(max_length=200)
    event_type = models.CharField(
        max_length=50,
        choices=[
            ('meeting', 'Meeting'),
            ('parent_teacher', 'Parent-Teacher Conference'),
            ('workshop', 'Workshop'),
            ('sports_day', 'Sports Day'),
            ('graduation', 'Graduation'),
            ('other', 'Other'),
        ]
    )
    description = models.TextField(blank=True)
    event_date = models.DateTimeField()
    location = models.CharField(max_length=200, blank=True)
    
    # Invitations
    target_audience = models.CharField(max_length=50, choices=CommunicationCampaign._meta.get_field('target_audience').choices)
    target_list = models.JSONField(default=list)
    
    # RSVP
    rsvp_required = models.BooleanField(default=True)
    rsvp_deadline = models.DateTimeField(null=True, blank=True)
    total_invited = models.IntegerField(default=0)
    rsvp_yes = models.IntegerField(default=0)
    rsvp_no = models.IntegerField(default=0)
    rsvp_pending = models.IntegerField(default=0)
    
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_events'
    )
    
    class Meta:
        db_table = 'event_invitations'
        ordering = ['-event_date']
    
    def __str__(self):
        return f"{self.event_name} - {self.event_date}"


class RSVPResponse(BaseModel):
    """RSVP responses to event invitations."""
    
    invitation = models.ForeignKey(EventInvitation, on_delete=models.CASCADE, related_name='rsvp_responses')
    respondent_type = models.CharField(max_length=50, choices=CommunicationLog._meta.get_field('recipient_type').choices)
    respondent_id = models.IntegerField()
    respondent_name = models.CharField(max_length=200)
    response = models.CharField(
        max_length=10,
        choices=[
            ('yes', 'Yes'),
            ('no', 'No'),
            ('maybe', 'Maybe'),
        ]
    )
    notes = models.TextField(blank=True)
    responded_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'rsvp_responses'
        unique_together = ['invitation', 'respondent_type', 'respondent_id']
        ordering = ['-responded_at']
    
    def __str__(self):
        return f"{self.respondent_name} - {self.response}"


# ============================================================================
# 11. REPORT GENERATION & ANALYTICS ENGINE
# ============================================================================

class ReportTemplate(BaseModel):
    """Report templates for various report types."""
    
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='report_templates')
    name = models.CharField(max_length=200)
    report_type = models.CharField(
        max_length=50,
        choices=[
            ('academic', 'Academic Report'),
            ('attendance', 'Attendance Report'),
            ('financial', 'Financial Report'),
            ('enrollment', 'Enrollment Report'),
            ('staff', 'Staff Report'),
            ('ministry', 'Ministry Report'),
            ('custom', 'Custom Report'),
        ]
    )
    template_format = models.CharField(
        max_length=20,
        choices=[
            ('pdf', 'PDF'),
            ('excel', 'Excel'),
            ('csv', 'CSV'),
            ('html', 'HTML'),
        ],
        default='pdf'
    )
    template_file = models.FileField(upload_to='reports/templates/', null=True, blank=True)
    query_config = models.JSONField(default=dict, help_text="Query configuration for data extraction")
    fields_config = models.JSONField(default=list, help_text="Fields to include in report")
    filters_config = models.JSONField(default=dict, help_text="Default filters")
    is_active = models.BooleanField(default=True)
    is_ministry_format = models.BooleanField(default=False, help_text="Ministry-compliant format")
    
    class Meta:
        db_table = 'report_templates'
        unique_together = ['tenant', 'name']
    
    def __str__(self):
        return f"{self.name} - {self.report_type}"


class GeneratedReport(BaseModel):
    """Generated reports with metadata."""
    
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='generated_reports')
    template = models.ForeignKey(ReportTemplate, on_delete=models.SET_NULL, null=True, blank=True, related_name='generated_reports')
    report_name = models.CharField(max_length=200)
    report_type = models.CharField(max_length=50, choices=ReportTemplate._meta.get_field('report_type').choices)
    format = models.CharField(max_length=20, choices=ReportTemplate._meta.get_field('template_format').choices)
    
    # File
    file = models.FileField(upload_to='reports/generated/')
    file_size = models.IntegerField(help_text="File size in bytes")
    
    # Parameters
    parameters = models.JSONField(default=dict, help_text="Parameters used to generate report")
    date_range_start = models.DateField(null=True, blank=True)
    date_range_end = models.DateField(null=True, blank=True)
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('generating', 'Generating'),
            ('completed', 'Completed'),
            ('failed', 'Failed'),
        ],
        default='generating'
    )
    
    # Statistics
    record_count = models.IntegerField(default=0)
    generation_time_seconds = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    generated_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='generated_reports'
    )
    generated_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'generated_reports'
        ordering = ['-generated_at']
    
    def __str__(self):
        return f"{self.report_name} - {self.generated_at}"


class AnalyticsQuery(BaseModel):
    """Saved analytics queries for custom analysis."""
    
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='analytics_queries')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    query_type = models.CharField(
        max_length=50,
        choices=[
            ('enrollment_trend', 'Enrollment Trend'),
            ('attendance_analysis', 'Attendance Analysis'),
            ('academic_performance', 'Academic Performance'),
            ('financial_analysis', 'Financial Analysis'),
            ('teacher_effectiveness', 'Teacher Effectiveness'),
            ('custom', 'Custom Query'),
        ]
    )
    query_config = models.JSONField(default=dict, help_text="Query configuration")
    visualization_type = models.CharField(
        max_length=50,
        choices=[
            ('line', 'Line Chart'),
            ('bar', 'Bar Chart'),
            ('pie', 'Pie Chart'),
            ('table', 'Table'),
            ('heatmap', 'Heatmap'),
        ],
        default='table'
    )
    is_shared = models.BooleanField(default=False, help_text="Share with other admins")
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_analytics_queries'
    )
    
    class Meta:
        db_table = 'analytics_queries'
        unique_together = ['tenant', 'name']
    
    def __str__(self):
        return f"{self.name} - {self.query_type}"


# ============================================================================
# 12. MINISTRY EXPORT FORMATS
# ============================================================================

class MinistryExportFormat(BaseModel):
    """Ministry export format configurations."""
    
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='ministry_export_formats')
    format_name = models.CharField(max_length=200, help_text="e.g., ZIMSEC Student Register, Ministry Attendance Report")
    format_type = models.CharField(
        max_length=50,
        choices=[
            ('student_register', 'Student Register'),
            ('attendance_report', 'Attendance Report'),
            ('examination_results', 'Examination Results'),
            ('staff_register', 'Staff Register'),
            ('financial_report', 'Financial Report'),
            ('custom', 'Custom Format'),
        ]
    )
    ministry_department = models.CharField(max_length=100, blank=True, help_text="e.g., Ministry of Education, ZIMSEC")
    format_specification = models.JSONField(default=dict, help_text="Format specification (columns, mappings, etc.)")
    template_file = models.FileField(upload_to='ministry/formats/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'ministry_export_formats'
        unique_together = ['tenant', 'format_name']
    
    def __str__(self):
        return f"{self.format_name} - {self.tenant.name}"


class MinistryExport(BaseModel):
    """Ministry export records."""
    
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='ministry_exports')
    export_format = models.ForeignKey(MinistryExportFormat, on_delete=models.CASCADE, related_name='exports')
    export_name = models.CharField(max_length=200)
    
    # File
    file = models.FileField(upload_to='ministry/exports/')
    file_size = models.IntegerField()
    
    # Parameters
    academic_year = models.ForeignKey('academics.AcademicYear', on_delete=models.SET_NULL, null=True, blank=True, related_name='ministry_exports')
    term = models.ForeignKey('academics.Term', on_delete=models.SET_NULL, null=True, blank=True, related_name='ministry_exports')
    date_range_start = models.DateField(null=True, blank=True)
    date_range_end = models.DateField(null=True, blank=True)
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('generating', 'Generating'),
            ('completed', 'Completed'),
            ('failed', 'Failed'),
            ('submitted', 'Submitted to Ministry'),
        ],
        default='generating'
    )
    
    # Submission
    submitted_to_ministry = models.BooleanField(default=False)
    submission_date = models.DateField(null=True, blank=True)
    submission_reference = models.CharField(max_length=100, blank=True)
    submission_notes = models.TextField(blank=True)
    
    exported_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='exported_ministry_reports'
    )
    exported_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'ministry_exports'
        ordering = ['-exported_at']
    
    def __str__(self):
        return f"{self.export_name} - {self.export_format.format_name}"

