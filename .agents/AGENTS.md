# Antigravity Workspace Rules & Memory

This file contains technical notes, project-specific rules, and bug-fix memories for the GeoProof app.

## react-native-vision-camera v5 Notes
- The app uses `react-native-vision-camera` v5 (via `react-native-nitro-modules`), which has breaking API changes from v3/v4.
- **Photo Capture**: `takePhoto` is no longer available on the `<Camera>` ref. Instead, you must use the `usePhotoOutput()` hook:
  - Add `const photoOutput = usePhotoOutput();`
  - Pass it to the camera: `<Camera outputs={[photoOutput]} ... />`
  - Capture using: `await photoOutput.capturePhoto(settings, callbacks)` or `capturePhotoToFile`.
  - Always `dispose()` the photo object after use to free up native memory.
- **Flashlight / Torch**: The prop to turn on the continuous flashlight is `torchMode` (not `torch`). It accepts `'on' | 'off' | 'auto'`. Flash for photo capture is passed via `flashMode` inside `capturePhoto({ flashMode: 'on' })`.

## react-native-skia & File System Notes
- **Encoding Images**: `SkImage.encodeToBytes()` returns a `Uint8Array`.
- **Saving Files**: `react-native-fs`'s `RNFS.writeFile(..., 'base64')` expects a base64 encoded string, NOT a `Uint8Array`. Passing the byte array directly will cause a "value is null, expected to be an object" native exception.
- **Base64 Conversion**: Use `fromByteArray(encoded)` from `react-native-quick-base64` to convert the `Uint8Array` to a string before saving.

## UI & Layout
- **Modals on Android**: Modals with `presentationStyle="pageSheet"` on Android can overlay the system status bar. Always wrap the inner content in a `<SafeAreaView>` (from `react-native-safe-area-context`) to prevent buttons or headers from being hidden under the notch/status bar.
