#!/bin/sh
# Build Android debug APK
exec "${ANDROID_HOME:-/c/Program Files/Android/Android Studio/sdk}/gradle/bin/gradle" "$@" --project-cache-dir="${ANDROID_HOME}/../.gradle"
