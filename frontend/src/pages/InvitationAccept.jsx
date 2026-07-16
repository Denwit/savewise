// pages/InvitationAccept.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaEnvelope, 
  FaUserFriends, 
  FaCalendarAlt,
  FaMoneyBillWave,
  FaCheckCircle,
  FaSignInAlt,
  FaUserPlus,
  FaSpinner,
  FaExclamationTriangle
} from 'react-icons/fa';

const InvitationAccept = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [currentUser, setCurrentUser] = useState(null); // Added this
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuthStatus();
    fetchInvitation();
  }, [token]);

  const checkAuthStatus = () => {
    const authToken = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    setIsLoggedIn(!!authToken);
    
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setCurrentUser(userData); // Set current user
        setUserEmail(userData.email || '');
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  };

  const fetchInvitation = async () => {
    try {
      const response = await fetch(`/api/invitation/${token}`);
      
      if (response.ok) {
        const data = await response.json();
        setInvitation(data.data.invitation);
      } else {
        const error = await response.json();
        setError(error.message || 'Invalid invitation link');
      }
    } catch (error) {
      console.error('Error fetching invitation:', error);
      setError('Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAcceptInvitation = async () => {
    if (!isLoggedIn) {
      // Store invitation token for after login
      localStorage.setItem('pending_invitation', token);
      navigate(`/login?redirect=/invitation/accept/${token}`);
      return;
    }
    
    // Check if logged-in user's email matches the invitation email (case-insensitive)
    if (userEmail.toLowerCase() !== invitation.email.toLowerCase()) {
      toast.error(`This invitation is for ${invitation.email}, but you're logged in as ${userEmail}. Please log out and log in with the correct email.`);
      return;
    }

    try {
      setAccepting(true);
      const authToken = localStorage.getItem('token');
      const response = await fetch(`/api/invitation/${token}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Successfully joined the plan!');
        
        // Clear pending invitation from localStorage
        localStorage.removeItem('pending_invitation');
        
        // Redirect to the plan
        setTimeout(() => {
          navigate(`/plans/${data.data.plan_id}`);
        }, 1500);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Error accepting invitation');
    } finally {
      setAccepting(false);
    }
  };

  // Handle logout and redirect to login with invitation
  const handleLogoutAndLogin = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to login with the invitation token
    window.location.href = `/login?invitation=${token}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Invitation Error
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white text-center">
            <FaEnvelope className="text-4xl mx-auto mb-4" />
            <h1 className="text-2xl font-bold">Plan Invitation</h1>
            <p className="mt-2 opacity-90">
              You've been invited to join a saving plan
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Invitation Details */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Invitation Details
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <FaEnvelope className="text-blue-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Invited Email</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {invitation.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <FaUserFriends className="text-green-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Invited By</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {invitation.inviter?.username || 'Unknown User'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {invitation.inviter?.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <FaCalendarAlt className="text-yellow-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Invitation Expires</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(invitation.expires_at).toLocaleDateString()} at{' '}
                      {new Date(invitation.expires_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Plan Details */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Plan Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Plan Name</p>
                  <p className="font-bold text-lg text-gray-900 dark:text-white">
                    {invitation.plan?.plan_name}
                  </p>
                  {invitation.plan?.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {invitation.plan.description}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Target Amount</p>
                  <p className="font-bold text-lg text-gray-900 dark:text-white">
                    {invitation.plan?.currency} {invitation.plan?.target_amount?.toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Max Members</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {invitation.plan?.max_members} members
                  </p>
                </div>
              </div>
            </div>

            {/* Action Section */}
            <div className="text-center">
              {isLoggedIn ? (
                <>
                  <div className="mb-6">
                    <div className="inline-flex items-center px-4 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                      <FaCheckCircle className="mr-2" />
                      Logged in as: {userEmail}
                    </div>
                  </div>
                  
                  {userEmail.toLowerCase() === invitation.email.toLowerCase() ? (
                    <button
                      onClick={handleAcceptInvitation}
                      disabled={accepting}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition disabled:opacity-50"
                    >
                      {accepting ? (
                        <span className="flex items-center justify-center">
                          <FaSpinner className="animate-spin mr-2" />
                          Accepting...
                        </span>
                      ) : (
                        'Accept Invitation & Join Plan'
                      )}
                    </button>
                  ) : (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                      <p className="text-red-600 dark:text-red-400">
                        You are logged in with a different email ({userEmail}). 
                        Please log out and log in with {invitation.email} to accept this invitation.
                      </p>
                      <div className="mt-4 space-x-3">
                        <button
                          onClick={handleLogoutAndLogin}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          Logout & Login
                        </button>
                        <button
                          onClick={() => navigate('/')}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          Go Home
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    To accept this invitation, you need to sign in or create an account
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link
                      to={`/login?invitation=${token}`}
                      className="inline-flex items-center justify-center py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
                    >
                      <FaSignInAlt className="mr-2" />
                      Sign In
                    </Link>
                    
                    <Link
                      to={`/register?invitation=${token}&email=${encodeURIComponent(invitation.email)}`}
                      className="inline-flex items-center justify-center py-3 px-6 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
                    >
                      <FaUserPlus className="mr-2" />
                      Create Account
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvitationAccept;