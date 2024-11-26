import Post from '../models/post.model.js';
import Notification from '../models/notification.model.js';
import cloudinary from '../lib/cloudinary.js';
import { sendCommentNotificationEmail } from '../emails/emailHandlers.js';

export const getFeedPosts = async (req, res) => {
  try {
    const posts = await Post.find({
      author: { $in: [...req.user.connections, req.user._id] },
    })
      .populate('author', 'name username profilePicture headline')
      .populate('comments.user', 'name profilePicture')
      .sort('-createdAt');

    res.status(200).json(posts);
  } catch (error) {
    console.log('Error in getFeedPosts controller: ', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createPost = async (req, res) => {
  try {
    const { image, content } = req.body;

    let newPost;
    if (image) {
      const imgResult = await cloudinary.uploader.upload(image);
      newPost = new Post({
        author: req.user._id,
        image: imgResult.secure_url,
        content,
      });
    } else {
      newPost = new Post({
        author: req.user._id,
        content,
      });
    }

    await newPost.save();

    res.status(201).json(newPost);
  } catch (error) {
    console.log('Error in createPost controller: ', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;
    const post = await Post.findById(postId);

    // check if post with that particular id exists
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // To check if the current user is the author of the post
    if (post.author.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: 'You are not authorized to delete this post.' });
    }

    //check if the post has an image. So we can delete it from the cloudinary
    if (post.image) {
      // to get the image id from the cloudinary url
      await cloudinary.uploader.destroy(
        post.image.split('/').pop().slice('.')[0]
      );
    }

    await Post.findByIdAndDelete(postId);
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.log('Error in deletePost controller: ', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPostById = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId)
      .populate('author', 'name username profilePicture headline')
      .populate('comments.user', 'name profilePicture username headline');

    res.status(200).json(post);
  } catch (error) {
    console.log('Error in getPostById controller: ', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const { content } = req.body;
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $push: {
          comments: {
            content,
            user: req.user._id,
          },
        },
      },
      { new: true }
    ).populate('author', 'name username profilePicture headline');

    // create a notification if the comment owner is not the post owner
    if (post.author._id.toString() !== req.user._id.toString()) {
      const newNotification = new Notification({
        recipient: post.author,
        type: 'comment',
        relatedUser: req.user._id,
        relatedPost: postId,
      });

      await newNotification.save();

      //todo send email
      try {
        const postUrl = process.env.CLIENT_URL + '/post/' + postId;
        await sendCommentNotificationEmail(
          post.author.email,
          post.author.name,
          req.user.name,
          postUrl,
          content
        );
      } catch (error) {
        console.log('Error in sending comment notification email: ', error);
      }

      res.status(200).json(post);
    }
  } catch (error) {
    console.log('Error in createComment controller: ', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const likePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);
    const userId = req.user._id;

    if (post.likes.includes(userId)) {
      //  unlike the post
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      // like the post
      post.likes.push(userId);

      // create a notification if the comment owner is not the user who liked the post
      if (post.author.toString() !== userId.toString()) {
        const newNotification = new Notification({
          recipient: post.author,
          type: 'like',
          relatedUser: userId,
          relatedPost: postId,
        });

        await newNotification.save();
      }
    }

    await post.save();
    res.status(200).json(post);
  } catch (error) {
    console.log('Error in likePost controller: ', error);
    res.status(500).json({ message: 'Server error' });
  }
};
