import Goal from '../models/goalModel.js';
import Reminder from '../models/reminderModel.js';
import User from '../models/userModel.js';

// Helper function to create or update reminder for a goal
const createOrUpdateGoalReminder = async (goal, userId, io) => {
    if (!goal.endDate) {
        await Reminder.deleteMany({ targetId: goal._id, targetModel: 'Goal', user: userId });
        return;
    }

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const reminderTime = user.preferences?.reminders?.defaultReminderTimes?.goal_deadline || 1440;
    const remindAt = new Date(goal.endDate.getTime() - reminderTime * 60 * 1000);

    let reminder = await Reminder.findOne({ targetId: goal._id, targetModel: 'Goal', user: userId });
    if (reminder) {
        reminder.message = `Goal "${goal.title}" deadline approaching`;
        reminder.remindAt = remindAt;
        reminder.deliveryChannels = {
            inApp: user.preferences?.reminders?.defaultDeliveryChannels?.inApp ?? true,
            email: user.preferences?.reminders?.defaultDeliveryChannels?.email ?? true,
            push: user.preferences?.reminders?.defaultDeliveryChannels?.push ?? false,
        };
        reminder.status = 'pending';
        reminder.snoozeUntil = null;
        await reminder.save();
        io.to(`user:${userId}`).emit('reminderUpdated', reminder);
    } else {
        reminder = new Reminder({
            user: userId,
            type: 'goal_deadline',
            targetId: goal._id,
            targetModel: 'Goal',
            message: `Goal "${goal.title}" deadline approaching`,
            deliveryChannels: {
                inApp: user.preferences?.reminders?.defaultDeliveryChannels?.inApp ?? true,
                email: user.preferences?.reminders?.defaultDeliveryChannels?.email ?? true,
                push: user.preferences?.reminders?.defaultDeliveryChannels?.push ?? false,
            },
            remindAt,
            createdBy: userId,
            isUserCreated: false,
            isActive: true,
        });
        await reminder.save();
        io.to(`user:${userId}`).emit('newReminder', reminder);
    }
};

// CREATE A NEW GOAL
export const createGoal = async (req, res) => {
    try {
        const { title, subGoals, type, timeframe, startDate, endDate } = req.body;
        if (!title || !timeframe || !startDate || !endDate) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const goal = new Goal({
            title,
            subGoals: subGoals || [],
            type: type || 'personal',
            timeframe,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            owner: req.user._id,
        });

        const saved = await goal.save();
        await createOrUpdateGoalReminder(saved, req.user._id, req.io);
        req.io.to(`user:${req.user._id}`).emit('newGoal', saved);

        res.status(201).json({ success: true, goal: saved });
    } catch (err) {
        console.error('Error creating goal:', err.message);
        res.status(400).json({ success: false, message: err.message });
    }
};

// GET ALL GOALS FOR LOGGED-IN USER
export const getGoals = async (req, res) => {
    try {
        const goals = await Goal.find({ owner: req.user._id }).sort({ createdAt: -1 });
        res.json({ success: true, goals });
    } catch (err) {
        console.error('Error fetching goals:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET SINGLE GOAL BY ID
export const getGoalById = async (req, res) => {
    try {
        const goal = await Goal.findOne({ _id: req.params.id, owner: req.user._id });
        if (!goal) {
            return res.status(404).json({ success: false, message: 'Goal not found' });
        }
        res.json({ success: true, goal });
    } catch (err) {
        console.error('Error fetching goal:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// UPDATE A GOAL BY ID
export const updateGoal = async (req, res) => {
    try {
        const data = { ...req.body };
        if (data.startDate) data.startDate = new Date(data.startDate);
        if (data.endDate) data.endDate = new Date(data.endDate);

        const updated = await Goal.findOneAndUpdate(
            { _id: req.params

.id, owner: req.user._id },
            data,
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Goal not found or not yours' });
        }

        await createOrUpdateGoalReminder(updated, req.user._id, req.io);
        req.io.to(`user:${req.user._id}`).emit('goalUpdated', updated);

        res.json({ success: true, goal: updated });
    } catch (err) {
        console.error('Error updating goal:', err.message);
        res.status(400).json({ success: false, message: err.message });
    }
};

// DELETE A GOAL
export const deleteGoal = async (req, res) => {
    try {
        const deleted = await Goal.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Goal not found or not yours' });
        }

        await Reminder.deleteMany({ targetId: req.params.id, targetModel: 'Goal', user: req.user._id });
        req.io.to(`user:${req.user._id}`).emit('goalDeleted', req.params.id);

        res.json({ success: true, message: 'Goal deleted' });
    } catch (err) {
        console.error('Error deleting goal:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};