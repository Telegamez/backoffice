#!/usr/bin/env node

/**
 * IPTV Stream Validator CLI
 * Validates all streams in a channel JSON file
 *
 * Usage:
 *   node validate.js channels.json
 *   node validate.js channels.json --timeout=15 --parallel=20
 *   node validate.js channels.json --output=validated.json
 */

const { readFile, writeFile } = require('fs/promises');
const { join } = require('path');
const Checker = require('iptv-checker');

const args = process.argv.slice(2);
const inputFile = args.find(arg => !arg.startsWith('--'));

if (!inputFile) {
  console.error('Error: Input file required\n');
  console.log('Usage: node validate.js <input.json> [options]\n');
  console.log('Options:');
  console.log('  --output=file.json    Output filename');
  console.log('  --timeout=seconds     Timeout per stream (default: 10)');
  console.log('  --parallel=number     Parallel checks (default: 10)');
  console.log('  --retry=number        Retry attempts (default: 2)');
  process.exit(1);
}

const options = args.reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.replace('--', '').split('=');
    acc[key] = value !== undefined ? value : true;
  }
  return acc;
}, {});

const config = {
  timeout: parseInt(options.timeout) || 10,
  parallel: parseInt(options.parallel) || 10,
  retry: parseInt(options.retry) || 2,
  output: options.output || `${inputFile.replace('.json', '')}-validated.json`
};

async function main() {
  console.log('🔍 IPTV Stream Validator\n');

  try {
    // Read input file
    const content = await readFile(inputFile, 'utf-8');
    const channelData = JSON.parse(content);

    if (!channelData.channels || !Array.isArray(channelData.channels)) {
      throw new Error('Invalid channel file format');
    }

    console.log(`📋 Loaded ${channelData.channels.length} channels from ${inputFile}`);
    console.log(`⚙️  Config: timeout=${config.timeout}s, parallel=${config.parallel}, retry=${config.retry}\n`);

    const startTime = Date.now();

    // Configure checker
    const checker = new Checker({
      timeout: config.timeout * 1000,
      parallel: config.parallel,
      retry: config.retry,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });

    // Prepare channels
    const channels = channelData.channels.map(ch => ({
      name: ch.name || ch.channel || 'Unknown',
      url: ch.streamURL || ch.url || ch.stream
    }));

    // Validate
    const validChannels = [];
    const invalidChannels = [];
    let processedCount = 0;

    console.log('🚀 Starting validation...\n');

    for await (const result of checker.checkPlaylist(channels)) {
      processedCount++;

      const percentage = Math.floor((processedCount / channels.length) * 100);
      process.stdout.write(`\r⏳ Progress: ${percentage}% (${processedCount}/${channels.length}) - Valid: ${validChannels.length}, Invalid: ${invalidChannels.length}`);

      const originalChannel = channelData.channels.find(
        ch => (ch.streamURL || ch.url || ch.stream) === result.url
      );

      if (result.status.ok && originalChannel) {
        validChannels.push(originalChannel);
      } else if (originalChannel) {
        invalidChannels.push(originalChannel);
      }
    }

    console.log('\n');

    // Renumber
    validChannels.forEach((ch, idx) => {
      ch.number = idx + 1;
    });

    const duration = Math.floor((Date.now() - startTime) / 1000);

    // Prepare output
    const outputData = {
      metadata: {
        source: 'validation-cli',
        generated_at: new Date().toISOString(),
        original_file: inputFile,
        total_channels: validChannels.length,
        validation: {
          total: channels.length,
          valid: validChannels.length,
          invalid: invalidChannels.length,
          duration_seconds: duration
        }
      },
      channels: validChannels
    };

    // Save
    const outputPath = join(process.cwd(), 'public', 'iptv-output', config.output);
    await writeFile(outputPath, JSON.stringify(outputData, null, 2));

    console.log('✅ Validation complete!');
    console.log(`📊 Results:`);
    console.log(`   - Total tested: ${channels.length}`);
    console.log(`   - Valid: ${validChannels.length}`);
    console.log(`   - Invalid: ${invalidChannels.length}`);
    console.log(`   - Duration: ${duration}s`);
    console.log(`   - Output: ${outputPath}`);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
