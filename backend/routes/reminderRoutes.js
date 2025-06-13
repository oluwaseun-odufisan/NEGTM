import express from 'express';
import validator from 'validator';
import sanitizeHtml from 'sanitize-html';
import mongoose from 'mongoose';
import Reminder from '../models/reminderModel.js';
import User from '../models/userModel.js';
import Task from '../models/taskModel.js';
import authMiddleware from '../middleware/auth.js';
import { sendEmail } from '../utils/emailService.js';
import { sendPushNotification } from '../utils/pushService.js';

const router = express.Router();

// Create a reminder
router.post('/', authMiddleware, async (req, res, next) => {
    const { type, targetId, targetModel, message, deliveryChannels, remindAt } = req.body;

    if (!['task_due', 'meeting', 'goal_deadline', 'appraisal_submission', 'manager_feedback'].includes(type)) {
        return res.status(400).json({ success: false, message: 'Invalid reminder type' });
    }
    if (!mongoose.isValidObjectId(targetId)) {
        return res.status(400).json({ success: false, message: 'Invalid target ID' });
    }
    if (!['Task', 'Meeting', 'Goal', 'Appraisal', 'Feedback'].includes(targetModel)) {
        return res.status(400).json({ success: false, message: 'Invalid target model' });
    }
    if (!message || !validator.isLength(sanitizeHtml(message, { allowedTags: [] }), { min: 1, max: 200 })) {
        return res.status(400).json({ success: false, message: 'Message must be 1-200 characters' });
    }
    if (!remindAt || isNaN(new Date(remindAt).getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid reminder time' });
    }

    try {
        // Validate target exists
        let target;
        if (targetModel === 'Task') {
            target = await Task.findById(targetId);
            if (!target || target.owner.toString() !== req.user._id.toString()) {
                return res.status(404).json({ success: false, message: 'Target not found or not authorized' });
            }
        }
        // Add validation for other models (Meeting, Goal, etc.) when implemented

        const reminder = new Reminder({
            user: req.user._id,
            type,
            targetId,
            targetModel,
            message,
            deliveryChannels: {
                inApp: deliveryChannels?.inApp ?? true,
                email: deliveryChannels?.email ?? false,
                push: deliveryChannels?.push ?? false,
            },
            remindAt: new Date(remindAt),
            createdBy: req.user._id,
        });
        await reminder.save();
        req.io.emit('newReminder', reminder);
        res.json({ success: true, reminder });
    } catch (error) {
        console.error('Error creating reminder:', error.message);
        res.status(500).json({ success: false, message: 'Failed to create reminder' });
        next(error);
    }
});

// Get user's reminders
router.get('/', authMiddleware, async (req, res, next) => {
    const { page = 1, limit = 10, status } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (pageNum < 1 || limitNum < 1) {
        return res.status(400).json({ success: false, message: 'Invalid page or limit' });
    }

    try {
        const query = { user: req.user._id };
        if (status) query.status = status;
        const reminders = await Reminder.find(query)
            .sort({ remindAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .populate('targetId', 'title dueDate');
        res.json({ success: true, reminders });
    } catch (error) {
        console.error('Error fetching reminders:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch reminders' });
        next(error);
    }
});

// Snooze a reminder
router.put('/:id/snooze', authMiddleware, async (req, res, next) => {
    const { id } = req.params;
    const { snoozeMinutes } = req.body;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'Invalid reminder ID' });
    }
    if (!snoozeMinutes || !Number.isInteger(snoozeMinutes) || snoozeMinutes < 5 || snoozeMinutes > 1440) {
        return res.status(400).json({ success: false, message: 'Snooze time must be 5-1440 minutes' });
    }

    try {
        const reminder = await Reminder.findById(id);
        if (!reminder) {
            return res.status(404).json({ success: false, message: 'Reminder not found' });
        }
        if (reminder.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        reminder.status = 'snoozed';
        reminder.snoozeUntil = new Date(Date.now() + snoozeMinutes * 60 * 1000);
        reminder.remindAt = reminder.snoozeUntil;
        await reminder.save();
        req.io.emit('reminderUpdated', reminder);
        res.json({ success: true, reminder });
    } catch (error) {
        console.error('Error snoozing reminder:', error.message);
        res.status(500).json({ success: false, message: 'Failed to snooze reminder' });
        next(error);
    }
});

// Dismiss a reminder
router.put('/:id/dismiss', authMiddleware, async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'Invalid reminder ID' });
    }

    try {
        const reminder = await Reminder.findById(id);
        if (!reminder) {
            return res.status(404).json({ success: false, message: 'Reminder not found' });
        }
        if (reminder.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        reminder.status = 'dismissed';
        await reminder.save();
        req.io.emit('reminderUpdated', reminder);
        res.json({ success: true, reminder });
    } catch (error) {
        console.error('Error dismissing reminder:', error.message);
        res.status(500).json({ success: false, message: 'Failed to dismiss reminder' });
        next(error);
    }
});

// Update reminder preferences
router.put('/preferences', authMiddleware, async (req, res, next) => {
    const { defaultDeliveryChannels, defaultReminderTimes } = req.body;

    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        user.preferences = user.preferences || {};
        user.preferences.reminders = {
            defaultDeliveryChannels: {
                inApp: defaultDeliveryChannels?.inApp ?? true,
                email: defaultDeliveryChannels?.email ?? false,
                push: defaultDeliveryChannels?.push ?? false,
            },
            defaultReminderTimes: defaultReminderTimes || {
                task_due: 60,
                meeting: 30,
                goal_deadline: 1440,
                appraisal_submission: 1440,
                manager_feedback: 720,
            },
        };
        await user.save();
        res.json({ success: true, preferences: user.preferences.reminders });
    } catch (error) {
        console.error('Error updating preferences:', error.message);
        res.status(500).json({ success: false, message: 'Failed to update preferences' });
        next(error);
    }
});

export default router;