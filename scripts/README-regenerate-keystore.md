# Regenerate keystore helper

This folder contains a small helper script to generate a keystore and export
it as base64 suitable for the `KEYSTORE_BASE64` GitHub Actions secret.

Usage
-----

Generate a new keystore and base64 file:

```bash
./scripts/regenerate-keystore.sh -s '<STORE_PASSWORD>' -k '<KEY_PASSWORD>'
```

Optional flags:
- `-a KEY_ALIAS`  : change the alias (default: `geoproof`)
- `-o OUT_DIR`    : where to write `geoproof-release.jks` (default: `android/app`)

After running the script, you'll get `keystore-base64.txt`. Upload the
contents to your repository's Secrets as `KEYSTORE_BASE64`, and set the
other three secrets (`KEY_ALIAS`, `STORE_PASSWORD`, `KEY_PASSWORD`) to match.

Security notes
--------------

- Do not commit the keystore (`geoproof-release.jks`) or the base64 file to git.
- Store passwords in a vault or password manager.
