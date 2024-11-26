import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies['token'];
    // check is token exists
    if (!token) {
      return res
        .status(401)
        .json({ message: 'Unauthorized - No token provided' });
    }

    //check if token is valid
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ message: 'Unauthorized - Invalid token' });
    }

    //check if user exists in the database
    const user = await User.findById(decoded.userId).select('-password'); //userId was used for signing the token.Hence we can access it here. And also can remove password from the response.
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized - User not found' });
    }

    // set user in the request
    req.user = user;
    next();
  } catch (error) {
    console.log('Error in protectRoute middleware: ', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
