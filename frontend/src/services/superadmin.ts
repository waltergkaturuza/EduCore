import apiService from './api';
import { PaginatedResponse } from '../types/api';

// Types
export interface SubscriptionPlan {
  id: number;
  name: string;
  slug: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  max_students: number;
  max_teachers: number;
  max_storage_gb: number;
  sms_quota: number;
  features: Record<string, any>;
  is_active: boolean;
  is_featured: boolean;
}

export interface TenantSubscription {
  id: number;
  tenant: number;
  tenant_name: string;
  plan: number;
  plan_name: string;
  billing_cycle: 'monthly' | 'yearly';
  amount: number;
  start_date: string;
  end_date?: string;
  trial_ends_at?: string;
  status: 'trial' | 'active' | 'expired' | 'cancelled' | 'suspended';
  auto_renew: boolean;
  last_payment_date?: string;
  next_billing_date?: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  tenant: number;
  tenant_name: string;
  subscription?: number;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  issue_date: string;
  due_date: string;
  paid_date?: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_method: string;
  payment_reference: string;
  notes: string;
  invoice_url?: string;
}

export interface SupportTicket {
  id: number;
  ticket_number: string;
  tenant: number;
  tenant_name: string;
  created_by?: number;
  created_by_name?: string;
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigned_to?: number;
  assigned_to_name?: string;
  first_response_at?: string;
  resolved_at?: string;
  replies_count?: number;
  last_reply_at?: string;
}

export interface AuditLog {
  id: number;
  user: number;
  user_email: string;
  user_name: string;
  impersonated_by?: number;
  impersonated_by_email?: string;
  session_key: string;
  ip_address: string;
  user_agent: string;
  action_type: string;
  resource_type: string;
  resource_id?: number;
  resource_name: string;
  changes: Record<string, any>;
  description: string;
  tenant?: number;
  tenant_name?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface PlatformMetrics {
  total_schools: number;
  active_schools: number;
  active_last_7d: number;
  active_last_30d: number;
  total_students: number;
  total_teachers: number;
  total_parents: number;
  mrr: number;
  arr: number;
  trial_schools: number;
  paid_schools: number;
  sms_sent: number;
  sms_remaining: number;
  storage_used: number;
  storage_total: number;
  uptime: number;
  error_rate: number;
  new_signups: number;
  payment_success_rate: number;
}

export const superadminService = {
  // Platform Metrics
  getMetrics: (): Promise<PlatformMetrics> => {
    return apiService.get<PlatformMetrics>('/superadmin/metrics/').then(res => res.data);
  },
  getPlatformMetrics: (params?: any): Promise<PlatformMetrics> => {
    return apiService.get<PlatformMetrics>('/superadmin/metrics/', { params }).then(res => res.data);
  },

  // Subscription Plans
  getSubscriptionPlans: (params?: any): Promise<PaginatedResponse<SubscriptionPlan>> => {
    return apiService.get<PaginatedResponse<SubscriptionPlan>>('/superadmin/subscription-plans/', { params }).then(res => res.data);
  },
  createSubscriptionPlan: (data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> => {
    return apiService.post<SubscriptionPlan>('/superadmin/subscription-plans/', data).then(res => res.data);
  },
  updateSubscriptionPlan: (id: number, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> => {
    return apiService.patch<SubscriptionPlan>(`/superadmin/subscription-plans/${id}/`, data).then(res => res.data);
  },
  deleteSubscriptionPlan: (id: number): Promise<void> => {
    return apiService.delete(`/superadmin/subscription-plans/${id}/`).then(() => undefined);
  },

  // Subscriptions
  getSubscriptions: (params?: any): Promise<PaginatedResponse<TenantSubscription>> => {
    return apiService.get<PaginatedResponse<TenantSubscription>>('/superadmin/subscriptions/', { params }).then(res => res.data);
  },
  cancelSubscription: (id: number): Promise<void> => {
    return apiService.post(`/superadmin/subscriptions/${id}/cancel/`).then(() => undefined);
  },
  renewSubscription: (id: number): Promise<void> => {
    return apiService.post(`/superadmin/subscriptions/${id}/renew/`).then(() => undefined);
  },

  // Invoices
  getInvoices: (params?: any): Promise<PaginatedResponse<Invoice>> => {
    return apiService.get<PaginatedResponse<Invoice>>('/superadmin/invoices/', { params }).then(res => res.data);
  },
  downloadInvoice: (id: number): Promise<Blob> => {
    return apiService.get<Blob>(`/superadmin/invoices/${id}/download/`, { responseType: 'blob' }).then(res => res.data);
  },
  exportInvoices: (params?: any): Promise<Blob> => {
    return apiService.post<Blob>('/superadmin/invoices/export/', params, { responseType: 'blob' }).then(res => res.data);
  },

  // Support Tickets
  getSupportTickets: (params?: any): Promise<PaginatedResponse<SupportTicket>> => {
    return apiService.get<PaginatedResponse<SupportTicket>>('/superadmin/support-tickets/', { params }).then(res => res.data);
  },
  getSupportTicket: (id: number): Promise<SupportTicket> => {
    return apiService.get<SupportTicket>(`/superadmin/support-tickets/${id}/`).then(res => res.data);
  },
  assignTicket: (id: number, userId: number): Promise<void> => {
    return apiService.post(`/superadmin/support-tickets/${id}/assign/`, { assigned_to: userId }).then(() => undefined);
  },
  replyToTicket: (id: number, message: string, isInternal?: boolean): Promise<any> => {
    return apiService.post(`/superadmin/support-tickets/${id}/reply/`, { message, is_internal: isInternal }).then(res => res.data);
  },

  // Impersonation
  startImpersonation: (tenantId: number, targetUserId?: number): Promise<any> => {
    return apiService.post('/superadmin/impersonation-sessions/start/', {
      tenant_id: tenantId,
      target_user_id: targetUserId,
    }).then(res => res.data);
  },
  endImpersonation: (sessionId: number): Promise<void> => {
    return apiService.post(`/superadmin/impersonation-sessions/${sessionId}/end/`).then(() => undefined);
  },

  // Audit Logs
  getAuditLogs: (params?: any): Promise<PaginatedResponse<AuditLog>> => {
    return apiService.get<PaginatedResponse<AuditLog>>('/superadmin/audit-logs/', { params }).then(res => res.data);
  },
  exportAuditLogs: (params?: any): Promise<Blob> => {
    return apiService.post<Blob>('/superadmin/audit-logs/export/', params, { responseType: 'blob' }).then(res => res.data);
  },

  // Feature Flags
  getFeatureFlags: (): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/superadmin/feature-flags/').then(res => res.data);
  },
  createFeatureFlag: (data: any): Promise<any> => {
    return apiService.post('/superadmin/feature-flags/', data).then(res => res.data);
  },
  updateFeatureFlag: (id: number, data: any): Promise<any> => {
    return apiService.patch(`/superadmin/feature-flags/${id}/`, data).then(res => res.data);
  },

  // System Health
  getSystemHealth: (hours?: number): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/superadmin/system-health/', { params: { hours } }).then(res => res.data);
  },

  // Global Users
  getGlobalUsers: (params?: any): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/superadmin/global-users/', { params }).then(res => res.data);
  },
  activateGlobalUser: (id: number): Promise<void> => {
    return apiService.post(`/superadmin/global-users/${id}/activate/`).then(() => undefined);
  },
  deactivateGlobalUser: (id: number): Promise<void> => {
    return apiService.post(`/superadmin/global-users/${id}/deactivate/`).then(() => undefined);
  },

  // API Keys
  getAPIKeys: (params?: any): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/superadmin/api-keys/', { params }).then(res => res.data);
  },
  createAPIKey: (data: any): Promise<any> => {
    return apiService.post('/superadmin/api-keys/', data).then(res => res.data);
  },
  regenerateAPIKey: (id: number): Promise<any> => {
    return apiService.post(`/superadmin/api-keys/${id}/regenerate/`).then(res => res.data);
  },
  revokeAPIKey: (id: number): Promise<void> => {
    return apiService.post(`/superadmin/api-keys/${id}/revoke/`).then(() => undefined);
  },

  // Payment Gateways
  getPaymentGateways: (): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/superadmin/payment-gateways/').then(res => res.data);
  },
  getGatewayStatistics: (): Promise<any> => {
    return apiService.get('/superadmin/payment-gateways/statistics/').then(res => res.data);
  },

  // Payment Transactions
  getPaymentTransactions: (params?: any): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/superadmin/payment-transactions/', { params }).then(res => res.data);
  },
  getReconciliation: (startDate: string, endDate: string, gatewayId?: number): Promise<any> => {
    return apiService.get('/superadmin/analytics/payment-reconciliation/', {
      params: { start_date: startDate, end_date: endDate, gateway_id: gatewayId }
    }).then(res => res.data);
  },

  // Leads
  getLeads: (params?: any): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/superadmin/leads/', { params }).then(res => res.data);
  },
  convertLeadToTrial: (id: number): Promise<any> => {
    return apiService.post(`/superadmin/leads/${id}/convert_to_trial/`).then(res => res.data);
  },
  markLeadConverted: (id: number): Promise<any> => {
    return apiService.post(`/superadmin/leads/${id}/mark_converted/`).then(res => res.data);
  },
  getConversionStats: (): Promise<any> => {
    return apiService.get('/superadmin/leads/conversion_stats/').then(res => res.data);
  },

  // Backups
  getBackups: (params?: any): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/superadmin/backups/', { params }).then(res => res.data);
  },
  createBackup: (tenantId: number, backupType?: string): Promise<any> => {
    return apiService.post('/superadmin/backups/create_backup/', {
      tenant_id: tenantId,
      backup_type: backupType || 'full'
    }).then(res => res.data);
  },
  restoreBackup: (id: number): Promise<any> => {
    return apiService.post(`/superadmin/backups/${id}/restore/`).then(res => res.data);
  },

  // Content
  getContent: (params?: any): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/superadmin/content/', { params }).then(res => res.data);
  },
  approveContent: (id: number): Promise<void> => {
    return apiService.post(`/superadmin/content/${id}/approve/`).then(() => undefined);
  },
  publishContent: (id: number): Promise<void> => {
    return apiService.post(`/superadmin/content/${id}/publish/`).then(() => undefined);
  },
  getContentStatistics: (): Promise<any> => {
    return apiService.get('/superadmin/content/statistics/').then(res => res.data);
  },

  // Contracts
  getContracts: (params?: any): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/superadmin/contracts/', { params }).then(res => res.data);
  },
  signContract: (id: number): Promise<any> => {
    return apiService.post(`/superadmin/contracts/${id}/sign/`).then(res => res.data);
  },
  setCurrentContract: (id: number): Promise<any> => {
    return apiService.post(`/superadmin/contracts/${id}/set_current/`).then(res => res.data);
  },

  // Announcements
  getAnnouncements: (params?: any): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/superadmin/global-announcements/', { params }).then(res => res.data);
  },
  publishAnnouncement: (id: number): Promise<any> => {
    return apiService.post(`/superadmin/announcements/${id}/publish/`).then(res => res.data);
  },

  // Knowledge Base
  getKBArticles: (params?: any): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/superadmin/knowledge-base/', { params }).then(res => res.data);
  },
  incrementKBView: (id: number): Promise<any> => {
    return apiService.post(`/superadmin/knowledge-base/${id}/increment_view/`).then(res => res.data);
  },

  // Onboarding
  getOnboardingChecklists: (params?: any): Promise<PaginatedResponse<any>> => {
    return apiService.get<PaginatedResponse<any>>('/superadmin/onboarding-checklists/', { params }).then(res => res.data);
  },
  completeOnboardingItem: (id: number, itemIndex: number): Promise<any> => {
    return apiService.post(`/superadmin/onboarding-checklists/${id}/complete_item/`, {
      item_index: itemIndex
    }).then(res => res.data);
  },
  addOnboardingItem: (id: number, task: string): Promise<any> => {
    return apiService.post(`/superadmin/onboarding-checklists/${id}/add_item/`, { task }).then(res => res.data);
  },
  getOnboardingStatistics: (): Promise<any> => {
    return apiService.get('/superadmin/onboarding-checklists/statistics/').then(res => res.data);
  },

  // Analytics
  getChurnAnalysis: (days?: number): Promise<any> => {
    return apiService.get('/superadmin/analytics/churn/', { params: { days } }).then(res => res.data);
  },
  getTenantLTV: (tenantId: number): Promise<any> => {
    return apiService.get(`/superadmin/analytics/ltv/${tenantId}/`).then(res => res.data);
  },
  getChurnRisk: (tenantId: number): Promise<any> => {
    return apiService.get(`/superadmin/analytics/churn-risk/${tenantId}/`).then(res => res.data);
  },
  getConversionRate: (source?: string, days?: number): Promise<any> => {
    return apiService.get('/superadmin/analytics/conversion-rate/', {
      params: { source, days }
    }).then(res => res.data);
  },
  getRevenueForecast: (months?: number): Promise<any> => {
    return apiService.get('/superadmin/analytics/revenue-forecast/', {
      params: { months }
    }).then(res => res.data);
  },
};

