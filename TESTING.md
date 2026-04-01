# Testing Guide - Preview vs OBS Connection

## What's New

The system now distinguishes between:
- **Preview**: Local iframe for testing (doesn't count as "OBS")
- **Real OBS**: Actual OBS browser sources (counted and reported)

## Backend Changes ✅

1. Accepts `preview=true` parameter on WebSocket connections
2. Preview connections don't trigger `output_online`/`output_offline`
3. Sends `output_count` messages to control clients
4. Counts only real (non-preview) outputs

## Frontend Changes ✅

1. Preview iframe sends `preview=true` parameter
2. Shows 3 separate status indicators: Panel, Preview, OBS
3. Displays connection count: "OBS: 2 connected"
4. Smart warnings based on connection state

## How to Test

### Step 1: Login
```
http://localhost:3000/login
```

### Step 2: Admin Panel - No Connections
You should see:
- Panel: Connected ✅
- Preview: Not loaded ⚫
- OBS: Offline 🔴
- Yellow warning: "No output connected..."

### Step 3: Enter Broadcast Key
Paste your broadcast key in the blue box.

You should see:
- Panel: Connected ✅
- Preview: Connected ✅
- OBS: Offline 🔴
- Blue info: "Preview active (not counted as OBS)..."

**Backend should NOT send `output_online`** - check backend logs!

### Step 4: Open Stage in Browser Tab
Open a new tab:
```
http://localhost:3000/stage/YOUR_CHANNEL?key=YOUR_KEY
```

You should see:
- Panel: Connected ✅
- Preview: Connected ✅
- OBS: 1 connected ✅
- Green message: "✓ OBS connected and ready"

**Backend should send:** `{"type": "output_count", "count": 1}`

### Step 5: Open Stage in Another Tab
Open another tab with the same URL.

You should see:
- OBS: 2 connected ✅
- Green message: "✓ 2 OBS instances connected"

**Backend should send:** `{"type": "output_count", "count": 2}`

### Step 6: Close One Tab
Close one of the stage tabs.

You should see:
- OBS: 1 connected ✅

**Backend should send:** `{"type": "output_count", "count": 1}`

### Step 7: Test Commands
With any stage tabs open (and/or preview):
- Enter title: "Test Title"
- Enter subtitle: "Test Subtitle"
- Click GO

**All connected outputs should show the text** (both preview and real OBS tabs)

### Step 8: Close All Stage Tabs
Close all stage tabs (keep preview).

You should see:
- OBS: Offline 🔴
- Blue info: "Preview active (not counted as OBS)..."

**Backend should send:** `{"type": "output_count", "count": 0}`

## Expected Backend Messages

### When Preview Connects
```
No output_online message
No output_count change
```

### When Real OBS Connects
```json
{
  "type": "output_count",
  "count": 1
}
```

### When Second OBS Connects
```json
{
  "type": "output_count",
  "count": 2
}
```

### When OBS Disconnects
```json
{
  "type": "output_count",
  "count": 1
}
```

### When Last OBS Disconnects
```json
{
  "type": "output_count",
  "count": 0
}
```

## Common Issues

### "OBS shows online when only preview is active"
- Backend is not checking `preview` parameter
- Backend is sending `output_online` for preview connections
- Check backend WebSocket handler logs

### "Count doesn't update"
- Backend not sending `output_count` messages
- Frontend not handling `output_count` message type
- Check browser console for received messages

### "Preview doesn't connect"
- Missing or wrong broadcast key
- Check browser console for WebSocket errors
- Verify key is correct

## Browser Console Commands

Check WebSocket messages in browser console:
```javascript
// See stored broadcast key
localStorage.getItem('broadcast_key_YOUR_CHANNEL')

// Clear key to test fresh state
localStorage.removeItem('broadcast_key_YOUR_CHANNEL')

// See all localStorage
console.log(localStorage)
```

## Success Criteria

✅ Preview connects without triggering "OBS: Online"
✅ Real OBS tabs are counted correctly
✅ Count updates in real-time as OBS connects/disconnects
✅ Preview and OBS both receive commands
✅ Preview doesn't send `ready` messages (check in backend logs)
✅ Warnings show correct state
