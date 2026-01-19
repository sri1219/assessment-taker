# Java Training & Assessment Platform

A comprehensive full-stack web application designed for conducting secure, automated Java coding assessments. The platform features role-based access for Admins and Trainees, real-time Java code compilation/execution, and proctoring capabilities.

## 🚀 Features

### 👨‍💻 Trainee Dashboard
- **Assessment Listing**: View all assigned assessments.
- **Status Tracking**: Track progress (Not Started, In Progress, Submitted, Completed).
- **Code Editor**: Integrated Monaco Editor with syntax highlighting for Java.
- **Real-time Execution**: Compile and run Java code against test cases instantly.
- **Proctoring**:
    - **Strict Lockout**: Content blurs on window focus loss.
    - **Copy/Paste Prevention**: Blocks pasting (Ctrl+V) while allowing copying (Ctrl+C).
    - **Submission Guard**: Custom modals to prevent accidental submission.
- **Review**: View score and code violations after submission.

### 🛡️ Admin Dashboard
- **User Management**: Create internal users (Trainees, Trainers, Admins).
- **Assessment Management**: Create dynamic assessments with multiple coding problems.
- **Problem Bank**: Create reusable coding problems with descriptions, starter code, and test cases.
- **Progress Tracking**: View detailed progress of every user across all assessments.
- **Submission Review**:
    - View submitted code for every problem.
    - Check violation counts (tab switches, etc.).
    - Reset submissions to allow retakes.
    - Delete specific submissions.

### ⚙️ Technical Highlights
- **Backend**: Node.js, Express.js (Mock In-Memory DB for easy setup).
- **Frontend**: React.js, Tailwind CSS for modern, responsive UI.
- **Execution Sandbox**: Node.js `child_process` to spawn isolated Java processes.
- **Security**: JWT-based authentication (Mock) and Role-Based Access Control (RBAC).

## 🛠️ Setup & Installation

### Prerequisites
1.  **Node.js** (v14+)
2.  **Java JDK** (Must be installed and added to system PATH for code execution).

### 1. Clone the Repository
```bash
git clone https://github.com/sri1219/assessment-taker.git
cd assessment-taker
```

### 2. Backend Setup
The backend runs on port `5000`.
```bash
cd backend
npm install
node server_memory.js
```
*Note: We use `server_memory.js` for a simplified, zero-config setup using in-memory storage.*

### 3. Frontend Setup
The frontend runs on port `3000` (or `3005`/`3006` if busy).
```bash
cd frontend
npm install
npm start
```

## 🔑 Default Credentials

### Admin Login
- **Email**: `admin@example.com`
- **Password**: `admin`

### Trainee Login
- **Email**: `user@example.com`
- **Password**: `user`

## 🧪 Testing the Workflow
1.  Login as **Admin**.
2.  Create a strict **Assessment** with 1-2 Problems.
3.  Logout and Login as **Trainee**.
4.  Start the Assessment.
5.  Try to paste code (it will be blocked!) or switch tabs (violation recorded).
6.  Submit the assessment.
7.  Login back as **Admin** to review the submission code and reset if necessary.