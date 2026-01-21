// backend/controllers/performanceController.js
import User from '../models/userModel.js';
import Task from '../models/taskModel.js';
import Goal from '../models/goalModel.js';
import Challenge from '../models/challengeModel.js';
import PerformanceInteraction from '../models/performanceInteractionModel.js';

export const getUsersPerformance = async (req, res) => {
  try {
    const users = await User.find({}).select('-password -activityLogs -preferences -pushToken');
    
    const performanceData = await Promise.all(users.map(async (u) => {
      const tasks = await Task.find({ owner: u._id });
      const goals = await Goal.find({ owner: u._id });
      
      const completedTasks = tasks.filter(t => t.completed).length;
      const completedGoals = goals.filter(g => calculateGoalProgress(g) === 100).length;
      
      return {
        ...u.toObject(),
        tasks: tasks,
        goals: goals,
        completedTasks,
        completedGoals,
      };
    }));
    
    res.json({ success: true, users: performanceData });
  } catch (err) {
    console.error('Error fetching performance:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const calculateGoalProgress = (goal) => {
  if (!goal.subGoals.length) return 0;
  const completed = goal.subGoals.filter(sg => sg.completed).length;
  return (completed / goal.subGoals.length) * 100;
};

export const redeemPoints = async (req, res) => {
  const { userId, amount } = req.body;
  try {
    const targetUser = await User.findById(userId);
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });
    
    if (amount > targetUser.points) return res.status(400).json({ success: false, message: 'Insufficient points' });
    
    targetUser.points -= amount;
    targetUser.redemptionHistory.push({ amount, status: 'pending' });
    await targetUser.save();
    
    res.json({ success: true, message: 'Redemption requested' });
  } catch (err) {
    console.error('Error redeeming points:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createChallenge = async (req, res) => {
  try {
    const challenge = new Challenge({
      ...req.body,
      createdBy: req.user._id,
    });
    const saved = await challenge.save();
    res.status(201).json({ success: true, challenge: saved });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getChallenges = async (req, res) => {
  try {
    const challenges = await Challenge.find({ active: true });
    res.json({ success: true, challenges });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const completeChallenge = async (req, res) => {
  const { challengeId } = req.params;
  try {
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });

    challenge.completedBy.push({ user: req.user._id });
    await challenge.save();

    await updateUserPerformance(req.user._id, challenge.points);

    res.json({ success: true, message: 'Challenge completed' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const addInteraction = async (req, res) => {
  try {
    const interaction = new PerformanceInteraction({
      ...req.body,
      from: req.user._id,
    });
    const saved = await interaction.save();
    res.status(201).json({ success: true, interaction: saved });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getInteractions = async (req, res) => {
  const { userId } = req.params;
  try {
    const interactions = await PerformanceInteraction.find({ to: userId }).populate('from', 'name');
    res.json({ success: true, interactions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Admin approve redemption
export const approveRedemption = async (req, res) => {
  const { userId, redemptionId } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const redemption = user.redemptionHistory.id(redemptionId);
    if (!redemption) return res.status(404).json({ success: false, message: 'Redemption not found' });

    redemption.status = 'approved';
    await user.save();

    res.json({ success: true, message: 'Redemption approved' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};