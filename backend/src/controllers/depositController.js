import { Deposit, SavingPlan, Notification, PlanMember, User, Withdrawal } from '../models/Associations.js';
import { Op } from 'sequelize';
import moment from 'moment';
import sequelize from '../models/index.js';

// Helper to send notification
const sendNotification = async (userId, title, message, type = 'info', link = null) => {
  try {
    await Notification.create({ user_id: userId, title, message, type, link });
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
};

// @desc    Create deposit (with auto-repayment and approval)
// @route   POST /api/deposits
export const createDeposit = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { plan_id, amount, deposit_date, notes } = req.body;
    const userId = req.userId;

    // Check plan exists and get its settings
    const plan = await SavingPlan.findByPk(plan_id, { transaction });
    if (!plan) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    // Check membership
    const isMember = await PlanMember.findOne({
      where: { plan_id, user_id: userId, status: 'active' },
      transaction
    });
    if (!isMember && plan.owner_id !== userId) {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: 'Not a member of this plan' });
    }

    let depositAmount = parseFloat(amount);
    let remainingDeposit = depositAmount;
    let repaymentDetails = [];

    // 1. Find outstanding withdrawals (approved, not fully repaid) for this user in this plan
    const outstandingWithdrawals = await Withdrawal.findAll({
      where: {
        plan_id,
        user_id: userId,
        status: 'approved',
        repaid_amount: { [Op.lt]: sequelize.col('total_amount') }
      },
      order: [['approved_at', 'ASC']],
      transaction
    });

    // 2. Repay oldest withdrawals first (manual update)
    for (const w of outstandingWithdrawals) {
      if (remainingDeposit <= 0) break;
      
      const total = parseFloat(w.total_amount);
      const repaid = parseFloat(w.repaid_amount);
      const remaining = total - repaid;
      const repayAmount = Math.min(remaining, remainingDeposit);

      // Update withdrawal fields
      w.repaid_amount = repaid + repayAmount;
      if (w.repaid_amount >= total) {
        w.status = 'paid';
        w.paid_at = new Date();
      }
      await w.save({ transaction });

      repaymentDetails.push({ withdrawal_id: w.id, amount: repayAmount });
      remainingDeposit -= repayAmount;

      // Send notification to user
      await sendNotification(
        userId,
        'Deposit Deduction',
        `ZMW ${repayAmount.toFixed(2)} was deducted from your deposit to repay your withdrawal from plan "${plan.plan_name}".`,
        'success',
        `/plans/${plan_id}`
      );
    }

    // 3. Determine deposit status based on auto_approval
    let status = plan.auto_approval ? 'completed' : 'pending';
    let approved_by = null;
    let approved_at = null;

    if (status === 'completed') {
      approved_by = userId;
      approved_at = new Date();
    }

    // 4. Create the deposit (only the remaining amount goes into savings)
    const deposit = await Deposit.create({
      plan_id,
      user_id: userId,
      amount: remainingDeposit, // amount that actually increases savings
      original_amount: depositAmount,
      deposit_date: deposit_date || moment().format('YYYY-MM-DD'),
      status,
      notes,
      repayment_details: repaymentDetails.length ? repaymentDetails : null,
      approved_by,
      approved_at
    }, { transaction });

    // 5. Notify plan owner/admins if deposit needs approval
    if (status === 'pending') {
      const admins = await PlanMember.findAll({
        where: { plan_id, is_admin: true, status: 'active' },
        attributes: ['user_id'],
        transaction
      });
      const adminIds = admins.map(a => a.user_id);
      if (!adminIds.includes(plan.owner_id)) adminIds.push(plan.owner_id);

      for (const adminId of adminIds) {
        await sendNotification(
          adminId,
          'Deposit Pending Approval',
          `A deposit of ZMW ${depositAmount.toFixed(2)} by ${req.user?.username || 'a member'} in plan "${plan.plan_name}" requires your approval.`,
          'warning',
          `/plans/${plan_id}?tab=deposits`
        );
      }
    } else {
      await sendNotification(
        userId,
        'Deposited',
        repaymentDetails.length
          ? `Deposited ZMW ${depositAmount.toFixed(2)} to plan "${plan.plan_name}". ZMW ${(depositAmount - remainingDeposit).toFixed(2)} was deducted for withdrawal repayment.`
          : `Deposited ZMW ${depositAmount.toFixed(2)} to plan "${plan.plan_name}".`,
        'success',
        `/plans/${plan_id}`
      );
    }

    await transaction.commit();

    const createdDeposit = await Deposit.findByPk(deposit.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'email'] },
        { model: SavingPlan, as: 'plan', attributes: ['id', 'plan_name'] }
      ]
    });

    res.status(201).json({ success: true, deposit: createdDeposit });
  } catch (error) {
    await transaction.rollback();
    console.error('Create deposit error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error recording deposit' });
  }
};

// @desc    Approve a pending deposit (admin only)
// @route   PUT /api/deposits/:id/approve
export const approveDeposit = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const deposit = await Deposit.findByPk(req.params.id, {
      include: [{ model: SavingPlan, as: 'plan' }],
      transaction
    });
    if (!deposit) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Deposit not found' });
    }
    if (deposit.status !== 'pending') {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Deposit is not pending' });
    }

    // Check if user can approve (owner or admin)
    const plan = deposit.plan;
    const isAdmin = await PlanMember.findOne({
      where: { plan_id: deposit.plan_id, user_id: req.userId, is_admin: true, status: 'active' },
      transaction
    });
    if (plan.owner_id !== req.userId && !isAdmin) {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: 'Not authorized to approve deposits' });
    }

    deposit.status = 'completed';
    deposit.approved_by = req.userId;
    deposit.approved_at = new Date();
    await deposit.save({ transaction });

    // Notify the depositor
    await sendNotification(
      deposit.user_id,
      'Deposit Approved',
      `Your deposit of ZMW ${deposit.original_amount} to plan "${plan.plan_name}" has been approved.`,
      'success',
      `/plans/${deposit.plan_id}`
    );

    await transaction.commit();

    res.json({ success: true, deposit });
  } catch (error) {
    await transaction.rollback();
    console.error('Approve deposit error:', error);
    res.status(500).json({ success: false, message: 'Error approving deposit' });
  }
};

// @desc    Reject a pending deposit (admin only)
// @route   PUT /api/deposits/:id/reject
export const rejectDeposit = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { rejection_reason } = req.body;
    const deposit = await Deposit.findByPk(req.params.id, {
      include: [{ model: SavingPlan, as: 'plan' }],
      transaction
    });
    if (!deposit) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Deposit not found' });
    }
    if (deposit.status !== 'pending') {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Deposit is not pending' });
    }

    const plan = deposit.plan;
    const isAdmin = await PlanMember.findOne({
      where: { plan_id: deposit.plan_id, user_id: req.userId, is_admin: true, status: 'active' },
      transaction
    });
    if (plan.owner_id !== req.userId && !isAdmin) {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: 'Not authorized to reject deposits' });
    }

    deposit.status = 'rejected';
    deposit.rejection_reason = rejection_reason || 'No reason provided';
    deposit.approved_by = req.userId; // track who rejected
    deposit.approved_at = new Date(); // optional
    await deposit.save({ transaction });

    // Notify the depositor
    await sendNotification(
      deposit.user_id,
      'Deposit Rejected',
      `Your deposit of ZMW ${deposit.original_amount} to plan "${plan.plan_name}" was rejected. Reason: ${deposit.rejection_reason}`,
      'error',
      `/plans/${deposit.plan_id}`
    );

    await transaction.commit();

    res.json({ success: true, deposit });
  } catch (error) {
    await transaction.rollback();
    console.error('Reject deposit error:', error);
    res.status(500).json({ success: false, message: 'Error rejecting deposit' });
  }
};

// @desc    Get plan deposits (includes repayment details)
// @route   GET /api/deposits/plan/:planId
export const getPlanDeposits = async (req, res) => {
  try {
    const { planId } = req.params;
    const plan = await SavingPlan.findByPk(planId);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    const isMember = await PlanMember.findOne({ where: { plan_id: planId, user_id: req.userId, status: 'active' } });
    if (!isMember && plan.owner_id !== req.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const deposits = await Deposit.findAll({
      where: { plan_id: planId },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'email'] },
        { model: SavingPlan, as: 'plan', attributes: ['id', 'plan_name', 'owner_id'] }
      ],
      order: [['deposit_date', 'DESC'], ['created_at', 'DESC']]
    });

    res.json({ success: true, deposits });
  } catch (error) {
    console.error('Get plan deposits error:', error);
    res.status(500).json({ success: false, message: 'Error fetching deposits' });
  }
};

// @desc    Get my deposits (all plans) with repayment info
// @route   GET /api/deposits/my-deposits
export const getMyDeposits = async (req, res) => {
  try {
    const userId = req.userId;
    const planMemberships = await PlanMember.findAll({
      where: { user_id: userId, status: 'active' },
      attributes: ['plan_id']
    });
    const ownedPlans = await SavingPlan.findAll({
      where: { owner_id: userId },
      attributes: ['id']
    });
    const planIds = [...new Set([...planMemberships.map(m => m.plan_id), ...ownedPlans.map(p => p.id)])];

    if (planIds.length === 0) {
      return res.json({ success: true, deposits: [] });
    }

    const deposits = await Deposit.findAll({
      where: { plan_id: { [Op.in]: planIds } },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'email'] },
        { model: SavingPlan, as: 'plan', attributes: ['id', 'plan_name', 'owner_id'] }
      ],
      order: [['deposit_date', 'DESC'], ['created_at', 'DESC']]
    });

    // Enrich with metadata
    const enriched = deposits.map(d => ({
      ...d.toJSON(),
      is_mine: d.user_id === userId,
      is_plan_owner: d.plan.owner_id === userId,
      can_approve: (d.plan.owner_id === userId || d.plan.members?.some(m => m.user_id === userId && m.is_admin)) && d.status === 'pending'
    }));

    res.json({ success: true, deposits: enriched });
  } catch (error) {
    console.error('Get my deposits error:', error);
    res.status(500).json({ success: false, message: 'Error fetching deposits' });
  }
};

// @desc    Get all deposits (for admin view)
// @route   GET /api/deposits/all
// @access  Private/Admin
export const getAllDeposits = async (req, res) => {
  try {
    const deposits = await Deposit.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        },
        {
          model: SavingPlan,
          as: 'plan',
          attributes: ['id', 'plan_name', 'owner_id'],
          include: [{
            model: User,
            as: 'owner',
            attributes: ['id', 'username']
          }]
        }
      ],
      order: [['deposit_date', 'DESC']]
    });

    res.json({
      success: true,
      count: deposits.length,
      deposits
    });
  } catch (error) {
    console.error('Get all deposits error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching all deposits'
    });
  }
};

// @desc    Get single deposit by ID
// @route   GET /api/deposits/:id
// @access  Private
export const getDepositById = async (req, res) => {
  try {
    const deposit = await Deposit.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        },
        {
          model: SavingPlan,
          as: 'plan',
          attributes: ['id', 'plan_name', 'owner_id', 'description'],
          include: [{
            model: User,
            as: 'owner',
            attributes: ['id', 'username']
          }]
        }
      ]
    });

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: 'Deposit not found'
      });
    }

    // Check if user can view this deposit
    const planMember = await PlanMember.findOne({
      where: {
        plan_id: deposit.plan_id,
        user_id: req.userId,
        status: 'active'
      }
    });

    const canView = deposit.user_id === req.userId || 
                   deposit.plan.owner_id === req.userId ||
                   planMember;

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this deposit'
      });
    }

    res.json({
      success: true,
      deposit: {
        ...deposit.toJSON(),
        is_mine: deposit.user_id === req.userId,
        is_plan_owner: deposit.plan.owner_id === req.userId
      }
    });
  } catch (error) {
    console.error('Get deposit by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching deposit'
    });
  }
};

// @desc    Update deposit
// @route   PUT /api/deposits/:id
// @access  Private
export const updateDeposit = async (req, res) => {
  try {
    const deposit = await Deposit.findByPk(req.params.id, {
      include: [{
        model: SavingPlan,
        as: 'plan',
        attributes: ['id', 'plan_name', 'owner_id']
      }]
    });

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: 'Deposit not found'
      });
    }

    // Check if user can edit this deposit
    const canEdit = deposit.user_id === req.userId || 
                   deposit.plan.owner_id === req.userId;

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this deposit'
      });
    }

    // Prepare update data
    const updateData = { ...req.body };
    
    // Convert amount to float if provided
    if (updateData.amount) {
      updateData.amount = parseFloat(updateData.amount);
    }

    // Update deposit date format if provided
    if (updateData.deposit_date) {
      updateData.deposit_date = moment(updateData.deposit_date).format('YYYY-MM-DD');
    }

    // Update deposit
    await deposit.update(updateData);

    // Fetch updated deposit with relationships
    const updatedDeposit = await Deposit.findByPk(deposit.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        },
        {
          model: SavingPlan,
          as: 'plan',
          attributes: ['id', 'plan_name']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Deposit updated successfully',
      deposit: updatedDeposit
    });
  } catch (error) {
    console.error('Update deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating deposit'
    });
  }
};

// @desc    Delete deposit
// @route   DELETE /api/deposits/:id
// @access  Private
export const deleteDeposit = async (req, res) => {
  try {
    const deposit = await Deposit.findByPk(req.params.id, {
      include: [{
        model: SavingPlan,
        as: 'plan',
        attributes: ['id', 'plan_name', 'owner_id']
      }]
    });

    if (!deposit) {
      return res.status(404).json({ success: false, message: 'Deposit not found' });
    }

    // Check if user can delete (owner or plan owner)
    const canDelete = deposit.user_id === req.userId || deposit.plan.owner_id === req.userId;
    if (!canDelete) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this deposit' });
    }

    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Deletion reason is required' });
    }

    // Soft delete
    deposit.deleted_at = new Date();
    deposit.deletion_reason = reason;
    await deposit.save();

    res.json({ success: true, message: 'Deposit deleted successfully' });
  } catch (error) {
    console.error('Delete deposit error:', error);
    res.status(500).json({ success: false, message: 'Error deleting deposit' });
  }
};

// @desc    Get deposit statistics
// @route   GET /api/deposits/stats/overview
// @access  Private
export const getDepositStats = async (req, res) => {
  try {
    // Get all deposits for user's plans
    const planMemberships = await PlanMember.findAll({
      where: { 
        user_id: req.userId,
        status: 'active'
      },
      attributes: ['plan_id']
    });

    const ownedPlans = await SavingPlan.findAll({
      where: { owner_id: req.userId },
      attributes: ['id']
    });

    const planIds = [
      ...planMemberships.map(m => m.plan_id),
      ...ownedPlans.map(p => p.id)
    ];
    const uniquePlanIds = [...new Set(planIds)];

    if (uniquePlanIds.length === 0) {
      return res.json({
        success: true,
        stats: {
          totalDeposits: 0,
          totalAmount: 0,
          myDepositsCount: 0,
          myDepositsAmount: 0,
          averageDeposit: 0,
          recentDeposits: [],
          monthlyTrend: []
        }
      });
    }

    // Get all deposits from these plans
    const deposits = await Deposit.findAll({
      where: {
        plan_id: { [Op.in]: uniquePlanIds }
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username']
      }],
      order: [['deposit_date', 'DESC']]
    });

    // Calculate statistics
    const totalDeposits = deposits.length;
    const totalAmount = deposits.reduce((sum, d) => sum + parseFloat(d.amount), 0);
    const myDeposits = deposits.filter(d => d.user_id === req.userId);
    const myDepositsCount = myDeposits.length;
    const myDepositsAmount = myDeposits.reduce((sum, d) => sum + parseFloat(d.amount), 0);
    const averageDeposit = totalDeposits > 0 ? totalAmount / totalDeposits : 0;

    // Get recent deposits (last 10)
    const recentDeposits = deposits.slice(0, 10).map(d => ({
      id: d.id,
      amount: d.amount,
      date: d.deposit_date,
      plan_name: d.plan?.plan_name || 'N/A',
      user_name: d.user?.username || 'Unknown',
      is_mine: d.user_id === req.userId
    }));

    // Calculate monthly trend (last 6 months)
    const sixMonthsAgo = moment().subtract(6, 'months').startOf('month');
    const monthlyTrend = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthStart = moment().subtract(i, 'months').startOf('month');
      const monthEnd = moment().subtract(i, 'months').endOf('month');
      
      const monthDeposits = deposits.filter(d => {
        const depositDate = moment(d.deposit_date);
        return depositDate.isBetween(monthStart, monthEnd, 'day', '[]');
      });
      
      const monthTotal = monthDeposits.reduce((sum, d) => sum + parseFloat(d.amount), 0);
      const myMonthDeposits = monthDeposits.filter(d => d.user_id === req.userId);
      const myMonthTotal = myMonthDeposits.reduce((sum, d) => sum + parseFloat(d.amount), 0);
      
      monthlyTrend.push({
        month: monthStart.format('MMM YYYY'),
        total: monthTotal,
        my_total: myMonthTotal,
        count: monthDeposits.length,
        my_count: myMonthDeposits.length
      });
    }

    res.json({
      success: true,
      stats: {
        totalDeposits,
        totalAmount,
        myDepositsCount,
        myDepositsAmount,
        averageDeposit: parseFloat(averageDeposit.toFixed(2)),
        recentDeposits,
        monthlyTrend
      }
    });
  } catch (error) {
    console.error('Get deposit stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching deposit statistics'
    });
  }
};
