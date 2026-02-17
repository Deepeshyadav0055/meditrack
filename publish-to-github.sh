#!/bin/bash
# MediTrack - GitHub Publishing Commands
# Quick Reference for Publishing to GitHub

echo "🚀 MediTrack GitHub Publishing"
echo "================================"
echo ""

# Check if repository name is provided
if [ -z "$1" ]; then
    echo "Usage: ./publish-to-github.sh YOUR_GITHUB_USERNAME"
    echo ""
    echo "Example: ./publish-to-github.sh deepeshyadav"
    exit 1
fi

USERNAME=$1
REPO_NAME="meditrack"

echo "📋 Step 1: Verify git status"
git status

echo ""
echo "📋 Step 2: Add remote origin"
echo "Running: git remote add origin https://github.com/$USERNAME/$REPO_NAME.git"
git remote add origin "https://github.com/$USERNAME/$REPO_NAME.git"

echo ""
echo "📋 Step 3: Push to GitHub"
echo "Running: git push -u origin main"
git push -u origin main

echo ""
echo "✅ Done! Your repository is now on GitHub!"
echo "🌐 Visit: https://github.com/$USERNAME/$REPO_NAME"
echo ""
echo "Next steps:"
echo "1. Add topics/tags to your repository"
echo "2. Add screenshots to showcase your project"
echo "3. Deploy to Railway (backend) and Vercel (frontend)"
echo ""
echo "See github_publishing_guide.md for detailed instructions"
