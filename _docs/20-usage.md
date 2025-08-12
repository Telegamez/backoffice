# Usage Guide

## Seed Demo Segments
```
POST http://localhost:3100/api/seed-segments
```

## Sync GitHub Data
Use your PAT from `.env.local`:
```
POST http://localhost:3100/api/github-sync
Content-Type: application/json
{
  "repo": "Telegamez/telegamez",
  "perPage": 100,
  "maxPages": 20
}
```

## Map Weekly Timeline Segments
```
POST http://localhost:3100/api/map-timeline
Content-Type: application/json
{}
```
This aggregates synced issues/PRs into weekly `timeline_segments`.

## View Segments
```
GET http://localhost:3100/api/segments
```

## AI Insights
The UI streams insights for the selected segment. You can also call directly:
```
POST http://localhost:3100/api/insights
Content-Type: application/json
{
  "data": [ { /* minimal segment shape */ } ],
  "selectedCategories": ["ui-ux"]
}
```

Notes:
- Ensure `OPENAI_API_KEY` is valid.
- Default `OPENAI_MODEL` is `gpt-5`.

## Timeline UI Tips
- Toggle `compact` mode to remove empty date gaps.
- Use zoom controls (weeks/months/quarters/year) for granularity.
