import React, { lazy } from 'react';
import { createBrowserRouter, RouteObject } from 'react-router-dom';
import { AppLayout } from './layout';
import NotFound from '@/pages/NotFound';
import DesignPreview from '@/pages/DesignPreview';
import GhlSmoke from '@/pages/GhlSmoke';
import { RouteErrorBoundary } from '@/components/shared/error-boundary';
import { ProtectedRoute, AuthRoute } from '@/components/shared/protected-route';

// Lazy loading features - explicitly pointing to .tsx files to avoid empty .ts barrel files
const Dashboard = lazy(() => import('@/features/dashboard/index.tsx'));
const Leads = lazy(() => import('@/features/leads/index.tsx'));
const Clients = lazy(() => import('@/features/clients/index.tsx'));
const Contacts = lazy(() => import('@/features/contacts/index.tsx'));
const Listings = lazy(() => import('@/features/listings/index.tsx'));
const Offers = lazy(() => import('@/features/offers/index.tsx'));
const Transactions = lazy(() => import('@/features/transactions/index.tsx'));
const MLS = lazy(() => import('@/features/mls/index.tsx'));
const Conversations = lazy(() => import('@/features/conversations/index.tsx'));
const Calendar = lazy(() => import('@/features/calendar/index.tsx'));
const Tasks = lazy(() => import('@/features/tasks/index.tsx'));
const Notes = lazy(() => import('@/features/notes/index.tsx'));
const Docs = lazy(() => import('@/features/docs/index.tsx'));
const Reports = lazy(() => import('@/features/reports/index.tsx'));
const Team = lazy(() => import('@/features/team/index.tsx'));
const Settings = lazy(() => import('@/features/settings/index.tsx'));

const AuthLayout = lazy(() => import('@/features/auth').then(m => ({ default: m.AuthLayout })));
const SignIn = lazy(() => import('@/features/auth').then(m => ({ default: m.SignIn })));
const SignUp = lazy(() => import('@/features/auth').then(m => ({ default: m.SignUp })));
const ForgotPassword = lazy(() => import('@/features/auth').then(m => ({ default: m.ForgotPassword })));
const CheckEmail = lazy(() => import('@/features/auth').then(m => ({ default: m.CheckEmail })));
const ResetPassword = lazy(() => import('@/features/auth').then(m => ({ default: m.ResetPassword })));
const PasswordChanged = lazy(() => import('@/features/auth').then(m => ({ default: m.PasswordChanged })));
const Confirm = lazy(() => import('@/features/auth').then(m => ({ default: m.Confirm })));

const routes: RouteObject[] = [
  {
    path: '/auth',
    element: (
      <AuthRoute>
        <AuthLayout />
      </AuthRoute>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: 'sign-in', element: <SignIn /> },
      { path: 'sign-up', element: <SignUp /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'check-email', element: <CheckEmail /> },
      { path: 'reset-password', element: <ResetPassword /> },
      { path: 'password-changed', element: <PasswordChanged /> },
      { path: 'confirm', element: <Confirm /> },
    ],
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Dashboard />, errorElement: <RouteErrorBoundary /> },
      { path: 'leads', element: <Leads />, errorElement: <RouteErrorBoundary /> },
      { path: 'leads/:id', element: <Leads />, errorElement: <RouteErrorBoundary /> },
      { path: 'clients', element: <Clients />, errorElement: <RouteErrorBoundary /> },
      { path: 'clients/:id', element: <Clients />, errorElement: <RouteErrorBoundary /> },
      { path: 'contacts', element: <Contacts />, errorElement: <RouteErrorBoundary /> },
      { path: 'listings', element: <Listings />, errorElement: <RouteErrorBoundary /> },
      { path: 'listings/:id', element: <Listings />, errorElement: <RouteErrorBoundary /> },
      { path: 'offers', element: <Offers />, errorElement: <RouteErrorBoundary /> },
      { path: 'offers/:id', element: <Offers />, errorElement: <RouteErrorBoundary /> },
      { path: 'transactions', element: <Transactions />, errorElement: <RouteErrorBoundary /> },
      { path: 'mls', element: <MLS />, errorElement: <RouteErrorBoundary /> },
      { path: 'conversations', element: <Conversations />, errorElement: <RouteErrorBoundary /> },
      { path: 'conversations/:id', element: <Conversations />, errorElement: <RouteErrorBoundary /> },
      { path: 'calendar', element: <Calendar />, errorElement: <RouteErrorBoundary /> },
      { path: 'tasks', element: <Tasks />, errorElement: <RouteErrorBoundary /> },
      { path: 'notes', element: <Notes />, errorElement: <RouteErrorBoundary /> },
      { path: 'docs', element: <Docs />, errorElement: <RouteErrorBoundary /> },
      { path: 'reports', element: <Reports />, errorElement: <RouteErrorBoundary /> },
      { path: 'team', element: <Team />, errorElement: <RouteErrorBoundary /> },
      { path: 'settings/*', element: <Settings />, errorElement: <RouteErrorBoundary /> },
    ],
  },
  {
    path: '/design-preview',
    element: <DesignPreview />,
  },
  {
    path: '/ghl-smoke',
    element: (
      <ProtectedRoute>
        <GhlSmoke />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <NotFound />,
  },
];

export const router = createBrowserRouter(routes);
