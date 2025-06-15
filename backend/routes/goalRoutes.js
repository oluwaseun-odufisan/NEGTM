import express from 'express';
import authMiddleware from '../middleware/auth.js';
import {
    createGoal,
    getGoals,
    getGoalById,
    updateGoal,
    updateGoalProgress,
    deleteGoal,
} from '../controllers/goalController.js';

const goalRouter = express.Router();

goalRouter
    .route('/')
    .get(authMiddleware, getGoals)
    .post(authMiddleware, createGoal);

goalRouter
    .route('/:id')
    .get(authMiddleware, getGoalById)
    .put(authMiddleware, updateGoal)
    .delete(authMiddleware, deleteGoal);

goalRouter.route('/:id/progress').put(authMiddleware, updateGoalProgress);

export default goalRouter;