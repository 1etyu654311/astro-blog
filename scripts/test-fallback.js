/**
 * Test script for AI Fallback System
 * Tests both Gemini and BigModel fallback
 */

import { generateContent, generateBlogPost } from './brain.js';

console.log('🧪 Testing AI Fallback System\n');

async function runTests() {
    const testPrompt = 'اكتب فقرة قصيرة عن أهمية الذكاء الاصطناعي';
    
    // Test 1: Normal content generation
    console.log('Test 1: Basic content generation');
    console.log('================================');
    
    try {
        const result = await generateContent(testPrompt);
        console.log(`✅ Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
        console.log(`📡 Source: ${result.source} ${result.fallbackUsed ? '(FALLBACK USED)' : ''}`);
        console.log(`📝 Preview: ${result.content?.substring(0, 100)}...\n`);
    } catch (err) {
        console.error(`❌ Test failed: ${err.message}\n`);
    }
    
    // Test 2: Full blog post
    console.log('Test 2: Full blog post generation');
    console.log('==================================');
    
    try {
        const post = await generateBlogPost('مستقبل العمل التقني', 'ar');
        console.log(`✅ Blog created`);
        console.log(`📡 Source: ${post.source}`);
        console.log(`📰 Title: ${post.title}`);
        console.log(`⏰ Timestamp: ${post.timestamp}`);
        console.log(`📝 Content length: ${post.content.length} chars`);
        console.log(`\n--- Full Content ---\n`);
        console.log(post.content);
    } catch (err) {
        console.error(`❌ Blog test failed: ${err.message}`);
    }
}

runTests();
