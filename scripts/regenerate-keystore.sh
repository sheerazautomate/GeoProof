#!/usr/bin/env bash
set -euo pipefail

if ! command -v keytool >/dev/null 2>&1; then
  echo "error: keytool not found. Install JDK (keytool) and retry." >&2
  exit 1
fi
if ! command -v base64 >/dev/null 2>&1; then
  echo "error: base64 not available." >&2
  exit 1
fi

OUT_DIR="android/app"
KEY_ALIAS="geoproof"
STORE_PASS=""
KEY_PASS=""

usage() {
  cat <<EOF
Usage: $0 -s STORE_PASS -k KEY_PASS [-a KEY_ALIAS] [-o OUT_DIR]

Generates a PKCS12 keystore at ${OUT_DIR}/geoproof-release.jks and writes
a base64-encoded representation to keystore-base64.txt in the current dir.

Note: modern keystores often require STORE_PASS and KEY_PASS to be identical.
EOF
  exit 1
}

while getopts "s:k:a:o:h" opt; do
  case "$opt" in
    s) STORE_PASS="$OPTARG" ;;
    k) KEY_PASS="$OPTARG" ;;
    a) KEY_ALIAS="$OPTARG" ;;
    o) OUT_DIR="$OPTARG" ;;
    h|*) usage ;;
  esac
done

if [ -z "$STORE_PASS" ] || [ -z "$KEY_PASS" ]; then
  usage
fi

mkdir -p "$OUT_DIR"
KEYSTORE_PATH="$OUT_DIR/geoproof-release.jks"

echo "Generating keystore at: $KEYSTORE_PATH"
keytool -genkeypair -v \
  -keystore "$KEYSTORE_PATH" \
  -alias "$KEY_ALIAS" \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass "$STORE_PASS" -keypass "$KEY_PASS" \
  -dname "CN=GeoProof, OU=GeoProof, O=GeoProof, L=Unknown, ST=Unknown, C=US"

BASE64_OUT="keystore-base64.txt"
base64 -w 0 "$KEYSTORE_PATH" > "$BASE64_OUT"

echo
echo "Wrote base64 to: $BASE64_OUT"
echo
cat <<EOF
Next steps (manual):

1) Verify the keystore locally (optional):
   keytool -list -keystore "$KEYSTORE_PATH" -storepass "$STORE_PASS"

2) Upload secrets to GitHub. Using the GitHub CLI `gh` (recommended):
   cat $BASE64_OUT | gh secret set KEYSTORE_BASE64
   gh secret set KEY_ALIAS --body "$KEY_ALIAS"
   gh secret set STORE_PASSWORD --body "$STORE_PASS"
   gh secret set KEY_PASSWORD --body "$KEY_PASS"

Or paste the contents of $BASE64_OUT into the repository Secrets UI.

Security: Do NOT commit the keystore file or base64 file to git. Keep
the keystore in a secure location (password manager or vault).
EOF

echo "Done. Keep the keystore file safe. Do not commit it to git."
