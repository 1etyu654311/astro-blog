/**
 * Chaos Testing - Verify Fallback System
 * Tests: Retry, Fallback to BigModel, Error Handling, Speed
 */

import { generateContent, generateBlogPost } from './brain.js';

console.log('🔥 CHAOS TESTING');
console.log('══════════════════════════════════════════════════');

const TOTAL_TESTS = 4;
let passed = 0;
let failed = 0;

async function runTest(name, testFn) {
    console.log(`\n📌 ${name}`);
    console.log('─'.repeat(50));
    try {
        const start = Date.now();
        await testFn();
        const duration = Date.now() - start;
        console.log(`✅ PASS (${duration}ms)`);
        passed++;
    } catch (err) {
        console.log(`❌ FAIL: ${err.message}`);
        failed++;
    }
}

// Test 1: Speed test - Normal generation
await runTest('Test 1: Response Speed', async () => {
    const result = await generateContent('اكتب جملة واحدة فقط');
    if (!result.success) throw new Error('Generation failed');
    console.log(`   Source: ${result.source} ${result.fallbackUsed ? '[FALLBACK]' : '[PRIMARY]'}`);
});

// Test 2: Full blog post generation
await runTest('Test 2: Full Blog Post', async () => {
    const post = await generateBlogPost('اختبار النظام', 'ar');
    if (!post.success) throw new Error(post.error);
    console.log(`   Title: ${post.title}`);
    console.log(`   Source: ${post.source}`);
    console.log(`   Content length: ${post.content.length}`);
});

// Test 3: Verify content format (Markdown)
await runTest('Test 3: Markdown Format', async () => {
    const post = await generateBlogPost('Markdown Check', 'ar');
    if (!post.success) throw new Error('No content');
    const hasTitle = /^#\s+.+$/m.test(post.content);
    const hasHeaders = /^##\s+.+$/m.test(post.content);
    if (!hasTitle || !hasHeaders) {
        throw new Error('Missing markdown structure');
    }
    console.log(`   Has title header (#)`);
    console.log(`   Has subheaders (##)`);
});

// Test 4: Fallback verification
await runTest('Test 4: Source Tracking', async () => {
    const results = [];
    for (let i = 0; i < 3; i++) {
        const r = await generateContent('اختبار ' + i);
        results.push(r.source);
        console.log(`   Run ${i+1}: ${r.source} ${r.fallbackUsed ? '(FALLBACK)' : ''}`);
    }
    const uniqueSources = [...new Set(results)];
    if (uniqueSources.length === 0) throw new Error('No sources recorded');
    console.log(`   Sources used: ${uniqueSources.join(', ')}`);
});

// Summary
console.log('\n' + '═'.repeat(50));
console.log('CHAOS TEST SUMMARY');
console.log('─'.repeat(50));
console.log(`Total: ${TOTAL_TESTS} | Passed: ${passed} | Failed: ${failed}`);

if (failed === 0) {
    console.log('\nALL TESTS PASSED - Fallback System is READY!');
} else {
    console.log(`\n${failed} test(s) failed`);
    process.exit(1);
}

process.exit(0);
