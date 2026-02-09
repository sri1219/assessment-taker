const { executeJava, executeJS, executeTS } = require('./utils/executor');

console.log('=== Testing Multi-Language Executor ===\n');

// Test Java
console.log('Testing Java...');
const javaCode = `
public class Solution {
    public static void main(String[] args) {
        System.out.println("Hello from Java!");
    }
}
`;

executeJava(javaCode, '').then(result => {
    console.log('Java Result:', result);
    console.log('---\n');

    // Test JavaScript
    console.log('Testing JavaScript...');
    const jsCode = `console.log("Hello from JavaScript!");`;

    return executeJS(jsCode, '');
}).then(result => {
    console.log('JavaScript Result:', result);
    console.log('---\n');

    // Test TypeScript
    console.log('Testing TypeScript...');
    const tsCode = `const message: string = "Hello from TypeScript!";\nconsole.log(message);`;

    return executeTS(tsCode, '');
}).then(result => {
    console.log('TypeScript Result:', result);
    console.log('---\n');
    console.log('All tests completed!');
}).catch(err => {
    console.error('Error during testing:', err);
});
