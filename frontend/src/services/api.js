import axios from 'axios';
import { API_URL } from '../config/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Plan service
export const planService = {
  createPlan: (planData) => api.post('/plans', planData),
  getPlans: () => api.get('/plans'),
  getPlan: (id) => api.get(`/plans/${id}`),
  updatePlan: (id, planData) => api.put(`/plans/${id}`, planData),
  deletePlan: (id) => api.delete(`/plans/${id}`),
  getDashboardStats: () => api.get('/plans/dashboard/stats'),
  getUserPlanDetails: (planId) => api.get(`/plans/${planId}/user-details`),
  getPendingInvitations: (planId) => api.get(`/plans/${planId}/pending-invitations`),
  inviteExternal: (planId, data) => api.post(`/plans/${planId}/invite-external`, data),
};

// Deposit service
export const depositService = {
  createDeposit: (depositData) => api.post('/deposits', depositData),
  getPlanDeposits: (planId) => api.get(`/deposits/plan/${planId}`),
  getMyDeposits: () => api.get('/deposits/my-deposits'),
  getAllDeposits: () => api.get('/deposits/all'),
  getDepositById: (id) => api.get(`/deposits/${id}`),
  updateDeposit: (id, depositData) => api.put(`/deposits/${id}`, depositData),
  deleteDeposit: (id) => api.delete(`/deposits/${id}`),
  getDepositStats: () => api.get('/deposits/stats/overview'),
  // NEW: Approve a pending deposit
  approveDeposit: (id) => api.put(`/deposits/${id}/approve`),
  // NEW: Reject a pending deposit (with reason)
  rejectDeposit: (id, rejectionReason) => api.put(`/deposits/${id}/reject`, { rejection_reason: rejectionReason }),
  deleteDepositWithReason: (id, reason) => api.post(`/deposits/${id}/delete`, { reason }),
};

// Settings service
export const settingsService = {
  getSettings: () => api.get('/settings'),
  updateSettings: (settingsData) => api.put('/settings', settingsData)
};

// Notifications service
export const notificationService = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  deleteAllRead: () => api.delete('/notifications/delete-read'),
  getUnreadCount: () => api.get('/notifications/unread-count') // Added this
};

// Withdrawals service - FIXED to use the correct api instance
export const withdrawalService = {
  getWithdrawals: (params) => api.get('/withdrawals', { params }),
  createWithdrawal: (withdrawalData) => api.post('/withdrawals', withdrawalData),
  approveWithdrawal: (id) => api.put(`/withdrawals/${id}/approve`),
  rejectWithdrawal: (id, reason) => api.put(`/withdrawals/${id}/reject`, { rejection_reason: reason }),
  markWithdrawalAsPaid: (id) => api.put(`/withdrawals/${id}/pay`)
};

// Dashboard service
export const dashboardService = {
  getDashboardStats: () => api.get('/dashboard/stats')
};

// Members service - FIXED to use the correct api instance
export const memberService = {
  searchUsers: (params) => api.get('/members/search', { params }),
  inviteUser: (planId, data) => api.post(`/members/${planId}/invite`, data),
  respondToInvitation: (planId, accept) => api.put(`/members/${planId}/invite/respond`, { accept }),
  removeMember: (planId, userId) => api.delete(`/members/${planId}/members/${userId}`),
  updateMemberRole: (planId, userId, isAdmin) => api.put(`/members/${planId}/members/${userId}/role`, { is_admin: isAdmin })
};

// Plan settings service
export const planSettingsService = {
  updatePlanSettings: (planId, settingsData) => api.put(`/plans/${planId}/settings`, settingsData)
};

// Auth service
export const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (userData) => api.post('/auth/login', userData),
  getMe: () => api.get('/auth/me'),
  getStatistics: () => api.get('/auth/statistics'),
  updateProfile: (userData) => api.put('/auth/update-profile', userData),
  updatePassword: (passwordData) => api.put('/auth/update-password', passwordData),
  updateSettings: (settingsData) => api.put('/auth/settings', settingsData),
  setup2FA: (data) => api.post('/auth/setup-2fa', data),
  verify2FA: (data) => api.post('/auth/verify-2fa', data),

  uploadPhoto: (formData) => 
  api.post('/auth/upload-photo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  // Add these
  forgotPassword: (emailData) => {
    // Use public API for forgot password (no token required)
    const publicApi = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return publicApi.post('/auth/forgot-password', emailData);
  },
  resetPassword: (token, passwordData) => {
    // Use public API for reset password (no token required)
    const publicApi = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return publicApi.put(`/auth/reset-password/${token}`, passwordData);
  }
};

// Invitations service
export const invitationsService = {
  getInvitations: () => api.get('/invitations'), // Get ALL invitations
  getInvitationHistory: () => api.get('/invitations/history'),
  acceptInvitation: (id) => api.put(`/invitations/${id}/accept`),
  rejectInvitation: (id) => api.put(`/invitations/${id}/reject`),
  sendInvitation: (data) => api.post('/invitations', data),
  searchUsers: (search) => api.get(`/invitations/search-users?search=${search}`),
  cancelInvitation: (id) => api.delete(`/invitations/${id}`),
  getInvitationById: (id) => api.get(`/invitations/${id}`),
  getPendingCount: () => api.get('/invitations/pending-count'),
  getPendingInvitations: (params) => api.get('/invitations/pending', { params }),
  getInvitationsByStatus: (status) => api.get(`/invitations/status/${status}`),
  cancelExternalInvitation: (invitationId) => api.delete(`/invitations/external/${invitationId}`),
};

// Contact service - NEW (public endpoint, no auth required)
export const contactService = {
  submitContactForm: (formData) => {
    // Create a separate axios instance without auth token for public endpoints
    const publicApi = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return publicApi.post('/contact', formData);
  }
};

// Reminder service (if needed)
export const reminderService = {
  createReminder: (reminderData) => api.post('/reminders', reminderData),
  getReminders: () => api.get('/reminders'),
  updateReminder: (id, reminderData) => api.put(`/reminders/${id}`, reminderData),
  deleteReminder: (id) => api.delete(`/reminders/${id}`)
};

// User settings service (if needed)
export const userSettingsService = {
  getUserSettings: () => api.get('/user-settings'),
  updateUserSettings: (settingsData) => api.put('/user-settings', settingsData)
};

export default api;
