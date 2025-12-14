"""
URLs for Teachers app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TeacherDashboardMetricsViewSet, LessonPlanViewSet, LessonTemplateViewSet,
    TeacherAnalyticsViewSet, CPDRecordViewSet, OfflineSyncViewSet,
    TeacherResourceViewSet, TeacherCommunityViewSet,
    ClassTopicViewSet, ClassPostViewSet, ClassQuestionViewSet,
    QuestionResponseViewSet, ClassQuizViewSet, ClassQuizAttemptViewSet,
    PostCommentViewSet, AssignmentRubricViewSet, RubricGradeViewSet,
    ClassCodeViewSet, GradeCategoryViewSet
)

router = DefaultRouter()
router.register(r'dashboard-metrics', TeacherDashboardMetricsViewSet, basename='teacher-dashboard-metrics')
router.register(r'lesson-plans', LessonPlanViewSet, basename='lesson-plan')
router.register(r'lesson-templates', LessonTemplateViewSet, basename='lesson-template')
router.register(r'analytics', TeacherAnalyticsViewSet, basename='teacher-analytics')
router.register(r'cpd-records', CPDRecordViewSet, basename='cpd-record')
router.register(r'offline-sync', OfflineSyncViewSet, basename='offline-sync')
router.register(r'resources', TeacherResourceViewSet, basename='teacher-resource')
router.register(r'communities', TeacherCommunityViewSet, basename='teacher-community')

# Google Classroom-like features
router.register(r'class-topics', ClassTopicViewSet, basename='class-topic')
router.register(r'class-posts', ClassPostViewSet, basename='class-post')
router.register(r'class-questions', ClassQuestionViewSet, basename='class-question')
router.register(r'question-responses', QuestionResponseViewSet, basename='question-response')
router.register(r'class-quizzes', ClassQuizViewSet, basename='class-quiz')
router.register(r'quiz-attempts', ClassQuizAttemptViewSet, basename='class-quiz-attempt')
router.register(r'post-comments', PostCommentViewSet, basename='post-comment')
router.register(r'assignment-rubrics', AssignmentRubricViewSet, basename='assignment-rubric')
router.register(r'rubric-grades', RubricGradeViewSet, basename='rubric-grade')
router.register(r'class-codes', ClassCodeViewSet, basename='class-code')
router.register(r'grade-categories', GradeCategoryViewSet, basename='grade-category')

urlpatterns = [
    path('', include(router.urls)),
    # Special endpoint for class posts by class
    path('classes/<int:class_id>/posts/', ClassPostViewSet.as_view({'get': 'stream'}), name='class-posts-stream'),
]


