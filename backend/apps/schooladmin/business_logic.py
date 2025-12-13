"""
Business logic for School Admin operations.
"""
from django.db.models import Q, Count, Sum, Avg, Max, Min, F
from django.utils import timezone
from datetime import timedelta, date
from decimal import Decimal
from apps.students.models import Student
from apps.users.models import User
from apps.attendance.models import Attendance, PeriodAttendance
from apps.assessments.models import Grade, Assessment, ReportCard
from apps.fees.models import FeeInvoice, Payment
from apps.academics.models import Class, Stream, AcademicYear
from .models import DashboardMetrics, AttendanceAlert, ExamCycle


class DashboardMetricsCalculator:
    """Calculate comprehensive dashboard metrics."""
    
    @staticmethod
    def calculate_all_metrics(tenant):
        """Calculate all dashboard metrics for a tenant."""
        today = timezone.now().date()
        current_year = AcademicYear.objects.filter(tenant=tenant, is_current=True).first()
        
        # If no current year, use the most recent year or create a default one
        if not current_year:
            current_year = AcademicYear.objects.filter(tenant=tenant).order_by('-start_date').first()
            if not current_year:
                # Create a default academic year if none exists
                from datetime import date
                current_year = AcademicYear.objects.create(
                    tenant=tenant,
                    name=f"{date.today().year} Academic Year",
                    start_date=date(date.today().year, 1, 1),
                    end_date=date(date.today().year, 12, 31),
                    is_current=True
                )
        
        # Enrollment Metrics
        students = Student.objects.filter(tenant=tenant, is_deleted=False)
        total_enrollment = students.count()
        
        enrollment_by_gender = students.values('gender').annotate(count=Count('id'))
        enrollment_by_gender = {item['gender']: item['count'] for item in enrollment_by_gender}
        
        enrollment_by_grade = students.values('current_class__name').annotate(count=Count('id'))
        enrollment_by_grade = {item['current_class__name'] or 'Unassigned': item['count'] for item in enrollment_by_grade}
        
        enrollment_by_stream = students.values('current_stream__name').annotate(count=Count('id'))
        enrollment_by_stream = {item['current_stream__name'] or 'None': item['count'] for item in enrollment_by_stream}
        
        # Teacher Metrics
        teachers = User.objects.filter(tenant=tenant, role='teacher', is_active=True)
        total_teachers = teachers.count()
        active_teachers = teachers.filter(last_login__date=today).count() if hasattr(User, 'last_login') else total_teachers
        
        # Calculate teacher utilization (simplified - based on timetable slots)
        from apps.academics.models import TimetableSlot
        total_slots = TimetableSlot.objects.filter(tenant=tenant, academic_year=current_year).count()
        teacher_utilization_ratio = Decimal(total_slots / (total_teachers * 40)) * 100 if total_teachers > 0 else Decimal('0.00')  # Assuming 40 slots per teacher max
        
        student_teacher_ratio = Decimal(total_enrollment / total_teachers) if total_teachers > 0 else Decimal('0.00')
        
        # Attendance Metrics
        attendance_today = Attendance.objects.filter(
            tenant=tenant,
            date=today,
            status='present'
        ).count()
        
        total_expected = total_enrollment
        attendance_percentage_today = Decimal(attendance_today / total_expected * 100) if total_expected > 0 else Decimal('0.00')
        
        # Chronic Absenteeism (missing 10% or more of school days)
        days_in_term = 90  # Simplified - should calculate from term dates
        chronic_threshold = days_in_term * Decimal('0.10')
        
        chronic_absenteeism = students.annotate(
            absences=Count('attendances', filter=Q(attendances__status='absent', attendances__date__gte=today - timedelta(days=90)))
        ).filter(absences__gte=chronic_threshold)
        
        chronic_absenteeism_count = chronic_absenteeism.count()
        chronic_absenteeism_risk_index = Decimal(chronic_absenteeism_count / total_enrollment * 100) if total_enrollment > 0 else Decimal('0.00')
        
        # Academic Performance
        recent_grades = Grade.objects.filter(
            assessment__tenant=tenant,
            assessment__academic_year=current_year,
            created_at__gte=today - timedelta(days=90)
        )
        
        if recent_grades.exists():
            avg_grade = recent_grades.aggregate(avg=Avg('percentage'))['avg'] or Decimal('0.00')
            academic_performance_index = avg_grade
        else:
            avg_grade = Decimal('0.00')
            academic_performance_index = Decimal('0.00')
        
        # Financial Metrics
        fee_collection_today = Payment.objects.filter(
            tenant=tenant,
            payment_date=today,
            status='completed'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        # Get current term
        from apps.academics.models import Term
        current_term = Term.objects.filter(academic_year=current_year, is_current=True).first()
        
        if current_term:
            fee_collection_term = Payment.objects.filter(
                tenant=tenant,
                payment_date__gte=current_term.start_date,
                payment_date__lte=current_term.end_date,
                status='completed'
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        else:
            fee_collection_term = Decimal('0.00')
        
        fee_collection_year = Payment.objects.filter(
            tenant=tenant,
            payment_date__year=today.year,
            status='completed'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        # Fee collection vs target (simplified - assume target is total invoices)
        total_invoices = FeeInvoice.objects.filter(tenant=tenant, academic_year=current_year).aggregate(
            total=Sum('total_amount')
        )['total'] or Decimal('0.00')
        
        fee_collection_vs_target = Decimal(fee_collection_year / total_invoices * 100) if total_invoices > 0 else Decimal('0.00')
        
        # Outstanding fees aging
        outstanding_fees_30_days = FeeInvoice.objects.filter(
            tenant=tenant,
            status__in=['pending', 'partial', 'overdue'],
            due_date__gte=today - timedelta(days=30),
            due_date__lt=today
        ).aggregate(total=Sum('balance'))['total'] or Decimal('0.00')
        
        outstanding_fees_60_days = FeeInvoice.objects.filter(
            tenant=tenant,
            status__in=['pending', 'partial', 'overdue'],
            due_date__gte=today - timedelta(days=60),
            due_date__lt=today - timedelta(days=30)
        ).aggregate(total=Sum('balance'))['total'] or Decimal('0.00')
        
        outstanding_fees_90_days = FeeInvoice.objects.filter(
            tenant=tenant,
            status__in=['pending', 'partial', 'overdue'],
            due_date__lt=today - timedelta(days=60)
        ).aggregate(total=Sum('balance'))['total'] or Decimal('0.00')
        
        # System Usage
        teachers_active_today = User.objects.filter(
            tenant=tenant,
            role='teacher',
            is_active=True,
            last_login__date=today
        ).count() if hasattr(User, 'last_login') else 0
        
        parents_active_today = User.objects.filter(
            tenant=tenant,
            role='parent',
            is_active=True,
            last_login__date=today
        ).count() if hasattr(User, 'last_login') else 0
        
        students_active_today = User.objects.filter(
            tenant=tenant,
            role='student',
            is_active=True,
            last_login__date=today
        ).count() if hasattr(User, 'last_login') else 0
        
        # Compliance Alerts
        missing_marks_count = Assessment.objects.filter(
            tenant=tenant,
            academic_year=current_year,
            date__lte=today
        ).exclude(
            grades__isnull=False
        ).count()
        
        late_attendance_count = Attendance.objects.filter(
            tenant=tenant,
            date=today,
            status='late'
        ).count()
        
        compliance_alerts = []
        if missing_marks_count > 0:
            compliance_alerts.append({
                'type': 'missing_marks',
                'message': f'{missing_marks_count} assessments have missing marks',
                'severity': 'high'
            })
        if late_attendance_count > 10:
            compliance_alerts.append({
                'type': 'late_attendance',
                'message': f'{late_attendance_count} late arrivals today',
                'severity': 'medium'
            })
        
        # Predictive Metrics (Simplified AI-like calculations)
        dropout_risk_count = DashboardMetricsCalculator._calculate_dropout_risk(tenant, students)
        exam_failure_prediction = DashboardMetricsCalculator._predict_exam_failures(tenant, current_year)
        teacher_overload_alerts = DashboardMetricsCalculator._detect_teacher_overload(tenant, current_year)
        revenue_forecast = DashboardMetricsCalculator._forecast_revenue(tenant, current_year)
        at_risk_students = DashboardMetricsCalculator._identify_at_risk_students(tenant, students)
        
        # Create or update metrics
        metrics, created = DashboardMetrics.objects.update_or_create(
            tenant=tenant,
            defaults={
                'total_enrollment': total_enrollment,
                'enrollment_by_gender': enrollment_by_gender,
                'enrollment_by_grade': enrollment_by_grade,
                'enrollment_by_stream': enrollment_by_stream,
                'total_teachers': total_teachers,
                'active_teachers': active_teachers,
                'teacher_utilization_ratio': teacher_utilization_ratio,
                'student_teacher_ratio': student_teacher_ratio,
                'attendance_today': attendance_today,
                'attendance_percentage_today': attendance_percentage_today,
                'chronic_absenteeism_count': chronic_absenteeism_count,
                'chronic_absenteeism_risk_index': chronic_absenteeism_risk_index,
                'academic_performance_index': academic_performance_index,
                'average_grade': avg_grade,
                'fee_collection_today': fee_collection_today,
                'fee_collection_term': fee_collection_term,
                'fee_collection_year': fee_collection_year,
                'fee_collection_vs_target': fee_collection_vs_target,
                'outstanding_fees_30_days': outstanding_fees_30_days,
                'outstanding_fees_60_days': outstanding_fees_60_days,
                'outstanding_fees_90_days': outstanding_fees_90_days,
                'teachers_active_today': teachers_active_today,
                'parents_active_today': parents_active_today,
                'students_active_today': students_active_today,
                'missing_marks_count': missing_marks_count,
                'late_attendance_count': late_attendance_count,
                'compliance_alerts': compliance_alerts,
                'dropout_risk_count': dropout_risk_count,
                'exam_failure_prediction': exam_failure_prediction,
                'teacher_overload_alerts': teacher_overload_alerts,
                'revenue_forecast': revenue_forecast,
                'at_risk_students': at_risk_students,
            }
        )
        
        return metrics
    
    @staticmethod
    def _calculate_dropout_risk(tenant, students):
        """Calculate dropout risk based on attendance, fees, and performance."""
        # Simplified: Students with poor attendance + outstanding fees + low grades
        high_risk = students.annotate(
            absences=Count('attendances', filter=Q(attendances__status='absent', attendances__date__gte=timezone.now().date() - timedelta(days=30))),
            outstanding_fees=Sum('fee_invoices__balance', filter=Q(fee_invoices__status__in=['pending', 'partial', 'overdue'])),
            avg_grade=Avg('grades__percentage', filter=Q(grades__created_at__gte=timezone.now().date() - timedelta(days=90)))
        ).filter(
            Q(absences__gte=5) | Q(outstanding_fees__gte=1000) | Q(avg_grade__lt=40)
        ).count()
        
        return high_risk
    
    @staticmethod
    def _predict_exam_failures(tenant, academic_year):
        """Predict exam failures by subject."""
        # Simplified: Based on recent assessment performance
        from apps.assessments.models import Assessment
        subjects = Assessment.objects.filter(
            tenant=tenant,
            academic_year=academic_year
        ).values('subject__name').distinct()
        
        predictions = {}
        for subject in subjects:
            subject_name = subject['subject__name']
            recent_grades = Grade.objects.filter(
                assessment__subject__name=subject_name,
                assessment__tenant=tenant,
                assessment__academic_year=academic_year,
                created_at__gte=timezone.now().date() - timedelta(days=90)
            )
            
            if recent_grades.exists():
                failure_rate = recent_grades.filter(percentage__lt=50).count() / recent_grades.count() * 100
                predictions[subject_name] = {
                    'failure_rate': float(failure_rate),
                    'at_risk_count': recent_grades.filter(percentage__lt=50).count()
                }
        
        return predictions
    
    @staticmethod
    def _detect_teacher_overload(tenant, academic_year):
        """Detect teachers with excessive workload."""
        from apps.academics.models import TimetableSlot
        alerts = []
        
        teachers = User.objects.filter(tenant=tenant, role='teacher', is_active=True)
        for teacher in teachers:
            slot_count = TimetableSlot.objects.filter(
                tenant=tenant,
                academic_year=academic_year,
                teacher=teacher
            ).count()
            
            if slot_count > 30:  # Threshold
                alerts.append({
                    'teacher': teacher.full_name,
                    'slots': slot_count,
                    'severity': 'high' if slot_count > 40 else 'medium'
                })
        
        return alerts
    
    @staticmethod
    def _forecast_revenue(tenant, academic_year):
        """Forecast revenue based on historical data."""
        # Simplified: Linear projection based on current collection rate
        today = timezone.now().date()
        
        # Current month collection
        current_month_start = today.replace(day=1)
        current_month_collection = Payment.objects.filter(
            tenant=tenant,
            payment_date__gte=current_month_start,
            status='completed'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        # Forecast next 3 months
        forecast = {
            'current_month': float(current_month_collection),
            'next_month': float(current_month_collection * Decimal('1.05')),  # 5% growth
            'month_2': float(current_month_collection * Decimal('1.10')),
            'month_3': float(current_month_collection * Decimal('1.15')),
        }
        
        return forecast
    
    @staticmethod
    def _identify_at_risk_students(tenant, students):
        """Identify students at risk across multiple dimensions."""
        at_risk = []
        
        for student in students[:50]:  # Limit for performance
            risk_factors = []
            risk_score = 0
            
            # Attendance risk
            absences = Attendance.objects.filter(
                student=student,
                status='absent',
                date__gte=timezone.now().date() - timedelta(days=30)
            ).count()
            if absences > 5:
                risk_factors.append('poor_attendance')
                risk_score += 30
            
            # Financial risk
            outstanding = FeeInvoice.objects.filter(
                student=student,
                status__in=['pending', 'partial', 'overdue']
            ).aggregate(total=Sum('balance'))['total'] or Decimal('0.00')
            if outstanding > 1000:
                risk_factors.append('outstanding_fees')
                risk_score += 20
            
            # Academic risk
            recent_grades = Grade.objects.filter(
                student=student,
                created_at__gte=timezone.now().date() - timedelta(days=90)
            )
            if recent_grades.exists():
                avg = recent_grades.aggregate(avg=Avg('percentage'))['avg'] or 0
                if avg < 50:
                    risk_factors.append('low_performance')
                    risk_score += 50
            
            if risk_score > 50:
                at_risk.append({
                    'student_id': student.id,
                    'student_name': student.user.full_name,
                    'risk_score': risk_score,
                    'risk_factors': risk_factors
                })
        
        return at_risk


# ============================================================================
# REPORT GENERATION & MINISTRY EXPORT BUSINESS LOGIC
# ============================================================================

class ReportGenerator:
    """Generate various types of reports."""
    
    @staticmethod
    def generate_academic_report(tenant, academic_year, term=None, format='pdf'):
        """Generate academic performance report."""
        from .models import GeneratedReport, ReportTemplate
        from apps.assessments.models import ReportCard, Grade
        from apps.students.models import Student
        
        # Get or create template
        template, _ = ReportTemplate.objects.get_or_create(
            tenant=tenant,
            name='Academic Performance Report',
            defaults={
                'report_type': 'academic',
                'template_format': format,
            }
        )
        
        # Query data
        students = Student.objects.filter(tenant=tenant, is_deleted=False)
        if term:
            report_cards = ReportCard.objects.filter(
                student__in=students,
                academic_year=academic_year,
                term=term
            )
        else:
            report_cards = ReportCard.objects.filter(
                student__in=students,
                academic_year=academic_year
            )
        
        # Generate file
        from .utils import generate_pdf_report, generate_excel_report
        from apps.assessments.models import ReportCard
        
        # Prepare data
        columns = ['Student Name', 'Class', 'Average Score', 'Overall Grade', 'Position']
        data = []
        for report_card in report_cards:
            data.append({
                'Student Name': report_card.student.user.full_name,
                'Class': report_card.class_obj.name if report_card.class_obj else '',
                'Average Score': str(report_card.average_score),
                'Overall Grade': report_card.overall_grade,
                'Position': str(report_card.position) if report_card.position else 'N/A',
            })
        
        # Generate file based on format
        if format == 'pdf':
            file_content = generate_pdf_report(
                title=f'Academic Report - {academic_year.name}',
                data=data,
                columns=columns
            )
        else:  # excel
            file_content = generate_excel_report(
                title=f'Academic Report - {academic_year.name}',
                data=data,
                columns=columns
            )
        
        # Save file
        from django.core.files.base import ContentFile
        from django.core.files.storage import default_storage
        filename = f'reports/academic_{academic_year.name}_{timezone.now().strftime("%Y%m%d_%H%M%S")}.{format}'
        file_obj = default_storage.save(filename, ContentFile(file_content))
        
        report = GeneratedReport.objects.create(
            tenant=tenant,
            template=template,
            report_name=f'Academic Report - {academic_year.name}',
            report_type='academic',
            format=format,
            file=file_obj,
            file_size=len(file_content),
            parameters={'academic_year': academic_year.id, 'term': term.id if term else None},
            date_range_start=academic_year.start_date,
            date_range_end=academic_year.end_date,
            status='completed',
            record_count=report_cards.count(),
            generated_by=None,
        )
        
        return report
    
    @staticmethod
    def generate_attendance_report(tenant, start_date, end_date, format='pdf'):
        """Generate attendance report."""
        from .models import GeneratedReport, ReportTemplate
        from apps.attendance.models import Attendance
        
        template, _ = ReportTemplate.objects.get_or_create(
            tenant=tenant,
            name='Attendance Report',
            defaults={
                'report_type': 'attendance',
                'template_format': format,
            }
        )
        
        attendances = Attendance.objects.filter(
            tenant=tenant,
            date__gte=start_date,
            date__lte=end_date
        ).select_related('student', 'class_obj')
        
        # Prepare data
        columns = ['Date', 'Student Name', 'Class', 'Status', 'Remarks']
        data = []
        for att in attendances:
            data.append({
                'Date': att.date.strftime('%Y-%m-%d'),
                'Student Name': att.student.user.full_name,
                'Class': att.class_obj.name if att.class_obj else '',
                'Status': att.status.title(),
                'Remarks': att.remarks or '',
            })
        
        # Generate file
        from .utils import generate_pdf_report, generate_excel_report
        from django.core.files.base import ContentFile
        from django.core.files.storage import default_storage
        
        if format == 'pdf':
            file_content = generate_pdf_report(
                title=f'Attendance Report - {start_date} to {end_date}',
                data=data,
                columns=columns
            )
        else:
            file_content = generate_excel_report(
                title=f'Attendance Report - {start_date} to {end_date}',
                data=data,
                columns=columns
            )
        
        filename = f'reports/attendance_{start_date}_{end_date}_{timezone.now().strftime("%Y%m%d_%H%M%S")}.{format}'
        file_obj = default_storage.save(filename, ContentFile(file_content))
        
        report = GeneratedReport.objects.create(
            tenant=tenant,
            template=template,
            report_name=f'Attendance Report - {start_date} to {end_date}',
            report_type='attendance',
            format=format,
            file=file_obj,
            file_size=len(file_content),
            parameters={'start_date': str(start_date), 'end_date': str(end_date)},
            date_range_start=start_date,
            date_range_end=end_date,
            status='completed',
            record_count=attendances.count(),
            generated_by=None,
        )
        
        return report
    
    @staticmethod
    def generate_financial_report(tenant, academic_year, format='excel'):
        """Generate financial report."""
        from .models import GeneratedReport, ReportTemplate
        from apps.fees.models import FeeInvoice, Payment
        
        template, _ = ReportTemplate.objects.get_or_create(
            tenant=tenant,
            name='Financial Report',
            defaults={
                'report_type': 'financial',
                'template_format': format,
            }
        )
        
        invoices = FeeInvoice.objects.filter(tenant=tenant, academic_year=academic_year).select_related('student')
        payments = Payment.objects.filter(tenant=tenant, payment_date__year=academic_year.start_date.year)
        
        # Prepare data
        columns = ['Invoice Number', 'Student Name', 'Total Amount', 'Paid Amount', 'Balance', 'Status', 'Due Date']
        data = []
        for invoice in invoices:
            data.append({
                'Invoice Number': invoice.invoice_number,
                'Student Name': invoice.student.user.full_name,
                'Total Amount': str(invoice.total_amount),
                'Paid Amount': str(invoice.paid_amount),
                'Balance': str(invoice.balance),
                'Status': invoice.status.title(),
                'Due Date': invoice.due_date.strftime('%Y-%m-%d'),
            })
        
        # Generate file
        from .utils import generate_pdf_report, generate_excel_report
        from django.core.files.base import ContentFile
        from django.core.files.storage import default_storage
        
        if format == 'pdf':
            file_content = generate_pdf_report(
                title=f'Financial Report - {academic_year.name}',
                data=data,
                columns=columns
            )
        else:
            file_content = generate_excel_report(
                title=f'Financial Report - {academic_year.name}',
                data=data,
                columns=columns
            )
        
        filename = f'reports/financial_{academic_year.name}_{timezone.now().strftime("%Y%m%d_%H%M%S")}.{format}'
        file_obj = default_storage.save(filename, ContentFile(file_content))
        
        report = GeneratedReport.objects.create(
            tenant=tenant,
            template=template,
            report_name=f'Financial Report - {academic_year.name}',
            report_type='financial',
            format=format,
            file=file_obj,
            file_size=len(file_content),
            parameters={'academic_year': academic_year.id},
            date_range_start=academic_year.start_date,
            date_range_end=academic_year.end_date,
            status='completed',
            record_count=invoices.count(),
            generated_by=None,
        )
        
        return report


class MinistryExportGenerator:
    """Generate ministry-compliant exports."""
    
    @staticmethod
    def generate_student_register(tenant, academic_year, format_type='student_register'):
        """Generate ZIMSEC/Ministry student register."""
        from .models import MinistryExport, MinistryExportFormat
        from apps.students.models import Student
        
        # Get or create format
        export_format, _ = MinistryExportFormat.objects.get_or_create(
            tenant=tenant,
            format_name='ZIMSEC Student Register',
            defaults={
                'format_type': format_type,
                'ministry_department': 'ZIMSEC',
                'is_active': True,
            }
        )
        
        students = Student.objects.filter(tenant=tenant, is_deleted=False)
        
        # Generate file using utility
        from .utils import generate_ministry_student_register
        from django.core.files.base import ContentFile
        from django.core.files.storage import default_storage
        
        file_content = generate_ministry_student_register(tenant, academic_year)
        filename = f'ministry/student_register_{academic_year.name}_{timezone.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
        file_obj = default_storage.save(filename, ContentFile(file_content))
        
        export = MinistryExport.objects.create(
            tenant=tenant,
            export_format=export_format,
            export_name=f'Student Register - {academic_year.name}',
            file=file_obj,
            file_size=len(file_content),
            academic_year=academic_year,
            status='completed',
            exported_by=None,
        )
        
        return export
    
    @staticmethod
    def generate_attendance_report_ministry(tenant, academic_year, term, format_type='attendance_report'):
        """Generate ministry attendance report."""
        from .models import MinistryExport, MinistryExportFormat
        from apps.attendance.models import Attendance
        
        export_format, _ = MinistryExportFormat.objects.get_or_create(
            tenant=tenant,
            format_name='Ministry Attendance Report',
            defaults={
                'format_type': format_type,
                'ministry_department': 'Ministry of Education',
                'is_active': True,
            }
        )
        
        attendances = Attendance.objects.filter(
            tenant=tenant,
            academic_year=academic_year
        )
        
        export = MinistryExport.objects.create(
            tenant=tenant,
            export_format=export_format,
            export_name=f'Attendance Report - {term.name} {academic_year.name}',
            file=None,
            file_size=0,
            academic_year=academic_year,
            term=term,
            date_range_start=term.start_date,
            date_range_end=term.end_date,
            status='completed',
            exported_by=None,
        )
        
        return export

