/**
 * School Admin API Service
 * Comprehensive service for all School Admin (Tenant) operations
 */
import apiService from './api';
import { PaginatedResponse } from '../types/api';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface DashboardMetrics {
  id: number;
  tenant: number;
  tenant_name: string;
  calculated_at: string;
  total_enrollment: number;
  enrollment_by_gender: Record<string, number>;
  enrollment_by_grade: Record<string, number>;
  enrollment_by_stream: Record<string, number>;
  total_teachers: number;
  active_teachers: number;
  teacher_utilization_ratio: number;
  student_teacher_ratio: number;
  attendance_today: number;
  attendance_percentage_today: number;
  chronic_absenteeism_count: number;
  chronic_absenteeism_risk_index: number;
  academic_performance_index: number;
  average_grade: number;
  fee_collection_today: number;
  fee_collection_term: number;
  fee_collection_year: number;
  fee_collection_vs_target: number;
  outstanding_fees_30_days: number;
  outstanding_fees_60_days: number;
  outstanding_fees_90_days: number;
  teachers_active_today: number;
  parents_active_today: number;
  students_active_today: number;
  missing_marks_count: number;
  late_attendance_count: number;
  compliance_alerts: Array<{ type: string; message: string; severity: string }>;
  dropout_risk_count: number;
  exam_failure_prediction: Record<string, any>;
  teacher_overload_alerts: Array<any>;
  revenue_forecast: Record<string, number>;
  at_risk_students: Array<any>;
}

export interface AdmissionApplication {
  id: number;
  tenant: number;
  tenant_name: string;
  academic_year: number;
  academic_year_name: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  applied_class: number | null;
  applied_class_name: string | null;
  application_number: string;
  application_date: string;
  stage: string;
  documents: string[];
  interview_date: string | null;
  interview_notes: string;
  interview_score: number | null;
  acceptance_letter_sent: boolean;
  acceptance_letter_sent_at: string | null;
  enrollment_contract_signed: boolean;
  pre_invoice_created: boolean;
  pre_invoice: number | null;
  notes: string;
  communication_log: any[];
}

export interface ExamCycle {
  id: number;
  tenant: number;
  tenant_name: string;
  academic_year: number;
  academic_year_name: string;
  term: number;
  term_name: string;
  name: string;
  exam_type: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  moderation_required: boolean;
  moderation_status: string;
  moderated_by: number | null;
  moderated_by_name: string | null;
  moderated_at: string | null;
  is_locked: boolean;
  locked_by: number | null;
  locked_by_name: string | null;
  locked_at: string | null;
}

export interface CommunicationCampaign {
  id: number;
  tenant: number;
  tenant_name: string;
  name: string;
  campaign_type: string;
  template: number | null;
  template_name: string | null;
  target_audience: string;
  target_list: any[];
  message_content: string;
  scheduled_at: string | null;
  status: string;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  opened_count: number;
  sent_at: string | null;
  completed_at: string | null;
  created_by: number;
  created_by_name: string | null;
}

export interface GeneratedReport {
  id: number;
  tenant: number;
  tenant_name: string;
  template: number | null;
  template_name: string | null;
  report_name: string;
  report_type: string;
  format: string;
  file: string;
  file_size: number;
  parameters: Record<string, any>;
  date_range_start: string | null;
  date_range_end: string | null;
  status: string;
  record_count: number;
  generation_time_seconds: number | null;
  generated_by: number;
  generated_by_name: string | null;
  generated_at: string;
}

export interface MinistryExport {
  id: number;
  tenant: number;
  tenant_name: string;
  export_format: number;
  export_format_name: string;
  export_name: string;
  file: string;
  file_size: number;
  academic_year: number | null;
  academic_year_name: string | null;
  term: number | null;
  term_name: string | null;
  date_range_start: string | null;
  date_range_end: string | null;
  status: string;
  submitted_to_ministry: boolean;
  submission_date: string | null;
  submission_reference: string;
  submission_notes: string;
  exported_by: number;
  exported_by_name: string | null;
  exported_at: string;
}

// ============================================================================
// Service Methods
// ============================================================================

export const schooladminService = {
  // Dashboard Metrics
  getDashboardMetrics: (): Promise<PaginatedResponse<DashboardMetrics>> => {
    return apiService.get<PaginatedResponse<DashboardMetrics>>('/schooladmin/dashboard-metrics/').then(res => res.data);
  },
  getLatestMetrics: (): Promise<DashboardMetrics> => {
    return apiService.get<DashboardMetrics>('/schooladmin/dashboard-metrics/latest/').then(res => {
      // Handle both direct response and paginated response
      if (res.data && 'results' in res.data) {
        return (res.data as any).results[0] || res.data;
      }
      return res.data;
    });
  },
  calculateMetrics: (): Promise<DashboardMetrics> => {
    return apiService.post<DashboardMetrics>('/schooladmin/dashboard-metrics/calculate/').then(res => res.data);
  },

  // Admission Applications
  getAdmissionApplications: (params?: any): Promise<PaginatedResponse<AdmissionApplication>> => {
    return apiService.get<PaginatedResponse<AdmissionApplication>>('/schooladmin/admission-applications/', { params }).then(res => res.data);
  },
  createAdmissionApplication: (data: any): Promise<AdmissionApplication> => {
    return apiService.post<AdmissionApplication>('/schooladmin/admission-applications/', data).then(res => res.data);
  },
  updateAdmissionApplication: (id: number, data: any): Promise<AdmissionApplication> => {
    return apiService.patch<AdmissionApplication>(`/schooladmin/admission-applications/${id}/`, data).then(res => res.data);
  },
  moveApplicationStage: (id: number, stage: string): Promise<AdmissionApplication> => {
    return apiService.post<AdmissionApplication>(`/schooladmin/admission-applications/${id}/move_stage/`, { stage }).then(res => res.data);
  },
  sendAcceptanceLetter: (id: number): Promise<AdmissionApplication> => {
    return apiService.post<AdmissionApplication>(`/schooladmin/admission-applications/${id}/send_acceptance_letter/`).then(res => res.data);
  },

  // Exam Cycles
  getExamCycles: (params?: any): Promise<PaginatedResponse<ExamCycle>> => {
    return apiService.get<PaginatedResponse<ExamCycle>>('/schooladmin/exam-cycles/', { params }).then(res => res.data);
  },
  createExamCycle: (data: any): Promise<ExamCycle> => {
    return apiService.post<ExamCycle>('/schooladmin/exam-cycles/', data).then(res => res.data);
  },
  lockExamCycle: (id: number): Promise<ExamCycle> => {
    return apiService.post<ExamCycle>(`/schooladmin/exam-cycles/${id}/lock/`).then(res => res.data);
  },
  unlockExamCycle: (id: number): Promise<ExamCycle> => {
    return apiService.post<ExamCycle>(`/schooladmin/exam-cycles/${id}/unlock/`).then(res => res.data);
  },

  // Communication Campaigns
  getCommunicationCampaigns: (params?: any): Promise<PaginatedResponse<CommunicationCampaign>> => {
    return apiService.get<PaginatedResponse<CommunicationCampaign>>('/schooladmin/communication-campaigns/', { params }).then(res => res.data);
  },
  createCommunicationCampaign: (data: any): Promise<CommunicationCampaign> => {
    return apiService.post<CommunicationCampaign>('/schooladmin/communication-campaigns/', data).then(res => res.data);
  },
  sendCampaign: (id: number): Promise<CommunicationCampaign> => {
    return apiService.post<CommunicationCampaign>(`/schooladmin/communication-campaigns/${id}/send/`).then(res => res.data);
  },

  // Generated Reports
  getGeneratedReports: (params?: any): Promise<PaginatedResponse<GeneratedReport>> => {
    return apiService.get<PaginatedResponse<GeneratedReport>>('/schooladmin/generated-reports/', { params }).then(res => res.data);
  },
  createGeneratedReport: (data: any): Promise<GeneratedReport> => {
    return apiService.post<GeneratedReport>('/schooladmin/generated-reports/', data).then(res => res.data);
  },
  regenerateReport: (id: number): Promise<GeneratedReport> => {
    return apiService.post<GeneratedReport>(`/schooladmin/generated-reports/${id}/regenerate/`).then(res => res.data);
  },

  // Ministry Exports
  getMinistryExports: (params?: any): Promise<PaginatedResponse<MinistryExport>> => {
    return apiService.get<PaginatedResponse<MinistryExport>>('/schooladmin/ministry-exports/', { params }).then(res => res.data);
  },
  createMinistryExport: (data: any): Promise<MinistryExport> => {
    return apiService.post<MinistryExport>('/schooladmin/ministry-exports/', data).then(res => res.data);
  },
  generateMinistryExport: (id: number): Promise<MinistryExport> => {
    return apiService.post<MinistryExport>(`/schooladmin/ministry-exports/${id}/generate/`).then(res => res.data);
  },
  submitMinistryExport: (id: number, data: { submission_reference?: string; submission_notes?: string }): Promise<MinistryExport> => {
    return apiService.post<MinistryExport>(`/schooladmin/ministry-exports/${id}/submit/`, data).then(res => res.data);
  },

  // School Profile
  getSchoolProfile: (): Promise<any> => {
    return apiService.get<any>('/schooladmin/school-profile/').then(res => res.data);
  },
  updateSchoolProfile: (data: any): Promise<any> => {
    return apiService.patch<any>('/schooladmin/school-profile/', data).then(res => res.data);
  },

  // Academic Configuration
  getAcademicConfig: (): Promise<any> => {
    return apiService.get<any>('/schooladmin/academic-config/').then(res => res.data);
  },
  updateAcademicConfig: (data: any): Promise<any> => {
    return apiService.patch<any>('/schooladmin/academic-config/', data).then(res => res.data);
  },

  // Student Documents
  getStudentDocuments: (params?: any): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/schooladmin/student-documents/', { params }).then(res => res.data);
  },
  createStudentDocument: (data: any): Promise<any> => {
    return apiService.post<any>('/schooladmin/student-documents/', data).then(res => res.data);
  },

  // Student Lifecycle Events
  getStudentLifecycleEvents: (params?: any): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/schooladmin/student-lifecycle-events/', { params }).then(res => res.data);
  },
  createStudentLifecycleEvent: (data: any): Promise<any> => {
    return apiService.post<any>('/schooladmin/student-lifecycle-events/', data).then(res => res.data);
  },

  // Timetable Versions
  getTimetableVersions: (params?: any): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/schooladmin/timetable-versions/', { params }).then(res => res.data);
  },
  createTimetableVersion: (data: any): Promise<any> => {
    return apiService.post<any>('/schooladmin/timetable-versions/', data).then(res => res.data);
  },
  publishTimetableVersion: (id: number): Promise<any> => {
    return apiService.post<any>(`/schooladmin/timetable-versions/${id}/publish/`).then(res => res.data);
  },
  activateTimetableVersion: (id: number): Promise<any> => {
    return apiService.post<any>(`/schooladmin/timetable-versions/${id}/activate/`).then(res => res.data);
  },

  // Attendance Alerts
  getAttendanceAlerts: (params?: any): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/schooladmin/attendance-alerts/', { params }).then(res => res.data);
  },
  sendAttendanceAlert: (id: number): Promise<any> => {
    return apiService.post<any>(`/schooladmin/attendance-alerts/${id}/send_alert/`).then(res => res.data);
  },

  // Grade Moderation
  getGradeModerations: (params?: any): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/schooladmin/grade-moderations/', { params }).then(res => res.data);
  },
  approveGradeModeration: (id: number): Promise<any> => {
    return apiService.post<any>(`/schooladmin/grade-moderations/${id}/approve/`).then(res => res.data);
  },

  // Fee Structures Enhanced
  getFeeStructuresEnhanced: (params?: any): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/schooladmin/fee-structures-enhanced/', { params }).then(res => res.data);
  },
  createFeeStructureEnhanced: (data: any): Promise<any> => {
    return apiService.post<any>('/schooladmin/fee-structures-enhanced/', data).then(res => res.data);
  },

  // Payment Reconciliations
  getPaymentReconciliations: (params?: any): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/schooladmin/payment-reconciliations/', { params }).then(res => res.data);
  },
  createPaymentReconciliation: (data: any): Promise<any> => {
    return apiService.post<any>('/schooladmin/payment-reconciliations/', data).then(res => res.data);
  },

  // Staff Records
  getStaffRecords: (params?: any): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/schooladmin/staff-records/', { params }).then(res => res.data);
  },
  createStaffRecord: (data: any): Promise<any> => {
    return apiService.post<any>('/schooladmin/staff-records/', data).then(res => res.data);
  },

  // Staff Appraisals
  getStaffAppraisals: (params?: any): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/schooladmin/staff-appraisals/', { params }).then(res => res.data);
  },
  createStaffAppraisal: (data: any): Promise<any> => {
    return apiService.post<any>('/schooladmin/staff-appraisals/', data).then(res => res.data);
  },

  // Leave Requests
  getLeaveRequests: (params?: any): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/schooladmin/leave-requests/', { params }).then(res => res.data);
  },
  approveLeaveRequest: (id: number): Promise<any> => {
    return apiService.post<any>(`/schooladmin/leave-requests/${id}/approve/`).then(res => res.data);
  },
  rejectLeaveRequest: (id: number, reason: string): Promise<any> => {
    return apiService.post<any>(`/schooladmin/leave-requests/${id}/reject/`, { rejection_reason: reason }).then(res => res.data);
  },

  // Message Templates
  getMessageTemplates: (params?: any): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/schooladmin/message-templates/', { params }).then(res => res.data);
  },
  createMessageTemplate: (data: any): Promise<any> => {
    return apiService.post<any>('/schooladmin/message-templates/', data).then(res => res.data);
  },

  // Communication Logs
  getCommunicationLogs: (params?: any): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/schooladmin/communication-logs/', { params }).then(res => res.data);
  },

  // Event Invitations
  getEventInvitations: (params?: any): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/schooladmin/event-invitations/', { params }).then(res => res.data);
  },
  createEventInvitation: (data: any): Promise<any> => {
    return apiService.post<any>('/schooladmin/event-invitations/', data).then(res => res.data);
  },

  // RSVP Responses
  getRSVPResponses: (params?: any): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/schooladmin/rsvp-responses/', { params }).then(res => res.data);
  },
  createRSVPResponse: (data: any): Promise<any> => {
    return apiService.post<any>('/schooladmin/rsvp-responses/', data).then(res => res.data);
  },

  // Report Templates
  getReportTemplates: (params?: any): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/schooladmin/report-templates/', { params }).then(res => res.data);
  },
  createReportTemplate: (data: any): Promise<any> => {
    return apiService.post<any>('/schooladmin/report-templates/', data).then(res => res.data);
  },

  // Analytics Queries
  getAnalyticsQueries: (params?: any): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/schooladmin/analytics-queries/', { params }).then(res => res.data);
  },
  createAnalyticsQuery: (data: any): Promise<any> => {
    return apiService.post<any>('/schooladmin/analytics-queries/', data).then(res => res.data);
  },
  executeAnalyticsQuery: (id: number): Promise<any> => {
    return apiService.post<any>(`/schooladmin/analytics-queries/${id}/execute/`).then(res => res.data);
  },

  // Ministry Export Formats
  getMinistryExportFormats: (params?: any): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/schooladmin/ministry-export-formats/', { params }).then(res => res.data);
  },
  createMinistryExportFormat: (data: any): Promise<any> => {
    return apiService.post<any>('/schooladmin/ministry-export-formats/', data).then(res => res.data);
  },
};

export default schooladminService;

