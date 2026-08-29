#!/bin/bash
# Assemble debug debug APK
set -e
cd "$(dirname "$0")"
CLI=/c/Users/hamza/Desktop/fit/node_modules/.bin/gradle
exec "$CLI" "$@" --project-cache-dir="$ANDROID_SDK_ROOT/../.gradle" 2>&1 | sed -u 's/[^a-zA-Z0-9._-]/_/g'
