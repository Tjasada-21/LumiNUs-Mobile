# Hotspot Debugging Guide

If you're getting "Network Error" during login while using hotspot, follow these steps.

## Step 1: Check Device IP & Hotspot Gateway

On your host machine (Windows/Mac/Linux):
```bash
# Windows: find your machine's IP
ipconfig
# Look for IPv4 Address (usually 192.168.x.x or 10.0.x.x)

# macOS/Linux:
ifconfig
# Look for inet 192.168.x.x or similar
```

On your phone (Android):
- Settings → Network & Internet → Hotspot & tethering (or Wi-Fi hotspot)
- Note the IP range shown (usually 192.168.43.x, 192.168.4.x, or 10.0.2.x on emulator)

## Step 2: Configure the App to Use Hotspot IP

You have two options:

### Option A: Use environment variable (fastest for testing)
Edit `.env`:
```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.43.1:8000/api
```
(Replace `192.168.43.1` with your actual machine IP on the hotspot)

Then reload the app (press `r` in Metro or restart Expo Go).

### Option B: Use in-app developer override
1. Open the app and go to **Account Settings** (login first if needed).
2. Scroll down to the **Developer** section.
3. Enter your API base URL: `http://192.168.43.1:8000/api`
4. Tap **Save Override**.
5. The override takes effect immediately.

## Step 3: Check the Logs

Open Expo Dev Tools to see detailed logs:

```bash
# Terminal 1: Start Metro with clear cache
npm run start:expo -- --clear

# Terminal 2: Connect your device and watch logs
# In Expo Go:
#   - Press `j` to open the debugger
#   - Watch the JS console for [API] debug messages
```

Look for these log messages:
```
[API] Starting base URL detection...
[API] Probing 192.168.43.1:8000...
[API] Successfully set base URL to: http://192.168.43.1:8000/api
[LoginScreen] API ready, attempting to restore session...
```

If probing fails, you'll see:
```
[API] Probe failed for http://192.168.43.1:8000: ...
[API] No reachable host found. Using fallback: http://127.0.0.1:8000/api
```

## Step 4: Verify Network Connectivity

From your phone, try to reach the server manually:

### Android:
```bash
# Via adb shell
adb shell
ping 192.168.43.1   # Should succeed if on hotspot
curl http://192.168.43.1:8000   # Should return something (not necessarily OK)
```

### iOS (requires dev tools):
- Similar steps but requires Xcode or dev client setup.

## Step 5: Check Laravel is Running

On your development machine, verify the Laravel server is running and accessible:

```bash
# If using Sail:
cd luminus-backend
./vendor/bin/sail up -d

# Check it's running
curl http://localhost:8000   # On your dev machine
curl http://192.168.43.1:8000   # From phone (if on same hotspot)
```

## Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| App still gets "Network Error" | Check the [API] logs — is probing finding your IP? Check `.env` or developer override is set correctly. |
| Probing fails for all hosts | Firewall blocking port 8000. Check your Windows Defender or router firewall rules. |
| Timeout connecting | Server not running. Start `./vendor/bin/sail up` or `php artisan serve`. |
| Wrong IP detected | Device is not on the hotspot network. Confirm phone is connected to your Wi-Fi hotspot. |
| Port 8000 not accessible | Firewall or server not listening. Try `netstat -an \| findstr 8000` on Windows or `lsof -i :8000` on Mac/Linux. |

## Quick Hotspot Network Test

To verify your phone and dev machine can communicate:

**From phone's terminal/adb:**
```bash
ping 192.168.43.1   # Replace with your dev machine IP on hotspot
```

**From your dev machine:**
```bash
# Windows
ipconfig /all
# Mac/Linux
ifconfig
```

If the phone can't ping your machine, they're not on the same network or a firewall is blocking.

## Reset to Defaults

If you want to go back to automatic detection (Wi-Fi or packager host):
1. Go to Account Settings → Developer.
2. Clear the input field and tap **Clear Override**.
3. The app will re-run the probe on next login.

## Still Stuck?

Check your Laravel logs:
```bash
# From the backend directory
./vendor/bin/sail logs -f

# Or on a standard setup:
tail -f storage/logs/laravel.log
```

If the server is receiving requests but returning 401/403, the network is working — the issue is authentication.
