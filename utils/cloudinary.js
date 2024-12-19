const cloudinary = require("cloudinary");
const fs = require("fs");

cloudinary.config({
  // cloud_name: "dqok82hhy",
  // api_key: "315381883713581",
  // api_secret: "UAwvaQ1JK8x8e_X6nNhh0H8ujmg",
  cloud_name:"diwtdktzc",
  api_key:"211218781222369",
  api_secret:"xbPZxQl7qFKX9nJXuTeMQ6wzXNA",
});

const cloudinaryUploadImage = async (fileToUploads) => {
  return new Promise((resolve) => {
    cloudinary.uploader.upload(fileToUploads, (result) => {
      resolve(
        {
          url: result.secure_url,
        },
        {
          resource_type: "auto",
        }
      );
    });
  });
};

const uploadPdf = async (filePath) => {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "raw" },
        (error, result) => {
          if (error) {
            console.error("Upload error:", error);
            return reject(new Error(error.message)); // Rejects the promise on error
          }
          resolve(result.secure_url); // Resolves with the secure URL on success
        }
      );
  
      fs.createReadStream(filePath)
      .on('error', (err) => {
        console.error("File read error:", err);
        reject(err); // Reject the promise if file read fails
      })
      .pipe(stream); // Pipe the file stream into Cloudinary upload stream
    });
  };

module.exports = { cloudinaryUploadImage, uploadPdf };
