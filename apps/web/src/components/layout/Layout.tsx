import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const menu = [
  { path: '/', label: '🏠 Inicio' },
  { path: '/structure', label: '🏫 Estructura' },
  { path: '/courses', label: '📘 Cursos' },
  { path: '/periods', label: '📅 Períodos / Bloques' },
  { path: '/teachers', label: '👨‍🏫 Docentes' },
];

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <h1 className="font-bold text-gray-800">🗓️ Generador de Horarios</h1>
          <p className="text-xs text-gray-500">Fase 2 · Datos base</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {menu.map((m) => (
            <NavLink
              key={m.path}
              to={m.path}
              end={m.path === '/'}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              {m.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t">
          <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
          <p className="text-xs text-gray-500 mb-2">{user?.role}</p>
          <button
            onClick={() => { logout(); nav('/login'); }}
            className="text-sm text-red-600 hover:underline"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};