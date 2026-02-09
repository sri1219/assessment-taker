const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const TEMP_DIR = path.join(__dirname, '..', 'temp');

if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR);
}

/**
 * Generic code executor
 * @param {string} code - Source code
 * @param {string} input - stdin input
 * @param {string} command - Command to execute (e.g., 'node', 'java')
 * @param {Array} args - Arguments for the command
 * @param {string} fileName - File name to write code to
 * @param {Function} compileStep - Optional compilation step
 * @returns {Promise<{compiled: boolean, output: string, error: string}>}
 */
const executeCode = (code, input, command, args, fileName, compileStep = null) => {
    return new Promise((resolve) => {
        const uniqueId = uuidv4();
        const dirPath = path.join(TEMP_DIR, uniqueId);
        const filePath = path.join(dirPath, fileName);

        fs.mkdirSync(dirPath);
        fs.writeFileSync(filePath, code);

        const runExecution = () => {
            const process = spawn(command, args, { cwd: dirPath, shell: true });

            let stdout = '';
            let stderr = '';

            // Write input to stdin
            if (input) {
                process.stdin.write(input);
                process.stdin.end();
            }

            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            // Timeout safety (10 seconds for TypeScript compilation)
            const timeout = setTimeout(() => {
                process.kill();
                resolve({ compiled: true, output: stdout, error: 'Time Limit Exceeded' });
                cleanup(dirPath);
            }, 10000);

            process.on('close', (code) => {
                clearTimeout(timeout);
                cleanup(dirPath);
                resolve({ compiled: true, output: stdout, error: stderr });
            });

            process.on('error', (err) => {
                clearTimeout(timeout);
                cleanup(dirPath);
                resolve({ compiled: true, output: '', error: err.message });
            });
        };

        // If there's a compilation step, execute it first
        if (compileStep) {
            compileStep(dirPath, fileName, (success, error) => {
                if (!success) {
                    cleanup(dirPath);
                    return resolve({ compiled: false, output: '', error: error || 'Compilation Failed' });
                }
                runExecution();
            });
        } else {
            runExecution();
        }
    });
};

/**
 * Executes a Java program with provided input and checks against expected output.
 * @param {string} javaCode - The source code.
 * @param {string} input - Input for stdin.
 * @param {string} className - Main class name (default Solution).
 * @returns {Promise<{compiled: boolean, output: string, error: string}>}
 */
const executeJava = (javaCode, input, className = 'Solution') => {
    const fileName = `${className}.java`;

    const compileStep = (dirPath, fileName, callback) => {
        const javac = spawn('javac', [fileName], { cwd: dirPath, shell: true });

        let compileError = '';
        javac.stderr.on('data', (data) => {
            compileError += data.toString();
        });

        javac.on('close', (code) => {
            callback(code === 0, compileError);
        });

        javac.on('error', (err) => {
            callback(false, 'Compilation Process Error: ' + err.message);
        });
    };

    return executeCode(javaCode, input, 'java', [className], fileName, compileStep);
};

/**
 * Executes a JavaScript program with provided input.
 * @param {string} jsCode - The JavaScript source code.
 * @param {string} input - Input for stdin.
 * @returns {Promise<{compiled: boolean, output: string, error: string}>}
 */
const executeJS = (jsCode, input) => {
    const fileName = 'solution.js';
    return executeCode(jsCode, input, 'node', [fileName], fileName);
};

/**
 * Executes a TypeScript program with provided input.
 * @param {string} tsCode - The TypeScript source code.
 * @param {string} input - Input for stdin.
 * @returns {Promise<{compiled: boolean, output: string, error: string}>}
 */
const executeTS = (tsCode, input) => {
    const fileName = 'solution.ts';
    // Use absolute path to ts-node to ensure it's found from temp directories
    const tsNodePath = path.resolve(__dirname, '..', 'node_modules', '.bin', 'ts-node');
    return executeCode(tsCode, input, 'node', [tsNodePath, '--transpile-only', fileName], fileName);
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

module.exports = { executeJava, executeJS, executeTS };
