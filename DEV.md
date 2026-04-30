Quick guide — switching between Expo Go and a Development (dev-client) build

Prereqs
- Node.js and npm installed.
- Install the Expo CLI and EAS CLI or use `npx`:

  ```bash
  npm install -g expo-cli eas-cli
  # or use npx: npx expo ... and npx eas ...
  ```

Expo Go (fast, no native build)
- Start the Metro server and open the QR code for Expo Go:

  ```bash
  # start normally (LAN)
  npm run start:expo
  # or force tunnel if devices are not on same network
  npm run start:expo:tunnel
  ```

- Scan the QR code with the Expo Go app (iOS/Android).
- App will use JS bundles and requires no native rebuild.

Development build (native dev-client — required for custom native modules)
- Build a development client via EAS (first-time setup requires login and configuring credentials):

  ```bash
  # Android (internal/dev client): generates an installable artifact
  npm run build:dev:android

  # iOS (macOS + Apple account required)
  npm run build:dev:ios
  ```

- Install the generated APK on the device (Android) or install via TestFlight/internal distribution on iOS.
- Start the dev server and connect the installed dev-client:

  ```bash
  npm run start:dev-client
  ```

- The dev-client will load the JS bundle from your Metro server and supports native debugging and custom native modules (e.g., `expo-dev-client`).

Notes & Tips
- Use `npm run start:expo` for quick iterations; switch to `npm run start:dev-client` when you need native modules or debugging not supported by Expo Go.
- The project already includes `expo-dev-client` in dependencies.
- To switch networks, update only the IP in `EXPO_PUBLIC_API_BASE_URL` inside `.env`:

  ```env
  EXPO_PUBLIC_API_BASE_URL=http://192.168.1.42/api
  ```

- Keep the `/api` suffix so the mobile app stays pointed at Laravel, and restart Expo after changing the file.

- EAS builds require an Expo account and project setup (`eas build` will guide you through provisioning for iOS).

Troubleshooting
- If Metro can't be reached from device, try `npm run start:expo:tunnel` or connect via the same Wi-Fi network.
- If the dev-client cannot find the packager host, ensure your device and machine are on the same network and run `npm run start:dev-client` before launching the installed dev-client.

If you want, I can:
- Add a small in-app debug toggle to switch the API base URL at runtime.
- Automate installing the Android APK produced by EAS (local fastlane/adb helper script).
