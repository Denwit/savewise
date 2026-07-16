import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreatePlan from './pages/CreatePlan';
import Plans from './pages/Plans';
import PlanDetail from './pages/PlanDetail';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Withdrawals from './pages/Withdrawals';
import EditPlan from './pages/EditPlan';
import Deposits from './pages/Deposits';
import Invitations from './pages/Invitations';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import ContactUs from './pages/ContactUs';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import InvitationAccept from './pages/InvitationAccept';

// Components
import Layout from './components/Layout';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/invitation/accept/:token" element={<InvitationAccept />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />

          

          <Route path="/invitations" element={
            <ProtectedRoute>
              <Layout>
                <Invitations />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/plans" element={
            <ProtectedRoute>
              <Layout>
                <Plans />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/notifications" element={
  <ProtectedRoute>
    <Layout>
      <Notifications />
    </Layout>
  </ProtectedRoute>
} />

<Route path="/deposits" element={
  <ProtectedRoute>
    <Layout>
      <Deposits />
    </Layout>
  </ProtectedRoute>
} />

<Route path="/profile" element={
  <ProtectedRoute>
    <Layout>
      <Profile />
    </Layout>
  </ProtectedRoute>
} />

<Route path="/settings" element={
  <ProtectedRoute>
    <Layout>
      <Settings />
    </Layout>
  </ProtectedRoute>
} />

<Route path="/withdrawals" element={
  <ProtectedRoute>
    <Layout>
      <Withdrawals />
    </Layout>
  </ProtectedRoute>
} />

<Route path="/plans/:id/edit" element={
  <ProtectedRoute>
    <Layout>
      <EditPlan />
    </Layout>
  </ProtectedRoute>
} />
          
          <Route path="/plans/create" element={
            <ProtectedRoute>
              <Layout>
                <CreatePlan />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/plans/:id" element={
            <ProtectedRoute>
              <Layout>
                <PlanDetail />
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;