import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { planService } from '../services/api';
import MembersTab from '../components/MembersTab';
import { 
  FaPlus, 
  FaSearch, 
  FaFilter, 
  FaCalendarAlt, 
  FaUsers,
  FaMoneyBillWave,
  FaChartLine,
  FaEllipsisH,
  FaTrash,
  FaEdit
} from 'react-icons/fa';
import { format } from 'date-fns';

const Plans = () => {
  //const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
    totalSavings: 0,
    totalMembers: 0
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await planService.getPlans();
      if (response.data.success) {
        setPlans(response.data.plans);
        calculateStats(response.data.plans);
      }
    } catch (error) {
      console.error('Error loading Plans:', error);
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (plansData) => {
    const statsData = {
      total: plansData.length,
      active: plansData.filter(p => p.status === 'active').length,
      completed: plansData.filter(p => p.status === 'completed').length,
      cancelled: plansData.filter(p => p.status === 'cancelled').length,
      totalSavings: 0,
      totalMembers: 0
    };

    plansData.forEach(plan => {
      // Calculate total savings from deposits
      const planTotal = plan.deposits?.reduce((sum, deposit) => {
        return sum + parseFloat(deposit.amount);
      }, 0) || 0;
      
      statsData.totalSavings += planTotal;
      statsData.totalMembers += plan.members?.length || 1;
    });

    setStats(statsData);
  };

  const handleDeletePlan = async () => {
    if (!selectedPlan) return;

    try {
      await planService.deletePlan(selectedPlan.id);
      toast.success('Plan deleted successfully');
      fetchPlans();
    } catch (error) {
      console.log (error)
      toast.error('Failed to delete plan');
    } finally {
      setShowDeleteModal(false);
      setSelectedPlan(null);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFrequencyIcon = (frequency) => {
    switch (frequency) {
      case 'weekly':
        return '📅';
      case 'bi-weekly':
        return '📆';
      case 'monthly':
        return '🗓️';
      default:
        return '📅';
    }
  };

  const PlanDetail = () => {
  const [activeTab, setActiveTab] = useState('overview');
  
  return (
    <div>
      {/* Existing plan details */}
      
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('deposits')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'deposits'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Deposits
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'members'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Members ({plans?.members?.length || 0})
          </button>
        </nav>
       </div>
      
       {/* Tab Content */}
       <div>
        {/* {activeTab === 'overview' && (
          // Overview content
        )}
        
        {activeTab === 'deposits' && (
          // Deposits content
        )} */}
        
        {activeTab === 'members' && (
          <MembersTab 
            planId={planId}
            isOwner={plan?.owner_id === userId}
            isAdmin={isAdmin}
          />
        )}
      </div>
    </div>
  );
};

  const calculateProgress = (plan) => {
    const totalDeposits = plan.deposits?.reduce((sum, deposit) => sum + parseFloat(deposit.amount), 0) || 0;
    const progress = (totalDeposits / plan.target_amount) * 100;
    return Math.min(100, progress.toFixed(1));
  };

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.plan_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || plan.status === filter;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your saving plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Saving Plans</h1>
          <p className="text-gray-600 mt-2">Manage and track all your saving plans in one place</p>
        </div>
        
        <Link
          to="/plans/create"
          className="mt-4 md:mt-0 inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
        >
          <FaPlus className="mr-2" />
          Create New Plan
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Plans</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaChartLine className="text-2xl text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Plans</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.active}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FaCalendarAlt className="text-2xl text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Savings</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                ZMW {stats.totalSavings.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FaMoneyBillWave className="text-2xl text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Members</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalMembers}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FaUsers className="text-2xl text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
          <div className="relative flex-1 md:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <FaFilter className="text-gray-400 mr-2" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Plans</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      {filteredPlans.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FaChartLine className="text-3xl text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No plans found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm ? 'Try adjusting your search terms' : 'Create your first saving plan to get started'}
          </p>
          <Link
            to="/plans/create"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            <FaPlus className="mr-2" />
            Create New Plan
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => {
            const progress = calculateProgress(plan);
            
            return (
              <div key={plan.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
                {/* Plan Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 truncate">{plan.plan_name}</h3>
                      <p className="text-gray-600 text-sm mt-1">{plan.description}</p>
                    </div>
                     <div className="flex items-center space-x-2">
                     {/* Add role badge */}
                     <span className={`px-2 py-1 rounded text-xs font-medium ${
                         plan.role === 'owner' 
                             ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                           }`}>
                       {plan.role === 'owner' ? 'Owner' : 'Member'}
                     </span>
                    <div className="relative">
                      <button
                        onClick={() => setSelectedPlan(plan)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <FaEllipsisH className="text-gray-500" />
                      </button>
                      
                      {selectedPlan?.id === plan.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                          <Link
                            to={`/plans/${plan.id}`}
                            className="block w-full text-left px-4 py-2 hover:bg-gray-50"
                          >
                            View Details
                          </Link>
                          <Link
                            to={`/plans/${plan.id}/edit`}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center"
                          >
                            <FaEdit className="mr-2 text-blue-500" />
                            Edit Plan
                          </Link>
                          <button
                            onClick={() => {
                              setSelectedPlan(plan);
                              setShowDeleteModal(true);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center text-red-600"
                          >
                            <FaTrash className="mr-2" />
                            Delete Plan
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(plan.status)}`}>
                      {plan?.status?.charAt(0).toUpperCase() + plan?.status?.slice(1) || 'S' }
                      
                    </span>
                    <div className="flex items-center text-gray-500">
                      <span className="mr-2">{getFrequencyIcon(plan.frequency)}</span>
                      <span className="text-sm">{plan.frequency}</span>
                    </div>
                  </div>
                </div>

                {/* Plan Details */}
                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <span>
                          ZMW {(plan.deposits?.reduce((s, d) => s + parseFloat(d.amount), 0) || 0).toLocaleString()}
                        </span>
                        <span>ZMW {plan.target_amount.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Start Date</p>
                        <p className="font-medium">{format(new Date(plan.start_date), 'MMM d, yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">End Date</p>
                        <p className="font-medium">{format(new Date(plan.end_date), 'MMM d, yyyy')}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Members</p>
                        <div className="flex items-center mt-1">
                          <FaUsers className="text-gray-400 mr-2" />
                          <span className="font-medium">{plan.members?.length || 1}</span>
                          <span className="text-gray-500 text-sm ml-1">/ {plan.max_members}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Cycle</p>
                        <p className="font-medium">{plan.cycle}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <Link
                      to={`/plans/${plan.id}`}
                      className="block w-full text-center py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Plan</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{selectedPlan.plan_name}"? This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedPlan(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePlan}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Plans;