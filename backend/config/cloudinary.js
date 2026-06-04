const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cloudinary storage engine for multer
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith('video');
    return {
      folder: 'brainlink/posts',
      resource_type: isVideo ? 'video' : 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'avi', 'mkv'],
      transformation: isVideo
        ? [{ quality: 'auto' }]
        : [{ quality: 'auto', fetch_format: 'auto' }],
      public_id: `post_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    };
  }
});

// Multer upload middleware (50 MB limit)
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /image\/(jpeg|jpg|png|gif|webp)|video\/(mp4|mov|avi|mkv)/;
    if (allowed.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only images (jpg, png, gif, webp) and videos (mp4, mov, avi, mkv) are allowed'));
  }
});

// Delete a file from Cloudinary by public_id
const deleteFromCloudinary = async (mediaUrl, mediaType = 'image') => {
  if (!mediaUrl) return;
  try {
    // Extract public_id from Cloudinary URL
    // URL format: https://res.cloudinary.com/<cloud>/image/upload/v<version>/<folder>/<public_id>.<ext>
    const urlParts = mediaUrl.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    if (uploadIndex === -1) return;
    // Everything after 'upload/v<version>/' is folder/public_id.ext
    const pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/');
    const publicId = pathAfterUpload.replace(/\.[^/.]+$/, ''); // remove extension
    const resourceType = mediaType === 'video' ? 'video' : 'image';
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.error('Cloudinary delete error:', err.message);
  }
};

module.exports = { cloudinary, upload, deleteFromCloudinary };
