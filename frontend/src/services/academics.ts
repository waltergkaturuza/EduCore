import apiService from './api';
import { PaginatedResponse } from '../types/api';

export interface Class {
  id: number;
  name: string;
  academic_year_name: string;
  level: number;
  capacity: number;
  class_teacher_name?: string;
  streams?: any[];
}

export const academicsService = {
  getClasses: (params?: any) => 
    apiService.get<PaginatedResponse<Class>>('/academics/classes/', { params }),
  getSubjects: (params?: any) => 
    apiService.get<PaginatedResponse<any>>('/academics/subjects/', { params }),
  getTimetable: (params?: any) => 
    apiService.get<PaginatedResponse<any>>('/academics/timetable/', { params }),
  getAcademicYears: () => 
    apiService.get<PaginatedResponse<any>>('/academics/academic-years/'),
  getTerms: (params?: any) => 
    apiService.get<PaginatedResponse<any>>('/academics/terms/', { params }),
};

