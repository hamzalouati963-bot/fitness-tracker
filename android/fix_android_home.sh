#!/bin/bash
# Fixes wrong mode for Android SDK
if [ -n "$ANDROID_HOME" ]; then
  ANDROID_SDK_ROOT="$ANDROID_HOME"
fi
if [ -n "$ANDROID_SDK_ROOT" ]; then
  export ANDROID_SDK_ROOT="$ANDROID_SDK_ROOT"
fi
if [ -n "$ANDROID_HOME" ]; then
  export ANDROID_HOME="$ANDROID_HOME"
fi
echo "ANDROID_HOME=$ANDROID_HOME"
echo "ANDROID_SDK_ROOT=$ANDROID_SDK_ROOT"
