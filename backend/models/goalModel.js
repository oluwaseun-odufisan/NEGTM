import mongoose from 'mongoose';

const subGoalSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },
    completed: {
        type: Boolean,
        default: false,
    },
});

const goalSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        subGoals: [subGoalSchema],
        type: {
            type: String,
            enum: ['task_related', 'personal'],
            default: 'personal',
        },
        taskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task',
            required: function () {
                return this.type === 'task_related';
            },
        },
        timeframe: {
            type: String,
            enum: ['daily', 'weekly', 'monthly', 'quarterly', 'custom'],
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
        progress: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        completed: {
            type: Boolean,
            default: false,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true,
        },
    },
    { timestamps: true }
);

// Calculate progress before saving
goalSchema.pre('save', function (next) {
    if (this.subGoals && this.subGoals.length > 0) {
        const completedCount = this.subGoals.filter((sg) => sg.completed).length;
        this.progress = Math.round((completedCount / this.subGoals.length) * 100);
        this.completed = this.progress === 100;
    } else {
        this.progress = 0;
        this.completed = false;
    }
    next();
});

const Goal = mongoose.models.Goal || mongoose.model('Goal', goalSchema);
export default Goal;