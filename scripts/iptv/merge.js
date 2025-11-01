#!/usr/bin/env node

/**
 * IPTV Channel Merger CLI
 * Merges multiple channel JSON files and removes duplicates
 *
 * Usage:
 *   node merge.js file1.json file2.json file3.json
 *   node merge.js *.json --dedupe-by=streamURL
 *   node merge.js file1.json file2.json --skip-validation --output=merged.json
 */

const { readFile, writeFile } = require('fs/promises');
const { join } = require('path');
const Checker = require('iptv-checker');

const args = process.argv.slice(2);
const inputFiles = args.filter(arg => !arg.startsWith('--') && arg.endsWith('.json'));

if (inputFiles.length < 2) {
  console.error('Error: At least 2 input files required\n');
  console.log('Usage: node merge.js <file1.json> <file2.json> [...] [options]\n');
  console.log('Options:');
  console.log('  --output=file.json       Output filename');
  console.log('  --dedupe-by=METHOD       streamURL, name, or both (default: streamURL)');
  console.log('  --skip-validation        Skip validation after merge');
  console.log('  --timeout=seconds        Validation timeout (default: 10)');
  console.log('  --parallel=number        Parallel validation (default: 10)');
  console.log('  --retry=number           Retry attempts (default: 2)');
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
  dedupeBy: options['dedupe-by'] || 'streamURL',
  skipValidation: options['skip-validation'] === true,
  timeout: parseInt(options.timeout) || 10,
  parallel: parseInt(options.parallel) || 10,
  retry: parseInt(options.retry) || 2,
  output: options.output || `merged-${Date.now()}.json`
};

async function main() {
  console.log('🔀 IPTV Channel Merger\n');

  try {
    const startTime = Date.now();

    // Read all files
    console.log(`📋 Loading ${inputFiles.length} files...`);
    const allChannels = [];
    const sourceFiles = [];

    const outputDir = join(process.cwd(), 'public', 'iptv-output');

    for (const filename of inputFiles) {
      try {
        const content = await readFile(join(outputDir, filename), 'utf-8');
        const data = JSON.parse(content);

        if (data.channels && Array.isArray(data.channels)) {
          allChannels.push(...data.channels);
          sourceFiles.push(filename);
          console.log(`   ✓ ${filename}: ${data.channels.length} channels`);
        }
      } catch (error) {
        console.log(`   ✗ ${filename}: Failed to load`);
      }
    }

    console.log(`\n📊 Total loaded: ${allChannels.length} channels`);

    // Deduplicate
    console.log(`🔨 Deduplicating by: ${config.dedupeBy}...`);
    const seenKeys = new Set();
    const uniqueChannels = [];

    for (const channel of allChannels) {
      let key;

      switch (config.dedupeBy) {
        case 'name':
          key = (channel.name || '').toLowerCase().trim();
          break;
        case 'both':
          key = `${(channel.name || '').toLowerCase().trim()}|${channel.streamURL || channel.url || ''}`;
          break;
        case 'streamURL':
        default:
          key = channel.streamURL || channel.url || channel.stream || '';
          break;
      }

      if (key && !seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueChannels.push(channel);
      }
    }

    console.log(`   ✓ Unique channels: ${uniqueChannels.length}`);
    console.log(`   ✓ Duplicates removed: ${allChannels.length - uniqueChannels.length}\n`);

    let finalChannels = uniqueChannels;
    let validationMeta = null;

    // Validate if not skipped
    if (!config.skipValidation) {
      console.log('🔍 Validating streams...');

      const checker = new Checker({
        timeout: config.timeout * 1000,
        parallel: config.parallel,
        retry: config.retry,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });

      const channels = uniqueChannels.map(ch => ({
        name: ch.name || 'Unknown',
        url: ch.streamURL || ch.url || ch.stream
      }));

      const validChannels = [];
      let processedCount = 0;

      for await (const result of checker.checkPlaylist(channels)) {
        processedCount++;

        const percentage = Math.floor((processedCount / channels.length) * 100);
        process.stdout.write(`\r⏳ Progress: ${percentage}% (${processedCount}/${channels.length}) - Valid: ${validChannels.length}`);

        const originalChannel = uniqueChannels.find(
          ch => (ch.streamURL || ch.url || ch.stream) === result.url
        );

        if (result.status.ok && originalChannel) {
          validChannels.push(originalChannel);
        }
      }

      console.log('\n');

      finalChannels = validChannels;
      validationMeta = {
        total: uniqueChannels.length,
        valid: validChannels.length,
        invalid: uniqueChannels.length - validChannels.length
      };
    }

    // Renumber
    finalChannels.forEach((ch, idx) => {
      ch.number = idx + 1;
    });

    const duration = Math.floor((Date.now() - startTime) / 1000);

    // Prepare output
    const outputData = {
      metadata: {
        source: 'merge-cli',
        generated_at: new Date().toISOString(),
        total_channels: finalChannels.length,
        merge_stats: {
          source_files: sourceFiles,
          total_loaded: allChannels.length,
          after_deduplication: uniqueChannels.length,
          duplicates_removed: allChannels.length - uniqueChannels.length,
          dedupe_method: config.dedupeBy
        },
        validation: config.skipValidation ? 'skipped' : validationMeta,
        duration_seconds: duration
      },
      channels: finalChannels
    };

    // Save
    const outputPath = join(outputDir, config.output);
    await writeFile(outputPath, JSON.stringify(outputData, null, 2));

    console.log('✅ Merge complete!');
    console.log(`📊 Results:`);
    console.log(`   - Files merged: ${sourceFiles.length}`);
    console.log(`   - Final channels: ${finalChannels.length}`);
    console.log(`   - Duration: ${duration}s`);
    console.log(`   - Output: ${outputPath}`);

    if (validationMeta) {
      console.log(`   - Valid: ${validationMeta.valid}`);
      console.log(`   - Invalid: ${validationMeta.invalid}`);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
