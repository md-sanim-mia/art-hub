import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinaryUpload } from "./cloudinary.config";
import multer from "multer";
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinaryUpload,
  params: (req, file) => {
    return {
      folder: "uploads/images",
      resource_type: "image",
      allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
      transformation: [{ quality: "auto", fetch_format: "auto" }],
      public_id: `img_${Date.now()}_${Math.random().toString(36).substring(2)}`
    };
  },
});

const pdfStorage = new CloudinaryStorage({
  cloudinary: cloudinaryUpload,
  params: (req, file) => {
    return {
      folder: "uploads/pdfs",
      resource_type: "raw",
      allowed_formats: ["pdf"],
      public_id: `pdf_${Date.now()}_${Math.random().toString(36).substring(2)}`
    };
  },
});

const audioStorage = new CloudinaryStorage({
  cloudinary: cloudinaryUpload,
  params: (req, file) => {
    return {
      folder: "uploads/audios",
      resource_type: "video", 
      allowed_formats: ["mp3", "wav", "ogg", "m4a", "flac", "aac"],
      public_id: `audio_${Date.now()}_${Math.random().toString(36).substring(2)}`
    };
  },
});

export const audioUpload = multer({
  storage: audioStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, 
  },
  fileFilter: (req, file, cb) => {
    const audioTypes = [
      "audio/mpeg", 
      "audio/mp3",
      "audio/wav", 
      "audio/ogg", 
      "audio/mp4",
      "audio/x-m4a",
      "audio/flac",
      "audio/aac"
    ];
    if (audioTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only audio files (MP3, WAV, OGG, M4A, FLAC, AAC) are allowed") as unknown as null, false);
    }
  },
});

const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinaryUpload,
  params: (req, file) => {
    console.log("📹 Video storage params called");
    console.log("File:", file.originalname, file.mimetype);
    return {
      folder: "uploads/videos",
      resource_type: "video",
      allowed_formats: ["mp4", "avi", "mov", "mkv", "webm"],
      chunk_size: 6000000,
      public_id: `video_${Date.now()}_${Math.random().toString(36).substring(2)}`
    };
  },
});

export const imageUpload = multer({
  storage: imageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const imageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    
    if (imageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (JPEG, PNG, GIF, WebP) are allowed") as unknown as null, false);
    }
  },
});

export const pdfUpload = multer({
  storage: pdfStorage,
  limits: {
    fileSize: 20 * 1024 * 1024, 
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed") as unknown as null, false);
    }
  },
});

export const videoUpload = multer({
  storage: videoStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, 
  },
  fileFilter: (req, file, cb) => {
    
    
    const videoTypes = ["video/mp4", "video/avi", "video/quicktime", "video/x-matroska", "video/webm"];
    
    if (videoTypes.includes(file.mimetype)) {
      console.log("✅ File type accepted");
      cb(null, true);
    } else {
      console.log("❌ File type rejected");
      cb(new Error("Only video files (MP4, AVI, MOV, MKV, WebM) are allowed") as unknown as null, false);
    }
  },
});