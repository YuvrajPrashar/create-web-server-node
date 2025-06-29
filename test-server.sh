#!/bin/bash

# HTTP Server Test Script
echo "Testing HTTP Server Implementation"
echo "=================================="

# Test 1: Basic GET request
echo "Test 1: Basic GET request to /"
curl -s http://127.0.0.1:3000/
echo -e "\n"

# Test 2: Echo functionality
echo "Test 2: Echo POST request"
echo "Input: 'Hello from HTTP server!'"
curl -s http://127.0.0.1:3000/echo -d 'Hello from HTTP server!'
echo -e "\n"

# Test 3: Echo with JSON
echo "Test 3: Echo JSON data"
echo 'Input: {"name": "HTTP Server", "version": "1.0"}'
curl -s http://127.0.0.1:3000/echo -H "Content-Type: application/json" -d '{"name": "HTTP Server", "version": "1.0"}'
echo -e "\n"

# Test 4: Different path (should return default)
echo "Test 4: Different path (/test)"
curl -s http://127.0.0.1:3000/test
echo -e "\n"

# Test 5: Show full HTTP headers
echo "Test 5: Full HTTP response headers"
curl -v http://127.0.0.1:3000/ 2>&1 | grep -E '^[<>]'
echo

echo "All tests completed!"
