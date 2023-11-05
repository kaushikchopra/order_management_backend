import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.S3_REGION;
const bucketName = process.env.AWS_BUCKET_NAME;

// Configure the AWS SDK with your credentials and region
const s3Client = new S3Client({
    region,
    credentials: {
        accessKeyId,
        secretAccessKey
    }
});

export function uploadFile(fileBuffer, fileName, mimetype) {
    const uploadParams = {
        Bucket: bucketName,
        Body: fileBuffer,
        Key: fileName,
        ContentType: mimetype
    }

    return s3Client.send(new PutObjectCommand(uploadParams));
}

export function deleteFile(fileName) {
    const deleteParams = {
        Bucket: bucketName,
        Key: fileName,
    }

    return s3Client.send(new DeleteObjectCommand(deleteParams));
}