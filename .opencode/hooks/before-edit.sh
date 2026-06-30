#!/usr/bin/env sh
# Receives $1 = FILE path about to be edited.
# Emits a [WARN] and exits 0 (never blocks the edit).

FILE="$1"

warn() {
  echo "[WARN] before-edit: $1" >&2
}

# Build output
case "$FILE" in
  dist/*|dist/*)
    warn "Editing a build artifact: $FILE — edit the source file instead."
    exit 0
    ;;
esac

# Dependency directory
case "$FILE" in
  node_modules/*)
    warn "Editing inside node_modules: $FILE — this change will be lost on npm install."
    exit 0
    ;;
esac

# Lock files (auto-generated)
case "$FILE" in
  package-lock.json)
    warn "Editing package-lock.json directly: $FILE — let npm manage this file."
    exit 0
    ;;
esac

# SSL certificates and keystores
case "$FILE" in
  ssl/*|*.pem|*.key|*.crt|*.p12|*.jks|*.pfx)
    warn "Editing a certificate or keystore: $FILE — do not commit this file."
    exit 0
    ;;
esac

# Angular compiler and TypeScript build output
case "$FILE" in
  *.js.map|*.d.ts.map)
    warn "Editing a source map file: $FILE — this is generated output."
    exit 0
    ;;
esac

# Angular CLI cache
case "$FILE" in
  .angular/*)
    warn "Editing Angular CLI cache: $FILE — this is generated output."
    exit 0
    ;;
esac

exit 0
