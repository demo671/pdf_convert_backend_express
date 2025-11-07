const OpenAI = require('openai');

class GptService {
  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠ OpenAI API key not configured. GPT features will be disabled.');
      this.client = null;
      return;
    }

    this.client = new OpenAI({
      apiKey: apiKey
    });

    // Use GPT-4o (GPT-4 Omni) - the best and most capable model
    this.model = process.env.OPENAI_MODEL || 'gpt-4o';
    console.log(`✓ GPT Service initialized with model: ${this.model}`);
  }

  async extractDocumentInfoFromText(extractedText, customPrompt = null) {
    if (!this.client) {
      console.warn('[GptService] ⚠ OpenAI client not initialized. Returning empty result.');
      return {
        success: false,
        errorMessage: 'OpenAI API key not configured',
        title: null,
        summary: null,
        contactInformation: null
      };
    }

    try {
      const prompt = customPrompt || `Please analyze this PDF document text and provide a title, a summary (min 300 words and max 400 words), and contact information (phone numbers, emails, addresses). Return your response in JSON format with this structure: {"title": "...", "summary": "...", "contactInformation": "..."}.(no include image or png)

Document text:
${extractedText}`;

      console.log('[GptService] 🤖 Calling GPT to analyze text...');
      console.log(`[GptService] Text length: ${extractedText.length} characters`);

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a highly intelligent assistant that analyzes document text and extracts structured information with high accuracy. Always respond with valid JSON format. Be thorough and precise in your analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2, // Lower temperature for more consistent, accurate results
        max_tokens: 5000 // Increased for better quality summaries (300-400 words)
      });

      const responseText = completion.choices[0].message.content;
      console.log('[GptService] ✓ GPT response received');
      console.log('[GptService] 📝 Raw response (first 200 chars):', responseText.substring(0, 200));

      // Try to parse JSON from response
      let parsedData;
      try {
        // Remove markdown code blocks if present
        const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        console.log('[GptService] 🧹 Cleaned text (first 200 chars):', cleanedText.substring(0, 200));
        parsedData = JSON.parse(cleanedText);
        console.log('[GptService] ✅ JSON parsed successfully');
      } catch (parseError) {
        console.error('[GptService] ❌ Failed to parse GPT response as JSON:', parseError.message);
        console.error('[GptService] 📄 Failed text:', responseText.substring(0, 500));
        return {
          success: false,
          errorMessage: 'Failed to parse GPT response',
          title: null,
          summary: null,
          contactInformation: null
        };
      }

      console.log('[GptService] ✅ GPT extraction successful!');
      console.log(`[GptService] 📋 Parsed data keys:`, Object.keys(parsedData));
      console.log(`[GptService] Title: ${parsedData.title ? `"${parsedData.title.substring(0, 50)}..."` : '(null)'}`);
      console.log(`[GptService] Summary: ${parsedData.summary ? `${parsedData.summary.length} chars` : '(null)'}`);
      console.log(`[GptService] Contact: ${parsedData.contactInformation ? `"${parsedData.contactInformation.substring(0, 50)}..."` : '(null)'}`);

      return {
        success: true,
        errorMessage: null,
        title: parsedData.title || null,
        summary: parsedData.summary || null,
        contactInformation: parsedData.contactInformation || null
      };
    } catch (error) {
      console.error('[GptService] ❌ Error calling GPT:', error.message);
      return {
        success: false,
        errorMessage: error.message,
        title: null,
        summary: null,
        contactInformation: null
      };
    }
  }
}

module.exports = new GptService();

