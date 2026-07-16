import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { dashboardService } from '../services/api';
import { 
  FaChartLine, 
  FaMoneyBillWave, 
  FaUsers, 
  FaCalendarAlt,
  FaPiggyBank,
  FaArrowUp,
  FaArrowDown,
  FaBell,
  FaClock,
  FaStar
} from 'react-icons/fa';
import { toast } from 'react-toastify';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_plans: 0,
    total_savings: 0,
    total_target: 0,
    progress: 0,
    active_plans: 0,
    total_members: 0,
    upcoming_deposits: 0,
    pending_withdrawals: 0
  });
  const [recentDeposits, setRecentDeposits] = useState([]);
  const [upcomingDeposits, setUpcomingDeposits] = useState([]);
  const [recentWithdrawals, setRecentWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

    const [monthFilter, setMonthFilter] = useState(() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
});
const [weeklyTrend, setWeeklyTrend] = useState([]);
const [trendRange, setTrendRange] = useState('6m');
const [trendData, setTrendData] = useState([]);

  const fetchDashboardData = async (month = monthFilter, range = trendRange) => {
  try {
    setLoading(true);
    const response = await dashboardService.getDashboardStats({ month, trend_range: range });
    if (response.data.success) {
      setStats(response.data.stats);
      setRecentDeposits(response.data.recent_deposits || []);
      setUpcomingDeposits(response.data.upcoming_deposits || []);
      setRecentWithdrawals(response.data.recent_withdrawals || []);
      setTrendData(response.data.trend_data || []);
    }
  } catch (error) {
    console.log(error)
    toast.error('Failed to load dashboard data');
  } finally {
    setLoading(false);
  }
};




  // Generate chart data from real data
  const generateSavingsTrendData = () => {
  const labels = trendData.map(item => item.label);
  const data = trendData.map(item => item.amount);
  let cumulative = 0;
  const cumulativeData = data.map(val => {
    cumulative += val;
    return cumulative;
  });
  return {
    labels,
    datasets: [
      {
        label: 'Deposits',
        data,
        borderColor: '#0ea5e9',
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Cumulative',
        data: cumulativeData,
        borderColor: '#10b981',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.4
      }
    ]
  };
};

const handleThisMonth = () => {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  setMonthFilter(month);
  fetchDashboardData(month);
};

const generatePlanDistributionData = () => {
  return {
    labels: ['Active', 'Completed', 'Pending (Future Start)'],
    datasets: [{
      data: [
        stats.active_plans || 0,
        stats.completed_plans || 0,
        stats.pending_plans || 0
      ],
      backgroundColor: ['#0ea5e9', '#10b981', '#f59e0b']
    }]
  };
};

  const quickStats = [
    {
      title: 'Average Deposit',
      value: recentDeposits.length > 0 
        ? `ZMW ${(stats.total_savings / recentDeposits.length).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
        : 'ZMW 0',
      change: '+12%',
      icon: <FaMoneyBillWave />,
      color: 'green'
    },
    {
      title: 'On Track Plans',
      value: stats.active_plans,
      change: `Active`,
      icon: <FaChartLine />,
      color: 'blue'
    },
    {
      title: 'Upcoming Deposits',
      value: stats.upcoming_deposits,
      change: 'Next 7 days',
      icon: <FaBell />,
      color: 'orange'
    },
    {
      title: 'Pending Withdrawals',
      value: stats.pending_withdrawals,
      change: 'Awaiting approval',
      icon: <FaClock />,
      color: 'yellow'
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back! Here's an overview of your saving plans.
          </p>
        </div>
        <div className="flex space-x-3 mt-4 md:mt-0">
          <button 
            onClick={fetchDashboardData}
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
          >
            Refresh
          </button>
          <button
  onClick={handleThisMonth}
  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
>
  <FaCalendarAlt className="mr-2 inline" />
  This Month
</button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm opacity-90">Total Savings (All plans)</p>
              <p className="text-3xl font-bold mt-2">
                ZMW {stats.total_savings.toLocaleString()}
              </p>
              <div className="flex items-center mt-2 text-sm">
                <FaArrowUp className="mr-1" />
                <span>{stats.progress}% of target</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <FaMoneyBillWave className="text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Active Plans</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.active_plans}</p>
              <div className="flex items-center mt-2 text-sm text-green-600">
                <FaChartLine className="mr-1" />
                <span>of {stats.total_plans} total</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaChartLine className="text-2xl text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Total Members</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.total_members}</p>
              <div className="flex items-center mt-2 text-sm text-blue-600">
                <FaUsers className="mr-1" />
                <span>Across all plans</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FaUsers className="text-2xl text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Progress to Goal</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.progress}%</p>
              <div className="flex items-center mt-2 text-sm text-purple-600">
                <FaPiggyBank className="mr-1" />
                <span>ZMW {(stats.total_target - stats.total_savings).toLocaleString()} to go</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FaPiggyBank className="text-2xl text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {quickStats.map((stat, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">{stat.title}</p>
                <p className="text-lg font-bold text-gray-800 mt-1">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 ${stat.color === 'green' ? 'bg-green-100' : stat.color === 'blue' ? 'bg-blue-100' : stat.color === 'orange' ? 'bg-orange-100' : 'bg-yellow-100'} rounded-lg flex items-center justify-center`}>
                <div className={`${stat.color === 'green' ? 'text-green-600' : stat.color === 'blue' ? 'text-blue-600' : stat.color === 'orange' ? 'text-orange-600' : 'text-yellow-600'}`}>
                  {stat.icon}
                </div>
              </div>
            </div>
            <div className={`mt-2 text-xs ${stat.color === 'green' ? 'text-green-600' : stat.color === 'blue' ? 'text-blue-600' : stat.color === 'orange' ? 'text-orange-600' : 'text-yellow-600'}`}>
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Savings Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
  <h3 className="text-lg font-semibold text-gray-800">Savings Trend</h3>
  <select
    value={trendRange}
    onChange={(e) => {
      setTrendRange(e.target.value);
      fetchDashboardData(monthFilter, e.target.value);
    }}
    className="text-sm border border-gray-300 rounded-lg px-3 py-1"
  >
    <option value="1w">Last Week</option>
    <option value="2w">Last 2 Weeks</option>
    <option value="1m">Last Month</option>
    <option value="2m">Last 2 Months</option>
    <option value="6m">Last 6 Months</option>
  </select>
</div>
          <div className="h-64">
            <Line
              data={generateSavingsTrendData()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: true,
                    position: 'top'
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => `ZMW ${value.toLocaleString()}`
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Plan Distribution</h3>
          <div className="h-64">
            <Doughnut
              data={generatePlanDistributionData()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right'
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Recent Activity & Upcoming Deposits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Recent Deposits</h3>
            <Link to="/deposits" className="text-blue-600 hover:text-blue-700 text-sm">
              View All →
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentDeposits.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500">No recent deposits</p>
              </div>
            ) : (
              recentDeposits.map((deposit, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <FaMoneyBillWave className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{deposit.plan?.plan_name || 'Unknown Plan'}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(deposit.deposit_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">
                      ZMW {parseFloat(deposit.amount).toLocaleString()}
                    </p>
                    <span className={`text-xs px-2 py-1 ${
                      deposit.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    } rounded`}>
                      {deposit.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Deposits */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Upcoming Deposits</h3>
            <span className="text-sm text-gray-500">Next 7 days</span>
          </div>
          
          <div className="space-y-4">
            {upcomingDeposits.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500">No upcoming deposits</p>
              </div>
            ) : (
              upcomingDeposits.map((deposit, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                      <FaCalendarAlt className="text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium">{deposit.plan?.plan_name || 'Unknown Plan'}</p>
                      <p className="text-sm text-gray-500">
                        Due: {new Date(deposit.expected_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">
                      ZMW {parseFloat(deposit.amount).toLocaleString()}
                    </p>
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                      Pending
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/plans/create"
            className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-blue-200 transition"
          >
            <FaPiggyBank className="text-3xl text-blue-600 mb-4" />
            <h4 className="font-semibold text-gray-800 mb-2">Create New Plan</h4>
            <p className="text-sm text-gray-600">Start a new saving plan with custom goals</p>
          </Link>
          
          <Link
            to="/withdrawals"
            className="p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl hover:from-green-100 hover:to-green-200 transition"
          >
            <FaMoneyBillWave className="text-3xl text-green-600 mb-4" />
            <h4 className="font-semibold text-gray-800 mb-2">Request Withdrawal</h4>
            <p className="text-sm text-gray-600">Withdraw funds from your saving plans</p>
          </Link>
          
          <Link
            to="/plans"
            className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl hover:from-purple-100 hover:to-purple-200 transition"
          >
            <FaChartLine className="text-3xl text-purple-600 mb-4" />
            <h4 className="font-semibold text-gray-800 mb-2">View All Plans</h4>
            <p className="text-sm text-gray-600">Manage and track all your saving plans</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;