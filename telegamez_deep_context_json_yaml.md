# Telegamez Deep Context — Portable Memory for LLM Agentic Frameworks

> **Purpose**: A drop‑in, structured context file capturing Matt + Telegamez so any LLM/agent can operate with full situational awareness. Includes YAML (authoritative) and a JSON mirror.
> **Owner**: Matt Ference (preferred name: Matt)
> **Last updated**: 2025-10-02
> **Version**: 1.0

---

## YAML (authoritative)

telegamez_context:
  meta:
    version: 1.0
    last_updated: "2025-10-02"
    owner: "Matt Ference"
    preferred_name: "Matt"
    timezone: "America/Los_Angeles"
    language: "en-US"

  founder_profile:
    legal_name: "Matt Ference"
    role: "Founder & CEO (Product Owner mindset)"
    location: "Thousand Oaks, CA"
    professional_summary: |
      20+ years in streaming media; helped deliver CNN’s first livestream, the first MLB livestream,
      and the first 5G live sports stream (2020 Super Bowl). Former Prime Video lead (Thursday Night
      Football). Expert in live sports/music/movie streaming, product development, and web
      engineering. Builder-first, iterative, and data-driven.
    voice_tone_preferences:
      - slightly informal
      - opinionated with room for debate
      - concise and action-oriented
      - collaborative/product-thinking
    passions_interests:
      - USC football
      - swimming
      - pickleball
      - Unreal Engine (mixed/virtual production)
      - photography & cinematography
      - video games & streaming
      - all things tech
    goals:
      - transition to entrepreneurial freedom; no pension → financial independence via Telegames
      - monetize passions through products and services
      - build a category-defining real-time, AI-powered communal entertainment platform

  company:
    legal_name: "Channel Networks, Inc."
    structure: "Delaware C‑Corp"
    dba: "Telegames"  # formerly Telegamez; domain telegames.ai
    former_style: "Telegamez"
    brand:
      primary_domain: "https://telegames.ai"
      taglines:
        - "Smarter Play. Together."
        - "Joy Needs Witnesses."
        - "Turning passive viewers into active communities."
      concepts:
        - "Gameferencing"  # gamified, casual, social AI-powered hangouts
        - "Bring Your Own Agent"  # BYOA marketplace for companions
      colors:
        - name: deep_blue
          hex: "#18385d"
        - name: hot_magenta
          hex: "#ff0090"
        - name: sky_highlight
          hex: "#7ee2ff"
      naming_conventions:
        - "Use 'Z' at the end for divisions (Gamez, Schoolz)"
        - "Use 'C' in titles where culturally relevant"
    one_liner: "Making Multimodal AI a Multiplayer Communal Experience."
    elevator_pitch: |
      Telegames turns passive viewing into shared, AI-powered play. It fuses real-time co-presence,
      AI companions, and creator-built activities into a multiplayer web experience—no install,
      just click a link and you’re in.

  product:
    experience_type: "WebRTC web app (no install friction); invite via SMS/URL"
    core_pillars:
      - real_time_copresence
      - ai_companions (aka "Companion Avatars")
      - creator_marketplace (Activities/Add-ons/Tools)
    modules:
      - rooms
      - activities (games, quizzes, polls, telestrator, RPG scaffolds)
      - companions (AI hosts/MCs with personalities + expertise)
      - media (co-watch streams, VOD, live inputs, muxed outputs)
      - recording_replay (server-side)
      - leaderboard_scores
      - invites (SMS/share links)
      - admin_panel (add-on packs, room config, moderation)
    invite_flow:
      - host reserves subdomain and room
      - host sets passphrase/security
      - host shares link over SMS
      - friends click → browser prompt mic/cam → join live room
    mvp_status:
      done:
        - real-time audio/video via WebRTC
        - passphrases & subdomains (ports 3000/3001; docker network chnl_net; SQLite persistence)
        - initial games catalog (see games_catalog)
        - admin auth basic
      near_term:
        - co-watch live sports with AI commentary
        - add-on marketplace (polls/quizzes/telestrator/RPG)
        - server-side recording (hidden WebRTC server participant → FFmpeg MP4)
        - muxed streaming to Twitch/YouTube/X
        - user profiles + social login
        - geo-distributed infra + load balancing
        - performance optimizations (lazy loading, code splitting, web workers)
    ux_philosophy:
      - low friction join; everything in-browser
      - shared AI that feels like a human participant
      - dynamic UI controls from AI (buttons/prompts/menus)
      - synchronized experiences (shared TTS audio, telestration)

  ai_agent_system:
    default_companion: "Telly"
    telly:
      roles_modes:
        - name: Conversational
          purpose: default casual conversations & small talk facilitation
        - name: Customer_Support
          purpose: structured feedback/bug reporting; triage templates; data capture
        - name: Game_Show
          purpose: trivia & challenges; points tracking; leaderboards; winner selection
        - name: Live_Event
          purpose: co-watching with biased commentary, catch-up highlights, real-time challenges
      high_level_capabilities:
        - persistent_and_augmented_data_sources
        - timely_data_processing
        - periodic_fine_tuning_or_RAG_updates
        - shared_TTS_audio_playback_across_peers
        - push_to_talk_hotkey_wake_words
        - interruption_handling (wake words/hotkeys required in multi-party rooms)
      knowledge_base_requirements:
        - pre-room context (room topic, participants, preferences)
        - subject matter packs (sports teams, rules, player stats)
        - host/participant names and roles when available
      response_adaptability:
        low_latency_bias: true
        quick_vs_verbose_triage: analyze user intent and route
        user_cues_during_delays: audible/visual progress cues
      stt_llm_tts_pipeline:
        stt:
          options: [Whisper, Deepgram]
          selection_policy: "lowest_latency_matching_language + cost"
        llm:
          options: [OpenAI GPT-4o/mini, Claude Haiku, Gemini Flash]
          selection_policy: "fit-to-task (reasoning, speed, cost)
            with fallback + mid-turn consistency lock"
        tts:
          options: [Cartesia Sonic-2, Azure Neural TTS, ElevenLabs]
          selection_policy: "naturalness/consistency first; price arbitrage when possible"
        routing_arbitrage:
          strategy: "modality-aware vendor router with health checks & rate caps"
      shared_conversation:
        - AI speech is synchronized to all participants
        - Participants use push-to-talk to address AI; normal mic treated as standard audio

  architecture:
    monorepo:
      manager: "PNPM workspaces"
      tech: [Next.js 15, React, Tailwind, ShadCN UI, Drizzle ORM]
      packages:
        - web_next (front-end)
        - signaling (WebRTC signaling server)
        - stt_api (speech services)
        - config_service (feature flags & routing)
        - activity_module (video channel discovery & playback; to be NPM package)
    infra:
      runtime: Node 20-slim
      containers: Docker Compose (local-all, local-nginx)
      network: chnl_net
      persistence: SQLite (MVP)
      cache_bus: Redis pub/sub
      media_transport: Daily-like stack (WebRTC)
      streaming_output: OBS → Twitch/YouTube/X restream (future)
      load_balancing_geo: planned
      observability:
        - logs: structured JSON logs
        - metrics: request latency, room count, AI call latencies, cost per session
        - tracing: planned (OpenTelemetry)
    performance:
      - lazy_loading
      - code_splitting
      - web_workers for heavy tasks
      - optional WebAssembly exploration

  marketplace_model:
    structure: two_sided
    consumers_pay:
      - subscriptions (monthly/annual)
      - in-experience purchases (upsells, power-ups, premium challenges)
      - premium feature access (HD recording, special companions)
    creators_earn:
      - revenue_shares from consumed activities/tools
      - paid activity participation
      - custom tool monetization
      - marketplace sales (add-ons, companion templates)
    flywheel: |
      More participants attract more creators who build richer experiences, which increases
      engagement and revenue → attracts more participants and creators.

  pricing_costs:
    room_tiers:
      bronze:
        description: "Bare-bones room with lowest-cost STT/LLM/TTS via arbitrage"
        target_positioning: "entry-level social rooms"
        indicative_cogs_per_min_usd: 0.03  # directional; adjust as vendors change
        indicative_price_per_hour_usd: 5
      silver:
        description: "Balanced quality vs cost; better TTS & features"
        indicative_cogs_per_min_usd: 0.05
        indicative_price_per_hour_usd: 8
      gold:
        description: "Premium companions, higher fidelity TTS/LLM, advanced features"
        indicative_cogs_per_min_usd: 0.07
        indicative_price_per_hour_usd: 10
    notes:
      - "COGS driven by STT/LLM/TTS; expect deflation; router arbitrage reduces variance"
      - "Sensitivity to speech rate (chars/min) materially affects TTS cost"

  go_to_market:
    beachhead: "College sports communities (watch parties + NIL legend companions)"
    target_segments:
      - gamers (social immersion)
      - sports fans (interactive watch parties)
      - families/friends (casual hangouts)
      - creators/admins (monetize add-ons & companions)
    positioning: |
      Unlike Discord (chat only), Twitch (one-to-many broadcast), Zoom (meetings), and Jackbox
      (static party packs), Telegames fuses real-time co-presence + AI companions + a creator
      marketplace into one multiplayer canvas.
    channels:
      - campus activations & alumni networks
      - NIL partnerships & legend companions
      - hackathons and SDK releases for add-on developers
      - sponsorship pilots (e.g., Warner Bros./HBO Sports)
    developer_ecosystem:
      - SDKs & APIs for Activities/Companions
      - events: hackathons, marketplace incentives
      - revenue_share_tiers with KPIs

  funding_cap_table:
    strategy:
      - friends_and_family_SAFE: "$250k–$500k"
      - angels: "$1M target"
      - seed: "$3M+ target"
    allocations_targets:
      - friends_and_family_pool: 0.05  # ~5%
      - institutional_pool: 0.15  # ~15%
    cap_table_context:
      - founder_equity_target: 0.70
      - partner_equity_target: 0.30 (vesting; subject to change)
      - solo_401k_investment: true  # via ROBS; ~US$45–50k @ ~US$1.36/share (~33k shares, ~30% plan ownership)
    legal_artifacts_in-flight:
      - SAFE templates (F&F, Pre-seed)
      - bylaws, board consents, stock certificates, ledgers
      - FMV memos; 83(b) templates

  security_privacy:
    access_control:
      - user authentication & authorization
      - room passphrase verification
      - admin panel controls
    privacy:
      - E2E goals for AV streams where feasible
      - minimal data retention defaults; user-controlled recording
    audit:
      - planned security audit and threat modeling

  personas:
    - name: Campus Superfan
      motivation: "Group watch with trivia & biased commentary"
      triggers: [NCAA schedules, rivalry weeks]
      conversion_path: "SMS invite → instant join → try free add-on → subscribe"
    - name: Party Host
      motivation: "Low-friction social fun for mixed groups"
      triggers: [weekend gatherings, holidays]
      conversion_path: "host room → try one premium game → upgrade"
    - name: Creator/Admin
      motivation: "Monetize interactive add-ons and companions"
      triggers: [hackathons, SDK announcements]
      conversion_path: "build pack → list on marketplace → earn revenue"

  competitors_landscape:
    primary: [Discord, Twitch, Roblox, Zoom, Jackbox]
    differentiation:
      - "Real-time co-presence + AI companions (shared TTS, live commentary)"
      - "Two-sided marketplace for activities and companions"
      - "Web-first, no-install onboarding with SMS links"

  kpis_metrics:
    growth:
      - weekly_active_rooms
      - invites_sent_to_joins_conversion_rate
      - DAU/WAU/MAU and cohort retention
    product:
      - avg_session_length
      - activities_per_room
      - AI_interactions_per_minute
      - latency_p95 (STT/LLM/TTS)
    revenue:
      - ARPR (average revenue per room)
      - subscription_mix vs microtransaction_mix
      - creator_payouts and marketplace take rate

  style_and_prompting:
    agent_instructions:
      default_tone: "slightly informal, opinionated but collaborative"
      avoid:
        - verbosity without value
        - generic platitudes
        - assuming mobile app installs (web-first!)
      emphasize:
        - actionable next steps
        - numbers, assumptions, and trade-offs
        - short summaries with optional deep dives
    lexical_preferences:
      preferred_terms: ["Gameferencing", "Bring Your Own Agent", "Companion Avatars"]
      banned_or_discouraged: ["install our app", "download to start"]

  integrations:
    media_and_streaming:
      - OBS production rigs
      - Twitch/YouTube/X muxed output (planned)
    vendor_options:
      stt: [Whisper, Deepgram]
      llm: [OpenAI 4o/mini, Claude Haiku, Gemini Flash]
      tts: [Cartesia Sonic-2, Azure Neural TTS, ElevenLabs]
    protocols_orchestration:
      - Model Context Protocol (MCP)
      - Google A2A (Agents-to-Agents) exploratory
      - Anthropic MCP server interop

  games_catalog:
    required_structure_note: "All games specify description, AI facilitation, features, player range, game length, difficulty, taxonomy, and an image prompt."
    mvp_list:
      - Trivia Titan
      - Match Madness
      - Debate Duel
      - Rapid Riddle
      - Memory Master
      - Virtual Charades
      - Storytelling Relay
      - Choose Your Own Adventure
      - All-Knowing Oracle
      - Virtual Pictionary
      - Guess the Sound
      - Emoji Interpretation
      - Silent Signals
      - Who's Most Likely To
      - Bluff Brigade: Sip or Skip Edition (adult)
      - Engage and Evolve (icebreaker)
      - Fact or Fiction
    sample_game_definition:
      name: "Trivia Titan"
      description: "Fast-paced team trivia with live AI MC (Telly)"
      ai_facilitation: ["reads questions", "tracks scores", "leaderboards", "declares winner"]
      features: ["category packs", "timers", "streak bonuses"]
      players: "3–12"
      length_minutes: 15
      difficulty: ["easy", "medium", "hard"]
      taxonomy: ["trivia", "party", "timed"]
      image_prompt: "A lively living-room watch party morphing into a game show stage, confetti mid-air"

  companion_avatars:
    marketplace_concept: "BYOA — users select or craft named companions with voices, personalities, and expertise."
    example_metadata:
      name: "Tommy Trojan"
      tags: ["USC", "college football", "hype"]
      voice_id: "voice_tommy_v1"
      model_path: "/avatars/tommy.glb"
      personality: "boisterous, biased for USC, witty"

  schemas_examples:
    room_schema:
      id: string
      slug: string  # subdomain
      passphrase_required: boolean
      host_user_id: string
      participants: [string]
      media:
        type: ["live", "vod", "screen_share"]
        source_url: string
      companion:
        enabled: boolean
        name: string  # e.g., Telly
        mode: ["Conversational", "Customer_Support", "Game_Show", "Live_Event"]
      settings:
        recording_enabled: boolean
        broadcast_mux_enabled: boolean
      analytics:
        created_at: datetime
        durations: { total_minutes: number }
    activity_schema:
      id: string
      name: string
      category: ["trivia", "rpg", "poll", "telestrator"]
      config_json: object
      price_cents: integer
      revenue_share_percent_to_creator: number
    companion_schema:
      id: string
      name: string
      voice_id: string
      model_path: string
      system_prompt: string
      traits: [string]
      tags: [string]

  constraints_and_assumptions:
    - "Web-first experience; do not assume native installs"
    - "Latency is product-critical; prefer low-latency paths even at modest cost premiums"
    - "Vendor prices deflate over time; re-run arbitrage routing periodically"

  open_questions:
    - "Exact marketplace take rate tiers?"
    - "Final NIL licensing model for legend companions?"
    - "Recording retention policy durations and user controls?"

---

## JSON (mirror of core fields)

{
  "telegamez_context": {
    "meta": {
      "version": "1.0",
      "last_updated": "2025-10-02",
      "owner": "Matt Ference",
      "preferred_name": "Matt",
      "timezone": "America/Los_Angeles",
      "language": "en-US"
    },
    "founder_profile": {
      "legal_name": "Matt Ference",
      "role": "Founder & CEO (Product Owner mindset)",
      "location": "Thousand Oaks, CA",
      "professional_summary": "20+ years in streaming media; CNN first livestream, MLB first livestream, 5G Super Bowl; ex-Prime Video (TNF). Builder-first.",
      "voice_tone_preferences": ["slightly informal", "opinionated with room for debate", "concise", "collaborative"],
      "passions_interests": ["USC football", "swimming", "pickleball", "Unreal Engine", "photography", "cinematography", "video games", "streaming", "tech"],
      "goals": ["entrepreneurial freedom", "monetize passions", "build category-defining platform"]
    },
    "company": {
      "legal_name": "Channel Networks, Inc.",
      "structure": "Delaware C‑Corp",
      "dba": "Telegames",
      "former_style": "Telegamez",
      "brand": {
        "primary_domain": "https://telegames.ai",
        "taglines": ["Smarter Play. Together.", "Joy Needs Witnesses.", "Turning passive viewers into active communities."],
        "concepts": ["Gameferencing", "Bring Your Own Agent"],
        "colors": [{"name": "deep_blue", "hex": "#18385d"}, {"name": "hot_magenta", "hex": "#ff0090"}, {"name": "sky_highlight", "hex": "#7ee2ff"}],
        "naming_conventions": ["Use 'Z' at the end for divisions (Gamez, Schoolz)", "Use 'C' in titles where culturally relevant"]
      },
      "one_liner": "Making Multimodal AI a Multiplayer Communal Experience.",
      "elevator_pitch": "Telegames turns passive viewing into shared, AI-powered play with real-time co-presence, AI companions, and creator activities."
    },
    "product": {
      "experience_type": "WebRTC web app (no install); invite via SMS/URL",
      "core_pillars": ["real_time_copresence", "ai_companions", "creator_marketplace"],
      "modules": ["rooms", "activities", "companions", "media", "recording_replay", "leaderboard_scores", "invites", "admin_panel"],
      "invite_flow": ["reserve subdomain", "set passphrase", "share link", "browser mic/cam", "join"],
      "mvp_status": {
        "done": ["WebRTC AV", "passphrases & subdomains", "initial games", "basic admin auth"],
        "near_term": ["co-watch sports", "add-on marketplace", "server-side recording", "muxed streaming", "profiles+social", "geo load balancing", "perf optimizations"]
      },
      "ux_philosophy": ["low friction join", "AI feels human", "dynamic AI UI controls", "synchronized experiences"]
    },
    "ai_agent_system": {
      "default_companion": "Telly",
      "telly": {
        "roles_modes": [{"name": "Conversational"}, {"name": "Customer_Support"}, {"name": "Game_Show"}, {"name": "Live_Event"}],
        "high_level_capabilities": ["RAG/persistent data", "timely data processing", "periodic updates", "shared TTS", "push-to-talk", "interruptions via wake words"],
        "knowledge_base_requirements": ["pre-room context", "subject packs", "participant names"],
        "response_adaptability": {"low_latency_bias": true, "quick_vs_verbose_triage": true, "user_cues_during_delays": true},
        "stt_llm_tts_pipeline": {
          "stt": {"options": ["Whisper", "Deepgram"], "selection_policy": "latency+cost"},
          "llm": {"options": ["OpenAI 4o/mini", "Claude Haiku", "Gemini Flash"], "selection_policy": "fit-to-task with fallback"},
          "tts": {"options": ["Cartesia Sonic-2", "Azure Neural TTS", "ElevenLabs"], "selection_policy": "naturalness+price"},
          "routing_arbitrage": {"strategy": "modality-aware router with health checks"}
        },
        "shared_conversation": ["AI speech synchronized", "push-to-talk for AI address"]
      }
    },
    "architecture": {
      "monorepo": {
        "manager": "PNPM",
        "tech": ["Next.js 15", "React", "Tailwind", "ShadCN UI", "Drizzle ORM"],
        "packages": ["web_next", "signaling", "stt_api", "config_service", "activity_module"]
      },
      "infra": {
        "runtime": "Node 20-slim",
        "containers": "Docker Compose",
        "network": "chnl_net",
        "persistence": "SQLite",
        "cache_bus": "Redis",
        "media_transport": "WebRTC (Daily-like)",
        "streaming_output": "OBS → Twitch/YouTube/X",
        "load_balancing_geo": "planned",
        "observability": ["JSON logs", "latency & cost metrics", "OpenTelemetry planned"]
      },
      "performance": ["lazy_loading", "code_splitting", "web_workers", "WebAssembly exploration"]
    },
    "marketplace_model": {
      "structure": "two_sided",
      "consumers_pay": ["subscriptions", "in-experience purchases", "premium feature access"],
      "creators_earn": ["revenue shares", "paid participation", "tool monetization", "marketplace sales"],
      "flywheel": "participants → creators → richer experiences → more revenue → more participants"
    },
    "pricing_costs": {
      "room_tiers": {
        "bronze": {"description": "bare-bones low-cost", "indicative_cogs_per_min_usd": 0.03, "indicative_price_per_hour_usd": 5},
        "silver": {"description": "balanced", "indicative_cogs_per_min_usd": 0.05, "indicative_price_per_hour_usd": 8},
        "gold": {"description": "premium", "indicative_cogs_per_min_usd": 0.07, "indicative_price_per_hour_usd": 10}
      },
      "notes": ["COGS driven by STT/LLM/TTS; expect deflation", "Speech rate impacts TTS cost"]
    },
    "go_to_market": {
      "beachhead": "college sports",
      "target_segments": ["gamers", "sports fans", "families/friends", "creators/admins"],
      "positioning": "Co-presence + AI companions + marketplace",
      "channels": ["campus", "NIL", "hackathons", "sponsorship pilots"],
      "developer_ecosystem": ["SDKs/APIs", "hackathons", "revenue share tiers"]
    },
    "funding_cap_table": {
      "strategy": ["F&F SAFE $250k–$500k", "angels $1M", "seed $3M+"],
      "allocations_targets": {"friends_and_family_pool": 0.05, "institutional_pool": 0.15},
      "cap_table_context": {"founder_equity_target": 0.7, "partner_equity_target": 0.3, "solo_401k_investment": true},
      "legal_artifacts_in_flight": ["SAFE templates", "bylaws", "board consents", "stock certs & ledgers", "FMV memos", "83(b) templates"]
    },
    "security_privacy": {
      "access_control": ["authz/authn", "passphrase rooms", "admin controls"],
      "privacy": ["E2E goals for AV where feasible", "minimal retention", "user-controlled recording"],
      "audit": ["planned security audit", "threat modeling"]
    },
    "personas": [
      {"name": "Campus Superfan", "motivation": "watch + trivia + biased commentary", "triggers": ["NCAA schedule"], "conversion_path": "invite → join → free add-on → subscribe"},
      {"name": "Party Host", "motivation": "low-friction social fun", "triggers": ["weekends", "holidays"], "conversion_path": "host → premium game → upgrade"},
      {"name": "Creator/Admin", "motivation": "monetize add-ons/companions", "triggers": ["hackathons", "SDK"], "conversion_path": "build → list → earn"}
    ],
    "competitors_landscape": {
      "primary": ["Discord", "Twitch", "Roblox", "Zoom", "Jackbox"],
      "differentiation": ["AI companions with shared TTS", "two-sided marketplace", "web-first onboarding"]
    },
    "kpis_metrics": {
      "growth": ["weekly_active_rooms", "invite-to-join conversion", "DAU/WAU/MAU"],
      "product": ["avg_session_length", "activities_per_room", "AI_interactions_per_minute", "latency_p95"],
      "revenue": ["ARPR", "subscription vs microtransaction mix", "creator_payouts", "take rate"]
    },
    "style_and_prompting": {
      "agent_instructions": {"default_tone": "slightly informal, opinionated, collaborative", "avoid": ["verbosity", "platitudes", "mobile-install assumptions"], "emphasize": ["actions", "numbers", "trade-offs", "summaries"]},
      "lexical_preferences": {"preferred_terms": ["Gameferencing", "Bring Your Own Agent", "Companion Avatars"], "banned_or_discouraged": ["install our app", "download to start"]}
    },
    "integrations": {
      "media_and_streaming": ["OBS", "Twitch/YouTube/X"],
      "vendor_options": {"stt": ["Whisper", "Deepgram"], "llm": ["OpenAI 4o/mini", "Claude Haiku", "Gemini Flash"], "tts": ["Cartesia Sonic-2", "Azure Neural TTS", "ElevenLabs"]},
      "protocols_orchestration": ["MCP", "A2A exploratory", "Anthropic MCP server interop"]
    },
    "games_catalog": {
      "required_structure_note": "games define desc, AI facilitation, features, players, length, difficulty, taxonomy, image prompt",
      "mvp_list": ["Trivia Titan", "Match Madness", "Debate Duel", "Rapid Riddle", "Memory Master", "Virtual Charades", "Storytelling Relay", "Choose Your Own Adventure", "All-Knowing Oracle", "Virtual Pictionary", "Guess the Sound", "Emoji Interpretation", "Silent Signals", "Who's Most Likely To", "Bluff Brigade: Sip or Skip Edition", "Engage and Evolve", "Fact or Fiction"]
    },
    "companion_avatars": {
      "marketplace_concept": "BYOA",
      "example_metadata": {"name": "Tommy Trojan", "tags": ["USC", "college football"], "voice_id": "voice_tommy_v1", "model_path": "/avatars/tommy.glb", "personality": "boisterous, USC-biased, witty"}
    },
    "schemas_examples": {
      "room_schema": {"id": "string", "slug": "string", "passphrase_required": "boolean", "host_user_id": "string", "participants": ["string"], "media": {"type": ["live", "vod", "screen_share"], "source_url": "string"}, "companion": {"enabled": "boolean", "name": "string", "mode": ["Conversational", "Customer_Support", "Game_Show", "Live_Event"]}, "settings": {"recording_enabled": "boolean", "broadcast_mux_enabled": "boolean"}, "analytics": {"created_at": "datetime", "durations": {"total_minutes": "number"}}},
      "activity_schema": {"id": "string", "name": "string", "category": ["trivia", "rpg", "poll", "telestrator"], "config_json": {}, "price_cents": 0, "revenue_share_percent_to_creator": 0},
      "companion_schema": {"id": "string", "name": "string", "voice_id": "string", "model_path": "string", "system_prompt": "string", "traits": ["string"], "tags": ["string"]}
    },
    "constraints_and_assumptions": ["web-first", "latency-critical", "vendor price deflation"],
    "open_questions": ["marketplace take rate tiers", "NIL licensing model", "recording retention policies"]
  }
}

