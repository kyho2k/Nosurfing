#!/bin/bash

echo "🧹 Cleaning Next.js build cache..."
rm -rf .next
rm -rf node_modules/.cache

echo "📦 Installing dependencies..."
pnpm install

echo "🔨 Building project..."
pnpm run build

echo "✅ Build complete! Starting development server..."
pnpm run dev