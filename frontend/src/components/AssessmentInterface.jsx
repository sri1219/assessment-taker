import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { useProctoring } from '../hooks/useProctoring';

import API_BASE_URL from '../config';

const AssessmentInterface = ({ assessment, user }) => {
    const [problem, setProblem] = useState({
        title: 'Loading...',
        description: 'Fetching problem...',
        starterCode: '// Loading...'
    });
    const [code, setCode] = useState('');
    const [output, setOutput] = useState('');
    const [violations, setViolations] = useState([]);
    const [isFullScreen, setIsFullScreen] = useState(false);

    const [isLocked, setIsLocked] = useState(false);

    useEffect(() => {
        setProblem({
            title: 'Sum of Two Numbers',
            description: 'Write a Java program that accepts two integers from standard input and prints their sum to standard output.',
            starterCode: `import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // Write your code here

    }
} `
        });
        setCode(`import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (scanner.hasNextInt()) {
            int a = scanner.nextInt();
            int b = scanner.nextInt();
            System.out.println(a + b);
        }
    }
} `);
    }, [assignmentId]);

    const handleViolation = (type) => {
        const msg = `${type} at ${new Date().toLocaleTimeString()} `;
        setViolations(prev => [...prev, msg]);
        setIsLocked(true); // LOCK START
    };

    useProctoring(handleViolation);

    const handleRun = async () => {
        setOutput('Running...');
        try {
            const res = await axios.post(`${API_BASE} /execute/run`, {
                code,
                input: '5 10'
            });
            if (res.data.error) {
                setOutput(`Error: \n${res.data.error} `);
            } else {
                setOutput(`Output: \n${res.data.output} `);
            }
        } catch (err) {
            setOutput('Execution Error: ' + err.message);
        }
    };

    const handleSubmit = async () => {
        setOutput('Submitting...');
        try {
            const res = await axios.post(`${API_BASE} /execute/submit`, {
                userId,
                assignmentId: '65a...',
                code,
                violationCount: violations.length
            });
            setOutput(`Submission Result: Score ${res.data.score}% `);
        } catch (err) {
            setOutput('Submission Failed: ' + err.message);
        }
    };

    const enterFullScreen = () => {
        document.documentElement.requestFullscreen().then(() => {
            setIsFullScreen(true);
            setIsLocked(false); // UNLOCK
        }).catch(e => console.log(e));
    };

    return (
        <div className="relative flex h-screen bg-gray-900 text-white font-sans overflow-hidden">

            {/* STRICT LOCKOUT OVERLAY */}
            {isLocked && (
                <div className="absolute inset-0 z-50 bg-red-900 bg-opacity-95 flex flex-col items-center justify-center text-center p-8 backdrop-blur-xl">
                    <div className="bg-black p-8 rounded-lg border-2 border-red-600 shadow-2xl max-w-lg">
                        <h1 className="text-4xl font-bold text-red-500 mb-4">⚠️ SECURITY LOCKOUT</h1>
                        <p className="text-xl text-gray-300 mb-6">
                            You have violated the assessment integrity protocols by leaving the window or switching tabs.
                        </p>
                        <div className="text-left bg-gray-900 p-4 rounded mb-6 text-sm text-red-400 font-mono">
                            <p>Violation Detected: Focus Lost / Tab Switch</p>
                            <p>Action: Assessment Paused & Content Hidden</p>
                        </div>
                        <p className="text-gray-400 mb-6">
                            Return to Full Screen mode immediately to continue. This incident has been logged.
                        </p>
                        <button
                            onClick={enterFullScreen}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full transition-transform transform hover:scale-105"
                        >
                            RETURN TO ASSESSMENT
                        </button>
                    </div>
                </div>
            )}

            <div className={`w - 1 / 3 p - 6 border - r border - gray - 700 overflow - y - auto ${isLocked ? 'blur-sm grayscale' : ''} `}>
                <h1 className="text-2xl font-bold mb-4 text-blue-400">{problem.title}</h1>
                <div className="prose prose-invert mb-6">
                    <p>{problem.description}</p>
                </div>

                <div className="mb-6 p-4 bg-gray-800 rounded border border-gray-700">
                    <h3 className="font-semibold mb-2">Sample Input</h3>
                    <code className="block bg-black p-2 rounded">5 10</code>
                    <h3 className="font-semibold mt-2 mb-2">Sample Output</h3>
                    <code className="block bg-black p-2 rounded">15</code>
                </div>

                <div className="mt-8">
                    <h3 className="text-red-400 font-bold mb-2">Violations Log ({violations.length})</h3>
                    <ul className="text-sm text-red-300 max-h-40 overflow-y-auto">
                        {violations.map((v, i) => <li key={i}>{v}</li>)}
                    </ul>
                </div>

                {!isFullScreen && (
                    <button onClick={enterFullScreen} className="mt-4 w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded">
                        Enter Full Screen Mode
                    </button>
                )}
            </div>

            <div className={`w - 2 / 3 flex flex - col ${isLocked ? 'blur-sm grayscale' : ''} `}>
                <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
                    <span className="font-mono text-sm text-gray-400">Solution.java</span>
                    <div className="space-x-2">
                        <button onClick={handleRun} className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded text-sm font-medium transition-colors">
                            Run
                        </button>
                        <button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded text-sm font-medium transition-colors">
                            Submit
                        </button>
                    </div>
                </div>

                <div className="flex-grow">
                    <Editor
                        height="100%"
                        defaultLanguage="java"
                        theme="vs-dark"
                        value={code}
                        onChange={(val) => setCode(val)}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            scrollBeyondLastLine: false,
                            automaticLayout: true
                        }}
                    />
                </div>

                <div className="h-48 bg-black border-t border-gray-700 p-4 font-mono text-sm overflow-auto">
                    <div className="text-gray-500 mb-1">Console Output:</div>
                    <pre className="whitespace-pre-wrap">{output}</pre>
                </div>
            </div>
        </div>
    );
};

export default AssessmentInterface;
