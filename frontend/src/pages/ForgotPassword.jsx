import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaEnvelope, FaArrowLeft, FaCheck, FaTimes } from 'react-icons/fa';
import { authService } from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [emailExists, setEmailExists] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setEmailExists(null);

    // Validation
    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      setLoading(false);
      return;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: 'Email is invalid' });
      setLoading(false);
      return;
    }

    try {
      const response = await authService.forgotPassword({ email });
      
      if (response.data.success) {
        setIsSubmitted(true);
        setEmailExists(true);
        toast.success(response.data.message || 'Password reset link sent to your email!', {
          autoClose: 10000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: false
        });
      } else {
        toast.error(response.data.message || 'Failed to send reset link', {
          autoClose: 10000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: false
        });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      
      const toastConfig = {
        autoClose: 10000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: false
      };
      
      if (error.response) {
        const status = error.response.status;
        const errorMessage = error.response.data?.message || 
                            error.response.data?.error ||
                            'Failed to send reset link. Please try again.';
        
        if (status === 404) {
          // Email not found in database
          setEmailExists(false);
          toast.warning(errorMessage, toastConfig);
        } else if (status === 403) {
          // Account deactivated
          toast.error(errorMessage, toastConfig);
        } else if (status === 400) {
          // Validation errors
          toast.error(errorMessage, toastConfig);
          if (error.response.data?.errors) {
            setErrors(error.response.data.errors);
          }
        } else {
          toast.error(errorMessage, toastConfig);
        }
      } else if (error.request) {
        toast.error('Network error. Please check your connection.', toastConfig);
      } else {
        toast.error('An unexpected error occurred. Please try again.', toastConfig);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-700">SaveWise</h1>
          <p className="mt-2 text-lg text-gray-600">Reset Your Password</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-blue-100">
          
          {/* Back to Login */}
          <div className="mb-6">
            <Link 
              to="/login"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 transition group"
            >
              <FaArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Login
            </Link>
          </div>

          {isSubmitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaCheck className="text-2xl text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Check Your Email</h2>
              <p className="text-gray-600 mb-6">
                We've sent password reset instructions to <strong>{email}</strong>
              </p>
              
              {/* Email delivery status */}
              <div className={`p-4 rounded-lg mb-6 ${emailExists ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                <div className="flex items-center mb-2">
                  {emailExists ? (
                    <>
                      <FaCheck className="text-green-500 mr-2" />
                      <span className="font-medium text-green-700">Email sent successfully</span>
                    </>
                  ) : (
                    <>
                      <FaTimes className="text-yellow-500 mr-2" />
                      <span className="font-medium text-yellow-700">Email verification needed</span>
                    </>
                  )}
                </div>
                <p className={`text-sm ${emailExists ? 'text-green-600' : 'text-yellow-600'}`}>
                  {emailExists 
                    ? 'Please check your inbox and spam folder for the reset link.'
                    : 'If you have an account with this email, you will receive a reset link.'}
                </p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-600">
                  <strong>Didn't receive the email?</strong>
                </p>
                <ul className="text-sm text-gray-600 mt-2 space-y-1">
                  <li className="flex items-center">
                    <FaCheck className="text-blue-500 mr-2 text-xs" />
                    Check your spam or junk folder
                  </li>
                  <li className="flex items-center">
                    <FaCheck className="text-blue-500 mr-2 text-xs" />
                    Make sure you entered the correct email address
                  </li>
                  <li className="flex items-center">
                    <FaCheck className="text-blue-500 mr-2 text-xs" />
                    Wait a few minutes and try again
                  </li>
                </ul>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail('');
                    setEmailExists(null);
                  }}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  Send Again
                </button>
                <Link
                  to="/login"
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition text-center"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Forgot Password?</h2>
                <p className="mt-2 text-gray-600">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors({ ...errors, email: '' });
                        setEmailExists(null);
                      }}
                      className={`block w-full pl-10 pr-3 py-3 border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition`}
                      placeholder="you@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FaTimes className="mr-1" /> {errors.email}
                    </p>
                  )}
                  
                  {/* Email existence indicator */}
                  {email && !errors.email && emailExists === false && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                      <p className="text-sm text-red-600 flex items-center">
                        <FaTimes className="mr-2" />
                        No account found with this email. Please check the email or 
                        <Link to="/register" className="ml-1 text-blue-600 hover:text-blue-800">
                          create a new account
                        </Link>
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending reset link...
                      </span>
                    ) : (
                      'Send Reset Link'
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-medium text-yellow-800 mb-2 flex items-center">
                    <FaEnvelope className="mr-2" /> Important
                  </h3>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li className="flex items-center">
                      <FaCheck className="mr-2 text-xs" />
                      The reset link will expire in 1 hour
                    </li>
                    <li className="flex items-center">
                      <FaCheck className="mr-2 text-xs" />
                      Only use the link from your registered email
                    </li>
                    <li className="flex items-center">
                      <FaCheck className="mr-2 text-xs" />
                      Check your spam folder if you don't see the email
                    </li>
                    <li className="flex items-center">
                      <FaCheck className="mr-2 text-xs" />
                      Make sure you're using the email associated with your account
                    </li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;