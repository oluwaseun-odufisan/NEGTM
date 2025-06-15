import Goal from '../models/goalModel.js';
import Task from '../models/taskModel.js';
import Reminder from '../models/reminderModel.js';
import validator from 'validator';
import User from '../models/userModel.js';
import mongoose from 'mongoose';

// Helper to create/update goal reminder
const createOrUpdateGoalReminder = async (goal, userId, io) => {
    if (!goal.endDate) return;

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const reminderTime = user.preferences?.reminders?.defaultReminderTimes?.goal_deadline || 1440;
    const remindAt = new Date(goal.endDate.getTime() - reminderTime * 60 * 1000);

    let reminder = await Reminder.findOne({ targetId: goal._id, targetModel: 'Goal', user: userId });
    if (reminder) {
        reminder.message = `Goal "${goal.title}" is due soon`;
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
            message: `Goal "${goal.title}" is due soon`,
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

// Create a new goal
export const createGoal = async (req, res) => {
    try {
        const { title, subGoals, type, taskId, timeframe, startDate, endDate } = req.body;

        if (!title || !validator.isLength(title, { min: 1, max: 100 })) {
            return res.status(400).json({ success: false, message: 'Title must be 1-100 characters' });
        }
        if (!subGoals || !Array.isArray(subGoals) || subGoals.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one sub-goal is required' });
        }
        if (!['task_related', 'personal'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Invalid goal type' });
        }
        if (type === 'task_related' && (!taskId || !mongoose.isValidObjectId(taskId))) {
            return res.status(400).json({ success: false, message: 'Valid task ID required for task-related goal' });
        }
        if (!['daily', 'weekly', 'monthly', 'quarterly', 'custom'].includes(timeframe)) {
            return res.status(400).json({ success: false, message: 'Invalid timeframe' });
        }
        if (!startDate || !endDate || isNaN(new Date(startDate).getTime()) || isNaN(new Date(endDate).getTime())) {
            return res.status(400).json({ success: false, message: 'Valid start and end dates required' });
        }
        if (new Date(startDate) > new Date(endDate)) {
            return res.status(400).json({ success: false, message: 'Start date must be before end date' });
        }

        if (type === 'task_related') {
            const task = await Task.findOne({ _id: taskId, owner: req.user._id });
            if (!task) {
                return res.status(404).json({ success: false, message: 'Task not found or not authorized' });
            }
        }

        const goal = new Goal({
            title,
            subGoals: subGoals.map((sg) => ({ description: sg.description, completed: false })),
            type,
            taskId: type === 'task_related' ? taskId : null,
            timeframe,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            owner: req.user._id,
        });

        const savedGoal = await goal.save();

        // Create reminder
        await createOrUpdateGoalReminder(savedGoal, req.user._id, req.io);

        // Emit real-time event
        req.io.to(`user:${req.user._id}`).emit('newGoal', savedGoal);

        res.status(201).json({ success: true, goal: savedGoal });
    } catch (err) {
        console.error('Error creating goal:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get all goals for logged-in user
export const getGoals = async (req, res) => {
    try {
        const goals = await Goal.find({ owner: req.user._id })
            .populate('taskId', 'title')
            .sort({ createdAt: -1 });
        res.json({ success: true, goals });
    } catch (err) {
        console.error('Error fetching goals:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get single goal by ID
export const getGoalById = async (req, res) => {
    try {
        const goal = await Goal.findOne({ _id: req.params.id, owner: req.user._id }).populate('taskId', 'title');
        if (!goal) {
            return res.status(404).json({ success: false, message: 'Goal not found' });
        }
        res.json({ success: true, goal });
    } catch (err) {
        console.error('Error fetching goal:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update a goal by ID
export const updateGoal = async (req, res) => {
    try {
        const { title, subGoals, type, taskId, timeframe, startDate, endDate } = req.body;

        if (!title || !validator.isLength(title, { min: 1, max: 100 })) {
            return res.status(400).json({ success: false, message: 'Title must be 1-100 characters' });
        }
        if (!subGoals || !Array.isArray(subGoals) || subGoals.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one sub-goal is required' });
        }
        if (!['task_related', 'personal'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Invalid goal type' });
        }
        if (type === 'task_related' && (!taskId || !mongoose.isValidObjectId(taskId))) {
            return res.status(400).json({ success: false, message: 'Valid task ID required for task-related goal' });
        }
        if (!['daily', 'weekly', 'monthly', 'quarterly', 'custom'].includes(timeframe)) {
            return res.status(400).json({ success: false, message: 'Invalid timeframe' });
        }
        if (!startDate || !endDate || isNaN(new Date(startDate).getTime()) || isNaN(new Date(endDate).getTime())) {
            return res.status(400).json({ success: false, message: 'Valid start and end dates required' });
        }
        if (new Date(startDate) > new Date(endDate)) {
            return res.status(400).json({ success: false, message: 'Start date must be before end date' });
        }

        const goal = await Goal.findOne({ _id: req.params.id, owner: req.user._id });
        if (!goal) {
            return res.status(404).json({ success: false, message: 'Goal not found or not authorized' });
        }

        if (type === 'task_related') {
            const task = await Task.findOne({ _id: taskId, owner: req.user._id });
            if (!task) {
                return res.status(404).json({ success: false, message: 'Task not found or not authorized' });
            }
        }

        goal.title = title;
        goal.subGoals = subGoals.map((sg) => ({
            description: sg.description,
            completed: sg.completed || false,
        }));
        goal.type = type;
        goal.taskId = type === 'task_related' ? taskId : null;
        goal.timeframe = timeframe;
        goal.startDate = new Date(startDate);
        goal.endDate = new Date(endDate);

        const updatedGoal = await goal.save();

        // Update reminder
        await createOrUpdateGoalReminder(updatedGoal, req.user._id, req.io);

        // Emit real-time event
        req.io.to(`user:${req.user._id}`).emit('goalUpdated', updatedGoal);

        res.json({ success: true, goal: updatedGoal });
    } catch (err) {
        console.error('Error updating goal:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update goal progress (for checkboxes)
export const updateGoalProgress = async (req, res) => {
    try {
        const { subGoals } = req.body;

        if (!subGoals || !Array.isArray(subGoals)) {
            return res.status(400).json({ success: false, message: 'Sub-goals array required' });
        }

        const goal = await Goal.findOne({ _id: req.params.id, owner: req.user._id });
        if (!goal) {
            return res.status(404).json({ success: false, message: 'Goal not found or not authorized' });
        }

        // Update only the completed status of sub-goals
        goal.subGoals = goal.subGoals.map((sg, index) => ({
            ...sg.toObject(),
            completed: subGoals[index]?.completed ?? sg.completed,
        }));

        const updatedGoal = await goal.save();

        // Emit real-time event
        req.io.to(`user:${req.user._id}`).emit('goalUpdated', updatedGoal);

        res.json({ success: true, goal: updatedGoal });
    } catch (err) {
        console.error('Error updating goal progress:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Delete a goal by ID
export const deleteGoal = async (req, res) => {
    try {
        const goal = await Goal.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
        if (!goal) {
            return res.status(404).json({ success: false, message: 'Goal not found or not authorized' });
        }

        // Remove associated reminders
        await Reminder.deleteMany({ targetId: req.params.id, targetModel: 'Goal', user: req.user._id });
        req.io.to(`user:${req.user._id}`).emit('reminderDeleted', req.params.id);

        // Emit real-time event
        req.io.to(`user:${req.user._id}`).emit('goalDeleted', req.params.id);

        res.json({ success: true, message: 'Goal deleted' });
    } catch (err) {
        console.error('Error deleting goal:', err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};