const pdfParse = require('pdf-parse');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

class PdfProcessingService {
  async extractTextFromPdf(pdfBuffer) {
    try {
      console.log('[PdfProcessingService] 📄 Extracting text from PDF...');
      console.log(`[PdfProcessingService] PDF Size: ${pdfBuffer.length} bytes`);

      const data = await pdfParse(pdfBuffer);
      const extractedText = data.text;

      console.log(`[PdfProcessingService] ✓ Extracted ${extractedText.length} characters from PDF`);
      console.log(`[PdfProcessingService] Text preview: ${extractedText.substring(0, Math.min(200, extractedText.length))}...`);

      return extractedText;
    } catch (error) {
      console.error('[PdfProcessingService] ⚠ Text extraction failed:', error.message);
      return '';
    }
  }

  async processWithTemplate(pdfBuffer, templateRules, vendorContext, originalFileName, gptResult) {
    try {
      console.log('[PdfProcessingService] 🔄 Processing PDF with template...');

      // Extract metadata using regex rules
      const extractedText = await this.extractTextFromPdf(pdfBuffer);
      const extractedFields = this.extractFieldsFromText(extractedText, templateRules.metadataRules || {});

      console.log('[PdfProcessingService] Extracted fields:', extractedFields);

      // Load the PDF
      const pdfDoc = await PDFDocument.load(pdfBuffer);

      // DISABLED: Cover page is no longer added (user requirement)
      // We keep the original PDF pages without adding a cover page

      // Add footer to all pages if specified
      if (templateRules.pageRules && templateRules.pageRules.footerText) {
        await this.addFooterToPages(pdfDoc, templateRules.pageRules.footerText, vendorContext, gptResult);
      }

      // Save the modified PDF
      const processedPdfBytes = await pdfDoc.save();

      console.log('[PdfProcessingService] ✅ PDF processing completed');

      return {
        finalPdfBytes: Buffer.from(processedPdfBytes),
        extractedFields: extractedFields
      };
    } catch (error) {
      console.error('[PdfProcessingService] ❌ PDF processing failed:', error);
      throw error;
    }
  }

  extractFieldsFromText(text, metadataRules) {
    const extracted = {};

    for (const [fieldName, regexPattern] of Object.entries(metadataRules)) {
      try {
        const regex = new RegExp(regexPattern, 'i');
        const match = text.match(regex);
        extracted[fieldName] = match ? match[1] : null;
      } catch (error) {
        console.warn(`[PdfProcessingService] Failed to extract field ${fieldName}:`, error.message);
        extracted[fieldName] = null;
      }
    }

    return extracted;
  }

  async addCoverPage(pdfDoc, coverPageConfig, extractedFields, vendorContext, gptResult) {
    try {
      console.log('[PdfProcessingService] 📄 Adding cover page...');

      const coverPage = pdfDoc.insertPage(0);
      const { width, height } = coverPage.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      let yPosition = height - 100;

      // Title
      const title = this.replacePlaceholders(
        coverPageConfig.fields?.title || 'Documento Procesado',
        extractedFields,
        vendorContext,
        gptResult
      );
      coverPage.drawText(title, {
        x: 50,
        y: yPosition,
        size: 24,
        font: boldFont,
        color: rgb(0, 0, 0)
      });

      yPosition -= 60;

      // Add other fields
      for (const [key, value] of Object.entries(coverPageConfig.fields || {})) {
        if (key === 'title') continue;

        const fieldValue = this.replacePlaceholders(value, extractedFields, vendorContext, gptResult);
        
        coverPage.drawText(`${key.toUpperCase()}: ${fieldValue}`, {
          x: 50,
          y: yPosition,
          size: 12,
          font: font,
          color: rgb(0, 0, 0)
        });

        yPosition -= 25;
      }

      // Add GPT summary if available
      if (gptResult && gptResult.summary) {
        yPosition -= 20;
        coverPage.drawText('RESUMEN:', {
          x: 50,
          y: yPosition,
          size: 14,
          font: boldFont,
          color: rgb(0, 0, 0)
        });

        yPosition -= 20;
        const summaryLines = this.wrapText(gptResult.summary, 80);
        for (const line of summaryLines.slice(0, 15)) { // Limit to 15 lines
          coverPage.drawText(line, {
            x: 50,
            y: yPosition,
            size: 10,
            font: font,
            color: rgb(0, 0, 0)
          });
          yPosition -= 15;
        }
      }

      console.log('[PdfProcessingService] ✓ Cover page added');
    } catch (error) {
      console.error('[PdfProcessingService] ❌ Failed to add cover page:', error);
    }
  }

  async addFooterToPages(pdfDoc, footerTemplate, vendorContext, gptResult) {
    try {
      const pages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSize = 8;

      for (const page of pages) {
        const { width } = page.getSize();
        
        // Right side: Complete processing information with date, email, and contact
        const processedDate = new Date().toISOString();
        const email = vendorContext.email || 'unknown';
        const contactInfo = gptResult && gptResult.contactInformation ? gptResult.contactInformation : '';
        
        // Build the footer text: "Documento procesado el [DATE] por [EMAIL] [CONTACT]"
        let footerText = `Documento procesado el ${processedDate} por ${email}`;
        if (contactInfo) {
          // Extract phone numbers or keep contact info concise
          const maxContactLength = 30;
          const displayContact = contactInfo.length > maxContactLength 
            ? contactInfo.substring(0, maxContactLength).trim() 
            : contactInfo;
          footerText += ` ${displayContact}`;
        }
        
        // Calculate text width to right-align
        const textWidth = font.widthOfTextAtSize(footerText, fontSize);
        
        page.drawText(footerText, {
          x: width - textWidth - 50,
          y: 30,
          size: fontSize,
          font: font,
          color: rgb(0.5, 0.5, 0.5)
        });
      }

      console.log('[PdfProcessingService] ✓ Footer added to all pages');
    } catch (error) {
      console.error('[PdfProcessingService] ❌ Failed to add footer:', error);
    }
  }

  replacePlaceholders(text, extractedFields, vendorContext, gptResult) {
    let result = text;

    // Replace extracted fields
    for (const [key, value] of Object.entries(extractedFields)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || 'N/A');
    }

    // Replace vendor context
    if (vendorContext) {
      result = result.replace(/{{vendor\.email}}/g, vendorContext.email || 'N/A');
      result = result.replace(/{{vendor\.userId}}/g, vendorContext.userId || 'N/A');
    }

    // Replace GPT results
    if (gptResult) {
      result = result.replace(/{{gpt\.title}}/g, gptResult.title || 'N/A');
      result = result.replace(/{{gpt\.summary}}/g, gptResult.summary || 'N/A');
    }

    // Replace date
    result = result.replace(/{{now}}/g, new Date().toISOString());

    return result;
  }

  wrapText(text, maxCharsPerLine) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + word).length > maxCharsPerLine) {
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine += word + ' ';
      }
    }

    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }

    return lines;
  }

  async validateTemplate(jsonDefinition) {
    try {
      const template = JSON.parse(jsonDefinition);
      
      // Basic validation
      if (!template.metadataRules && !template.pageRules && !template.coverPage) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new PdfProcessingService();

