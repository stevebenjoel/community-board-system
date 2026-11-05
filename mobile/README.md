# Native citizen client (not yet device-verified)

`App.tsx` is an Expo/React Native citizen client. It uses Appwrite identity, the CBS authorized API, private case viewing, project viewing, reporting, server-confirmed submission, and per-account encrypted offline drafts with stable retry identifiers.

Generate a compatible Expo project without guessing React Native dependency versions:

```powershell
node scripts/mobile-setup.mjs
cd apps/mobile
pnpm exec expo install --check
pnpm exec tsc --noEmit
pnpm start
```

The generator fetches the official current `blank-typescript` Expo template and installs Appwrite's documented native dependencies, SecureStore and Crypto. This has NOT been executed or built on a device in this environment. Generated `apps/mobile` is intentionally separate from the root web lockfile until its dependencies are validated and pinned.

Set public variables in `apps/mobile/.env`:

```text
EXPO_PUBLIC_CBS_API_ORIGIN=https://your-cbs-api
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://your-appwrite/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
EXPO_PUBLIC_APP_ID=org.cbs.pilot
```

Register the Android/iOS platform identifiers in Appwrite and match app.json to the agreed identifiers before native builds. The CBS API must be in Appwrite mode on a reachable development/staging endpoint. Local synthetic auth intentionally cannot be exposed to a phone on a LAN. Never add an Appwrite server API key to an Expo variable. Account verification/recovery and officer MFA are currently handled in the web portal; native account lifecycle coverage is partial.

Drafts are retained on failure, and retry uses the same request ID. Draft storage is deliberately scoped to the signed-in account. Only the backend can confirm submission. Device accessibility, SecureStore size behavior, app signing, Android/iOS builds, and native integration tests remain required.

References: [Appwrite native quickstart](https://appwrite.io/docs/quick-starts/react-native), [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/).
