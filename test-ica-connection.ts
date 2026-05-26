/**
 * Test IBM ICA Connection
 * Simple script to test if ICA API is accessible
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testICAConnection() {
  console.log('='.repeat(60));
  console.log('Testing IBM ICA Connection');
  console.log('='.repeat(60));
  console.log();

  // Get credentials from environment
  const apiKey = process.env.ICA_API_KEY;
  const baseUrl = process.env.ICA_BASE_URL;
  const model = process.env.ICA_MODEL || 'global/anthropic.claude-sonnet-4-5-20250929-v1:0';

  console.log('Configuration:');
  console.log(`  API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET'}`);
  console.log(`  Base URL: ${baseUrl || 'NOT SET'}`);
  console.log(`  Model: ${model}`);
  console.log();

  if (!apiKey || !baseUrl) {
    console.error('❌ Error: ICA_API_KEY or ICA_BASE_URL not set in .env file');
    process.exit(1);
  }

  try {
    console.log('Initializing OpenAI client...');
    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: baseUrl,
    });
    console.log('✓ Client initialized');
    console.log();

    console.log('Sending test prompt...');
    const response = await client.chat.completions.create({
      model: model,
      messages: [
        { role: 'user', content: 'Hello! Can you respond with a simple greeting?' }
      ],
      max_tokens: 50,
      temperature: 0.7,
    });

    console.log('✓ Response received!');
    console.log();
    console.log('Response:');
    console.log('-'.repeat(60));
    console.log(response.choices[0]?.message?.content || 'No content');
    console.log('-'.repeat(60));
    console.log();
    console.log('✅ IBM ICA connection is working!');

  } catch (error: any) {
    console.error('❌ Error connecting to IBM ICA:');
    console.error(`  Status: ${error.status || 'Unknown'}`);
    console.error(`  Message: ${error.message || 'Unknown error'}`);
    console.error();
    console.error('Full error:', error);
    console.error();
    console.error('Possible issues:');
    console.error('  1. API key is invalid or expired');
    console.error('  2. Base URL is incorrect');
    console.error('  3. Model name is incorrect');
    console.error('  4. API endpoint requires different authentication');
    console.error('  5. Rate limit exceeded');
    process.exit(1);
  }
}

// Run the test
testICAConnection();

// Made with Bob