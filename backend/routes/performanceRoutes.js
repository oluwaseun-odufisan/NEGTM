// backend/routes/performanceRoutes.js
import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { getUsersPerformance, redeemPoints, createChallenge, getChallenges, completeChallenge, addInteraction, getInteractions, approveRedemption } from '../controllers/performanceController.js';

const performanceRouter = express.Router();

performanceRouter.get('/users', authMiddleware, getUsersPerformance);
performanceRouter.post('/redeem', authMiddleware, redeemPoints);
performanceRouter.post('/challenges', authMiddleware, createChallenge);
performanceRouter.get('/challenges', authMiddleware, getChallenges);
performanceRouter.post('/challenges/:challengeId/complete', authMiddleware, completeChallenge);
performanceRouter.post('/interactions', authMiddleware, addInteraction);
performanceRouter.get('/interactions/:userId', authMiddleware, getInteractions);
performanceRouter.post('/approve-redemption', authMiddleware, approveRedemption); // Admin only, add middleware if needed

export default performanceRouter;