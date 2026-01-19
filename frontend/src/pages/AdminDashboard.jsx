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
    const [problem, setProblem] = useState({ title: '', description: '', starterCode: '', testCases: [] });
    const [testCase, setTestCase] = useState({ input: '', expectedOutput: '' });

    // Assessment Creation State
    const [assessTitle, setAssessTitle] = useState('');
    const [selectedProblems, setSelectedProblems] = useState([]);
    const [allProblems, setAllProblems] = useState([]);
    const [users, setUsers] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [selectedUserForProgress, setSelectedUserForProgress] = useState(null);

    // Review Modal State
    const [viewSubmission, setViewSubmission] = useState(null); // The submission object to view
    const [submissionDetails, setSubmissionDetails] = useState(null);

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

    const handleViewSubmission = (submission) => {
        setSubmissionDetails(submission);
        setViewSubmission(true);
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

    const handleCreateProblem = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE_URL}/problems`, problem);
            alert('Problem Created');
            setProblem({ title: '', description: '', starterCode: '', testCases: [] });
            loadProblems();
        } catch (e) {
            console.error(e);
            alert('Error creating problem: ' + (e.response?.data?.error || e.message));
        }
    };

    const addTestCase = () => {
        setProblem({ ...problem, testCases: [...problem.testCases, testCase] });
        setTestCase({ input: '', expectedOutput: '' });
    };

    const handleCreateAssessment = async () => {
        try {
            await axios.post(`${API_BASE_URL}/assessments`, {
                title: assessTitle,
                problems: selectedProblems
            });
            alert('Assessment Created');
            setAssessTitle('');
            setSelectedProblems([]);
        } catch (e) {
            alert('Error creating assessment');
        }
    };

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

                {/* Create Assessment */}
                <div className="bg-gray-800 p-6 rounded shadow">
                    <h2 className="text-xl mb-4 text-green-400">Create Assessment</h2>
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
                    <button onClick={handleCreateAssessment} className="w-full bg-green-600 p-2 rounded">Create Assessment</button>
                </div>

                {/* Create Problem */}
                <div className="bg-gray-800 p-6 rounded shadow md:col-span-2">
                    <h2 className="text-xl mb-4 text-purple-400">Create Problem</h2>
                    <input className="w-full mb-2 p-2 bg-gray-700 rounded" placeholder="Title" value={problem.title} onChange={e => setProblem({ ...problem, title: e.target.value })} />
                    <textarea className="w-full mb-2 p-2 bg-gray-700 rounded" placeholder="Description" rows="3" value={problem.description} onChange={e => setProblem({ ...problem, description: e.target.value })} />
                    <textarea className="w-full mb-2 p-2 bg-gray-700 rounded font-mono" placeholder="Starter Code" rows="3" value={problem.starterCode} onChange={e => setProblem({ ...problem, starterCode: e.target.value })} />

                    <div className="bg-gray-700 p-4 rounded mb-4">
                        <h3 className="text-sm font-bold mb-2">Add Test Case</h3>
                        <div className="flex gap-2">
                            <input className="flex-1 p-2 bg-gray-600 rounded" placeholder="Input" value={testCase.input} onChange={e => setTestCase({ ...testCase, input: e.target.value })} />
                            <input className="flex-1 p-2 bg-gray-600 rounded" placeholder="Expected Output" value={testCase.expectedOutput} onChange={e => setTestCase({ ...testCase, expectedOutput: e.target.value })} />
                            <button onClick={addTestCase} type="button" className="bg-purple-600 px-4 rounded">Add</button>
                        </div>
                        <div className="mt-2 text-sm text-gray-300">
                            {problem.testCases.length} Test Cases Added
                        </div>
                    </div>

                    <button onClick={handleCreateProblem} className="w-full bg-purple-600 p-2 rounded">Create Problem</button>
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
            </div>

            {/* User Progress Modal */}
            {selectedUserForProgress && (
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
                                        const sub = submissions.find(s => s.user === selectedUserForProgress._id && s.assessment === assess._id);
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
            )}

            {/* View Submission Modal */}
            {viewSubmission && submissionDetails && (
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
                                <p><span className="text-gray-400">Score:</span> {submissionDetails.finalScore}%</p>
                                <p><span className="text-gray-400">Violations:</span> {submissionDetails.violationCount}</p>
                                <p><span className="text-gray-400">Submitted:</span> {new Date(submissionDetails.submittedAt).toLocaleString()}</p>
                            </div>
                            <div className="col-span-2 mt-4">
                                <h3 className="text-lg font-bold text-green-400 mb-2">Code Answers</h3>
                                {submissionDetails.answers.map((ans, idx) => (
                                    <div key={idx} className="mb-6 bg-black p-4 rounded border border-gray-700">
                                        <div className="text-sm text-gray-500 mb-2">Problem ID: {ans.problem}</div>
                                        <pre className="font-mono text-sm text-gray-300 overflow-x-auto">
                                            {ans.code}
                                        </pre>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
