#!/usr/bin/env node

/**
 * IPTV Channel Generator CLI
 * Uses the same backend as the GUI for consistency
 *
 * Usage:
 *   node generate.js --profile=us-sports
 *   node generate.js --countries=US,CA --categories=sports,news
 *   node generate.js --profile=us-all --skip-validation --output=my-channels.json
 */

const { generateMasterChannels } = require('../../src/lib/iptv/generator.ts');
const { writeFile } = require('fs/promises');
const { join } = require('path');

const args = process.argv.slice(2);
const options = args.reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.replace('--', '').split('=');
    acc[key] = value !== undefined ? value : true;
  }
  return acc;
}, {});

// Parse config
const config = {
  profile: options.profile,
  countries: options.countries ? options.countries.split(',') : undefined,
  categories: options.categories ? options.categories.split(',') : undefined,
  excludeLocal: options['exclude-local'] === true || options['exclude-local'] === 'true',
  m3u8Only: options['m3u8-only'] === true || options['m3u8-only'] === 'true',
  skipValidation: options['skip-validation'] === true || options['skip-validation'] === 'true',
  timeout: parseInt(options.timeout) || 10,
  parallel: parseInt(options.parallel) || 10,
  retry: parseInt(options.retry) || 2
};

async function main() {
  console.log('🎬 IPTV Channel Generator\n');

  if (!config.profile && !config.countries) {
    console.error('Error: Either --profile or --countries must be specified\n');
    console.log('Available profiles:');
    console.log('  - us-all          All US channels (no local affiliates)');
    console.log('  - us-sports       US sports channels only');
    console.log('  - us-entertainment  Entertainment, movies, music');
    console.log('  - us-news         US news channels');
    console.log('  - us-family       Kids, education, religious');
    console.log('  - north-america   US + Canada + Mexico\n');
    console.log('Examples:');
    console.log('  node generate.js --profile=us-sports');
    console.log('  node generate.js --countries=US --categories=sports,news');
    process.exit(1);
  }

  try {
    console.log('Configuration:', JSON.stringify(config, null, 2), '\n');

    const result = await generateMasterChannels(config);

    const outputFilename = options.output || `channels-${Date.now()}.json`;
    const outputPath = join(process.cwd(), 'public', 'iptv-output', outputFilename);

    await writeFile(outputPath, JSON.stringify(result, null, 2));

    console.log('\n✅ Generation complete!');
    console.log(`📊 Statistics:`);
    console.log(`   - Total channels: ${result.metadata.total_channels}`);
    console.log(`   - Duration: ${result.metadata.duration_seconds}s`);
    console.log(`   - Output: ${outputPath}`);

    if (result.metadata.validation && result.metadata.validation !== 'skipped') {
      console.log(`   - Valid: ${result.metadata.validation.valid}`);
      console.log(`   - Invalid: ${result.metadata.validation.invalid}`);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
