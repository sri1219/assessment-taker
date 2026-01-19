import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config';
import Editor from '@monaco-editor/react';
import { AuthContext } from '../context/AuthContext';
import { useProctoring } from '../hooks/useProctoring';

const AssessmentRunner = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [assessment, setAssessment] = useState(null);
    const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // Map problemId -> { code, output, passedCases, totalCases }

    // UI State
    const [output, setOutput] = useState('');
    const [violations, setViolations] = useState([]);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchAssessment = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/assessments/${id}`);
                setAssessment(res.data);

                // Initialize answers state
                const initialAnswers = {};
                res.data.problems.forEach(p => {
                    initialAnswers[p._id] = {
                        code: p.starterCode || '',
                        output: '',
                        passedTestCases: 0,
                        totalTestCases: p.testCases.length
                    };
                });
                setAnswers(initialAnswers);
            } catch (e) {
                alert('Failed to load assessment');
                navigate('/dashboard');
            }
        };
        fetchAssessment();
    }, [id, navigate]);

    // Proctoring
    const handleViolation = (type) => {
        const msg = `${type} at ${new Date().toLocaleTimeString()}`;
        setViolations(prev => [...prev, msg]);
        setIsLocked(true);
    };
    useProctoring(handleViolation);

    const handleCodeChange = (val) => {
        const problemId = assessment.problems[currentProblemIndex]._id;
        setAnswers(prev => ({
            ...prev,
            [problemId]: { ...prev[problemId], code: val }
        }));
    };

    const runCode = async () => {
        const problem = assessment.problems[currentProblemIndex];
        const code = answers[problem._id].code;

        setOutput('Running Sample Case...');
        try {
            // Use first test case as sample or hardcoded sample
            const sampleInput = problem.testCases[0]?.input || '';
            const res = await axios.post(`${API_BASE_URL}/execute/run`, { code, input: sampleInput });

            setOutput(res.data.error ? `Error: ${res.data.error}` : `Output: ${res.data.output}`);
        } catch (e) {
            setOutput('Execution Failed');
        }
    };

    const submitAssessment = () => {
        setShowSubmitModal(true);
    };

    const confirmSubmit = async () => {
        setIsSubmitting(true);
        try {
            const formattedAnswers = Object.keys(answers).map(k => ({
                problem: k,
                code: answers[k].code,
                passedTestCases: 0, // In real app, run full suite here or use previous runs
                totalTestCases: 0
            }));

            await axios.post(`${API_BASE_URL}/assessments/${id}/submit`, {
                userId: user.id || user._id,
                answers: formattedAnswers,
                violationCount: violations.length
            });
            navigate('/dashboard');
        } catch (e) {
            alert('Submission Failed: ' + (e.response?.data?.error || e.message));
            setShowSubmitModal(false);
            setIsSubmitting(false);
        }
    };

    const enterFullScreen = () => {
        document.documentElement.requestFullscreen()
            .then(() => { setIsFullScreen(true); setIsLocked(false); })
            .catch(e => console.log(e));
    };

    if (!assessment) return <div className="text-white p-8">Loading Assessment...</div>;

    const currentProblem = assessment.problems[currentProblemIndex];
    const currentCode = answers[currentProblem._id]?.code || '';

    return (
        <div className="relative flex h-screen bg-gray-900 text-white font-sans overflow-hidden">
            {/* STRICT LOCKOUT OVERLAY */}
            {isLocked && (
                <div className="absolute inset-0 z-50 bg-red-900 bg-opacity-95 flex flex-col items-center justify-center text-center p-8 backdrop-blur-xl">
                    <div className="bg-black p-8 rounded-lg border-2 border-red-600 shadow-2xl max-w-lg">
                        <h1 className="text-4xl font-bold text-red-500 mb-4">⚠️ SECURITY LOCKOUT</h1>
                        <p className="text-xl text-gray-300 mb-6">Focus lost. Return to Full Screen.</p>
                        <button onClick={enterFullScreen} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full">
                            RETURN TO ASSESSMENT
                        </button>
                    </div>
                </div>
            )}

            {/* Sidebar */}
            <div className={`w-64 bg-gray-800 border-r border-gray-700 flex flex-col ${isLocked ? 'blur-sm' : ''}`}>
                <div className="p-4 border-b border-gray-700">
                    <h2 className="font-bold text-lg">{assessment.title}</h2>
                    <p className="text-sm text-gray-400">{assessment.problems.length} Questions</p>
                </div>
                <div className="flex-grow overflow-y-auto p-2">
                    {assessment.problems.map((p, idx) => (
                        <button
                            key={p._id}
                            onClick={() => setCurrentProblemIndex(idx)}
                            className={`w-full text-left p-2 mb-1 rounded ${idx === currentProblemIndex ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                        >
                            Q{idx + 1}. {p.title}
                        </button>
                    ))}
                </div>
                <div className="p-4 border-t border-gray-700">
                    <button onClick={submitAssessment} className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded font-bold">
                        Finish Assessment
                    </button>
                </div>
            </div>

            {/* Problem Area */}
            <div className={`flex-1 flex ${isLocked ? 'blur-sm' : ''}`}>
                <div className="w-1/3 p-6 border-r border-gray-700 overflow-y-auto">
                    <h1 className="text-2xl font-bold mb-4 text-blue-400">Q{currentProblemIndex + 1}. {currentProblem.title}</h1>
                    <div className="prose prose-invert mb-6">
                        <p>{currentProblem.description}</p>
                    </div>
                    {/* Violations Display */}
                    {violations.length > 0 && (
                        <div className="mt-4 p-2 bg-red-900 rounded text-xs text-red-200">
                            Violations: {violations.length}
                        </div>
                    )}
                    {/* Submit Confirmation Modal */}
                    {showSubmitModal && (
                        <div className="absolute inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center">
                            <div className="bg-gray-800 p-6 rounded shadow-lg border border-gray-600">
                                <h3 className="text-xl font-bold mb-4">Finish Assessment?</h3>
                                <p className="mb-6 text-gray-300">You cannot return after submitting.</p>
                                <div className="flex justify-end gap-4">
                                    <button
                                        onClick={() => setShowSubmitModal(false)}
                                        className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500"
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmSubmit}
                                        disabled={isSubmitting}
                                        className={`px-4 py-2 rounded font-bold flex items-center gap-2 ${isSubmitting ? 'bg-red-800 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                                Submitting...
                                            </>
                                        ) : (
                                            'Submit'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-2/3 flex flex-col">
                    <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
                        <span className="font-mono text-sm text-gray-400">Solution.java</span>
                        <div className="space-x-2">
                            <button onClick={runCode} className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded text-sm font-medium">Run</button>
                        </div>
                    </div>
                    <div className="flex-grow">
                        <Editor
                            height="100%"
                            defaultLanguage="java"
                            theme="vs-dark"
                            value={currentCode}
                            onChange={handleCodeChange}
                            options={{ minimap: { enabled: false }, fontSize: 14 }}
                        />
                    </div>
                    <div className="h-48 bg-black border-t border-gray-700 p-4 font-mono text-sm overflow-auto">
                        <div className="text-gray-500 mb-1">Output:</div>
                        <pre className="whitespace-pre-wrap">{output}</pre>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssessmentRunner;
