import React, { useState, useEffect } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import axios from 'axios';
import { toast } from 'react-toastify';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
);


const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPlans: 0,
    totalSavings: 0,
    progress: 0,
    nextDeposit: null
  });
  const [recentDeposits, setRecentDeposits] = useState([]);


  useEffect(() => {
  let ignore = false;

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await axios.get(
        'https://savewise-mpzn.onrender.com/api/plans/dashboard',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!ignore) {
        setStats(response.data.stats);
        setRecentDeposits(response.data.recentDeposits);
      }

    } catch (error) {
      console.log("Failed to load dashboard data", error);
      toast.error('Failed to load dashboard data');
    }
  };

  fetchDashboardData();

  return () => {
    ignore = true; // prevents setting state after unmount
  };
}, []);

  


  const progressData = {
    labels: ['Saved', 'Remaining'],
    datasets: [{
      data: [stats.progress, 100 - stats.progress],
      backgroundColor: ['#0ea5e9', '#e5e7eb'],
      borderWidth: 0
    }]
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard1</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
            <h3 className="text-sm font-medium text-gray-500">Total Plans1</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalPlans}</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
            <h3 className="text-sm font-medium text-gray-500">Total Savings1</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">ZMW {stats.totalSavings.toLocaleString()}</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
            <h3 className="text-sm font-medium text-gray-500">Progress</h3>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${stats.progress}%` }}
                ></div>
              </div>
              <p className="text-2xl font-bold text-blue-600 mt-2">{stats.progress}%</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
            <h3 className="text-sm font-medium text-gray-500">Next Deposit</h3>
            <p className="text-xl font-bold text-blue-600 mt-2">
              {stats.nextDeposit ? new Date(stats.nextDeposit).toLocaleDateString() : 'No upcoming'}
            </p>
          </div>
        </div>
        
        {/* Charts and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Progress Overview</h2>
            <div className="h-64">
              <Doughnut data={progressData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Deposits</h2>
            <div className="space-y-4">
              {recentDeposits.map((deposit, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{deposit.plan_name}</p>
                    <p className="text-sm text-gray-600">{new Date(deposit.deposit_date).toLocaleDateString()}</p>
                  </div>
                  <span className="text-lg font-bold text-blue-600">ZMW {deposit.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
