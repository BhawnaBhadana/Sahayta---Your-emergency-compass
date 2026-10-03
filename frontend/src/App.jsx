import { Routes, Route } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import SosActivation from './pages/SosActivation';
import SosStatus from './pages/SosStatus';
import CitizenDashboard from './pages/CitizenDashboard';
import CrisisMapPage from './pages/CrisisMapPage';
import ResourceDirectory from './pages/ResourceDirectory';
import Shelters from './pages/Shelters';
import Hospitals from './pages/Hospitals';
import SafeRoute from './pages/SafeRoute';
import ReportIncident from './pages/ReportIncident';
import CommunityVerification from './pages/CommunityVerification';
import FamilySafety from './pages/FamilySafety';
import MissingPersons from './pages/MissingPersons';
import AlertsPage from './pages/AlertsPage';
import Preparedness from './pages/Preparedness';
import ResponderDashboard from './pages/ResponderDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import NgoDashboard from './pages/NgoDashboard';
import HospitalDashboard from './pages/HospitalDashboard';
import AdminCommandCenter from './pages/AdminCommandCenter';
import AdminUsers from './pages/AdminUsers';
import CoordinatorDashboard from './pages/CoordinatorDashboard';
import RescueTeams from './pages/RescueTeams';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/map" element={<CrisisMapPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/resources" element={<ResourceDirectory />} />
        <Route path="/shelters" element={<Shelters />} />
        <Route path="/hospitals" element={<Hospitals />} />
        <Route path="/safe-route" element={<SafeRoute />} />
        <Route path="/preparedness" element={<Preparedness />} />
        <Route path="/missing-persons" element={<MissingPersons />} />
        <Route path="/community" element={<CommunityVerification />} />

        <Route path="/sos" element={<ProtectedRoute><SosActivation /></ProtectedRoute>} />
        <Route path="/sos/:id" element={<ProtectedRoute><SosStatus /></ProtectedRoute>} />
        <Route path="/report" element={<ProtectedRoute><ReportIncident /></ProtectedRoute>} />
        <Route path="/family" element={<ProtectedRoute roles={['citizen']}><FamilySafety /></ProtectedRoute>} />

        <Route path="/dashboard" element={<ProtectedRoute roles={['citizen']}><CitizenDashboard /></ProtectedRoute>} />
        <Route path="/volunteer" element={<ProtectedRoute roles={['volunteer']}><VolunteerDashboard /></ProtectedRoute>} />
        <Route path="/responder" element={<ProtectedRoute roles={['responder']}><ResponderDashboard /></ProtectedRoute>} />
        <Route path="/ngo" element={<ProtectedRoute roles={['ngo']}><NgoDashboard /></ProtectedRoute>} />
        <Route path="/hospital" element={<ProtectedRoute roles={['hospital']}><HospitalDashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminCommandCenter /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
        <Route path="/coordinator" element={<ProtectedRoute roles={['coordinator']}><CoordinatorDashboard /></ProtectedRoute>} />
        <Route path="/teams" element={<ProtectedRoute roles={['responder', 'coordinator', 'admin']}><RescueTeams /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
