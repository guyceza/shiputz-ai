#!/bin/bash
# Deploy to Vercel and verify it works
# Usage: ./scripts/deploy-and-verify.sh "commit message"

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 'commit message'"
  exit 1
fi

echo "📦 Adding changes..."
git add -A

echo "💾 Committing: $1"
git commit -m "$1"

echo "🚀 Pushing to GitHub (triggers Vercel deploy)..."
git push origin main

echo "⏳ Waiting 60 seconds for Vercel deploy..."
sleep 60

echo "🔍 Testing production APIs..."

# Test Users API
USERS=$(curl -s "https://shipazti.com/api/users?email=guyceza@gmail.com")
if echo "$USERS" | grep -q "Unauthorized"; then
  echo "❌ FAIL: Users API returned Unauthorized!"
  exit 1
fi
echo "✅ Users API: OK"

# Test Check Vision API
VISION=$(curl -s "https://shipazti.com/api/check-vision?email=guyceza@gmail.com")
if echo "$VISION" | grep -q "Unauthorized"; then
  echo "❌ FAIL: Check Vision API returned Unauthorized!"
  exit 1
fi
echo "✅ Check Vision API: OK"

# Test Projects API
PROJECTS=$(curl -s "https://shipazti.com/api/projects?userId=07f1b8e6-c1fe-48e3-8755-92e3975f3d1d")
if echo "$PROJECTS" | grep -q "Unauthorized"; then
  echo "❌ FAIL: Projects API returned Unauthorized!"
  exit 1
fi
echo "✅ Projects API: OK"

echo ""
echo "🎉 Deploy successful and verified!"
