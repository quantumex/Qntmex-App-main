# QNTMEX Wallet — Build Guide
## APK · AAB (Play Store) · IPA (App Store)

---

## Prerequisites

1. **Node.js 18+** installed
2. **Expo account** — create free at https://expo.dev
3. **EAS CLI** — `npm install -g eas-cli`
4. **For iOS IPA only** — Apple Developer account ($99/year)

---

## Step 1 — Install dependencies

```bash
cd qntmex-mobile
npm install
```

---

## Step 2 — Login to Expo

```bash
eas login
# Enter your Expo account email + password
```

---

## Step 3 — Configure EAS (first time only)

```bash
eas build:configure
# When asked: Android → Yes, iOS → Yes
# This links the project to your Expo account
```

---

## Step 4A — Build APK (direct install / sideload)

```bash
eas build --platform android --profile production-apk
```

- Build runs on Expo's servers (~10-15 min)
- When done, EAS prints a **download URL** for the `.apk` file
- Install on Android: enable "Install from unknown sources", open the APK

---

## Step 4B — Build AAB (Google Play Store)

```bash
eas build --platform android --profile production-aab
```

- Produces `.aab` bundle for Play Console upload
- Upload at: https://play.google.com/console → Internal testing → Create new release

---

## Step 4C — Build IPA (Apple App Store)

```bash
eas build --platform ios --profile production-ios
```

**First time only — EAS will ask you for:**
- Apple ID email
- App-specific password (create at https://appleid.apple.com → Security → App-Specific Passwords)
- Apple Team ID (from https://developer.apple.com/account → Membership)

EAS automatically creates/manages certificates and provisioning profiles.

**When done:** Upload IPA to App Store Connect using Transporter app (Mac) or:
```bash
eas submit --platform ios
```

---

## All 3 builds in sequence (most efficient — uses fewest build credits)

```bash
eas build --platform android --profile production-apk --non-interactive &
eas build --platform android --profile production-aab --non-interactive &
eas build --platform ios --profile production-ios --non-interactive
```

Or run one at a time and wait for each URL.

---

## App Details

| Field | Value |
|-------|-------|
| App Name | QNTMEX Wallet |
| Android Package | `com.qntmex.wallet` |
| iOS Bundle ID | `com.qntmex.wallet` |
| Version | 4.0.0 |
| Android versionCode | 4 |
| iOS buildNumber | 4 |

---

## Supported Chains

ETH · BTC · SOL · BNB (BSC) · TRX

---

## Viewing build status

```bash
eas build:list
```

Or check https://expo.dev/accounts/[your-username]/projects/qntmex-wallet/builds

---

## Notes

- **Free Expo accounts** get 30 build minutes/month. APK+AAB together use ~20 min.
- **iOS IPA** requires a paid Apple Developer account but no extra Expo credits.
- Keystores and certificates are managed by EAS automatically — backed up to your account.
- To use your own keystore: `eas credentials`

