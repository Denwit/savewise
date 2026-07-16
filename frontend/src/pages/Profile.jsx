import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { parseSaveWiseDate } from '../utils/date';
import { authService } from '../services/api';
import { API_ORIGIN } from '../config/api';
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaCalendarAlt, 
  FaEdit,
  FaSave,
  FaTimes,
  FaShieldAlt,
  FaChartLine,
  FaMoneyBillWave,
  FaLock,
  FaUpload,
  FaQrcode,
  FaKey,
  FaCheckCircle,
  FaClock,
  FaUsers,
  FaPiggyBank,
  FaCamera,
  FaSpinner
} from 'react-icons/fa';

const Profile = () => {
  const [user, setUser] = useState({
    username: '',
    email: '',
    phone: '',
    created_at: '',
    profile_picture: null,
    statistics: {
      totalPlans: 0,
      activePlans: 0,
      totalSaved: 0,
      myTotalDeposits: 0,
      netSavings: 0,
      totalWithdrawn: 0,
      totalDepositsCount: 0,
      averageDeposit: 0
    },
    settings: {
      two_factor_enabled: false
    }
  });
  
  const API_BASE = API_ORIGIN;

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [imageError, setImageError] = useState(false);
  useEffect(() => {
    fetchUserProfile();
  }, []);


  useEffect(() => {
  setImageError(false);
}, [user.profile_picture]);

  const fetchUserProfile = async () => {
    console.log("Profile picture:", user.profile_picture);
    console.log('Profile image URL:', `${API_BASE}${user.profile_picture}`);
    try {
      setLoading(true);
      const response = await authService.getMe();
      if (response.data.success) {
        const userData = response.data.user;
        setUser({
          ...userData,
          statistics: userData.statistics || {
            totalPlans: 0,
            activePlans: 0,
            totalSaved: 0,
            myTotalDeposits: 0,
            netSavings: 0,
            totalWithdrawn: 0,
            totalDepositsCount: 0,
            averageDeposit: 0
          }
        });
        setFormData({
          username: userData.username,
          phone: userData.phone || ''
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await authService.updateProfile(formData);
      if (response.data.success) {
        toast.success('Profile updated successfully');
        setUser(prev => ({
          ...prev,
          ...formData,
          statistics: response.data.user.statistics || prev.statistics
        }));
        setEditing(false);
      }
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handlePhotoUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Validate file
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    toast.error('Please select a valid image file (JPEG, PNG, GIF, WebP)');
    return;
  }

  if (file.size > 5 * 1024 * 1024) { // 5MB
    toast.error('Image must be less than 5MB');
    return;
  }

  try {
    setUploadingPhoto(true);
    
    const formData = new FormData();
    formData.append('profile_picture', file);
    
    //const token = localStorage.getItem('token');
    const response = await authService.uploadPhoto(formData);
    const data = response.data;

    //const data = await response.json();
    
    if (data.success) {
      toast.success('Profile photo updated successfully');
      setUser(prev => ({
        ...prev,
        ...data.user,
        profile_picture: data.profile_picture
      }));
      
      // Also update the user in localStorage
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (storedUser) {
        storedUser.profile_picture = data.profile_picture;
        localStorage.setItem('user', JSON.stringify(storedUser));
      }
    } else {
      toast.error(data.message || 'Failed to upload photo');
    }
  } catch (error) {
    console.error('Upload photo error:', error);
    toast.error('Failed to upload photo');
  } finally {
    setUploadingPhoto(false);
  }
};

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      await authService.updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      toast.success('Password updated successfully');
      setShowPasswordModal(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    }
  };

  const handleToggle2FA = async () => {
    if (user.settings?.two_factor_enabled) {
      // Disable 2FA
      if (window.confirm('Are you sure you want to disable two-factor authentication?')) {
        try {
          const response = await authService.setup2FA({ enable: false });
          if (response.data.success) {
            toast.success('Two-factor authentication disabled');
            setUser(prev => ({
              ...prev,
              settings: {
                ...prev.settings,
                two_factor_enabled: false
              }
            }));
          }
        } catch (error) {
          toast.error(error.response?.data?.message || 'Failed to disable 2FA');
        }
      }
    } else {
      // Enable 2FA - show modal for setup
      setShow2FAModal(true);
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    
    if (!twoFactorToken.trim()) {
      toast.error('Please enter the 6-digit token');
      return;
    }

    if (!/^\d{6}$/.test(twoFactorToken)) {
      toast.error('Token must be 6 digits');
      return;
    }

    try {
      // First verify the token
      const verifyResponse = await authService.verify2FA({ token: twoFactorToken });
      
      if (verifyResponse.data.success) {
        // If token is valid, enable 2FA
        const setupResponse = await authService.setup2FA({ enable: true });
        
        if (setupResponse.data.success) {
          toast.success('Two-factor authentication enabled successfully');
          setUser(prev => ({
            ...prev,
            settings: {
              ...prev.settings,
              two_factor_enabled: true
            }
          }));
          setShow2FAModal(false);
          setTwoFactorToken('');
          
          // Show backup codes (in production, you'd want to show these in a secure way)
          if (setupResponse.data.settings?.backup_codes) {
            alert('Save these backup codes in a safe place:\n' + 
                  setupResponse.data.settings.backup_codes.join('\n'));
          }
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to enable 2FA');
    }
  };  // Format member since date
  const formatMemberSince = (dateString) => {
    const date = parseSaveWiseDate(dateString);
    if (!date) return 'Not set';

    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months !== 1 ? 's' : ''} ago`;
    }
    const years = Math.floor(diffDays / 365);
    return `${years} year${years !== 1 ? 's' : ''} ago`;
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `ZMW ${parseFloat(amount).toLocaleString('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };
/* 
  // Real stats from user statistics
  const stats = [
    { 
      label: 'Total Plans', 
      value: user.statistics.totalPlans.toString(), 
      icon: <FaChartLine />, 
      color: 'blue',
      description: 'All plans you own or are a member of'
    },
    { 
      label: 'Total Saved', 
      value: formatCurrency(user.statistics.totalSaved), 
      icon: <FaMoneyBillWave />, 
      color: 'green',
      description: 'Total deposits across all your plans'
    },
    { 
      label: 'My Deposits', 
      value: formatCurrency(user.statistics.myTotalDeposits), 
      icon: <FaPiggyBank />, 
      color: 'purple',
      description: 'Total amount you have deposited'
    },
    { 
      label: 'Net Savings', 
      value: formatCurrency(user.statistics.netSavings), 
      icon: <FaMoneyBillWave />, 
      color: user.statistics.netSavings >= 0 ? 'green' : 'red',
      description: 'Your deposits minus withdrawals'
    },
    { 
      label: 'Active Plans', 
      value: user.statistics.activePlans.toString(), 
      icon: <FaChartLine />, 
      color: 'orange',
      description: 'Currently active saving plans'
    },
    { 
      label: 'Total Deposits', 
      value: user.statistics.totalDepositsCount.toString(), 
      icon: <FaClock />, 
      color: 'teal',
      description: 'Number of deposits you have made'
    }
  ]; */

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">My Profile</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your personal information and account settings
          </p>
        </div>
        
        <button
          onClick={() => setEditing(!editing)}
          className="mt-4 md:mt-0 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center transition"
        >
          {editing ? <FaTimes className="mr-2" /> : <FaEdit className="mr-2" />}
          {editing ? 'Cancel Editing' : 'Edit Profile'}
        </button>
      </div>

      {/* Stats Grid */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
            <div className="flex items-center">
              <div className={`w-12 h-12 ${
                stat.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' : 
                stat.color === 'green' ? 'bg-green-100 dark:bg-green-900/30' : 
                stat.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30' : 
                stat.color === 'orange' ? 'bg-orange-100 dark:bg-orange-900/30' :
                stat.color === 'teal' ? 'bg-teal-100 dark:bg-teal-900/30' :
                'bg-red-100 dark:bg-red-900/30'
              } rounded-lg flex items-center justify-center mr-4`}>
                <div className={`${
                  stat.color === 'blue' ? 'text-blue-600 dark:text-blue-400' : 
                  stat.color === 'green' ? 'text-green-600 dark:text-green-400' : 
                  stat.color === 'purple' ? 'text-purple-600 dark:text-purple-400' : 
                  stat.color === 'orange' ? 'text-orange-600 dark:text-orange-400' :
                  stat.color === 'teal' ? 'text-teal-600 dark:text-teal-400' :
                  'text-red-600 dark:text-red-400'
                } text-xl`}>
                  {stat.icon}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className={`text-2xl font-bold ${
                  stat.color === 'red' ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-white'
                } mt-1`}>
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div> */}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Personal Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
                <FaUser className="mr-3 text-blue-500" />
                Personal Information
              </h3>
              <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
                user.email_verified ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
              }`}>
                <FaShieldAlt className="mr-2" />
                {user.email_verified ? 'Verified Account' : 'Verification Pending'}
              </div>
            </div>

            {editing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      minLength="3"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <div className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                      <FaEnvelope className="text-gray-400 dark:text-gray-500 mr-3" />
                      <span className="text-gray-600 dark:text-gray-400">{user.email}</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <div className="flex items-center">
                      <div className="relative flex-1">
                        <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="+260 123 456 789"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center transition"
                  >
                    <FaSave className="mr-2" />
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Username</p>
                    <p className="font-medium text-gray-800 dark:text-white mt-1">{user.username}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                    <div className="flex items-center mt-1">
                      <FaEnvelope className="text-gray-400 dark:text-gray-500 mr-2" />
                      <p className="font-medium text-gray-800 dark:text-white">{user.email}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Phone Number</p>
                    <div className="flex items-center mt-1">
                      <FaPhone className="text-gray-400 dark:text-gray-500 mr-2" />
                      <p className="font-medium text-gray-800 dark:text-white">
                        {user.phone || 'Not provided'}
                        {user.phone_verified && (
                          <FaCheckCircle className="inline ml-2 text-green-500" title="Verified" />
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
                    <div className="flex items-center mt-1">
                      <FaCalendarAlt className="text-gray-400 dark:text-gray-500 mr-2" />
                      <p className="font-medium text-gray-800 dark:text-white">
                        {formatMemberSince(user.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Average Deposit</p>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white">
                    {formatCurrency(user.statistics.averageDeposit || 0)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Based on {user.statistics.totalDepositsCount} deposits
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Security Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 flex items-center">
              <FaShieldAlt className="mr-3 text-blue-500" />
              Security Settings
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">Change Password</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Update your account password</p>
                </div>
                <button 
                  onClick={() => setShowPasswordModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Change Password
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user.settings?.two_factor_enabled 
                      ? 'Add an extra layer of security to your account' 
                      : 'Enable two-factor authentication for enhanced security'
                    }
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-2 py-1 rounded text-sm ${
                    user.settings?.two_factor_enabled 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {user.settings?.two_factor_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <button 
                    onClick={handleToggle2FA}
                    className={`px-4 py-2 rounded-lg transition ${
                      user.settings?.two_factor_enabled 
                        ? 'border border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' 
                        : 'border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                    }`}
                  >
                    {user.settings?.two_factor_enabled ? 'Disable' : 'Enable'} 2FA
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Profile Summary */}
        <div className="space-y-8">
          {/* Profile Photo */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
  <div className="relative mx-auto w-32 h-32 mb-4">
  <div className="w-full h-full rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-lg">
    {user.profile_picture && !imageError ? (
      <img
  key={user.profile_picture} // ← add this
  src={`${API_BASE}${user.profile_picture}`}
  alt={`${user.username}'s profile`}
  className="w-full h-full object-cover"
  onError={() => setImageError(true)}
/>


    ) : (
      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-4xl font-bold">
        {user.username?.charAt(0).toUpperCase() || 'U'}
      </div>
    )}
  </div>

  <label
    className={`absolute bottom-0 right-0 p-3 rounded-full cursor-pointer transition-all duration-200 ${
      uploadingPhoto
        ? 'bg-gray-400 cursor-not-allowed'
        : 'bg-blue-600 hover:bg-blue-700'
    } text-white shadow-lg hover:shadow-xl`}
  >
    {uploadingPhoto ? (
      <FaSpinner className="animate-spin" />
    ) : (
      <FaCamera />
    )}
    <input
      type="file"
      accept="image/*"
      onChange={handlePhotoUpload}
      className="hidden"
      disabled={uploadingPhoto}
    />
  </label>
</div>
  
  {uploadingPhoto && (
    <div className="mb-4">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Uploading...</p>
    </div>
  )}
  
  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{user.username}</h3>
  <p className="text-gray-600 dark:text-gray-400 truncate">{user.email}</p>
  
  <div className="mt-4 space-y-2">
    <p className="text-sm text-gray-600 dark:text-gray-400">
      Click the camera icon to upload a new photo
    </p>
    <p className="text-xs text-gray-500 dark:text-gray-500">
      Supported formats: JPG, PNG, GIF, WebP (max 5MB)
    </p>
  </div>
</div>

          {/* Account Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Account Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Account Status</span>
                <span className={`px-2 py-1 text-sm rounded ${
                  user.is_active 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                    : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                }`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Email Verified</span>
                <span className={`flex items-center ${
                  user.email_verified ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
                }`}>
                  {user.email_verified ? (
                    <>
                      <FaCheckCircle className="mr-1" />
                      Verified
                    </>
                  ) : (
                    <>
                      <FaClock className="mr-1" />
                      Pending
                    </>
                  )}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Phone Verified</span>
                <span className={`flex items-center ${
                  user.phone_verified ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
                }`}>
                  {user.phone_verified ? (
                    <>
                      <FaCheckCircle className="mr-1" />
                      Verified
                    </>
                  ) : user.phone ? (
                    <>
                      <FaClock className="mr-1" />
                      Pending
                    </>
                  ) : (
                    'Not Set'
                  )}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Account Age</span>
                <span className="text-gray-800 dark:text-white">
                  {formatMemberSince(user.created_at ?? user.createdAt)}
                </span>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Plan Distribution</h4>
              {user.statistics.planDistribution ? (
                Object.entries(user.statistics.planDistribution).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{status}:</span>
                    <span className="text-sm font-medium text-gray-800 dark:text-white">{count}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-500">No plan data available</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                <FaLock className="mr-2" />
                Change Password
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Update your account password</p>
            </div>
            
            <form onSubmit={handlePasswordSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    required
                    minLength="6"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Must be at least 6 characters</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                <FaQrcode className="mr-2" />
                Setup Two-Factor Authentication
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Scan the QR code with your authenticator app and enter the 6-digit code
              </p>
            </div>
            
            <form onSubmit={handle2FASubmit} className="p-6">
              <div className="space-y-4">
                <div className="text-center">
                  <div className="inline-block p-4 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4">
                    <FaQrcode className="text-4xl text-gray-400 dark:text-gray-500" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">QR Code Placeholder</p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    In production, a real QR code would be displayed here
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    6-digit Verification Code
                  </label>
                  <input
                    type="text"
                    value={twoFactorToken}
                    onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-xl tracking-widest"
                    maxLength="6"
                    required
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShow2FAModal(false);
                    setTwoFactorToken('');
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center transition"
                >
                  <FaKey className="mr-2" />
                  Enable 2FA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;






