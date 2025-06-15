import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            validate: [validator.isEmail, 'Invalid email address'],
        },
        password: {
            type: String,
            required: true,
        },
        pushToken: {
            type: String,
            trim: true,
        },
        preferences: {
            reminders: {
                defaultDeliveryChannels: {
                    inApp: { type: Boolean, default: true },
                    email: { type: Boolean, default: true }, // Default to true
                    push: { type: Boolean, default: false },
                },
                defaultReminderTimes: {
                    task_due: { type: Number, default: 60 },
                    meeting: { type: Number, default: 30 },
                    goal_deadline: { type: Number, default: 1440 },
                    appraisal_submission: { type: Number, default: 1440 },
                    manager_feedback: { type: Number, default: 720 },
                    custom: { type: Number, default: 60 },
                },
            },
        },
    },
    { timestamps: true }
);


const User = mongoose.models.user || mongoose.model('user', userSchema);

export default User;