import { SavingPlan, PlanMember } from '../models/index.js';
export const createPlan = async (req, res) => {
  try {
    const {
      plan_name,
      description,
      frequency,
      cycle,
      target_amount,
      max_members,
      interest_rate,
      is_fixed_amount,
      fixed_amount,
      start_date,
      end_date,
    } = req.body;

    const owner_id = req.userId;

    const plan = await SavingPlan.create({
      owner_id,
      plan_name,
      description,
      frequency,
      cycle,
      target_amount,
      max_members,
      interest_rate,
      is_fixed_amount,
      fixed_amount,
      start_date,
      end_date,
    });

    // Add the owner as a plan member
    await PlanMember.create({
      plan_id: plan.id,
      user_id: owner_id,
      is_admin: true,
    });

    res.status(201).json({
      message: 'Plan created successfully',
      plan,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPlans = async (req, res) => {
  try {
    const plans = await SavingPlan.findAll({
      where: { owner_id: req.userId },
      include: [
        {
          model: PlanMember,
          include: ['User'], // This will include the user details for each member
        },
      ],
    });

    res.json(plans);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Other plan controller functions (update, delete, etc.) can be added here.