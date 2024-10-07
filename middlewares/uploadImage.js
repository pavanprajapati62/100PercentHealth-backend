const multer = require("multer");
const path = require("path");

// Set storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/images")); // Define the folder where files will be stored
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const fileName = `${Date.now()}-${file.fieldname}${ext}`;
    cb(null, fileName);
  },
});

const fileFilter = (req, file, cb) => {
  console.log("file.mimetype", file.mimetype);
  const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
  if (!allowedTypes.includes(file.mimetype)) {
    const error = new Error("Only images are allowed");
    error.status = 400;
    console.log("error", error);
    return cb(error, false);
  }
  cb(null, true);
};


const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // Limit file size to 5MB
  fileFilter: fileFilter,
});

module.exports = upload;
