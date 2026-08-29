#!/bin/bash
# Detects portable mode for Android SDK
if [ -n "$ANDROID_HOME" ]; then
  ANDROID_SDK_ROOT="$ANDROID_HOME"
fi
if [ -n "$ANDROID_SDK_ROOT" ]; then
  if [ -f "$ANDROID_SDK_ROOT/cmdline-tools/latest/bin/sdkmanager" ]; then
    echo "ok $ANDROID_SDK_ROOT"
    exit 0
  fi
fi
if [ -f "/c/Program Files/Android/Android Studio/sdk/cmdline-tools/latest/bin/sdkmanager" ]; then
  echo "/c/Program Files/Android/Android Studio/sdk"
  exit 0
fi
echo "/c/Users/hamza/AppData/Local/Android/Sdk"
