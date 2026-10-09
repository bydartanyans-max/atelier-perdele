#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "Bu script macOS ve Xcode gerektirir."
  exit 1
fi
command -v node >/dev/null || { echo "Node.js 22 kurun."; exit 1; }
xcodebuild -version
command -v pod >/dev/null || { echo "CocoaPods kurun, sonra tekrar deneyin."; exit 1; }
npm ci
npm run typecheck
npm test
export NODE_ENV=production
npx expo prebuild --platform ios
echo "Xcode imzalama hesabini secmeniz gerekebilir. iPhone'u USB ile baglayin."
npx expo run:ios --device --configuration Release
