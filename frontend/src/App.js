import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import TraineeDashboard from './pages/TraineeDashboard';
import AssessmentRunner from './pages/AssessmentRunner';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/dashboard" element={<TraineeDashboard />} />
          <Route path="/assessment/:id" element={<AssessmentRunner />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
