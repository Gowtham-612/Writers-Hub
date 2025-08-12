const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { isAuthenticated } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_PATH || './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.docx', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  }
});

// Upload and extract content from file
router.post('/', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    let extractedContent = '';

    try {
      switch (fileExt) {
        case '.pdf':
          const pdfBuffer = fs.readFileSync(filePath);
          const pdfData = await pdfParse(pdfBuffer);
          extractedContent = pdfData.text;
          break;

        case '.docx':
          const docxBuffer = fs.readFileSync(filePath);
          const docxResult = await mammoth.extractRawText({ buffer: docxBuffer });
          extractedContent = docxResult.value;
          break;

        case '.txt':
          extractedContent = fs.readFileSync(filePath, 'utf8');
          break;

        default:
          return res.status(400).json({ error: 'Unsupported file type' });
      }

      // Clean up the uploaded file
      fs.unlinkSync(filePath);

      // Extract title from filename (remove extension)
      const title = path.basename(req.file.originalname, fileExt);

      res.json({
        title: title,
        content: extractedContent,
        original_filename: req.file.originalname,
        file_size: req.file.size
      });

    } catch (extractionError) {
      // Clean up file on extraction error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw extractionError;
    }

  } catch (error) {
    console.error('Error processing file upload:', error);
    res.status(500).json({ 
      error: 'Failed to process file',
      details: error.message 
    });
  }
});

// Get supported file types
router.get('/supported-types', (req, res) => {
  res.json({
    supported_types: ['.pdf', '.docx', '.txt'],
    max_file_size: process.env.MAX_FILE_SIZE || '10MB'
  });
});

module.exports = router;
