# Infographic Migration Analysis

## Component Copied
✅ `InfographicTeamAlt.vue` → `app/components/InfographicTeamAlt.vue`

## Required Dependencies to Install

### NPM Packages Needed:
```bash
npm install three@^0.182.0
```

**Why:** The shotchart uses Three.js for 3D rendering

### Already Have:
- ✅ vue
- ✅ vue-router  
- ✅ nuxt
- ✅ @nuxtjs/tailwindcss

## Required Components to Copy

All from `examples/puls-basketu-frontend/components/`:

### Core 3D Shotchart Components:
1. **shotchart-3D.vue** (main 3D shotchart component, ~644 lines)
   - Uses: BasketballCourt3D
   
2. **basketball-court-3D.vue** (3D court rendering)
   - Uses: basketball-backboard.vue, Three.js
   
3. **basketball-backboard.vue** (3D backboard model)
   - Pure Three.js component

### Optional (if you want 2D fallback):
4. **shotchart.vue** (2D shotchart)
5. **basketball-court.vue** (2D court)

## Required Composables to Create

### 1. `app/composables/useApiBase.ts`
Already exists in your project but needs to be compatible. The infographic uses:
```typescript
const apiBase = useApiBase()
```

**Action:** Update your existing `useApi` composable or create `useApiBase()` that returns the API base URL.

## Code Modifications Needed in InfographicTeamAlt.vue

### 1. Remove Nuxt Page Meta
```javascript
// REMOVE THIS:
definePageMeta({
    layout: false,
    name: 'game-infographic-team-alt'
})
```

### 2. Change Data Fetching
The component currently uses:
```javascript
const { data: gameData } = await useAsyncData(...)
```

**Need to change to:**
- Fetch data based on props passed from stage page
- Use your existing `useApi()` composable
- Fetch when command is received, not on mount

### 3. Remove Route Dependencies
Currently uses:
```javascript
const route = useRoute()
const game_id = computed(() => route.params.game_id)
const teamType = computed(() => route.query.team || 'home')
```

**Change to:**
- Accept props from parent (game_id, team, speed, etc.)
- Remove all `route.query` and `route.params` references

### 4. Expose show/hide Methods
Add:
```javascript
const show = () => {
  // Start animation
  startAnimation()
}

const hide = () => {
  // Fade out / cleanup
}

defineExpose({ show, hide })
```

### 5. Add Ready Event
```javascript
const emit = defineEmits(['ready'])

// After animation completes:
emit('ready')
```

## File Structure After Migration

```
app/
├── components/
│   ├── InfographicTeamAlt.vue       ✅ Copied
│   ├── Shotchart3D.vue              ⬜ Need to copy
│   ├── BasketballCourt3D.vue        ⬜ Need to copy
│   ├── BasketballBackboard.vue      ⬜ Need to copy
│   └── TextOverlay.vue              ✅ Existing
├── composables/
│   ├── useApiBase.ts                ⬜ Need to create/update
│   ├── useApi.ts                    ✅ Existing
│   ├── useAuth.ts                   ✅ Existing
│   └── useWebSocket.ts              ✅ Existing
```

## Integration with Stage Page

### Command Structure:
```json
{
  "action": "show",
  "graphic": "team-shotchart",
  "game_id": 456,
  "team": "home",
  "speed": 2.0
}
```

### Stage Page Logic:
```vue
<InfographicTeamAlt
  v-if="currentGraphic === 'team-shotchart' && graphicData"
  ref="teamShotchartRef"
  :game-id="graphicData.game_id"
  :team="graphicData.team"
  :speed="graphicData.speed"
  @ready="handleGraphicReady"
/>
```

## Step-by-Step Migration Plan

### Phase 1: Copy Core Components
1. Copy `shotchart-3D.vue` → `app/components/Shotchart3D.vue`
2. Copy `basketball-court-3D.vue` → `app/components/BasketballCourt3D.vue`
3. Copy `basketball-backboard.vue` → `app/components/BasketballBackboard.vue`

### Phase 2: Install Dependencies
1. Run: `npm install three@^0.182.0`

### Phase 3: Create/Update Composables
1. Create `useApiBase()` composable or update existing

### Phase 4: Adapt InfographicTeamAlt.vue
1. Remove page-specific code (definePageMeta, route)
2. Convert to prop-based component
3. Add show/hide methods
4. Add ready event
5. Change data fetching to reactive (fetch when props change)

### Phase 5: Integrate with Stage Page
1. Import component in stage page
2. Add component to template with v-if
3. Handle show/hide/update commands
4. Test with real backend data

## Potential Issues

### 1. **Three.js Bundle Size**
Three.js is large (~600KB). Consider:
- Only importing needed modules
- Lazy loading the 3D components

### 2. **Font Loading**
Component uses Google Fonts (Montserrat). Need to:
- Add to nuxt.config or
- Use `useHead()` composable

### 3. **Asset Paths**
Component references:
- Team logos
- Placeholder images
- Advertising logos

**Action:** Ensure these paths work or update to your CDN

### 4. **API Endpoints**
Component fetches from:
- `/api/v1/games/{game_id}`
- `/api/v1/games/{game_id}/shots` or `/api/v1/games/{game_id}/live-shots`

**Action:** Verify these endpoints exist in your backend

## Estimated Complexity

- **Easy:** Copy components (10 min)
- **Easy:** Install npm packages (5 min)
- **Medium:** Update composables (15 min)
- **Medium:** Adapt InfographicTeamAlt component (30-45 min)
- **Easy:** Integrate with stage page (15 min)
- **Medium:** Testing and debugging (30-60 min)

**Total:** ~2-3 hours for full migration

## Testing Checklist

- [ ] Component renders without errors
- [ ] Data fetches correctly from API
- [ ] 3D shotchart displays properly
- [ ] Animation plays at correct speed
- [ ] Show/hide methods work
- [ ] Ready event fires
- [ ] Works in OBS browser source
- [ ] Preview shows correctly
- [ ] Team switching works (home/away)
- [ ] Handles missing data gracefully
