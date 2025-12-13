import apiService from './api';
import { PaginatedResponse } from '../types/api';

export interface Assignment {
  id: number;
  title: string;
  subject_name: string;
  class_name: string;
  due_date: string;
  is_published: boolean;
}

export interface Grade {
  id: number;
  student_name: string;
  assessment_name: string;
  score: number;
  percentage: number;
  letter_grade: string;
}

export const assessmentsService = {
  getAssignments: (params?: any) => 
    apiService.get<PaginatedResponse<Assignment>>('/assessments/assignments/', { params }),
  createAssignment: (data: any) => apiService.post<Assignment>('/assessments/assignments/', data),
  getGrades: (params?: any) => 
    apiService.get<PaginatedResponse<Grade>>('/assessments/grades/', { params }),
  createGrade: (data: any) => apiService.post<Grade>('/assessments/grades/', data),
  getReportCards: (params?: any) => 
    apiService.get<PaginatedResponse<any>>('/assessments/report-cards/', { params }),
};

