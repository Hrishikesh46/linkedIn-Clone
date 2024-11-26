import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendWelcomeEmail } from '../emails/emailHandlers.js';

export const signup = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    // Checking if no field is empty
    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    //Check if username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // check length of password
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: 'Password must be at least 6 characters' });
    }

    // If user does not exist in the database then create a new user
    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    //creating new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      username,
    });

    await user.save();

    // create token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '3d',
    });

    //setting up cookie
    res.cookie('token', token, {
      httpOnly: true, //prevent XSS attack
      maxAge: 1000 * 60 * 60 * 24 * 3, // in milliseconds
      secure: process.env.NODE_ENV === 'production', //prevents man in the middle attacks
      sameSite: 'strict', // prevent CSRF attack
    });

    res.status(201).json({ message: 'User Registered' });

    const profileUrl = `${process.env.CLIENT_URL}/profile/${user.username}`;

    //send welcome email
    try {
      await sendWelcomeEmail(user.email, user.name, profileUrl);
    } catch (error) {
      console.log('Error in sending welcome email : ', error);
    }
  } catch (error) {
    console.log('Error in signup : ', error);
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    //check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    //Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    //create token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '3d',
    });

    //setting up cookie
    res.cookie('token', token, {
      httpOnly: true, //prevent XSS attack
      maxAge: 1000 * 60 * 60 * 24 * 3, // in milliseconds
      secure: process.env.NODE_ENV === 'production', //prevents man in the middle attacks
      sameSite: 'strict', // prevent CSRF attack
    });

    res.status(200).json({ message: 'User logged in' });
  } catch (error) {
    console.log('Error in login controller: ', error);
    res.status(500).json({ message: error.message });
  }
};

export const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'User logged out' });
};

export const getCurrentUser = async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    console.log('Error in getCurrentUser middleware: ', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
