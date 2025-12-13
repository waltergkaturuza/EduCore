import apiService from './api';
import { PaginatedResponse } from '../types/api';

export interface Invoice {
  id: number;
  invoice_number: string;
  student_name: string;
  total_amount: string;
  paid_amount: string;
  balance: string;
  status: string;
  due_date: string;
}

export const feesService = {
  getInvoices: (params?: any) => 
    apiService.get<PaginatedResponse<Invoice>>('/fees/invoices/', { params }),
  createInvoice: (data: any) => apiService.post<Invoice>('/fees/invoices/', data),
  getPayments: (params?: any) => 
    apiService.get<PaginatedResponse<any>>('/fees/payments/', { params }),
  createPayment: (data: any) => apiService.post('/fees/payments/', data),
  getPaymentSummary: (params?: any) => 
    apiService.get('/fees/payments/summary/', { params }),
};

