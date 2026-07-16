import api from './api.js';

const invitationsService = {
  // Get pending invitations for the current user
  getPendingInvitations: async (params = {}) => {
    try {
      const response = await api.get('/invitations/pending', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
      throw error;
    }
  },

  // Get invitation by ID
  getInvitationById: async (invitationId) => {
    try {
      const response = await api.get(`/invitations/${invitationId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching invitation:', error);
      throw error;
    }
  },

  // Accept an invitation
  acceptInvitation: async (invitationId) => {
    try {
      const response = await api.put(`/invitations/${invitationId}/accept`);
      return response.data;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  },

  // Reject an invitation
  rejectInvitation: async (invitationId) => {
    try {
      const response = await api.put(`/invitations/${invitationId}/reject`);
      return response.data;
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      throw error;
    }
  },

  // Send invitation to user
  sendInvitation: async (invitationData) => {
    try {
      const response = await api.post('/invitations', invitationData);
      return response.data;
    } catch (error) {
      console.error('Error sending invitation:', error);
      throw error;
    }
  },

  // Get all invitations (for admin/plan owner)
  getAllInvitations: async (params = {}) => {
    try {
      const response = await api.get('/invitations', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching all invitations:', error);
      throw error;
    }
  },

  // Resend invitation
  resendInvitation: async (invitationId) => {
    try {
      const response = await api.put(`/invitations/${invitationId}/resend`);
      return response.data;
    } catch (error) {
      console.error('Error resending invitation:', error);
      throw error;
    }
  },

  // Cancel/delete invitation
  cancelInvitation: async (invitationId) => {
    try {
      const response = await api.delete(`/invitations/${invitationId}`);
      return response.data;
    } catch (error) {
      console.error('Error canceling invitation:', error);
      throw error;
    }
  },

  // Get invitation statistics
  getInvitationStats: async () => {
    try {
      const response = await api.get('/invitations/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching invitation stats:', error);
      throw error;
    }
  },

  // Get pending invitations count (for badge/notification)
  getPendingCount: async () => {
    try {
      const response = await api.get('/invitations/pending-count');
      return response.data;
    } catch (error) {
      console.error('Error fetching pending count:', error);
      throw error;
    }
  },

  // Bulk send invitations
  bulkSendInvitations: async (invitationsData) => {
    try {
      const response = await api.post('/invitations/bulk', invitationsData);
      return response.data;
    } catch (error) {
      console.error('Error sending bulk invitations:', error);
      throw error;
    }
  },

  // Get invitation history for a plan
  getPlanInvitations: async (planId, params = {}) => {
    try {
      const response = await api.get(`/invitations/plan/${planId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching plan invitations:', error);
      throw error;
    }
  },

  // Get user's invitation history
  getUserInvitationHistory: async (userId, params = {}) => {
    try {
      const response = await api.get(`/invitations/user/${userId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching user invitation history:', error);
      throw error;
    }
  },

  // Search users to invite
  searchUsersToInvite: async (searchTerm, params = {}) => {
    try {
      const response = await api.get('/invitations/search-users', { 
        params: { search: searchTerm, ...params } 
      });
      return response.data;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  },

  // Validate invitation token (for email links)
  validateInvitationToken: async (token) => {
    try {
      const response = await api.get(`/invitations/validate/${token}`);
      return response.data;
    } catch (error) {
      console.error('Error validating invitation token:', error);
      throw error;
    }
  },

  // Accept invitation by token (for email links)
  acceptInvitationByToken: async (token) => {
    try {
      const response = await api.put(`/invitations/token/${token}/accept`);
      return response.data;
    } catch (error) {
      console.error('Error accepting invitation by token:', error);
      throw error;
    }
  }
};

export default invitationsService;