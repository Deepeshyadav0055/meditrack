import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PublicDashboard from './pages/PublicDashboard';
import AmbulanceDispatcher from './pages/AmbulanceDispatcher';
import StaffPanel from './pages/StaffPanel';
import AdminDashboard from './pages/AdminDashboard';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PublicDashboard />} />
        <Route path="/ambulance" element={<AmbulanceDispatcher />} />
        <Route path="/staff" element={<StaffPanel />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
