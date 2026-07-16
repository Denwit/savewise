import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { formatSaveWiseDate } from '../utils/date';
import { 
  FaEnvelope, 
  FaUserPlus, 
  FaCheckCircle, 
  FaTimesCircle,
  FaClock,
  FaUsers,
  FaEye,
  FaHistory,
  FaPaperPlane,
  FaUser,
  FaSync
} from 'react-icons/fa';

const Invitations = () => {
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // Default to pending
  const [stats, setStats] = useState({
    pending: 0,
    active: 0,
    rejected: 0,
    total: 0
  });

  const API_BASE = import.meta.env.VITE_API_URL || 'https://api.savewisezm.com/api';

  const formatDate = (dateString, dateFormat = 'MMM d, yyyy HH:mm') => formatSaveWiseDate(dateString, dateFormat);

  // Fetch ALL invitations (not just pending)
  const fetchInvitations = async () => {
    try {
      setLoading(true);
      console.log('Fetching ALL invitations...');
      
      const token = localStorage.getItem('token');
      

const response = await fetch(`${API_BASE}/invitations`, {
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API Response data:', data);
        console.log('Invitations array:', data.invitations);
        
        if (data.success) {
          setInvitations(data.invitations || []);
          setStats(data.stats || {
            pending: 0,
            active: 0,
            rejected: 0,
            total: 0
          });
          
          console.log('Set invitations:', data.invitations?.length || 0);
          console.log('Stats:', data.stats);
        } else {
          console.error('API returned success: false', data.message);
          toast.error(data.message || 'Failed to load invitations');
        }
      } else {
        console.error('API Error:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
        toast.error(errorData.message || 'Failed to load invitations');
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
      toast.error('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
    
    // Listen for notification clicks
    const handleNotificationClick = () => {
      console.log('Notification clicked, refreshing invitations...');
      fetchInvitations();
    };
    
    // Custom event listener for notification clicks
    window.addEventListener('notification-clicked', handleNotificationClick);
    
    return () => {
      window.removeEventListener('notification-clicked', handleNotificationClick);
    };
  }, []);

  // Handle accept invitation
  const handleAcceptInvitation = async (invitationId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE}/invitations/${invitationId}/accept`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success(data.message || 'Invitation accepted! You are now a member of this plan.');
          // Refresh the invitations list
          fetchInvitations();
        } else {
          toast.error(data.message || 'Failed to accept invitation');
        }
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Error accepting invitation');
    }
  };

  // Handle reject invitation
  const handleRejectInvitation = async (invitationId) => {
    if (!window.confirm('Are you sure you want to reject this invitation?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE}/invitations/${invitationId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success(data.message || 'Invitation rejected');
          fetchInvitations();
        } else {
          toast.error(data.message || 'Failed to reject invitation');
        }
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to reject invitation');
      }
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      toast.error('Error rejecting invitation');
    }
  };

  // Handle view plan
  const handleViewPlan = (planId) => {
    navigate(`/plans/${planId}`);
  };

  // Filter invitations based on active tab
  const filteredInvitations = invitations.filter(invitation => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return invitation.status === 'pending';
    if (activeTab === 'accepted') return invitation.status === 'active';
    if (activeTab === 'rejected') return invitation.status === 'rejected';
    return false;
  });

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FaClock className="text-yellow-500" />;
      case 'active':
        return <FaCheckCircle className="text-green-500" />;
      case 'rejected':
        return <FaTimesCircle className="text-red-500" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  // Get user avatar initial
  const getUserInitial = (user) => {
    if (!user || !user.username) return '?';
    return user.username.charAt(0).toUpperCase();
  };

  // Check if invitation is pending
  const isPending = (invitation) => invitation.status === 'pending';

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading invitations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <FaEnvelope className="mr-3 text-blue-600" />
                Invitations
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage your plan invitations - pending, accepted, and rejected
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={fetchInvitations}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
              >
                <FaSync className="mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Invitations</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.total}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FaEnvelope className="text-blue-600 dark:text-blue-400 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.pending}
                </p>
                {stats.pending > 0 && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    Action required
                  </p>
                )}
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <FaClock className="text-yellow-600 dark:text-yellow-400 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Accepted</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.active}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <FaCheckCircle className="text-green-600 dark:text-green-400 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Rejected</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.rejected}
                </p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <FaTimesCircle className="text-red-600 dark:text-red-400 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow mb-6">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center ${
                  activeTab === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <FaHistory className="mr-2" />
                All
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center ${
                  activeTab === 'pending'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <FaClock className="mr-2" />
                Pending
                {stats.pending > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                    {stats.pending}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('accepted')}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center ${
                  activeTab === 'accepted'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <FaCheckCircle className="mr-2" />
                Accepted
              </button>
              <button
                onClick={() => setActiveTab('rejected')}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center ${
                  activeTab === 'rejected'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <FaTimesCircle className="mr-2" />
                Rejected
              </button>
            </div>
          </div>

          {/* Invitations Table */}
          <div className="overflow-x-auto">
            {filteredInvitations.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-400 dark:text-gray-500 text-4xl mb-4">
                  <FaEnvelope className="mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No invitations found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {activeTab === 'pending' 
                    ? "You don't have any pending invitations."
                    : activeTab === 'accepted'
                    ? "You haven't accepted any invitations yet."
                    : activeTab === 'rejected'
                    ? "You haven't rejected any invitations."
                    : "You don't have any invitations."
                  }
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Plan Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Invited By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredInvitations.map((invitation) => (
                    <tr key={invitation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {invitation.plan?.plan_name || 'Unknown Plan'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {invitation.plan?.description || 'No description'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                            <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">
                              {getUserInitial(invitation.inviter)}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {invitation.inviter?.username || 'Unknown User'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {invitation.inviter?.email || 'No email'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          Invited: {formatDate(invitation.invited_at)}
                        </div>
                        {invitation.joined_at && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Joined: {formatDate(invitation.joined_at)}
                          </div>
                        )}
                        {invitation.updated_at !== invitation.created_at && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Updated: {formatDate(invitation.updated_at)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="mr-2">
                            {getStatusIcon(invitation.status)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(invitation.status)}`}>
                            {invitation.status?.charAt(0).toUpperCase() + invitation.status?.slice(1) || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {isPending(invitation) ? (
                            <>
                              <button
                                onClick={() => handleAcceptInvitation(invitation.id)}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm flex items-center"
                              >
                                <FaCheckCircle className="mr-1" size={12} />
                                Accept
                              </button>
                              <button
                                onClick={() => handleRejectInvitation(invitation.id)}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm flex items-center"
                              >
                                <FaTimesCircle className="mr-1" size={12} />
                                Reject
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleViewPlan(invitation.plan_id)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm flex items-center"
                            >
                              <FaEye className="mr-1" size={12} />
                              View Plan
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination/Summary */}
          {filteredInvitations.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-0">
                  Showing <span className="font-medium">{filteredInvitations.length}</span> of{' '}
                  <span className="font-medium">{invitations.length}</span> invitations
                  {activeTab !== 'all' && (
                    <span className="ml-2">
                      (filtered by {activeTab})
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Pending: <span className="font-medium">{stats.pending}</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Accepted: <span className="font-medium">{stats.active}</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Rejected: <span className="font-medium">{stats.rejected}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Debug Info (remove in production) */}
        {/* {process.env.NODE_ENV === 'development' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mt-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Debug Information
            </h3>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Total invitations in state:</span> {invitations.length}
              </div>
              <div className="text-sm">
                <span className="font-medium">Active tab:</span> {activeTab}
              </div>
              <div className="text-sm">
                <span className="font-medium">Filtered invitations:</span> {filteredInvitations.length}
              </div>
              <div className="text-sm">
                <button
                  onClick={() => console.log('Invitations:', invitations)}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Log invitations to console
                </button>
              </div>
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default Invitations;

