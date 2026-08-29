#!/bin/sh
# Accept Android SDK licenses
sdkmanager="`dirname "$0"`/android_sdkmanager.sh"
exec "$sdkmanager" --licenses "$@"
