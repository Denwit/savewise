import React, { useState } from 'react';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaClock, FaPaperPlane, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { contactService } from '../services/api';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedReferenceId, setSubmittedReferenceId] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

    const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Basic validation
  if (!formData.name || !formData.email || !formData.subject || !formData.message) {
    toast.error('Please fill in all required fields');
    return;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email)) {
    toast.error('Please enter a valid email address');
    return;
  }

  setIsSubmitting(true);

  try {
    // Call the API using contactService
    const response = await contactService.submitContactForm(formData);
    
    // Check if response exists and has data
    if (response && response.data && response.data.success) {
      setIsSubmitted(true);
      
      // Store reference ID in state for display
      setSubmittedReferenceId(response.data.referenceId);
      
      toast.success(
        <div>
          <p>{response.data.message}</p>
          {response.data.referenceId && (
            <p className="text-sm mt-1">
              <strong>Reference ID:</strong> {response.data.referenceId}
            </p>
          )}
        </div>
      );
    } else {
      // Handle case where response structure is unexpected
      console.error('Unexpected response structure:', response);
      toast.error('Failed to send message. Please try again.');
    }
  } catch (error) {
    console.error('Contact form error details:', error);
    
    // Check for specific error types
    if (error.response) {
      // Server responded with error status
      if (error.response.data && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(`Server error: ${error.response.status}`);
      }
    } else if (error.request) {
      // Request was made but no response
      toast.error('Network error. Please check your connection.');
    } else {
      // Something else happened
      toast.error('Failed to send message. Please try again.');
    }
  } finally {
    setIsSubmitting(false);
  }
};

  const contactInfo = [
    {
      icon: <FaEnvelope className="text-xl text-blue-600 dark:text-blue-400" />,
      title: 'Email',
      details: ['support@savewise.com'],
      description: 'General inquiries'
    },
    {
      icon: <FaPhone className="text-xl text-green-600 dark:text-green-400" />,
      title: 'Phone',
      details: ['+260768969674'],
      description: 'Mon-Fri, 9AM-5PM CAT'
    },
    {
      icon: <FaMapMarkerAlt className="text-xl text-red-600 dark:text-red-400" />,
      title: 'Online',
      details: ['No Pysical Address Yet', 'Zambia'],
      description: 'Headquarters'
    },
    {
      icon: <FaClock className="text-xl text-purple-600 dark:text-purple-400" />,
      title: 'Hours',
      details: ['Monday-Friday: 9AM-6PM', 'Saturday: 10AM-2PM', 'Sunday: Closed'],
      description: 'Support availability'
    }
  ];

  const departments = [
    {
      name: 'Customer Support',
      email: 'support@savewise.com',
      description: 'Account issues, platform help, general questions',
      response: 'Within 24 hours'
    },
    {
      name: 'Technical Support',
      email: 'support@savewise.com',
      description: 'Technical issues, bugs, feature requests',
      response: 'Within 48 hours'
    },
    /* {
      name: 'Billing',
      email: 'billing@savewise.com',
      description: 'Payment issues, refunds, billing questions',
      response: 'Within 24 hours'
    },
    {
      name: 'Legal',
      email: 'legal@savewise.com',
      description: 'Terms, privacy, compliance matters',
      response: 'Within 48 hours'
    } */
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-6">
        <Link 
          to="/dashboard"
          className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition group"
        >
          <FaArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
      </div>
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-6">
          Get in Touch
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Have questions? We're here to help. Contact our support team for assistance with your saving plans.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Information */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-8">Contact Information</h2>
            
            <div className="space-y-6">
              {contactInfo.map((info, index) => (
                <div key={index} className="flex items-start">
                  <div className="mr-4 mt-1">
                    {info.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-1">{info.title}</h3>
                    <div className="space-y-1">
                      {info.details.map((detail, idx) => (
                        <p key={idx} className="text-gray-700 dark:text-gray-300">{detail}</p>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{info.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* FAQ Section */}
            <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-gray-800 dark:text-white mb-4">Quick Links</h3>
              <div className="space-y-3">
                <a href="/faq" className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                  <span className="text-blue-600 dark:text-blue-400 font-medium">FAQ Center</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Common questions and answers</p>
                </a>
                <a href="/help" className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                  <span className="text-blue-600 dark:text-blue-400 font-medium">Help Center</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Documentation and guides</p>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form & Departments */}
        <div className="lg:col-span-2 space-y-8">
          {/* Contact Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-4">
                <FaPaperPlane className="text-blue-600 dark:text-blue-400 text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Send Us a Message</h2>
                <p className="text-gray-600 dark:text-gray-400">We'll respond as soon as possible</p>
              </div>
            </div>

            {isSubmitted && (
  <div className="text-center py-12">
    <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
      <FaCheckCircle className="text-green-600 dark:text-green-400 text-3xl" />
    </div>
    <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Message Sent!</h3>
    <p className="text-gray-600 dark:text-gray-400 mb-6">
      Thank you for contacting us. We've received your message and will respond within 24 hours.
    </p>
    {submittedReferenceId && (
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
        <p className="text-gray-800 dark:text-white">
          <strong>Reference ID:</strong> {submittedReferenceId}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Please keep this reference ID for future communication.
        </p>
      </div>
    )}
    <button
      onClick={() => {
        setIsSubmitted(false);
        setSubmittedReferenceId(null);
        setFormData({ name: '', email: '', subject: '', message: '' });
      }}
      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
    >
      Send Another Message
    </button>
  </div>
            )} 
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subject *
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select a subject</option>
                    <option value="account">Account Issues</option>
                    <option value="technical">Technical Support</option>
                    <option value="billing">Billing Questions</option>
                    <option value="feature">Feature Request</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="6"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Please describe your issue or question in detail..."
                  />
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane className="mr-2" />
                        Send Message
                      </>
                    )}
                  </button>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                    * Required fields
                  </p>
                </div>
              </form>
            
          </div>

          {/* Departments */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-8">Contact Specific Departments</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {departments.map((dept, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:border-blue-300 dark:hover:border-blue-700 transition">
                  <h3 className="font-bold text-gray-800 dark:text-white mb-2">{dept.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{dept.description}</p>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <FaEnvelope className="text-gray-400 mr-2 text-sm" />
                      <a 
                        href={`mailto:${dept.email}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                      >
                        {dept.email}
                      </a>
                    </div>
                    <div className="flex items-center">
                      <FaClock className="text-gray-400 mr-2 text-sm" />
                      <span className="text-gray-600 dark:text-gray-400 text-sm">Response: {dept.response}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Social Media */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-8 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0">
                <h3 className="text-2xl font-bold mb-2">Follow Us</h3>
                <p className="text-blue-100">Stay updated with SaveWise news and updates</p>
              </div>
              <div className="flex space-x-4">
                <a href="#" className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center">
                  <span className="font-bold">F</span>
                </a>
                <a href="#" className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center">
                  <span className="font-bold">X</span>
                </a>
                <a href="#" className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center">
                  <span className="font-bold">LI</span>
                </a>
                <a href="#" className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center">
                  <span className="font-bold">IG</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;