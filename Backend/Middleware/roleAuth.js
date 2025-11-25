const jwt = require("jsonwebtoken");
const Doctor = require("../Model/Doctor");
const Patient = require("../Model/Patient");
const Pharmacist = require("../Model/Pharmacist");

// Enhanced authentication middleware that identifies user role
const authenticate = async (req, res, next) => {
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
    // Add detailed logging for debugging
    console.log("🔍 Authenticating token...");
    console.log("Token received:", token ? token.substring(0, 50) + "..." : "NO TOKEN");
    console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);
    console.log("Token length:", token ? token.length : 0);

    // Validate token format before verification
    if (!token || typeof token !== 'string') {
      console.error("❌ Invalid token format - token is not a string or is empty");
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_TOKEN_FORMAT",
          message: "Token must be a valid string."
        }
      });
    }

    // Check if token has the basic JWT structure (3 parts separated by dots)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.error("❌ Malformed JWT - expected 3 parts, got:", tokenParts.length);
      return res.status(401).json({
        success: false,
        error: {
          code: "MALFORMED_TOKEN",
          message: "Token is not properly formatted."
        }
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Try to find user in different collections based on token data
    let user = null;
    let userType = null;

    // Check if token has userType field
    if (decoded.userType) {
      userType = decoded.userType;
      switch (userType) {
        case 'doctor':
          user = await Doctor.findById(decoded.id).select("-password");
          break;
        case 'patient':
          user = await Patient.findById(decoded.id).select("-password");
          break;
        case 'pharmacist':
          user = await Pharmacist.findById(decoded.id).select("-password");
          break;
      }
    } else {
      // Fallback: try to find user in all collections
      user = await Doctor.findById(decoded.id).select("-password");
      if (user) {
        userType = 'doctor';
      } else {
        user = await Patient.findById(decoded.id).select("-password");
        if (user) {
          userType = 'patient';
        } else {
          user = await Pharmacist.findById(decoded.id).select("-password");
          if (user) {
            userType = 'pharmacist';
          }
        }
      }
    }

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: {
          code: "INVALID_TOKEN",
          message: "Token is not valid or user not found."
        }
      });
    }

    req.user = user;
    req.userType = userType;
    next();
  } catch (error) {
    console.error("Authentication error:", error);

    // Provide specific error messages based on JWT error types
    let errorCode = "INVALID_TOKEN";
    let errorMessage = "Token is not valid.";

    if (error.name === 'JsonWebTokenError') {
      if (error.message.includes('jwt malformed')) {
        errorCode = "MALFORMED_TOKEN";
        errorMessage = "Token format is invalid. Please log in again.";
      } else if (error.message.includes('invalid signature')) {
        errorCode = "INVALID_SIGNATURE";
        errorMessage = "Token signature is invalid. Please log in again.";
      } else {
        errorCode = "JWT_ERROR";
        errorMessage = "Token verification failed. Please log in again.";
      }
    } else if (error.name === 'TokenExpiredError') {
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

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.userType || !roles.includes(req.userType)) {
      return res.status(403).json({ 
        success: false, 
        error: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: `Access denied. Required roles: ${roles.join(', ')}`
        }
      });
    }
    next();
  };
};

// Specific role middlewares for convenience
const requireDoctor = [authenticate, authorize('doctor')];
const requirePatient = [authenticate, authorize('patient')];
const requirePharmacist = [authenticate, authorize('pharmacist')];
const requireDoctorOrPatient = [authenticate, authorize('doctor', 'patient')];
const requireDoctorOrPharmacist = [authenticate, authorize('doctor', 'pharmacist')];

module.exports = {
  authenticate,
  authorize,
  requireDoctor,
  requirePatient,
  requirePharmacist,
  requireDoctorOrPatient,
  requireDoctorOrPharmacist
};