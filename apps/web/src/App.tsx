import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/ui';
import { LoginPage } from './pages/LoginPage';
import { Layout } from './components/layout/Layout';
import { StructurePage } from './pages/StructurePage';
import { CoursesPage } from './pages/CoursesPage';
import { PeriodsPage } from './pages/PeriodsPage';
import { TeachersPage, TeacherDetailPage } from './pages/TeachersPage';

const Home: React.FC = () => (
  <div>
    <h1 className="text-2xl font-bold mb-4">Generador de Horarios</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="font-semibold mb-2">📋 Fase 2: Datos base</h2>
        <p className="text-sm text-gray-500">
          Gestiona la estructura (sedes, turnos, salones), cursos, períodos, bloques y docentes con su disponibilidad.
        </p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="font-semibold mb-2">⚡ Fase 3: Generador</h2>
        <p className="text-sm text-gray-500">
          Próximamente: el algoritmo que generará el horario automáticamente.
        </p>
      </div>
    </div>
  </div>
);

const Protected: React.FC = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout />;
};

const App: React.FC = () => (
  <ToastProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<Protected />}>
            <Route path="/" element={<Home />} />
            <Route path="/structure" element={<StructurePage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/periods" element={<PeriodsPage />} />
            <Route path="/teachers" element={<TeachersPage />} />
            <Route path="/teachers/:id" element={<TeacherDetailPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </ToastProvider>
);

export default App;