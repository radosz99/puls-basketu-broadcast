# Broadcast System MVP - Setup & Usage

## What's Been Implemented

### Core Infrastructure ✅
- **Nuxt 4 config** with SSR disabled, Tailwind installed
- **Environment variables** (.env file created with API endpoints)
- **Auth composable** (useAuth) - handles login, token storage in localStorage, token refresh
- **API composable** (useApi) - handles all API calls with automatic token refresh on 401
- **WebSocket composable** (useWebSocket) - handles connections with exponential backoff reconnection
- **Infographic composable** (useInfographic) - standardized show/hide/animation control for all graphics

### Pages ✅
1. **Login page** (`/login`) - email/password authentication
2. **Control panel** (`/`) - BROADCAST user interface with:
   - Status bar (Panel WS, Preview WS, Stage outputs, current graphic)
   - League selector (with localStorage persistence)
   - Game picker (auto-refreshing, in-progress games first, sorted by date)
   - Graphic type selector (Team Shotchart, Player Shotchart, League Table)
   - Team/player selection with logos and stats
   - Advanced controls:
     - Title customization
     - Speed slider (0.5x - 3.0x)
     - Overlay opacity slider (0% - 100%, default 70%)
     - Advertising boards toggle
   - Preview background toggle
   - Action buttons:
     - **PODGLĄD** - Safe preview (shows only in iframe, not live)
     - **POKAŻ NA ŻYWO** - Live broadcast (shows on all outputs)
     - **UKRYJ** - Hide all graphics
     - **Wyczyść wszystko** - Clear everything
   - Live preview (right side) - scaled iframe of stage page with optional court background
3. **Stage page** (`/stage/[channel_id]`) - OBS browser source page with:
   - WebSocket connection as output role
   - Multiple infographic components (shotchart, table)
   - Heartbeat ping/pong handling
   - Preview mode support with optional background image
   - PostMessage listener for preview commands (safe preview without WebSocket broadcast)
4. **Channels management** (`/channels`) - SUPER_ADMIN only page with:
   - List all channels with online status
   - Create new channels
   - Regenerate broadcast keys
   - View recent events per channel
5. **Test page** (`/test`) - Development testing page for infographics

### Infographic Components ✅
- **InfographicShotchart.vue** - Basketball shot chart with:
  - Team mode and Player mode
  - 3D court visualization with camera animations
  - Live game support
  - Customizable overlay opacity
  - Preview mode support
  - Advertising boards integration
- **InfographicTableHorizontal.vue** - League standings table:
  - Horizontal team tiles with logos, abbreviations, points
  - Slide-in animation from top
  - Live data fetching from league API
  - Auto-positioned at top of screen

### Features ✅
- **Real-time game data** - Auto-refresh every 5 seconds without UI flicker
- **Smart game sorting** - In-progress games first, then by date descending
- **localStorage persistence** - League, game, broadcast key, preferences
- **Preview system** - Safe preview vs live broadcast modes
- **Responsive preview** - Auto-scaled iframe with optional court background
- **Dynamic overlay** - Adjustable background darkness (0-100%)
- **CSS animations** - @keyframes for reliable stage rendering
- **Silent data refresh** - No "loading" flashing during auto-updates

## Running the Project

```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Testing the Flow

### 1. Login
- Go to `http://localhost:3000/login`
- Enter credentials (must exist in your backend)

### 2. As BROADCAST user:
- After login, you'll land on the control panel
- The panel will fetch your channel from `/api/v1/broadcast/channels/me`
- WebSocket connects automatically to control the broadcast

### 3. Open Stage Page in OBS:
- URL: `http://localhost:3000/stage/YOUR_CHANNEL_ID?key=YOUR_BROADCAST_KEY`
- Add as Browser Source in OBS
- Recommended resolution: 1920x1080
- Check "Shutdown source when not visible" is OFF
- The stage will connect via WebSocket and wait for commands

### 4. Test Team Shotchart:
1. Select a league (e.g., PLK)
2. Pick a game from the dropdown
3. Click "Mapa rzutów drużyny"
4. Select home or away team
5. (Optional) Customize title, speed, overlay opacity in Advanced section
6. Click **PODGLĄD** to safely preview in the iframe (doesn't go live)
7. If satisfied, click **POKAŻ NA ŻYWO** to broadcast
8. The shotchart appears with smooth animation
9. Status bar shows graphic is on air
10. Click **UKRYJ** to remove it

### 5. Test Player Shotchart:
1. Select a league and game
2. Click "Mapa rzutów zawodnika"
3. Select team, then select player from the grid
4. Follow steps 5-10 from Team Shotchart above

### 6. Test League Table:
1. Select a league (e.g., PLK)
2. Click "Tabela ligowa"
3. Click **PODGLĄD** or **POKAŻ NA ŻYWO**
4. Horizontal table slides in from top with team logos and points
5. Click **UKRYJ** to remove

### 7. Preview Features:
- Toggle "Pokaż tło parkietu w podglądzie" to show/hide court background
- Adjust "Przezroczystość tła" slider to control background darkness
- All settings are saved to localStorage and persist across page refreshes

### 8. As SUPER_ADMIN user:
- After login, you'll be redirected to `/channels`
- Create new channels, regenerate keys
- View online status of all channels
- See recent events for each channel

## Important Notes

### WebSocket Connection
- **Control panel** connects with JWT token as "control" role
- **Stage page** connects with broadcast key from URL as "output" role
- **Preview iframe** connects with same broadcast key but marked as preview
- Automatic reconnection with exponential backoff (1s, 2s, 4s, 8s, 16s max)
- On 4001 close (token expired), automatically refreshes token before reconnecting
- Heartbeat ping/pong keeps connection alive

### Preview System (Two Modes)
1. **Safe Preview (PODGLĄD button)**:
   - Sends command via `postMessage` directly to preview iframe
   - Does NOT go through WebSocket
   - Only affects the preview, never goes live
   - Perfect for testing before broadcast

2. **Live Preview + Broadcast (POKAŻ NA ŻYWO button)**:
   - Sends command via WebSocket to ALL outputs
   - Goes to both preview iframe AND live stage pages
   - Both preview and live show the same graphic

### Preview Background
- Preview iframe URL: `/stage/[channel_id]?preview=true&showbg=true`
- `showbg=true` enables court background image display
- Background only shows when:
  - In preview mode (`?preview=true`)
  - Background toggle is enabled
  - File exists at `/public/preview_bg.png`
- Live stage pages never show background (always transparent)

### Overlay Opacity
- Controlled by slider in Advanced section (0-100%, default 70%)
- Affects the dark overlay (`rgba(0, 0, 0, X)`) that sits behind graphics
- Lower values = lighter background (better to see preview image)
- Higher values = darker background (graphics pop more)
- Sent with every show command as `overlay_opacity` parameter

### Data Persistence
All saved to `localStorage`:
- `selected_league_id` - Currently selected league
- `selected_game_{league_id}` - Selected game per league
- `broadcast_key_{channel_id}` - Broadcast key per channel
- `show_preview_background` - Preview background toggle state
- `overlay_opacity` - Background darkness preference

### Infographic System
All infographics follow a standardized pattern:

1. **useInfographic composable** provides:
   - `isVisible` - Controls Transition fade in/out
   - `animationStarted` - Controls when content appears (v-if)
   - `show()` / `hide()` - Lifecycle methods
   - `startAnimation()` - Manages timing and ready callback

2. **CSS @keyframes animations**:
   - More reliable than Vue transitions for stage rendering
   - Use `var(--animation-speed)` for speed control
   - Example: `animation: slideIn calc(0.6s / var(--animation-speed)) ease-out`

3. **Component lifecycle**:
   - Command arrives → Component added to DOM (v-if="currentGraphic === 'X'")
   - `show()` called → Fetches data, sets `isVisible = true`
   - Transition fades in → `animationStarted = true`
   - Content appears (v-if="animationStarted") → CSS animations run
   - After animation complete → Emits 'ready' event
   - On hide → Transition fades out → Component removed from DOM

4. **Standard props**:
   - `speed` - Animation speed multiplier
   - `overlayOpacity` - Background darkness (0.0 - 1.0)
   - `isPreview` - Whether in preview mode
   - `showBackground` - Whether to show preview background

### Backend Requirements
Your backend must be running on:
- REST API: `http://localhost:8000`
- WebSocket: `ws://localhost:8001`

If different, update `.env` file.

Backend must provide these endpoints:
- `GET /api/v1/games/latest?games_number=64&league_id={id}` - List games
- `GET /api/v1/games/{game_id}?with_streak=true` - Game details with players
- `GET /api/v1/games/{game_id}/shots` - Shot data for finished games
- `GET /api/v1/games/{game_id}/live-shots` - Shot data for in-progress games
- `GET /api/v1/league-seasons/{league}/table?live=true&season={year}` - League standings

## What's NOT Implemented Yet

- **Queue system** - Prepare multiple graphics in advance
- **Update command** - Swap players/data without hiding graphic
- **Multiple output groups** - Different graphics on different outputs
- **Hexbin/Heatmap graphics** - Additional visualization types
- **Custom graphic templates** - User-defined graphic layouts
- **Replay system** - Reshow previous graphics
- **Scheduled graphics** - Time-based automatic display

## Advanced Features Implemented

### Safe Preview System
- **PODGLĄD button** sends commands via `postMessage` to preview iframe only
- **POKAŻ NA ŻYWO button** sends commands via WebSocket to all outputs
- Preview iframe listens for both WebSocket (live broadcasts) and postMessage (safe previews)
- This allows testing graphics without accidentally going live

### Preview Background
- Optional court/background image (`/public/preview_bg.png`)
- Toggle-able in control panel
- Only shows in preview mode, never on live stage
- Helps visualize how graphics look over real game footage

### Smart Data Refresh
- Games refresh every 5 seconds
- Silent refresh prevents UI flashing
- In-progress games always appear first
- Selected game/league persisted across page refreshes
- Team buttons maintain state during refresh (no "Ładowanie drużyn" flash)

### Dynamic Overlay Opacity
- Adjustable background darkness (0-100%)
- Default: 70% (0.7)
- Passed through command chain to all graphics
- Saved to localStorage
- Allows balancing visibility of preview background vs graphic readability

## File Structure

```
app/
├── composables/
│   ├── useAuth.ts          # Authentication & token management
│   ├── useApi.ts           # API calls with auto token refresh
│   ├── useApiBase.ts       # API base URL configuration
│   ├── useWebSocket.ts     # WebSocket connection handler
│   └── useInfographic.ts   # Base infographic show/hide/animation logic
├── components/
│   ├── InfographicShotchart.vue      # Basketball shot chart (team & player modes)
│   ├── InfographicTableHorizontal.vue # League standings table
│   └── Shotchart3D.vue              # 3D court visualization component
├── pages/
│   ├── index.vue           # Control panel (BROADCAST users)
│   ├── login.vue           # Login page
│   ├── channels.vue        # Channel management (SUPER_ADMIN)
│   ├── test.vue            # Development testing page
│   └── stage/
│       └── [channel_id].vue # Stage page (OBS browser source)
├── constants/
│   └── leagues.ts          # League definitions (PLK, EBL, etc.)
├── public/
│   ├── preview_bg.png      # Optional court background for preview
│   ├── obl.png             # Advertising board image
│   └── suzuki.png          # Advertising board image
└── app.vue                 # Root layout
```

## Troubleshooting

### WebSocket won't connect
- Check backend is running on correct ports (API: 8000, WS: 8001)
- Check browser console for error messages
- Verify JWT token is valid (check localStorage: `broadcast_access_token`)
- For stage page, verify broadcast key is correct in URL
- Check Network tab → WS to see WebSocket connection attempts

### Preview not updating
- Live preview updates when you click "POKAŻ NA ŻYWO" (goes via WebSocket)
- Safe preview updates when you click "PODGLĄD" (goes via postMessage)
- If preview not working:
  - Check browser console for errors
  - Verify preview iframe loaded successfully
  - Check WebSocket connection status in status bar
  - Try refreshing the page

### Preview background not showing
- Verify `/public/preview_bg.png` exists (should be ~6MB)
- Check "Pokaż tło parkietu w podglądzie" toggle is enabled
- Look at preview debug info (top-right corner of preview)
- Should show "Tło: preview_bg.png" in green when enabled
- Background only shows in preview mode, never on live stage

### Graphics don't animate / appear instantly
- Animations use CSS @keyframes, not Vue transitions
- Check browser console for JavaScript errors
- Verify `animationStarted` is true when content renders
- Make sure `var(--animation-speed)` is set in CSS

### Games list is empty or wrong league
- Check API endpoint: `GET /api/v1/games/latest?games_number=64&league_id={id}`
- Verify league ID is correct in `app/constants/leagues.ts`
- Check browser Network tab for API response
- Look for errors in browser console

### Team/player buttons flashing
- Should NOT flash during auto-refresh (fixed with silent refresh)
- If still flashing, check console for errors during refresh
- Verify refresh interval is working (should be every 5 seconds)

### OBS shows offline / Stage won't connect
- Verify stage page is open in OBS browser source
- Check the broadcast key is correct in the URL
- Look at backend WebSocket logs to see if connection was established
- Try closing and reopening the OBS browser source
- Check firewall/network settings (WebSocket port 8001)

### Token expired errors
- Should auto-refresh, but if it keeps failing:
  - Check refresh token endpoint exists at `/api/v1/auth/refresh`
  - Clear localStorage and login again
  - Check backend logs for refresh token errors
  - Verify refresh token is valid and not blacklisted

### Overlay too dark/light
- Adjust "Przezroczystość tła" slider in Advanced section
- Default is 70% (0.7)
- Lower = lighter background (good with preview image)
- Higher = darker background (graphics pop more)
- Setting is saved to localStorage

## Quick Reference

### Adding a New Infographic
See `INFOGRAPHIC_GUIDE.md` for detailed instructions. Basic steps:
1. Create component in `app/components/InfographicMyType.vue`
2. Add to stage page in `app/pages/stage/[channel_id].vue`
3. Add controls to panel in `app/pages/index.vue`
4. Use `useInfographic` composable for lifecycle
5. Use CSS @keyframes for animations

### URLs
- **Control Panel**: `http://localhost:3000/`
- **Login**: `http://localhost:3000/login`
- **Channels Admin**: `http://localhost:3000/channels`
- **Stage (OBS)**: `http://localhost:3000/stage/{CHANNEL_ID}?key={KEY}`
- **Preview (with bg)**: `http://localhost:3000/stage/{CHANNEL_ID}?key={KEY}&preview=true&showbg=true`
- **Test Page**: `http://localhost:3000/test`

### Key Keyboard Shortcuts
(None implemented yet - could add in future)

### Important Defaults
- **Overlay opacity**: 70% (0.7)
- **Animation speed**: 2.0x
- **Game refresh**: Every 5 seconds
- **WebSocket reconnect**: Exponential backoff (max 16s)
- **Preview background**: Enabled by default

### localStorage Keys
- `broadcast_access_token` - JWT access token
- `broadcast_refresh_token` - JWT refresh token  
- `broadcast_key_{channel_id}` - Broadcast key
- `selected_league_id` - Selected league
- `selected_game_{league_id}` - Selected game per league
- `show_preview_background` - Preview background toggle
- `overlay_opacity` - Background darkness preference
