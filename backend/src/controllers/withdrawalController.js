import { Withdrawal, SavingPlan, User, PlanMember, Deposit } from '../models/Associations.js';
import { Op } from 'sequelize';
import sequelize from '../models/index.js';

// @desc    Get withdrawals
// @route   GET /api/withdrawals
// @access  Private
export const getWithdrawals = async (req, res) => {
  try {
    const { status, plan_id, page = 1, limit = 20 } = req.query;
    
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (plan_id) {
      where.plan_id = plan_id;
    }

    // Get user's owned plan IDs
    const ownedPlans = await SavingPlan.findAll({
      where: { owner_id: req.userId },
      attributes: ['id']
    });

    // Get user's member plan IDs (including admin status)
    const userMemberships = await PlanMember.findAll({
      where: { user_id: req.userId },
      attributes: ['plan_id', 'is_admin']
    });

    const ownedPlanIds = ownedPlans.map(p => p.id);
    const memberPlanIds = userMemberships.map(p => p.plan_id);
    
    // Combine owned and member plans
    const accessiblePlanIds = [...new Set([...ownedPlanIds, ...memberPlanIds])];

    // If no accessible plans, return empty
    if (accessiblePlanIds.length === 0) {
      return res.json({
        success: true,
        withdrawals: [],
        total: 0,
        totalPages: 0,
        currentPage: parseInt(page)
      });
    }

    // Add plan filter if not already filtered
    if (!where.plan_id && accessiblePlanIds.length > 0) {
      where.plan_id = { [Op.in]: accessiblePlanIds };
    }

    const withdrawals = await Withdrawal.findAndCountAll({
      where,
      include: [
        {
          model: SavingPlan,
          as: 'plan',
          attributes: ['id', 'plan_name', 'owner_id', 'interest_rate'],
          include: [
            {
              model: User,
              as: 'owner',
              attributes: ['id', 'username', 'email']
            },
            {
              model: PlanMember,
              as: 'members',
              attributes: ['user_id', 'is_admin'],
              include: [
                {
                  model: User,
                  as: 'user',
                  attributes: ['id', 'username']
                }
              ]
            }
          ]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['username']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });

    console.log('Withdrawals date response sample:', withdrawals.rows.slice(0, 3).map(w => ({ id: w.id, created_at: w.created_at, createdAt: w.createdAt })));

    res.json({
      success: true,
      withdrawals: withdrawals.rows,
      total: withdrawals.count,
      totalPages: Math.ceil(withdrawals.count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching withdrawals'
    });
  }
};

// @desc    Create withdrawal request
// @route   POST /api/withdrawals
// @access  Private
export const createWithdrawal = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { plan_id, amount, reason } = req.body;
    const userId = req.userId;

    const plan = await SavingPlan.findByPk(plan_id, { transaction });
    if (!plan) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    // Check if user is an active member (or owner)
    const member = await PlanMember.findOne({
      where: { plan_id, user_id: userId, status: 'active' },
      transaction
    });
    if (!member && plan.owner_id !== userId) {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: 'You are not a member of this plan' });
    }

    // Rule 1: Must have deposited at least once
    const totalDeposits = await Deposit.sum('amount', {
      where: { plan_id, user_id: userId },
      transaction
    }) || 0;
    if (totalDeposits <= 0) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'You must make a deposit before withdrawing' });
    }

    // Rule 2: No pending withdrawals
    const pending = await Withdrawal.findOne({
      where: { plan_id, user_id: userId, status: 'pending' },
      transaction
    });
    if (pending) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'You have a pending withdrawal request' });
    }

    // Rule 3: Amount limit = totalDeposits × multiplier
    const multiplier = parseFloat(plan.withdrawal_multiplier) || 1;
    const maxAllowed = totalDeposits * multiplier;
    if (amount > maxAllowed) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Maximum withdrawal allowed is ZMW ${maxAllowed.toFixed(2)} (based on your deposits and plan multiplier)`
      });
    }

    // Create withdrawal
    const withdrawal = await Withdrawal.create({
      plan_id,
      user_id: userId,
      amount: parseFloat(amount),
      reason,
      status: 'pending'
    }, { transaction });

    await transaction.commit();

    res.status(201).json({ success: true, withdrawal });
  } catch (error) {
    await transaction.rollback();
    console.error('Create withdrawal error:', error);
    res.status(500).json({ success: false, message: 'Error creating withdrawal request' });
  }
};

// Update approveWithdrawal function
// @desc    Approve withdrawal
// @route   PUT /api/withdrawals/:id/approve
// @access  Private
export const approveWithdrawal = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const withdrawal = await Withdrawal.findByPk(req.params.id, {
      include: [{
        model: SavingPlan,
        as: 'plan'
      }],
      transaction
    });

    if (!withdrawal) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found'
      });
    }

    const canManageWithdrawals = async (userId, planId) => {
  // Check if user is plan owner
  const plan = await SavingPlan.findByPk(planId);
  if (plan && plan.owner_id === userId) {
    return true;
  }

  // Check if user is admin member
  const adminMembership = await PlanMember.findOne({
    where: {
      plan_id: planId,
      user_id: userId,
      is_admin: true
    }
  });

  return !!adminMembership;
};


const canManage = await canManageWithdrawals(req.userId, withdrawal.plan_id);
if (!canManage) {
  await transaction.rollback();
  return res.status(403).json({
    success: false,
    message: 'Not authorized to approve withdrawals'
  });
}
    // Check if user is plan owner or admin
    const isAdmin = await PlanMember.findOne({
      where: {
        plan_id: withdrawal.plan_id,
        user_id: req.userId,
        is_admin: true
      },
      transaction
    });

    if (!isAdmin && withdrawal.plan.owner_id !== req.userId) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Not authorized to approve withdrawals'
      });
    }

    if (withdrawal.status !== 'pending') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Withdrawal request is not pending'
      });
    }

    // Get plan interest rate
    const interestRate = withdrawal.plan.interest_rate || 0;

    // Approve the withdrawal with interest calculation
    await withdrawal.approve(req.userId, interestRate, transaction);

    await transaction.commit();

    res.json({
      success: true,
      message: 'Withdrawal approved successfully',
      withdrawal: {
        ...withdrawal.toJSON(),
        interest_amount: withdrawal.interest_amount,
        total_amount: withdrawal.total_amount
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Approve withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving withdrawal'
    });
  }
};

// @desc    Reject withdrawal
// @route   PUT /api/withdrawals/:id/reject
// @access  Private
export const rejectWithdrawal = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { rejection_reason } = req.body;
    
    const withdrawal = await Withdrawal.findByPk(req.params.id, {
      include: [{
        model: SavingPlan,
        as: 'plan'
      }],
      transaction
    });

    if (!withdrawal) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found'
      });
    }

    const canManageWithdrawals = async (userId, planId) => {
  // Check if user is plan owner
  const plan = await SavingPlan.findByPk(planId);
  if (plan && plan.owner_id === userId) {
    return true;
  }

  // Check if user is admin member
  const adminMembership = await PlanMember.findOne({
    where: {
      plan_id: planId,
      user_id: userId,
      is_admin: true
    }
  });

  return !!adminMembership;
};

// Then update each function to use this helper:

// In approveWithdrawal:
const canManage = await canManageWithdrawals(req.userId, withdrawal.plan_id);
if (!canManage) {
  await transaction.rollback();
  return res.status(403).json({
    success: false,
    message: 'Not authorized to approve withdrawals'
  });
}


    // Check if user is plan owner or admin
    const isAdmin = await PlanMember.findOne({
      where: {
        plan_id: withdrawal.plan_id,
        user_id: req.userId,
        is_admin: true
      },
      transaction
    });

    if (!isAdmin && withdrawal.plan.owner_id !== req.userId) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject withdrawals'
      });
    }

    if (withdrawal.status !== 'pending') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Withdrawal request is not pending'
      });
    }

    // Reject the withdrawal
    await withdrawal.reject(rejection_reason, transaction);

    await transaction.commit();

    res.json({
      success: true,
      message: 'Withdrawal rejected successfully',
      withdrawal
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Reject withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting withdrawal'
    });
  }
};


// Add mark as paid function
// @desc    Mark withdrawal as paid
// @route   PUT /api/withdrawals/:id/pay
// @access  Private
export const markWithdrawalAsPaid = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const withdrawal = await Withdrawal.findByPk(req.params.id, {
      include: [{
        model: SavingPlan,
        as: 'plan'
      }],
      transaction
    });

    const canManageWithdrawals = async (userId, planId) => {
  // Check if user is plan owner
  const plan = await SavingPlan.findByPk(planId);
  if (plan && plan.owner_id === userId) {
    return true;
  }

  // Check if user is admin member
  const adminMembership = await PlanMember.findOne({
    where: {
      plan_id: planId,
      user_id: userId,
      is_admin: true
    }
  });

  return !!adminMembership;
};

// Then update each function to use this helper:

// In approveWithdrawal:
const canManage = await canManageWithdrawals(req.userId, withdrawal.plan_id);
if (!canManage) {
  await transaction.rollback();
  return res.status(403).json({
    success: false,
    message: 'Not authorized to approve withdrawals'
  });
}

    if (!withdrawal) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found'
      });
    }

    // Check if user is plan owner or admin
    const isAdmin = await PlanMember.findOne({
      where: {
        plan_id: withdrawal.plan_id,
        user_id: req.userId,
        is_admin: true
      },
      transaction
    });

    if (!isAdmin && withdrawal.plan.owner_id !== req.userId) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Not authorized to mark withdrawal as paid'
      });
    }

    if (withdrawal.status !== 'approved') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Withdrawal must be approved first'
      });
    }

    // Mark as paid
    await withdrawal.markAsPaid(transaction);

    await transaction.commit();

    res.json({
      success: true,
      message: 'Withdrawal marked as paid successfully',
      withdrawal
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Mark withdrawal as paid error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking withdrawal as paid'
    });
  }
};
