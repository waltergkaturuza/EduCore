/**
 * Teachers API Service
 * Professional Teaching Workspace - World-Class Specification
 */
import apiService from './api';
import { PaginatedResponse } from '../types/api';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface TeacherDashboardMetrics {
  id: number;
  teacher: number;
  teacher_name: string;
  teacher_email: string;
  tenant: number;
  tenant_name: string;
  calculated_at: string;
  today_classes_count: number;
  next_class_countdown_minutes: number | null;
  pending_attendance_count: number;
  pending_lesson_plans_count: number;
  pending_assignments_to_mark: number;
  upcoming_exams_count: number;
  unread_messages_count: number;
  announcements_count: number;
  cpd_reminders_count: number;
  students_at_risk: Array<{
    student_id: number;
    student_name: string;
    class_name: string;
    risk_score: number;
    risk_factors: string[];
  }>;
  class_performance_trend: Record<string, number>;
  suggested_remedial_actions: Array<{
    type: string;
    priority: string;
    action: string;
    affected_students: number;
  }>;
  teaching_insights: Array<{
    type: string;
    message: string;
  }>;
  workload_balance_score: number | null;
  is_online: boolean;
  last_sync_at: string | null;
  pending_offline_actions: number;
}

export interface LessonPlan {
  id: number;
  teacher: number;
  teacher_name: string;
  teacher_email: string;
  tenant: number;
  subject: number;
  subject_name: string;
  class_obj: number;
  class_name: string;
  stream: number | null;
  stream_name: string | null;
  academic_year: number;
  academic_year_name: string;
  term: number | null;
  term_name: string | null;
  title: string;
  topic: string;
  lesson_number: number | null;
  objectives: string[];
  learning_outcomes: string[];
  curriculum_framework: string;
  curriculum_topics: string[];
  syllabus_reference: string;
  blooms_taxonomy_level: string;
  teaching_methods: string[];
  teaching_aids: string[];
  activities: string[];
  planned_duration_minutes: number;
  actual_duration_minutes: number | null;
  linked_homework: number | null;
  linked_homework_title: string | null;
  linked_assessments: number[];
  ai_suggested_objectives: string[];
  ai_suggested_activities: string[];
  ai_suggested_assessments: string[];
  status: 'draft' | 'scheduled' | 'delivered' | 'reviewed';
  scheduled_date: string | null;
  scheduled_time: string | null;
  delivered_date: string | null;
  delivered_time: string | null;
  teacher_reflection: string;
  lesson_effectiveness_rating: number | null;
  student_engagement_score: number | null;
  content: string;
  resources: any[];
  notes: string;
  template: number | null;
}

export interface LessonTemplate {
  id: number;
  teacher: number | null;
  teacher_name: string | null;
  tenant: number;
  tenant_name: string;
  subject: number | null;
  subject_name: string | null;
  name: string;
  description: string;
  default_objectives: string[];
  default_teaching_methods: string[];
  default_activities: string[];
  default_blooms_level: string;
  is_school_wide: boolean;
  is_personal: boolean;
  usage_count: number;
}

export interface TeacherAnalytics {
  id: number;
  teacher: number;
  teacher_name: string;
  teacher_email: string;
  tenant: number;
  academic_year: number;
  academic_year_name: string;
  term: number | null;
  term_name: string | null;
  calculated_at: string;
  individual_learning_trajectories: Record<string, any>;
  topic_mastery_heatmap: Record<string, any>;
  weakness_identification: any[];
  growth_vs_baseline: Record<string, any>;
  pass_fail_distribution: Record<string, number>;
  subject_difficulty_index: number | null;
  attendance_performance_correlation: number | null;
  gender_performance_insights: Record<string, any>;
  lesson_completion_rate: number;
  assessment_turnaround_hours: number | null;
  class_improvement_trend: Record<string, any>;
  peer_benchmarking: Record<string, any>;
}

export interface CPDRecord {
  id: number;
  teacher: number;
  teacher_name: string;
  teacher_email: string;
  tenant: number;
  tenant_name: string;
  title: string;
  description: string;
  cpd_type: string;
  start_date: string | null;
  end_date: string | null;
  completion_date: string | null;
  cpd_points: number;
  hours: number | null;
  provider: string;
  provider_type: string;
  certificate_file: string | null;
  certificate_number: string;
  is_verified: boolean;
  verified_by: number | null;
  verified_by_name: string | null;
  verified_at: string | null;
  skills_gained: string[];
  competencies_addressed: string[];
  linked_to_appraisal: boolean;
  appraisal_id: number | null;
}

export interface OfflineSync {
  id: number;
  teacher: number;
  teacher_name: string;
  teacher_email: string;
  tenant: number;
  last_sync_at: string | null;
  last_successful_sync_at: string | null;
  sync_status: 'synced' | 'pending' | 'conflict' | 'error';
  pending_actions: any[];
  conflict_resolutions: any[];
  device_id: string;
  device_type: string;
  app_version: string;
}

export interface TeacherResource {
  id: number;
  teacher: number;
  teacher_name: string;
  teacher_email: string;
  tenant: number;
  subject: number | null;
  subject_name: string | null;
  title: string;
  description: string;
  resource_type: string;
  file: string | null;
  url: string;
  is_public: boolean;
  shared_with: number[];
  shared_with_names: string[];
  tags: string[];
  grade_levels: string[];
  download_count: number;
  rating_average: number;
  rating_count: number;
}

export interface TeacherCommunity {
  id: number;
  tenant: number;
  tenant_name: string;
  subject: number | null;
  subject_name: string | null;
  name: string;
  description: string;
  community_type: string;
  members: number[];
  moderators: number[];
  members_count: number;
  moderators_count: number;
  is_active: boolean;
}

// ============================================================================
// Service Implementation
// ============================================================================

export const teachersService = {
  // Dashboard Metrics
  getDashboardMetrics: (): Promise<PaginatedResponse<TeacherDashboardMetrics>> => {
    return apiService.get<PaginatedResponse<TeacherDashboardMetrics>>('/teachers/dashboard-metrics/').then(res => res.data);
  },
  getLatestMetrics: (): Promise<TeacherDashboardMetrics> => {
    return apiService.get<TeacherDashboardMetrics>('/teachers/dashboard-metrics/latest/').then(res => res.data);
  },
  calculateMetrics: (): Promise<TeacherDashboardMetrics> => {
    return apiService.post<TeacherDashboardMetrics>('/teachers/dashboard-metrics/calculate/').then(res => res.data);
  },

  // Lesson Plans
  getLessonPlans: (params?: any): Promise<PaginatedResponse<LessonPlan>> => {
    return apiService.get<PaginatedResponse<LessonPlan>>('/teachers/lesson-plans/', { params }).then(res => res.data);
  },
  getLessonPlan: (id: number): Promise<LessonPlan> => {
    return apiService.get<LessonPlan>(`/teachers/lesson-plans/${id}/`).then(res => res.data);
  },
  createLessonPlan: (data: any): Promise<LessonPlan> => {
    return apiService.post<LessonPlan>('/teachers/lesson-plans/', data).then(res => res.data);
  },
  updateLessonPlan: (id: number, data: any): Promise<LessonPlan> => {
    return apiService.patch<LessonPlan>(`/teachers/lesson-plans/${id}/`, data).then(res => res.data);
  },
  deleteLessonPlan: (id: number): Promise<void> => {
    return apiService.delete(`/teachers/lesson-plans/${id}/`).then(() => undefined);
  },
  markLessonDelivered: (id: number): Promise<LessonPlan> => {
    return apiService.post<LessonPlan>(`/teachers/lesson-plans/${id}/mark_delivered/`).then(res => res.data);
  },
  getAISuggestions: (params: {
    topic?: string;
    subject_id?: number;
    grade_level?: string;
    teaching_method?: string;
    blooms_level?: string;
  }): Promise<{
    objectives: string[];
    activities: string[];
    assessments: string[];
  }> => {
    return apiService.get<{
      objectives: string[];
      activities: string[];
      assessments: string[];
    }>('/teachers/lesson-plans/ai_suggestions/', { params }).then(res => res.data);
  },

  // Lesson Templates
  getLessonTemplates: (params?: any): Promise<PaginatedResponse<LessonTemplate>> => {
    return apiService.get<PaginatedResponse<LessonTemplate>>('/teachers/lesson-templates/', { params }).then(res => res.data);
  },
  createLessonTemplate: (data: any): Promise<LessonTemplate> => {
    return apiService.post<LessonTemplate>('/teachers/lesson-templates/', data).then(res => res.data);
  },
  useTemplate: (id: number): Promise<LessonTemplate> => {
    return apiService.post<LessonTemplate>(`/teachers/lesson-templates/${id}/use_template/`).then(res => res.data);
  },

  // Analytics
  getAnalytics: (params?: any): Promise<PaginatedResponse<TeacherAnalytics>> => {
    return apiService.get<PaginatedResponse<TeacherAnalytics>>('/teachers/analytics/', { params }).then(res => res.data);
  },
  getLatestAnalytics: (params?: { academic_year?: number; term?: number }): Promise<TeacherAnalytics> => {
    return apiService.get<TeacherAnalytics>('/teachers/analytics/latest/', { params }).then(res => res.data);
  },
  calculateAnalytics: (data: { academic_year?: number; term?: number }): Promise<TeacherAnalytics> => {
    return apiService.post<TeacherAnalytics>('/teachers/analytics/calculate/', data).then(res => res.data);
  },

  // CPD Records
  getCPDRecords: (params?: any): Promise<PaginatedResponse<CPDRecord>> => {
    return apiService.get<PaginatedResponse<CPDRecord>>('/teachers/cpd-records/', { params }).then(res => res.data);
  },
  createCPDRecord: (data: any): Promise<CPDRecord> => {
    return apiService.post<CPDRecord>('/teachers/cpd-records/', data).then(res => res.data);
  },
  updateCPDRecord: (id: number, data: any): Promise<CPDRecord> => {
    return apiService.patch<CPDRecord>(`/teachers/cpd-records/${id}/`, data).then(res => res.data);
  },

  // Offline Sync
  getOfflineSync: (): Promise<PaginatedResponse<OfflineSync>> => {
    return apiService.get<PaginatedResponse<OfflineSync>>('/teachers/offline-sync/').then(res => res.data);
  },
  performSync: (data: {
    device_id: string;
    device_type?: string;
    app_version?: string;
    pending_actions?: any[];
  }): Promise<OfflineSync> => {
    return apiService.post<OfflineSync>('/teachers/offline-sync/sync/', data).then(res => res.data);
  },

  // Resources
  getResources: (params?: any): Promise<PaginatedResponse<TeacherResource>> => {
    return apiService.get<PaginatedResponse<TeacherResource>>('/teachers/resources/', { params }).then(res => res.data);
  },
  createResource: (data: FormData): Promise<TeacherResource> => {
    return apiService.post<TeacherResource>('/teachers/resources/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data);
  },
  downloadResource: (id: number): Promise<TeacherResource> => {
    return apiService.post<TeacherResource>(`/teachers/resources/${id}/download/`).then(res => res.data);
  },

  // Communities
  getCommunities: (params?: any): Promise<PaginatedResponse<TeacherCommunity>> => {
    return apiService.get<PaginatedResponse<TeacherCommunity>>('/teachers/communities/', { params }).then(res => res.data);
  },
  createCommunity: (data: any): Promise<TeacherCommunity> => {
    return apiService.post<TeacherCommunity>('/teachers/communities/', data).then(res => res.data);
  },
  joinCommunity: (id: number): Promise<TeacherCommunity> => {
    return apiService.post<TeacherCommunity>(`/teachers/communities/${id}/join/`).then(res => res.data);
  },
  leaveCommunity: (id: number): Promise<TeacherCommunity> => {
    return apiService.post<TeacherCommunity>(`/teachers/communities/${id}/leave/`).then(res => res.data);
  },

  // ============================================================================
  // CLASS STREAM & GOOGLE CLASSROOM-LIKE FEATURES
  // ============================================================================

  // Class Topics
  getClassTopics: (params?: { class_obj?: number }): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/teachers/class-topics/', { params }).then(res => res.data);
  },
  createClassTopic: (data: any): Promise<any> => {
    return apiService.post<any>('/teachers/class-topics/', data).then(res => res.data);
  },
  updateClassTopic: (id: number, data: any): Promise<any> => {
    return apiService.patch<any>(`/teachers/class-topics/${id}/`, data).then(res => res.data);
  },
  deleteClassTopic: (id: number): Promise<void> => {
    return apiService.delete(`/teachers/class-topics/${id}/`).then(() => undefined);
  },

  // Class Posts (Stream & Classwork)
  getClassPosts: (params?: { class_obj?: number; post_type?: string; is_draft?: boolean; topic?: string | number }): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/teachers/class-posts/', { params }).then(res => res.data);
  },
  getClassPostsStream: (classId: number): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>(`/teachers/classes/${classId}/posts/`).then(res => res.data);
  },
  createClassPost: (data: any): Promise<any> => {
    return apiService.post<any>('/teachers/class-posts/', data).then(res => res.data);
  },
  updateClassPost: (id: number, data: any): Promise<any> => {
    return apiService.patch<any>(`/teachers/class-posts/${id}/`, data).then(res => res.data);
  },
  deleteClassPost: (id: number): Promise<void> => {
    return apiService.delete(`/teachers/class-posts/${id}/`).then(() => undefined);
  },
  publishClassPost: (id: number): Promise<any> => {
    return apiService.post<any>(`/teachers/class-posts/${id}/publish/`).then(res => res.data);
  },
  reuseClassPost: (id: number, classId: number, isDraft: boolean = true): Promise<any> => {
    return apiService.post<any>(`/teachers/class-posts/${id}/reuse/`, { class_id: classId, is_draft: isDraft }).then(res => res.data);
  },

  // Class Questions
  getClassQuestions: (params?: any): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/teachers/class-questions/', { params }).then(res => res.data);
  },
  createClassQuestion: (data: any): Promise<any> => {
    return apiService.post<any>('/teachers/class-questions/', data).then(res => res.data);
  },
  updateClassQuestion: (id: number, data: any): Promise<any> => {
    return apiService.patch<any>(`/teachers/class-questions/${id}/`, data).then(res => res.data);
  },
  deleteClassQuestion: (id: number): Promise<void> => {
    return apiService.delete(`/teachers/class-questions/${id}/`).then(() => undefined);
  },

  // Question Responses
  getQuestionResponses: (params?: { question?: number; student?: number }): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/teachers/question-responses/', { params }).then(res => res.data);
  },
  createQuestionResponse: (data: any): Promise<any> => {
    return apiService.post<any>('/teachers/question-responses/', data).then(res => res.data);
  },
  updateQuestionResponse: (id: number, data: any): Promise<any> => {
    return apiService.patch<any>(`/teachers/question-responses/${id}/`, data).then(res => res.data);
  },

  // Class Quizzes
  getClassQuizzes: (params?: any): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/teachers/class-quizzes/', { params }).then(res => res.data);
  },
  getClassQuiz: (id: number): Promise<any> => {
    return apiService.get<any>(`/teachers/class-quizzes/${id}/`).then(res => res.data);
  },
  createClassQuiz: (data: any): Promise<any> => {
    return apiService.post<any>('/teachers/class-quizzes/', data).then(res => res.data);
  },
  updateClassQuiz: (id: number, data: any): Promise<any> => {
    return apiService.patch<any>(`/teachers/class-quizzes/${id}/`, data).then(res => res.data);
  },
  deleteClassQuiz: (id: number): Promise<void> => {
    return apiService.delete(`/teachers/class-quizzes/${id}/`).then(() => undefined);
  },
  autoGradeQuiz: (id: number): Promise<any> => {
    return apiService.post<any>(`/teachers/class-quizzes/${id}/auto_grade/`).then(res => res.data);
  },

  // Quiz Attempts
  getQuizAttempts: (params?: { quiz?: number; student?: number }): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/teachers/quiz-attempts/', { params }).then(res => res.data);
  },
  createQuizAttempt: (data: any): Promise<any> => {
    return apiService.post<any>('/teachers/quiz-attempts/', data).then(res => res.data);
  },
  submitQuizAttempt: (id: number, answers: any): Promise<any> => {
    return apiService.post<any>(`/teachers/quiz-attempts/${id}/submit/`, { answers }).then(res => res.data);
  },

  // Post Comments
  getPostComments: (params?: { post?: number }): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/teachers/post-comments/', { params }).then(res => res.data);
  },
  createPostComment: (data: any): Promise<any> => {
    return apiService.post<any>('/teachers/post-comments/', data).then(res => res.data);
  },
  updatePostComment: (id: number, data: any): Promise<any> => {
    return apiService.patch<any>(`/teachers/post-comments/${id}/`, data).then(res => res.data);
  },
  deletePostComment: (id: number): Promise<void> => {
    return apiService.delete(`/teachers/post-comments/${id}/`).then(() => undefined);
  },

  // Assignment Rubrics
  getAssignmentRubrics: (params?: { assignment?: number }): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/teachers/assignment-rubrics/', { params }).then(res => res.data);
  },
  createAssignmentRubric: (data: any): Promise<any> => {
    return apiService.post<any>('/teachers/assignment-rubrics/', data).then(res => res.data);
  },
  updateAssignmentRubric: (id: number, data: any): Promise<any> => {
    return apiService.patch<any>(`/teachers/assignment-rubrics/${id}/`, data).then(res => res.data);
  },
  deleteAssignmentRubric: (id: number): Promise<void> => {
    return apiService.delete(`/teachers/assignment-rubrics/${id}/`).then(() => undefined);
  },

  // Rubric Grades
  getRubricGrades: (params?: any): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/teachers/rubric-grades/', { params }).then(res => res.data);
  },
  createRubricGrade: (data: any): Promise<any> => {
    return apiService.post<any>('/teachers/rubric-grades/', data).then(res => res.data);
  },
  updateRubricGrade: (id: number, data: any): Promise<any> => {
    return apiService.patch<any>(`/teachers/rubric-grades/${id}/`, data).then(res => res.data);
  },

  // Class Codes
  getClassCodes: (params?: { class_obj?: number }): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/teachers/class-codes/', { params }).then(res => res.data);
  },
  createClassCode: (data: any): Promise<any> => {
    return apiService.post<any>('/teachers/class-codes/', data).then(res => res.data);
  },
  regenerateClassCode: (id: number): Promise<any> => {
    return apiService.post<any>(`/teachers/class-codes/${id}/regenerate/`).then(res => res.data);
  },
  joinClassWithCode: (code: string): Promise<any> => {
    return apiService.post<any>('/teachers/class-codes/join/', { code }).then(res => res.data);
  },

  // Grade Categories
  getGradeCategories: (params?: { class_obj?: number; subject?: number }): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/teachers/grade-categories/', { params }).then(res => res.data);
  },

  // Parent Messaging
  getConversations: (): Promise<any[]> => {
    return apiService.get<any[]>('/communications/messages/conversations/').then(res => res.data);
  },
  getConversation: (partnerId: number): Promise<any[]> => {
    return apiService.get<any[]>(`/communications/messages/conversation/?partner_id=${partnerId}`).then(res => res.data);
  },
  sendMessage: (data: { recipient: number; subject?: string; body: string; parent_message?: number }): Promise<any> => {
    return apiService.post<any>('/communications/messages/', data).then(res => res.data);
  },
  markMessageRead: (messageId: number): Promise<void> => {
    return apiService.post(`/communications/messages/${messageId}/mark_read/`).then(() => undefined);
  },
  getParentsForTeacher: (): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/students/guardians/', {
      params: { role: 'parent' }
    }).then(res => res.data);
  },
  createGradeCategory: (data: any): Promise<any> => {
    return apiService.post<any>('/teachers/grade-categories/', data).then(res => res.data);
  },
  updateGradeCategory: (id: number, data: any): Promise<any> => {
    return apiService.patch<any>(`/teachers/grade-categories/${id}/`, data).then(res => res.data);
  },
  deleteGradeCategory: (id: number): Promise<void> => {
    return apiService.delete(`/teachers/grade-categories/${id}/`).then(() => undefined);
  },
};

export default teachersService;

