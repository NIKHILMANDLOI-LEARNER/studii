const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('../config/cloudinary');

// Ensure local uploads directory exists as fallback
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Memory storage to buffer file in memory before streaming to Cloudinary or disk
const storage = multer.memoryStorage();

// File filter (PDF, DOC, DOCX, PPT, PPTX, Images)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /pdf|doc|docx|ppt|pptx|png|jpg|jpeg|webp/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  
  if (allowedExtensions.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only PDFs, Word documents, Presentations, and Images are allowed.'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter
});

// Helper to upload buffer to Cloudinary with fallback to local file system
const uploadToCloudinary = (fileBuffer, originalname, folder = 'tuition_resources') => {
  return new Promise((resolve, reject) => {
    // If Cloudinary is configured with valid credentials
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          public_id: `${Date.now()}-${path.parse(originalname).name}`
        },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format || path.extname(originalname).replace('.', ''),
            bytes: result.bytes
          });
        }
      );
      uploadStream.end(fileBuffer);
    } else {
      // Local fallback for offline/development testing
      const safeFilename = `${Date.now()}-${originalname.replace(/\s+/g, '_')}`;
      const filePath = path.join(uploadDir, safeFilename);
      fs.writeFileSync(filePath, fileBuffer);
      resolve({
        url: `/uploads/${safeFilename}`,
        publicId: safeFilename,
        format: path.extname(originalname).replace('.', ''),
        bytes: fileBuffer.length
      });
    }
  });
};

module.exports = {
  upload,
  uploadToCloudinary
};
