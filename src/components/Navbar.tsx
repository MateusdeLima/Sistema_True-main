import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Smartphone, 
  Users, 
  Package, 
  Receipt, 
  BarChart2,
  LogOut,
  Menu,
  X,
  UserCog
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', icon: Smartphone, label: 'Início' },
    { path: '/customers', icon: Users, label: 'Clientes' },
    { path: '/products', icon: Package, label: 'Produtos' },
    { path: '/receipts', icon: Receipt, label: 'Recibos' },
    { path: '/reports', icon: BarChart2, label: 'Relatórios' },
    { path: '/employees', icon: UserCog, label: 'Funcionários' },
  ];

  return (
    <>
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <img
                src="https://i.postimg.cc/jdqFP75f/Captura-de-tela-2025-02-16-213923.png"
                alt="Logo IPHONES"
                className="h-12 transform hover:scale-105 transition-transform duration-200"
              />
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-all duration-200"
              >
                {isMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>

            {/* Desktop menu */}
            <div className="hidden md:flex items-center justify-center flex-1 space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 transform hover:scale-105 hover:bg-blue-50 ${
                    isActive(item.path)
                      ? 'bg-blue-500 text-white shadow-md hover:bg-blue-600 hover:text-white'
                      : 'text-gray-600'
                  }`}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Link>
              ))}
            </div>
            
            <div className="hidden md:flex items-center">
              <button
                onClick={() => signOut()}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 transform hover:scale-105"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={`md:hidden fixed inset-0 z-50 bg-gray-900 bg-opacity-50 transition-opacity duration-300 ${
          isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMenuOpen(false)}
      >
        <div
          className={`fixed inset-y-0 left-0 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
            isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-blue-50'
                }`}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
              </Link>
            ))}
            
            <button
              onClick={() => {
                setIsMenuOpen(false);
                signOut();
              }}
              className="w-full flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Navbar;