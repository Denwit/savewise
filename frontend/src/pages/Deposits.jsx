import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatSaveWiseDate } from '../utils/date';
import { 
  FaFilter, 
  FaSearch, 
  FaCalendarAlt, 
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaExclamationTriangle,
  FaEye,
  FaPencilAlt,
  FaPlus,
  FaUser,
  FaCrown,
  FaSave,
  FaTimes,
  FaTrash,
  FaCheck,
  FaBan
} from 'react-icons/fa';
import { depositService } from '../services/api';
import { toast } from 'react-toastify';

const Deposits = () => {
  const navigate = useNavigate();
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    startDate: '',
    endDate: '',
    showOnlyMine: false
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    missed: 0,
    late: 0,
    rejected: 0,
    totalAmount: 0,
    myDepositsCount: 0,
    myDepositsAmount: 0
  });

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState(null);
  const [editForm, setEditForm] = useState({
    amount: '',
    deposit_date: '',
    status: 'completed',
    notes: ''
  });

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
const [deletingDeposit, setDeletingDeposit] = useState(null);
const [deletionReason, setDeletionReason] = useState('');


  // Rejection modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingDeposit, setRejectingDeposit] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const formatDate = (dateString, dateFormat = 'MMM d, yyyy') => formatSaveWiseDate(dateString, dateFormat);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'missed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'late': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'rejected': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <FaCheckCircle className="text-green-500" />;
      case 'pending': return <FaClock className="text-yellow-500" />;
      case 'missed': return <FaTimesCircle className="text-red-500" />;
      case 'late': return <FaExclamationTriangle className="text-orange-500" />;
      case 'rejected': return <FaBan className="text-gray-500" />;
      default: return null;
    }
  };

  // Load current user
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setCurrentUser(JSON.parse(userData));
  }, []);

  const fetchDeposits = async (page = pagination.page) => {
  try {
    setLoading(true);
    const response = await depositService.getMyDeposits({ page, limit: pagination.limit }); // Assume service supports pagination
    if (response.data.success) {
      setDeposits(response.data.deposits || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total,
        totalPages: response.data.totalPages,
        page: response.data.currentPage
      }));
      calculateStats(response.data.deposits || []);
    }
  } catch (error) {
    toast.error('Failed to load deposits', error);
  } finally {
    setLoading(false);
  }
};

  const calculateStats = (depositsData) => {
    const myUserId = currentUser?.id;
    const statsData = {
      total: depositsData.length,
      completed: depositsData.filter(d => d.status === 'completed').length,
      pending: depositsData.filter(d => d.status === 'pending').length,
      missed: depositsData.filter(d => d.status === 'missed').length,
      late: depositsData.filter(d => d.status === 'late').length,
      rejected: depositsData.filter(d => d.status === 'rejected').length,
      totalAmount: depositsData.reduce((sum, d) => sum + parseFloat(d.original_amount || d.amount || 0), 0),
      myDepositsCount: depositsData.filter(d => d.user_id === myUserId).length,
      myDepositsAmount: depositsData.filter(d => d.user_id === myUserId)
        .reduce((sum, d) => sum + parseFloat(d.original_amount || d.amount || 0), 0)
    };
    setStats(statsData);
  };

  useEffect(() => {
    if (currentUser) fetchDeposits();
  }, [currentUser]);

  const handleApproveDeposit = async (depositId) => {
    if (!window.confirm('Approve this deposit?')) return;
    try {
      const response = await depositService.approveDeposit(depositId);
      if (response.data.success) {
        toast.success('Deposit approved');
        fetchDeposits();
      }
    } catch (error) {
      console.log ('Failed to approve deposit', error)
      toast.error('Failed to approve deposit');
    }
  };

  const handleRejectDeposit = async () => {
    if (!rejectingDeposit) return;
    try {
      const response = await depositService.rejectDeposit(rejectingDeposit.id, rejectionReason);
      if (response.data.success) {
        toast.success('Deposit rejected');
        setRejectModalOpen(false);
        setRejectingDeposit(null);
        setRejectionReason('');
        fetchDeposits();
      }
    } catch (error) {
      toast.error('Failed to reject deposit', error);
    }
  };

  // Open edit modal
  const handleEditClick = (deposit) => {
  if (deposit.status !== 'pending') {
    toast.info('Only pending deposits can be edited');
    return;
  }
  setEditingDeposit(deposit);
  setEditForm({
    amount: deposit.amount,
    deposit_date: deposit.deposit_date,
    status: deposit.status,
    notes: deposit.notes || ''
  });
  setEditModalOpen(true);
};;

  // Handle edit form changes
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit edit form
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingDeposit) return;

    try {
      const response = await depositService.updateDeposit(editingDeposit.id, editForm);
      if (response.data.success) {
        toast.success('Deposit updated successfully');
        
        // Update the deposit in state
        setDeposits(prev => prev.map(deposit => 
          deposit.id === editingDeposit.id ? response.data.deposit : deposit
        ));
        
        // Recalculate stats
        calculateStats(deposits.map(deposit => 
          deposit.id === editingDeposit.id ? response.data.deposit : deposit
        ));
        
        setEditModalOpen(false);
        setEditingDeposit(null);
      }
    } catch (error) {
      console.error('Error updating deposit:', error);
      toast.error('Failed to update deposit');
    }
  };

  // Apply filters
  const filteredDeposits = deposits.filter(deposit => {
    if (filters.status && deposit.status !== filters.status) return false;
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const planName = deposit.plan?.plan_name?.toLowerCase() || '';
      const userName = deposit.user?.username?.toLowerCase() || '';
      const notes = deposit.notes?.toLowerCase() || '';
      
      if (!planName.includes(searchLower) && 
          !userName.includes(searchLower) && 
          !notes.includes(searchLower)) {
        return false;
      }
    }
    
    if (filters.startDate && new Date(deposit.deposit_date) < new Date(filters.startDate)) return false;
    if (filters.endDate && new Date(deposit.deposit_date) > new Date(filters.endDate)) return false;
    
    if (filters.showOnlyMine && deposit.user_id !== currentUser?.id) return false;
    
    return true;
  });

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  // Handle delete deposit
const handleDeleteClick = (deposit) => {
  setDeletingDeposit(deposit);
  setDeleteModalOpen(true);
};

const confirmDeleteDeposit = async () => {
  if (!deletingDeposit) return;
  if (!deletionReason.trim()) {
    toast.error('Please provide a reason for deletion');
    return;
  }
  try {
    await depositService.deleteDepositWithReason(deletingDeposit.id, deletionReason);
    toast.success('Deposit deleted successfully');
    setDeleteModalOpen(false);
    setDeletingDeposit(null);
    setDeletionReason('');
    fetchDeposits();
  } catch (error) {
    console.log(error)
    toast.error('Failed to delete deposit');
  }
};
  // Clear filters
  const clearFilters = () => {
    setFilters({
      status: '',
      search: '',
      startDate: '',
      endDate: '',
      showOnlyMine: false
    });
  };

  // Get user avatar color
  const getUserAvatarColor = (userId) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
      'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    return colors[userId % colors.length];
  };

  // Handle make new deposit
  const handleMakeDeposit = () => {
    navigate('/plans');
  };

 return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Deposits</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Track deposits from all your saving plans
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button onClick={fetchDeposits} className="inline-flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-lg transition">Refresh</button>
              <button onClick={handleMakeDeposit} className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition">
                <FaPlus className="mr-2" />Make Deposit
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Deposits</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg"><FaCalendarAlt className="text-blue-600 dark:text-blue-400 text-xl" /></div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">My Deposits</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.myDepositsCount}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">ZMW {stats.myDepositsAmount.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg"><FaUser className="text-green-600 dark:text-green-400 text-xl" /></div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">ZMW {stats.totalAmount.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg"><FaCheckCircle className="text-purple-600 dark:text-purple-400 text-xl" /></div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.pending}</p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg"><FaClock className="text-yellow-600 dark:text-yellow-400 text-xl" /></div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow mb-8">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white"><FaFilter className="inline mr-2" />Filters</h2>
              <button onClick={clearFilters} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">Clear all</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Status filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">All</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="missed">Missed</option>
                  <option value="late">Late</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              {/* Search filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input type="text" name="search" value={filters.search} onChange={handleFilterChange} placeholder="Search plan, user, or notes..." className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>
              {/* Start date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">From Date</label>
                <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              {/* End date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">To Date</label>
                <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              {/* Show only mine */}
              <div className="flex items-center">
                <div className="mt-6">
                  <label className="flex items-center">
                    <input type="checkbox" name="showOnlyMine" checked={filters.showOnlyMine} onChange={handleFilterChange} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Show only my deposits</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Deposits Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div><p className="mt-2 text-gray-600 dark:text-gray-400">Loading deposits...</p></div>
            ) : filteredDeposits.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-400 dark:text-gray-500 text-4xl mb-4"><FaCalendarAlt className="mx-auto" /></div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No deposits found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{deposits.length === 0 ? "There are no deposits in your saving plans yet." : "No deposits match your filters."}</p>
                {deposits.length === 0 && (
                  <button onClick={handleMakeDeposit} className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"><FaPlus className="mr-2" />Make Your First Deposit</button>
                )}
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Plan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Deposited By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Notes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredDeposits.map((deposit) => {
                    const repayment =
                      deposit.repayment_details && typeof deposit.repayment_details === 'string'? JSON.parse(deposit.repayment_details): deposit.repayment_details || null;
                    const repaidAmount = repayment ? repayment.reduce((sum, r) => sum + Number(r.amount), 0): 0;
                    const savedAmount = Number(deposit.amount) || 0; // amount that went to savings
                    const originalAmount = deposit.original_amount || deposit.amount;
                    const canApprove = deposit.can_approve; // from backend enrichment
                    return (
                      <tr key={deposit.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{deposit.plan?.plan_name || 'N/A'}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{deposit.plan?.owner?.id === deposit.user_id ? 'Owner' : 'Member'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full ${getUserAvatarColor(deposit.user_id)} flex items-center justify-center mr-3`}>
                              <span className="text-white text-xs font-bold">{deposit.user?.username?.charAt(0).toUpperCase() || 'U'}</span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {deposit.user?.username || 'Unknown User'}
                                {deposit.user_id === deposit.plan?.owner_id && <FaCrown className="inline ml-1 text-yellow-500" title="Plan Owner" />}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{deposit.user_id === currentUser?.id ? 'You' : 'Member'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-lg font-semibold text-gray-900 dark:text-white">
                            ZMW {parseFloat(originalAmount).toFixed(2)}
                          </div>
                          {repaidAmount > 0 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              (Repaid: ZMW {repaidAmount.toFixed(2)} | Saved: ZMW {savedAmount.toFixed(2)})
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">{formatDate(deposit.deposit_date)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <span className="mr-2">{getStatusIcon(deposit.status)}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(deposit.status)}`}>
                              {deposit.status?.charAt(0).toUpperCase() + deposit.status?.slice(1)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">{deposit.notes || '-'}</div>
                          {deposit.status === 'rejected' && deposit.rejection_reason && (
                            <div className="text-xs text-red-500 dark:text-red-400 mt-1">Reason: {deposit.rejection_reason}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            {/* Edit/Delete for owner/admin */}
                            {(deposit.user_id === currentUser?.id || deposit.plan?.owner_id === currentUser?.id) && deposit.status === 'pending' && (
  <button onClick={() => handleEditClick(deposit)} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition" title="Edit"><FaPencilAlt /></button>
)}
                            {(deposit.user_id === currentUser?.id || deposit.plan?.owner_id === currentUser?.id) && deposit.status !== 'pending' && (
                              <>
                                <button onClick={() => handleDeleteClick(deposit)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" title="Delete"><FaTrash /></button>
                              </>
                            )}
                              {deleteModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Delete Deposit</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Are you sure you want to delete this deposit? This action cannot be undone.
        Please provide a reason for deletion:
      </p>
      <textarea
        value={deletionReason}
        onChange={(e) => setDeletionReason(e.target.value)}
        rows="3"
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        placeholder="Reason..."
      />
      <div className="flex justify-end space-x-4 mt-6">
        <button
          onClick={() => { setDeleteModalOpen(false); setDeletingDeposit(null); setDeletionReason(''); }}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300"
        >
          Cancel
        </button>
        <button
          onClick={confirmDeleteDeposit}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}

                            {/* Approve/Reject for pending deposits if user can approve */}
                            {deposit.status === 'pending' && canApprove && (
                              <>
                                <button onClick={() => handleApproveDeposit(deposit.id)} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition" title="Approve"><FaCheck /></button>
                                <button onClick={() => { setRejectingDeposit(deposit); setRejectModalOpen(true); }} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" title="Reject"><FaBan /></button>
                              </>
                            )}
                            {/* View Plan */}
                            <button onClick={() => navigate(`/plans/${deposit.plan_id}`)} className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition" title="View Plan"><FaEye /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination/Summary */}
          {!loading && filteredDeposits.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-0">Showing page {pagination.page} of {pagination.totalPages} 
                  <span className="font-medium">{filteredDeposits.length}</span> of <span className="font-medium">{deposits.length}</span> deposits</div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total: <span className="font-medium">ZMW {filteredDeposits.reduce((sum, d) => sum + parseFloat(d.original_amount || d.amount || 0), 0).toFixed(2)}</span></div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 sm:mt-0">My deposits: <span className="font-medium">{filteredDeposits.filter(d => d.user_id === currentUser?.id).length}</span></div>
                </div>
                 <div className="flex space-x-2">
        <button
          onClick={() => fetchDeposits(pagination.page - 1)}
          disabled={pagination.page === 1}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Previous
        </button>
        <button
          onClick={() => fetchDeposits(pagination.page + 1)}
          disabled={pagination.page === pagination.totalPages}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Next
        </button>
      </div>
              </div>
            </div>
          )}
        </div>

        {/* Reject Modal */}
        {rejectModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Reject Deposit</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Please provide a reason for rejection:</p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Reason..."
              />
              <div className="flex justify-end space-x-4 mt-6">
                <button onClick={() => { setRejectModalOpen(false); setRejectingDeposit(null); setRejectionReason(''); }} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300">Cancel</button>
                <button onClick={handleRejectDeposit} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Reject</button>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Legend</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="flex items-center"><FaCrown className="text-yellow-500 mr-2" /><span className="text-sm text-gray-700 dark:text-gray-300">Plan Owner</span></div>
            <div className="flex items-center"><div className="w-4 h-4 bg-green-100 dark:bg-green-900 rounded-full mr-2"></div><span className="text-sm text-gray-700 dark:text-gray-300">Completed</span></div>
            <div className="flex items-center"><div className="w-4 h-4 bg-yellow-100 dark:bg-yellow-900 rounded-full mr-2"></div><span className="text-sm text-gray-700 dark:text-gray-300">Pending</span></div>
            <div className="flex items-center"><div className="w-4 h-4 bg-red-100 dark:bg-red-900 rounded-full mr-2"></div><span className="text-sm text-gray-700 dark:text-gray-300">Missed/Rejected</span></div>
            <div className="flex items-center"><FaCheck className="text-green-600 mr-2" /><span className="text-sm text-gray-700 dark:text-gray-300">Approve action</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Deposits;
