/**
 * Auto-Generate Blog Posts
 * Runs every 6 hours via cron
 * Generates Arabic blog content using AI Fallback System
 */

import { generateBlogPost } from './brain.js';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = join(__dirname, '../src/content/blog');
const ASSETS_DIR = join(__dirname, '../src/assets');

// Topics pool for auto-generation
const TOPICS = [
    'التكنولوجيا الحديثة',
    'الذكاء الاصطناعي',
    'تطوير البرمجيات',
    'العمل عن بُعد',
    'الأمن السيبراني',
    'تعلم الآلة',
    'البيانات الضخمة',
    'الحوسبة السحابية',
    'إنترنت الأشياء',
    'البلوكتشين',
    'التسويق الرقمي',
    'تجربة المستخدم',
    'التصميم البرمجي',
    'أدوات الإنتاجية',
    'إدارة المشاريع',
    'الروبوتات',
    'الواقع الافتراضي',
    'الواقع المعزز',
    'التطبيقات الذكية',
    'تحليل البيانات',
    'Python للمبتدئين',
    'JavaScript الحديث',
    'React و Next.js',
    'Node.js',
    'قواعد البيانات',
    'Docker و Kubernetes',
    'Git و GitHub',
    'CI/CD DevOps',
    'testing البرمجي',
    'أداء التطبيقات',
    'SEO التقني',
    'Web3 و NFT',
    'العملات الرقمية',
    'التمويل اللامركزي',
    'الهوية الرقمية',
    'الخصوصية الإلكترونية',
    'الذكاء الاصطناعي التوليدي',
    'ChatGPT و النماذج اللغوية',
    'أتمتة المهام',
    'الكتابة بمساعدة AI'
];

// Select random topic
function selectTopic() {
    const index = Math.floor(Math.random() * TOPICS.length);
    return TOPICS[index];
}

// Format date for filename and frontmatter
function formatDate(date) {
    const d = date || new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Format date for frontmatter (Astro format)
function formatFrontmatterDate(date) {
    const d = date || new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')} ${d.getFullYear()}`;
}

// Slugify title for filename
function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
}

// Generate frontmatter
function generateFrontmatter(title, description, date, image) {
    return `---
title: '${title}'
description: '${description}'
pubDate: '${formatFrontmatterDate(date)}'
${image ? `heroImage: '${image}'` : ''}
---

`;
}

// Extract description from content (first 150 chars)
function extractDescription(content) {
    // Remove markdown syntax
    const plainText = content
        .replace(/#+ /g, '')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/\n/g, ' ')
        .trim();
    
    return plainText.substring(0, 150).replace(/'/g, "'") + '...';
}

// Main generation function
async function generateAndSave() {
    const topic = selectTopic();
    const date = new Date();
    const dateStr = formatDate(date);
    
    console.log(`[AutoGen] Starting generation for topic: "${topic}"`);
    console.log(`[AutoGen] Date: ${dateStr}`);
    
    try {
        // Generate content using AI fallback system
        console.log('[AutoGen] Calling AI...');
        const result = await generateBlogPost(topic, 'ar');
        
        console.log(`[AutoGen] ✅ Content generated from: ${result.source}${result.fallbackUsed ? ' (FALLBACK)' : ''}`);
        
        // Create filename
        const baseSlug = slugify(result.title);
        const filename = `${dateStr}-${baseSlug}.md`;
        const filepath = join(BLOG_DIR, filename);
        
        // Check for duplicates
        if (existsSync(filepath)) {
            console.log(`[AutoGen] ⚠️ File ${filename} already exists, skipping`);
            return { success: false, reason: 'duplicate' };
        }
        
        // Extract description
        const description = extractDescription(result.content);
        
        // Generate full content with frontmatter
        const fullContent = generateFrontmatter(
            result.title,
            description,
            date,
            '../../assets/blog-placeholder-3.jpg'
        ) + result.content;
        
        // Ensure blog directory exists
        if (!existsSync(BLOG_DIR)) {
            mkdirSync(BLOG_DIR, { recursive: true });
        }
        
        // Write file
        writeFileSync(filepath, fullContent, 'utf-8');
        console.log(`[AutoGen] ✅ Saved to: ${filepath}`);
        
        // Git operations
        console.log('[AutoGen] Committing to Git...');
        const commitMessage = `auto: ${result.title} (${dateStr})`;
        
        execSync('git add src/content/blog/', { cwd: join(__dirname, '..'), stdio: 'pipe' });
        
        try {
            execSync(`git commit -m "${commitMessage}"`, { cwd: join(__dirname, '..'), stdio: 'pipe' });
            console.log(`[AutoGen] ✅ Committed: ${commitMessage}`);
        } catch (e) {
            console.log('[AutoGen] ℹ️ No changes to commit');
        }
        
        // Push to remote
        try {
            execSync('git push origin main', { cwd: join(__dirname, '..'), stdio: 'pipe' });
            console.log('[AutoGen] ✅ Pushed to GitHub');
        } catch (e) {
            console.log(`[AutoGen] ⚠️ Push failed: ${e.message}`);
        }
        
        // Build and deploy to Cloudflare Pages
        console.log('[AutoGen] ☁️ Building for Cloudflare...');
        try {
            // Build the site
            execSync('npm run build', { cwd: join(__dirname, '..'), stdio: 'pipe' });
            console.log('[AutoGen] ✅ Build successful');
            
            // Deploy to Cloudflare using wrangler
            console.log('[AutoGen] ☁️ Deploying to Cloudflare Pages...');
            execSync('wrangler pages deploy dist --project-name=zapping-zero --branch=main --commit-dirty=true', { 
                cwd: join(__dirname, '..'), 
                stdio: 'pipe' 
            });
            console.log('[AutoGen] ✅ Deployed to Cloudflare Pages!');
        } catch (e) {
            console.log(`[AutoGen] ⚠️ Cloudflare deploy failed: ${e.message}`);
        }
        
        return {
            success: true,
            source: result.source,
            fallbackUsed: result.fallbackUsed,
            filename,
            title: result.title
        };
        
    } catch (error) {
        console.error(`[AutoGen] ❌ Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// CLI usage
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    console.log('🤖 Auto-Generate Blog Post\n');
    
    generateAndSave()
        .then(result => {
            if (result.success) {
                console.log('\n✅ Complete!');
                console.log(`Title: ${result.title}`);
                console.log(`Source: ${result.source}${result.fallbackUsed ? ' [FALLBACK]' : ''}`);
                console.log(`File: ${result.filename}`);
            } else {
                console.log('\n❌ Failed:', result.reason || result.error);
            }
        })
        .catch(err => {
            console.error('❌ Fatal:', err);
            process.exit(1);
        });
}

export { generateAndSave, TOPICS };
