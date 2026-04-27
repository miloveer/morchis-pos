import { useState } from 'react';

export default function LoginAdmin({ onLoginExitoso, onCancelar }) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // AQUÍ DEFINES TU USUARIO Y CONTRASEÑA
    // Más adelante podemos conectarlo a Firebase Auth, por ahora es local
    if (usuario === 'morchis' && password === 'admin2026') {
      onLoginExitoso();
    } else {
      setError(true);
      setPassword(''); // Limpia la contraseña si se equivoca
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
            <span className="text-2xl">🍔</span>
          </div>
          <h2 className="text-2xl font-black text-gray-900">Acceso Morchis</h2>
          <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-wider">Panel de Control</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Usuario</label>
            <input 
              type="text" 
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-gray-900 focus:bg-white transition-colors text-sm font-medium"
              placeholder="Ej. morchis"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-gray-900 focus:bg-white transition-colors text-sm font-medium"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs font-bold text-center bg-red-50 p-2 rounded-lg">
              Usuario o contraseña incorrectos
            </p>
          )}

          <div className="pt-2">
            <button 
              type="submit" 
              className="w-full bg-gray-900 text-white font-black py-3.5 rounded-xl shadow-md hover:bg-gray-800 active:scale-95 transition-all text-sm tracking-wide"
            >
              ENTRAR AL PANEL
            </button>
            <button 
              type="button"
              onClick={onCancelar}
              className="w-full mt-3 text-gray-500 font-bold text-xs py-2 hover:text-gray-900 transition-colors"
            >
              Regresar al menú
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}