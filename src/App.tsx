import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Route, createRoutesFromElements } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
const Layout = React.lazy(() => import('./components/Layout'));

// Lazy load pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Invoices = React.lazy(() => import('./pages/Invoices'));
const InvoiceForm = React.lazy(() => import('./pages/InvoiceForm'));
const Clients = React.lazy(() => import('./pages/Clients'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Login = React.lazy(() => import('./pages/Login'));
const SignUp = React.lazy(() => import('./pages/SignUp'));

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="invoices/new" element={<InvoiceForm />} />
        <Route path="invoices/:id/edit" element={<InvoiceForm />} />
        <Route path="clients" element={<Clients />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </>
  )
);

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen bg-[#020e1bff]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#64ffda]"></div>
        </div>
      }>
        <RouterProvider router={router} />
      </Suspense>
    </AuthProvider>
  );
}

export default App;
