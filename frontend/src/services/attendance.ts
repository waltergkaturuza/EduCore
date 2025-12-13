import apiService from './api';
import { PaginatedResponse } from '../types/api';

export interface Attendance {
  id: number;
  student_id: string;
  student_name: string;
  status: string;
  date: string;
}

export const attendanceService = {
  getAll: (params?: any) => 
    apiService.get<PaginatedResponse<Attendance>>('/attendance/attendance/', { params }),
  create: (data: any) => apiService.post<Attendance>('/attendance/attendance/', data),
  bulkMark: (data: any) => apiService.post('/attendance/attendance/bulk_mark/', data),
};

