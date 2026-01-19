import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const TraineeDashboard = () => {
    const [assessments, setAssessments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [assessRes, subRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/assessments`),
                    axios.get(`${API_BASE_URL}/submissions`) // In real app, filter by user
                ]);
                setAssessments(assessRes.data);
                // Filter submissions for current user
                if (user) {
                    const userId = user.id || user._id; // Handle both id formats
                    setSubmissions(subRes.data.filter(s => (s.user._id || s.user) === userId));
                }
            } catch (e) {
                console.error(e);
            }
        };
        if (user) fetchData();
    }, [user]);

    const getStatus = (assessmentId) => {
        const userId = user?.id || user?._id;
        const sub = submissions.find(s =>
            (s.assessment._id || s.assessment) === assessmentId &&
            (s.user._id || s.user) === userId
        );
        return sub ? sub.status : 'NOT_STARTED';
    };

    const startAssessment = async (id) => {
        const status = getStatus(id);
        if (status === 'SUBMITTED') {
            alert('You have already submitted this assessment.');
            return;
        }

        try {
            const userId = user.id || user._id;
            console.log('Starting assessment for user:', userId);
            await axios.post(`${API_BASE_URL}/assessments/${id}/start`, { userId }); // Send correct ID
            navigate(`/assessment/${id}`);
        } catch (e) {
            alert('Error starting assessment: ' + (e.response?.data?.error || e.message));
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Available Assessments</h1>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assessments.map(a => {
                    const status = getStatus(a._id);
                    return (
                        <div key={a._id} className="bg-gray-800 p-6 rounded-lg hover:shadow-xl transition shadow-lg border border-gray-700">
                            <h2 className="text-xl font-bold mb-2 text-blue-400">{a.title}</h2>
                            <p className="text-gray-400 mb-4">{a.description || 'No description provided.'}</p>
                            <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                                <span>{a.problems.length} Problems</span>
                                <span className={`px-2 py-1 rounded text-xs ${status === 'SUBMITTED' ? 'bg-green-900 text-green-300' : status === 'IN_PROGRESS' ? 'bg-yellow-900 text-yellow-300' : 'bg-gray-700'}`}>
                                    {status.replace('_', ' ')}
                                </span>
                            </div>
                            {status !== 'SUBMITTED' ? (
                                <button
                                    onClick={() => startAssessment(a._id)}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    {status === 'IN_PROGRESS' ? 'Resume Attempt' : 'Start Attempt'}
                                </button>
                            ) : (
                                <button disabled className="w-full bg-gray-600 text-gray-400 font-bold py-2 px-4 rounded cursor-not-allowed">
                                    Completed
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TraineeDashboard;
