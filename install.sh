#!/bin/bash

set -e

PLUGIN_DIR=""
REPO_URL="https://github.com/AnEntrypoint/glootie-oc.git"
BRANCH="main"

echo "🚀 Installing Glootie OpenCode Plugin..."

if [ "$1" = "--global" ] || [ "$1" = "-g" ]; then
    PLUGIN_DIR="$HOME/.config/opencode/plugin"
    echo "📍 Installing globally to $PLUGIN_DIR"
elif [ -d ".git" ] || [ -f "package.json" ] || [ -f "opencode.json" ]; then
    PLUGIN_DIR=".opencode/plugin"
    echo "📍 Installing locally to $PLUGIN_DIR"
else
    PLUGIN_DIR="$HOME/.config/opencode/plugin"
    echo "⚠️  Not in a project directory. Installing globally to $PLUGIN_DIR"
fi

mkdir -p "$PLUGIN_DIR"

if [ -d "$PLUGIN_DIR/.git" ]; then
    echo "📥 Plugin directory exists, updating..."
    cd "$PLUGIN_DIR"
    git fetch origin
    git reset --hard "origin/$BRANCH"
    git clean -fd
else
    echo "📥 Downloading plugin files..."
    TEMP_DIR=$(mktemp -d)
    git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$TEMP_DIR"
    
    cp "$TEMP_DIR/glootie.mjs" "$PLUGIN_DIR/"
    cp "$TEMP_DIR/package.json" "$PLUGIN_DIR/"
    cp "$TEMP_DIR/package-lock.json" "$PLUGIN_DIR/" 2>/dev/null || true
    
    if [ -f "$TEMP_DIR/README.md" ]; then
        cp "$TEMP_DIR/README.md" "$PLUGIN_DIR/"
    fi
    
    rm -rf "$TEMP_DIR"
    cd "$PLUGIN_DIR"
fi

echo "📦 Installing dependencies..."
npm install --production

echo ""
echo "✅ Installation complete!"
echo ""
echo "📋 Plugin features:"
echo "   • Session start: Loads start.md, runs mcp-thorns, wfgy hook"
echo "   • Session idle: Git sync checks, runs eval scripts"
echo ""
echo "📚 Documentation: https://github.com/AnEntrypoint/glootie-oc"
echo ""
echo "🎯 Next steps:"
echo "   1. Run 'opencode' in your project"
echo "   2. Plugin will automatically load"
echo "   3. Create 'start.md' for session context (optional)"
echo "   4. Create 'eval.js' or 'evals/*.js' for validation (optional)"
