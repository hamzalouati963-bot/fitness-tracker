#!/bin/sh
# List Android SDK packages
sdkmanager="`dirname "$0"`/android_sdkmanager.sh"
exec "$sdkmanager" list "$@"
