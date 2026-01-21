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
    const [selectedProblems, setSelectedProblems] = useState([]);
    const [allProblems, setAllProblems] = useState([]);
    const [users, setUsers] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [selectedUserForProgress, setSelectedUserForProgress] = useState(null);
    const [editingAssessment, setEditingAssessment] = useState(null); // Track editing state
    const [editingProblem, setEditingProblem] = useState(null); // Track editing state

    // Review Modal State
    const [viewSubmission, setViewSubmission] = useState(null); // The submission object to view
    const [submissionDetails, setSubmissionDetails] = useState(null);

    // Sorting State
    const [submissionSort, setSubmissionSort] = useState({ key: 'submittedAt', direction: 'desc' });

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
                    problems: selectedProblems
                });
                alert('Assessment Updated');
                setEditingAssessment(null);
            } else {
                // CREATE Mode
                await axios.post(`${API_BASE_URL}/assessments`, {
                    title: assessTitle,
                    problems: selectedProblems
                });
                alert('Assessment Created');
            }
            setAssessTitle('');
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
        // Safely handle potential missing problems array
        const problemIds = (assess.problems || []).map(p => p._id || p);
        setSelectedProblems(problemIds);

        // Scroll to the form so the user sees the change
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingAssessment(null);
        setAssessTitle('');
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

    const handleSortSubmissions = (key) => {
        setSubmissionSort(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const sortedSubmissions = [...submissions]
        .filter(s => s.assessment) // Hide submissions from deleted assessments
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

    if (!user) return <div className="p-8 text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <div className="flex items-center gap-4">
                    <span className="text-gray-300">Welcome, <span className="text-white font-bold">{user?.name}</span></span>
                    <button
                        onClick={() => { logout(); navigate('/login'); }}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Create User */}
                <div className="bg-gray-800 p-6 rounded shadow">
                    <h2 className="text-xl mb-4 text-blue-400">Create User</h2>
                    <form onSubmit={handleCreateUser}>
                        <input className="w-full mb-2 p-2 bg-gray-700 rounded" placeholder="Name" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} required />
                        <input className="w-full mb-2 p-2 bg-gray-700 rounded" type="email" placeholder="Email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required />
                        <input className="w-full mb-2 p-2 bg-gray-700 rounded" type="text" placeholder="Password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required />
                        <select className="w-full mb-4 p-2 bg-gray-700 rounded" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                            <option value="trainee">Trainee</option>
                            <option value="trainer">Trainer</option>
                            <option value="admin">Admin</option>
                        </select>
                        <button type="submit" className="w-full bg-blue-600 p-2 rounded">Create User</button>
                    </form>
                </div>

                {/* Create/Edit Assessment */}
                <div className="bg-gray-800 p-6 rounded shadow">
                    <h2 className="text-xl mb-4 text-green-400">{editingAssessment ? 'Edit Assessment' : 'Create Assessment'}</h2>
                    <input className="w-full mb-4 p-2 bg-gray-700 rounded" placeholder="Assessment Title" value={assessTitle} onChange={e => setAssessTitle(e.target.value)} />
                    <div className="mb-4 max-h-40 overflow-y-auto">
                        {allProblems.map(p => (
                            <div key={p._id} className="flex items-center mb-2">
                                <input
                                    type="checkbox"
                                    checked={selectedProblems.includes(p._id)}
                                    onChange={e => {
                                        if (e.target.checked) setSelectedProblems([...selectedProblems, p._id]);
                                        else setSelectedProblems(selectedProblems.filter(id => id !== p._id));
                                    }}
                                    className="mr-2"
                                />
                                <span>{p.title}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleCreateAssessment} className="flex-1 bg-green-600 p-2 rounded">
                            {editingAssessment ? 'Update Assessment' : 'Create Assessment'}
                        </button>
                        {editingAssessment && (
                            <button onClick={cancelEdit} className="bg-gray-600 px-4 rounded">Cancel</button>
                        )}
                    </div>
                </div>

                {/* Create Problem */}
                <div className="bg-gray-800 p-6 rounded shadow md:col-span-2">
                    <div className="grid grid-cols-2 gap-4 mb-2">
                        <input className="p-2 bg-gray-700 rounded" placeholder="Title" value={problem.title} onChange={e => setProblem({ ...problem, title: e.target.value })} required />
                        <input
                            className="p-2 bg-gray-700 rounded"
                            type="number"
                            placeholder="Total Marks"
                            value={problem.totalMarks}
                            onChange={e => setProblem({ ...problem, totalMarks: parseInt(e.target.value) || 0 })}
                            required
                        />
                    </div>
                    <textarea className="w-full mb-2 p-2 bg-gray-700 rounded" placeholder="Description" rows="3" value={problem.description} onChange={e => setProblem({ ...problem, description: e.target.value })} required />
                    <textarea className="w-full mb-2 p-2 bg-gray-700 rounded font-mono" placeholder="Starter Code" rows="3" value={problem.starterCode} onChange={e => setProblem({ ...problem, starterCode: e.target.value })} />

                    <div className="flex gap-2">
                        <button onClick={handleSaveProblem} className="flex-1 bg-purple-600 p-2 rounded">
                            {editingProblem ? 'Update Problem' : 'Create Problem'}
                        </button>
                        {editingProblem && (
                            <button onClick={cancelEditProblem} className="bg-gray-600 px-4 rounded">Cancel</button>
                        )}
                    </div>
                </div>

                {/* Manage Problems List */}
                <div className="bg-gray-800 p-6 rounded shadow md:col-span-2">
                    <h2 className="text-xl mb-4 text-purple-400">Manage Problems</h2>
                    <div className="max-h-60 overflow-y-auto border border-gray-700 rounded p-2">
                        {allProblems.length === 0 ? (
                            <p className="text-gray-500 text-center">No problems found.</p>
                        ) : (
                            <table className="w-full text-left text-sm text-gray-400">
                                <thead>
                                    <tr className="border-b border-gray-700 sticky top-0 bg-gray-800">
                                        <th className="p-2">Title</th>
                                        <th className="p-2">Total Marks</th>
                                        <th className="p-2 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allProblems.map(p => (
                                        <tr key={p._id} className="border-b border-gray-700 hover:bg-gray-700">
                                            <td className="p-2">{p.title}</td>
                                            <td className="p-2 font-bold text-purple-400">{p.totalMarks || 10}</td>
                                            <td className="p-2 text-right space-x-2">
                                                <button
                                                    onClick={() => startEditProblem(p)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProblem(p._id)}
                                                    className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Assessment Management Table */}
            <div className="bg-gray-800 p-6 rounded shadow md:col-span-2">
                <h2 className="text-xl mb-4 text-green-400">Assessment Management</h2>
                <table className="w-full text-left text-sm text-gray-400">
                    <thead>
                        <tr className="border-b border-gray-700">
                            <th className="p-2">Title</th>
                            <th className="p-2">Problems Count</th>
                            <th className="p-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assessments.map(a => (
                            <tr key={a._id} className="border-b border-gray-800">
                                <td className="p-2">{a.title}</td>
                                <td className="p-2">{a.problems ? a.problems.length : 0}</td>
                                <td className="p-2 space-x-2">
                                    <button
                                        onClick={() => startEditAssessment(a)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteAssessment(a._id)}
                                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Dashboard Submissions Overview */}
            <div className="bg-gray-800 p-6 rounded shadow md:col-span-2">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl text-pink-400 font-bold">Total Submissions: {sortedSubmissions.length}</h2>
                    <div className="text-xs text-gray-400">Sort by clicking column headers</div>
                </div>
                <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="sticky top-0 bg-gray-800">
                            <tr className="border-b border-gray-700">
                                <th className="p-2 cursor-pointer hover:text-white" onClick={() => handleSortSubmissions('user')}>Trainee ↕</th>
                                <th className="p-2 cursor-pointer hover:text-white" onClick={() => handleSortSubmissions('assessment')}>Assessment ↕</th>
                                <th className="p-2 cursor-pointer hover:text-white" onClick={() => handleSortSubmissions('finalScore')}>Final Score % ↕</th>
                                <th className="p-2">Marks</th>
                                <th className="p-2 cursor-pointer hover:text-white" onClick={() => handleSortSubmissions('submittedAt')}>Date ↕</th>
                                <th className="p-2">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedSubmissions.map(s => (
                                <tr key={s._id} className="border-b border-gray-800 hover:bg-gray-700">
                                    <td className="p-2 text-white">{s.user?.name || 'Unknown'}</td>
                                    <td className="p-2">{s.assessment?.title || 'Deleted'}</td>
                                    <td className="p-2">
                                        <span className={`font-bold ${s.finalScore >= 70 ? 'text-green-400' : s.finalScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                                            {s.finalScore}%
                                        </span>
                                    </td>
                                    <td className="p-2 text-xs text-gray-500">{s.totalManualScore}/{s.totalMaxScore}</td>
                                    <td className="p-2">{s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : 'N/A'}</td>
                                    <td className="p-2">
                                        <button
                                            onClick={() => handleViewSubmission(s)}
                                            className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs"
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

            {/* User Management */}
            <div className="bg-gray-800 p-6 rounded shadow md:col-span-2">
                <h2 className="text-xl mb-4 text-yellow-400">User Management</h2>
                <table className="w-full text-left text-sm text-gray-400">
                    <thead>
                        <tr className="border-b border-gray-700">
                            <th className="p-2">Name</th>
                            <th className="p-2">Email</th>
                            <th className="p-2">Role</th>
                            <th className="p-2">Assessments</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u._id} className="border-b border-gray-800">
                                <td className="p-2">{u.name}</td>
                                <td className="p-2">{u.email}</td>
                                <td className="p-2">{u.role}</td>
                                <td className="p-2">
                                    <button
                                        onClick={() => setSelectedUserForProgress(u)}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs"
                                    >
                                        View Progress
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button onClick={loadData} className="mt-4 text-sm text-blue-400 underline">Refresh Data</button>
            </div>


            {/* User Progress Modal */}
            {
                selectedUserForProgress && (
                    <div className="fixed inset-0 z-40 bg-black bg-opacity-90 flex items-center justify-center p-8">
                        <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col">
                            <div className="flex justify-between items-center p-4 border-b border-gray-700">
                                <h2 className="text-xl font-bold text-white">{selectedUserForProgress.name} - Assessment Progress</h2>
                                <button onClick={() => setSelectedUserForProgress(null)} className="text-gray-400 hover:text-white text-2xl">×</button>
                            </div>
                            <div className="p-6 overflow-y-auto">
                                <table className="w-full text-left text-sm text-gray-400">
                                    <thead>
                                        <tr className="border-b border-gray-700">
                                            <th className="p-2">Assessment</th>
                                            <th className="p-2">Status</th>
                                            <th className="p-2">Score</th>
                                            <th className="p-2">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {assessments.map(assess => {
                                            // Find submission for this user and assessment
                                            const sub = submissions.find(s => (s.user?._id || s.user) === selectedUserForProgress._id && (s.assessment?._id || s.assessment) === assess._id);
                                            const status = sub ? sub.status : 'NOT_STARTED';

                                            return (
                                                <tr key={assess._id} className="border-b border-gray-700">
                                                    <td className="p-2 text-white font-bold">{assess.title}</td>
                                                    <td className="p-2">
                                                        <span className={`px-2 py-1 rounded text-xs ${status === 'SUBMITTED' ? 'bg-green-900 text-green-300' : 'bg-gray-700'}`}>
                                                            {status}
                                                        </span>
                                                    </td>
                                                    <td className="p-2">{sub ? sub.finalScore + '%' : '-'}</td>
                                                    <td className="p-2 space-x-2">
                                                        {status === 'SUBMITTED' && sub && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleViewSubmission(sub)}
                                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                                                                >
                                                                    View Code
                                                                </button>
                                                                <button
                                                                    onClick={() => resetSubmission(sub._id)}
                                                                    className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                                                                >
                                                                    Reset
                                                                </button>
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* View Submission Modal */}
            {
                viewSubmission && submissionDetails && (
                    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-8">
                        <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col">
                            <div className="flex justify-between items-center p-4 border-b border-gray-700">
                                <h2 className="text-xl font-bold text-white">Submission Review</h2>
                                <button onClick={() => setViewSubmission(false)} className="text-gray-400 hover:text-white text-2xl">×</button>
                            </div>
                            <div className="flex-grow overflow-y-auto p-6 md:grid md:grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-blue-400 mb-2">Details</h3>
                                    <p><span className="text-gray-400">Status:</span> {submissionDetails.status}</p>
                                    <p className="text-xl mt-2 font-bold mb-1">
                                        <span className="text-gray-300">Final Score:</span>
                                        <span className="text-green-400 ml-2">{submissionDetails.finalScore}%</span>
                                    </p>
                                    <div className="bg-gray-700 p-2 rounded border border-gray-600 inline-block">
                                        <p className="text-sm"><span className="text-gray-400">Marks Obtained:</span> <span className="text-white font-bold">{submissionDetails.totalManualScore || 0}</span></p>
                                        <p className="text-sm"><span className="text-gray-400">Max Possible:</span> <span className="text-white font-bold">{submissionDetails.totalMaxScore || 0}</span></p>
                                    </div>
                                    <p className="mt-2 text-sm"><span className="text-gray-400">Violations:</span> {submissionDetails.violationCount}</p>
                                    <p className="text-sm"><span className="text-gray-400">Submitted:</span> {new Date(submissionDetails.submittedAt).toLocaleString()}</p>
                                </div>
                                <div className="col-span-2 mt-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold text-green-400">Code Answers & Grading</h3>
                                        <button
                                            onClick={saveGrades}
                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold"
                                        >
                                            Save Grades & Calculate Final Score
                                        </button>
                                    </div>
                                    {submissionDetails.answers.map((ans, idx) => (
                                        <div key={idx} className="mb-6 bg-gray-900 p-4 rounded border border-gray-700">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="text-md font-bold text-white mb-1">
                                                        Q{idx + 1}: {ans.problem.title || ans.problem || 'Unknown Problem'}
                                                    </h4>
                                                    {ans.isCompiled !== undefined && (
                                                        <span className={`text-xs px-2 py-1 rounded ${ans.isCompiled ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                                                            {ans.isCompiled ? 'Verified: Compiled' : 'Verified: Failed'}
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleAdminCompile(idx, ans.code)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded font-bold"
                                                >
                                                    Run Compile Check
                                                </button>
                                            </div>

                                            <pre className="font-mono text-sm text-gray-300 bg-black p-3 rounded mb-3 overflow-x-auto border border-gray-800">
                                                {ans.code}
                                            </pre>

                                            <div className="mb-3">
                                                <h5 className="text-sm font-bold text-gray-400 mb-1">Compilation Output:</h5>
                                                <pre className="text-xs text-gray-500 bg-gray-950 p-2 rounded whitespace-pre-wrap">
                                                    {ans.compileOutput || 'Not checked yet. Click "Run Compile Check".'}
                                                </pre>
                                            </div>

                                            <div className="flex items-center gap-4 bg-gray-800 p-3 rounded">
                                                <label className="text-sm text-gray-300 font-bold">Manual Score:</label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-1 w-24 text-center font-bold"
                                                        defaultValue={ans.manualScore || 0}
                                                        onChange={(e) => handleGradeChange(ans.problem._id || ans.problem, e.target.value)}
                                                    />
                                                    <span className="text-gray-400 font-bold">/ {ans.problem.totalMarks || 10}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default AdminDashboard;
