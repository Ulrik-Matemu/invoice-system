import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Route, createRoutesFromElements } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CacheProvider } from './context/CacheContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Lazy load pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Invoices = React.lazy(() => import('./pages/Invoices'));
const InvoiceForm = React.lazy(() => import('./pages/InvoiceForm'));
const Clients = React.lazy(() => import('./pages/Clients'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Login = React.lazy(() => import('./pages/Login'));
const SignUp = React.lazy(() => import('./pages/SignUp'));
const Expenses = React.lazy(() => import('./pages/Expenses'));
const AdReward = React.lazy(() => import('./pages/AdReward'));

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/ad-reward" element={
        <AdReward />
      } />
      <Route path="/" element={
        <Layout />
      }>
        <Route index element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
        />
        <Route path="invoices" element={
          <ProtectedRoute>
            <Invoices />
          </ProtectedRoute>
        } />
        <Route path="invoices/new" element={
          <ProtectedRoute>
            <InvoiceForm />
          </ProtectedRoute>
        } />
        <Route path="invoices/:id" element={
          <ProtectedRoute>
            <InvoiceForm />
          </ProtectedRoute>
        } />
        <Route path="clients" element={
          <ProtectedRoute>
            <Clients />
          </ProtectedRoute>
        } />
        <Route path="expenses" element={
          <ProtectedRoute>
            <Expenses />
          </ProtectedRoute>
        } />
        <Route path="settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />
      </Route>
    </>
  )
);

function App() {
  return (
    <AuthProvider>
      <CacheProvider>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen bg-[#020e1bff]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#64ffda]"></div>
          </div>
        }>
          <RouterProvider router={router} />
        </Suspense>
      </CacheProvider>
    </AuthProvider>
  );
}

export default App;
