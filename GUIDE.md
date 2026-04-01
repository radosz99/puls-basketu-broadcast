# Broadcast System - Frontend Architecture

A separate frontend project served at `broadcast.pulsbasketu.com`. Two distinct audiences: operators who control graphics from the admin panel, and the stage page which runs silently inside OBS. No SSR - fully client-side. Existing infographic components from the main project will be copied across and adapted.

---

## Pages

### Login
Standard email + password form. Calls existing `/api/v1/auth/token` endpoint. Stores JWT for subsequent requests. Redirects to panel on success.

### Admin panel (`/`)
The operator's control interface. Protected - redirects to login if no valid JWT. This is where the operator picks a game, selects a graphic, picks a player, and hits GO. Contains a live preview iframe of the stage page alongside the controls.

### Stage page (`/stage/[channel_id]`)
Loaded permanently in OBS as a browser source. No login, no UI. Connects via WebSocket using the broadcast key from the URL query param. Sits idle until a command arrives, then fetches data and renders the graphic. This page is the only one that needs to be public - everything else sits behind auth.

### Channel management (`/channels`)
Simple SUPER_ADMIN only page. Create channels, regenerate keys, see online status. Minimal UI - this is internal tooling.

---

## API endpoints used by frontend

### Login
```
POST /api/v1/auth/token
Body: { "email": "...", "password": "..." }

Response: { "access_token": "...", "refresh_token": "...", "token_type": "bearer" }
```

### Get current user
```
GET /api/v1/auth/users/me
Authorization: Bearer <token>

Response:
{
  "email": "user@example.com",
  "user": "username",
  "role": "broadcast",        // or "super_admin"
  "broadcast_channel_id": 1  // numeric FK - null for super_admin
}
```

> `broadcast_channel_id` in this response is not used directly by the frontend. Its only useful field is `role` - use that to decide routing on panel load (see panel load flow below).

### Get current user's channel (BROADCAST role only)
```
GET /api/v1/broadcast/channels/me
Authorization: Bearer <token>

Response:
{
  "id": 1,
  "channel_id": "test",
  "operator_name": "Test Channel",
  "is_active": true,
  "created_at": "2026-04-01T07:22:57"
}
```

The `channel_id` slug is what goes into the WebSocket URL. Only call this for BROADCAST users - SUPER_ADMIN gets a 400 from this endpoint and uses `GET /channels` to list all channels instead.

### Channel management (SUPER_ADMIN only)
```
GET  /api/v1/broadcast/channels
POST /api/v1/broadcast/channels
POST /api/v1/broadcast/channels/{id}/regenerate-key
GET  /api/v1/broadcast/channels/{id}/status  →  { "online": bool }
```

---

## WebSocket connections

Two separate connections, different roles:

**Stage page** connects as `output` using the broadcast key from the URL. Stays connected permanently. Listens for commands, replies to pings, sends status back.

**Admin panel** connects as `control` using the JWT token. Sends commands, listens for status updates (OBS online/offline, graphic ready).

Both connect to the same channel - whatever the operator triggers in the panel immediately affects the stage page.

### URLs
```
Stage page:   /ws/broadcast/{channel_id}?role=output&key=<BROADCAST_KEY>
Admin panel:  /ws/broadcast/{channel_id}?role=control&token=<JWT_TOKEN>
```

> In dev, REST API runs on port 8000 and WebSocket on port 8001. Both base URLs need to be separate entries in runtime config.

---

## WebSocket message reference

### Control → Output (sent by admin panel)
```json
{ "action": "show", "graphic": "shotchart", "game_id": 456, "shirt_number": 7, "role": "home", "speed": 2.0 }
{ "action": "hide" }
{ "action": "update", "shirt_number": 11, "role": "away" }
```

### Output → Server (sent by stage page)
```json
{ "type": "online" }   // sent on connect
{ "type": "pong" }     // reply to server ping
{ "type": "ready", "graphic": "shotchart" }  // graphic loaded and visible
```

### Server → Control (received by admin panel)
```json
{ "type": "output_online" }   // OBS connected
{ "type": "output_offline" }  // OBS disconnected or heartbeat timed out
{ "type": "ready", "graphic": "shotchart" }  // relayed from output
```

### Server → Output (received by stage page)
```json
{ "type": "ping" }   // every 15s - must reply with pong within 30s
{ "action": "show", ... }  // relayed from control
{ "action": "hide" }
{ "action": "update", ... }
```

### Close codes
| Code | Reason | Frontend action |
|---|---|---|
| 4000 | Invalid role | Bug - should never happen |
| 4001 | Bad key or token | Token expired - refresh token then reconnect |
| 4003 | Wrong channel for this user | Bug - channel mismatch in config |
| 4004 | Channel not found or inactive | Show error to operator |

> 4001 on the control connection means the JWT expired. Frontend must attempt a token refresh before reconnecting - not a raw reconnect.

---

## Stage page - how it works

The stage page is a blank canvas. It has no idea what game is being played until a command arrives. Flow:

1. Page loads in OBS, WebSocket connects, sends `online`
2. Sits idle - nothing visible on screen
3. `show` command arrives with `graphic`, `game_id`, `shirt_number`, `role`, `speed`
4. Page fetches data from the existing API using those params
5. Correct graphic component mounts and animates in
6. Sends `ready` back to server once visible
7. `hide` command arrives - graphic animates out, back to idle
8. `update` command - swaps player/data without hiding

Only one graphic visible at a time. Switching graphic type hides the current one before showing the new one.

### Heartbeat
Stage page must reply to every `ping` from the server with `pong` immediately. Server sends ping every 15s. If no pong within 30s, server closes the connection, control panel receives `output_offline`. Stage page should auto-reconnect on close.

---

## Admin panel - how it works

### Panel load flow - splits by role

On load the panel calls `/auth/users/me` to get the role, then branches:

**BROADCAST user:**
1. Call `/auth/users/me` - get role = broadcast
2. Call `/channels/me` - get channel_id slug
3. Connect WebSocket with that slug
4. Land directly on the control panel for their channel

**SUPER_ADMIN:**
1. Call `/auth/users/me` - get role = super_admin
2. Redirect to /channels - channel management page only
3. SUPER_ADMIN does not operate a stage page directly

SUPER_ADMIN never sees the control panel UI. The operator-facing panel is purely for BROADCAST users.

> When the control panel connects and OBS is already online, the server sends output_online immediately. Handle this the same as receiving it mid-session.

### Control flow (left side)
Top to bottom operator workflow:

1. **Game selector** - today's games fetched from existing API, simple dropdown
2. **Graphic selector** - cards for each available graphic type (shotchart, hexbin, etc.)
3. **Player / team picker** - depends on graphic selected. Players sorted by eval score descending. Shows shirt number, name, photo.
4. **Speed slider** - animation speed, passed in the command payload
5. **GO / HIDE buttons** - large, prominent, always visible

### Preview (right side)
Iframe pointing to the stage page URL with a `preview=true` query param. Scaled down to fit the panel. Since the stage page is connected to the same WebSocket channel, it updates in real time as the operator makes selections - before hitting GO.

The `preview=true` param tells the stage page to receive commands only, never send status back (avoids loops).

### Status bar
Top of panel. Shows:
- Panel WebSocket connection status
- OBS stage page online / offline (driven by `output_online` / `output_offline` messages)
- What is currently on air

### Queue (nice to have, not MVP)
A single "up next" slot. Pre-load the next graphic while current is live. One click to swap.

---

## Graphic components

Each graphic (shotchart, hexbin, etc.) is a self-contained component that:
- Receives a payload prop (`game_id`, `shirt_number`, `role`, `speed`)
- Fetches its own data from the existing API when payload changes
- Exposes `show()` and `hide()` methods for animation in/out
- Emits `ready` event when fully visible on screen

The stage page mounts the correct component based on the `graphic` field in the command, passes the payload, and calls `show()`.

Components are copied from the main project and adapted - they lose their URL param logic and gain prop-based data fetching instead.

---

## Shared composable

A single composable handles all WebSocket logic - connecting, reconnecting on drop, sending messages, receiving messages. Both the stage page and the admin panel use it, passing different role and auth params. Heartbeat ping/pong handled inside the composable so individual pages don't need to think about it. Token refresh on 4001 close also handled here for control connections.

---

## Auth

- JWT stored in memory or HTTP-only cookie after login
- All pages except `/login` and `/stage/[channel_id]` redirect to login if no valid JWT
- Stage page has no auth UI - just the broadcast key in the URL query param
- `/stage/[channel_id]` must be excluded from any nginx basic auth on the subdomain

---

## Checklist

### MVP graphic - validate pipeline first
- [ ] Text overlay component built with CSS animation only
- [ ] show command with graphic=text renders title + subtitle on stage page
- [ ] hide command animates it out
- [ ] ready message sent after animation in completes
- [ ] Entire flow works end to end before touching real graphics

### Setup
- [ ] SSR disabled globally in nuxt.config.ts
- [ ] Tailwind installed and configured
- [ ] .env file created with NUXT_PUBLIC_API_BASE and NUXT_PUBLIC_WEBSOCKET_BASE
- [ ] nuxt.config.ts reads both values from env via runtimeConfig
- [ ] .env added to .gitignore
- [ ] API composable in place - attaches JWT, handles 401 + token refresh
- [ ] WebSocket composable in place
- [ ] Login page working, JWT stored, redirect on success

### Stage page
- [ ] Loads from `/stage/[channel_id]?key=xxx`
- [ ] WebSocket connects as `output` using key from URL
- [ ] Sends `{ "type": "online" }` on connect
- [ ] Replies to `{ "type": "ping" }` with `{ "type": "pong" }`
- [ ] `show` command - correct graphic mounts, data fetched, animates in
- [ ] `hide` command - graphic animates out
- [ ] `update` command - swaps player without hiding
- [ ] Sends `{ "type": "ready", "graphic": "..." }` after graphic is visible
- [ ] Auto-reconnects on disconnect

### Admin panel - BROADCAST user
- [ ] Protected - redirects to login if no JWT
- [ ] Calls /auth/users/me on load - if role is super_admin redirect to /channels
- [ ] Calls /channels/me to get channel_id slug
- [ ] WebSocket connects as control using JWT
- [ ] Handles output_online on connect (OBS already online case)
- [ ] Status bar shows OBS online / offline correctly
- [ ] Today's games load from API
- [ ] Graphic type selector works
- [ ] Player picker loads correct players for selected game
- [ ] Speed slider value passed in command payload
- [ ] GO button sends show command with full payload
- [ ] HIDE button sends hide command
- [ ] Preview iframe shows stage page scaled down with preview=true
- [ ] Preview updates in real time
- [ ] 4001 close code triggers token refresh then reconnect - not raw reconnect

### Admin panel - SUPER_ADMIN
- [ ] /auth/users/me returns super_admin role - redirected to /channels
- [ ] /channels page shows list of all channels with online status
- [ ] Create channel works - plain key shown once with warning
- [ ] Regenerate key works - plain key shown once with warning
---

## Project setup

### After running `npx nuxi init` and `cd` into the project

**1. Install Tailwind**
```
npx nuxi@latest module add tailwindcss
```

**2. Configure `nuxt.config.ts`**

```ts
export default defineNuxtConfig({
  ssr: false,
  modules: ['@nuxtjs/tailwindcss'],
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE,
      websocketBase: process.env.NUXT_PUBLIC_WEBSOCKET_BASE
    }
  }
})
```

**3. Create `.env` file**

```
NUXT_PUBLIC_API_BASE=http://localhost:8000
NUXT_PUBLIC_WEBSOCKET_BASE=ws://localhost:8001
```

In production these point to the real domain:
```
NUXT_PUBLIC_API_BASE=https://api.pulsbasketu.com
NUXT_PUBLIC_WEBSOCKET_BASE=wss://api.pulsbasketu.com
```

Add `.env` to `.gitignore`.

**4. API composable**

Create a composable for all API calls. It should:
- Read `apiBase` from runtime config
- Attach the JWT token from wherever it is stored to every request as `Authorization: Bearer <token>`
- Handle 401 responses by attempting a token refresh, then retrying the request once
- Expose simple methods used across the app: `get(path)`, `post(path, body)`

All pages and components call API through this composable - never raw `fetch` directly.

**5. WebSocket composable**

Already described in the architecture section above. Reads `websocketBase` from runtime config.

---
---

## MVP graphic - text overlay

Before integrating any real basketball graphics (shotchart, hexbin etc.), start with a simple text overlay to validate the entire pipeline end to end.

### What it shows

A centered animated bar with two lines of text:
- Title line (e.g. "Mapa rzutów")
- Subtitle line (e.g. player name or team name)

No data fetching needed - text comes directly from the command payload.

### Command payload for MVP graphic

```json
{
  "action": "show",
  "graphic": "text",
  "title": "Mapa rzutów",
  "subtitle": "Jan Kowalski #7",
  "speed": 2.0
}
```

### Animation

Simple slide in from left on show, slide out on hide. CSS animation only - no Three.js, no API calls, no court rendering. Just a styled bar that appears and disappears cleanly.

### Why start here

- Validates WebSocket flow in both directions (show, hide, ready, heartbeat)
- Validates admin panel controls and preview iframe
- Validates OBS browser source setup and online/offline detection
- Validates token auth and reconnect logic
- Zero dependency on basketball data API or complex components
- Can be built and tested in an hour

Once this works end to end, swapping in the real shotchart or hexbin component is just replacing one component - all the plumbing is already proven.
