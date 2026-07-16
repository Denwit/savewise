import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { planService } from '../services/api';
import {
  FaCalendarAlt,
  FaUsers,
  FaMoneyBillWave,
  FaChartLine,
  FaInfoCircle
} from 'react-icons/fa';

const toDateInputValue = (date) => date.toISOString().split('T')[0];

const getCycleFromDates = (startDate, endDate) => {
  if (!startDate || !endDate) return '';
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return '';

  const wholeMonths = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
  const anchor = new Date(start);
  anchor.setMonth(anchor.getMonth() + wholeMonths);
  const months = Math.max(wholeMonths + (anchor < end ? 1 : 0), 1);
  return `${months} ${months === 1 ? 'month' : 'months'}`;
};

const CreatePlan = () => {
  const navigate = useNavigate();
  const today = toDateInputValue(new Date());
  const defaultEndDate = toDateInputValue(new Date(new Date().setMonth(new Date().getMonth() + 2)));
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    plan_name: '',
    description: '',
    frequency: 'weekly',
    target_amount: '',
    max_members: 1,
    interest_rate: '0',
    is_fixed_amount: true,
    fixed_amount: '',
    start_date: today,
    end_date: defaultEndDate
  });

  const inferredCycle = useMemo(
    () => getCycleFromDates(formData.start_date, formData.end_date),
    [formData.start_date, formData.end_date]
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!inferredCycle) {
      toast.error('End date must be after start date');
      return;
    }

    setLoading(true);

    try {
      const planData = {
        ...formData,
        cycle: inferredCycle,
        target_amount: parseFloat(formData.target_amount),
        max_members: parseInt(formData.max_members),
        interest_rate: parseFloat(formData.interest_rate),
        fixed_amount: formData.is_fixed_amount ? parseFloat(formData.fixed_amount) : null
      };

      const response = await planService.createPlan(planData);

      if (response.data.success) {
        toast.success('Saving plan created successfully!');
        navigate(`/plans/${response.data.plan.id}`);
      }
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Failed to create plan';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const frequencyOptions = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'bi-weekly', label: 'Bi-weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Create New Saving Plan</h1>
        <p className="text-gray-600">Set up a new saving plan with your preferred terms and goals.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <FaChartLine className="mr-3" />
            Plan Details
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FaInfoCircle className="mr-2 text-blue-500" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Plan Name *</label>
                  <input
                    type="text"
                    name="plan_name"
                    value={formData.plan_name}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="e.g., Emergency Fund"
                  />
                </div>

                <div>
                  <label className="label">Target Amount (ZMW) *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">ZMW</span>
                    </div>
                    <input
                      type="number"
                      name="target_amount"
                      value={formData.target_amount}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      className="input-field pl-16"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="label">Description (Optional)</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="input-field"
                    placeholder="Describe your saving goal..."
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FaCalendarAlt className="mr-2 text-blue-500" />
                Schedule Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="label">Frequency *</label>
                  <select
                    name="frequency"
                    value={formData.frequency}
                    onChange={handleChange}
                    className="input-field"
                  >
                    {frequencyOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Start Date *</label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    required
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">End Date *</label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                    required
                    min={formData.start_date || undefined}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Cycle</label>
                  <div className="input-field bg-gray-50 text-gray-700 flex items-center">
                    {inferredCycle || 'Select valid dates'}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Calculated from start and end dates.</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FaMoneyBillWave className="mr-2 text-blue-500" />
                Deposit Settings
              </h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="fixed_amount"
                    name="deposit_type"
                    checked={formData.is_fixed_amount}
                    onChange={() => setFormData({...formData, is_fixed_amount: true})}
                    className="h-4 w-4 text-blue-600"
                  />
                  <label htmlFor="fixed_amount" className="ml-2 text-gray-700">
                    Fixed amount per deposit
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="radio"
                    id="variable_amount"
                    name="deposit_type"
                    checked={!formData.is_fixed_amount}
                    onChange={() => setFormData({...formData, is_fixed_amount: false})}
                    className="h-4 w-4 text-blue-600"
                  />
                  <label htmlFor="variable_amount" className="ml-2 text-gray-700">
                    Variable amount per deposit
                  </label>
                </div>

                {formData.is_fixed_amount && (
                  <div className="ml-6">
                    <label className="label">Fixed Amount (ZMW)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">ZMW</span>
                      </div>
                      <input
                        type="number"
                        name="fixed_amount"
                        value={formData.fixed_amount}
                        onChange={handleChange}
                        required={formData.is_fixed_amount}
                        min="0"
                        step="0.01"
                        className="input-field pl-16"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FaUsers className="mr-2 text-blue-500" />
                Advanced Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Maximum Members</label>
                  <input
                    type="number"
                    name="max_members"
                    value={formData.max_members}
                    onChange={handleChange}
                    min="1"
                    className="input-field"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Maximum number of members allowed (including you)
                  </p>
                </div>

                <div>
                  <label className="label">Interest Rate (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      name="interest_rate"
                      value={formData.interest_rate}
                      onChange={handleChange}
                      min="0"
                      max="100"
                      step="0.01"
                      className="input-field pr-12"
                      placeholder="0.00"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">%</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    For borrowed amounts (0% for no interest)
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Plan Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan Name:</span>
                  <span className="font-medium">{formData.plan_name || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Frequency:</span>
                  <span className="font-medium">
                    {frequencyOptions.find(f => f.value === formData.frequency)?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cycle:</span>
                  <span className="font-medium">{inferredCycle || 'Select valid dates'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Target Amount:</span>
                  <span className="font-medium">
                    ZMW {parseFloat(formData.target_amount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">
                    {formData.start_date} to {formData.end_date}
                  </span>
                </div>
                {formData.is_fixed_amount && formData.fixed_amount && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fixed Deposit:</span>
                    <span className="font-medium">
                      ZMW {parseFloat(formData.fixed_amount).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/plans')}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !inferredCycle}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? 'Creating Plan...' : 'Create Saving Plan'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePlan;