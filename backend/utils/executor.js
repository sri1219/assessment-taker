const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const TEMP_DIR = path.join(__dirname, '..', 'temp');

if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR);
}

/**
 * Executes a Java program with provided input and checks against expected output.
 * @param {string} javaCode - The source code.
 * @param {string} className - Main class name (default Solution).
 * @param {string} input - Input for stdin.
 * @returns {Promise<{output: string, error: string}>}
 */
const executeJava = (javaCode, input, className = 'Solution') => {
    return new Promise((resolve, reject) => {
        const uniqueId = uuidv4();
        const dirPath = path.join(TEMP_DIR, uniqueId);
        const fileName = `${className}.java`;
        const filePath = path.join(dirPath, fileName);

        fs.mkdirSync(dirPath);
        fs.writeFileSync(filePath, javaCode);

        // Compile
        const javac = spawn('javac', [fileName], { cwd: dirPath, shell: true });

        // Capture javac stderr to show actual compilation errors
        let compileError = '';
        javac.stderr.on('data', (data) => {
            compileError += data.toString();
        });

        javac.on('close', (code) => {
            if (code !== 0) {
                cleanup(dirPath);
                return resolve({ compiled: false, output: '', error: compileError || 'Compilation Failed' });
            }

            // Run
            const java = spawn('java', [className], { cwd: dirPath, shell: true });

            let stdout = '';
            let stderr = '';

            // Write input to stdin
            if (input) {
                java.stdin.write(input);
                java.stdin.end();
            }

            java.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            java.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            // Timeout safety (5 seconds)
            const timeout = setTimeout(() => {
                java.kill();
                resolve({ compiled: true, output: stdout, error: 'Time Limit Exceeded' });
                cleanup(dirPath);
            }, 5000);

            java.on('close', (code) => {
                clearTimeout(timeout);
                cleanup(dirPath);
                resolve({ compiled: true, output: stdout, error: stderr });
            });

            java.on('error', (err) => {
                clearTimeout(timeout);
                cleanup(dirPath);
                resolve({ compiled: true, output: '', error: err.message });
            });
        });

        javac.on('error', (err) => {
            cleanup(dirPath);
            resolve({ compiled: false, output: '', error: 'Compilation Process Error: ' + err.message });
        });
    });
};

const cleanup = (dirPath) => {
    // Retry cleanup after a short delay to allow process locks to release
    setTimeout(() => {
        try {
            if (fs.existsSync(dirPath)) {
                fs.rmSync(dirPath, { recursive: true, force: true });
            }
        } catch (e) {
            console.error('Failed to cleanup temp dir:', e);
        }
    }, 100);
};

module.exports = { executeJava };
