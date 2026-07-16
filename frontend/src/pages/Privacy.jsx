import React from 'react';
import { Link } from 'react-router-dom';
import { FaLock, FaUserShield, FaDatabase, FaEye, FaShareAlt, FaArrowLeft } from 'react-icons/fa';

const Privacy = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
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
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full mb-6">
            <FaLock className="text-2xl text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Effective date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Our Commitment to Privacy
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              At SaveWise, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
            </p>
          </section>

          {/* Information Collection */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              1. Information We Collect
            </h2>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="mr-4 mt-1">
                  <FaUserShield className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Personal Information</h3>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
                    <li>Name and contact details (email, phone number)</li>
                    <li>Account credentials</li>
                    <li>Profile information and preferences</li>
                    <li>Payment information (processed securely by payment providers)</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mr-4 mt-1">
                  <FaDatabase className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Usage Information</h3>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
                    <li>Device information and IP addresses</li>
                    <li>Browser type and version</li>
                    <li>Pages visited and features used</li>
                    <li>Transaction history and plan participation</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* How We Use Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              2. How We Use Your Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Service Operation</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li>• Account creation and management</li>
                  <li>• Transaction processing</li>
                  <li>• Plan administration</li>
                  <li>• Customer support</li>
                </ul>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Improvement & Security</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li>• Platform optimization</li>
                  <li>• Fraud prevention</li>
                  <li>• Security monitoring</li>
                  <li>• Analytics and reporting</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Information Sharing */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              3. Information Sharing
            </h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="mr-4 mt-1">
                  <FaEye className="text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Within Your Saving Plans</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Other members of your saving plans can see your name and profile information. Financial details within a plan are visible to plan administrators and may be visible to other members based on plan settings.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mr-4 mt-1">
                  <FaShareAlt className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Third-Party Sharing</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    We do not sell your personal information. We may share information with:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700 dark:text-gray-300">
                    <li>Payment processors (for transaction completion)</li>
                    <li>Legal authorities (when required by law)</li>
                    <li>Service providers (for platform operation)</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              4. Data Security
            </h2>
            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We implement industry-standard security measures to protect your information:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-2">
                    <FaLock className="text-green-600 dark:text-green-400" />
                  </div>
                  <p className="font-medium text-gray-800 dark:text-white">Encryption</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">End-to-end data encryption</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-2">
                    <FaUserShield className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="font-medium text-gray-800 dark:text-white">Access Control</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Strict authentication protocols</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-2">
                    <FaDatabase className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="font-medium text-gray-800 dark:text-white">Regular Audits</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Security monitoring & testing</p>
                </div>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              5. Your Privacy Rights
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-800 dark:text-white">Right to Access</span>
                <span className="text-sm text-green-600 dark:text-green-400">✓ Available</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-800 dark:text-white">Right to Correction</span>
                <span className="text-sm text-green-600 dark:text-green-400">✓ Available</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-800 dark:text-white">Right to Deletion</span>
                <span className="text-sm text-yellow-600 dark:text-yellow-400">※ With limitations</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-800 dark:text-white">Data Portability</span>
                <span className="text-sm text-green-600 dark:text-green-400">✓ Available</span>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="pt-8 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Privacy Questions?
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              If you have questions about our Privacy Policy or your data, contact our Privacy Team:
            </p>
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-gray-800 dark:text-white">Email: privacy@savewise.com</p>
              <p className="text-gray-800 dark:text-white mt-1">Phone: +1 (555) 123-4567</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                Data Protection Officer: John Smith
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;