#!/bin/sh
# Run Android SDK tools
exec "${ANDROID_HOME:-/c/Program Files/Android/Android Studio/sdk}/tools/bin/sdkmanager" "$@"
