#!/bin/bash

echo "🚀 Starting HTTP Server from Scratch Demo"
echo "========================================"

# Check if the server file exists
if [ ! -f "http-server-clean.ts" ]; then
    echo "❌ Error: http-server-clean.ts not found in current directory"
    echo "Please run this script from the web-server directory"
    exit 1
fi

# Check if the demo page exists
if [ ! -f "public/index.html" ]; then
    echo "⚠️  Warning: Demo page not found at public/index.html"
    echo "The server will still work, but the demo interface won't be available"
fi

echo "📁 Current directory: $(pwd)"
echo "🌐 Server will be available at: http://127.0.0.1:3000"
echo "🎯 Demo page will be at: http://127.0.0.1:3000/"
echo ""
echo "✨ Features available:"
echo "   • Interactive demo webpage"
echo "   • Echo server at /echo"
echo "   • CORS enabled for testing"
echo "   • Real-time request/response display"
echo ""
echo "🧪 Test endpoints:"
echo "   • GET  http://127.0.0.1:3000/"
echo "   • POST http://127.0.0.1:3000/echo -d 'your data'"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
npx ts-node http-server-clean.ts
