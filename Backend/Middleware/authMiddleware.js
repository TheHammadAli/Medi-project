const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log('No Authorization header or invalid format');
    return res.status(401).json({ msg: "Access Denied" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ msg: "Access Denied" });
  }

  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      return res.status(500).json({ msg: "Server configuration error" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.id) {
      console.error('Token does not contain user ID');
      return res.status(401).json({ msg: "Invalid Token" });
    }

    req.user = { id: decoded.id, userType: decoded.userType }; // Assuming userType is also in the token
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ msg: "Token expired" });
    } else if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ msg: "Invalid Token" });
    } else {
      res.status(401).json({ msg: "Token verification failed" });
    }
  }
};
