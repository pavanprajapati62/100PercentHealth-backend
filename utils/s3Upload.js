const AWS = require('aws-sdk');
const fs = require('fs');
AWS.config.update({
  httpOptions: { agent: new require('https').Agent({ rejectUnauthorized: false }) }
});

const cfg = {
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET,
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT
};

const s3 = new AWS.S3(cfg);
const BUCKET = process.env.S3_BUCKET;


const uploadToS3 = async (buffer, fileName) => {
  const params = {
    Bucket: BUCKET,  
    Key: `pdfs/${Date.now()}_${fileName}`,  
    Body: buffer,
    ContentType: 'application/pdf',  
    ACL: 'public-read', 
  };

  try {
    const result = await s3.upload(params).promise();
    return result.Location; 
  } catch (error) {
    console.error('Error uploading PDF to S3:', error);
    throw new Error(error.message);
  }
};

function getContentTypeForImage(fileName) {
  const extension = fileName.split('.').pop().toLowerCase();
  
  switch (extension) {
    case 'jpeg':
    case 'jpg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    default:
      return 'application/octet-stream'; 
  }
}
// Upload image to S3
const s3UploadImage = async (fileToUpload) => {
  try {
    const fileStream = fs.createReadStream(fileToUpload);

    const value = fileToUpload.split('/').pop()
    const valueType = value.split('.').pop()
let uploadParams= {};
    if(valueType === 'pdf' || valueType === 'PDF') {
       uploadParams = {
        Bucket: BUCKET,
        Key: `Prescription/${fileToUpload.split('/').pop()}`, 
        Body: fileStream,
        ContentType: 'application/pdf',  
        ACL: 'public-read', 
      };
    } else {
      uploadParams = {
        Bucket: BUCKET,
        Key: `Prescription/${fileToUpload.split('/').pop()}`, 
        Body: fileStream,
        ContentType: getContentTypeForImage(fileToUpload),  
        ACL: 'public-read', 
      };
    }
    
    const result = await s3.upload(uploadParams).promise();
    return { url: result.Location };
  } catch (error) {
    console.error('Upload Image Error:', error);
    throw new Error(error.message);
  }
};
// Upload PDF to S3
const uploadPdf = async (filePath) => {
  try {
    const fileStream = fs.createReadStream(filePath);
    const uploadParams = {
      Bucket: BUCKET,
      Key: `pdfs/${Date.now()}_${filePath}`,
      Body: fileStream,
      ContentType: 'application/pdf',
      ACL: 'public-read',
    };

    const result = await s3.upload(uploadParams).promise();
    return result.Location; // Return the URL of the uploaded PDF
  } catch (error) {
    console.error('Upload PDF Error:', error);
    throw new Error(error.message);
  }
};

// // Example usage
// (async () => {
//   try {
//     const imageUploadResult = await cloudinaryUploadImage('path/to/image.jpg');
//     console.log('Image uploaded to:', imageUploadResult.url);

//     const pdfUploadResult = await uploadPdf('path/to/file.pdf');
//     console.log('PDF uploaded to:', pdfUploadResult);
//   } catch (error) {
//     console.error('Error during upload:', error);
//   }
// })();

module.exports = { s3UploadImage, uploadPdf, uploadToS3 };
