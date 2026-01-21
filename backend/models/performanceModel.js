import mongoose from 'mongoose';

const challengeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    points: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        enum: ['individual', 'team'],
        required: true,
    },
    deadline: {
        type: Date,
        required: true,
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
    }],
    completedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
}, { timestamps: true });

const seasonSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    winners: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
        },
        position: Number,
    }],
}, { timestamps: true });

const hallOfFameSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    achievement: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    season: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Season',
    },
}, { timestamps: true });

export const Challenge = mongoose.models.Challenge || mongoose.model('Challenge', challengeSchema);
export const Season = mongoose.models.Season || mongoose.model('Season', seasonSchema);
export const HallOfFame = mongoose.models.HallOfFame || mongoose.model('HallOfFame', hallOfFameSchema);