export enum ServiceStatus {
  PENDING = 'Chờ xử lý',
  PROCESSING = 'Đang xử lý',
  COMPLETED = 'Đã hoàn thành',
  CANCELLED = 'Đã hủy'
}

export interface CustomerRecord {
  id: string;
  date: string;
  customerName: string;
  serviceType: string;
  documentsProvided: string;
  documentLink?: string;
  returnDate?: string;
  status: ServiceStatus;
  note?: string;
}

export interface DashboardStats {
  total: number;
  pending: number;
  completed: number;
  // p đã được xóa bỏ để tránh lỗi build
}