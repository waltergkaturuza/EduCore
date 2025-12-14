"""
Business Logic for Teachers Module
Advanced analytics, AI suggestions, and sync engine
"""
from django.db.models import Q, Count, Avg, Sum, F
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
from apps.teachers.models import (
    TeacherDashboardMetrics, LessonPlan, TeacherAnalytics, CPDRecord
)
from apps.attendance.models import Attendance
from apps.assessments.models import Assignment, Submission, Grade
from apps.academics.models import Class, Subject
from apps.students.models import Student


class TeacherDashboardCalculator:
    """Calculate teacher dashboard metrics."""
    
    @staticmethod
    def calculate_all_metrics(teacher, tenant):
        """Calculate all dashboard metrics for a teacher."""
        from apps.academics.models import TimetableSlot
        
        today = timezone.now().date()
        now = timezone.now()
        
        # Get today's classes
        today_classes = TimetableSlot.objects.filter(
            teacher=teacher,
            day_of_week=today.weekday(),
            is_active=True
        ).count()
        
        # Get next class countdown
        next_class = TimetableSlot.objects.filter(
            teacher=teacher,
            day_of_week=today.weekday(),
            is_active=True,
            start_time__gt=now.time()
        ).order_by('start_time').first()
        
        next_class_countdown = None
        if next_class:
            next_class_datetime = datetime.combine(today, next_class.start_time)
            next_class_datetime = timezone.make_aware(next_class_datetime)
            if next_class_datetime > now:
                diff = next_class_datetime - now
                next_class_countdown = int(diff.total_seconds() / 60)
        
        # Pending attendance
        pending_attendance = Attendance.objects.filter(
            marked_by=teacher,
            date=today,
            status='pending'
        ).count()
        
        # Pending lesson plans
        pending_lesson_plans = LessonPlan.objects.filter(
            teacher=teacher,
            status='draft',
            scheduled_date__lte=today
        ).count()
        
        # Pending assignments to mark
        pending_assignments = Submission.objects.filter(
            assignment__teacher=teacher,
            is_graded=False,
            submitted_at__isnull=False
        ).count()
        
        # Upcoming exams
        upcoming_exams = Assignment.objects.filter(
            teacher=teacher,
            due_date__gte=now,
            is_published=True
        ).count()
        
        # Students at risk (attendance + marks + engagement)
        students_at_risk = TeacherDashboardCalculator._calculate_students_at_risk(teacher, tenant)
        
        # Class performance trend
        class_performance_trend = TeacherDashboardCalculator._calculate_performance_trend(teacher)
        
        # Suggested remedial actions
        suggested_remedial_actions = TeacherDashboardCalculator._suggest_remedial_actions(teacher, students_at_risk)
        
        # Teaching insights
        teaching_insights = TeacherDashboardCalculator._generate_teaching_insights(teacher)
        
        # Workload balance
        workload_balance = TeacherDashboardCalculator._calculate_workload_balance(teacher)
        
        # Create or update metrics
        metrics, created = TeacherDashboardMetrics.objects.update_or_create(
            teacher=teacher,
            tenant=tenant,
            defaults={
                'today_classes_count': today_classes,
                'next_class_countdown_minutes': next_class_countdown,
                'pending_attendance_count': pending_attendance,
                'pending_lesson_plans_count': pending_lesson_plans,
                'pending_assignments_to_mark': pending_assignments,
                'upcoming_exams_count': upcoming_exams,
                'students_at_risk': students_at_risk,
                'class_performance_trend': class_performance_trend,
                'suggested_remedial_actions': suggested_remedial_actions,
                'teaching_insights': teaching_insights,
                'workload_balance_score': workload_balance,
                'is_online': True,
                'last_sync_at': now,
            }
        )
        
        return metrics
    
    @staticmethod
    def _calculate_students_at_risk(teacher, tenant):
        """Identify students at risk based on attendance, marks, and engagement."""
        at_risk = []
        
        # Get teacher's classes
        classes = Class.objects.filter(
            subjects__teacher=teacher,
            tenant=tenant
        ).distinct()
        
        for class_obj in classes:
            students = Student.objects.filter(
                current_class=class_obj,
                tenant=tenant,
                status='active'
            )
            
            for student in students:
                risk_factors = []
                risk_score = 0
                
                # Check attendance
                recent_attendance = Attendance.objects.filter(
                    student=student,
                    date__gte=timezone.now().date() - timedelta(days=30)
                )
                if recent_attendance.exists():
                    attendance_rate = recent_attendance.filter(status='present').count() / recent_attendance.count()
                    if attendance_rate < 0.7:
                        risk_factors.append('Low attendance')
                        risk_score += 3
                
                # Check marks
                recent_grades = Grade.objects.filter(
                    student=student,
                    assignment__teacher=teacher,
                    created_at__gte=timezone.now() - timedelta(days=90)
                )
                if recent_grades.exists():
                    avg_mark = recent_grades.aggregate(avg=Avg('score'))['avg']
                    if avg_mark and avg_mark < 50:
                        risk_factors.append('Low marks')
                        risk_score += 3
                
                # Check missing submissions
                missing_submissions = Submission.objects.filter(
                    assignment__teacher=teacher,
                    assignment__due_date__lt=timezone.now(),
                    student=student,
                    submitted_at__isnull=True
                ).count()
                if missing_submissions > 2:
                    risk_factors.append('Missing assignments')
                    risk_score += 2
                
                if risk_score >= 3:
                    at_risk.append({
                        'student_id': student.id,
                        'student_name': student.user.get_full_name(),
                        'class_name': class_obj.name,
                        'risk_score': risk_score,
                        'risk_factors': risk_factors,
                    })
        
        return at_risk
    
    @staticmethod
    def _calculate_performance_trend(teacher):
        """Calculate week-on-week class performance trend."""
        trends = {}
        
        # Get last 4 weeks
        for i in range(4):
            week_start = timezone.now().date() - timedelta(weeks=i+1)
            week_end = week_start + timedelta(days=7)
            
            grades = Grade.objects.filter(
                assignment__teacher=teacher,
                created_at__date__gte=week_start,
                created_at__date__lt=week_end
            )
            
            if grades.exists():
                avg_score = grades.aggregate(avg=Avg('score'))['avg']
                trends[f'week_{i+1}'] = float(avg_score) if avg_score else 0
        
        return trends
    
    @staticmethod
    def _suggest_remedial_actions(teacher, students_at_risk):
        """Suggest remedial actions based on at-risk students."""
        suggestions = []
        
        # Group by risk factor
        risk_factors = {}
        for student in students_at_risk:
            for factor in student.get('risk_factors', []):
                if factor not in risk_factors:
                    risk_factors[factor] = []
                risk_factors[factor].append(student)
        
        # Generate suggestions
        if 'Low attendance' in risk_factors:
            suggestions.append({
                'type': 'attendance',
                'priority': 'high',
                'action': 'Contact parents of students with low attendance',
                'affected_students': len(risk_factors['Low attendance']),
            })
        
        if 'Low marks' in risk_factors:
            suggestions.append({
                'type': 'academic',
                'priority': 'high',
                'action': 'Schedule remedial sessions for struggling students',
                'affected_students': len(risk_factors['Low marks']),
            })
        
        if 'Missing assignments' in risk_factors:
            suggestions.append({
                'type': 'engagement',
                'priority': 'medium',
                'action': 'Follow up on missing assignments',
                'affected_students': len(risk_factors['Missing assignments']),
            })
        
        return suggestions
    
    @staticmethod
    def _generate_teaching_insights(teacher):
        """Generate AI-driven teaching insights."""
        insights = []
        
        # Lesson completion rate
        total_lessons = LessonPlan.objects.filter(teacher=teacher).count()
        completed_lessons = LessonPlan.objects.filter(
            teacher=teacher,
            status='delivered'
        ).count()
        
        if total_lessons > 0:
            completion_rate = (completed_lessons / total_lessons) * 100
            if completion_rate < 80:
                insights.append({
                    'type': 'warning',
                    'message': f'Lesson completion rate is {completion_rate:.1f}%. Consider reviewing scheduled lessons.',
                })
        
        # Assessment turnaround
        recent_submissions = Submission.objects.filter(
            assignment__teacher=teacher,
            submitted_at__isnull=False,
            graded_at__isnull=False
        ).order_by('-submitted_at')[:10]
        
        if recent_submissions.exists():
            avg_turnaround = sum(
                (sub.graded_at - sub.submitted_at).total_seconds() / 3600
                for sub in recent_submissions
            ) / recent_submissions.count()
            
            if avg_turnaround > 72:
                insights.append({
                    'type': 'info',
                    'message': f'Average grading turnaround is {avg_turnaround:.1f} hours. Consider faster feedback.',
                })
        
        return insights
    
    @staticmethod
    def _calculate_workload_balance(teacher):
        """Calculate workload balance score (0-100)."""
        score = 100
        
        # Reduce score based on pending work
        pending_assignments = Submission.objects.filter(
            assignment__teacher=teacher,
            is_graded=False
        ).count()
        score -= min(pending_assignments * 2, 30)
        
        # Reduce score based on overdue lesson plans
        overdue_plans = LessonPlan.objects.filter(
            teacher=teacher,
            status='draft',
            scheduled_date__lt=timezone.now().date()
        ).count()
        score -= min(overdue_plans * 3, 20)
        
        return max(score, 0)


class LessonPlanAISuggestions:
    """AI-powered suggestions for lesson planning."""
    
    @staticmethod
    def suggest_objectives(topic, subject, grade_level):
        """Suggest learning objectives based on topic and grade level."""
        # This would integrate with AI service in production
        # For now, return template-based suggestions
        suggestions = [
            f"Understand key concepts of {topic}",
            f"Apply {topic} knowledge to solve problems",
            f"Analyze relationships within {topic}",
        ]
        return suggestions
    
    @staticmethod
    def suggest_activities(topic, teaching_method):
        """Suggest activities based on topic and teaching method."""
        activities = []
        
        if teaching_method == 'group_work':
            activities.append(f"Group discussion on {topic}")
            activities.append(f"Collaborative problem-solving activity")
        elif teaching_method == 'practical':
            activities.append(f"Hands-on experiment/demonstration")
            activities.append(f"Practical application exercise")
        else:
            activities.append(f"Interactive presentation on {topic}")
            activities.append(f"Q&A session")
        
        return activities
    
    @staticmethod
    def suggest_assessments(topic, blooms_level):
        """Suggest assessment questions based on topic and Bloom's level."""
        suggestions = []
        
        if blooms_level == 'remember':
            suggestions.append(f"Define key terms related to {topic}")
            suggestions.append(f"List the main components of {topic}")
        elif blooms_level == 'understand':
            suggestions.append(f"Explain the concept of {topic}")
            suggestions.append(f"Compare and contrast {topic} with related concepts")
        elif blooms_level == 'apply':
            suggestions.append(f"Solve problems using {topic} principles")
            suggestions.append(f"Apply {topic} knowledge to real-world scenarios")
        
        return suggestions


class TeacherAnalyticsCalculator:
    """Calculate comprehensive teacher analytics."""
    
    @staticmethod
    def calculate_all_analytics(teacher, tenant, academic_year, term=None):
        """Calculate all analytics for a teacher."""
        
        # Individual learning trajectories
        trajectories = TeacherAnalyticsCalculator._calculate_learning_trajectories(teacher, academic_year)
        
        # Topic mastery heatmap
        heatmap = TeacherAnalyticsCalculator._calculate_topic_mastery(teacher, academic_year)
        
        # Weakness identification
        weaknesses = TeacherAnalyticsCalculator._identify_weaknesses(teacher, academic_year)
        
        # Growth vs baseline
        growth = TeacherAnalyticsCalculator._calculate_growth(teacher, academic_year)
        
        # Pass/fail distribution
        pass_fail = TeacherAnalyticsCalculator._calculate_pass_fail(teacher, academic_year)
        
        # Subject difficulty index
        difficulty_index = TeacherAnalyticsCalculator._calculate_difficulty_index(teacher, academic_year)
        
        # Attendance-performance correlation
        correlation = TeacherAnalyticsCalculator._calculate_attendance_correlation(teacher, academic_year)
        
        # Gender performance insights
        gender_insights = TeacherAnalyticsCalculator._calculate_gender_insights(teacher, academic_year)
        
        # Lesson completion rate
        completion_rate = TeacherAnalyticsCalculator._calculate_lesson_completion(teacher, academic_year)
        
        # Assessment turnaround
        turnaround = TeacherAnalyticsCalculator._calculate_turnaround(teacher, academic_year)
        
        # Class improvement trend
        improvement = TeacherAnalyticsCalculator._calculate_improvement_trend(teacher, academic_year)
        
        # Create analytics record
        analytics, created = TeacherAnalytics.objects.update_or_create(
            teacher=teacher,
            tenant=tenant,
            academic_year=academic_year,
            term=term,
            defaults={
                'individual_learning_trajectories': trajectories,
                'topic_mastery_heatmap': heatmap,
                'weakness_identification': weaknesses,
                'growth_vs_baseline': growth,
                'pass_fail_distribution': pass_fail,
                'subject_difficulty_index': difficulty_index,
                'attendance_performance_correlation': correlation,
                'gender_performance_insights': gender_insights,
                'lesson_completion_rate': completion_rate,
                'assessment_turnaround_hours': turnaround,
                'class_improvement_trend': improvement,
            }
        )
        
        return analytics
    
    @staticmethod
    def _calculate_learning_trajectories(teacher, academic_year):
        """Calculate individual student learning trajectories."""
        trajectories = {}
        
        # Get all students taught by teacher
        students = Student.objects.filter(
            current_class__subjects__teacher=teacher,
            tenant=teacher.tenant
        ).distinct()
        
        for student in students:
            grades = Grade.objects.filter(
                student=student,
                assignment__teacher=teacher,
                assignment__academic_year=academic_year
            ).order_by('created_at')
            
            if grades.exists():
                trajectory = [
                    {
                        'date': grade.created_at.isoformat(),
                        'score': float(grade.score),
                        'assignment': grade.assignment.title,
                    }
                    for grade in grades
                ]
                trajectories[student.id] = {
                    'student_name': student.user.get_full_name(),
                    'trajectory': trajectory,
                }
        
        return trajectories
    
    @staticmethod
    def _calculate_topic_mastery(teacher, academic_year):
        """Calculate topic mastery heatmap."""
        # This would analyze performance by topic/subject area
        # Simplified version for now
        return {}
    
    @staticmethod
    def _identify_weaknesses(teacher, academic_year):
        """Identify common weaknesses across students."""
        weaknesses = []
        
        # Analyze low-performing areas
        low_grades = Grade.objects.filter(
            assignment__teacher=teacher,
            assignment__academic_year=academic_year,
            score__lt=50
        ).values('assignment__subject__name').annotate(
            count=Count('id'),
            avg_score=Avg('score')
        ).order_by('-count')[:5]
        
        for item in low_grades:
            weaknesses.append({
                'subject': item['assignment__subject__name'],
                'affected_students': item['count'],
                'average_score': float(item['avg_score']),
            })
        
        return weaknesses
    
    @staticmethod
    def _calculate_growth(teacher, academic_year):
        """Calculate growth vs baseline."""
        # Compare early term vs late term performance
        return {}
    
    @staticmethod
    def _calculate_pass_fail(teacher, academic_year):
        """Calculate pass/fail distribution."""
        grades = Grade.objects.filter(
            assignment__teacher=teacher,
            assignment__academic_year=academic_year
        )
        
        total = grades.count()
        if total == 0:
            return {'pass': 0, 'fail': 0}
        
        passed = grades.filter(score__gte=50).count()
        failed = total - passed
        
        return {
            'pass': passed,
            'fail': failed,
            'pass_rate': (passed / total) * 100,
        }
    
    @staticmethod
    def _calculate_difficulty_index(teacher, academic_year):
        """Calculate subject difficulty index."""
        grades = Grade.objects.filter(
            assignment__teacher=teacher,
            assignment__academic_year=academic_year
        )
        
        if grades.exists():
            avg_score = grades.aggregate(avg=Avg('score'))['avg']
            # Lower average = higher difficulty
            difficulty = 100 - float(avg_score) if avg_score else 50
            return difficulty
        
        return None
    
    @staticmethod
    def _calculate_attendance_correlation(teacher, academic_year):
        """Calculate correlation between attendance and performance."""
        # Simplified correlation calculation
        return None
    
    @staticmethod
    def _calculate_gender_insights(teacher, academic_year):
        """Calculate gender-based performance insights."""
        insights = {}
        
        # This would analyze performance by gender
        # Simplified for now
        return insights
    
    @staticmethod
    def _calculate_lesson_completion(teacher, academic_year):
        """Calculate lesson completion rate."""
        total = LessonPlan.objects.filter(
            teacher=teacher,
            academic_year=academic_year
        ).count()
        
        completed = LessonPlan.objects.filter(
            teacher=teacher,
            academic_year=academic_year,
            status='delivered'
        ).count()
        
        if total > 0:
            return (completed / total) * 100
        
        return 0
    
    @staticmethod
    def _calculate_turnaround(teacher, academic_year):
        """Calculate average assessment turnaround time in hours."""
        submissions = Submission.objects.filter(
            assignment__teacher=teacher,
            assignment__academic_year=academic_year,
            submitted_at__isnull=False,
            graded_at__isnull=False
        )
        
        if submissions.exists():
            total_hours = sum(
                (sub.graded_at - sub.submitted_at).total_seconds() / 3600
                for sub in submissions
            )
            return total_hours / submissions.count()
        
        return None
    
    @staticmethod
    def _calculate_improvement_trend(teacher, academic_year):
        """Calculate class improvement trend over time."""
        # Analyze performance trends month by month
        return {}


