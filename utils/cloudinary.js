const cloudinary = require("cloudinary");
const fs = require("fs");

cloudinary.config({
  cloud_name: "dsp7l7i4e",
  api_key: "478458651528647",
  api_secret: "Z1qVxAqDzs51O_A9oTcUKi-DJD4",
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

// const uploadPdf = async (filePath) => {
//   return new Promise((resolve, reject) => {
//     cloudinary.uploader.upload_stream(
//       { resource_type: "raw" },
//       async (error, result) => {
//         if (error) {
//           console.error(error);
//           res
//             .status(500)
//             .json({ message: error.message });
//           return;
//         }

//         const pdfCloudinaryPath = result.secure_url;
//       }
//     );
//   });
// };

const uploadPdf = async (filePath) => {
    return new Promise((resolve, reject) => {
        console.log("22222222222222222222222222222222")
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
      console.log("stream=============", stream)
  
      fs.createReadStream(filePath)
      .on('error', (err) => {
        console.error("File read error:", err);
        reject(err); // Reject the promise if file read fails
      })
      .pipe(stream); // Pipe the file stream into Cloudinary upload stream

    console.log("stream=============", stream);
    });
  };

module.exports = { cloudinaryUploadImage, uploadPdf };
