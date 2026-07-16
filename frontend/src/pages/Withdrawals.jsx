import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { formatSaveWiseDate } from '../utils/date';
import { withdrawalService, planService } from '../services/api';
import {
  FaMoneyBillWave,
  FaPlus,
  FaFilter,
  FaCheck,
  FaTimes,
  FaClock,
  FaSearch,
  FaDownload,
  FaUser,
  FaChartLine,
  FaPercentage,
  FaCheckCircle,
  FaMoneyBillAlt,
  FaEye,
  FaCrown,
  FaBan
} from 'react-icons/fa';

const Withdrawals = () => {
  const navigate = useNavigate();
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [action, setAction] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [requestForm, setRequestForm] = useState({ plan_id: '', amount: '', reason: '' });
  const [plans, setPlans] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setCurrentUser(JSON.parse(userData));
    fetchWithdrawals();
    fetchUserPlans();
  }, [filter, pagination.page]);
  const formatDate = (dateString, dateFormat = 'MMM d, yyyy') => formatSaveWiseDate(dateString, dateFormat);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const params = { page: pagination.page, limit: 20 };
      if (filter !== 'all') params.status = filter;
      const response = await withdrawalService.getWithdrawals(params);
      if (response.data.success) {
        setWithdrawals(response.data.withdrawals);
        setPagination({
          page: response.data.currentPage,
          total: response.data.total,
          totalPages: response.data.totalPages
        });
      }
    } catch (error) {
      console.log ('Failed to load withdrawals', error)
      toast.error('Failed to load withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const [selectedPlanDetails, setSelectedPlanDetails] = useState({ totalDeposits: 0, multiplier: 1, maxAllowed: 0 });
  const canSubmit = selectedPlanDetails.totalDeposits > 0 &&
                  !withdrawals.some(w => w.plan_id === requestForm.plan_id && w.user_id === currentUser?.id && w.status === 'pending') &&
                  requestForm.amount > 0 &&
                  requestForm.amount <= selectedPlanDetails.maxAllowed;

  useEffect(() => {
  if (requestForm.plan_id) {
    fetchPlanDetails(requestForm.plan_id);
  } else {
    setSelectedPlanDetails({ totalDeposits: 0, multiplier: 1, maxAllowed: 0 });
  }
}, [requestForm.plan_id]);

const fetchPlanDetails = async (planId) => {
  try {
    const response = await planService.getUserPlanDetails(planId);
    if (response.data.success) {
      const plan = response.data.plan;
      const totalDeposits = response.data.totalDeposits;
      const multiplier = parseFloat(plan.withdrawal_multiplier) || 1;
      const maxAllowed = totalDeposits * multiplier;
      setSelectedPlanDetails({ totalDeposits, multiplier, maxAllowed });
    }
  } catch (error) {
    console.error('Failed to fetch plan details', error);
  }
};

  const fetchUserPlans = async () => {
    try {
      const response = await planService.getPlans();
      if (response.data.success) setPlans(response.data.plans);
    } catch (error) {
      console.log ('Failed to load plans', error)
      console.error('Failed to load plans');
    }
  };

  const stats = {
  total: pagination.total/2,
  pending: withdrawals.filter(w => w.status === 'pending').length,
  approved: withdrawals.filter(w => w.status === 'approved').length,
  rejected: withdrawals.filter(w => w.status === 'rejected').length,
  paid: withdrawals.filter(w => w.status === 'paid').length,
  partial: withdrawals.filter(w => w.status === 'partial').length,
  totalAmount: withdrawals.reduce((sum, w) => sum + parseFloat(w.total_amount || w.amount || 0), 0),
  totalRepaid: withdrawals.reduce((sum, w) => sum + parseFloat(w.repaid_amount || 0), 0),
  totalBorrowedUnpaid: withdrawals
    .filter(w => w.status === 'approved' || w.status === 'partial')
    .reduce((sum, w) => sum + parseFloat(w.total_amount || w.amount || 0), 0),
  pendingAmount: withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + parseFloat(w.amount || 0), 0),
  interestAmount: withdrawals.reduce((sum, w) => sum + parseFloat(w.interest_amount || 0), 0)
};

const borrowedBalance = stats.totalBorrowedUnpaid + stats.totalRepaid;

  const getStatusBadge = (status, repaid, total) => {
    if (status === 'approved' && repaid > 0 && repaid < total) {
      return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Partial</span>;
    }
    switch (status) {
      case 'approved': return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Approved</span>;
      case 'pending': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Pending</span>;
      case 'rejected': return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Rejected</span>;
      case 'paid': return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Paid</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">{status}</span>;
    }
  };

  const canApproveWithdrawal = (withdrawal) => {
    if (!currentUser || !withdrawal.plan) return false;
    const isPlanOwner = withdrawal.plan.owner_id === currentUser.id;
    const isAdmin = withdrawal.plan.members?.some(m => m.user_id === currentUser.id && m.is_admin);
    return (isPlanOwner || isAdmin) && withdrawal.status === 'pending';
  };

  const canMarkAsPaid = (withdrawal) => {
    if (!currentUser || !withdrawal.plan) return false;
    const isPlanOwner = withdrawal.plan.owner_id === currentUser.id;
    const isAdmin = withdrawal.plan.members?.some(m => m.user_id === currentUser.id && m.is_admin);
    return (isPlanOwner || isAdmin) && withdrawal.status === 'approved';
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    try {
      await withdrawalService.createWithdrawal(requestForm);
      toast.success('Withdrawal request submitted');
      setShowRequestModal(false);
      setRequestForm({ plan_id: '', amount: '', reason: '' });
      fetchWithdrawals();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit');
    }
  };

  const handleActionSubmit = async () => {
    try {
      if (action === 'approve') {
        await withdrawalService.approveWithdrawal(selectedWithdrawal.id);
        toast.success('Withdrawal approved');
      } else if (action === 'reject') {
        await withdrawalService.rejectWithdrawal(selectedWithdrawal.id, rejectionReason);
        toast.success('Withdrawal rejected');
      }
      setShowActionModal(false);
      setAction('');
      setRejectionReason('');
      fetchWithdrawals();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process');
    }
  };

  const handleMarkAsPaid = async () => {
    try {
      await withdrawalService.markWithdrawalAsPaid(selectedWithdrawal.id);
      toast.success('Withdrawal marked as paid');
      setShowPayModal(false);
      fetchWithdrawals();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed');
    }
  };

  const calculateInterest = (amount, interestRate) => {
    const principal = parseFloat(amount) || 0;
    const rate = parseFloat(interestRate) || 0;
    if (rate <= 0) return { interest: 0, total: principal };
    const interest = (principal * rate) / 100;
    return { interest, total: principal + interest };
  };

  const filteredWithdrawals = withdrawals.filter(w =>
    w.plan?.plan_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.user?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading withdrawals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center">
            <FaMoneyBillWave className="mr-3 text-blue-600" />
            Withdrawals
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage withdrawal requests and track status</p>
        </div>
        <button onClick={() => setShowRequestModal(true)} className="mt-4 md:mt-0 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
          <FaPlus className="mr-2" />Request Withdrawal
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
  {/* Total Requests */}
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-blue-100 dark:border-blue-900">
    <div className="flex items-center justify-between">
      <div><p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Requests</p><p className="text-2xl font-bold text-gray-800 dark:text-white mt-2">{stats.total}</p></div>
      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center"><FaMoneyBillWave className="text-2xl text-blue-600 dark:text-blue-400" /></div>
    </div>
  </div>
  {/* Pending */}
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-yellow-100 dark:border-yellow-900">
    <div className="flex items-center justify-between">
      <div><p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</p><p className="text-2xl font-bold text-gray-800 dark:text-white mt-2">{stats.pending}</p></div>
      <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center"><FaClock className="text-2xl text-yellow-600 dark:text-yellow-400" /></div>
    </div>
  </div>
  {/* Borrowed (Unpaid) */}
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-orange-100 dark:border-orange-900">
    <div className="flex items-center justify-between">
      <div><p className="text-sm font-medium text-gray-500 dark:text-gray-400">Borrowed (Unpaid)</p><p className="text-1xl font-bold text-gray-800 dark:text-white mt-2">ZMW {stats.totalBorrowedUnpaid.toFixed(2)}</p></div>
      <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center"><FaMoneyBillWave className="text-2xl text-orange-600 dark:text-orange-400" /></div>
    </div>
  </div>
  {/* Total Repaid */}
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-green-100 dark:border-green-900">
    <div className="flex items-center justify-between">
      <div><p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Repaid</p><p className="text-1xl font-bold text-gray-800 dark:text-white mt-2">ZMW {stats.totalRepaid.toFixed(2)}</p></div>
      <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center"><FaCheckCircle className="text-2xl text-green-600 dark:text-green-400" /></div>
    </div>
  </div>
  {/* Outstanding Balance */}
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-purple-100 dark:border-purple-900">
    <div className="flex items-center justify-between">
      <div><p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Borrowed</p><p className="text-1xl font-bold text-gray-800 dark:text-white mt-2">ZMW {borrowedBalance.toFixed(2)}</p></div>
      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center"><FaChartLine className="text-2xl text-purple-600 dark:text-purple-400" /></div>
    </div>
  </div>
  {/* Partial / Paid counts */}
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-900">
    <div className="flex items-center justify-between">
      <div><p className="text-sm font-medium text-gray-500 dark:text-gray-400">Partial / Paid</p><p className="text-2xl font-bold text-gray-800 dark:text-white mt-2">{stats.partial} / {stats.paid}</p></div>
      <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center"><FaPercentage className="text-2xl text-indigo-600 dark:text-indigo-400" /></div>
    </div>
  </div>
</div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
          <div className="relative flex-1 md:max-w-md">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <FaFilter className="text-gray-400 mr-2" />
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
              </select>
            </div>
            <button onClick={fetchWithdrawals} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Refresh</button>
          </div>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Plan & User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Amount Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredWithdrawals.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center"><FaMoneyBillWave className="text-4xl text-gray-400 mx-auto mb-4" /><p className="text-gray-600 dark:text-gray-400">No withdrawals found</p></td></tr>
              ) : (
                filteredWithdrawals.map((withdrawal) => {
                  const canApprove = canApproveWithdrawal(withdrawal);
                  const canPay = canMarkAsPaid(withdrawal);
                  //const interestCalc = calculateInterest(withdrawal.amount, withdrawal.plan?.interest_rate);
                  const repaid = parseFloat(withdrawal.repaid_amount || 0);
                  const total = parseFloat(withdrawal.total_amount || withdrawal.amount || 0);
                  const remaining = total - repaid;
                  return (
                    <tr key={withdrawal.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{withdrawal.plan?.plan_name || 'Unknown Plan'}</div>
                        <div className="flex items-center mt-1">
                          <FaUser className="text-gray-500 mr-1 text-xs" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">{withdrawal.user?.username || 'Unknown'}</span>
                          {withdrawal.user_id === withdrawal.plan?.owner_id && <FaCrown className="ml-1 text-yellow-500" title="Plan Owner" />}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-blue-600 dark:text-blue-400">ZMW {total.toFixed(2)}</div>
                        {repaid > 0 && (
                          <div className="text-xs">
                            <span className="text-green-600">Repaid: ZMW {repaid.toFixed(2)}</span><br />
                            <span className="text-orange-600">Remaining: ZMW {remaining.toFixed(2)}</span>
                          </div>
                        )}
                        {withdrawal.interest_amount > 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Principal: ZMW {parseFloat(withdrawal.amount).toFixed(2)}<br />
                            Interest: ZMW {parseFloat(withdrawal.interest_amount).toFixed(2)} ({withdrawal.plan?.interest_rate || 0}%)
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(withdrawal.status, repaid, total)}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm">Requested: {formatDate(withdrawal.created_at)}</div>
                        {withdrawal.approved_at && <div className="text-xs text-gray-500">Approved: {formatDate(withdrawal.approved_at, 'MMM d')}</div>}
                        {withdrawal.paid_at && <div className="text-xs text-green-500">Paid: {formatDate(withdrawal.paid_at, 'MMM d')}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm max-w-xs truncate">{withdrawal.reason || 'No reason'}</div>
                        {withdrawal.rejection_reason && <div className="text-xs text-red-600 mt-1">{withdrawal.rejection_reason}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {canApprove && (
                            <>
                              <button onClick={() => { setSelectedWithdrawal(withdrawal); setAction('approve'); setShowActionModal(true); }} className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs" title="Approve"><FaCheckCircle className="mr-1" size={12} />Approve</button>
                              <button onClick={() => { setSelectedWithdrawal(withdrawal); setAction('reject'); setShowActionModal(true); }} className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs" title="Reject"><FaBan className="mr-1" size={12} />Reject</button>
                            </>
                          )}
                          {/* {canPay && withdrawal.status === 'approved' && (
                            <button onClick={() => { setSelectedWithdrawal(withdrawal); setShowPayModal(true); }} className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs" title="Mark Paid"><FaMoneyBillAlt className="mr-1" size={12} />Mark Paid</button>
                          )} */}
                          <button onClick={() => navigate(`/plans/${withdrawal.plan_id}`)} className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs" title="View Plan"><FaEye className="mr-1" size={12} />View</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-700 dark:text-gray-300">Page {pagination.page} of {pagination.totalPages}</div>
            <div className="flex space-x-2">
              <button onClick={() => setPagination({...pagination, page: pagination.page - 1})} disabled={pagination.page === 1} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50">Previous</button>
              <button onClick={() => setPagination({...pagination, page: pagination.page + 1})} disabled={pagination.page === pagination.totalPages} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Request Withdrawal Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Request Withdrawal</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Request to withdraw funds from a saving plan</p>
            </div>
            
            <form onSubmit={handleRequestSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="label dark:text-gray-300">Select Plan</label>
                  <select
  value={requestForm.plan_id}
  onChange={(e) => setRequestForm({...requestForm, plan_id: e.target.value})}
  className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
  required
>
  <option value="">Choose a plan</option>
  {plans
    .filter(plan => plan.allow_early_withdrawals) // Only plans that allow early withdrawals
    .map((plan) => {
      const totalDeposits = plan.deposits?.reduce((sum, d) => sum + parseFloat(d.amount), 0) || 0;
      return (
        <option key={plan.id} value={plan.id}>
          {plan.plan_name} (Balance: ZMW {totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
          {plan.interest_rate > 0 && ` - ${plan.interest_rate}% interest`}
        </option>
      );
    })}
</select>
                </div>
                
                <div>
  <label className="label dark:text-gray-300">Amount (ZMW)</label>
  <div className="relative">
    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">ZMW</span>
    <input
      type="number"
      value={requestForm.amount}
      onChange={(e) => setRequestForm({...requestForm, amount: e.target.value})}
      required
      min="0"
      step="0.01"
      className="input-field pl-16"
    />
  </div>
  {selectedPlanDetails.maxAllowed > 0 && (
    <p className="text-xs text-gray-600 mt-1">
      Max allowed: ZMW {selectedPlanDetails.maxAllowed.toFixed(2)} (based on your deposits × {selectedPlanDetails.multiplier})
    </p>
  )}
  {selectedPlanDetails.totalDeposits === 0 && (
    <p className="text-xs text-red-500 mt-1">You must deposit first.</p>
  )}
</div>
                
                <div>
                  <label className="label dark:text-gray-300">Reason for Withdrawal</label>
                  <textarea
                    value={requestForm.reason}
                    onChange={(e) => setRequestForm({...requestForm, reason: e.target.value})}
                    required
                    rows="3"
                    className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    placeholder="Explain why you need to withdraw these funds..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button type="submit" disabled={!canSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
  Submit Request
</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Modal (Approve/Reject) */}
      {showActionModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                {action === 'approve' ? 'Approve' : 'Reject'} Withdrawal
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {action === 'approve' 
                  ? 'Are you sure you want to approve this withdrawal?'
                  : 'Please provide a reason for rejecting this withdrawal'}
              </p>
            </div>
            
            <div className="p-6">
              {/* Show interest calculation for approval */}
              {action === 'approve' && selectedWithdrawal.plan?.interest_rate > 0 && (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">Interest Calculation</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Principal Amount:</span>
                      <span className="font-medium">ZMW {parseFloat(selectedWithdrawal.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Interest Rate:</span>
                      <span className="font-medium">{selectedWithdrawal.plan?.interest_rate || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Interest Amount:</span>
                      <span className="font-medium">
                        ZMW {calculateInterest(selectedWithdrawal.amount, selectedWithdrawal.plan?.interest_rate).interest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="text-gray-800 dark:text-gray-200 font-bold">Total to be Paid:</span>
                      <span className="font-bold text-green-600 dark:text-green-400">
                        ZMW {calculateInterest(selectedWithdrawal.amount, selectedWithdrawal.plan?.interest_rate).total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {action === 'reject' && (
                <div className="mb-4">
                  <label className="label dark:text-gray-300">Rejection Reason</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                    rows="3"
                    className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    placeholder="Explain why this withdrawal is being rejected..."
                  />
                </div>
              )}
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Plan:</span>
                    <span className="font-medium">{selectedWithdrawal.plan?.plan_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">User:</span>
                    <span className="font-medium">{selectedWithdrawal.user?.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      ZMW {parseFloat(selectedWithdrawal.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Reason:</span>
                    <span className="font-medium">{selectedWithdrawal.reason}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowActionModal(false);
                    setAction('');
                    setRejectionReason('');
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleActionSubmit}
                  className={`px-4 py-2 rounded-lg text-white ${
                    action === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {action === 'approve' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Paid Modal */}
      {showPayModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                Mark Withdrawal as Paid
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Confirm that this withdrawal has been paid to the user
              </p>
            </div>
            
            <div className="p-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Plan:</span>
                    <span className="font-medium">{selectedWithdrawal.plan?.plan_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">User:</span>
                    <span className="font-medium">{selectedWithdrawal.user?.username}</span>
                  </div>
                  {selectedWithdrawal.interest_amount > 0 ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Principal:</span>
                        <span className="font-medium">
                          ZMW {parseFloat(selectedWithdrawal.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Interest:</span>
                        <span className="font-medium">
                          ZMW {parseFloat(selectedWithdrawal.interest_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({selectedWithdrawal.plan?.interest_rate || 0}%)
                        </span>
                      </div>
                    </>
                  ) : null}
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-800 dark:text-gray-200 font-bold">Total to Pay:</span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      ZMW {parseFloat(selectedWithdrawal.total_amount || selectedWithdrawal.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkAsPaid}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                >
                  Mark as Paid
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Withdrawals;
