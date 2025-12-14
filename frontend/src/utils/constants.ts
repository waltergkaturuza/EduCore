export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  TEACHER: 'teacher',
  PARENT: 'parent',
  STUDENT: 'student',
} as const;

export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  EXCUSED: 'excused',
} as const;

export const INVOICE_STATUS = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
} as const;

export const PAYMENT_METHODS = {
  CASH: 'cash',
  ECOCASH: 'ecocash',
  ONEMONEY: 'onemoney',
  PAYNOW: 'paynow',
  BANK: 'bank',
} as const;




