/**
 * AI Fallback System - Brain.js
 * Primary: Gemini API | Fallback: BigModel (GLM-4)
 * Task: Generate blog content with automatic failover
 */

import { fileURLToPath } from 'url';
import { config } from 'dotenv';

config(); // Load .env file

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const BIGMODEL_API_KEY = process.env.BIGMODEL_API_KEY || '7a2f35c30cd542d0a72c729f71d6fc94.oRpwTQujzIfjv0RV';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const BIGMODEL_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

/**
 * Generate content using Gemini (Primary)
 * Falls back to BigModel on failure
 */
async function generateContent(prompt, maxRetries = 2) {
    let lastError = null;
    
    // Try Gemini first
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[Brain] Attempting Gemini (try ${attempt}/${maxRetries})...`);
            const result = await callGemini(prompt);
            console.log('[Brain] ✅ Gemini succeeded');
            return {
                success: true,
                source: 'gemini',
                content: result,
                fallbackUsed: false
            };
        } catch (error) {
            lastError = error;
            console.log(`[Brain] ❌ Gemini failed: ${error.message}`);
            if (attempt < maxRetries) {
                await delay(1000 * attempt);
            }
        }
    }
    
    // Fallback to BigModel
    console.log('[Brain] 🔄 Switching to BigModel fallback...');
    try {
        const result = await callBigModel(prompt);
        console.log('[Brain] ✅ BigModel succeeded');
        return {
            success: true,
            source: 'bigmodel',
            content: result,
            fallbackUsed: true
        };
    } catch (error) {
        console.log(`[Brain] ❌ BigModel also failed: ${error.message}`);
        return {
            success: false,
            source: 'none',
            content: null,
            error: `Gemini: ${lastError.message} | BigModel: ${error.message}`,
            fallbackUsed: true
        };
    }
}

/**
 * Call Gemini API
 */
async function callGemini(prompt) {
    if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not set');
    }
    
    const url = `${GEMINI_URL}?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                role: 'user',
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 8192
            }
        })
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    const data = await response.json();
    return extractGeminiContent(data);
}

/**
 * Call BigModel API (GLM-4 Fallback)
 */
async function callBigModel(prompt) {
    const response = await fetch(BIGMODEL_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${BIGMODEL_API_KEY}`
        },
        body: JSON.stringify({
            model: 'glm-4-flash',
            messages: [
                { role: 'system', content: 'You are a helpful assistant. Reply in Markdown format.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 8192
        })
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    const data = await response.json();
    return extractBigModelContent(data);
}

/**
 * Extract content from Gemini response
 */
function extractGeminiContent(data) {
    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
    }
    throw new Error('Invalid Gemini response format');
}

/**
 * Extract content from BigModel response
 * Returns same Markdown format as Gemini
 */
function extractBigModelContent(data) {
    if (data?.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
    }
    throw new Error('Invalid BigModel response format');
}

/**
 * Generate blog post with fallback
 */
async function generateBlogPost(topic, language = 'ar') {
    const promptTemplate = language === 'ar' 
        ? `اكتب مقالاً احترافياً عن "${topic}" باللغة العربية.

المتطلبات:
- عنوان جذاب (استخدم #)
- مقدمة قصيرة
- 3-4 عناوين فرعية (##)
- محتوى مفصل تحت كل عنوان
- خاتمة مع دعوة للتفاعل
- استخدم Markdown بشكل صحيح

اكتب فقط المحتوى، بدون أي تعليقات إضافية.`
        : `Write a professional article about "${topic}" in English.

Requirements:
- Catchy title (use #)
- Short introduction
- 3-4 subheadings (##)
- Detailed content under each section
- Conclusion with call to action
- Use proper Markdown formatting

Write only the content, no extra comments.`;

    const result = await generateContent(promptTemplate);
    
    if (!result.success) {
        throw new Error(`All AI providers failed: ${result.error}`);
    }
    
    return {
        title: extractTitle(result.content),
        content: result.content,
        source: result.source,
        fallbackUsed: result.fallbackUsed,
        timestamp: new Date().toISOString()
    };
}

/**
 * Extract title from content
 */
function extractTitle(markdown) {
    const match = markdown.match(/^#\s*(.+)$/m);
    return match ? match[1].trim() : 'Untitled';
}

/**
 * Utility: Delay
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Export for use
export {
    generateContent,
    generateBlogPost,
    callGemini,
    callBigModel
};

// CLI usage
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const topic = process.argv[2] || 'التكنولوجيا الحديثة';
    console.log('[Brain] Testing AI Fallback System...\n');
    
    generateBlogPost(topic, 'ar')
        .then(result => {
            console.log('\n=== RESULT ===');
            console.log(`Source: ${result.source} ${result.fallbackUsed ? '(FALLBACK)' : '(PRIMARY)'}`);
            console.log(`Title: ${result.title}`);
            console.log(`\nContent preview:\n${result.content.substring(0, 500)}...`);
        })
        .catch(err => {
            console.error('[Brain] Fatal:', err.message);
            process.exit(1);
        });
}
