import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary is considered configured only when real credentials are present
// (i.e. not the placeholder values shipped in .env / .env.example).
const isCloudinaryConfigured = () => {
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  return Boolean(
    name && key && secret &&
    !name.startsWith('your_') &&
    !key.startsWith('your_') &&
    !secret.startsWith('your_')
  );
};

const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

/**
 * Saves an uploaded image buffer.
 * - Uses Cloudinary when valid credentials are configured.
 * - Otherwise falls back to local disk storage under server/uploads so the
 *   application remains fully functional offline.
 *
 * @param {Buffer} fileBuffer
 * @param {string} originalName  - original file name (used for extension hint)
 * @param {string} [mimetype]    - mime type reported by multer
 * @returns {Promise<string>} a publicly reachable URL for the image
 */
export const uploadToCloudinary = (fileBuffer, originalName, mimetype) => {
  return new Promise((resolve, reject) => {
    if (isCloudinaryConfigured()) {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'civicconnect/issues',
          resource_type: 'image',
          public_id: `issue_${Date.now()}_${(originalName || 'img').replace(/\.[^/.]+$/, '')}`,
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      );
      stream.end(fileBuffer);
      return;
    }

    // Offline / local fallback: persist to disk and serve statically.
    try {
      const uploadsDir = path.resolve(__dirname, '../../uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      const ext = EXT_BY_MIME[mimetype] || path.extname(originalName || '') || '.jpg';
      const filename = `issue_${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`;
      fs.writeFileSync(path.join(uploadsDir, filename), fileBuffer);

      const base = (process.env.SERVER_URL || 'http://localhost:5001').replace(/\/$/, '');
      resolve(`${base}/uploads/${filename}`);
    } catch (err) {
      reject(err);
    }
  });
};

export { isCloudinaryConfigured };
export default cloudinary;
