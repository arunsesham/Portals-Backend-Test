import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });

/**
 * Generate a pre-signed URL for uploading a file to S3
 * @param {string} bucket - S3 Bucket name
 * @param {string} key - S3 Key (path)
 * @param {string} contentType - File content type
 * @returns {Promise<string>} - Pre-signed Upload URL
 */
export const generateUploadUrl = async (bucket, key, contentType) => {
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
    });
    return getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour validity
};

/**
 * Generate a pre-signed URL for downloading/viewing a file from S3
 * @param {string} bucket - S3 Bucket name
 * @param {string} key - S3 Key (path)
 * @returns {Promise<string>} - Pre-signed Download URL
 */
export const generateDownloadUrl = async (bucket, key) => {
    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
    });
    return getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour validity
};
