const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

/**
 * Python-based image extractor using PyMuPDF (fitz)
 * Provides high-quality image extraction with proper handling of color spaces, masks, and compression
 */
class PythonImageExtractor {
  constructor() {
    this.pythonScript = path.join(__dirname, '../../scripts/extract_pdf_images.py');
    this.pythonCommand = 'python'; // Use 'python3' on Linux/Mac if needed
  }

  /**
   * Extract images from a PDF using PyMuPDF
   * Returns images as buffers (no disk save)
   * @param {Buffer} pdfBuffer - PDF file as buffer
   * @param {string} originalFileName - Original filename (not used anymore, kept for compatibility)
   * @returns {Promise<Array>} Array of extracted image objects
   */
  async extractImages(pdfBuffer, originalFileName) {
    // Create temporary PDF file
    const tempDir = path.join(__dirname, '../../temp');
    await fs.mkdir(tempDir, { recursive: true });

    const timestamp = Date.now();
    const tempPdfPath = path.join(tempDir, `temp_${timestamp}.pdf`);

    // Output dir is not used anymore but still passed to Python script for compatibility
    const outputDir = '/tmp/unused';

    try {
      // Write PDF buffer to temp file
      await fs.writeFile(tempPdfPath, pdfBuffer);

      // Execute Python script
      const result = await this._executePythonScript(tempPdfPath, outputDir);

      if (!result.success) {
        throw new Error(`Python extraction failed: ${result.error}`);
      }

      // Convert base64 data to buffers (no disk read)
      const images = [];
      for (const imageInfo of result.images) {
        try {
          // Convert base64 string to Buffer
          const imageBuffer = Buffer.from(imageInfo.base64, 'base64');

          images.push({
            buffer: imageBuffer,
            type: imageInfo.mimeType,
            page: imageInfo.page,
            width: imageInfo.width,
            height: imageInfo.height,
            format: imageInfo.format,
            colorspace: imageInfo.colorspace,
            size: imageInfo.size
          });
        } catch (decodeError) {
          console.error(`Failed to decode base64 image data:`, decodeError);
        }
      }

      return images;

    } finally {
      // Clean up temporary PDF file
      try {
        await fs.unlink(tempPdfPath);
      } catch (cleanupError) {
        console.error('Failed to clean up temp PDF:', cleanupError);
      }
    }
  }

  /**
   * Execute Python script and parse JSON output
   * @private
   */
  _executePythonScript(pdfPath, outputDir) {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn(this.pythonCommand, [
        this.pythonScript,
        pdfPath,
        outputDir
      ]);

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (stderr) {
          console.error('Python script warnings/errors:', stderr);
        }

        if (code !== 0) {
          return reject(new Error(`Python script exited with code ${code}: ${stderr}`));
        }

        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (parseError) {
          reject(new Error(`Failed to parse Python script output: ${parseError.message}\nOutput: ${stdout}`));
        }
      });

      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to spawn Python process: ${error.message}. Make sure Python and PyMuPDF are installed.`));
      });
    });
  }

  /**
   * Check if Python and required packages are available
   * @returns {Promise<Object>} Status object with availability info
   */
  async checkAvailability() {
    return new Promise((resolve) => {
      const pythonProcess = spawn(this.pythonCommand, ['-c', 'import fitz; print("OK")']);

      let output = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0 && output.includes('OK')) {
          resolve({
            available: true,
            message: 'PyMuPDF is installed and ready'
          });
        } else {
          resolve({
            available: false,
            message: 'PyMuPDF not found. Install with: pip install -r requirements.txt'
          });
        }
      });

      pythonProcess.on('error', () => {
        resolve({
          available: false,
          message: 'Python not found. Please install Python 3.7 or higher.'
        });
      });
    });
  }
}

module.exports = new PythonImageExtractor();
