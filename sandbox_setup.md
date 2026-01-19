# Secure Sandbox Setup Guide

The current implementation uses local execution (`child_process.spawn`) which is **NOT SECURE** for production. Malicious users could delete files or access the network.

To secure this, you should use Docker.

## Docker Strategy

1. **Create a Dockerfile** for the execution environment.
   ```dockerfile
   FROM openjdk:17-alpine
   WORKDIR /app
   # Create a non-root user
   RUN addgroup -S appgroup && adduser -S appuser -G appgroup
   USER appuser
   ```

2. **Update `utils/executor.js` to run Docker.**
   Instead of `spawn('java', ...)` directly, spawn a docker container:
   ```javascript
   const docker = spawn('docker', [
       'run',
       '--rm',                  // Remove container after run
       '--network', 'none',     // Disable network
       '--memory', '128m',      // Limit memory
       '--cpus', '0.5',         // Limit CPU
       '-v', `${localPath}:/app/Solution.java`, // Mount code
       'my-java-sandbox',       // Image name
       'sh', '-c', 'javac Solution.java && java Solution'
   ]);
   ```

3. **Timeouts**: Docker supports `--stop-timeout`, but managing it in Node.js via `setTimeout` killing the docker process is also effective.

## Judge0 Alternative
If you prefer an API, deploy [Judge0](https://github.com/judge0/judge0) and replace the logic in `executor.js` to make an HTTP POST request to your Judge0 instance.
