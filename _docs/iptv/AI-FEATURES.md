# IPTV Channel Manager - AI Features

AI-powered channel analysis and manipulation using GPT-4.

## Overview

The AI Analyze tab allows you to interact with your channel files using natural language, similar to the Mail Assistant app's document analysis feature.

## Features

### 1. Natural Language Analysis

Ask questions about your channel files:

**Examples:**
- "How many sports channels are in this file?"
- "What categories are represented?"
- "Show me statistics about channel languages"
- "Which channels are in 4K quality?"

### 2. AI-Powered Filtering

Filter channels using natural language:

**Examples:**
- "Filter to only sports channels"
- "Show me only English language channels"
- "Remove all channels with 'local' in the name"
- "Keep only news and entertainment channels"

### 3. Channel Editing

Modify channel properties with AI assistance:

**Examples:**
- "Rename all ESPN channels to include 'Sports Network'"
- "Categorize all football channels as 'Sports'"
- "Fix the language tags for all Spanish channels"
- "Renumber channels by category"

### 4. Smart Recommendations

Get AI-powered recommendations:

**Examples:**
- "Recommend the top 50 channels for families"
- "Which channels should I remove for better quality?"
- "Suggest a good starter package"
- "Find duplicate or similar channels"

### 5. Organization

Reorganize your channel list:

**Examples:**
- "Group channels by language"
- "Sort channels alphabetically within each category"
- "Move all sports channels to the beginning"
- "Create a premium channels subset"

## How to Use

### Step 1: Select a File

1. Go to the **AI Analyze** tab
2. Click on any channel file from the list
3. The AI assistant will greet you

### Step 2: Ask Questions or Give Instructions

Type your request in natural language:

```
"Show me statistics about the channels"
```

### Step 3: Review Results

The AI will respond with:
- **Analysis**: Direct answers to your questions
- **Filtered File**: A new channel file (for filter operations)
- **Edited File**: A modified version (for edit operations)

### Step 4: Download Results

If the AI created a new file, you can:
- Download it from the chat message
- Find it in the **Files** tab
- Use it as input for further operations

## Example Conversations

### Example 1: Channel Statistics

**User**: "Show me statistics about the channels"

**AI**:
```
📊 Channel Statistics:

Total Channels: 421
Categories:
  - Sports: 189 (45%)
  - News: 102 (24%)
  - Entertainment: 78 (19%)
  - Movies: 52 (12%)

Languages:
  - English (US): 398 (95%)
  - Spanish: 23 (5%)

Stream Formats:
  - M3U8: 421 (100%)

Average channels per category: 105
Most common category: Sports
```

### Example 2: Filter Channels

**User**: "Filter to only sports channels"

**AI**:
```
✅ Created filtered channel list!

Operation: Filter
Criteria: Category = "Sports"

Results:
- Original: 421 channels
- Filtered: 189 channels
- Removed: 232 channels

✅ Created new file: channels-ai-filter-1698765432123.json
📊 Channels: 189

You can download this file now.
```

### Example 3: Edit Channels

**User**: "Rename all ESPN channels to include 'Network' suffix"

**AI**:
```
✅ Edited channel names!

Changes made:
- ESPN → ESPN Network
- ESPN2 → ESPN2 Network
- ESPN Deportes → ESPN Deportes Network
- ESPN News → ESPN News Network

Total channels modified: 12

✅ Created new file: channels-ai-edit-1698765432123.json
📊 Channels: 421

All other channels remain unchanged.
```

### Example 4: Recommendations

**User**: "Recommend top 50 channels for families with young kids"

**AI**:
```
👨‍👩‍👧‍👦 Family-Friendly Channel Recommendations

Top 50 channels for families with young kids:

Educational (15 channels):
1. PBS Kids
2. Discovery Kids
3. National Geographic Kids
...

Entertainment (20 channels):
16. Disney Channel
17. Nickelodeon
...

Movies (10 channels):
36. Disney Junior
...

Sports (5 channels):
46. ESPN Kids
...

These channels are:
✓ Age-appropriate content
✓ Educational value
✓ No mature content
✓ High-quality streams

Would you like me to create a filtered file with just these channels?
```

## API Operations

The AI can perform three types of operations:

### ANALYZE
Returns information about channels without modifying files.

**Response Format**: Plain text

### FILTER
Creates a new file with a subset of channels.

**Response Format**:
```json
{
  "operation": "filter",
  "explanation": "Human-readable explanation",
  "channels": [...filtered channels...],
  "summary": {
    "original_count": 421,
    "result_count": 189,
    "changes_made": "Filtered to sports channels only"
  }
}
```

### EDIT
Creates a new file with modified channel properties.

**Response Format**:
```json
{
  "operation": "edit",
  "explanation": "Human-readable explanation",
  "channels": [...edited channels...],
  "summary": {
    "original_count": 421,
    "result_count": 421,
    "changes_made": "Renamed 12 ESPN channels"
  }
}
```

## Conversation History

The AI maintains conversation context, so you can have multi-turn conversations:

**Turn 1**:
- User: "Show me sports channels"
- AI: [Lists sports channels]

**Turn 2**:
- User: "Now filter to just basketball channels"
- AI: [Filters the sports channels to basketball only]

**Turn 3**:
- User: "Sort these alphabetically"
- AI: [Sorts the basketball channels]

## Best Practices

### 1. Be Specific

❌ "Fix the channels"
✅ "Remove channels with invalid URLs"

### 2. Use Clear Operations

❌ "Do something with sports"
✅ "Filter to only sports channels"

### 3. Chain Operations

Instead of one complex request, use multiple simple ones:

1. "Filter to sports channels"
2. "Now remove channels with 'local' in the name"
3. "Sort by channel name"

### 4. Verify Results

Always review AI-generated files before using them in production.

### 5. Use Example Prompts

Click the example prompts to see how to phrase requests.

## Limitations

1. **Processing Time**: Complex operations may take 10-30 seconds
2. **File Size**: Works best with files under 5,000 channels
3. **Context**: Maintains last 10 messages of conversation history
4. **API Costs**: Each request uses OpenAI API credits

## Example Prompts

### Analysis
- "How many channels are there in each category?"
- "What's the breakdown by language?"
- "Which channels have the most similar names?"
- "Find all HD or 4K channels"

### Filtering
- "Filter to only news channels"
- "Remove all local affiliate channels"
- "Keep only English language channels"
- "Show me premium sports channels"

### Editing
- "Recategorize all ESPN channels as 'Sports'"
- "Add 'HD' to all high-definition channel names"
- "Fix inconsistent category names"
- "Renumber channels starting from 1"

### Organization
- "Group channels by category and then by name"
- "Move all premium channels to the top"
- "Create separate sections for each language"
- "Organize by popularity"

### Recommendations
- "Recommend best channels for news junkies"
- "Which channels should I prioritize?"
- "Suggest a good channel package for cord-cutters"
- "Find the most reliable streams"

## Troubleshooting

### Issue: AI doesn't understand my request

**Solution**:
- Be more specific
- Use simpler language
- Try example prompts first
- Break complex requests into steps

### Issue: Operation takes too long

**Solution**:
- Work with smaller files
- Use simpler operations
- Filter first, then analyze

### Issue: AI created wrong result

**Solution**:
- Review your prompt for ambiguity
- Try rephrasing your request
- Provide more context
- Use the conversation history to clarify

### Issue: Can't download AI-generated file

**Solution**:
- Check the Files tab
- Refresh the file list
- Look for files starting with `channels-ai-*`

## Technical Details

### Model
- **Primary**: GPT-4
- **Fallback**: GPT-3.5-turbo (if configured)
- **Max Tokens**: 4,000

### Timeout
- **Max Duration**: 300 seconds (5 minutes)

### Context
- **System Prompt**: Specialized for IPTV channel operations
- **Conversation**: Last 10 messages retained
- **Channel Data**: First 5 channels sent as sample

### File Naming
- **Filter**: `channels-ai-filter-{timestamp}.json`
- **Edit**: `channels-ai-edit-{timestamp}.json`
- **Metadata**: Includes AI operation details

## Security

- ✅ Authentication required
- ✅ File access restricted to user's files
- ✅ No external data sharing
- ✅ Conversation not persisted beyond session
- ✅ Generated files stored securely

## Future Enhancements

Planned features:
- [ ] Batch operations on multiple files
- [ ] Custom AI instructions
- [ ] Save conversation templates
- [ ] Export chat history
- [ ] Channel quality scoring
- [ ] Automatic categorization
- [ ] Duplicate detection improvements

---

**Last Updated**: November 1, 2025
**AI Model**: GPT-4
**Status**: ✅ Active
