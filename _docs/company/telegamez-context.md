# Telegamez Deep Context — Portable Memory for LLM Agentic Frameworks

> **Purpose**: A drop‑in, structured context file capturing Matt + Telegamez so any LLM/agent can operate with full situational awareness. This is the authoritative company context used by all AI-powered applications in the backoffice platform.
> **Owner**: Matt Ference (preferred name: Matt)
> **Last updated**: 2025-10-02
> **Version**: 1.0

---

## Meta Information

- **Version**: 1.0
- **Last Updated**: 2025-10-02
- **Owner**: Matt Ference
- **Preferred Name**: Matt
- **Timezone**: America/Los_Angeles
- **Language**: en-US

---

## Founder Profile: Matt Ference

### Role & Background
- **Legal Name**: Matt Ference
- **Role**: Founder & CEO (Product Owner mindset)
- **Location**: Thousand Oaks, CA

### Professional Summary
20+ years in streaming media; helped deliver CNN's first livestream, the first MLB livestream, and the first 5G live sports stream (2020 Super Bowl). Former Prime Video lead (Thursday Night Football). Expert in live sports/music/movie streaming, product development, and web engineering. Builder-first, iterative, and data-driven.

### Voice & Tone Preferences
- Slightly informal
- Opinionated with room for debate
- Concise and action-oriented
- Collaborative/product-thinking

### Passions & Interests
- USC football
- Swimming
- Pickleball
- Unreal Engine (mixed/virtual production)
- Photography & cinematography
- Video games & streaming
- All things tech

### Goals
- Transition to entrepreneurial freedom; no pension → financial independence via Telegames
- Monetize passions through products and services
- Build a category-defining real-time, AI-powered communal entertainment platform

---

## Company: Channel Networks, Inc. (DBA Telegames)

### Legal Structure
- **Legal Name**: Channel Networks, Inc.
- **Structure**: Delaware C‑Corp
- **DBA**: Telegames (formerly Telegamez)
- **Primary Domain**: https://telegames.ai

### Brand Identity

**Taglines:**
- "Smarter Play. Together."
- "Joy Needs Witnesses."
- "Turning passive viewers into active communities."

**Core Concepts:**
- **Gameferencing**: Gamified, casual, social AI-powered hangouts
- **Bring Your Own Agent (BYOA)**: Marketplace for AI companions

**Brand Colors:**
- Deep Blue: `#18385d`
- Hot Magenta: `#ff0090`
- Sky Highlight: `#7ee2ff`

**Naming Conventions:**
- Use 'Z' at the end for divisions (Gamez, Schoolz)
- Use 'C' in titles where culturally relevant

### Company Mission

**One-Liner**: Making Multimodal AI a Multiplayer Communal Experience.

**Elevator Pitch**:
Telegames turns passive viewing into shared, AI-powered play. It fuses real-time co-presence, AI companions, and creator-built activities into a multiplayer web experience—no install, just click a link and you're in.

---

## Product Overview

### Experience Type
WebRTC web app (no install friction); invite via SMS/URL

### Core Pillars
1. **Real-time Co-presence**: Live audio/video with WebRTC
2. **AI Companions**: Shared AI hosts/MCs with personalities (aka "Companion Avatars")
3. **Creator Marketplace**: Activities, add-ons, and tools built by community

### Key Modules
- **Rooms**: Virtual spaces with subdomains and passphrases
- **Activities**: Games, quizzes, polls, telestrator, RPG scaffolds
- **Companions**: AI hosts/MCs with personalities and expertise
- **Media**: Co-watch streams, VOD, live inputs, muxed outputs
- **Recording/Replay**: Server-side recording capabilities
- **Leaderboards**: Scores and achievements
- **Invites**: SMS/share links for frictionless joining
- **Admin Panel**: Add-on packs, room config, moderation

### Invite Flow
1. Host reserves subdomain and room
2. Host sets passphrase/security
3. Host shares link over SMS
4. Friends click → browser prompts for mic/cam → join live room

### MVP Status

**✅ Completed:**
- Real-time audio/video via WebRTC
- Passphrases & subdomains (ports 3000/3001; docker network chnl_net; SQLite persistence)
- Initial games catalog
- Basic admin auth

**🚧 Near-Term Roadmap:**
- Co-watch live sports with AI commentary
- Add-on marketplace (polls/quizzes/telestrator/RPG)
- Server-side recording (hidden WebRTC server participant → FFmpeg MP4)
- Muxed streaming to Twitch/YouTube/X
- User profiles + social login
- Geo-distributed infrastructure + load balancing
- Performance optimizations (lazy loading, code splitting, web workers)

### UX Philosophy
- **Low friction join**: Everything in-browser, no installs
- **Shared AI**: Feels like a human participant
- **Dynamic UI controls**: Buttons/prompts/menus driven by AI
- **Synchronized experiences**: Shared TTS audio, telestration

---

## AI Agent System

### Default Companion: Telly

**Roles & Modes:**

1. **Conversational**: Default casual conversations & small talk facilitation
2. **Customer Support**: Structured feedback/bug reporting; triage templates; data capture
3. **Game Show**: Trivia & challenges; points tracking; leaderboards; winner selection
4. **Live Event**: Co-watching with biased commentary, catch-up highlights, real-time challenges

**High-Level Capabilities:**
- Persistent and augmented data sources (RAG)
- Timely data processing
- Periodic fine-tuning or RAG updates
- Shared TTS audio playback across peers
- Push-to-talk hotkey wake words
- Interruption handling (wake words/hotkeys required in multi-party rooms)

**Knowledge Base Requirements:**
- Pre-room context (room topic, participants, preferences)
- Subject matter packs (sports teams, rules, player stats)
- Host/participant names and roles when available

**Response Adaptability:**
- Low latency bias: true
- Quick vs verbose triage: analyze user intent and route
- User cues during delays: audible/visual progress cues

### STT/LLM/TTS Pipeline

**Speech-to-Text (STT):**
- Options: Whisper, Deepgram
- Selection policy: Lowest latency matching language + cost

**Large Language Models (LLM):**
- Options: OpenAI GPT-4o/mini, Claude Haiku, Gemini Flash
- Selection policy: Fit-to-task (reasoning, speed, cost) with fallback + mid-turn consistency lock

**Text-to-Speech (TTS):**
- Options: Cartesia Sonic-2, Azure Neural TTS, ElevenLabs
- Selection policy: Naturalness/consistency first; price arbitrage when possible

**Routing Arbitrage:**
- Strategy: Modality-aware vendor router with health checks & rate caps

**Shared Conversation:**
- AI speech is synchronized to all participants
- Participants use push-to-talk to address AI; normal mic treated as standard audio

---

## Architecture

### Monorepo Structure
- **Manager**: PNPM workspaces
- **Tech Stack**: Next.js 15, React 19, Tailwind CSS, ShadCN UI, Drizzle ORM
- **Packages**:
  - `web_next` (front-end)
  - `signaling` (WebRTC signaling server)
  - `stt_api` (speech services)
  - `config_service` (feature flags & routing)
  - `activity_module` (video channel discovery & playback; to be NPM package)

### Infrastructure
- **Runtime**: Node 20-slim
- **Containers**: Docker Compose (local-all, local-nginx)
- **Network**: chnl_net
- **Persistence**: SQLite (MVP)
- **Cache/Bus**: Redis pub/sub
- **Media Transport**: Daily-like stack (WebRTC)
- **Streaming Output**: OBS → Twitch/YouTube/X restream (future)
- **Load Balancing**: Geo-distributed (planned)

**Observability:**
- Logs: Structured JSON logs
- Metrics: Request latency, room count, AI call latencies, cost per session
- Tracing: Planned (OpenTelemetry)

### Performance Optimizations
- Lazy loading
- Code splitting
- Web workers for heavy tasks
- Optional WebAssembly exploration

---

## Marketplace Model

### Structure
Two-sided marketplace

### Consumers Pay For:
- Subscriptions (monthly/annual)
- In-experience purchases (upsells, power-ups, premium challenges)
- Premium feature access (HD recording, special companions)

### Creators Earn From:
- Revenue shares from consumed activities/tools
- Paid activity participation
- Custom tool monetization
- Marketplace sales (add-ons, companion templates)

### Flywheel
More participants attract more creators who build richer experiences, which increases engagement and revenue → attracts more participants and creators.

---

## Pricing & Costs

### Room Tiers

**Bronze:**
- Description: Bare-bones room with lowest-cost STT/LLM/TTS via arbitrage
- Target: Entry-level social rooms
- COGS: ~$0.03/min
- Price: ~$5/hour

**Silver:**
- Description: Balanced quality vs cost; better TTS & features
- COGS: ~$0.05/min
- Price: ~$8/hour

**Gold:**
- Description: Premium companions, higher fidelity TTS/LLM, advanced features
- COGS: ~$0.07/min
- Price: ~$10/hour

**Notes:**
- COGS driven by STT/LLM/TTS; expect deflation
- Router arbitrage reduces variance
- Sensitivity to speech rate (chars/min) materially affects TTS cost

---

## Go-to-Market Strategy

### Beachhead Market
College sports communities (watch parties + NIL legend companions)

### Target Segments
- **Gamers**: Social immersion experiences
- **Sports Fans**: Interactive watch parties
- **Families/Friends**: Casual hangouts
- **Creators/Admins**: Monetize add-ons & companions

### Positioning
Unlike Discord (chat only), Twitch (one-to-many broadcast), Zoom (meetings), and Jackbox (static party packs), Telegames fuses real-time co-presence + AI companions + a creator marketplace into one multiplayer canvas.

### Channels
- Campus activations & alumni networks
- NIL partnerships & legend companions
- Hackathons and SDK releases for add-on developers
- Sponsorship pilots (e.g., Warner Bros./HBO Sports)

### Developer Ecosystem
- SDKs & APIs for Activities/Companions
- Events: Hackathons, marketplace incentives
- Revenue share tiers with KPIs

---

## Funding & Cap Table

### Strategy
- **Friends & Family SAFE**: $250k–$500k
- **Angels**: $1M target
- **Seed**: $3M+ target

### Allocations (Target)
- Friends & Family Pool: ~5%
- Institutional Pool: ~15%

### Cap Table Context
- Founder equity target: 70%
- Partner equity target: 30% (vesting; subject to change)
- Solo 401(k) investment: Yes (via ROBS; ~$45–50k @ ~$1.36/share; ~33k shares, ~30% plan ownership)

### Legal Artifacts (In-Flight)
- SAFE templates (F&F, Pre-seed)
- Bylaws, board consents, stock certificates, ledgers
- FMV memos; 83(b) templates

---

## Security & Privacy

### Access Control
- User authentication & authorization
- Room passphrase verification
- Admin panel controls

### Privacy
- E2E goals for AV streams where feasible
- Minimal data retention defaults; user-controlled recording

### Audit
- Planned security audit and threat modeling

---

## User Personas

### 1. Campus Superfan
- **Motivation**: Group watch with trivia & biased commentary
- **Triggers**: NCAA schedules, rivalry weeks
- **Conversion Path**: SMS invite → instant join → try free add-on → subscribe

### 2. Party Host
- **Motivation**: Low-friction social fun for mixed groups
- **Triggers**: Weekend gatherings, holidays
- **Conversion Path**: Host room → try one premium game → upgrade

### 3. Creator/Admin
- **Motivation**: Monetize interactive add-ons and companions
- **Triggers**: Hackathons, SDK announcements
- **Conversion Path**: Build pack → list on marketplace → earn revenue

---

## Competitive Landscape

### Primary Competitors
Discord, Twitch, Roblox, Zoom, Jackbox

### Differentiation
- Real-time co-presence + AI companions (shared TTS, live commentary)
- Two-sided marketplace for activities and companions
- Web-first, no-install onboarding with SMS links

---

## KPIs & Metrics

### Growth Metrics
- Weekly active rooms
- Invites sent to joins conversion rate
- DAU/WAU/MAU and cohort retention

### Product Metrics
- Average session length
- Activities per room
- AI interactions per minute
- Latency P95 (STT/LLM/TTS)

### Revenue Metrics
- ARPR (average revenue per room)
- Subscription mix vs microtransaction mix
- Creator payouts and marketplace take rate

---

## Style & Prompting Guidelines

### Agent Instructions

**Default Tone**: Slightly informal, opinionated but collaborative

**Avoid:**
- Verbosity without value
- Generic platitudes
- Assuming mobile app installs (web-first!)

**Emphasize:**
- Actionable next steps
- Numbers, assumptions, and trade-offs
- Short summaries with optional deep dives

### Lexical Preferences

**Preferred Terms:**
- "Gameferencing"
- "Bring Your Own Agent"
- "Companion Avatars"

**Banned/Discouraged:**
- "install our app"
- "download to start"

---

## Integrations

### Media & Streaming
- OBS production rigs
- Twitch/YouTube/X muxed output (planned)

### Vendor Options
- **STT**: Whisper, Deepgram
- **LLM**: OpenAI GPT-4o/mini, Claude Haiku, Gemini Flash
- **TTS**: Cartesia Sonic-2, Azure Neural TTS, ElevenLabs

### Protocols & Orchestration
- Model Context Protocol (MCP)
- Google A2A (Agents-to-Agents) exploratory
- Anthropic MCP server interop

---

## Games Catalog

### Structure Requirements
All games specify: description, AI facilitation, features, player range, game length, difficulty, taxonomy, and image prompt.

### MVP Game List
1. Trivia Titan
2. Match Madness
3. Debate Duel
4. Rapid Riddle
5. Memory Master
6. Virtual Charades
7. Storytelling Relay
8. Choose Your Own Adventure
9. All-Knowing Oracle
10. Virtual Pictionary
11. Guess the Sound
12. Emoji Interpretation
13. Silent Signals
14. Who's Most Likely To
15. Bluff Brigade: Sip or Skip Edition (adult)
16. Engage and Evolve (icebreaker)
17. Fact or Fiction

### Sample Game Definition: Trivia Titan
- **Description**: Fast-paced team trivia with live AI MC (Telly)
- **AI Facilitation**: Reads questions, tracks scores, manages leaderboards, declares winner
- **Features**: Category packs, timers, streak bonuses
- **Players**: 3–12
- **Length**: 15 minutes
- **Difficulty**: Easy, Medium, Hard
- **Taxonomy**: Trivia, Party, Timed
- **Image Prompt**: "A lively living-room watch party morphing into a game show stage, confetti mid-air"

---

## Companion Avatars

### Marketplace Concept
"BYOA" — users select or craft named companions with voices, personalities, and expertise.

### Example Metadata: Tommy Trojan
- **Name**: Tommy Trojan
- **Tags**: USC, college football, hype
- **Voice ID**: voice_tommy_v1
- **Model Path**: /avatars/tommy.glb
- **Personality**: Boisterous, biased for USC, witty

---

## Schemas & Examples

### Room Schema
```typescript
{
  id: string;
  slug: string;  // subdomain
  passphrase_required: boolean;
  host_user_id: string;
  participants: string[];
  media: {
    type: "live" | "vod" | "screen_share";
    source_url: string;
  };
  companion: {
    enabled: boolean;
    name: string;  // e.g., Telly
    mode: "Conversational" | "Customer_Support" | "Game_Show" | "Live_Event";
  };
  settings: {
    recording_enabled: boolean;
    broadcast_mux_enabled: boolean;
  };
  analytics: {
    created_at: datetime;
    durations: { total_minutes: number };
  };
}
```

### Activity Schema
```typescript
{
  id: string;
  name: string;
  category: "trivia" | "rpg" | "poll" | "telestrator";
  config_json: object;
  price_cents: integer;
  revenue_share_percent_to_creator: number;
}
```

### Companion Schema
```typescript
{
  id: string;
  name: string;
  voice_id: string;
  model_path: string;
  system_prompt: string;
  traits: string[];
  tags: string[];
}
```

---

## Constraints & Assumptions

- **Web-first experience**: Do not assume native installs
- **Latency is product-critical**: Prefer low-latency paths even at modest cost premiums
- **Vendor prices deflate over time**: Re-run arbitrage routing periodically

---

## Open Questions

- Exact marketplace take rate tiers?
- Final NIL licensing model for legend companions?
- Recording retention policy durations and user controls?

---

## Backoffice Platform Context

> **Note**: This context file is used by the Telegamez Backoffice Platform — a separate internal tooling system for operations and automation.

### Backoffice Applications
The backoffice platform includes several AI-powered applications that use this context when relevant:

1. **AI Admin Assistant**: Document analysis and email automation
2. **Autonomous Agent Scheduler**: Natural language task scheduling
3. **GitHub Timeline**: Development activity visualization

### Context Injection Strategy
This comprehensive context is **intelligently injected** into LLM prompts based on relevance detection:

✅ **Context included when:**
- User explicitly asks about Telegames/Telegamez
- Queries mention company mission, products, or team
- Task keywords include company-related terms

❌ **Context skipped for:**
- Generic operational queries (90%+ of requests)
- Calendar/email/task automation without company focus
- Saves ~4,500 tokens per non-company query

---

**Last Updated**: 2025-10-02
**Version**: 1.0.0
**Maintained By**: Matt Ference
**For**: Telegames (Channel Networks, Inc.)
