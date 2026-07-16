// Utility functions for handling invitations
export const invitationUtils = {
  // Get invitation status badge class
  getStatusBadgeClass: (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'expired':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  },

  // Get invitation status icon
  getStatusIcon: (status) => {
    switch (status) {
      case 'pending':
        return '🕒'; // or use an icon component
      case 'accepted':
        return '✅';
      case 'rejected':
        return '❌';
      case 'expired':
        return '⌛';
      case 'cancelled':
        return '🚫';
      default:
        return '📧';
    }
  },

  // Format invitation status text
  formatStatus: (status) => {
    const statusMap = {
      'pending': 'Pending',
      'accepted': 'Accepted',
      'rejected': 'Rejected',
      'expired': 'Expired',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  },

  // Check if invitation is actionable
  isActionable: (invitation) => {
    return invitation.status === 'pending' && !invitation.is_expired;
  },

  // Calculate invitation expiry date
  calculateExpiryDate: (invitedAt, daysValid = 7) => {
    const invitedDate = new Date(invitedAt);
    const expiryDate = new Date(invitedDate);
    expiryDate.setDate(expiryDate.getDate() + daysValid);
    return expiryDate;
  },

  // Check if invitation is expired
  isExpired: (invitedAt, daysValid = 7) => {
    const expiryDate = calculateExpiryDate(invitedAt, daysValid);
    return new Date() > expiryDate;
  },

  // Get days remaining until expiry
  getDaysRemaining: (invitedAt, daysValid = 7) => {
    const expiryDate = calculateExpiryDate(invitedAt, daysValid);
    const now = new Date();
    const diffTime = expiryDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  },

  // Validate email for invitation
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Generate invitation message template
  generateInvitationMessage: (planName, inviterName) => {
    return `You have been invited by ${inviterName} to join the saving plan "${planName}".`;
  },

  // Get invitation link for sharing
  getInvitationLink: (invitationToken) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/invitations/accept/${invitationToken}`;
  },

  // Parse invitation metadata
  parseMetadata: (metadata) => {
    try {
      return typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
    } catch {
      return {};
    }
  }
};

// Export individual functions as well
export const getStatusBadgeClass = invitationUtils.getStatusBadgeClass;
export const getStatusIcon = invitationUtils.getStatusIcon;
export const formatStatus = invitationUtils.formatStatus;
export const isActionable = invitationUtils.isActionable;