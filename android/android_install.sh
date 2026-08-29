#!/bin/sh
# Install Android SDK packages
sdkmanager="`dirname "$0"`/android_sdkmanager.sh"
exec "$sdkmanager" install "$@"
