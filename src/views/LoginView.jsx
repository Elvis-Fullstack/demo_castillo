import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function LoginView({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Función para manejar el envío del formulario de acceso
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Autenticación con Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Si el inicio de sesión es exitoso, notificamos al componente padre
      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-surface p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-surface-container-lowest rounded-2xl shadow-lg border border-neutral-border">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-primary rounded-xl flex items-center justify-center mb-4">
             <span className="material-symbols-outlined text-on-primary text-[32px]">storefront</span>
          </div>
          <h2 className="text-headline-xl font-headline text-on-surface">El Castillo</h2>
          <p className="mt-2 text-body-md text-secondary">Inicia sesión para acceder al sistema</p>
        </div>

        {error && (
          <div className="p-3 text-label-sm text-traffic-red bg-traffic-red-bg rounded-lg border border-traffic-red-border">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 font-body">
          <div>
            <label className="block text-label-md text-on-surface">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 mt-1 bg-surface-container-low text-on-surface border border-neutral-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="tu@correo.com"
            />
          </div>

          <div>
            <label className="block text-label-md text-on-surface">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 mt-1 bg-surface-container-low text-on-surface border border-neutral-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 text-label-lg font-bold text-on-primary bg-primary rounded-lg hover:bg-brand-red-hover transition duration-200 disabled:opacity-50 shadow-md"
          >
            {loading ? 'Entrando...' : 'Ingresar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}
