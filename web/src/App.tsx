import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Contracts from './pages/Contracts';
import Fleet from './pages/Fleet';
import Crew from './pages/Crew';
import VesselDetail from './pages/VesselDetail';
import CrewDetail from './pages/CrewDetail';
import Login from './pages/Login';
import Voyages from './pages/Voyages';
import VoyageBuilder from './pages/VoyageBuilder';
import VoyageDetail from './pages/VoyageDetail';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="contracts" element={<Contracts />} />
            <Route path="fleet" element={<Fleet />} />
            <Route path="fleet/:id" element={<VesselDetail />} />
            <Route path="crew" element={<Crew />} />
            <Route path="crew/:id" element={<CrewDetail />} />
            <Route path="voyages" element={<Voyages />} />
            <Route path="voyages/new" element={<VoyageBuilder />} />
            <Route path="voyages/:id" element={<VoyageDetail />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
