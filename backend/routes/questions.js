const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { getPlanLimit } = require('../utils/helpers');

// GET ALL QUESTIONS
router.get('/', async (req, res) => {
  try {
    const questions = await Question.find()
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET SINGLE QUESTION
router.get('/:id', async (req, res) => {
  try {
    const q = await Question.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true })
      .populate('user', 'name email avatar')
      .populate('answers.user', 'name email avatar');
    if (!q) return res.status(404).json({ message: 'Question not found' });
    res.json(q);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST QUESTION
router.post('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const today = new Date().toDateString();
    const lastReset = user.subscription.lastResetDate ? new Date(user.subscription.lastResetDate).toDateString() : null;

    if (lastReset !== today) {
      user.subscription.questionsPostedToday = 0;
      user.subscription.lastResetDate = new Date();
    }

    // Check subscription expiry
    const plan = (user.subscription.expiresAt && new Date() < user.subscription.expiresAt)
      ? user.subscription.plan : 'free';
    const limit = getPlanLimit(plan);

    if (user.subscription.questionsPostedToday >= limit) {
      return res.status(429).json({ message: `You have reached your daily question limit (${limit}) for the ${plan} plan. Upgrade to post more!` });
    }

    const { title, content, tags } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'Title and content required' });

    const question = await Question.create({ user: req.user._id, title, content, tags: tags || [] });
    user.subscription.questionsPostedToday += 1;
    await user.save();

    await question.populate('user', 'name email avatar');
    res.status(201).json(question);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST ANSWER
router.post('/:id/answers', auth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Answer content required' });

    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    question.answers.push({ user: req.user._id, content });
    await question.save();

    // Award 5 points for answering
    await User.findByIdAndUpdate(req.user._id, { $inc: { points: 5 } });

    await question.populate('answers.user', 'name email avatar');
    res.json(question);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPVOTE ANSWER
router.post('/:qId/answers/:aId/upvote', auth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.qId);
    const answer = question.answers.id(req.params.aId);
    if (!answer) return res.status(404).json({ message: 'Answer not found' });

    const userId = req.user._id.toString();
    const alreadyUpvoted = answer.upvotes.map(u => u.toString()).includes(userId);

    if (alreadyUpvoted) {
      answer.upvotes = answer.upvotes.filter(u => u.toString() !== userId);
    } else {
      answer.upvotes.push(req.user._id);
      answer.downvotes = answer.downvotes.filter(u => u.toString() !== userId);
      // Award 5 bonus points if answer reaches 5 upvotes
      if (answer.upvotes.length === 5) {
        await User.findByIdAndUpdate(answer.user, { $inc: { points: 5 } });
      }
    }
    await question.save();
    res.json({ upvotes: answer.upvotes.length, downvotes: answer.downvotes.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DOWNVOTE ANSWER
router.post('/:qId/answers/:aId/downvote', auth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.qId);
    const answer = question.answers.id(req.params.aId);
    if (!answer) return res.status(404).json({ message: 'Answer not found' });

    const userId = req.user._id.toString();
    const alreadyDownvoted = answer.downvotes.map(u => u.toString()).includes(userId);

    if (alreadyDownvoted) {
      answer.downvotes = answer.downvotes.filter(u => u.toString() !== userId);
    } else {
      answer.downvotes.push(req.user._id);
      answer.upvotes = answer.upvotes.filter(u => u.toString() !== userId);
      // Deduct 2 points for downvote
      await User.findByIdAndUpdate(answer.user, { $inc: { points: -2 } });
    }
    await question.save();
    res.json({ upvotes: answer.upvotes.length, downvotes: answer.downvotes.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE ANSWER
router.delete('/:qId/answers/:aId', auth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.qId);
    const answer = question.answers.id(req.params.aId);
    if (!answer) return res.status(404).json({ message: 'Answer not found' });
    if (answer.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });

    // Deduct points for removed answer
    await User.findByIdAndUpdate(answer.user, { $inc: { points: -5 } });
    answer.deleteOne();
    await question.save();
    res.json({ message: 'Answer deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
