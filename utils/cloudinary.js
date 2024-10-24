const cloudinary = require("cloudinary");
          
cloudinary.config({ 
  cloud_name: "dsp7l7i4e", 
  api_key: "478458651528647",
  api_secret: "Z1qVxAqDzs51O_A9oTcUKi-DJD4"
});

const cloudinaryUploadImage = async(fileToUploads) => {
    return new Promise((resolve) => {
        cloudinary.uploader.upload(fileToUploads, (result) => {
            resolve({
                url: result.secure_url,
            }, {
                resource_type: "auto",
            })
        })
    })
}

module.exports = cloudinaryUploadImage