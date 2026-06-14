const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// SEARCH USERS
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } },
        { $or: [{ name: { $regex: q, $options: 'i' } }, { email: { $regex: q, $options: 'i' } }] }
      ]
    }).select('name email avatar points friends').limit(10);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// SEND FRIEND REQUEST
router.post('/:id/friend-request', auth, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) return res.status(400).json({ message: 'Cannot add yourself' });
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (target.friends.includes(req.user._id)) return res.status(400).json({ message: 'Already friends' });
    if (target.friendRequests.includes(req.user._id)) return res.status(400).json({ message: 'Request already sent' });
    target.friendRequests.push(req.user._id);
    await target.save();
    res.json({ message: 'Friend request sent!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ACCEPT FRIEND REQUEST
router.post('/:id/accept-friend', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.friendRequests.includes(req.params.id)) return res.status(400).json({ message: 'No request found' });

    user.friendRequests = user.friendRequests.filter(r => r.toString() !== req.params.id);
    if (!user.friends.includes(req.params.id)) user.friends.push(req.params.id);
    await user.save();

    await User.findByIdAndUpdate(req.params.id, { $addToSet: { friends: req.user._id } });
    res.json({ message: 'Friend added!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// TRANSFER POINTS
router.post('/transfer-points', auth, async (req, res) => {
  try {
    const { toUserId, points } = req.body;
    if (!toUserId || !points || points <= 0) return res.status(400).json({ message: 'Invalid transfer details' });

    const sender = await User.findById(req.user._id);
    if (sender.points <= 10) return res.status(403).json({ message: 'You need more than 10 points to transfer. You currently have ' + sender.points + ' points.' });
    if (sender.points < points) return res.status(400).json({ message: 'Insufficient points' });

    const receiver = await User.findById(toUserId);
    if (!receiver) return res.status(404).json({ message: 'Recipient not found' });

    sender.points -= points;
    receiver.points += parseInt(points);
    await sender.save();
    await receiver.save();

    res.json({ message: `Successfully transferred ${points} points to ${receiver.name}`, newBalance: sender.points });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET USER PROFILE (public)
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -otp -otpExpiry')
      .populate('friends', 'name email avatar');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET FRIEND REQUESTS
router.get('/me/friend-requests', auth, async (req, res) => {
  const user = await User.findById(req.user._id).populate('friendRequests', 'name email avatar');
  res.json(user.friendRequests);
});

module.exports = router;
