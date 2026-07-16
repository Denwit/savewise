import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { planService } from '../services/api';
import { FaArrowLeft, FaSave, FaTimes } from 'react-icons/fa';

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

const EditPlan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    plan_name: '',
    description: '',
    frequency: 'weekly',
    target_amount: '',
    max_members: 1,
    interest_rate: '0',
    is_fixed_amount: true,
    fixed_amount: '',
    start_date: '',
    end_date: ''
  });

  const inferredCycle = useMemo(
    () => getCycleFromDates(formData.start_date, formData.end_date),
    [formData.start_date, formData.end_date]
  );

  useEffect(() => {
    fetchPlan();
  }, [id]);

  const fetchPlan = async () => {
    try {
      setLoading(true);
      const response = await planService.getPlan(id);
      if (response.data.success) {
        const plan = response.data.plan;
        setFormData({
          plan_name: plan.plan_name,
          description: plan.description || '',
          frequency: plan.frequency,
          target_amount: plan.target_amount,
          max_members: plan.max_members,
          interest_rate: plan.interest_rate,
          is_fixed_amount: plan.is_fixed_amount,
          fixed_amount: plan.fixed_amount || '',
          start_date: plan.start_date,
          end_date: plan.end_date
        });
      }
    } catch (error) {
      toast.error('Failed to load plan');
      navigate('/plans');
    } finally {
      setLoading(false);
    }
  };

  const setField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!inferredCycle) {
      toast.error('End date must be after start date');
      return;
    }

    setSaving(true);

    try {
      const response = await planService.updatePlan(id, {
        ...formData,
        cycle: inferredCycle,
        target_amount: parseFloat(formData.target_amount),
        max_members: parseInt(formData.max_members),
        interest_rate: parseFloat(formData.interest_rate),
        fixed_amount: formData.is_fixed_amount ? parseFloat(formData.fixed_amount) : null
      });

      if (response.data.success) {
        toast.success('Plan updated successfully');
        navigate(`/plans/${id}`);
      }
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Failed to update plan';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <FaArrowLeft className="mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Edit Plan</h1>
          <p className="text-gray-600 mt-2">Update your saving plan details</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Plan Name *</label>
              <input
                type="text"
                value={formData.plan_name}
                onChange={(e) => setField('plan_name', e.target.value)}
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
                  value={formData.target_amount}
                  onChange={(e) => setField('target_amount', e.target.value)}
                  required
                  min="0"
                  step="0.01"
                  className="input-field pl-16"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setField('description', e.target.value)}
                rows="3"
                className="input-field"
                placeholder="Describe your saving goal..."
              />
            </div>

            <div>
              <label className="label">Frequency *</label>
              <select
                value={formData.frequency}
                onChange={(e) => setField('frequency', e.target.value)}
                className="input-field"
              >
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="label">Cycle</label>
              <div className="input-field bg-gray-50 text-gray-700 flex items-center">
                {inferredCycle || 'Select valid dates'}
              </div>
              <p className="text-sm text-gray-500 mt-2">Calculated from start and end dates.</p>
            </div>

            <div>
              <label className="label">Start Date *</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setField('start_date', e.target.value)}
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="label">End Date *</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setField('end_date', e.target.value)}
                required
                min={formData.start_date || undefined}
                className="input-field"
              />
            </div>

            <div>
              <label className="label">Maximum Members</label>
              <input
                type="number"
                value={formData.max_members}
                onChange={(e) => setField('max_members', e.target.value)}
                min="1"
                className="input-field"
              />
            </div>

            <div>
              <label className="label">Interest Rate (%)</label>
              <input
                type="number"
                value={formData.interest_rate}
                onChange={(e) => setField('interest_rate', e.target.value)}
                min="0"
                max="100"
                step="0.01"
                className="input-field"
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={formData.is_fixed_amount}
                    onChange={() => setField('is_fixed_amount', true)}
                    className="mr-2"
                  />
                  Fixed amount per deposit
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!formData.is_fixed_amount}
                    onChange={() => setField('is_fixed_amount', false)}
                    className="mr-2"
                  />
                  Variable amount per deposit
                </label>
              </div>
            </div>

            {formData.is_fixed_amount && (
              <div>
                <label className="label">Fixed Amount (ZMW)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">ZMW</span>
                  </div>
                  <input
                    type="number"
                    value={formData.fixed_amount}
                    onChange={(e) => setField('fixed_amount', e.target.value)}
                    min="0"
                    step="0.01"
                    className="input-field pl-16"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate(`/plans/${id}`)}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
            >
              <FaTimes className="mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !inferredCycle}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50"
            >
              <FaSave className="mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPlan;