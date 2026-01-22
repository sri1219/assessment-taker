import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    // User Creation State
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'trainee' });

    // Problem Creation State
    const [problem, setProblem] = useState({ title: '', description: '', starterCode: '', testCases: [], totalMarks: 10 });
    const [testCase, setTestCase] = useState({ input: '', expectedOutput: '' });

    // Assessment Creation State
    const [assessTitle, setAssessTitle] = useState('');
    const [assessDuration, setAssessDuration] = useState(60);
    const [selectedProblems, setSelectedProblems] = useState([]);
    const [allProblems, setAllProblems] = useState([]);
    const [users, setUsers] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [editingAssessment, setEditingAssessment] = useState(null); // Track editing state
    const [editingProblem, setEditingProblem] = useState(null); // Track editing state

    // Review Modal State
    const [viewSubmission, setViewSubmission] = useState(null); // The submission object to view
    const [selectedUserForProgress, setSelectedUserForProgress] = useState(null);
    const [submissionDetails, setSubmissionDetails] = useState(null);

    // Sorting & Filtering State
    const [submissionSort, setSubmissionSort] = useState({ key: 'submittedAt', direction: 'desc' });
    const [submissionFilters, setSubmissionFilters] = useState({ user: '', assessment: '', date: '' });
    const [activeTab, setActiveTab] = useState('overview'); // Navigation state: 'overview', 'problems', 'assessments', 'users'

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        await Promise.all([loadProblems(), loadUsers(), loadAssessments(), loadSubmissions()]);
    };

    const loadUsers = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/users`);
            setUsers(res.data);
        } catch (e) {
            console.error('Failed using loadUsers', e);
        }
    };

    const loadAssessments = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/assessments`);
            setAssessments(res.data);
        } catch (e) { console.error('Failed loadAssessments', e); }
    };

    const loadSubmissions = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/submissions`);
            setSubmissions(res.data);
        } catch (e) { console.error('Failed loadSubmissions', e); }
    };

    const resetSubmission = async (submissionId) => {
        try {
            await axios.post(`${API_BASE_URL}/submissions/${submissionId}/delete`);
            loadSubmissions();
            alert('Status Reset');
        } catch (e) {
            alert('Failed to reset');
        }
    };



    const loadProblems = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/problems`);
            setAllProblems(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE_URL}/auth/register`, newUser);
            alert('User Created');
            setNewUser({ name: '', email: '', password: '', role: 'trainee' });
        } catch (e) {
            alert('Error creating user');
        }
    };

    const handleSaveProblem = async (e) => {
        e.preventDefault();
        if (!problem.description || !problem.description.trim()) {
            alert('Description field is mandatory');
            return;
        }
        try {
            if (editingProblem) {
                await axios.put(`${API_BASE_URL}/problems/${editingProblem._id}`, problem);
                alert('Problem Updated');
                setEditingProblem(null);
            } else {
                await axios.post(`${API_BASE_URL}/problems`, problem);
                alert('Problem Created');
            }
            setProblem({ title: '', description: '', starterCode: '', testCases: [], totalMarks: 10 });
            loadProblems();
        } catch (e) {
            console.error(e);
            alert('Error saving problem: ' + (e.response?.data?.error || e.message));
        }
    };

    const startEditProblem = (p) => {
        setEditingProblem(p);
        setProblem({
            title: p.title,
            description: p.description,
            starterCode: p.starterCode,
            testCases: p.testCases,
            totalMarks: p.totalMarks || 10
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEditProblem = () => {
        setEditingProblem(null);
        setProblem({ title: '', description: '', starterCode: '', testCases: [], totalMarks: 10 });
    };

    const handleDeleteProblem = async (id) => {
        if (!window.confirm('Are you sure? This problem will be removed from future assessments.')) return;
        try {
            await axios.delete(`${API_BASE_URL}/problems/${id}`);
            alert('Problem Deleted');
            loadProblems(); // Refresh problems list
            loadAssessments(); // Refresh assessments count
        } catch (e) {
            alert('Error deleting problem: ' + (e.response?.data?.error || e.message));
        }
    };

    const addTestCase = () => {
        setProblem({ ...problem, testCases: [...problem.testCases, testCase] });
        setTestCase({ input: '', expectedOutput: '' });
    };

    const handleCreateAssessment = async () => {
        try {
            if (editingAssessment) {
                // UPDATE Mode
                await axios.put(`${API_BASE_URL}/assessments/${editingAssessment._id}`, {
                    title: assessTitle,
                    problems: selectedProblems,
                    duration: assessDuration
                });
                alert('Assessment Updated');
                setEditingAssessment(null);
            } else {
                // CREATE Mode
                await axios.post(`${API_BASE_URL}/assessments`, {
                    title: assessTitle,
                    problems: selectedProblems,
                    duration: assessDuration
                });
                alert('Assessment Created');
            }
            setAssessTitle('');
            setAssessDuration(60);
            setSelectedProblems([]);
            loadAssessments(); // Refresh list
        } catch (e) {
            console.error('Assessment Save Error:', e);
            alert('Error saving assessment: ' + (e.response?.data?.error || e.message));
        }
    };

    const handleDeleteAssessment = async (id) => {
        if (!window.confirm('Are you sure you want to delete this assessment?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/assessments/${id}`);
            alert('Assessment Deleted');
            loadAssessments();
        } catch (e) {
            alert('Error deleting assessment');
        }
    };

    const startEditAssessment = (assess) => {
        console.log('Editing assessment:', assess);
        setEditingAssessment(assess);
        setAssessTitle(assess.title);
        setAssessDuration(assess.duration || 60);
        // Safely handle potential missing problems array
        const problemIds = (assess.problems || []).map(p => p._id || p);
        setSelectedProblems(problemIds);

        // Scroll to the form so the user sees the change
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingAssessment(null);
        setAssessTitle('');
        setAssessDuration(60);
        setSelectedProblems([]);
    };

    const [grades, setGrades] = useState({});

    const handleViewSubmission = (sub) => {
        setSubmissionDetails(sub);
        setViewSubmission(true);
        // Initialize grades state
        const initialGrades = {};
        sub.answers.forEach(a => {
            const pid = a.problem._id || a.problem;
            initialGrades[pid] = a.manualScore || 0;
        });
        setGrades(initialGrades);
    };

    const handleGradeChange = (problemId, score) => {
        setGrades(prev => ({
            ...prev,
            [problemId]: score
        }));
    };

    const saveGrades = async () => {
        try {
            const updates = Object.keys(grades).map(pid => ({
                problemId: pid,
                score: grades[pid]
            }));

            await axios.put(`${API_BASE_URL}/submissions/${submissionDetails._id}/grade`, { answers: updates });
            alert('Grades saved successfully!');
            setViewSubmission(false);
            loadSubmissions(); // Refresh to see new score
        } catch (e) {
            alert('Error saving grades: ' + e.message);
        }
    };

    const handleAdminCompile = async (idx, code) => {
        // Optimistic UI update
        const updatedAnswers = [...submissionDetails.answers];
        updatedAnswers[idx] = { ...updatedAnswers[idx], compileOutput: 'Compiling...', isCompiled: undefined };
        setSubmissionDetails({ ...submissionDetails, answers: updatedAnswers });

        try {
            const res = await axios.post(`${API_BASE_URL}/execute/run`, { code, input: '' });

            const isSuccess = !res.data.error;
            const output = res.data.error
                ? `Compilation/Runtime Error:\n${res.data.error}`
                : (res.data.output || 'Compiled Successfully');

            updatedAnswers[idx] = {
                ...updatedAnswers[idx],
                compileOutput: output,
                isCompiled: isSuccess
            };
            setSubmissionDetails({ ...submissionDetails, answers: updatedAnswers });

        } catch (e) {
            updatedAnswers[idx] = {
                ...updatedAnswers[idx],
                compileOutput: 'System Error: ' + e.message,
                isCompiled: false
            };
            setSubmissionDetails({ ...submissionDetails, answers: updatedAnswers });
        }
    };

    const handleResetStatus = async (subId) => {
        if (!window.confirm('Are you sure you want to reset this status? This will permanently delete the submission and allowed the trainee to retake it.')) return;
        try {
            await axios.post(`${API_BASE_URL}/submissions/${subId}/delete`);
            loadSubmissions();
        } catch (e) {
            alert('Failed to reset status: ' + e.message);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? All their submissions will also be permanently removed.')) return;
        try {
            await axios.delete(`${API_BASE_URL}/users/${userId}`);
            loadUsers();
            loadSubmissions();
            alert('User deleted successfully');
        } catch (e) {
            alert('Failed to delete user: ' + (e.response?.data?.error || e.message));
        }
    };

    const handleSortSubmissions = (key) => {
        setSubmissionSort(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const handleFilterChange = (key, value) => {
        setSubmissionFilters(prev => ({ ...prev, [key]: value }));
    };

    const filteredAndSortedSubmissions = [...submissions]
        .filter(s => s.assessment) // Hide submissions from deleted assessments
        .filter(s => {
            const traineeMatch = (s.user?.name || '').toLowerCase().includes(submissionFilters.user.toLowerCase());
            const assessmentMatch = (s.assessment?.title || '').toLowerCase().includes(submissionFilters.assessment.toLowerCase());
            const dateMatch = s.submittedAt ? new Date(s.submittedAt).toLocaleDateString().includes(submissionFilters.date) : (submissionFilters.date === '' || 'N/A'.includes(submissionFilters.date));
            return traineeMatch && assessmentMatch && dateMatch;
        })
        .sort((a, b) => {
            let valA, valB;
            if (submissionSort.key === 'user') {
                valA = a.user?.name || '';
                valB = b.user?.name || '';
            } else if (submissionSort.key === 'assessment') {
                valA = a.assessment?.title || '';
                valB = b.assessment?.title || '';
            } else if (submissionSort.key === 'finalScore') {
                valA = a.finalScore || 0;
                valB = b.finalScore || 0;
            } else if (submissionSort.key === 'submittedAt') {
                valA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
                valB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
            } else {
                valA = a[submissionSort.key];
                valB = b[submissionSort.key];
            }

            if (valA < valB) return submissionSort.direction === 'asc' ? -1 : 1;
            if (valA > valB) return submissionSort.direction === 'asc' ? 1 : -1;
            return 0;
        });

    // --- ROLE GUARD ---
    useEffect(() => {
        if (user && user.role !== 'admin') {
            navigate('/dashboard'); // Kick non-admins to trainee dashboard
        }
    }, [user, navigate]);

    if (!user) return <div className="min-h-screen flex items-center justify-center text-white bg-[hsl(var(--bg))]">
        <div className="animate-pulse text-indigo-400 font-medium">Loading Dashboard...</div>
    </div>;

    return (
        <div className="min-h-screen bg-[hsl(var(--bg))] flex text-white overflow-hidden">
            {/* Background Decor */}
            <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            {/* Sidebar */}
            <aside className="w-72 glass-card border-r border-white/5 flex flex-col relative z-20">
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-accent flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold tracking-tight">Planit Assessments</span>
                    </div>

                    <nav className="space-y-2">
                        {[
                            { id: 'overview', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                            { id: 'problems', label: 'Problems', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
                            { id: 'assessments', label: 'Assessments', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
                            { id: 'users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' }
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${activeTab === item.id ? 'bg-indigo-500/10 text-indigo-400 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.2)]' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                            >
                                <svg className={`w-5 h-5 transition-colors ${activeTab === item.id ? 'text-indigo-400' : 'text-gray-500 group-hover:text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                                </svg>
                                <span className="font-medium">{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="mt-auto p-6 border-t border-white/5">
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/20">
                            <span className="text-indigo-400 font-bold">{user?.name?.charAt(0)}</span>
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold truncate">{user?.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { logout(); navigate('/login'); }}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all duration-300 font-medium"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative z-10 px-10 py-8">
                {/* Header */}
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight mb-2">
                            {activeTab === 'overview' && 'Dashboard Overview'}
                            {activeTab === 'problems' && 'Problem Bank'}
                            {activeTab === 'assessments' && 'Assessments'}
                            {activeTab === 'users' && 'User Management'}
                        </h1>
                        <p className="text-gray-500 font-medium">Manage and monitor training performance</p>
                    </div>
                </header>

                {/* Tab Content */}
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {activeTab === 'overview' && (
                        <>
                            {/* Stats Cluster */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {[
                                    { label: 'Total Assessments', count: assessments.length, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: 'indigo' },
                                    { label: 'Submissions', count: filteredAndSortedSubmissions.length, icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z', color: 'pink' },
                                    { label: 'Active Learners', count: users.filter(u => u.role === 'trainee').length, icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', color: 'blue' },
                                    { label: 'Total Problems', count: allProblems.length, icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4', color: 'emerald' }
                                ].map((stat, i) => (
                                    <div key={i} className={`glass-card p-6 rounded-3xl group hover:border-white/20 transition-all duration-500`}>
                                        <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-500/10 flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-500 text-${stat.color}-400`}>
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
                                            </svg>
                                        </div>
                                        <p className="text-gray-500 text-sm font-semibold mb-1 uppercase tracking-wider">{stat.label}</p>
                                        <p className="text-3xl font-bold tracking-tight">{stat.count}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Recent Submissions Table */}
                            <div className="glass-card rounded-3xl overflow-hidden border border-white/5">
                                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                                    <h3 className="text-lg font-bold">Recent Submissions</h3>
                                    <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">Sort by clicking headers</span>
                                </div>
                                <div className="overflow-x-auto max-h-[500px]">
                                    <table className="w-full text-left">
                                        <thead className="sticky top-0 bg-[hsl(var(--surface))] z-10">
                                            <tr className="border-b border-white/5">
                                                <th className="p-5 text-gray-500 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:text-white transition-colors" onClick={() => handleSortSubmissions('user')}>Trainee ↕</th>
                                                <th className="p-5 text-gray-500 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:text-white transition-colors" onClick={() => handleSortSubmissions('assessment')}>Assessment ↕</th>
                                                <th className="p-5 text-gray-500 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:text-white transition-colors" onClick={() => handleSortSubmissions('finalScore')}>Final Score ↕</th>
                                                <th className="p-5 text-gray-500 font-semibold text-xs uppercase tracking-wider">Marks</th>
                                                <th className="p-5 text-gray-500 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:text-white transition-colors" onClick={() => handleSortSubmissions('submittedAt')}>Date ↕</th>
                                                <th className="p-5 text-gray-500 font-semibold text-xs uppercase tracking-wider text-right">Action</th>
                                            </tr>
                                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                                <td className="px-5 py-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Filter trainee..."
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-xs focus:outline-none focus:border-indigo-500/50 transition-colors text-white"
                                                        value={submissionFilters.user}
                                                        onChange={(e) => handleFilterChange('user', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-5 py-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Filter assessment..."
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-xs focus:outline-none focus:border-indigo-500/50 transition-colors text-white"
                                                        value={submissionFilters.assessment}
                                                        onChange={(e) => handleFilterChange('assessment', e.target.value)}
                                                    />
                                                </td>
                                                <td colSpan="2"></td>
                                                <td className="px-5 py-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Filter date..."
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-xs focus:outline-none focus:border-indigo-500/50 transition-colors text-white"
                                                        value={submissionFilters.date}
                                                        onChange={(e) => handleFilterChange('date', e.target.value)}
                                                    />
                                                </td>
                                                <td></td>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {filteredAndSortedSubmissions.map(s => (
                                                <tr key={s._id} className="group hover:bg-white/[0.02] transition-colors">
                                                    <td className="p-5 font-medium">{s.user?.name || 'Unknown'}</td>
                                                    <td className="p-5 text-gray-400 font-medium">{s.assessment?.title || 'Deleted'}</td>
                                                    <td className="p-5">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${s.finalScore >= 70 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : s.finalScore >= 40 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                            {s.finalScore}%
                                                        </span>
                                                    </td>
                                                    <td className="p-5 text-gray-500 font-mono text-xs">{s.totalManualScore}/{s.totalMaxScore}</td>
                                                    <td className="p-5 text-gray-500 text-xs font-medium">
                                                        {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : 'N/A'}
                                                    </td>
                                                    <td className="p-5 text-right">
                                                        <button
                                                            onClick={() => handleViewSubmission(s)}
                                                            className="px-4 py-2 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 text-white transition-all duration-300 text-xs font-bold border border-indigo-500/20"
                                                        >
                                                            Review
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'problems' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1 space-y-6">
                                <div className="glass-card p-8 rounded-3xl border border-white/5">
                                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                        {editingProblem ? 'Edit Problem' : 'Create New Problem'}
                                    </h2>
                                    <form onSubmit={handleSaveProblem} className="space-y-4">
                                        <input className="input-field" placeholder="Problem Title" value={problem.title} onChange={e => setProblem({ ...problem, title: e.target.value })} required />
                                        <textarea className="input-field min-h-[100px]" placeholder="Detailed Description" value={problem.description} onChange={e => setProblem({ ...problem, description: e.target.value })} required />
                                        <textarea className="input-field font-mono text-xs min-h-[150px]" placeholder="Starter Code" value={problem.starterCode} onChange={e => setProblem({ ...problem, starterCode: e.target.value })} required />
                                        <div>
                                            <label className="text-xs text-gray-500 font-bold mb-1 block ml-1">MAX MARKS</label>
                                            <input type="number" className="input-field text-center font-bold text-indigo-400" value={problem.totalMarks} onChange={e => setProblem({ ...problem, totalMarks: parseInt(e.target.value) })} required />
                                        </div>
                                        <div className="flex gap-3 pt-4">
                                            <button type="submit" className="glass-button flex-1 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20">
                                                {editingProblem ? 'Update' : 'Create'}
                                            </button>
                                            {editingProblem && (
                                                <button type="button" onClick={cancelEditProblem} className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors font-bold text-sm">
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </form>
                                </div>
                            </div>
                            <div className="lg:col-span-2">
                                <div className="glass-card rounded-3xl border border-white/5 overflow-hidden">
                                    <div className="p-6 bg-white/5 font-bold border-b border-white/5 flex justify-between">
                                        <span>Available Problems</span>
                                        <span className="text-indigo-400">{allProblems.length} Integrated</span>
                                    </div>
                                    <div className="p-2">
                                        {allProblems.map(p => (
                                            <div key={p._id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all group">
                                                <div>
                                                    <h4 className="font-bold mb-1 group-hover:text-indigo-400 transition-colors">{p.title}</h4>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">{p.totalMarks} Points</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => startEditProblem(p)} className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                    </button>
                                                    <button onClick={() => handleDeleteProblem(p._id)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v2M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'assessments' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1 space-y-6">
                                <div className="glass-card p-8 rounded-3xl border border-white/5">
                                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        {editingAssessment ? 'Edit Assessment' : 'New Assessment'}
                                    </h2>
                                    <div className="space-y-4">
                                        <input className="input-field" placeholder="Title (e.g., Weekly Challenge)" value={assessTitle} onChange={e => setAssessTitle(e.target.value)} />
                                        <div className="space-y-2 max-h-60 overflow-y-auto p-4 bg-black/20 rounded-2xl border border-white/5">
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">ESTIMATED DURATION (MINS)</p>
                                            <input type="number" className="input-field bg-transparent border-white/10" value={assessDuration} onChange={e => setAssessDuration(parseInt(e.target.value))} />
                                        </div>
                                        <div className="space-y-2 max-h-60 overflow-y-auto p-4 bg-black/20 rounded-2xl border border-white/5">
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Select Problems</p>
                                            {allProblems.map(p => (
                                                <label key={p._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedProblems.includes(p._id)}
                                                        onChange={e => {
                                                            if (e.target.checked) setSelectedProblems([...selectedProblems, p._id]);
                                                            else setSelectedProblems(selectedProblems.filter(id => id !== p._id));
                                                        }}
                                                        className="w-5 h-5 rounded-lg border-white/10 bg-white/5 text-indigo-500 focus:ring-indigo-500/20"
                                                    />
                                                    <span className="text-sm font-medium group-hover:text-white transition-colors">{p.title}</span>
                                                </label>
                                            ))}
                                        </div>
                                        <div className="flex gap-3 pt-4">
                                            <button onClick={handleCreateAssessment} className="glass-button flex-1 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20">
                                                {editingAssessment ? 'Update List' : 'Build Assessment'}
                                            </button>
                                            {editingAssessment && (
                                                <button onClick={cancelEdit} className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors font-bold text-sm">
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-2">
                                <div className="glass-card rounded-3xl border border-white/5 overflow-hidden">
                                    <div className="p-6 bg-white/5 font-bold border-b border-white/5 flex justify-between">
                                        <span>Active Assessments</span>
                                        <span className="text-emerald-400">{assessments.length} Running</span>
                                    </div>
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-white/5">
                                                <th className="p-5 text-gray-500 font-semibold text-xs uppercase">Title</th>
                                                <th className="p-5 text-gray-500 font-semibold text-xs uppercase">Problems</th>
                                                <th className="p-5 text-gray-500 font-semibold text-xs uppercase text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {assessments.map(a => (
                                                <tr key={a._id} className="group hover:bg-white/[0.02] transition-colors">
                                                    <td className="p-5 font-bold">{a.title}</td>
                                                    <td className="p-5 font-mono text-xs text-indigo-400">{(a.problems || []).length} modules</td>
                                                    <td className="p-5 text-right flex justify-end gap-2">
                                                        <button onClick={() => startEditAssessment(a)} className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                        </button>
                                                        <button onClick={() => handleDeleteAssessment(a._id)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v2M4 7h16" /></svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1">
                                <div className="glass-card p-8 rounded-3xl border border-white/5">
                                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        Onboard New User
                                    </h2>
                                    <form onSubmit={handleCreateUser} className="space-y-4">
                                        <input className="input-field" placeholder="Full Name" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} required />
                                        <input className="input-field" type="email" placeholder="Email Address" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required />
                                        <input className="input-field" type="password" placeholder="Temporary Password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required />
                                        <select className="input-field appearance-none bg-black/20" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                                            <option value="trainee">Trainee (Learner)</option>
                                            <option value="trainer">Trainer (Reviewer)</option>
                                            <option value="admin">Administrator</option>
                                        </select>
                                        <button type="submit" className="glass-button w-full py-4 rounded-xl font-bold shadow-lg shadow-indigo-500/20 mt-4">
                                            Register Account
                                        </button>
                                    </form>
                                </div>
                            </div>
                            <div className="lg:col-span-2">
                                <div className="glass-card rounded-3xl border border-white/5 overflow-hidden">
                                    <div className="p-6 bg-white/5 font-bold border-b border-white/5">Member Directory</div>
                                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {users.map(u => (
                                            <div key={u._id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4 hover:border-indigo-500/30 transition-all group">
                                                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center font-bold text-indigo-400">
                                                    {u.name.charAt(0)}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="font-bold truncate">{u.name}</p>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{u.role}</p>
                                                </div>
                                                <div className="ml-auto flex items-center gap-2">
                                                    <button
                                                        onClick={() => setSelectedUserForProgress(u)}
                                                        className="px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-widest border border-indigo-500/10 hover:bg-indigo-500 hover:text-white transition-all whitespace-nowrap"
                                                    >
                                                        View Progress
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(u._id)}
                                                        className="p-1.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/10 hover:bg-red-500 hover:text-white transition-all group-hover:opacity-100 opacity-0"
                                                        title="Delete User"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v2M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Submissions Review Modal */}
            {viewSubmission && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[hsl(var(--bg))]/80 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="glass-card w-full max-w-6xl h-[90vh] rounded-[40px] shadow-2xl flex flex-col relative overflow-hidden border border-white/10 animate-in zoom-in-95 duration-500">
                        {/* Modal Header */}
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center gap-2">
                                        Review Submission
                                        <span className={`text-xs px-3 py-1 rounded-full border ${submissionDetails.status === 'SUBMITTED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                            {submissionDetails.status}
                                        </span>
                                    </h2>
                                    <div className="flex items-center gap-4 mt-1 text-gray-500 text-sm font-medium">
                                        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> {submissionDetails.user?.name}</span>
                                        <span>•</span>
                                        <span>{new Date(submissionDetails.submittedAt).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setViewSubmission(false)} className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-10">
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                                {/* Left: Stats & Grading Summary */}
                                <div className="lg:col-span-1 space-y-8">
                                    <div className="glass-card p-6 rounded-3xl border border-white/5 bg-indigo-500/5">
                                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">Performance Score</p>
                                        <div className="text-center py-6">
                                            <div className="text-5xl font-bold text-indigo-400 mb-2">{submissionDetails.finalScore}%</div>
                                            <p className="text-sm text-gray-400 font-medium">Final Calculated Grade</p>
                                        </div>
                                        <div className="space-y-3 pt-6 border-t border-white/10">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Marks Obtained</span>
                                                <span className="font-bold text-white">{submissionDetails.totalManualScore || 0}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Max Possible</span>
                                                <span className="font-bold text-white">{submissionDetails.totalMaxScore || 0}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Violations</span>
                                                <span className="font-bold text-red-400">{submissionDetails.violationCount}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={saveGrades}
                                        className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                                        Finalize Grades
                                    </button>
                                </div>

                                {/* Right: Detailed Responses */}
                                <div className="lg:col-span-3 space-y-8">
                                    <h3 className="text-xl font-bold">Exercise Breakdown</h3>
                                    {submissionDetails.answers.map((ans, idx) => (
                                        <div key={idx} className="glass-card rounded-[32px] overflow-hidden border border-white/5">
                                            <div className="p-6 bg-white/5 flex justify-between items-center border-b border-white/5">
                                                <div>
                                                    <h4 className="text-lg font-bold mb-1">Q{idx + 1}: {ans.problem.title || 'Untitled Problem'}</h4>
                                                    <div className="flex gap-2">
                                                        {ans.isCompiled !== undefined && (
                                                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${ans.isCompiled ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                                {ans.isCompiled ? 'System: Compiled' : 'System: Failed'}
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-white/10 text-gray-500">
                                                            Worth {ans.problem.totalMarks || 10} Points
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleAdminCompile(idx, ans.code)}
                                                    className="px-4 py-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500 text-white transition-all text-xs font-bold border border-blue-500/20 flex items-center gap-2"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    Run Test
                                                </button>
                                            </div>

                                            <div className="p-8 space-y-6">
                                                <div className="space-y-3">
                                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Submitted Solution</p>
                                                    <div className="rounded-2xl bg-black/40 p-6 border border-white/5 font-mono text-sm leading-relaxed overflow-x-auto text-indigo-300">
                                                        <pre>{ans.code}</pre>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-3">
                                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Output Console</p>
                                                        <div className="rounded-2xl bg-black/40 p-4 border border-white/5 font-mono text-[11px] h-32 overflow-y-auto text-gray-400">
                                                            <pre className="whitespace-pre-wrap">{ans.compileOutput || 'No output recorded.'}</pre>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Manual Grading</p>
                                                        <div className="h-32 flex flex-col justify-center items-center bg-white/5 rounded-2xl border border-white/5 p-6 group hover:border-indigo-500/30 transition-all">
                                                            <div className="flex items-center gap-3">
                                                                <input
                                                                    type="number"
                                                                    className="bg-transparent text-white text-4xl font-bold w-24 text-center focus:outline-none focus:text-indigo-400"
                                                                    defaultValue={ans.manualScore || 0}
                                                                    onChange={(e) => handleGradeChange(ans.problem._id || ans.problem, e.target.value)}
                                                                />
                                                                <span className="text-2xl text-gray-600 font-bold">/ {ans.problem.totalMarks || 10}</span>
                                                            </div>
                                                            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-2 group-hover:text-indigo-500/50 transition-colors">Enter Marks Earned</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* User Progress Modal */}
            {selectedUserForProgress && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[hsl(var(--bg))]/80 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="glass-card w-full max-w-4xl rounded-[40px] shadow-2xl flex flex-col relative overflow-hidden border border-white/10 animate-in zoom-in-95 duration-500">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xl">
                                    {selectedUserForProgress.name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">{selectedUserForProgress.name} - Progress</h2>
                                    <p className="text-gray-500 text-sm font-medium">Monitoring individual performance across all assessments</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedUserForProgress(null)} className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto max-h-[60vh]">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="pb-4 text-gray-500 font-bold text-[10px] uppercase tracking-widest">Assessment</th>
                                        <th className="pb-4 text-gray-500 font-bold text-[10px] uppercase tracking-widest">Status</th>
                                        <th className="pb-4 text-gray-500 font-bold text-[10px] uppercase tracking-widest">Score</th>
                                        <th className="pb-4 text-gray-500 font-bold text-[10px] uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {assessments.map(a => {
                                        const sub = submissions.find(s => s.user?._id === selectedUserForProgress._id && s.assessment?._id === a._id);
                                        return (
                                            <tr key={a._id} className="group hover:bg-white/[0.02] transition-colors">
                                                <td className="py-4 font-bold">{a.title}</td>
                                                <td className="py-4">
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${sub ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-gray-500/10 text-gray-500 border-white/5'}`}>
                                                        {sub ? sub.status : 'NOT_STARTED'}
                                                    </span>
                                                </td>
                                                <td className="py-4">
                                                    {sub ? (
                                                        <span className={`font-bold ${sub.finalScore >= 70 ? 'text-emerald-400' : sub.finalScore >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                                                            {sub.finalScore}%
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-600 font-bold">—</span>
                                                    )}
                                                </td>
                                                <td className="py-4 text-right">
                                                    <div className="flex justify-end gap-3 items-center">
                                                        {sub && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleResetStatus(sub._id)}
                                                                    className="px-3 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest border border-red-500/10"
                                                                >
                                                                    Reset
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        handleViewSubmission(sub);
                                                                        setSelectedUserForProgress(null);
                                                                    }}
                                                                    className="text-indigo-400 hover:text-indigo-300 font-bold text-xs transition-colors"
                                                                >
                                                                    Go to Review
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
