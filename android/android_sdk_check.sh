#!/bin/bash
# Again, run package manager to fix wrong portable mode.
# This script is meant to be called from other scripts.
# DO NOT run it from the terminal.
${ANDROID_HOME:-"/c/Program Files/Android/Android Studio/sdk"}/cmdline-tools/latest/bin/sdkmanager --list 2>/dev/null | grep -q "platforms;android-34" && echo "sdk ok" || echo "no sdk" > /dev/null
true
