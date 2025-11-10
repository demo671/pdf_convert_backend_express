const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

class CloudflareR2StorageService {
  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID || '';
    const accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';
    const endpoint = process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '');
    
    this.bucket = process.env.R2_BUCKET || 'pdf';

    console.log('[CloudflareR2] 🔧 Initializing R2 Storage Service');
    console.log(`[CloudflareR2] Endpoint: ${endpoint}`);
    console.log(`[CloudflareR2] Bucket: ${this.bucket}`);
    console.log(`[CloudflareR2] Access key: ${accessKeyId ? '✓ ' + accessKeyId.substring(0, Math.min(8, accessKeyId.length)) + '...' : '❌ MISSING'}`);
    console.log(`[CloudflareR2] Secret key: ${secretAccessKey ? '✓ ' + secretAccessKey.substring(0, Math.min(8, secretAccessKey.length)) + '...' : '❌ MISSING'}`);

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      throw new Error('Cloudflare R2 credentials are not configured. Set R2_ENDPOINT, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY');
    }

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: endpoint,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey
      },
      forcePathStyle: true
    });

    console.log('[CloudflareR2] ✓ S3 client initialized successfully');
  }

  async saveOriginalPdf(pdfBuffer, fileName, userEmail) {
    try {
      // Sanitize email for use as folder name
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_').toLowerCase();
      const key = `client/${sanitizedEmail}/${uuidv4()}.pdf`;
      console.log(`[CloudflareR2] 📤 Uploading original PDF: ${key} to bucket: ${this.bucket}`);

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: pdfBuffer,
        ContentType: 'application/pdf'
      });

      const response = await this.s3Client.send(command);
      console.log(`[CloudflareR2] ✅ Original PDF uploaded successfully. ETag: ${response.ETag}`);

      return key;
    } catch (error) {
      console.error('[CloudflareR2] ❌ Upload failed:', error.message);
      throw error;
    }
  }

  async saveProcessedPdf(pdfBuffer, fileName, userEmail) {
    try {
      // Sanitize email for use as folder name
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_').toLowerCase();
      const key = `client/${sanitizedEmail}/pdf_processed/${uuidv4()}.pdf`;
      console.log(`[CloudflareR2] 📤 Uploading processed PDF: ${key} to bucket: ${this.bucket}, Size: ${pdfBuffer.length} bytes`);

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: pdfBuffer,
        ContentType: 'application/pdf'
      });

      const response = await this.s3Client.send(command);
      console.log(`[CloudflareR2] ✅ Processed PDF uploaded successfully`);

      return key;
    } catch (error) {
      console.error('[CloudflareR2] ❌ Processed PDF upload failed:', error.message);
      throw error;
    }
  }

  async getProcessedPdf(filePath) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: filePath
      });

      const response = await this.s3Client.send(command);
      
      // Convert stream to buffer
      const chunks = [];
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      
      return Buffer.concat(chunks);
    } catch (error) {
      console.error('[CloudflareR2] ❌ Download failed:', error.message);
      throw error;
    }
  }

  async deleteFile(filePath) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: filePath
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      console.error('[CloudflareR2] ❌ Delete failed:', error.message);
      return false;
    }
  }

  getTempFilePath(tempId) {
    return `temp/${tempId}.pdf`;
  }

  async copyToSentFolder(sourcePath) {
    try {
      console.log(`[CloudflareR2] 📋 Copying PDF to sent folder: ${sourcePath}`);
      
      // Get the file from source path
      const pdfBuffer = await this.getProcessedPdf(sourcePath);
      
      // Generate new key in sent folder with same UUID from source
      const fileName = sourcePath.split('/').pop(); // Get filename from path
      const sentKey = `sent/${fileName}`;
      
      console.log(`[CloudflareR2] 📤 Uploading to sent folder: ${sentKey}`);
      
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: sentKey,
        Body: pdfBuffer,
        ContentType: 'application/pdf'
      });

      const response = await this.s3Client.send(command);
      console.log(`[CloudflareR2] ✅ PDF copied to sent folder successfully. ETag: ${response.ETag}`);

      return sentKey;
    } catch (error) {
      console.error('[CloudflareR2] ❌ Copy to sent folder failed:', error.message);
      throw error;
    }
  }

  async copyToCompanyFolder(sourcePath, companyName) {
    try {
      // Sanitize company name for use as folder name
      const sanitizedCompanyName = companyName
        .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace invalid chars with underscore
        .replace(/_{2,}/g, '_') // Replace multiple underscores with single
        .toLowerCase();

      console.log(`[CloudflareR2] 📋 Copying PDF to company folder: ${sanitizedCompanyName}`);
      
      // Get the file from source path
      const pdfBuffer = await this.getProcessedPdf(sourcePath);
      
      // Generate new key in company folder with UUID
      const fileName = sourcePath.split('/').pop(); // Get filename from path
      const companyKey = `company/${sanitizedCompanyName}/${fileName}`;
      
      console.log(`[CloudflareR2] 📤 Uploading to company folder: ${companyKey}`);
      
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: companyKey,
        Body: pdfBuffer,
        ContentType: 'application/pdf'
      });

      const response = await this.s3Client.send(command);
      console.log(`[CloudflareR2] ✅ PDF copied to company folder successfully. ETag: ${response.ETag}`);

      return companyKey;
    } catch (error) {
      console.error('[CloudflareR2] ❌ Copy to company folder failed:', error.message);
      throw error;
    }
  }

  async getSentPdf(processedPath) {
    try {
      // Convert processed path to sent path
      const fileName = processedPath.split('/').pop();
      const sentPath = `sent/${fileName}`;
      
      console.log(`[CloudflareR2] 📥 Getting PDF from sent folder: ${sentPath}`);
      
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: sentPath
      });

      const response = await this.s3Client.send(command);
      
      // Convert stream to buffer
      const chunks = [];
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      
      console.log(`[CloudflareR2] ✅ Retrieved PDF from sent folder`);
      return Buffer.concat(chunks);
    } catch (error) {
      console.error('[CloudflareR2] ⚠️ Failed to get from sent folder, falling back to processed folder:', error.message);
      // Fallback to processed folder if sent folder doesn't exist
      return await this.getProcessedPdf(processedPath);
    }
  }

  async getCompanyPdf(processedPath, companyName) {
    try {
      // Sanitize company name
      const sanitizedCompanyName = companyName
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_{2,}/g, '_')
        .toLowerCase();

      // Convert processed path to company folder path
      const fileName = processedPath.split('/').pop();
      const companyPath = `company/${sanitizedCompanyName}/${fileName}`;
      
      console.log(`[CloudflareR2] 📥 Getting PDF from company folder: ${companyPath}`);
      
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: companyPath
      });

      const response = await this.s3Client.send(command);
      
      // Convert stream to buffer
      const chunks = [];
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      
      console.log(`[CloudflareR2] ✅ Retrieved PDF from company folder`);
      return Buffer.concat(chunks);
    } catch (error) {
      console.error('[CloudflareR2] ⚠️ Failed to get from company folder, falling back to processed folder:', error.message);
      // Fallback to processed folder if company folder doesn't exist
      return await this.getProcessedPdf(processedPath);
    }
  }
}

module.exports = new CloudflareR2StorageService();

