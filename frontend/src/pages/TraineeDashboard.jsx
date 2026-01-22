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
                    axios.get(`${API_BASE_URL}/submissions`)
                ]);
                setAssessments(assessRes.data);
                if (user) {
                    const userId = user.id || user._id;
                    setSubmissions(subRes.data.filter(s => (s.user?._id || s.user) === userId));
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
            (s.assessment?._id || s.assessment) === assessmentId &&
            (s.user?._id || s.user) === userId
        );
        return sub ? sub.status : 'NOT_STARTED';
    };

    const startAssessment = async (id) => {
        const status = getStatus(id);
        if (status === 'SUBMITTED') return;

        try {
            // Attempt to go fullscreen before navigating
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.warn(`Error attempting to enable full-screen mode: ${err.message}`);
                });
            }

            const userId = user.id || user._id;
            await axios.post(`${API_BASE_URL}/assessments/${id}/start`, { userId });
            navigate(`/assessment/${id}`);
        } catch (e) {
            alert('Error starting assessment: ' + (e.response?.data?.error || e.message));
        }
    };

    if (!user) return <div className="min-h-screen flex items-center justify-center text-white bg-[hsl(var(--bg))]">
        <div className="animate-pulse text-indigo-400 font-medium">Authorizing...</div>
    </div>;



    return (
        <div className="min-h-screen bg-[hsl(var(--bg))] text-white overflow-x-hidden relative">
            {/* Background Decor */}
            <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-indigo-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-accent flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                            </div>
                            <h1 className="text-4xl font-bold tracking-tight">Trainee <span className="text-indigo-400">Hub</span></h1>
                        </div>
                        <p className="text-gray-500 font-medium">Welcome back, <span className="text-white">{user.name}</span>. Ready to sharpen your skills?</p>
                    </div>

                    <div className="flex items-center gap-6 bg-white/5 p-4 rounded-3xl border border-white/5 backdrop-blur-md">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-white">{user.email}</p>
                            <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest">Active Learner</p>
                        </div>
                        <button
                            onClick={() => { logout(); navigate('/login'); }}
                            className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 border border-red-500/10 flex items-center justify-center shadow-lg"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </button>
                    </div>
                </header>



                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                    <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                        <div className="w-2 h-8 rounded-full bg-indigo-500" />
                        Assessments
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {assessments.map((a, idx) => {
                            const status = getStatus(a._id);
                            return (
                                <div key={a._id} className="glass-card flex flex-col rounded-[40px] overflow-hidden group hover:border-white/20 transition-all duration-500 animate-in fade-in zoom-in-95" style={{ animationDelay: `${idx * 100}ms` }}>
                                    <div className="p-8 pb-4 flex-1">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.638.319a4 4 0 01-2.573.345l-2.387-.477a2 2 0 00-1.022.547l-1.162 1.162a1 1 0 00.707 1.707h13.142a1 1 0 00.707-1.707l-1.162-1.162z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </div>
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${status === 'SUBMITTED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-white/5 text-gray-500 border-white/10'}`}>
                                                {status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold mb-3 group-hover:text-indigo-400 transition-colors">{a.title}</h3>
                                        <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-2">{a.description || 'Complete this Assessment by completing all integrated programming challenges.'}</p>

                                        <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest bg-white/5 p-3 rounded-2xl border border-white/5">
                                            <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> {(a.problems || []).length} Modules</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1 text-indigo-400"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> {a.duration || 60}m Est.</span>
                                        </div>
                                    </div>
                                    <div className="p-8 pt-4">
                                        {status !== 'SUBMITTED' ? (
                                            <button
                                                onClick={() => startAssessment(a._id)}
                                                className="glass-button w-full py-4 rounded-2xl font-bold shadow-lg shadow-indigo-500/20 text-sm tracking-wide group"
                                            >
                                                {status === 'IN_PROGRESS' ? 'Resume Journey' : 'Begin Assessment'}
                                                <svg className="w-4 h-4 ml-2 inline-block transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                            </button>
                                        ) : (
                                            <button disabled className="w-full py-4 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-sm tracking-wide flex items-center justify-center gap-2 cursor-not-allowed">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                                Path Completed
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TraineeDashboard;
