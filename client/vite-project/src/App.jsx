import { Routes, Route } from 'react-router-dom';
import Portfolio from './pages/Portfolio';
import Gallery from './pages/Gallery/Gallery';
import ProjectCaseStudy from './pages/ProjectCaseStudy/ProjectCaseStudy';
import AdminLogin from './pages/AdminLogin/AdminLogin';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import AdminResetPassword from './pages/AdminResetPassword/AdminResetPassword';
import './App.css';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Portfolio />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/projects/:projectSlug" element={<ProjectCaseStudy />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/reset-password" element={<AdminResetPassword />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </div>
  );
}

export default App;
