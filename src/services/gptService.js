const OpenAI = require('openai');

class GptService {
  constructor() {
    // Delay OpenAI client initialization until first use
    this.client = null;
    this.model = null;
  }

  /**
   * Initialize OpenAI client (lazy initialization)
   */
  initializeClient() {
    if (!this.client) {
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === '') {
        throw new Error('OPENAI_API_KEY environment variable is not set');
      }
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      this.model = process.env.OPENAI_MODEL || 'gpt-4o';
      console.log(`[GptService] ✅ OpenAI client initialized with model: ${this.model}`);
    }
  }

  /**
   * Extract and structure text using GPT (for PDFs with no images)
   * @param {string} extractedText - Text extracted from PDF using library
   * @returns {Promise<Object>} - Structured data {title, mainData, contactInfo}
   */
  async structureTextWithGpt(extractedText) {
    try {
      // Initialize client if not already initialized
      this.initializeClient();

      console.log('[GptService] 📝 Structuring text with GPT (no images, text-only)...');
      console.log(`[GptService] 📝 Input text length: ${extractedText.length} characters`);

      const startTime = Date.now();

      // Send text to GPT for structuring
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a document processing assistant. Your task is to analyze document text and extract structured information.'
          },
          {
            role: 'user',
            content: `Please analyze the following document text and organize it into three sections:

1. TITLE: The main title or heading of the document (usually at the beginning or most prominent)
2. MAIN_DATA: All the important body content and data
   CRITICAL: DO NOT include ANY email addresses or phone numbers in MAIN_DATA
   CRITICAL: Email and phone belong ONLY in CONTACT_INFO section
3. CONTACT_INFO: ONLY email addresses and phone numbers (no other data, no labels)

Format your response EXACTLY like this:
===TITLE===
[extracted title text here]
===MAIN_DATA===
[extracted main content here - NO email, NO phone numbers]
===CONTACT_INFO===
[only email and phone, no labels]

Document text:
${extractedText}`
          }
        ],
        max_tokens: 4096,
        temperature: 0.3
      });

      const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
      const gptResponse = response.choices[0]?.message?.content || '';

      console.log(`[GptService] ✅ GPT text structuring completed in ${processingTime}s`);
      console.log(`[GptService] 📊 Response length: ${gptResponse.length} characters`);

      // Parse structured response
      const structured = this.parseStructuredResponse(gptResponse);

      console.log(`[GptService] 📊 Structured - Title: ${structured.title.length} chars, Main: ${structured.mainData.length} chars, Contact: ${structured.contactInfo.length} chars`);

      return structured;

    } catch (error) {
      console.error('[GptService] ❌ GPT text structuring failed:', error.message);
      console.error('[GptService] ❌ Stack:', error.stack);
      // Return empty structure on error
      return { title: '', mainData: extractedText, contactInfo: '' };
    }
  }

  /**
   * Extract text from PDF by converting pages to images and sending to GPT Vision
   * NOTE: GPT Vision API does NOT accept PDFs directly - only images
   * @param {Buffer} pdfBuffer - Complete PDF buffer
   * @returns {Promise<string>} - Extracted text from all pages
   */
  async extractTextFromPdfPages(pdfBuffer) {
    try {
      // Initialize client if not already initialized
      this.initializeClient();

      console.log('');
      console.log('[GptService] 📄 === EXTRACTING TEXT FROM PDF USING GPT VISION ===');
      console.log(`[GptService] 📄 PDF size: ${(pdfBuffer.length / 1024).toFixed(2)}KB`);
      console.log(`[GptService] ℹ Note: Converting PDF pages to images for GPT Vision`);

      // Load PDF using pdf-lib
      const PDFDocument = require('pdf-lib').PDFDocument;
      const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();
      const pageCount = pages.length;

      console.log(`[GptService] 📄 PDF has ${pageCount} page(s)`);

      // Limit pages to process
      const maxPages = 10;
      const pagesToProcess = Math.min(pageCount, maxPages);

      if (pageCount > maxPages) {
        console.warn(`[GptService] ⚠️ PDF has ${pageCount} pages, processing only first ${maxPages}`);
      }

      console.log(`[GptService] 📄 Processing ${pagesToProcess} page(s)...`);

      const allText = [];
      let successCount = 0;
      let failCount = 0;

      // Process each page
      for (let i = 0; i < pagesToProcess; i++) {
        console.log('');
        console.log(`[GptService] 📄 Processing page ${i + 1}/${pagesToProcess}...`);

        try {
          // Create a new PDF with just this page
          const singlePagePdf = await PDFDocument.create();
          const [copiedPage] = await singlePagePdf.copyPages(pdfDoc, [i]);
          singlePagePdf.addPage(copiedPage);

          // Save as buffer
          const pageBuffer = Buffer.from(await singlePagePdf.save());
          const pageSizeKB = (pageBuffer.length / 1024).toFixed(2);
          console.log(`[GptService] 📄 Page ${i + 1} size: ${pageSizeKB}KB`);

          // Convert to base64
          const base64Page = pageBuffer.toString('base64');
          const dataUrl = `data:application/pdf;base64,${base64Page}`;

          console.log(`[GptService] 🤖 Sending page ${i + 1} to GPT Vision...`);

          const startTime = Date.now();

          // Send to GPT Vision
          const response = await this.client.chat.completions.create({
            model: this.model,
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: 'Please extract ALL text from this images. Return only the all extracted text.please gimme title and main data and contact info'
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: dataUrl,
                      detail: 'high'
                    }
                  }
                ]
              }
            ],
            max_tokens: 10000,
            timeout: 60000
          });

          const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
          const pageText = response.choices[0]?.message?.content || '';

          if (pageText && pageText.trim().length > 0) {
            allText.push(`--- Page ${i + 1} ---\n${pageText}`);
            successCount++;
            console.log(`[GptService] ✅ Page ${i + 1}: Extracted ${pageText.length} characters in ${processingTime}s`);
          } else {
            failCount++;
            console.warn(`[GptService] ⚠️ Page ${i + 1}: No text extracted`);
          }

        } catch (pageError) {
          failCount++;
          console.error(`[GptService] ❌ Page ${i + 1} failed:`, pageError.message);

          // If too many failures, stop
          if (failCount >= 3 && successCount === 0) {
            console.error(`[GptService] ❌ Too many consecutive failures, stopping`);
            throw new Error('Multiple page processing failures');
          }
        }
      }

      // Combine all text
      const combinedText = allText.join('\n\n');

      console.log('');
      console.log('[GptService] ✅ === GPT VISION PROCESSING COMPLETE ===');
      console.log(`[GptService] 📊 Pages processed: ${successCount} successful, ${failCount} failed`);
      console.log(`[GptService] 📊 Total text extracted: ${combinedText.length} characters`);
      console.log('');

      if (successCount === 0) {
        throw new Error('No pages were successfully processed');
      }

      return combinedText;

    } catch (error) {
      console.error('');
      console.error('[GptService] ❌ Failed to extract text from PDF pages:', error.message);
      console.error('');
      throw new Error(`GPT PDF text extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text from an image using GPT Vision API
   * Handles handwritten and printed text
   * @param {Buffer} imageBuffer - Image buffer (PNG, JPG, etc.)
   * @param {string} imageType - Image MIME type (e.g., 'image/png')
   * @returns {Promise<Object>} - Extracted structured data {title, mainData, contactInfo}
   */
  async extractTextFromImage(imageBuffer, imageType = 'image/png') {
    try {
      // Initialize client if not already initialized
      this.initializeClient();

      console.log(`[GptService] 🔍 Extracting text from image using ${this.model}...`);
      console.log(`[GptService] 🔍 Image type: ${imageType}`);

      // Check image size (OpenAI has 20MB limit for images)
      const imageSizeMB = imageBuffer.length / (1024 * 1024);
      const maxSizeMB = 15; // Use 15MB to be safe

      if (imageSizeMB > maxSizeMB) {
        console.warn(`[GptService] ⚠️ Image too large (${imageSizeMB.toFixed(2)}MB > ${maxSizeMB}MB), skipping GPT extraction`);
        throw new Error(`Image size ${imageSizeMB.toFixed(2)}MB exceeds maximum ${maxSizeMB}MB`);
      }

      console.log(`[GptService] ℹ️ Image size: ${imageSizeMB.toFixed(2)}MB`);

      // Convert image buffer to base64
      const base64Image = imageBuffer.toString('base64');
      const dataUrl = `data:${imageType};base64,${base64Image}`;

      console.log('');
      console.log('========================================');
      console.log('[GptService] 📤 SENDING TO GPT VISION API');
      console.log('========================================');
      console.log(`[GptService] 📊 API Endpoint: OpenAI Chat Completions`);
      console.log(`[GptService] 📊 Model: ${this.model}`);
      console.log(`[GptService] 📊 Image Type: ${imageType}`);
      console.log(`[GptService] 📊 Image Size: ${imageSizeMB.toFixed(2)}MB`);
      console.log(`[GptService] 📊 Base64 Data URL length: ${dataUrl.length} chars`);
      console.log(`[GptService] 📊 Max Tokens: 4096`);
      console.log(`[GptService] 📊 Detail Level: high`);
      console.log(`[GptService] 📊 Prompt: "Extract ALL text from this image and organize it into three sections..."`);
      console.log('[GptService] 📤 Sending request now...');
      console.log('========================================');

      const startTime = Date.now();

      // Call GPT Vision API with structured prompt
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are a professional OCR (Optical Character Recognition) assistant. Your task is to extract ALL visible text from this image, even if it's unclear or low quality.

IMPORTANT INSTRUCTIONS:
- Extract ALL text you can see, even if blurry or partially visible
- If text is unclear, make your best effort to read it
- Include numbers, dates, amounts, names, addresses
- Do NOT say the image is unclear - just extract what you can see
- If you can't read specific words, use [?] for those words only
- Extract text in the order it appears (top to bottom, left to right)

Organize the extracted text into THREE sections:

1. TITLE: The main heading or title (usually largest text at top)
2. MAIN_DATA: All body content, data, descriptions, amounts, dates
   CRITICAL: NEVER include email addresses or phone numbers in this section
   CRITICAL: All email and phone MUST go to CONTACT_INFO section ONLY
3. CONTACT_INFO: ONLY email addresses and phone numbers (nothing else)

Format your response EXACTLY like this:
===TITLE===
[extracted title text here]
===MAIN_DATA===
[extracted main content here]
===CONTACT_INFO===
[extracted contact information here]

Extract all visible text now, including handwritten and printed text.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl,
                  detail: 'high' // Request high-detail analysis
                }
              }
            ]
          }
        ],
        max_tokens: 4096
      });

      const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log('');
      console.log('========================================');
      console.log('[GptService] 📥 RECEIVED GPT RESPONSE');
      console.log('========================================');
      console.log(`[GptService] ⏱️ Processing Time: ${processingTime}s`);
      console.log(`[GptService] 📊 Response ID: ${response.id || 'N/A'}`);
      console.log(`[GptService] 📊 Model Used: ${response.model || 'N/A'}`);
      console.log(`[GptService] 📊 Finish Reason: ${response.choices[0]?.finish_reason || 'N/A'}`);

      const extractedText = response.choices[0]?.message?.content || '';

      if (extractedText && extractedText.trim().length > 0) {
        console.log(`[GptService] ✅ SUCCESS: Extracted ${extractedText.length} characters`);
        console.log(`[GptService] 📄 Raw Response Preview (first 200 chars):`);
        console.log(`[GptService] "${extractedText.substring(0, 200)}..."`);
        console.log('========================================');
        console.log('');

        // Parse structured response
        const structured = this.parseStructuredResponse(extractedText);
        
        console.log('[GptService] 📊 Parsed Structured Data:');
        console.log(`[GptService]   - Title: ${structured.title.length} chars`);
        console.log(`[GptService]   - Main Data: ${structured.mainData.length} chars`);
        console.log(`[GptService]   - Contact Info: ${structured.contactInfo.length} chars`);
        if (structured.title) {
          console.log(`[GptService]   - Title Preview: "${structured.title.substring(0, 50)}..."`);
        }
        console.log('');
        
        return structured;
      } else {
        console.warn('========================================');
        console.warn(`[GptService] ⚠️ WARNING: GPT returned empty response`);
        console.warn('========================================');
        console.warn('');
        return { title: '', mainData: '', contactInfo: '' };
      }

      return extractedText;
    } catch (error) {
      // Provide more specific error messages
      console.error('[GptService] ❌ === GPT VISION ERROR ===');
      console.error('[GptService] ❌ Error type:', error.constructor.name);
      console.error('[GptService] ❌ Error message:', error.message);

      if (error.response) {
        console.error('[GptService] ❌ Response status:', error.response.status);
        console.error('[GptService] ❌ Response data:', JSON.stringify(error.response.data, null, 2));
      }

      if (error.stack) {
        console.error('[GptService] ❌ Stack trace:', error.stack);
      }

      let errorMessage = error.message;

      if (error.message.includes('timeout')) {
        errorMessage = 'GPT Vision API timeout - image processing took too long';
      } else if (error.message.includes('rate_limit') || error.status === 429) {
        errorMessage = 'OpenAI rate limit exceeded - please try again later';
      } else if (error.message.includes('invalid_api_key') || error.status === 401) {
        errorMessage = 'Invalid OpenAI API key - please check configuration';
      } else if (error.message.includes('insufficient_quota') || error.status === 403) {
        errorMessage = 'OpenAI quota exceeded - please check your account';
      } else if (error.status === 400) {
        errorMessage = 'Bad request to OpenAI API - check image format and size';
      }

      console.error('[GptService] ❌ Processed error message:', errorMessage);
      throw new Error(`GPT text extraction failed: ${errorMessage}`);
    }
  }

  /**
   * Parse GPT's structured response
   * @param {string} text - GPT response text
   * @returns {Object} - {title, mainData, contactInfo}
   */
  parseStructuredResponse(text) {
    const result = {
      title: '',
      mainData: '',
      contactInfo: ''
    };

    try {
      // Extract sections using regex
      const titleMatch = text.match(/===TITLE===\s*([\s\S]*?)(?:===MAIN_DATA===|$)/i);
      const mainDataMatch = text.match(/===MAIN_DATA===\s*([\s\S]*?)(?:===CONTACT_INFO===|$)/i);
      const contactMatch = text.match(/===CONTACT_INFO===\s*([\s\S]*?)$/i);

      if (titleMatch && titleMatch[1]) {
        result.title = titleMatch[1].trim();
      }

      if (mainDataMatch && mainDataMatch[1]) {
        result.mainData = mainDataMatch[1].trim();
      }

      if (contactMatch && contactMatch[1]) {
        result.contactInfo = contactMatch[1].trim();
      }

      console.log(`[GptService] 📊 Parsed - Title: ${result.title.length} chars, Main: ${result.mainData.length} chars, Contact: ${result.contactInfo.length} chars`);

    } catch (parseError) {
      console.warn(`[GptService] ⚠️ Failed to parse structured response, using raw text`);
      result.mainData = text; // Fallback to putting everything in mainData
    }

    return result;
  }

  /**
   * Extract text from multiple images
   * CRITICAL: This function NEVER throws errors - always returns a result
   * @param {Array<{buffer: Buffer, type: string, page: number}>} images - Array of image objects
   * @returns {Promise<Object>} - Combined structured data {title, mainData, contactInfo}
   */
  async extractTextFromMultipleImages(images) {
    try {
      console.log('');
      console.log('[GptService] 🤖 === GPT VISION PROCESSING STARTED ===');
      console.log(`[GptService] 📊 Total images to process: ${images.length}`);

      // Validate input
      if (!images || images.length === 0) {
        console.warn(`[GptService] ⚠️ No images provided to process`);
        console.log('');
        return { title: '', mainData: '', contactInfo: '' };
      }

      // Limit number of images to process (to avoid excessive API costs)
      const maxImages = 20;
      const imagesToProcess = images.slice(0, maxImages);

      if (images.length > maxImages) {
        console.warn(`[GptService] ⚠️ Too many images (${images.length}), processing only first ${maxImages}`);
      }

      console.log(`[GptService] 📊 Images to process: ${imagesToProcess.length}`);
      console.log('');

      const structuredResults = [];
      let successCount = 0;
      let failCount = 0;
      let consecutiveFailures = 0;

      for (let i = 0; i < imagesToProcess.length; i++) {
        const image = imagesToProcess[i];
        const imageSizeMB = (image.buffer.length / (1024 * 1024)).toFixed(2);

        console.log('');
        console.log('========================================');
        console.log(`[GptService] 📤 SENDING IMAGE ${i + 1}/${imagesToProcess.length} TO GPT`);
        console.log('========================================');
        console.log(`[GptService] 📊 Page Number: ${image.page || 'unknown'}`);
        console.log(`[GptService] 📊 Image Type: ${image.type}`);
        console.log(`[GptService] 📊 Image Size: ${imageSizeMB}MB (${image.buffer.length} bytes)`);
        console.log(`[GptService] 📊 Model: ${this.model || 'gpt-4o'}`);
        console.log(`[GptService] 📊 Expected Token Cost: ~${Math.ceil(image.buffer.length / 4096)} tokens`);
        console.log('[GptService] 🚀 Initiating API call...');

        const startTime = Date.now();

        try {
          const structured = await this.extractTextFromImage(image.buffer, image.type);
          const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

          const totalChars = structured.title.length + structured.mainData.length + structured.contactInfo.length;

          console.log('========================================');
          if (totalChars > 0) {
            structuredResults.push(structured);
            successCount++;
            consecutiveFailures = 0; // Reset consecutive failures
            console.log(`[GptService] ✅ IMAGE ${i + 1} SUCCESS!`);
            console.log(`[GptService] ⏱️ Processing Time: ${processingTime}s`);
            console.log(`[GptService] 📊 Total Characters Extracted: ${totalChars}`);
            console.log(`[GptService] 📊 Breakdown:`);
            console.log(`[GptService]   - Title: ${structured.title.length} chars`);
            console.log(`[GptService]   - Main Data: ${structured.mainData.length} chars`);
            console.log(`[GptService]   - Contact Info: ${structured.contactInfo.length} chars`);
            if (structured.title) {
              console.log(`[GptService] 📄 Title: "${structured.title.substring(0, 80)}..."`);
            }
            console.log('========================================');
          } else {
            console.warn(`[GptService] ⚠️ IMAGE ${i + 1} WARNING`);
            console.warn(`[GptService] ⏱️ Processing Time: ${processingTime}s`);
            console.warn(`[GptService] ⚠️ No text extracted from this image`);
            console.warn('========================================');
            failCount++;
            consecutiveFailures++;
          }
        } catch (imageError) {
          const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
          console.error('========================================');
          console.error(`[GptService] ❌ IMAGE ${i + 1} FAILED`);
          console.error('========================================');
          console.error(`[GptService] ⏱️ Processing Time: ${processingTime}s`);
          console.error(`[GptService] ❌ Error Type: ${imageError.name || 'Unknown'}`);
          console.error(`[GptService] ❌ Error Message: ${imageError.message}`);
          if (imageError.status) {
            console.error(`[GptService] ❌ HTTP Status: ${imageError.status}`);
          }
          if (imageError.code) {
            console.error(`[GptService] ❌ Error Code: ${imageError.code}`);
          }
          console.error('========================================');
          failCount++;
          consecutiveFailures++;

          // If too many consecutive failures, stop processing remaining images
          if (consecutiveFailures >= 3 && successCount === 0) {
            console.error('');
            console.error(`[GptService] ❌ === STOPPING IMAGE PROCESSING ===`);
            console.error(`[GptService] ❌ Too many consecutive failures (${consecutiveFailures})`);
            console.error(`[GptService] ❌ Processed ${i + 1}/${imagesToProcess.length} images before stopping`);
            console.error(`[GptService] ❌ This is likely an API key or quota issue`);
            break; // Exit loop instead of throwing
          }
        }
      }

      console.log('');
      console.log('========================================');
      console.log('[GptService] 🎯 GPT VISION PROCESSING COMPLETE');
      console.log('========================================');
      console.log(`[GptService] 📊 Total Images Processed: ${imagesToProcess.length}`);
      console.log(`[GptService] ✅ Successful: ${successCount}`);
      console.log(`[GptService] ❌ Failed: ${failCount}`);
      console.log(`[GptService] 📈 Success Rate: ${((successCount / imagesToProcess.length) * 100).toFixed(1)}%`);

      // Combine all structured results
      const combined = {
        title: '',
        mainData: '',
        contactInfo: ''
      };

      // Use title from first page, combine mainData, combine contactInfo
      if (structuredResults.length > 0) {
        combined.title = structuredResults[0].title; // Use first page title
        combined.mainData = structuredResults.map(r => r.mainData).filter(d => d).join('\n\n');
        combined.contactInfo = structuredResults.map(r => r.contactInfo).filter(c => c).join(' | ');
      }

      console.log('');
      console.log('[GptService] 📊 COMBINED RESULTS:');
      console.log(`[GptService]   - Title: ${combined.title.length} chars`);
      console.log(`[GptService]   - Main Data: ${combined.mainData.length} chars`);
      console.log(`[GptService]   - Contact Info: ${combined.contactInfo.length} chars`);
      console.log(`[GptService]   - Total: ${combined.title.length + combined.mainData.length + combined.contactInfo.length} chars`);
      
      if (combined.title) {
        console.log(`[GptService] 📄 Final Title: "${combined.title.substring(0, 100)}..."`);
      }
      console.log('========================================');

      // CRITICAL: Always return a result, even if all images failed
      if (successCount === 0) {
        console.warn('');
        console.warn('========================================');
        console.warn('[GptService] ⚠️ ZERO SUCCESS WARNING');
        console.warn('========================================');
        console.warn(`[GptService] ⚠️ No images were successfully processed (0/${imagesToProcess.length})`);
        console.warn(`[GptService] 💡 Possible Issues:`);
        console.warn(`[GptService]    1. OpenAI API key not configured`);
        console.warn(`[GptService]    2. OpenAI quota exceeded`);
        console.warn(`[GptService]    3. Network connectivity issues`);
        console.warn(`[GptService]    4. Invalid model specified`);
        console.warn('========================================');
        console.warn('');
        return { title: '', mainData: '', contactInfo: '' };
      }

      if (failCount > 0) {
        console.warn(`[GptService] ⚠️ Note: ${failCount} image(s) failed to process`);
      }

      console.log('[GptService] ✅ GPT Vision processing successful!');
      console.log('========================================');
      console.log('');

      return combined;
    } catch (error) {
      // CRITICAL: Catch any unexpected error and return empty structured object
      console.error('');
      console.error('[GptService] ❌ === CRITICAL ERROR ===');
      console.error('[GptService] ❌ Unexpected error in extractTextFromMultipleImages');
      console.error('[GptService] ❌ Error:', error.message);
      console.error('[GptService] ❌ Stack:', error.stack);
      console.error('');
      return { title: '', mainData: '', contactInfo: '' }; // Return empty structured object
    }
  }
}

module.exports = new GptService();
