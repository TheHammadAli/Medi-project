// middleware/upload.js
const multer = require('multer');
const path = require('path');

// Disk storage for profile images (needed for path-based uploads)
const profileImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Memory storage for medical reports (works fine as-is)
const memoryStorage = multer.memoryStorage();

// File filter for profile images
const imageFileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpg, jpeg, png, gif)'));
  }
};

// File filter for medical reports
const documentFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, image files, and Word documents are allowed'));
  }
};

// File size limits
const limits = {
  fileSize: 10 * 1024 * 1024 // 10MB for medical reports
};

// Profile image upload (5MB limit) - using disk storage
const uploadProfileImage = multer({
  storage: profileImageStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB for profile images
});

// Medical report upload (10MB limit)
const uploadMedicalReport = multer({
  storage: memoryStorage,
  fileFilter: documentFileFilter,
  limits
});

// Multiple medical reports upload
const uploadMultipleReports = multer({
  storage: memoryStorage,
  fileFilter: documentFileFilter,
  limits: {
    ...limits,
    files: 10 // Maximum 10 files at once
  }
}).array('reports', 10);

module.exports = {
  uploadProfileImage,
  uploadMedicalReport,
  uploadMultipleReports
};
