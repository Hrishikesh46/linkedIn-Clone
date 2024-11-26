import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import {
  getFeedPosts,
  createPost,
  deletePost,
  getPostById,
  createComment,
  likePost,
} from '../controllers/post.controller.js';

const router = express.Router();

// posts that will be visible on the feed
router.get('/', protectRoute, getFeedPosts);
router.post('/create', protectRoute, createPost);
router.delete('/delete/:id', protectRoute, deletePost);
router.get('/:id', protectRoute, getPostById);
router.post('/:id/comments', protectRoute, createComment);
router.post('/:id/like', protectRoute, likePost);

export default router;