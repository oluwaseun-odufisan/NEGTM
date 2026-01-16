// backend/controllers/learningController.js
import { LearningCourse, UserProgress } from '../models/learningMaterialModel.js';
import Joi from 'joi';
import { grokQuery } from '../services/grokService.js'; // For AI queries with restriction

const querySchema = Joi.object({
  question: Joi.string().required(),
  courseId: Joi.string().hex().length(24).optional(),
  moduleId: Joi.string().hex().length(24).optional(),
});

// Fetch all courses
export const getCourses = async (req, res) => {
  try {
    const courses = await LearningCourse.find({}).sort({ level: 1 });
    res.json({ success: true, courses });
  } catch (err) {
    console.error('Get courses error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Fetch course by ID
export const getCourseById = async (req, res) => {
  try {
    const course = await LearningCourse.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, course });
  } catch (err) {
    console.error('Get course error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get user progress for all courses
export const getUserProgress = async (req, res) => {
  try {
    const progress = await UserProgress.find({ userId: req.user.id }).populate('courseId', 'title level');
    res.json({ success: true, progress });
  } catch (err) {
    console.error('Get progress error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update user progress (complete module, update %)
export const updateProgress = async (req, res) => {
  const { courseId, moduleId } = req.body;
  try {
    let progress = await UserProgress.findOne({ userId: req.user.id, courseId });
    if (!progress) {
      progress = new UserProgress({ userId: req.user.id, courseId });
    }
    if (moduleId && !progress.completedModules.includes(moduleId)) {
      progress.completedModules.push(moduleId);
    }
    const course = await LearningCourse.findById(courseId);
    progress.progress = (progress.completedModules.length / course.modules.length) * 100;
    progress.certificationEarned = progress.progress === 100;
    progress.lastAccessed = Date.now();
    await progress.save();
    res.json({ success: true, progress });
  } catch (err) {
    console.error('Update progress error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// AI Query (Grok restricted to course/module content)
export const aiQuery = async (req, res) => {
  const { error } = querySchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  const { question, courseId, moduleId } = req.body;
  try {
    let content = '';
    if (courseId) {
      const course = await LearningCourse.findById(courseId);
      if (course) {
        if (moduleId) {
          const module = course.modules.id(moduleId);
          if (module) content = module.content;
        } else {
          content = course.modules.map(m => m.content).join('\n\n');
        }
      }
    }
    const response = await grokQuery(question, content); // Call Grok with restricted content
    res.json({ success: true, answer: response });
  } catch (err) {
    console.error('AI query error:', err);
    res.status(500).json({ success: false, message: 'Failed to get AI response' });
  }
};

// Generate quiz for module (using Grok)
export const generateQuiz = async (req, res) => {
  const { moduleId } = req.params;
  try {
    const course = await LearningCourse.findOne({ 'modules._id': moduleId });
    const module = course.modules.id(moduleId);
    if (!module) return res.status(404).json({ success: false, message: 'Module not found' });
    const quizResponse = await grokQuery(`Generate 5 multiple-choice questions with 4 options and 1 correct answer from this content: ${module.content}`, module.content);
    // Parse quizResponse to array of questions (assume Grok returns JSON or markdown - parse accordingly)
    const quiz = JSON.parse(quizResponse); // Assume Grok returns JSON array
    res.json({ success: true, quiz });
  } catch (err) {
    console.error('Generate quiz error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};