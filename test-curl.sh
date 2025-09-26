#!/bin/bash

# Puppeteer Service Test Script
# Usage: ./test-curl.sh [service-url]

SERVICE_URL=${1:-"http://localhost:3000"}
OUTPUT_DIR="./test-output"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing Puppeteer Service${NC}"
echo -e "${BLUE}📍 Service URL: ${SERVICE_URL}${NC}"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Test 1: Simple HTML
echo -e "${YELLOW}Test 1: Simple HTML${NC}"
curl -X POST \
  -H "Content-Type: text/html" \
  -d '<html><body style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 50px; text-align: center; font-family: Arial, sans-serif;"><h1>🎉 Simple Test</h1><p>This is a simple HTML test!</p></body></html>' \
  "$SERVICE_URL/render" \
  --output "$OUTPUT_DIR/simple-test.png" \
  --silent --show-error

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Simple HTML test passed${NC}"
else
    echo -e "${RED}❌ Simple HTML test failed${NC}"
fi

# Test 2: JSON Input
echo -e "${YELLOW}Test 2: JSON Input${NC}"
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"html": "<html><body style=\"background: #ff6b6b; color: white; padding: 50px; text-align: center; font-family: Arial, sans-serif;\"><h1>📦 JSON Test</h1><p>This HTML was sent as JSON!</p></body></html>"}' \
  "$SERVICE_URL/render" \
  --output "$OUTPUT_DIR/json-test.png" \
  --silent --show-error

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ JSON input test passed${NC}"
else
    echo -e "${RED}❌ JSON input test failed${NC}"
fi

# Test 3: Complex HTML with external resources
echo -e "${YELLOW}Test 3: Complex HTML${NC}"
curl -X POST \
  -H "Content-Type: text/html" \
  -d '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Complex Test</title>
    <style>
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap");
        body { font-family: "Inter", sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
        .card { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; }
        .content { padding: 40px; }
        .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 30px 0; }
        .stat { text-align: center; padding: 20px; background: #f1f5f9; border-radius: 12px; }
        .stat-number { font-size: 2em; font-weight: 700; color: #667eea; }
        .stat-label { color: #64748b; margin-top: 8px; }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <h1>🚀 Complex Test</h1>
            <p>Testing external fonts and complex layouts</p>
        </div>
        <div class="content">
            <div class="stats">
                <div class="stat">
                    <div class="stat-number">1,234</div>
                    <div class="stat-label">Users</div>
                </div>
                <div class="stat">
                    <div class="stat-number">5,678</div>
                    <div class="stat-label">Sessions</div>
                </div>
                <div class="stat">
                    <div class="stat-number">$12,345</div>
                    <div class="stat-label">Revenue</div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>' \
  "$SERVICE_URL/render" \
  --output "$OUTPUT_DIR/complex-test.png" \
  --silent --show-error

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Complex HTML test passed${NC}"
else
    echo -e "${RED}❌ Complex HTML test failed${NC}"
fi

# Test 4: Empty input (should fail)
echo -e "${YELLOW}Test 4: Empty Input (should fail)${NC}"
response=$(curl -X POST \
  -H "Content-Type: text/html" \
  -d "" \
  "$SERVICE_URL/render" \
  --silent --show-error --write-out "%{http_code}")

if [ "$response" = "400" ]; then
    echo -e "${GREEN}✅ Empty input correctly rejected (400)${NC}"
else
    echo -e "${RED}❌ Empty input test failed (got: $response)${NC}"
fi

# Test 5: Invalid HTML (should still work)
echo -e "${YELLOW}Test 5: Invalid HTML${NC}"
curl -X POST \
  -H "Content-Type: text/html" \
  -d '<html><body><h1>Unclosed tag<p>This should still work</body>' \
  "$SERVICE_URL/render" \
  --output "$OUTPUT_DIR/invalid-test.png" \
  --silent --show-error

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Invalid HTML test passed${NC}"
else
    echo -e "${RED}❌ Invalid HTML test failed${NC}"
fi

echo ""
echo -e "${BLUE}📊 Test Results:${NC}"
echo -e "${BLUE}Generated images saved to: $OUTPUT_DIR${NC}"
ls -la "$OUTPUT_DIR"/*.png 2>/dev/null | while read line; do
    echo -e "${GREEN}  $line${NC}"
done

echo ""
echo -e "${GREEN}🎉 Testing completed!${NC}"
echo -e "${YELLOW}💡 Tip: Open the generated PNG files to verify the screenshots look correct${NC}"
