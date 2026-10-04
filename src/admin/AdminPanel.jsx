import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';

const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminOrders = lazy(() => import('./pages/AdminOrders'));
const AdminMenuItems = lazy(() => import('./pages/AdminMenuItems'));
const AdminBranches = lazy(() => import('./pages/AdminBranches'));
const AdminReservations = lazy(() => import('./pages/AdminReservations'));
const AdminFeedbacks = lazy(() => import('./pages/AdminFeedbacks'));
const AdminContacts = lazy(() => import('./pages/AdminContacts'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminReports = lazy(() => import('./pages/AdminReports'));

const AdminFallback = () => (
  <div className="p-6 md:p-8 text-gray-500 text-sm tracking-widest">LOADING...</div>
);

const AdminPanel = () => (
  <AdminLayout>
    <Suspense fallback={<AdminFallback />}>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/orders" element={<AdminOrders />} />
        <Route path="/menu-items" element={<AdminMenuItems />} />
        <Route path="/branches" element={<AdminBranches />} />
        <Route path="/open-hours" element={<Navigate to="/admin/branches" replace />} />
        <Route path="/reservations" element={<AdminReservations />} />
        <Route path="/feedbacks" element={<AdminFeedbacks />} />
        <Route path="/contacts" element={<AdminContacts />} />
        <Route path="/users" element={<AdminUsers />} />
        <Route path="/reports" element={<AdminReports />} />
      </Routes>
    </Suspense>
  </AdminLayout>
);

export default AdminPanel;
