import multer, { StorageEngine, Multer } from 'multer';
import path from 'path';
import fs from 'fs';

/**
 * Configure multer for audio file uploads
 */

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads/audio');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const audioStorage: StorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Store with student ID and timestamp
    const studentId = (req as any).user?.userId || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `audio-${studentId}-${timestamp}${ext}`;
    cb(null, filename);
  },
});

// Configure file filter
const audioFileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  // Accept audio file types
  const audioMimetypes = [
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/mp4',
    'audio/webm',
  ];

  if (audioMimetypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Supported: ${audioMimetypes.join(', ')}`), false);
  }
};

/**
 * Audio upload middleware
 * Accepts single audio file, max 25MB
 */
export const audioUpload: Multer = multer({
  storage: audioStorage,
  fileFilter: audioFileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max
  },
});

/**
 * Get the path where audio files are stored
 */
export function getAudioUploadsDir(): string {
  return uploadsDir;
}

/**
 * Get the URL path for an uploaded audio file
 */
export function getAudioFilePath(filename: string): string {
  return path.join(uploadsDir, filename);
}

/**
 * Delete audio file (for cleanup)
 */
export function deleteAudioFile(filename: string): boolean {
  try {
    const filePath = getAudioFilePath(filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting audio file:', error);
    return false;
  }
}
