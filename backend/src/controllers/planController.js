import { SavingPlan, PlanMember, Deposit, User } from '../models/Associations.js';
import moment from 'moment';
import { Op } from 'sequelize';

const inferCycleFromDates = (startDate, endDate) => {
  const start = moment(startDate, 'YYYY-MM-DD', true);
  const end = moment(endDate, 'YYYY-MM-DD', true);

  if (!start.isValid() || !end.isValid() || !end.isAfter(start, 'day')) {
    throw new Error('End date must be after start date');
  }

  const wholeMonths = end.diff(start, 'months');
  const roundedMonths = start.clone().add(wholeMonths, 'months').isBefore(end, 'day')
    ? wholeMonths + 1
    : wholeMonths;
  const months = Math.max(roundedMonths, 1);

  return months + ' ' + (months === 1 ? 'month' : 'months');
};


const attachPlanRelations = async (plans) => {
  const planRows = plans.map((plan) => plan.toJSON ? plan.toJSON() : plan);
  const planIds = planRows.map((plan) => plan.id);

  if (planIds.length === 0) return [];

  const [members, deposits] = await Promise.all([
    PlanMember.findAll({ where: { plan_id: { [Op.in]: planIds } }, raw: true }),
    Deposit.findAll({ where: { plan_id: { [Op.in]: planIds } }, raw: true })
  ]);

  const userIds = [...new Set([...members.map((member) => member.user_id), ...deposits.map((deposit) => deposit.user_id)].filter(Boolean))];
  const users = userIds.length > 0
    ? await User.findAll({ where: { id: { [Op.in]: userIds } }, attributes: ['id', 'username', 'email'], raw: true })
    : [];
  const usersById = new Map(users.map((user) => [user.id, user]));

  return planRows.map((plan) => ({
    ...plan,
    members: members
      .filter((member) => member.plan_id === plan.id)
      .map((member) => ({ ...member, user: usersById.get(member.user_id) || null })),
    deposits: deposits
      .filter((deposit) => deposit.plan_id === plan.id)
      .map((deposit) => ({ ...deposit, user: usersById.get(deposit.user_id) || null }))
  }));
};

const canManagePlan = async (plan, userId) => {
  if (!plan) return false;
  if (plan.owner_id === userId) return true;
  const admin = await PlanMember.findOne({
    where: { plan_id: plan.id, user_id: userId, is_admin: true, status: 'active' },
    raw: true
  });
  return Boolean(admin);
};
// @desc    Create a saving plan
// @route   POST /api/plans
// @access  Private
export const createPlan = async (req, res) => {
  try {
    const {
      plan_name,
      description,
      frequency,
      target_amount,
      max_members,
      interest_rate = 0,
      is_fixed_amount = true,
      fixed_amount,
      start_date,
      end_date
    } = req.body;

    const inferredCycle = inferCycleFromDates(start_date, end_date);

    const plan = await SavingPlan.create({
      owner_id: req.userId,
      plan_name,
      description,
      frequency,
      cycle: inferredCycle,
      target_amount: parseFloat(target_amount),
      max_members: parseInt(max_members),
      interest_rate: parseFloat(interest_rate),
      is_fixed_amount,
      fixed_amount: is_fixed_amount ? parseFloat(fixed_amount) : null,
      start_date,
      end_date,
      currency: 'ZMW',
      status: 'active'
    });

    await PlanMember.create({
      plan_id: plan.id,
      user_id: req.userId,
      is_admin: true,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Saving plan created successfully',
      plan
    });
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating saving plan'
    });
  }
};

// @desc    Get all plans for a user (both owned and joined)
// @route   GET /api/plans
// @access  Private
export const getPlans = async (req, res) => {
  try {
    const memberships = await PlanMember.findAll({
      where: { user_id: req.userId, status: 'active' },
      attributes: ['plan_id', 'is_admin'],
      raw: true
    });

    const membershipByPlanId = new Map(memberships.map((member) => [member.plan_id, member]));
    const accessiblePlanIds = [
      ...new Set(memberships.map((member) => member.plan_id))
    ];

    const plans = await SavingPlan.findAll({
      where: {
        [Op.or]: [
          { owner_id: req.userId },
          ...(accessiblePlanIds.length > 0 ? [{ id: { [Op.in]: accessiblePlanIds } }] : [])
        ]
      },
      order: [['created_at', 'DESC']]
    });

    const plansWithRelations = await attachPlanRelations(plans);
    const formattedPlans = plansWithRelations.map((plan) => {
      const membership = membershipByPlanId.get(plan.id);
      return {
        ...plan,
        role: plan.owner_id === req.userId ? 'owner' : membership?.is_admin ? 'admin' : 'member',
        is_admin: plan.owner_id === req.userId || Boolean(membership?.is_admin),
        can_manage: plan.owner_id === req.userId || Boolean(membership?.is_admin)
      };
    });

    res.json({
      success: true,
      count: formattedPlans.length,
      plans: formattedPlans
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching plans'
    });
  }
};

// @desc    Get single plan
// @route   GET /api/plans/:id
// @access  Private
export const getPlan = async (req, res) => {
  try {
    const planId = Number(req.params.id);

    if (!Number.isInteger(planId) || planId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan id'
      });
    }

    const plan = await SavingPlan.findByPk(planId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    const isOwner = plan.owner_id === req.userId;
    const membership = await PlanMember.findOne({
      where: { plan_id: plan.id, user_id: req.userId, status: 'active' },
      raw: true
    });

    if (!isOwner && !membership) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this plan'
      });
    }

    const [planWithRelations] = await attachPlanRelations([plan]);
    const totalDeposits = planWithRelations.deposits.reduce((sum, deposit) => {
      return sum + parseFloat(deposit.amount || 0);
    }, 0);
    const targetAmount = parseFloat(planWithRelations.target_amount || 0);
    const progress = targetAmount > 0 ? (totalDeposits / targetAmount) * 100 : 0;

    res.json({
      success: true,
      plan: {
        ...planWithRelations,
        role: isOwner ? 'owner' : membership?.is_admin ? 'admin' : 'member',
        is_admin: isOwner || Boolean(membership?.is_admin),
        can_manage: isOwner || Boolean(membership?.is_admin),
        progress: Math.min(100, progress).toFixed(2),
        total_deposits: totalDeposits
      }
    });
  } catch (error) {
    console.error('Get plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching plan'
    });
  }
};

// @desc    Update plan
// @route   PUT /api/plans/:id
// @access  Private
export const updatePlan = async (req, res) => {
  try {
    const plan = await SavingPlan.findByPk(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    if (!await canManagePlan(plan, req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this plan'
      });
    }

    const updates = { ...req.body };
    const nextStartDate = updates.start_date || plan.start_date;
    const nextEndDate = updates.end_date || plan.end_date;

    if (nextStartDate && nextEndDate) {
      updates.cycle = inferCycleFromDates(nextStartDate, nextEndDate);
    }

    await plan.update(updates);

    res.json({
      success: true,
      message: 'Plan updated successfully',
      plan
    });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating plan'
    });
  }
};

// @desc    Delete plan
// @route   DELETE /api/plans/:id
// @access  Private
export const deletePlan = async (req, res) => {
  try {
    const plan = await SavingPlan.findByPk(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Check if user is owner
    if (!await canManagePlan(plan, req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this plan'
      });
    }

    await plan.destroy();

    res.json({
      success: true,
      message: 'Plan deleted successfully'
    });
  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting plan'
    });
  }
};

// @desc    Get dashboard statistics (including plans where user is member)
// @route   GET /api/plans/dashboard/stats
// @access  Private
export const getDashboardStats = async (req, res) => {
  try {
    // Get owned plans
    const ownedPlans = await SavingPlan.findAll({
      where: { owner_id: req.userId },
      include: [{
        model: Deposit,
        as: 'deposits'
      }]
    });

    // Get plans where user is an active member
    const memberPlans = await SavingPlan.findAll({
      include: [
        {
          model: PlanMember,
          as: 'members',
          where: {
            user_id: req.userId,
            status: 'active'
          },
          required: true
        },
        {
          model: Deposit,
          as: 'deposits'
        }
      ]
    });

    // Combine all plans (remove duplicates if any)
    const allPlanIds = new Set();
    const allPlans = [];

    ownedPlans.forEach(plan => {
      allPlanIds.add(plan.id);
      allPlans.push(plan);
    });

    memberPlans.forEach(plan => {
      if (!allPlanIds.has(plan.id)) {
        allPlanIds.add(plan.id);
        allPlans.push(plan);
      }
    });

    // Calculate statistics from all plans
    const totalPlans = allPlans.length;
    let totalSavings = 0;
    let totalTarget = 0;
    let activePlans = 0;
    const recentDeposits = [];

    allPlans.forEach(plan => {
      if (plan.status === 'active') activePlans++;
      
      const planDeposits = plan.deposits || [];
      const planTotal = planDeposits.reduce((sum, deposit) => {
        return sum + parseFloat(deposit.amount);
      }, 0);
      
      totalSavings += planTotal;
      totalTarget += parseFloat(plan.target_amount);
      
      // Get recent deposits
      planDeposits.slice(0, 5).forEach(deposit => {
        recentDeposits.push({
          plan_name: plan.plan_name,
          plan_id: plan.id,
          amount: deposit.amount,
          deposit_date: deposit.deposit_date,
          status: deposit.status
        });
      });
    });

    // Sort recent deposits by date
    recentDeposits.sort((a, b) => new Date(b.deposit_date) - new Date(a.deposit_date));

    const progress = totalTarget > 0 ? (totalSavings / totalTarget) * 100 : 0;

    res.json({
      success: true,
      stats: {
        total_plans: totalPlans,
        active_plans: activePlans,
        total_savings: totalSavings,
        total_target: totalTarget,
        progress: progress.toFixed(2)
      },
      recent_deposits: recentDeposits.slice(0, 5)
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics'
    });
  }
};

// @desc    Update plan settings
// @route   PUT /api/plans/:id/settings
// @access  Private
export const updatePlanSettings = async (req, res) => {
  try {
    const plan = await SavingPlan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    if (!await canManagePlan(plan, req.userId)) return res.status(403).json({ success: false, message: 'Not authorized' });

    const {
      allow_early_withdrawals,
      auto_approval,
      reminder_settings,
      interest_rate,
      withdrawal_multiplier,
      status
    } = req.body;

    const updates = {};
    if (allow_early_withdrawals !== undefined) updates.allow_early_withdrawals = allow_early_withdrawals;
    if (auto_approval !== undefined) updates.auto_approval = auto_approval;
    if (reminder_settings !== undefined) updates.reminder_settings = reminder_settings;
    if (interest_rate !== undefined) updates.interest_rate = interest_rate;
    if (withdrawal_multiplier !== undefined) updates.withdrawal_multiplier = withdrawal_multiplier;
    if (status !== undefined) updates.status = status;

    await plan.update(updates);
    res.json({ success: true, message: 'Settings updated', plan });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error updating settings' });
  }
};

export const getUserPlanDetails = async (req, res) => {
  try {
    const plan = await SavingPlan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    const totalDeposits = await Deposit.sum('amount', {
      where: { plan_id: plan.id, user_id: req.userId }
    }) || 0;

    res.json({ success: true, plan, totalDeposits });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error' });
  }
};




