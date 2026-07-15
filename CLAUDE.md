# GeoProof — technical notes

## What this is

Bare (non-Expo) **React Native 0.86** app, **Android-only** ship target. It is
**not** Capacitor, despite that name having been used loosely for this project
early on — there's no `@capacitor/core`, no `capacitor.config.*`, no webview
wrapper. Native modules in use (`react-native-vision-camera`,
`react-native-nitro-modules`, `react-native-nitro-image`,
`react-native-skia`, `react-native-worklets`, `react-native-reanimated`,
`react-native-quick-crypto`) all require real native compilation — they
would not work under an actual Capacitor/webview shell.

`ios/` was removed 2026-07-08: it was just the RN CLI's default scaffold
(RN always generates both `ios/` and `android/` regardless of what you
ship), never built, never referenced by CI. Regenerable via the RN CLI if
iOS support is ever actually pursued — that would be a deliberate decision,
not a small config change, given the native modules above.

## CI / release build

`.github/workflows/build.yml` ("GeoProof — Build Signed APK") builds a
signed release APK on every push to `main`. Key steps in order: checkout →
node/JDK/Android SDK setup → `npm ci` → gradle cache restore → decode
keystore from `KEYSTORE_BASE64` secret → **verify keystore credentials**
(`keytool -certreq`, fails in seconds) → write signing properties → 
`./gradlew assembleRelease` (arm64-v8a + armeabi-v7a only, ~45min native
build) → upload APK artifact.

**History as of 2026-07-08: every run before commit `a7220b2` had failed or
been cancelled** — this app has never shipped a successful signed build
before that point. The root cause of the last failure was a `STORE_PASSWORD`/
`KEY_PASSWORD` GitHub secret that didn't match the real keystore password
(the password was typed at an interactive `keytool -genkeypair` prompt back
on 2026-06-19 and was never recorded anywhere recoverable). Since nothing had
ever shipped with the old key, it was regenerated from scratch rather than
chased down — see below.

The "verify keystore credentials" step was added specifically so this class
of failure (wrong secret, not a code bug) fails in ~seconds instead of after
the full ~45-minute native compile.

## Signing / keystore

- `android/app/build.gradle` reads `MYAPP_RELEASE_STORE_FILE` /
  `MYAPP_RELEASE_STORE_PASSWORD` / `MYAPP_RELEASE_KEY_ALIAS` /
  `MYAPP_RELEASE_KEY_PASSWORD` from `gradle.properties`, which CI writes at
  build time from the 4 GitHub secrets (`KEYSTORE_BASE64`, `STORE_PASSWORD`,
  `KEY_PASSWORD`, `KEY_ALIAS`). Falls back to the debug keystore if those
  properties aren't set (local dev without the release key still works).
- `geoproof-release.jks`, `keystore-base64.txt`, and
  `RELEASE_KEYSTORE_CREDENTIALS.txt` in the repo root are all gitignored —
  never expect them in `git log`/`git show`. The `*.old-unrecoverable`
  suffixed files are the retired (password-lost) keystore/base64 from before
  2026-07-08, kept only as a paper trail, not usable.
- **Gotcha:** modern `keytool` defaults to **PKCS12** keystores, which only
  support one password shared by the store and every key in it. Passing a
  different `-keypass` at generation time is *silently ignored* (with a
  warning printed to stderr), not rejected — easy to not notice.
  `STORE_PASSWORD` and `KEY_PASSWORD` secrets are intentionally identical
  for this keystore; that's correct, not a mistake to "fix."
- If the keystore ever needs regenerating again:
  `keytool -genkeypair -v -keystore geoproof-release.jks -alias geoproof -keyalg RSA -keysize 2048 -validity 10000 -storepass '<pw>' -keypass '<pw>' -dname '...'`,
  then `base64 -w 0 geoproof-release.jks > keystore-base64.txt`, then
  `gh secret set` all 4 secrets to match. Only safe to do casually while no
  Play Store release exists yet under the current key — once a real release
  ships, the signing key is permanent (Play Store ties app updates to it).

## Permissions (`.claude/settings.json`)

This project's `permissions.allow` is intentionally broader than default,
per explicit, repeated user instruction on 2026-07-08 (not an oversight):
`python3 *`, `node -e *`, `npx *`, and `git push *` are wildcarded, which
normally amounts to standing arbitrary-code-execution / remote-mutation
rights. The user was told this plainly and asked for it anyway. Force-push
is deliberately  not in that list and should stay a manual judgment call
regardless of what's technically allowlisted.

## Bug-fix notes — 2026-07-15

### Photo save crash: "value cannot be null, expected an object"
Both CameraScreen and UploadScreen pipe through `processImageWithWatermark`
in `src/utils/imageProcessor.ts`. First fix attempt: swapping
`snapshot.encodeToBase64()` (can return null on native Android) for
`snapshot.encodeToBytes()` + `fromByteArray()` from `react-native-quick-base64`.
That was a real bug but **not the actual root cause** — the crash persisted
identically in two subsequent signed release builds (release 17, 18) after
that fix shipped.

**Real root cause**: `react-native-fs` (v2.20.0) is an old legacy-bridge
module that was never properly updated for React Native's New Architecture,
which is mandatory (not optional) on RN 0.86 — the old bridge was removed in
0.82. The JSI/TurboModule interop layer chokes on `RNFS.mkdir` /
`RNFS.writeFile` / `RNFS.stat`'s native return values, producing the generic
native-layer error "value is null, expected an object". This happened in
both CameraScreen and UploadScreen because both call the same underlying
`RNFS` methods in `imageProcessor.ts`.

**Fix (2026-07-15)**: replaced `react-native-fs` with
`@dr.pogodin/react-native-fs` (`^2.28.1`) — an actively maintained fork built
specifically to support the New Architecture, API-compatible with the
original (`RNFS.mkdir`, `RNFS.writeFile`, `RNFS.PicturesDirectoryPath`, etc.
all work unchanged). Only the import line changed, in
`src/utils/imageProcessor.ts` and `src/screens/GalleryScreen.tsx`:
`import * as RNFS from '@dr.pogodin/react-native-fs';` (the fork has no
default export, unlike the original). `package-lock.json` regenerated to
match.

**Lesson**: when a fix doesn't resolve a crash across a fresh signed build,
re-examine the assumption that the earlier diagnosis was even the right bug
— don't just re-apply the same fix harder. Any other legacy (non-Turbo,
non-Nitro) native module in this project should be treated as a suspect for
this same class of interop failure under RN 0.86's mandatory New
Architecture.

### Keyboard dismisses after one letter (Edit Watermark modal)
`src/components/CoordEditModal.tsx` had `const Row = ...` and `const Toggle = ...`
helper components defined **inside** the parent function body. Every `setState`
call (e.g. typing a character) re-rendered the parent, producing new function
references for `Row`/`Toggle`, causing React to unmount→remount the underlying
`TextInput` and dismiss the keyboard mid-typing.
**Fix**: promote `FieldRow` and `ToggleRow` to **module-level** `React.memo`
components that receive `colors` and callbacks as props. Also added
`keyboardShouldPersistTaps="handled"` on the wrapping `ScrollView`. The same
anti-pattern must be avoided in any future modal that hosts `TextInput`.

### Live watermark preview in Edit Watermark modal
Added a `WatermarkPreview` component at the top of `CoordEditModal` that renders
a simulated photo thumbnail with the watermark overlay updating in real-time
as the user edits fields or flips visibility toggles. It mirrors position,
opacity, text colour, font size, and all field content exactly as it will
appear on the saved image.
