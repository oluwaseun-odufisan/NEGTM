import cron from 'node-cron';
import mongoose from 'mongoose';
import Reminder from '../models/reminderModel.js';
import User from '../models/userModel.js';
import { sendEmail } from './emailService.js';
import { sendPushNotification } from './pushService.js';

const sendReminder = async (reminder) => {
    const user = await User.findById(reminder.user);
    if (!user) {
        console.error(`User ${reminder.user} not found for reminder ${reminder._id}`);
        return;
    }

    try {
        if (reminder.deliveryChannels.inApp) {
            global.io.to(`user:${user._id}`).emit('reminderTriggered', reminder);
        }
        if (reminder.deliveryChannels.email && user.email) {
            await sendEmail({
                to: user.email,
                subject: `Reminder: ${reminder.message}`,
                text: `You have a ${reminder.type.replace('_', ' ')} scheduled for ${new Date(reminder.remindAt).toLocaleString()}.`,
            });
        }
        if (reminder.deliveryChannels.push && user.pushToken) {
            await sendPushNotification({
                to: user.pushToken,
                title: 'ConnectSphere Reminder',
                body: reminder.message,
            });
        }

        reminder.status = 'sent';
        await reminder.save();
    } catch (error) {
        console.error(`Error sending reminder ${reminder._id}:`, error.message);
    }
};

// Run every minute to check pending reminders
const startReminderScheduler = () => {
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            const reminders = await Reminder.find({
                status: { $in: ['pending', 'snoozed'] },
                remindAt: { $lte: now },
            });
            for (const reminder of reminders) {
                await sendReminder(reminder);
            }
        } catch (error) {
            console.error('Reminder scheduler error:', error.message);
        }
    });
};

export { startReminderScheduler, sendReminder };