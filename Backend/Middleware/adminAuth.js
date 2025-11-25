const jwt = require("jsonwebtoken");
const Admin = require("../Model/Admin");

// Admin authentication middleware
const adminAuth = async (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: {
        code: "MISSING_TOKEN",
        message: "Access denied. No token provided."
      }
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if the token has admin role
    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: "Access denied. Admin privileges required."
        }
      });
    }

    // Verify admin exists in database
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: "Token is not valid or admin not found."
        }
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error("Admin authentication error:", error);

    let errorCode = "INVALID_TOKEN";
    let errorMessage = "Token is not valid.";

    if (error.name === 'TokenExpiredError') {
      errorCode = "TOKEN_EXPIRED";
      errorMessage = "Token has expired. Please log in again.";
    }

    res.status(401).json({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage
      }
    });
  }
};

module.exports = adminAuth;