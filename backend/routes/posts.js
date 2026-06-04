const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { upload, deleteFromCloudinary } = require('../config/cloudinary');

// ─────────────────────────────────────────────
// Helper: check friend-based post limit
// ─────────────────────────────────────────────
const checkPostLimit = async (userId) => {
  const user = await User.findById(userId);
  const today = new Date().toDateString();
  const lastReset = user.socialPostsLastReset
    ? new Date(user.socialPostsLastReset).toDateString()
    : null;

  if (lastReset !== today) {
    user.socialPostsToday = 0;
    user.socialPostsLastReset = new Date();
    await user.save();
  }

  const friendCount = user.friends.length;
  let limit;
  if (friendCount === 0)       limit = 0;
  else if (friendCount === 1)  limit = 1;
  else if (friendCount === 2)  limit = 2;
  else if (friendCount > 10)   limit = Infinity;
  else                         limit = friendCount;

  return { user, limit, postsToday: user.socialPostsToday, friendCount };
};

// ─────────────────────────────────────────────
// GET ALL POSTS (authenticated feed)
// ─────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'name email avatar')
      .populate('comments.user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────
// GET SINGLE POST (public – for shared links)
// ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', 'name email avatar')
      .populate('comments.user', 'name avatar');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────
// CREATE POST  (Cloudinary upload)
// ─────────────────────────────────────────────
router.post('/', auth, upload.single('media'), async (req, res) => {
  try {
    const { limit, postsToday, friendCount, user } = await checkPostLimit(req.user._id);

    if (limit === 0) {
      // If Cloudinary already uploaded, clean it up
      if (req.file?.path) await deleteFromCloudinary(req.file.path, 'image');
      return res.status(403).json({
        message: 'You need at least 1 friend to post on the public space. Connect with others first!'
      });
    }
    if (postsToday >= limit) {
      if (req.file?.path) await deleteFromCloudinary(req.file.path, 'image');
      return res.status(429).json({
        message: `You can post ${limit} time(s) per day with ${friendCount} friend(s). Add more friends to post more!`
      });
    }

    const { content } = req.body;
    let mediaUrl = null, mediaPublicId = null, mediaType = 'none';

    if (req.file) {
      // multer-storage-cloudinary attaches these to req.file
      mediaUrl      = req.file.path;          // full Cloudinary secure URL
      mediaPublicId = req.file.filename;      // public_id (folder/name)
      mediaType     = req.file.mimetype?.startsWith('video') ? 'video' : 'image';
    }

    if (!content && !mediaUrl) {
      return res.status(400).json({ message: 'Post must have content or media' });
    }

    const post = await Post.create({
      user: req.user._id,
      content: content || '',
      mediaUrl,
      mediaPublicId,
      mediaType
    });

    user.socialPostsToday += 1;
    await user.save();

    await post.populate('user', 'name email avatar');
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────
// DELETE POST  (owner only)
// ─────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Only the post owner can delete
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    // Delete media from Cloudinary
    if (post.mediaUrl) {
      await deleteFromCloudinary(post.mediaUrl, post.mediaType);
    }

    await post.deleteOne();
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────
// LIKE / UNLIKE POST
// ─────────────────────────────────────────────
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const userId = req.user._id.toString();
    const liked  = post.likes.map(u => u.toString()).includes(userId);
    if (liked) post.likes = post.likes.filter(u => u.toString() !== userId);
    else       post.likes.push(req.user._id);

    await post.save();
    res.json({ likes: post.likes.length, liked: !liked });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────
// ADD COMMENT
// ─────────────────────────────────────────────
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment text required' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.comments.push({ user: req.user._id, text: text.trim() });
    await post.save();
    await post.populate('comments.user', 'name avatar');
    res.json(post.comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────
// DELETE COMMENT  (comment owner OR post owner)
// ─────────────────────────────────────────────
router.delete('/:postId/comments/:commentId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const requesterId  = req.user._id.toString();
    const commentOwner = comment.user.toString();
    const postOwner    = post.user.toString();

    // Allow: comment owner OR post owner
    if (requesterId !== commentOwner && requesterId !== postOwner) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    comment.deleteOne();
    await post.save();
    await post.populate('comments.user', 'name avatar');
    res.json(post.comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────
// SHARE  (increment counter)
// ─────────────────────────────────────────────
router.post('/:id/share', auth, async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { shares: 1 } },
      { new: true }
    );
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json({ shares: post.shares });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
