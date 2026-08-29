#!/bin/sh
# Run Android SDK manager
exec "${ANDROID_HOME:-/c/Program Files/Android/Android Studio/sdk}/cmdline-tools/latest/bin/sdkmanager" "$@"
