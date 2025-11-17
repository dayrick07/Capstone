const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, 'uploads', 'valid_ids');

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log(`Created upload directory: ${UPLOAD_DIR}`);
}

// 1. Configure Disk Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Callback specifies the directory path
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        // Reject file
        cb(new Error('Invalid file type. Only images (jpg, png, etc.) are allowed.'), false);
    }
};

// 3. Initialize Multer middleware
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { 
        fileSize: 5 * 1024 * 1024 // Limit files to 5MB
    }
}).single('validId');
module.exports = upload;