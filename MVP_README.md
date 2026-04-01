# Broadcast System MVP - Setup & Usage

## What's Been Implemented

### Core Infrastructure ✅
- **Nuxt 4 config** with SSR disabled, Tailwind installed
- **Environment variables** (.env file created with API endpoints)
- **Auth composable** (useAuth) - handles login, token storage in localStorage, token refresh
- **API composable** (useApi) - handles all API calls with automatic token refresh on 401
- **WebSocket composable** (useWebSocket) - handles connections with exponential backoff reconnection

### Pages ✅
1. **Login page** (`/login`) - email/password authentication
2. **Admin panel** (`/`) - operator control interface with:
   - Status bar (WebSocket, OBS online/offline, current graphic)
   - Control panel (left side) with text overlay controls
   - Live preview (right side) - iframe of stage page
   - GO/HIDE buttons
   - Speed slider
3. **Stage page** (`/stage/[channel_id]`) - OBS browser source page with:
   - WebSocket connection as output role
   - Text overlay graphic component
   - Heartbeat ping/pong handling
   - Preview mode support
4. **Channels management** (`/channels`) - SUPER_ADMIN only page

### Components ✅
- **TextOverlay.vue** - Simple text overlay with slide-in animation (MVP graphic)
- **StatusBar.vue** - Shows connection status and current graphic

## Running the Project

```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Testing the MVP Flow

### 1. Login
- Go to `http://localhost:3000/login`
- Enter credentials (must exist in your backend)

### 2. As BROADCAST user:
- After login, you'll land on the admin panel
- The panel will fetch your channel from `/api/v1/broadcast/channels/me`
- WebSocket connects automatically

### 3. Open Stage Page in OBS:
- URL: `http://localhost:3000/stage/YOUR_CHANNEL_ID?key=YOUR_BROADCAST_KEY`
- Add as Browser Source in OBS
- Recommended resolution: 1920x1080
- Check "Shutdown source when not visible" is OFF

### 4. Test the Text Overlay:
- In the admin panel, enter a title (e.g., "Mapa rzutów")
- Enter a subtitle (e.g., "Jan Kowalski #7")
- Adjust speed slider if desired
- Click **GO** button
- Text should appear on stage page with slide-in animation
- Status bar should show graphic is on air
- Click **HIDE** to remove it

### 5. As SUPER_ADMIN user:
- After login, you'll be redirected to `/channels`
- Create new channels, regenerate keys
- View online status of all channels

## Important Notes

### WebSocket Connection
- **Control panel** connects with JWT token
- **Stage page** connects with broadcast key from URL
- Automatic reconnection with exponential backoff (1s, 2s, 4s, 8s, 16s max)
- On 4001 close (token expired), automatically refreshes token before reconnecting

### Preview Mode
- The admin panel shows a preview iframe: `/stage/[channel_id]?preview=true`
- Preview mode receives commands but doesn't send status messages back (prevents loops)

### Backend Requirements
Your backend must be running on:
- REST API: `http://localhost:8000`
- WebSocket: `ws://localhost:8001`

If different, update `.env` file.

## What's NOT Implemented (Not MVP)

- Real basketball graphics (shotchart, hexbin) - only text overlay
- Game selector - not needed for text overlay
- Player picker - not needed for text overlay
- Queue system - mentioned as "nice to have" in GUIDE
- Multiple graphic types - only text overlay for now

## Next Steps After MVP Validation

Once the text overlay works end-to-end:

1. **Add game selector** - fetch from existing API
2. **Add player picker** - fetch players for selected game
3. **Implement real graphics** - copy shotchart/hexbin from main project
4. **Add data fetching** - each graphic component fetches its own data
5. **Add update command** - swap players without hiding graphic

## File Structure

```
app/
├── composables/
│   ├── useAuth.ts          # Authentication & token management
│   ├── useApi.ts           # API calls with auto token refresh
│   └── useWebSocket.ts     # WebSocket connection handler
├── components/
│   ├── TextOverlay.vue     # MVP graphic component
│   └── StatusBar.vue       # Status bar for admin panel
├── pages/
│   ├── index.vue           # Admin panel (BROADCAST users)
│   ├── login.vue           # Login page
│   ├── channels.vue        # Channel management (SUPER_ADMIN)
│   └── stage/
│       └── [channel_id].vue # Stage page (OBS browser source)
└── app.vue                 # Root layout
```

## Troubleshooting

### WebSocket won't connect
- Check backend is running on correct ports
- Check browser console for error messages
- Verify JWT token is valid (check localStorage: `broadcast_access_token`)
- For stage page, verify broadcast key is correct in URL

### Preview not updating
- Preview should update immediately when you change controls
- If not, check browser console for WebSocket errors
- Make sure stage page is connected (check Network tab for WS connection)

### OBS shows offline
- Verify stage page is open in OBS browser source
- Check the broadcast key is correct in the URL
- Look at backend WebSocket logs to see if connection was established
- Try closing and reopening the OBS browser source

### Token expired errors
- Should auto-refresh, but if it keeps failing:
  - Check refresh token endpoint exists at `/api/v1/auth/refresh`
  - Clear localStorage and login again
  - Check backend logs for refresh token errors
