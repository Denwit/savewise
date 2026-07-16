import React from 'react';
import { Link } from 'react-router-dom';
import { FaBalanceScale, FaShieldAlt, FaGavel, FaArrowLeft } from 'react-icons/fa';

const Terms = () => {
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-6">
            <FaGavel className="text-2xl text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
            Terms and Conditions
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Welcome to SaveWise
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              These Terms and Conditions govern your use of the SaveWise platform. By accessing or using our service, you agree to be bound by these terms.
            </p>
          </section>

          {/* Eligibility */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              1. Eligibility
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>You must be at least 18 years old to use SaveWise</li>
              <li>You must provide accurate and complete information during registration</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You agree not to share your account credentials with others</li>
            </ul>
          </section>

          {/* Service Usage */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              2. Service Usage
            </h2>
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">2.1 Saving Plans</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  SaveWise facilitates group savings plans. Each plan is managed by its owner, who has administrative privileges. SaveWise acts as a platform facilitator, not as a financial institution.
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">2.2 Financial Responsibilities</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Users are solely responsible for all financial transactions made through the platform. SaveWise does not hold funds, guarantee returns, or provide financial advice.
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">2.3 Prohibited Activities</h3>
                <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
                  <li>Money laundering or illegal financial activities</li>
                  <li>Fraudulent behavior or misrepresentation</li>
                  <li>Harassment of other users</li>
                  <li>Creating plans for illegal purposes</li>
                  <li>Circumventing security measures</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Financial Terms */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              3. Financial Terms
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  <FaBalanceScale className="text-blue-600 dark:text-blue-400 mr-3" />
                  <h3 className="font-semibold text-gray-800 dark:text-white">Deposits</h3>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  All deposits are voluntary and made at your own discretion. Deposit schedules and amounts are determined by each saving plan's rules.
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  <FaShieldAlt className="text-green-600 dark:text-green-400 mr-3" />
                  <h3 className="font-semibold text-gray-800 dark:text-white">Withdrawals</h3>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  Withdrawal requests must be approved by plan administrators. Processing times may vary. Interest payments are calculated based on plan settings.
                </p>
              </div>
            </div>
          </section>

          {/* Liability */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              4. Liability and Disclaimers
            </h2>
            <div className="space-y-4">
              <div className="border-l-4 border-yellow-500 pl-4 py-2">
                <p className="text-gray-700 dark:text-gray-300 italic">
                  SaveWise provides a platform for group savings but does not guarantee the financial performance, safety, or legality of individual saving plans.
                </p>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                We are not responsible for disputes between plan members, failed transactions due to bank issues, or losses incurred from saving plan activities.
              </p>
            </div>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              5. Changes to Terms
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.
            </p>
          </section>

          {/* Contact Information */}
          <section className="pt-8 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Contact for Questions
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              If you have any questions about these Terms and Conditions, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-gray-800 dark:text-white">Email: legal@savewise.com</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                We typically respond within 24-48 hours on business days.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;