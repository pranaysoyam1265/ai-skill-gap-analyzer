# SkillMatch Frontend Documentation

This directory contains comprehensive documentation for the SkillMatch frontend application.

## Files

- **ARCHITECTURE.md** - Complete architecture documentation with data flows, state management, and API integration
- **IMPLEMENTATION_ROADMAP.md** - Prioritized implementation checklist with time estimates
- **diagrams/user-flow.mmd** - Mermaid diagram of all user flows
- **diagrams/data-flow.mmd** - Mermaid diagram of data flow architecture
- **diagrams/schema.mmd** - Entity relationship diagram
- **diagrams/flows.json** - Structured JSON representation of user flows

## Quick Start

1. View architecture: Open `ARCHITECTURE.md`
2. Check roadmap: Open `IMPLEMENTATION_ROADMAP.md`
3. View diagrams: Open `.mmd` files in [Mermaid Live Editor](https://mermaid.live)

## Diagram Generation

To generate PNG images from Mermaid diagrams:

```bash
# Install Mermaid CLI
npm install -g @mermaid-js/mermaid-cli

# Generate PNG
mmdc -i diagrams/user-flow.mmd -o diagrams/user-flow.png
mmdc -i diagrams/data-flow.mmd -o diagrams/data-flow.png
mmdc -i diagrams/schema.mmd -o diagrams/schema.png
```

## Next Steps

See `IMPLEMENTATION_ROADMAP.md` for prioritized tasks. Start with Sprint 1 (Foundation Fixes).

## Key Findings

### ✅ Implemented
- Resume upload with Supabase Storage integration
- FastAPI backend integration
- Zustand state management with persistence
- Authentication flow
- Resume deletion

### ❌ Missing/Critical
- Backend API integration in gap analysis page
- API functions for skill gaps and recommendations
- Proficiency level display
- Multi-resume selector
- Course filtering UI

### 🔧 Recommended Next Steps
1. Add `getSkillGaps()` and `getRecommendations()` to fastapi-client.ts
2. Integrate backend API calls in gap-analysis page
3. Create SkillBadge component with proficiency display
4. Build course filtering page

