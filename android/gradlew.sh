#!/bin/sh
# Run gradle with Android SDK variable
export ANDROID_HOME="${ANDROID_HOME:-/c/Program Files/Android/Android Studio/sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
exec "${ANDROID_HOME}/gradle/bin/gradle" "$@"
