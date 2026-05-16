import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Plus, History, User, LogOut, CarTaxiFront } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/nova-viagem', label: 'Nova Viagem', icon: Plus },
  { to: '/historico', label: 'Histórico', icon: History },
  { to: '/perfil', label: 'Perfil', icon: User },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const isDark = user?.profile?.darkMode;
    document.documentElement.classList.toggle('dark', !!isDark);
  }, [user?.profile?.darkMode]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logout realizado com sucesso');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Mobile top bar */}
      <header className="bg-black text-white px-4 py-3 flex items-center justify-between md:hidden sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-taxi-yellow rounded-full flex items-center justify-center">
            <CarTaxiFront className="w-4 h-4 text-black" />
          </div>
          <span className="font-bold text-taxi-yellow text-lg">TáxiRecibo</span>
        </div>
        <button onClick={handleLogout} className="text-gray-400 hover:text-white transition-colors p-1">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-56 bg-black text-white min-h-screen fixed left-0 top-0 bottom-0 z-30">
          <div className="p-5 border-b border-gray-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-taxi-yellow rounded-full flex items-center justify-center flex-shrink-0">
                <CarTaxiFront className="w-4 h-4 text-black" />
              </div>
              <span className="font-bold text-taxi-yellow text-xl">TáxiRecibo</span>
            </div>
            <p className="text-gray-500 text-xs mt-1.5 truncate">{user?.email}</p>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-taxi-yellow text-black'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="p-3 border-t border-gray-800">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 w-full transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 md:ml-56 pb-20 md:pb-0">
          <div className="max-w-4xl mx-auto px-4 py-5">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-40 flex">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
                isActive ? 'text-taxi-yellow' : 'text-gray-500 hover:text-gray-300'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
