import apiService from './api';
import { PaginatedResponse } from '../types/api';

export interface Student {
  id: number;
  student_id: string;
  user_full_name: string;
  current_class_name?: string;
  current_stream_name?: string;
  status: string;
}

export const studentsService = {
  getAll: (params?: any) => 
    apiService.get<PaginatedResponse<Student>>('/students/students/', { params }),
  getById: (id: number) => apiService.get<Student>(`/students/students/${id}/`),
  create: (data: any) => apiService.post<Student>('/students/students/', data),
  update: (id: number, data: any) => apiService.patch<Student>(`/students/students/${id}/`, data),
  delete: (id: number) => apiService.delete(`/students/students/${id}/`),
  getEnrollments: (params?: any) => 
    apiService.get<PaginatedResponse<any>>('/students/enrollments/', { params }),
};

