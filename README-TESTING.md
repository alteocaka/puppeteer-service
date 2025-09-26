# Testing the Puppeteer Service

This guide explains how to test the Puppeteer HTML-to-image service to ensure it's working correctly and to debug any issues.

## Quick Start

### 1. Start the Service

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start

# Using Docker
docker build -t puppeteer-service .
docker run -p 3000:3000 puppeteer-service
```

### 2. Run Tests

```bash
# Automated test suite (recommended)
node test-service.js

# Curl-based tests
./test-curl.sh

# Test against remote service
node test-service.js https://your-service-url.com
./test-curl.sh https://your-service-url.com
```

## Test Methods

### Method 1: Automated Test Suite (Recommended)

The `test-service.js` script provides comprehensive testing:

```bash
node test-service.js
```

**What it tests:**
- ✅ Simple HTML rendering
- ✅ Complex HTML with external fonts
- ✅ JSON input format
- ✅ Empty input handling
- ✅ Invalid HTML handling
- ✅ Network connectivity
- ✅ Image generation

**Output:**
- Console logs with colored output
- Generated PNG files in `test-output/` directory
- Performance metrics

### Method 2: Curl Commands

The `test-curl.sh` script provides basic HTTP testing:

```bash
./test-curl.sh
```

**What it tests:**
- Basic HTML rendering
- JSON input format
- Complex HTML
- Error handling
- File output

### Method 3: Manual Testing

#### Test with Simple HTML

```bash
curl -X POST \
  -H "Content-Type: text/html" \
  -d '<html><body style="background: #ff6b6b; color: white; padding: 50px; text-align: center;"><h1>Test</h1></body></html>' \
  http://localhost:3000/render \
  --output test.png
```

#### Test with JSON Input

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"html": "<html><body style=\"background: #4ecdc4; color: white; padding: 50px; text-align: center;\"><h1>JSON Test</h1></body></html>"}' \
  http://localhost:3000/render \
  --output test-json.png
```

#### Test with File Input

```bash
curl -X POST \
  -H "Content-Type: text/html" \
  --data-binary @test-samples/simple.html \
  http://localhost:3000/render \
  --output test-file.png
```

## Test Scenarios

### 1. Basic Functionality
- **Purpose**: Verify the service can render simple HTML
- **Expected**: PNG image with rendered content
- **Test**: `simple.html` sample

### 2. External Resources
- **Purpose**: Test loading of external fonts, CSS, and images
- **Expected**: PNG with proper fonts and styling
- **Test**: `complex.html` sample

### 3. JSON Input
- **Purpose**: Verify JSON input format works
- **Expected**: Same result as direct HTML input
- **Test**: JSON payload with HTML content

### 4. Error Handling
- **Purpose**: Ensure proper error responses
- **Expected**: HTTP 400 for empty input
- **Test**: Empty POST body

### 5. Invalid HTML
- **Purpose**: Test resilience to malformed HTML
- **Expected**: Service should still render what it can
- **Test**: HTML with unclosed tags

## Debugging

### Check Service Logs

The service provides detailed logging:

```bash
# Look for these log messages:
# ✅ "Rendering HTML (length): X"
# ✅ "HTML preview: ..."
# ✅ "Body content length: X"
# ✅ "Body HTML length: X"
# ⚠️  "No content detected, waiting additional 2 seconds..."
```

### Common Issues

#### 1. Blank/White Images
- **Cause**: Content not loading or timing issues
- **Debug**: Check logs for "Body content length: 0"
- **Fix**: The service now includes retry logic

#### 2. Service Not Responding
- **Cause**: Service not running or wrong port
- **Debug**: Check if port 3000 is accessible
- **Fix**: Start service with `npm start`

#### 3. External Resources Not Loading
- **Cause**: Network issues or blocked resources
- **Debug**: Check for timeout errors in logs
- **Fix**: Use inline CSS/fonts or check network connectivity

#### 4. Large HTML Timeout
- **Cause**: HTML too complex or large
- **Debug**: Check HTML length in logs
- **Fix**: Optimize HTML or increase timeout

### Performance Testing

```bash
# Test with large HTML
node -e "
const fs = require('fs');
const html = '<html><body>' + Array(1000).fill('<p>Large content test</p>').join('') + '</body></html>';
fs.writeFileSync('large-test.html', html);
"

curl -X POST \
  -H "Content-Type: text/html" \
  --data-binary @large-test.html \
  http://localhost:3000/render \
  --output large-test.png
```

## Sample Files

The `test-samples/` directory contains:

- `simple.html` - Basic HTML with inline styles
- `complex.html` - Complex HTML with external fonts and animations

## Expected Results

### Successful Test Output

```
🧪 Starting Puppeteer Service Tests
📍 Service URL: http://localhost:3000

✅ Simple HTML Test: Success (45231 bytes)
✅ Complex HTML Test: Success (67890 bytes)
✅ JSON Input Test: Success (23456 bytes)
✅ Empty HTML Test: Correctly rejected empty input
✅ Invalid HTML Test: Success (12345 bytes)

📊 Test Summary:
✅ Successful tests: 4
📏 Average image size: 37230 bytes

💾 Saved: /path/to/test-output/test-1.png
💾 Saved: /path/to/test-output/test-2.png
💾 Saved: /path/to/test-output/test-3.png
💾 Saved: /path/to/test-output/test-4.png

🎉 All tests completed!
```

### Generated Images

Check the `test-output/` directory for generated PNG files:
- Open each file to verify the content renders correctly
- Compare with expected visual output
- Check for any missing fonts, images, or styling

## Continuous Testing

For development, you can run tests automatically:

```bash
# Watch for changes and re-test
nodemon --watch render-service.js --exec "node test-service.js"

# Or use a file watcher
fswatch -o . | xargs -n1 -I{} node test-service.js
```

## Troubleshooting

### Service Won't Start
```bash
# Check if port is in use
lsof -i :3000

# Kill process if needed
kill -9 $(lsof -t -i:3000)

# Check dependencies
npm install
```

### Docker Issues
```bash
# Rebuild image
docker build -t puppeteer-service .

# Run with debug
docker run -p 3000:3000 -e DEBUG=* puppeteer-service

# Check logs
docker logs <container-id>
```

### Network Issues
```bash
# Test connectivity
curl -I http://localhost:3000/render

# Check firewall
sudo ufw status
```

## Integration Testing

For testing with your actual HTML templates:

```bash
# Test with your template
curl -X POST \
  -H "Content-Type: text/html" \
  --data-binary @your-template.html \
  http://localhost:3000/render \
  --output your-template.png
```

This comprehensive testing setup ensures your Puppeteer service is working correctly and helps identify any issues with HTML rendering, timing, or external resources.
