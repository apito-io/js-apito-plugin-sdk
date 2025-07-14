#!/usr/bin/env node

/**
 * Critical Handshake Protocol Test
 * 
 * This test ensures that the JavaScript SDK maintains the correct
 * HashiCorp go-plugin handshake protocol without contamination.
 * 
 * Expected handshake format: "1|1|tcp|127.0.0.1:PORT|grpc\n"
 * - Must be the ONLY line written to stdout
 * - All other logs must go to stderr
 * - Plugin must start and bind to a port successfully
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Test configuration
const TEST_TIMEOUT = 10000; // 10 seconds
const HANDSHAKE_PATTERN = /^1\|1\|tcp\|127\.0\.0\.1:\d+\|grpc\n?$/;

/**
 * Create a minimal test plugin for handshake validation
 */
function createTestPlugin() {
    const testPluginCode = `
const { init } = require('./dist/main.js');
const { StringField } = require('./dist/helpers.js');

async function main() {
    process.stderr.write('Test plugin starting...\\n');
    
    // Initialize minimal plugin
    const plugin = init('test-handshake-plugin', '1.0.0', 'test-key');
    
    // Register minimal query for completeness
    plugin.registerQuery('test', StringField('Test query'), async () => 'test');
    
    process.stderr.write('Test plugin configured, starting server...\\n');
    
    // Start the plugin server
    await plugin.serve();
}

main().catch(error => {
    process.stderr.write('Test plugin failed: ' + error + '\\n');
    process.exit(1);
});
`;

    const testPluginPath = path.join(__dirname, 'test-plugin-handshake.js');
    fs.writeFileSync(testPluginPath, testPluginCode);
    return testPluginPath;
}

/**
 * Run handshake protocol test
 */
async function testHandshakeProtocol() {
    console.log('🧪 Testing HashiCorp go-plugin handshake protocol...');
    
    // Create test plugin
    const testPluginPath = createTestPlugin();
    
    return new Promise((resolve, reject) => {
        let stdoutData = '';
        let stderrData = '';
        let testPassed = false;
        let testResults = {
            success: false,
            stdout: '',
            stderr: '',
            handshakeFound: false,
            handshakeValid: false,
            stdoutClean: false,
            portExtracted: null,
            errors: []
        };

        // Set required environment variables
        const env = {
            ...process.env,
            APITO_PLUGIN: 'apito_plugin_magic_cookie_v1'
        };

        console.log('🚀 Starting test plugin...');
        
        // Spawn the test plugin
        const child = spawn('node', [testPluginPath], {
            env: env,
            stdio: ['pipe', 'pipe', 'pipe']
        });

        // Timeout handler
        const timeout = setTimeout(() => {
            if (!testPassed) {
                testResults.errors.push('Test timed out - plugin did not start within ' + TEST_TIMEOUT + 'ms');
                child.kill('SIGTERM');
                resolve(testResults);
            }
        }, TEST_TIMEOUT);

        // Capture stdout (should ONLY contain handshake)
        child.stdout.on('data', (data) => {
            stdoutData += data.toString();
            testResults.stdout = stdoutData;
            
            console.log('📤 STDOUT received:', JSON.stringify(data.toString()));
            
            // Check if we received the handshake
            const lines = stdoutData.split('\\n').filter(line => line.trim());
            
            if (lines.length > 0) {
                const handshakeLine = lines[0];
                console.log('🔍 Checking handshake line:', JSON.stringify(handshakeLine));
                
                // Validate handshake format
                if (HANDSHAKE_PATTERN.test(handshakeLine)) {
                    testResults.handshakeFound = true;
                    testResults.handshakeValid = true;
                    
                    // Extract port
                    const portMatch = handshakeLine.match(/127\.0\.0\.1:(\d+)/);
                    if (portMatch) {
                        testResults.portExtracted = parseInt(portMatch[1]);
                        console.log('✅ Valid handshake detected on port:', testResults.portExtracted);
                    }
                    
                    // Check if stdout is clean (only handshake line)
                    if (lines.length === 1) {
                        testResults.stdoutClean = true;
                        console.log('✅ Stdout is clean - contains only handshake');
                    } else {
                        testResults.errors.push('Stdout contaminated - contains ' + lines.length + ' lines instead of 1');
                        console.log('❌ Stdout contaminated with extra lines:', lines.slice(1));
                    }
                    
                    // Test passed!
                    testPassed = true;
                    testResults.success = testResults.handshakeValid && testResults.stdoutClean;
                    
                    clearTimeout(timeout);
                    child.kill('SIGTERM');
                    
                    setTimeout(() => resolve(testResults), 100); // Give it a moment to clean up
                    
                } else {
                    testResults.errors.push('Invalid handshake format: ' + handshakeLine);
                    console.log('❌ Invalid handshake format:', handshakeLine);
                }
            }
        });

        // Capture stderr (should contain debug logs)
        child.stderr.on('data', (data) => {
            stderrData += data.toString();
            testResults.stderr = stderrData;
            console.log('📥 STDERR:', data.toString().trim());
        });

        // Handle process exit
        child.on('exit', (code, signal) => {
            console.log('🔚 Test plugin exited with code:', code, 'signal:', signal);
            
            if (!testPassed) {
                testResults.errors.push('Plugin exited before handshake completed (code: ' + code + ')');
                clearTimeout(timeout);
                resolve(testResults);
            }
        });

        // Handle process errors
        child.on('error', (error) => {
            console.log('❌ Test plugin error:', error.message);
            testResults.errors.push('Plugin process error: ' + error.message);
            clearTimeout(timeout);
            resolve(testResults);
        });
    });
}

/**
 * Cleanup test files
 */
function cleanup() {
    const testPluginPath = path.join(__dirname, 'test-plugin-handshake.js');
    if (fs.existsSync(testPluginPath)) {
        fs.unlinkSync(testPluginPath);
        console.log('🧹 Cleaned up test plugin file');
    }
}

/**
 * Print test results
 */
function printResults(results) {
    console.log('\\n' + '='.repeat(60));
    console.log('🧪 HANDSHAKE PROTOCOL TEST RESULTS');
    console.log('='.repeat(60));
    
    console.log('Overall Success:', results.success ? '✅ PASS' : '❌ FAIL');
    console.log('Handshake Found:', results.handshakeFound ? '✅' : '❌');
    console.log('Handshake Valid:', results.handshakeValid ? '✅' : '❌');
    console.log('Stdout Clean:', results.stdoutClean ? '✅' : '❌');
    console.log('Port Extracted:', results.portExtracted || 'None');
    
    if (results.errors.length > 0) {
        console.log('\\n❌ Errors:');
        results.errors.forEach((error, i) => {
            console.log('  ' + (i + 1) + '. ' + error);
        });
    }
    
    console.log('\\n📤 STDOUT Content:');
    console.log('  "' + results.stdout.replace(/\\n/g, '\\\\n') + '"');
    
    console.log('\\n📥 STDERR Content (last 200 chars):');
    const stderrPreview = results.stderr.slice(-200);
    console.log('  "' + stderrPreview.replace(/\\n/g, '\\\\n') + '"');
    
    console.log('\\n' + '='.repeat(60));
}

/**
 * Main test execution
 */
async function main() {
    try {
        const results = await testHandshakeProtocol();
        printResults(results);
        
        // Cleanup
        cleanup();
        
        // Exit with appropriate code
        process.exit(results.success ? 0 : 1);
        
    } catch (error) {
        console.error('❌ Test failed with exception:', error);
        cleanup();
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { testHandshakeProtocol, createTestPlugin }; 