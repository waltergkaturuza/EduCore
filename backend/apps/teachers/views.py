"""
Views for Teachers app.
"""
import traceback
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone

from apps.core.permissions import IsTeacher
from .models import (
    TeacherDashboardMetrics, LessonPlan, LessonTemplate,
    TeacherAnalytics, CPDRecord, OfflineSync,
    TeacherResource, TeacherCommunity,
    ClassTopic, ClassPost, ClassQuestion, QuestionResponse,
    ClassQuiz, ClassQuizAttempt, PostComment, AssignmentRubric,
    RubricGrade, ClassCode, GradeCategory
)
from .serializers import (
    TeacherDashboardMetricsSerializer, LessonPlanSerializer, LessonTemplateSerializer,
    TeacherAnalyticsSerializer, CPDRecordSerializer, OfflineSyncSerializer,
    TeacherResourceSerializer, TeacherCommunitySerializer,
    ClassTopicSerializer, ClassPostSerializer, ClassQuestionSerializer,
    QuestionResponseSerializer, ClassQuizSerializer, ClassQuizAttemptSerializer,
    PostCommentSerializer, AssignmentRubricSerializer, RubricGradeSerializer,
    ClassCodeSerializer, GradeCategorySerializer
)
from .business_logic import (
    TeacherDashboardCalculator, LessonPlanAISuggestions, TeacherAnalyticsCalculator
)


# ============================================================================
# 1. TEACHER DASHBOARD METRICS
# ============================================================================

class TeacherDashboardMetricsViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Teacher Dashboard Metrics."""
    
    queryset = TeacherDashboardMetrics.objects.all()
    serializer_class = TeacherDashboardMetricsSerializer
    permission_classes = [IsAuthenticated, IsTeacher]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering_fields = ['calculated_at']
    ordering = ['-calculated_at']
    
    def get_queryset(self):
        """Filter by current teacher."""
        return self.queryset.filter(teacher=self.request.user)
    
    @action(detail=False, methods=['get'])
    def latest(self, request):
        """Get latest dashboard metrics, calculate if not exists."""
        try:
            teacher = request.user
            tenant = getattr(teacher, 'tenant', None)
            
            if not tenant:
                return Response(
                    {'error': 'User has no tenant associated'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            metrics = TeacherDashboardMetrics.objects.filter(
                teacher=teacher,
                tenant=tenant
            ).order_by('-calculated_at').first()
            
            if not metrics:
                # Calculate metrics
                try:
                    metrics = TeacherDashboardCalculator.calculate_all_metrics(teacher, tenant)
                except Exception as e:
                    # If calculation fails, return empty/default metrics
                    print(f"Error calculating metrics: {str(e)}")
                    print(traceback.format_exc())
                    # Create minimal metrics object with all required fields
                    try:
                        metrics = TeacherDashboardMetrics.objects.create(
                            teacher=teacher,
                            tenant=tenant,
                            today_classes_count=0,
                            pending_attendance_count=0,
                            pending_lesson_plans_count=0,
                            pending_assignments_to_mark=0,
                            upcoming_exams_count=0,
                            unread_messages_count=0,
                            announcements_count=0,
                            cpd_reminders_count=0,
                            students_at_risk=[],
                            class_performance_trend={},
                            suggested_remedial_actions=[],
                            teaching_insights=[],
                        )
                    except Exception as create_error:
                        print(f"Error creating default metrics: {str(create_error)}")
                        print(traceback.format_exc())
                        # Return a mock response instead
                        return Response({
                            'today_classes_count': 0,
                            'pending_attendance_count': 0,
                            'pending_lesson_plans_count': 0,
                            'pending_assignments_to_mark': 0,
                            'upcoming_exams_count': 0,
                            'unread_messages_count': 0,
                            'announcements_count': 0,
                            'cpd_reminders_count': 0,
                            'students_at_risk': [],
                            'class_performance_trend': {},
                            'suggested_remedial_actions': [],
                            'teaching_insights': [],
                            'workload_balance_score': None,
                            'is_online': True,
                            'pending_offline_actions': 0,
                        }, status=status.HTTP_200_OK)
            
            try:
                serializer = self.get_serializer(metrics)
                return Response(serializer.data)
            except Exception as serialization_error:
                print(f"Error serializing metrics: {str(serialization_error)}")
                print(traceback.format_exc())
                # Return basic data if serialization fails
                return Response({
                    'id': metrics.id if metrics else None,
                    'today_classes_count': getattr(metrics, 'today_classes_count', 0),
                    'pending_attendance_count': getattr(metrics, 'pending_attendance_count', 0),
                    'pending_lesson_plans_count': getattr(metrics, 'pending_lesson_plans_count', 0),
                    'pending_assignments_to_mark': getattr(metrics, 'pending_assignments_to_mark', 0),
                    'upcoming_exams_count': getattr(metrics, 'upcoming_exams_count', 0),
                    'unread_messages_count': getattr(metrics, 'unread_messages_count', 0),
                    'announcements_count': getattr(metrics, 'announcements_count', 0),
                    'cpd_reminders_count': getattr(metrics, 'cpd_reminders_count', 0),
                    'students_at_risk': getattr(metrics, 'students_at_risk', []),
                    'class_performance_trend': getattr(metrics, 'class_performance_trend', {}),
                    'suggested_remedial_actions': getattr(metrics, 'suggested_remedial_actions', []),
                    'teaching_insights': getattr(metrics, 'teaching_insights', []),
                    'workload_balance_score': float(getattr(metrics, 'workload_balance_score', None) or 0),
                    'is_online': getattr(metrics, 'is_online', True),
                    'pending_offline_actions': getattr(metrics, 'pending_offline_actions', 0),
                }, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Error in latest dashboard metrics: {str(e)}")
            print(traceback.format_exc())
            return Response(
                {'error': 'Failed to fetch dashboard metrics', 'detail': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def calculate(self, request):
        """Calculate and update dashboard metrics."""
        teacher = request.user
        tenant = teacher.tenant
        
        if not tenant:
            return Response({'error': 'User has no tenant'}, status=status.HTTP_400_BAD_REQUEST)
        
        metrics = TeacherDashboardCalculator.calculate_all_metrics(teacher, tenant)
        serializer = self.get_serializer(metrics)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ============================================================================
# 2. LESSON PLANNER
# ============================================================================

class LessonPlanViewSet(viewsets.ModelViewSet):
    """ViewSet for Lesson Plans."""
    
    queryset = LessonPlan.objects.all()
    serializer_class = LessonPlanSerializer
    permission_classes = [IsAuthenticated, IsTeacher]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'subject', 'class_obj', 'curriculum_framework', 'blooms_taxonomy_level']
    search_fields = ['title', 'topic', 'content']
    ordering_fields = ['scheduled_date', 'created_at']
    ordering = ['-scheduled_date', '-scheduled_time']
    
    def get_queryset(self):
        """Filter by current teacher."""
        return self.queryset.filter(teacher=self.request.user)
    
    def perform_create(self, serializer):
        """Set teacher and tenant on create."""
        serializer.save(teacher=self.request.user, tenant=self.request.user.tenant)
    
    @action(detail=True, methods=['post'])
    def mark_delivered(self, request, pk=None):
        """Mark lesson as delivered."""
        lesson = self.get_object()
        lesson.status = 'delivered'
        lesson.delivered_date = timezone.now().date()
        lesson.delivered_time = timezone.now().time()
        lesson.save()
        serializer = self.get_serializer(lesson)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def ai_suggestions(self, request):
        """Get AI suggestions for lesson planning."""
        topic = request.query_params.get('topic', '')
        subject_id = request.query_params.get('subject_id')
        grade_level = request.query_params.get('grade_level', '')
        teaching_method = request.query_params.get('teaching_method', '')
        blooms_level = request.query_params.get('blooms_level', 'understand')
        
        suggestions = {
            'objectives': LessonPlanAISuggestions.suggest_objectives(topic, subject_id, grade_level),
            'activities': LessonPlanAISuggestions.suggest_activities(topic, teaching_method),
            'assessments': LessonPlanAISuggestions.suggest_assessments(topic, blooms_level),
        }
        
        return Response(suggestions)


class LessonTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for Lesson Templates."""
    
    queryset = LessonTemplate.objects.all()
    serializer_class = LessonTemplateSerializer
    permission_classes = [IsAuthenticated, IsTeacher]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['subject', 'is_school_wide', 'is_personal']
    search_fields = ['name', 'description']
    ordering_fields = ['usage_count', 'created_at']
    ordering = ['-usage_count', 'name']
    
    def get_queryset(self):
        """Filter by tenant, show personal and school-wide templates."""
        user = self.request.user
        return self.queryset.filter(
            Q(tenant=user.tenant) & (
                Q(teacher=user) | Q(is_school_wide=True)
            )
        )
    
    def perform_create(self, serializer):
        """Set teacher and tenant on create."""
        serializer.save(teacher=self.request.user, tenant=self.request.user.tenant)
    
    @action(detail=True, methods=['post'])
    def use_template(self, request, pk=None):
        """Use template to create a lesson plan."""
        template = self.get_object()
        template.usage_count += 1
        template.save()
        
        # Return template data for creating lesson plan
        serializer = self.get_serializer(template)
        return Response(serializer.data)


# ============================================================================
# 3. TEACHER ANALYTICS
# ============================================================================

class TeacherAnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Teacher Analytics."""
    
    queryset = TeacherAnalytics.objects.all()
    serializer_class = TeacherAnalyticsSerializer
    permission_classes = [IsAuthenticated, IsTeacher]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['academic_year', 'term']
    ordering_fields = ['calculated_at']
    ordering = ['-calculated_at']
    
    def get_queryset(self):
        """Filter by current teacher."""
        return self.queryset.filter(teacher=self.request.user)
    
    @action(detail=False, methods=['get'])
    def latest(self, request):
        """Get latest analytics, calculate if not exists."""
        try:
            teacher = request.user
            tenant = getattr(teacher, 'tenant', None)
            
            if not tenant:
                return Response(
                    {'error': 'User has no tenant associated'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            academic_year_id = request.query_params.get('academic_year')
            term_id = request.query_params.get('term')
            
            from apps.academics.models import AcademicYear, Term
            
            academic_year = None
            if academic_year_id:
                try:
                    academic_year = AcademicYear.objects.get(id=academic_year_id)
                except AcademicYear.DoesNotExist:
                    return Response(
                        {'error': 'Academic year not found'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                academic_year = getattr(tenant, 'current_academic_year', None)
            
            term = None
            if term_id:
                try:
                    term = Term.objects.get(id=term_id)
                except Term.DoesNotExist:
                    pass  # Term is optional
            
            analytics = None
            if academic_year:
                analytics = TeacherAnalytics.objects.filter(
                    teacher=teacher,
                    tenant=tenant,
                    academic_year=academic_year,
                    term=term
                ).order_by('-calculated_at').first()
            
            if not analytics:
                # Calculate analytics if academic_year exists
                if academic_year:
                    try:
                        analytics = TeacherAnalyticsCalculator.calculate_all_analytics(
                            teacher, tenant, academic_year, term
                        )
                    except Exception as e:
                        print(f"Error calculating analytics: {str(e)}")
                        print(traceback.format_exc())
                        # Return empty/default analytics
                        try:
                            analytics = TeacherAnalytics.objects.create(
                                teacher=teacher,
                                tenant=tenant,
                                academic_year=academic_year,
                                term=term,
                            )
                        except Exception as create_error:
                            print(f"Error creating default analytics: {str(create_error)}")
                            print(traceback.format_exc())
                            # Return mock response instead
                            return Response({
                                'id': None,
                                'teacher': teacher.id,
                                'teacher_name': teacher.get_full_name(),
                                'teacher_email': teacher.email,
                                'tenant': tenant.id,
                                'academic_year': None,
                                'academic_year_name': None,
                                'term': None,
                                'term_name': None,
                                'calculated_at': None,
                                'individual_learning_trajectories': {},
                                'topic_mastery_heatmap': {},
                                'weakness_identification': [],
                                'growth_vs_baseline': {},
                                'pass_fail_distribution': {},
                                'subject_difficulty_index': None,
                                'attendance_performance_correlation': None,
                                'gender_performance_insights': {},
                                'lesson_completion_rate': 0,
                                'assessment_turnaround_hours': None,
                                'class_improvement_trend': {},
                                'peer_benchmarking': {},
                            }, status=status.HTTP_200_OK)
                else:
                    # No academic year configured - return empty analytics structure
                    return Response({
                        'id': None,
                        'teacher': teacher.id,
                        'teacher_name': teacher.get_full_name(),
                        'teacher_email': teacher.email,
                        'tenant': tenant.id,
                        'academic_year': None,
                        'academic_year_name': None,
                        'term': None,
                        'term_name': None,
                        'calculated_at': None,
                        'individual_learning_trajectories': {},
                        'topic_mastery_heatmap': {},
                        'weakness_identification': [],
                        'growth_vs_baseline': {},
                        'pass_fail_distribution': {},
                        'subject_difficulty_index': None,
                        'attendance_performance_correlation': None,
                        'gender_performance_insights': {},
                        'lesson_completion_rate': 0,
                        'assessment_turnaround_hours': None,
                        'class_improvement_trend': {},
                        'peer_benchmarking': {},
                        'message': 'No academic year configured for tenant',
                    }, status=status.HTTP_200_OK)
            
            try:
                serializer = self.get_serializer(analytics)
                return Response(serializer.data)
            except Exception as serialization_error:
                print(f"Error serializing analytics: {str(serialization_error)}")
                print(traceback.format_exc())
                # Return basic data if serialization fails
                return Response({
                    'id': analytics.id if analytics else None,
                    'teacher': teacher.id,
                    'teacher_name': teacher.get_full_name(),
                    'teacher_email': teacher.email,
                    'tenant': tenant.id,
                    'academic_year': getattr(analytics, 'academic_year_id', None),
                    'academic_year_name': getattr(analytics.academic_year, 'name', None) if analytics and hasattr(analytics, 'academic_year') else None,
                    'term': getattr(analytics, 'term_id', None),
                    'term_name': getattr(analytics.term, 'name', None) if analytics and hasattr(analytics, 'term') and analytics.term else None,
                    'calculated_at': str(getattr(analytics, 'calculated_at', None)),
                    'individual_learning_trajectories': getattr(analytics, 'individual_learning_trajectories', {}),
                    'topic_mastery_heatmap': getattr(analytics, 'topic_mastery_heatmap', {}),
                    'weakness_identification': getattr(analytics, 'weakness_identification', []),
                    'growth_vs_baseline': getattr(analytics, 'growth_vs_baseline', {}),
                    'pass_fail_distribution': getattr(analytics, 'pass_fail_distribution', {}),
                    'subject_difficulty_index': float(getattr(analytics, 'subject_difficulty_index', None) or 0),
                    'attendance_performance_correlation': float(getattr(analytics, 'attendance_performance_correlation', None) or 0),
                    'gender_performance_insights': getattr(analytics, 'gender_performance_insights', {}),
                    'lesson_completion_rate': float(getattr(analytics, 'lesson_completion_rate', 0) or 0),
                    'assessment_turnaround_hours': float(getattr(analytics, 'assessment_turnaround_hours', None) or 0) if getattr(analytics, 'assessment_turnaround_hours', None) else None,
                    'class_improvement_trend': getattr(analytics, 'class_improvement_trend', {}),
                    'peer_benchmarking': getattr(analytics, 'peer_benchmarking', {}),
                }, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Error in latest analytics: {str(e)}")
            print(traceback.format_exc())
            return Response(
                {'error': 'Failed to fetch analytics', 'detail': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def calculate(self, request):
        """Calculate analytics."""
        teacher = request.user
        tenant = teacher.tenant
        
        if not tenant:
            return Response({'error': 'User has no tenant'}, status=status.HTTP_400_BAD_REQUEST)
        
        academic_year_id = request.data.get('academic_year')
        term_id = request.data.get('term')
        
        from apps.academics.models import AcademicYear, Term
        
        if academic_year_id:
            academic_year = AcademicYear.objects.get(id=academic_year_id)
        else:
            academic_year = tenant.current_academic_year
        
        term = None
        if term_id:
            term = Term.objects.get(id=term_id)
        
        analytics = TeacherAnalyticsCalculator.calculate_all_analytics(
            teacher, tenant, academic_year, term
        )
        serializer = self.get_serializer(analytics)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ============================================================================
# 4. CPD RECORDS
# ============================================================================

class CPDRecordViewSet(viewsets.ModelViewSet):
    """ViewSet for CPD Records."""
    
    queryset = CPDRecord.objects.all()
    serializer_class = CPDRecordSerializer
    permission_classes = [IsAuthenticated, IsTeacher]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['cpd_type', 'provider_type', 'is_verified']
    search_fields = ['title', 'description', 'provider']
    ordering_fields = ['completion_date', 'start_date', 'cpd_points']
    ordering = ['-completion_date', '-start_date']
    
    def get_queryset(self):
        """Filter by current teacher."""
        return self.queryset.filter(teacher=self.request.user)
    
    def perform_create(self, serializer):
        """Set teacher and tenant on create."""
        serializer.save(teacher=self.request.user, tenant=self.request.user.tenant)
    
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Verify CPD record (admin only)."""
        cpd = self.get_object()
        cpd.is_verified = True
        cpd.verified_by = request.user
        cpd.verified_at = timezone.now()
        cpd.save()
        serializer = self.get_serializer(cpd)
        return Response(serializer.data)


# ============================================================================
# 5. OFFLINE SYNC
# ============================================================================

class OfflineSyncViewSet(viewsets.ModelViewSet):
    """ViewSet for Offline Sync."""
    
    queryset = OfflineSync.objects.all()
    serializer_class = OfflineSyncSerializer
    permission_classes = [IsAuthenticated, IsTeacher]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['sync_status', 'device_type']
    ordering_fields = ['last_sync_at']
    ordering = ['-last_sync_at']
    
    def get_queryset(self):
        """Filter by current teacher."""
        return self.queryset.filter(teacher=self.request.user)
    
    def perform_create(self, serializer):
        """Set teacher and tenant on create."""
        serializer.save(teacher=self.request.user, tenant=self.request.user.tenant)
    
    @action(detail=False, methods=['post'])
    def sync(self, request):
        """Perform sync operation."""
        device_id = request.data.get('device_id')
        pending_actions = request.data.get('pending_actions', [])
        
        sync_record, created = OfflineSync.objects.get_or_create(
            teacher=request.user,
            device_id=device_id,
            defaults={
                'tenant': request.user.tenant,
                'device_type': request.data.get('device_type', 'mobile'),
                'app_version': request.data.get('app_version', ''),
            }
        )
        
        # Process pending actions
        # This would handle actual sync logic
        sync_record.last_sync_at = timezone.now()
        sync_record.last_successful_sync_at = timezone.now()
        sync_record.sync_status = 'synced'
        sync_record.pending_actions = []
        sync_record.save()
        
        serializer = self.get_serializer(sync_record)
        return Response(serializer.data)


# ============================================================================
# 6. TEACHER RESOURCES
# ============================================================================

class TeacherResourceViewSet(viewsets.ModelViewSet):
    """ViewSet for Teacher Resources."""
    
    queryset = TeacherResource.objects.all()
    serializer_class = TeacherResourceSerializer
    permission_classes = [IsAuthenticated, IsTeacher]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['resource_type', 'subject', 'is_public']
    search_fields = ['title', 'description', 'tags']
    ordering_fields = ['download_count', 'rating_average', 'created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter by tenant, show public and shared resources."""
        user = self.request.user
        return self.queryset.filter(
            Q(tenant=user.tenant) & (
                Q(teacher=user) | Q(is_public=True) | Q(shared_with=user)
            )
        ).distinct()
    
    def perform_create(self, serializer):
        """Set teacher and tenant on create."""
        serializer.save(teacher=self.request.user, tenant=self.request.user.tenant)
    
    @action(detail=True, methods=['post'])
    def download(self, request, pk=None):
        """Record resource download."""
        resource = self.get_object()
        resource.download_count += 1
        resource.save()
        serializer = self.get_serializer(resource)
        return Response(serializer.data)


# ============================================================================
# 7. TEACHER COMMUNITY
# ============================================================================

class TeacherCommunityViewSet(viewsets.ModelViewSet):
    """ViewSet for Teacher Communities."""
    
    queryset = TeacherCommunity.objects.all()
    serializer_class = TeacherCommunitySerializer
    permission_classes = [IsAuthenticated, IsTeacher]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['community_type', 'subject', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        """Filter by tenant, show communities user is member of."""
        user = self.request.user
        return self.queryset.filter(
            tenant=user.tenant,
            members=user
        )
    
    def perform_create(self, serializer):
        """Set tenant and add creator as member."""
        community = serializer.save(tenant=self.request.user.tenant)
        community.members.add(self.request.user)
    
    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        """Join a community."""
        community = self.get_object()
        community.members.add(request.user)
        serializer = self.get_serializer(community)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        """Leave a community."""
        community = self.get_object()
        community.members.remove(request.user)
        serializer = self.get_serializer(community)
        return Response(serializer.data)


# ============================================================================
# 8. CLASS TOPICS
# ============================================================================

class ClassTopicViewSet(viewsets.ModelViewSet):
    """ViewSet for Class Topics."""
    
    queryset = ClassTopic.objects.all()
    serializer_class = ClassTopicSerializer
    permission_classes = [IsAuthenticated, IsTeacher]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['class_obj']
    ordering_fields = ['order', 'name']
    ordering = ['order', 'name']
    
    def get_queryset(self):
        """Filter by tenant."""
        return self.queryset.filter(tenant=self.request.user.tenant)
    
    def perform_create(self, serializer):
        """Set tenant on create."""
        serializer.save(tenant=self.request.user.tenant)


# ============================================================================
# 9. CLASS POSTS (Stream & Classwork)
# ============================================================================

class ClassPostViewSet(viewsets.ModelViewSet):
    """ViewSet for Class Posts."""
    
    queryset = ClassPost.objects.all()
    serializer_class = ClassPostSerializer
    permission_classes = [IsAuthenticated, IsTeacher]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['class_obj', 'post_type', 'is_draft', 'topic']
    search_fields = ['title', 'description']
    ordering_fields = ['published_at', 'created_at', 'scheduled_time']
    ordering = ['-published_at', '-created_at']
    
    def get_queryset(self):
        """Filter by teacher's classes."""
        user = self.request.user
        return self.queryset.filter(
            tenant=user.tenant,
            class_obj__teachers=user
        ).distinct()
    
    def perform_create(self, serializer):
        """Set teacher, tenant, and published_at."""
        if not serializer.validated_data.get('is_draft'):
            from django.utils import timezone
            serializer.save(
                teacher=self.request.user,
                tenant=self.request.user.tenant,
                published_at=timezone.now()
            )
        else:
            serializer.save(teacher=self.request.user, tenant=self.request.user.tenant)
    
    @action(detail=False, methods=['get'])
    def stream(self, request):
        """Get stream posts (published, not drafts)."""
        class_id = request.query_params.get('class_id')
        queryset = self.get_queryset().filter(is_draft=False)
        if class_id:
            queryset = queryset.filter(class_obj_id=class_id)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish a draft post."""
        post = self.get_object()
        if post.is_draft:
            from django.utils import timezone
            post.is_draft = False
            post.published_at = timezone.now()
            post.save()
        serializer = self.get_serializer(post)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reuse(self, request, pk=None):
        """Reuse this post in another class."""
        post = self.get_object()
        target_class_id = request.data.get('class_id')
        
        if not target_class_id:
            return Response({'error': 'class_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from apps.academics.models import Class
            target_class = Class.objects.get(id=target_class_id, tenant=request.user.tenant)
        except Class.DoesNotExist:
            return Response({'error': 'Class not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Create reused post
        reused_post = ClassPost.objects.create(
            class_obj=target_class,
            tenant=request.user.tenant,
            teacher=request.user,
            post_type=post.post_type,
            title=post.title,
            description=post.description,
            attachments=post.attachments,
            topic=post.topic,
            subject=post.subject,
            is_reused=True,
            reused_from=post,
            is_draft=request.data.get('is_draft', True),
        )
        
        serializer = self.get_serializer(reused_post)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ============================================================================
# 10. CLASS QUESTIONS
# ============================================================================

class ClassQuestionViewSet(viewsets.ModelViewSet):
    """ViewSet for Class Questions."""
    
    queryset = ClassQuestion.objects.all()
    serializer_class = ClassQuestionSerializer
    permission_classes = [IsAuthenticated, IsTeacher]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['class_obj', 'question_type']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter by teacher."""
        return self.queryset.filter(teacher=self.request.user, tenant=self.request.user.tenant)
    
    def perform_create(self, serializer):
        """Set teacher and tenant."""
        serializer.save(teacher=self.request.user, tenant=self.request.user.tenant)


class QuestionResponseViewSet(viewsets.ModelViewSet):
    """ViewSet for Question Responses."""
    
    queryset = QuestionResponse.objects.all()
    serializer_class = QuestionResponseSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['question', 'student']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter by question's teacher or student's own responses."""
        user = self.request.user
        if user.role == 'teacher':
            return self.queryset.filter(question__teacher=user)
        elif user.role == 'student':
            return self.queryset.filter(student__user=user)
        return self.queryset.none()
    
    def perform_create(self, serializer):
        """Auto-grade multiple choice questions."""
        response = serializer.save()
        
        # Auto-grade if multiple choice
        if response.question.question_type == 'multiple_choice':
            if response.answer == response.question.correct_answer:
                response.is_correct = True
                response.score = response.question.points
            else:
                response.is_correct = False
                response.score = 0
            response.save()
        
        # Update question response count
        response.question.response_count = response.question.responses.count()
        response.question.save()


# ============================================================================
# 11. CLASS QUIZZES
# ============================================================================

class ClassQuizViewSet(viewsets.ModelViewSet):
    """ViewSet for Class Quizzes."""
    
    queryset = ClassQuiz.objects.all()
    serializer_class = ClassQuizSerializer
    permission_classes = [IsAuthenticated, IsTeacher]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['class_obj']
    ordering_fields = ['created_at', 'due_date']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter by teacher."""
        return self.queryset.filter(teacher=self.request.user, tenant=self.request.user.tenant)
    
    def perform_create(self, serializer):
        """Set teacher and tenant."""
        serializer.save(teacher=self.request.user, tenant=self.request.user.tenant)
    
    @action(detail=True, methods=['post'])
    def auto_grade(self, request, pk=None):
        """Auto-grade all quiz attempts."""
        quiz = self.get_object()
        attempts = quiz.attempts.filter(is_completed=True, score__isnull=True)
        
        graded_count = 0
        for attempt in attempts:
            score = 0
            total_points = quiz.total_points or 0
            
            # Grade each answer
            correct_answers = 0
            total_questions = len(quiz.questions) or 1
            
            if isinstance(quiz.questions, list) and attempt.answers:
                for q_idx, question in enumerate(quiz.questions):
                    answer_key = str(q_idx) if isinstance(attempt.answers, dict) else q_idx
                    if answer_key in attempt.answers:
                        student_answer = attempt.answers[answer_key]
                        correct_answer = question.get('correct_answer')
                        if student_answer == correct_answer:
                            correct_answers += 1
                            score += question.get('points', 0)
            
            # Calculate percentage
            if total_questions > 0:
                percentage = (correct_answers / total_questions) * 100
            else:
                percentage = 0
            
            attempt.score = score
            attempt.percentage = percentage
            attempt.is_passed = quiz.passing_score is None or percentage >= float(quiz.passing_score)
            attempt.auto_graded_at = timezone.now()
            attempt.save()
            graded_count += 1
        
        return Response({
            'graded_count': graded_count,
            'message': f'Graded {graded_count} attempts'
        })


class ClassQuizAttemptViewSet(viewsets.ModelViewSet):
    """ViewSet for Class Quiz Attempts."""
    
    queryset = ClassQuizAttempt.objects.all()
    serializer_class = ClassQuizAttemptSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['quiz', 'student', 'is_completed']
    ordering_fields = ['submitted_at', 'started_at']
    ordering = ['-submitted_at', '-started_at']
    
    def get_queryset(self):
        """Filter by teacher or student."""
        user = self.request.user
        if user.role == 'teacher':
            return self.queryset.filter(quiz__teacher=user)
        elif user.role == 'student':
            return self.queryset.filter(student__user=user)
        return self.queryset.none()
    
    def perform_create(self, serializer):
        """Set attempt number."""
        student = serializer.validated_data['student']
        quiz = serializer.validated_data['quiz']
        
        # Get next attempt number
        last_attempt = ClassQuizAttempt.objects.filter(
            quiz=quiz,
            student=student
        ).order_by('-attempt_number').first()
        
        attempt_number = (last_attempt.attempt_number + 1) if last_attempt else 1
        serializer.save(attempt_number=attempt_number)
    
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Submit quiz attempt and auto-grade."""
        attempt = self.get_object()
        
        if attempt.is_completed:
            return Response({'error': 'Attempt already submitted'}, status=status.HTTP_400_BAD_REQUEST)
        
        attempt.answers = request.data.get('answers', attempt.answers)
        attempt.is_completed = True
        attempt.submitted_at = timezone.now()
        attempt.save()
        
        # Auto-grade
        quiz = attempt.quiz
        score = 0
        correct_answers = 0
        total_questions = len(quiz.questions) or 1
        
        if isinstance(quiz.questions, list) and attempt.answers:
            for q_idx, question in enumerate(quiz.questions):
                answer_key = str(q_idx) if isinstance(attempt.answers, dict) else q_idx
                if answer_key in attempt.answers:
                    student_answer = attempt.answers[answer_key]
                    correct_answer = question.get('correct_answer')
                    if student_answer == correct_answer:
                        correct_answers += 1
                        score += question.get('points', 0)
        
        percentage = (correct_answers / total_questions * 100) if total_questions > 0 else 0
        
        attempt.score = score
        attempt.percentage = percentage
        attempt.is_passed = quiz.passing_score is None or percentage >= float(quiz.passing_score or 0)
        attempt.auto_graded_at = timezone.now()
        attempt.save()
        
        serializer = self.get_serializer(attempt)
        return Response(serializer.data)


# ============================================================================
# 12. POST COMMENTS
# ============================================================================

class PostCommentViewSet(viewsets.ModelViewSet):
    """ViewSet for Post Comments."""
    
    queryset = PostComment.objects.all()
    serializer_class = PostCommentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['post', 'is_private']
    ordering_fields = ['created_at']
    ordering = ['created_at']
    
    def get_queryset(self):
        """Filter by post visibility."""
        user = self.request.user
        queryset = self.queryset.filter(post__tenant=user.tenant)
        
        # Students only see non-private comments or their own private comments
        if user.role == 'student':
            from apps.students.models import Student
            try:
                student = Student.objects.get(user=user)
                queryset = queryset.filter(
                    Q(is_private=False) | Q(student=student)
                )
            except Student.DoesNotExist:
                queryset = queryset.filter(is_private=False)
        
        return queryset
    
    def perform_create(self, serializer):
        """Set author and update comment count."""
        comment = serializer.save(author=self.request.user)
        
        # Update post comment count
        post = comment.post
        post.comment_count = post.comments.count()
        post.save()
        
        # Set student if author is student
        if self.request.user.role == 'student':
            from apps.students.models import Student
            try:
                student = Student.objects.get(user=self.request.user)
                comment.student = student
                comment.save()
            except Student.DoesNotExist:
                pass


# ============================================================================
# 13. ASSIGNMENT RUBRICS
# ============================================================================

class AssignmentRubricViewSet(viewsets.ModelViewSet):
    """ViewSet for Assignment Rubrics."""
    
    queryset = AssignmentRubric.objects.all()
    serializer_class = AssignmentRubricSerializer
    permission_classes = [IsAuthenticated, IsTeacher]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['assignment']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter by teacher."""
        return self.queryset.filter(teacher=self.request.user, tenant=self.request.user.tenant)
    
    def perform_create(self, serializer):
        """Set teacher and tenant."""
        serializer.save(teacher=self.request.user, tenant=self.request.user.tenant)


class RubricGradeViewSet(viewsets.ModelViewSet):
    """ViewSet for Rubric Grades."""
    
    queryset = RubricGrade.objects.all()
    serializer_class = RubricGradeSerializer
    permission_classes = [IsAuthenticated, IsTeacher]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['rubric', 'submission', 'student']
    ordering_fields = ['graded_at']
    ordering = ['-graded_at']
    
    def get_queryset(self):
        """Filter by teacher."""
        return self.queryset.filter(rubric__teacher=self.request.user)
    
    def perform_create(self, serializer):
        """Calculate total score from rubric criteria."""
        rubric_grade = serializer.save(graded_by=self.request.user, graded_at=timezone.now())
        
        # Calculate total score from grades
        total_score = 0
        grades = rubric_grade.grades or {}
        criteria = rubric_grade.rubric.criteria or []
        
        for criterion in criteria:
            criterion_id = str(criterion.get('id', ''))
            if criterion_id in grades:
                level_idx = grades[criterion_id].get('level_index', 0)
                if level_idx < len(criterion.get('levels', [])):
                    points = criterion['levels'][level_idx].get('points', 0)
                    total_score += points
        
        rubric_grade.total_score = total_score
        rubric_grade.save()


# ============================================================================
# 14. CLASS CODES
# ============================================================================

class ClassCodeViewSet(viewsets.ModelViewSet):
    """ViewSet for Class Codes."""
    
    queryset = ClassCode.objects.all()
    serializer_class = ClassCodeSerializer
    permission_classes = [IsAuthenticated, IsTeacher]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['class_obj', 'is_active']
    
    def get_queryset(self):
        """Filter by tenant."""
        return self.queryset.filter(tenant=self.request.user.tenant)
    
    def perform_create(self, serializer):
        """Generate unique code and set tenant."""
        import random
        import string
        
        # Generate unique 6-character code
        while True:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            if not ClassCode.objects.filter(code=code).exists():
                break
        
        serializer.save(code=code, tenant=self.request.user.tenant)
    
    @action(detail=True, methods=['post'])
    def regenerate(self, request, pk=None):
        """Regenerate class code."""
        class_code = self.get_object()
        import random
        import string
        
        # Generate new unique code
        while True:
            new_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            if not ClassCode.objects.filter(code=new_code).exists():
                break
        
        class_code.code = new_code
        class_code.use_count = 0
        class_code.save()
        
        serializer = self.get_serializer(class_code)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def join(self, request):
        """Join class using code (for students)."""
        code = request.data.get('code', '').upper().strip()
        
        if not code:
            return Response({'error': 'Code required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            class_code = ClassCode.objects.get(code=code, is_active=True)
        except ClassCode.DoesNotExist:
            return Response({'error': 'Invalid or expired code'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check expiration
        if class_code.expires_at and timezone.now() > class_code.expires_at:
            return Response({'error': 'Code has expired'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check max uses
        if class_code.max_uses and class_code.use_count >= class_code.max_uses:
            return Response({'error': 'Code has reached maximum uses'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Add student to class (if not already enrolled)
        if request.user.role == 'student':
            from apps.students.models import Student
            try:
                student = Student.objects.get(user=request.user)
                if student.current_class != class_code.class_obj:
                    student.current_class = class_code.class_obj
                    student.save()
                    
                    # Increment use count
                    class_code.use_count += 1
                    class_code.save()
                    
                    return Response({
                        'message': 'Successfully joined class',
                        'class': ClassCodeSerializer(class_code).data
                    })
                else:
                    return Response({'message': 'Already enrolled in this class'})
            except Student.DoesNotExist:
                return Response({'error': 'Student profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        return Response({'error': 'Only students can join classes'}, status=status.HTTP_403_FORBIDDEN)


# ============================================================================
# 15. GRADE CATEGORIES
# ============================================================================

class GradeCategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for Grade Categories."""
    
    queryset = GradeCategory.objects.all()
    serializer_class = GradeCategorySerializer
    permission_classes = [IsAuthenticated, IsTeacher]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['class_obj', 'subject']
    ordering_fields = ['name']
    ordering = ['name']
    
    def get_queryset(self):
        """Filter by tenant."""
        return self.queryset.filter(tenant=self.request.user.tenant)
    
    def perform_create(self, serializer):
        """Set tenant."""
        serializer.save(tenant=self.request.user.tenant)


