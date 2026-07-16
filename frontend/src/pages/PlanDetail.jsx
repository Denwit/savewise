import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Filler,
  Tooltip,
  Legend,
  ArcElement,
  LineController
} from 'chart.js';
import { planService, depositService, withdrawalService, memberService, invitationsService, planChatService } from '../services/api';
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaUsers,
  FaMoneyBillWave,
  FaChartLine,
  FaClock,
  FaPiggyBank,
  FaPlus,
  FaEdit,
  FaShareAlt,
  FaBell,
  FaHistory,
  FaUserFriends,
  FaPercentage,
  FaUserPlus,
  FaSearch,
  FaUser,
  FaEnvelope,
  FaLink,
  FaCheckCircle,
  FaCopy,
  FaTrash,
  FaTimes,
  FaCheck,
  FaCrown,
  FaComments,
  FaPaperPlane,
  FaWhatsapp
} from 'react-icons/fa';
import { format, differenceInDays, isBefore } from 'date-fns';
import { formatSaveWiseDate } from '../utils/date';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const PlanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawalsPage, setWithdrawalsPage] = useState(1);
  const [depositForm, setDepositForm] = useState({
    amount: '',
    deposit_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    reason: ''
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEmailInviteModal, setShowEmailInviteModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [userBorrowed, setUserBorrowed] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [topError, setTopError] = useState('');

  useEffect(() => {
    fetchPlanDetails();
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, [id]);

  useEffect(() => {
    if (activeTab === 'members' && plan) {
      fetchPlanMembers();
      fetchPendingInvitations();
    }
    if (activeTab === 'withdrawals' && plan) {
      fetchPlanWithdrawals();
    }
    if (activeTab === 'chat' && plan) {
      fetchPlanMessages();
      const chatTimer = window.setInterval(fetchPlanMessages, 6000);
      return () => window.clearInterval(chatTimer);
    }
  }, [activeTab, plan]);
  const formatDate = (dateString, dateFormat = 'MMM d, yyyy') => formatSaveWiseDate(dateString, dateFormat);

  const showError = (error, fallback) => {
    const message = error?.response?.data?.message || error?.message || fallback;
    setTopError(message);
    toast.error(message);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  


  const fetchPlanDetails = async () => {
  try {
    setLoading(true);
    const [planResponse, depositsResponse] = await Promise.all([
      planService.getPlan(id),
      depositService.getPlanDeposits(id)
    ]);

    if (planResponse.data.success) {
      const planData = planResponse.data.plan;
      setPlan(planData);
      
      const user = JSON.parse(localStorage.getItem('user'));
      setIsOwner(planData.owner_id === user?.id);
      
      const adminMember = planData.members?.find(member => 
        member.user_id === user?.id && member.is_admin
      );
      setIsAdmin(isOwner || !!adminMember);
    }

    if (depositsResponse.data.success) {
      setDeposits(depositsResponse.data.deposits);
    }

    // Also fetch withdrawals to update stats and userBorrowed
    await fetchPlanWithdrawals();

  } catch (error) {
    console.error(error);
    toast.error('Failed to load plan details');
    navigate('/plans');
  } finally {
    setLoading(false);
  }
};
  

  const fetchPlanWithdrawals = async () => {
  try {
    const response = await withdrawalService.getWithdrawals({ plan_id: id, page: withdrawalsPage, limit: 50 });
    if (response.data.success) {
      setWithdrawals(response.data.withdrawals);
      
      // Calculate user's outstanding unpaid amount
      const user = JSON.parse(localStorage.getItem('user'));
      const userUnpaidWithdrawals = response.data.withdrawals.filter(
        w => w.user_id === user.id && (w.status === 'approved' || w.status === 'partial')
      );
      const totalUnpaid = userUnpaidWithdrawals.reduce(
        (sum, w) => sum + (parseFloat(w.total_amount || w.amount || 0) - parseFloat(w.repaid_amount || 0)), 0
      );
      setUserBorrowed(totalUnpaid);
    }
  } catch (error) {
    console.error(error);
    toast.error('Failed to load withdrawals');
  }
};
 
const userTotalDeposits = deposits
  .filter(d => d.user_id === user?.id)
  .reduce((sum, d) => sum + parseFloat(d.amount), 0);
const multiplier = parseFloat(plan?.withdrawal_multiplier) || 1;
const maxWithdraw = userTotalDeposits * multiplier;
const hasPendingWithdrawal = withdrawals.some(w => w.user_id === user?.id && w.status === 'pending');
 const canWithdraw = userTotalDeposits > 0 && !hasPendingWithdrawal && parseFloat(withdrawForm.amount) <= maxWithdraw;

 const handleDeletePlan = async () => {
  if (!window.confirm("Are you sure you want to delete this plan?")) return;
  try {
    await planService.deletePlan(id);
    toast.success("Plan deleted successfully");
    navigate("/plans");
  } catch (error) {
    console.error(error);
    toast.error("Failed to delete plan");
  }
};
  

  const handleUpdateMemberRole = async (memberId, makeAdmin) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/plans/${id}/members/${memberId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_admin: makeAdmin })
      });

      if (response.ok) {
        toast.success(`Member role updated to ${makeAdmin ? 'admin' : 'member'}`);
        fetchPlanMembers();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update member role');
      }
    } catch (error) {
      console.error('Error updating member role:', error);
      toast.error('Failed to update member role');
    }
  };

    const handleRemoveMember = async (memberId) => {
  if (!window.confirm("Are you sure you want to remove this member?")) return;
  try {
    await memberService.removeMember(id, memberId);
    toast.success("Member removed successfully");
    fetchPlanMembers();
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to remove member");
  }
};

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    try {
      await depositService.createDeposit({
        plan_id: id,
        ...depositForm
      });
      toast.success('Deposit recorded successfully');
      setShowDepositModal(false);
      setDepositForm({
        amount: '',
        deposit_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      fetchPlanDetails();
    } catch (error) {
      console.error(error);
      showError(error, 'Failed to record deposit');
    }
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    try {
      await withdrawalService.createWithdrawal({
        plan_id: id,
        ...withdrawForm
      });
      toast.success('Withdrawal request submitted');
      setShowWithdrawModal(false);
      setWithdrawForm({ amount: '', reason: '' });
      fetchPlanWithdrawals();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit withdrawal request');
    }
  };

  const fetchPlanMembers = async () => {
    try {
      const response = await planService.getPlan(id);
      if (response.data.success) {
        setMembers(response.data.plan.members || []);
      }
    } catch (error) {
      console.error('Failed to fetch plan members:', error);
    }
  };

  const fetchPendingInvitations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/plans/${id}/pending-invitations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPendingInvitations(data.data?.invitations || []);
      } else {
        setPendingInvitations([]);
      }
    } catch (error) {
      console.error('Failed to fetch pending invitations:', error);
      setPendingInvitations([]);
    }
  };

  const handleSearchUsers = async () => {
  if (!searchQuery.trim()) {
    setSearchResults([]);
    return;
  }
  try {
    setSearching(true);
    const response = await invitationsService.searchUsers(searchQuery);
    setSearchResults(response.data.users || []);
  } catch (error) {
    toast.error("Failed to search users", error);
  } finally {
    setSearching(false);
  }
};

  const handleInviteUser = async (userId) => {
  try {
    await invitationsService.sendInvitation({ plan_id: id, user_id: userId });
    toast.success("Invitation sent successfully");
    setSearchResults([]);
    setSearchQuery("");
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to send invitation");
  }
};

  const handleInviteByEmail = async (e) => {
  e.preventDefault();
  if (!inviteEmail.trim()) {
    toast.error("Please enter an email address");
    return;
  }
  try {
    const response = await planService.inviteExternal(id, {
      email: inviteEmail,
      name: inviteName,
    });
    setGeneratedLink(response.data.data.invitation_link);
    setShowEmailInviteModal(false);
    setShowLinkModal(true);
    setInviteEmail("");
    setInviteName("");
    fetchPendingInvitations();
    toast.success("Invitation link generated successfully!");
  } catch (error) {
    toast.error(error.response?.data?.message || "Error generating invitation link");
  }
};

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Link copied to clipboard!');
  };
  const shareToWhatsApp = (link) => {
    const message = encodeURIComponent(`Join my SaveWise plan "${plan?.plan_name || ''}" using this link: ${link}`);
    window.open(`https://wa.me/?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  const fetchPlanMessages = async () => {
    try {
      setChatLoading(true);
      const response = await planChatService.getMessages(id);
      setChatMessages(response.data.messages || []);
    } catch (error) {
      console.error('Failed to load plan chat:', error);
      showError(error, 'Failed to load plan chat');
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    const message = chatInput.trim();
    if (!message) return;
    try {
      const response = await planChatService.sendMessage(id, message);
      setChatMessages((current) => [...current, response.data.message]);
      setChatInput('');
    } catch (error) {
      console.error('Failed to send plan chat message:', error);
      showError(error, 'Failed to send message');
    }
  };

  const handleCancelInvitation = async (invitationId) => {
  if (!window.confirm("Are you sure you want to cancel this invitation?")) return;
  try {
    await invitationsService.cancelExternalInvitation(invitationId);
    toast.success("Invitation cancelled");
    fetchPendingInvitations();
  } catch (error) {
    toast.error("Failed to cancel invitation", error);
  }
};

  const calculateStats = () => {
  if (!plan) return {};
  
  const totalSaved = deposits.reduce((sum, d) => sum + parseFloat(d.amount), 0) || 0;

  const totalInterestEarned = withdrawals
  .filter(w => w.status === 'paid')
  .reduce((sum, w) => sum + parseFloat(w.interest_amount || 0), 0);
  
  const totalPaidOut = withdrawals
    .filter(w => w.status === 'paid')
    .reduce((sum, w) => sum + parseFloat(w.total_amount || w.amount || 0), 0);
  
  const totalBorrowedUnpaid = withdrawals
    .filter(w => w.status === 'approved' || w.status === 'partial')
    .reduce((sum, w) => sum + parseFloat(w.total_amount || w.amount || 0), 0);
  
  const totalRepaid = withdrawals.reduce((sum, w) => sum + parseFloat(w.repaid_amount || 0), 0);
  
  const potentialInterest = (totalSaved * (plan.interest_rate || 0)) / 100;
  const totalSavedWithInterest = totalSaved + totalInterestEarned;
  
  const remainingToTargetWithInterest = plan.target_amount - totalSavedWithInterest;
  const daysLeft = differenceInDays(new Date(plan.end_date), new Date());
  const isOverdue = isBefore(new Date(plan.end_date), new Date());
  
  return {
    totalSaved,
    totalSavedWithInterest,
    totalBorrowedUnpaid,
    totalPaidOut,
    totalInterestEarned,
    totalRepaid,
    remainingToTargetWithInterest: Math.max(0, remainingToTargetWithInterest),
    daysLeft: Math.max(0, daysLeft),
    isOverdue,
    progress: (totalSavedWithInterest / plan.target_amount) * 100,
    potentialInterest
  };
};

  const getFrequencyLabel = (frequency) => {
    switch (frequency) {
      case 'weekly': return 'Weekly';
      case 'bi-weekly': return 'Bi-weekly';
      case 'monthly': return 'Monthly';
      default: return frequency;
    }
  };

  const getCycleLabel = (cycle) => cycle || 'Not set';

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDepositChartData = () => {
    const sortedDeposits = [...deposits].sort((a, b) => new Date(a.deposit_date) - new Date(b.deposit_date));
    const labels = sortedDeposits.map(d => formatDate(d.deposit_date, 'MMM d'));
    const data = sortedDeposits.map(d => parseFloat(d.amount));
    const cumulativeData = [];
    data.reduce((acc, curr) => {
      cumulativeData.push(acc + curr);
      return acc + curr;
    }, 0);

    return {
      labels,
      datasets: [
        {
          label: 'Deposit Amount',
          data,
          borderColor: '#0ea5e9',
          backgroundColor: 'rgba(14, 165, 233, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Cumulative Total',
          data: cumulativeData,
          borderColor: '#10b981',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0.4
        }
      ]
    };
  };

  const getProgressChartData = () => {
    const stats = calculateStats();
    return {
      labels: ['Saved', 'Remaining'],
      datasets: [{
        data: [stats.totalSaved, Math.max(0, plan.target_amount - stats.totalSaved)],
        backgroundColor: ['#0ea5e9', '#e5e7eb'],
        borderWidth: 0,
        borderRadius: 6
      }]
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading plan details...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Plan not found</h3>
        <button onClick={() => navigate('/plans')} className="mt-4 text-blue-600 hover:text-blue-700">
          Back to Plans
        </button>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="max-w-7xl mx-auto p-6">
      {topError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 flex items-start justify-between gap-3">
          <span>{topError}</span>
          <button onClick={() => setTopError('')} className="font-semibold text-red-700 hover:text-red-900">Dismiss</button>
        </div>
      )}
      {/* Header */}
      <div className="mb-8">
        <button onClick={() => navigate('/plans')} className="flex items-center text-blue-600 hover:text-blue-700 mb-4">
          <FaArrowLeft className="mr-2" />
          Back to Plans
        </button>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <div className="flex items-center space-x-4 mb-2">
              <h1 className="text-3xl font-bold text-gray-800">{plan.plan_name}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(plan.status)}`}>
                {plan.status?.charAt(0).toUpperCase() + plan.status?.slice(1)}
              </span>
            </div>
            <p className="text-gray-600">{plan.description}</p>
          </div>
          
          <div className="flex space-x-3 mt-4 md:mt-0">
            {isAdmin && (
              <button
                onClick={() => navigate(`/plans/${id}/edit`)}
                className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center"
              >
                <FaEdit className="mr-2" />
                Edit
              </button>
            )}
            <button
              onClick={() => setShowDepositModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <FaPlus className="mr-2" />
              Add Deposit
            </button>
          </div>
        </div>
      </div>

     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
  {/* Total Saved */}
  <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
    <div className="flex items-center">
      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
        <FaMoneyBillWave className="text-2xl text-blue-600" />
      </div>
      <div>
        <p className="text-sm text-gray-500">Total Saved</p>
        <p className="text-2xl font-bold text-gray-800">ZMW {stats.totalSaved.toLocaleString()}</p>
      </div>
    </div>
  </div>

  {/* Total with Interest */}
  <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100">
    <div className="flex items-center">
      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mr-4">
        <FaPercentage className="text-2xl text-indigo-600" />
      </div>
      <div>
        <p className="text-sm text-gray-500">Total with Interest</p>
        <p className="text-2xl font-bold text-gray-800">ZMW {stats.totalSavedWithInterest.toLocaleString()}</p>
        <p className="text-xs text-gray-400">Interest earned: ZMW {stats.totalInterestEarned.toLocaleString()}</p>
      </div>
    </div>
  </div>

  {/* Borrowed (Unpaid) */}
  <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100">
    <div className="flex items-center">
      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
        <FaMoneyBillWave className="text-2xl text-orange-600" />
      </div>
      <div>
        <p className="text-sm text-gray-500">Borrowed (Unpaid)</p>
        <p className="text-2xl font-bold text-gray-800">ZMW {stats.totalBorrowedUnpaid.toLocaleString()}</p>
      </div>
    </div>
  </div>

  {/* Total Repaid */}
  <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100">
    <div className="flex items-center">
      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
        <FaCheckCircle className="text-2xl text-green-600" />
      </div>
      <div>
        <p className="text-sm text-gray-500">Total Repaid</p>
        <p className="text-2xl font-bold text-gray-800">ZMW {stats.totalRepaid.toLocaleString()}</p>
      </div>
    </div>
  </div>

  {/* Remaining to Target (with interest) */}
  <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-100">
    <div className="flex items-center">
      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
        <FaChartLine className="text-2xl text-purple-600" />
      </div>
      <div>
        <p className="text-sm text-gray-500">Remaining (with interest)</p>
        <p className="text-2xl font-bold text-gray-800">ZMW {stats.remainingToTargetWithInterest.toLocaleString()}</p>
      </div>
    </div>
  </div>

  {/* Days Left */}
  <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100">
    <div className="flex items-center">
      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
        <FaCalendarAlt className="text-2xl text-red-600" />
      </div>
      <div>
        <p className="text-sm text-gray-500">Days Left</p>
        <p className="text-2xl font-bold text-gray-800">
          {stats.isOverdue ? 'Overdue' : stats.daysLeft}
        </p>
      </div>
    </div>
  </div>
</div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Progress towards Goal</h3>
          <span className="font-medium">{stats.progress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, stats.progress)}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>ZMW 0</span>
          <span>ZMW {plan.target_amount.toLocaleString()}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8">
          {['overview', 'deposits', 'withdrawals', 'members', 'chat', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mb-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Charts */}
            <div className="space-y-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <FaChartLine className="mr-2 text-blue-500" />
                  Deposit History
                </h3>
                <div className="h-64">
                  <Line
                    data={getDepositChartData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'top' }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: { callback: (value) => `ZMW ${value}` }
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Plan Distribution</h3>
                <div className="h-64">
                  <Doughnut
                    data={getProgressChartData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'bottom' },
                        tooltip: {
                          callbacks: { label: (context) => `ZMW ${context.parsed}` }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="space-y-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Plan Details</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">Frequency</span>
                    <span className="font-medium flex items-center">
                      <FaCalendarAlt className="mr-2 text-blue-500" />
                      {getFrequencyLabel(plan.frequency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">Cycle</span>
                    <span className="font-medium">{getCycleLabel(plan.cycle)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">Start Date</span>
                    <span className="font-medium">
                      {formatDate(plan.start_date)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">End Date</span>
                    <span className="font-medium">
                      {formatDate(plan.end_date)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">Interest Rate</span>
                    <span className="font-medium flex items-center">
                      <FaPercentage className="mr-2 text-green-500" />
                      {plan.interest_rate}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-gray-600">Maximum Members</span>
                    <span className="font-medium flex items-center">
                      <FaUsers className="mr-2 text-purple-500" />
                      {plan.max_members}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <FaUserFriends className="mr-2 text-blue-500" />
                  Members ({plan.members?.length || 1}/{plan.max_members})
                </h3>
                <div className="space-y-3">
                  {plan.members?.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="font-medium text-blue-600">
                            {member.user?.username?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{member.user?.username}</p>
                          <p className="text-sm text-gray-500">{member.user?.email}</p>
                        </div>
                      </div>
                      {member.is_admin && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded">Admin</span>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setActiveTab('members')}
                  className="w-full mt-4 py-2 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700"
                >
                  <FaPlus className="inline mr-2" />
                  Invite Member
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Deposits Tab */}
        {activeTab === 'deposits' && (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <div className="p-6 border-b border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800">Deposit History</h3>
    </div>
    {deposits.length === 0 ? (
      <div className="text-center py-12">
        <FaPiggyBank className="text-4xl text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No deposits yet</p>
        <button onClick={() => setShowDepositModal(true)} className="mt-4 text-blue-600 hover:text-blue-700">
          Make your first deposit
        </button>
      </div>
    ) : (
      <div className="divide-y divide-gray-200">
        {deposits.map((deposit) => {
          const repayment = deposit.repayment_details ? 
            (typeof deposit.repayment_details === 'string' ? JSON.parse(deposit.repayment_details) : deposit.repayment_details) 
            : null;
          const repaidAmount = repayment ? repayment.reduce((sum, r) => sum + Number(r.amount), 0) : 0;
          const savedAmount = Number(deposit.amount) || 0;
          const originalAmount = deposit.original_amount || deposit.amount;
          return (
            <div key={deposit.id} className="p-6 hover:bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center mb-1">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <FaMoneyBillWave className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Deposit by {deposit.user?.username}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(deposit.deposit_date)}
                      </p>
                    </div>
                  </div>
                  {deposit.notes && (
                    <p className="text-gray-600 text-sm mt-2">{deposit.notes}</p>
                  )}
                  {repaidAmount > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      (Repaid: ZMW {repaidAmount.toFixed(2)} | Saved: ZMW {savedAmount.toFixed(2)})
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-blue-600">
                    ZMW {parseFloat(originalAmount).toLocaleString()}
                  </p>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    deposit.status === 'completed' ? 'bg-green-100 text-green-800' :
                    deposit.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    deposit.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {deposit.status}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
)}

        {/* Withdrawals Tab */}
        {activeTab === 'withdrawals' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Withdrawals</h3>
              <button
                onClick={() => setShowWithdrawModal(true)}
                disabled={!plan.allow_early_withdrawals}
                className={`px-4 py-2 rounded-lg flex items-center ${
                  plan.allow_early_withdrawals
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-300 cursor-not-allowed text-gray-500'
                }`}
              >
                <FaPlus className="mr-2" />
                Request Withdrawal
              </button>
            </div>
            {withdrawals.length === 0 ? (
              <div className="text-center py-12">
                <FaMoneyBillWave className="text-4xl text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No withdrawals yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {withdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{withdrawal.user?.username}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">ZMW {parseFloat(withdrawal.amount).toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            withdrawal.status === 'approved' ? 'bg-green-100 text-green-800' :
                            withdrawal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            withdrawal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            withdrawal.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {withdrawal.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(withdrawal.created_at)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {withdrawal.reason || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Members Tab (unchanged except for the invite button redirect) */}
        {activeTab === 'members' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Plan Members</h3>
                <p className="text-sm text-gray-600">
                  {members.filter(m => m.status === 'active').length} active / {plan?.max_members} max members
                </p>
              </div>
              
              {(isOwner || isAdmin) && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center"
                  >
                    <FaUserPlus className="mr-2" />
                    Invite Existing User
                  </button>
                  <button
                    onClick={() => setShowEmailInviteModal(true)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center"
                  >
                    <FaEnvelope className="mr-2" />
                    Invite by Email
                  </button>
                </div>
              )}
            </div>

            {/* Search and Invite Existing Users Modal */}
            {showInviteModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Invite Existing User
                    </h3>
                    <button
                      onClick={() => setShowInviteModal(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <FaTimes />
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by email or username..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          if (e.target.value.trim()) {
                            handleSearchUsers();
                          } else {
                            setSearchResults([]);
                          }
                        }}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="space-y-2 mb-6">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Search Results:</p>
                      {searchResults.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                              <FaUser className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{user.username}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleInviteUser(user.id)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            Invite
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {searchResults.length === 0 && searchQuery && !searching && (
                    <div className="text-center py-4 text-gray-500">
                      No users found
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowInviteModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Email Invite Modal */}
            {showEmailInviteModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Invite by Email
                    </h3>
                    <button
                      onClick={() => setShowEmailInviteModal(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <FaTimes />
                    </button>
                  </div>
                  
                  <form onSubmit={handleInviteByEmail}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="user@example.com"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Name (Optional)
                        </label>
                        <input
                          type="text"
                          value={inviteName}
                          onChange={(e) => setInviteName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="John Doe"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowEmailInviteModal(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Generate Invitation Link
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            
            {/* Generated Link Modal */}
            {showLinkModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Invitation Link Generated
                    </h3>
                    <button
                      onClick={() => setShowLinkModal(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <FaTimes />
                    </button>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Share this link with the person you want to invite. They will need to:
                    </p>
                    <ol className="list-decimal pl-5 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>Click the link</li>
                      <li>Sign up or login if they have an account</li>
                      <li>Accept the invitation to join your plan</li>
                    </ol>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-6">
                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg overflow-x-auto">
                      <code className="text-sm text-blue-600 dark:text-blue-400">
                        {generatedLink}
                      </code>
                    </div>
                    <button
                      onClick={() => copyToClipboard(generatedLink)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center"
                      title="Copy link"
                    >
                      <FaCopy className="mr-2" />
                      Copy
                    </button>
                    <button
                      onClick={() => shareToWhatsApp(generatedLink)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center"
                      title="Share on WhatsApp"
                    >
                      <FaWhatsapp className="mr-2" />
                      Share WhatsApp
                    </button>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowLinkModal(false)}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Pending External Invitations */}
            {pendingInvitations.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Pending Invitations</h4>
                <div className="space-y-3">
                  {pendingInvitations.map((invitation) => (
                    <div key={invitation.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center">
                        <FaEnvelope className="text-yellow-500 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">{invitation.email}</p>
                          <p className="text-sm text-gray-500">
                            Expires: {formatDate(invitation.expires_at)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancelInvitation(invitation.id)}
                        className="px-3 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200"
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Members List */}
    <div className="space-y-4">
      {members.map((member) => (
        <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <span className="font-medium text-blue-600">
                {member.user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium">{member.user?.username}</p>
              <p className="text-sm text-gray-500">{member.user?.email}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {member.is_admin ? (
              <span className="px-3 py-1 bg-blue-100 text-blue-600 text-sm rounded-full">
                Admin
              </span>
            ) : (
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                Member
              </span>
            )}
            
            {plan.owner_id !== member.user_id && plan.owner_id === user?.id && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleRemoveMember(member.user_id)}
                  className="px-3 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200"
                >
                  Remove
                </button>
                <button
                  onClick={() => handleUpdateMemberRole(member.user_id, !member.is_admin)}
                  className="px-3 py-1 bg-green-100 text-green-600 rounded text-sm hover:bg-green-200"
                >
                  {member.is_admin ? 'Remove Admin' : 'Make Admin'}
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
          </div>
        )}


        {activeTab === 'chat' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                  <FaComments className="mr-2 text-blue-500" />
                  Plan Group Chat
                </h3>
                <p className="text-sm text-gray-500">Members of this plan can chat here.</p>
              </div>
              <button onClick={fetchPlanMessages} className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">Refresh</button>
            </div>
            <div className="h-96 overflow-y-auto p-6 bg-slate-50 space-y-4">
              {chatLoading && chatMessages.length === 0 ? (
                <p className="text-center text-gray-500">Loading messages...</p>
              ) : chatMessages.length === 0 ? (
                <div className="text-center text-gray-500 py-16">
                  <FaComments className="mx-auto text-4xl text-gray-300 mb-3" />
                  <p>No messages yet. Start the plan conversation.</p>
                </div>
              ) : (
                chatMessages.map((message) => {
                  const mine = message.user_id === user?.id;
                  return (
                    <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-2xl rounded-2xl px-4 py-3 shadow-sm ${mine ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 border'}`}>
                        <div className={`text-xs mb-1 ${mine ? 'text-blue-100' : 'text-gray-500'}`}>
                          {message.user?.username || 'Member'} - {formatDate(message.created_at, 'MMM d, h:mm a')}
                        </div>
                        <p className="whitespace-pre-wrap">{message.message}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <form onSubmit={handleSendChatMessage} className="p-4 border-t border-gray-200 flex gap-3">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="input-field flex-1"
                maxLength={2000}
                placeholder="Type a message to plan members..."
              />
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
                <FaPaperPlane className="mr-2" />
                Send
              </button>
            </form>
          </div>
        )}

        {/* Settings Tab (unchanged) */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Plan Settings</h3>
            <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="label">Plan Status</label>
          <select
            value={plan.status}
            onChange={(e) => {
              // Create a new object to avoid mutation
              const updatedPlan = { ...plan, status: e.target.value };
              setPlan(updatedPlan);
              // You might want to call an update API here
            }}
            className="input-field"
          >
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        
        <div>
          <label className="label">Interest Rate (%)</label>
          <input
            type="number"
            value={plan.interest_rate || 0}
            onChange={(e) => {
              const updatedPlan = { ...plan, interest_rate: parseFloat(e.target.value) };
              setPlan(updatedPlan);
            }}
            min="0"
            max="100"
            step="0.1"
            className="input-field"
          />
        </div>
      </div>
      <div>
  <label className="label">Withdrawal Multiplier</label>
  <input
    type="number"
    value={plan.withdrawal_multiplier || 1}
    onChange={(e) => {
      const updatedPlan = { ...plan, withdrawal_multiplier: parseFloat(e.target.value) };
      setPlan(updatedPlan);
    }}
    min="0"
    step="0.1"
    className="input-field"
  />
  <p className="text-xs text-gray-500 mt-1">
    Members can withdraw up to (deposits x multiplier). Set 0 to disable withdrawals.
  </p>
</div>
      
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="font-medium text-gray-800">Allow Early Withdrawals</p>
          <p className="text-sm text-gray-600">Allow members to withdraw before plan completion</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={plan.allow_early_withdrawals || false}
            onChange={(e) => {
              const updatedPlan = { ...plan, allow_early_withdrawals: e.target.checked };
              setPlan(updatedPlan);
            }}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
      
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="font-medium text-gray-800">Auto-Approval for Deposits</p>
          <p className="text-sm text-gray-600">Automatically approve member deposits</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={plan.auto_approval !== false} // Default to true if undefined
            onChange={(e) => {
              const updatedPlan = { ...plan, auto_approval: e.target.checked };
              setPlan(updatedPlan);
            }}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
      
      <div className="flex space-x-4 pt-6 border-t border-gray-200">
        <button
          onClick={async () => {
  try {
    await planService.updatePlan(id, plan);
    toast.success("Plan settings updated successfully");
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to update plan settings");
  }
}}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Save Settings
        </button>
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to delete this plan?')) {
              // Handle delete plan
              handleDeletePlan();
            }
          }}
          className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50"
        >
          Delete Plan
        </button>
      </div>
    </div>
          </div>
        )}
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">Record Deposit</h3>
              <p className="text-gray-600 mt-1">Add a deposit to your saving plan</p>
            </div>
            
            <form onSubmit={handleDepositSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="label">Amount (ZMW)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">ZMW</span>
                    </div>
                    <input
                      type="number"
                      value={depositForm.amount}
                      onChange={(e) => setDepositForm({...depositForm, amount: e.target.value})}
                      required
                      min="0"
                      step="0.01"
                      className="input-field pl-16"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="label">Deposit Date</label>
                  <input
                    type="date"
                    value={depositForm.deposit_date}
                    onChange={(e) => setDepositForm({...depositForm, deposit_date: e.target.value})}
                    required
                    className="input-field"
                  />
                </div>
                
                <div>
                  <label className="label">Notes (Optional)</label>
                  <textarea
                    value={depositForm.notes}
                    onChange={(e) => setDepositForm({...depositForm, notes: e.target.value})}
                    rows="3"
                    className="input-field"
                    placeholder="Add any notes about this deposit..."
                  />
                </div>
              </div>

              {/* Borrowed amount note */}
              {userBorrowed > 0 && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> You have borrowed ZMW {userBorrowed.toLocaleString()}. 
                    This deposit will first be used to repay that amount.
                  </p>
                </div>
              )}
              {/* Auto-approval note */}
              {!plan.auto_approval && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Auto-approval is disabled. Your deposit will be queued for admin approval.
                  </p>
                </div>
              )}
              
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Record Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">Request Withdrawal</h3>
              <p className="text-gray-600 mt-1">Request to withdraw funds from this plan</p>
            </div>
            
            <form onSubmit={handleWithdrawSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="label">Amount (ZMW)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">ZMW</span>
                    </div>
                    <input
                      type="number"
                      value={withdrawForm.amount}
                      onChange={(e) => setWithdrawForm({...withdrawForm, amount: e.target.value})}
                      required
                      min="0"
                      step="0.01"
                      className="input-field pl-16"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="label">Reason for Withdrawal</label>
                  <textarea
                    value={withdrawForm.reason}
                    onChange={(e) => setWithdrawForm({...withdrawForm, reason: e.target.value})}
                    required
                    rows="3"
                    className="input-field"
                    placeholder="Explain why you need to withdraw these funds..."
                  />
                </div>
              </div>
              {userTotalDeposits === 0 && (
  <p className="text-sm text-red-500">You must make a deposit before withdrawing.</p>
)}
{hasPendingWithdrawal && (
  <p className="text-sm text-red-500">You have a pending withdrawal request. Please wait for it to be processed.</p>
)}
{userTotalDeposits > 0 && !hasPendingWithdrawal && (
  <p className="text-xs text-gray-600 mt-1">
    You can withdraw up to ZMW {maxWithdraw.toFixed(2)} (based on your deposits x {multiplier}).
  </p>
)}
              
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
               
<button type="submit" disabled={!canWithdraw} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
  Submit Request
</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanDetail;


