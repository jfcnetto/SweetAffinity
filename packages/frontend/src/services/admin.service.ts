import { api } from './api';

export interface AdminDashboardData {
  totalActiveUsers: number;
  activeSubscriptions: number;
  mrr: number;
  arr: number;
  totalMatches: number;
}

export interface AdminUser {
  id: string;
  email: string;
  profileType: string;
  status: string;
  displayName: string;
  createdAt: string;
}

export interface AdminPendingPhoto {
  id: string;
  user_id: string;
  display_name: string;
  is_primary: boolean;
  created_at: string;
  url: string;
}

class AdminService {
  async getDashboardData(): Promise<AdminDashboardData> {
    const response = await api.get('/api/admin/dashboard');
    return response.data;
  }

  async getUsers(limit = 20, offset = 0): Promise<AdminUser[]> {
    const response = await api.get('/api/admin/users', { params: { limit, offset } });
    return response.data;
  }

  async updateUserStatus(id: string, status: string): Promise<void> {
    await api.put(`/api/admin/users/${id}/status`, { status });
  }

  async getPendingPhotos(): Promise<AdminPendingPhoto[]> {
    const response = await api.get('/api/admin/photos/pending');
    return response.data;
  }

  async moderatePhoto(id: string, approved: boolean): Promise<void> {
    await api.put(`/api/admin/photos/${id}/approval`, { approved });
  }
}

export const adminService = new AdminService();
