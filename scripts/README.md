# Auto-Blog Scripts

## Scripts Overview

### `brain.js`
AI Fallback System - Generates content using Gemini (primary) or BigModel (fallback).

### `auto-generate.js`
Auto-generates blog posts every 6 hours. Includes:
- Topic selection from pool
- AI content generation
- Git commit + push

### `test-fallback.js`
Tests the fallback system.

### `chaos-test.js`
Chaos testing for error scenarios.

## Usage

```bash
# Manual post generation
npm run auto:post

# Test fallback system
npm run test:brain

# Generate content manually
npm run brain "topic here"
```

## Environment Variables
- `GEMINI_API_KEY` - Google AI API key
- `BIGMODEL_API_KEY` - BigModel (GLM-4) API key
