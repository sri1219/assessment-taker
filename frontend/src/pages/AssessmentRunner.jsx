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
    const [answers, setAnswers] = useState({});

    // UI State
    const [output, setOutput] = useState('');
    const [violations, setViolations] = useState([]);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [descriptionCollapsed, setDescriptionCollapsed] = useState(false);

    useEffect(() => {
        const fetchAssessment = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/assessments/${id}`);
                setAssessment(res.data);
                const initialAnswers = {};
                res.data.problems.forEach(p => {
                    initialAnswers[p._id] = {
                        code: p.starterCode || '',
                        output: '',
                        passedTestCases: 0,
                        totalTestCases: (p.testCases || []).length
                    };
                });
                setAnswers(initialAnswers);
            } catch (e) {
                navigate('/dashboard');
            }
        };
        fetchAssessment();

        // Listener for Fullscreen changes
        const handleFullscreenChange = () => {
            const fs = !!document.fullscreenElement;
            setIsFullScreen(fs);
            if (!fs) {
                setIsLocked(true); // Enforce lockout if they exit fullscreen
            } else {
                setIsLocked(false); // Unlock if they re-enter
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        // Initial check
        handleFullscreenChange();

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [id, navigate]);

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
        setOutput('Initializing environment...\nRunning sample case...');
        try {
            const sampleInput = problem.testCases?.[0]?.input || '';
            const res = await axios.post(`${API_BASE_URL}/execute/run`, { code, input: sampleInput });
            setOutput(res.data.error ? `>> ERROR <<\n${res.data.error}` : `>> EXECUTION SUCCESS <<\n\n${res.data.output}`);
        } catch (e) {
            setOutput('>> SYSTEM FAILURE <<\nUnable to reach execution server.');
        }
    };

    const confirmSubmit = async () => {
        setIsSubmitting(true);
        try {
            const formattedAnswers = Object.keys(answers).map(k => ({
                problem: k,
                code: answers[k].code,
                passedTestCases: 0,
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

    if (!assessment) return (
        <div className="min-h-screen flex items-center justify-center text-white bg-[hsl(var(--bg))]">
            <div className="animate-pulse text-indigo-400 font-medium tracking-widest uppercase text-xs">Environment Loading...</div>
        </div>
    );

    const currentProblem = assessment.problems[currentProblemIndex];
    const currentCode = answers[currentProblem._id]?.code || '';

    return (
        <div className="h-screen bg-[hsl(var(--bg))] text-white flex flex-col overflow-hidden font-sans">
            {/* Background Decor */}
            <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            {/* Security Lockout Overlay */}
            {isLocked && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-red-950/40 backdrop-blur-2xl animate-in fade-in duration-500">
                    <div className="glass-card max-w-lg w-full p-10 rounded-[40px] border-red-500/30 text-center shadow-2xl animate-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center text-red-500 mx-auto mb-8 animate-pulse border border-red-500/20">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-3a4 4 0 11-8 0 4 4 0 018 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 11V7a3 3 0 016 0v4m-9 0h9" /></svg>
                        </div>
                        <h2 className="text-3xl font-bold mb-4 text-red-100">Environment Locked</h2>
                        <p className="text-gray-400 mb-10 leading-relaxed font-medium">Your session has been paused due to a security violation. Return to full-screen mode to resume your work.</p>
                        <button
                            onClick={enterFullScreen}
                            className="w-full py-4 rounded-2xl bg-red-600 text-white font-bold shadow-lg shadow-red-500/20 hover:scale-[1.02] active:scale-95 transition-all duration-300"
                        >
                            RE-ENTER ENVIRONMENT
                        </button>
                    </div>
                </div>
            )}

            {/* Top Navigation */}
            <header className={`h-16 flex items-center justify-between px-6 border-b border-white/5 bg-white/5 backdrop-blur-md relative z-30 ${isLocked ? 'blur-md' : ''}`}>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
                        </div>
                        <h1 className="font-bold tracking-tight text-white/90">{assessment.title}</h1>
                    </div>
                    <div className="h-4 w-px bg-white/10" />
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded border border-indigo-500/10">Active Session</span>
                        {violations.length > 0 && (
                            <span className="text-[10px] uppercase font-bold tracking-widest text-red-400 bg-red-400/10 px-2 py-0.5 rounded border border-red-500/10">{violations.length} Violations</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right mr-2 hidden sm:block">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">Participant</p>
                        <p className="text-sm font-bold text-white/80">{user.name}</p>
                    </div>
                    <button
                        onClick={() => setShowSubmitModal(true)}
                        className="px-6 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all active:scale-95"
                    >
                        Finish & Submit
                    </button>
                </div>
            </header>

            {/* Main Area */}
            <div className={`flex flex-1 overflow-hidden transition-all duration-500 ${isLocked ? 'blur-md' : ''}`}>
                {/* Collapsible Question Sidebar */}
                <aside className={`bg-white/5 border-r border-white/5 relative z-20 flex flex-col transition-all duration-500 ${sidebarCollapsed ? 'w-16' : 'w-[280px]'}`}>
                    <div className="p-4 flex items-center justify-between border-b border-white/5">
                        {!sidebarCollapsed && <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Question Bank</span>}
                        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 transition-colors mx-auto">
                            <svg className={`w-4 h-4 transition-transform duration-500 ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-1">
                        {assessment.problems.map((p, idx) => (
                            <button
                                key={p._id}
                                onClick={() => setCurrentProblemIndex(idx)}
                                className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 ${idx === currentProblemIndex ? 'bg-indigo-500/10 text-indigo-400 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.2)]' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                            >
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${idx === currentProblemIndex ? 'bg-indigo-500 text-white' : 'bg-white/5 border border-white/10'}`}>
                                    {idx + 1}
                                </div>
                                {!sidebarCollapsed && <span className="font-semibold text-sm truncate">{p.title}</span>}
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Split Screen Panel */}
                <main className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-black/20">
                    {/* Left: Problem Statement */}
                    <section className={`flex flex-col border-r border-white/5 bg-white/1 overflow-hidden relative transition-all duration-500 ${descriptionCollapsed ? 'w-16' : 'lg:w-2/5'}`}>
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] to-transparent pointer-events-none" />
                        <div className={`p-4 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-sm z-10 ${descriptionCollapsed ? 'flex-col gap-4' : ''}`}>
                            {!descriptionCollapsed ? (
                                <>
                                    <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-400">Description</h2>
                                    <div className="flex items-center gap-4">
                                        <span className="text-[10px] font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/10 uppercase tracking-widest">
                                            Worth {currentProblem.totalMarks || 10} Points
                                        </span>
                                        <button onClick={() => setDescriptionCollapsed(true)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <button onClick={() => setDescriptionCollapsed(false)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 transition-colors mx-auto">
                                    <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                                </button>
                            )}
                        </div>
                        {!descriptionCollapsed && (
                            <div className="flex-1 overflow-y-auto p-10 relative z-10">
                                <h2 className="text-3xl font-bold mb-6 tracking-tight">{currentProblem.title}</h2>
                                <div className="prose prose-invert prose-indigo max-w-none text-gray-400 leading-relaxed space-y-4">
                                    <p className="text-lg whitespace-pre-wrap">{currentProblem.description}</p>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Right: Code Editor */}
                    <section className="flex-1 flex flex-col overflow-hidden">
                        <div className="h-12 flex items-center justify-between px-6 bg-white/5 border-b border-white/5 backdrop-blur-sm relative z-20">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Main.java</span>
                            </div>
                            <button
                                onClick={runCode}
                                className="px-5 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-all text-[11px] font-bold uppercase tracking-wider flex items-center gap-2"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Run Code
                            </button>
                        </div>

                        <div className="flex-1 relative group">
                            <Editor
                                height="100%"
                                defaultLanguage="java"
                                theme="vs-dark"
                                value={currentCode}
                                onChange={handleCodeChange}
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 16,
                                    lineNumbers: 'on',
                                    roundedSelection: true,
                                    scrollBeyondLastLine: false,
                                    readOnly: false,
                                    cursorStyle: 'line',
                                    automaticLayout: true,
                                    padding: { top: 20 }
                                }}
                            />
                        </div>

                        {/* Terminal Style Console */}
                        <div className="h-56 bg-white/[0.02] border-t border-white/10 flex flex-col relative">
                            <div className="px-6 h-10 flex items-center justify-between border-b border-white/5 bg-white/5">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    Terminal Output
                                </span>
                                <button onClick={() => setOutput('')} className="text-[10px] font-bold text-gray-600 hover:text-gray-400 uppercase transition-colors">Clear</button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 font-mono text-sm leading-relaxed text-indigo-300/80 bg-black/30">
                                {output ? (
                                    <pre className="whitespace-pre-wrap animate-in fade-in duration-300">{output}</pre>
                                ) : (
                                    <span className="text-gray-700 italic">No output. Run your code to see results here...</span>
                                )}
                            </div>
                        </div>
                    </section>
                </main>
            </div>

            {/* Submit Confirmation Modal */}
            {showSubmitModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[hsl(var(--bg))]/80 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="glass-card max-w-lg w-full p-10 rounded-[40px] border-white/10 text-center shadow-2xl animate-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mx-auto mb-8 border border-indigo-500/20">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h2 className="text-3xl font-bold mb-4">Complete Assessment?</h2>
                        <p className="text-gray-400 mb-10 leading-relaxed font-medium">You are about to finalize your submission. Once confirmed, you will no longer be able to modify your code.</p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => setShowSubmitModal(false)}
                                className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 font-bold transition-all border border-white/5"
                                disabled={isSubmitting}
                            >
                                Back to Editor
                            </button>
                            <button
                                onClick={confirmSubmit}
                                disabled={isSubmitting}
                                className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>Finalize & Submit</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssessmentRunner;
