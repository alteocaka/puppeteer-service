#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');

// Configuration
const SERVICE_URL = process.env.SERVICE_URL || 'http://localhost:3000';
const TEST_SAMPLES_DIR = path.join(__dirname, 'test-samples');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(html, testName) {
  return new Promise((resolve, reject) => {
    const postData = html;
    
    const options = {
      hostname: new URL(SERVICE_URL).hostname,
      port: new URL(SERVICE_URL).port || 3000,
      path: '/render',
      method: 'POST',
      headers: {
        'Content-Type': 'text/html',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          const imageSize = Buffer.byteLength(data, 'base64');
          log(`✅ ${testName}: Success (${imageSize} bytes)`, 'green');
          resolve({ success: true, size: imageSize, data });
        } else {
          log(`❌ ${testName}: Failed with status ${res.statusCode}`, 'red');
          log(`Response: ${data}`, 'red');
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      log(`❌ ${testName}: Network error - ${err.message}`, 'red');
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

async function testJSONInput() {
  const jsonData = {
    html: '<html><body style="background: #ff6b6b; color: white; padding: 50px; text-align: center;"><h1>JSON Test</h1><p>This HTML was sent as JSON!</p></body></html>'
  };
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(jsonData);
    
    const options = {
      hostname: new URL(SERVICE_URL).hostname,
      port: new URL(SERVICE_URL).port || 3000,
      path: '/render',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          const imageSize = Buffer.byteLength(data, 'base64');
          log(`✅ JSON Input Test: Success (${imageSize} bytes)`, 'green');
          resolve({ success: true, size: imageSize, data });
        } else {
          log(`❌ JSON Input Test: Failed with status ${res.statusCode}`, 'red');
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      log(`❌ JSON Input Test: Network error - ${err.message}`, 'red');
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  log('🧪 Starting Puppeteer Service Tests', 'bright');
  log(`📍 Service URL: ${SERVICE_URL}`, 'cyan');
  log('');

  const results = [];
  
  try {
    // Test 1: Simple HTML
    const simpleHTML = fs.readFileSync(path.join(TEST_SAMPLES_DIR, 'simple.html'), 'utf8');
    const simpleResult = await makeRequest(simpleHTML, 'Simple HTML Test');
    results.push(simpleResult);
    
    // Test 2: Complex HTML with external resources
    const complexHTML = fs.readFileSync(path.join(TEST_SAMPLES_DIR, 'complex.html'), 'utf8');
    const complexResult = await makeRequest(complexHTML, 'Complex HTML Test');
    results.push(complexResult);
    
    // Test 3: JSON Input
    const jsonResult = await testJSONInput();
    results.push(jsonResult);
    
    // Test 4: Empty HTML (should fail gracefully)
    try {
      await makeRequest('', 'Empty HTML Test');
    } catch (err) {
      log(`✅ Empty HTML Test: Correctly rejected empty input`, 'green');
    }
    
    // Test 5: Invalid HTML (should still work)
    const invalidHTML = '<html><body><h1>Unclosed tag<p>This should still work</body>';
    const invalidResult = await makeRequest(invalidHTML, 'Invalid HTML Test');
    results.push(invalidResult);
    
  } catch (error) {
    log(`💥 Test suite failed: ${error.message}`, 'red');
    process.exit(1);
  }
  
  // Summary
  log('');
  log('📊 Test Summary:', 'bright');
  log(`✅ Successful tests: ${results.length}`, 'green');
  log(`📏 Average image size: ${Math.round(results.reduce((sum, r) => sum + r.size, 0) / results.length)} bytes`, 'cyan');
  
  // Save sample images for manual inspection
  if (results.length > 0) {
    const outputDir = path.join(__dirname, 'test-output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    
    results.forEach((result, index) => {
      const filename = `test-${index + 1}.png`;
      const filepath = path.join(outputDir, filename);
      fs.writeFileSync(filepath, result.data, 'base64');
      log(`💾 Saved: ${filepath}`, 'blue');
    });
  }
  
  log('');
  log('🎉 All tests completed!', 'green');
}

// Check if service is running
async function checkService() {
  return new Promise((resolve) => {
    const req = http.request(`${SERVICE_URL}/render`, { method: 'POST' }, (res) => {
      resolve(true);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

async function main() {
  log('🔍 Checking if service is running...', 'yellow');
  
  const isRunning = await checkService();
  if (!isRunning) {
    log('❌ Service is not running!', 'red');
    log('Please start the service with: npm start', 'yellow');
    log('Or run in development mode: npm run dev', 'yellow');
    process.exit(1);
  }
  
  log('✅ Service is running!', 'green');
  log('');
  
  await runTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { makeRequest, testJSONInput };
