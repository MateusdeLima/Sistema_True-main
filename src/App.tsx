import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Receipts from './pages/Receipts';
import Employees from './pages/Employees';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redireciona funcionário para clientes se tentar acessar rota não permitida
    return <Navigate to="/customers" />;
  }
  return <>{children}</>;
};

function Footer() {
  return (
    <footer className="bg-white shadow-md mt-auto py-4">
      <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
        <p>
          © 2025 True Iphones. Todos os direitos reservados. Criado por{' '}
          <a 
            href="https://portfoliopagecore.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 transition-colors duration-200 underline"
          >
            PageCore
          </a>
        </p>
      </div>
    </footer>
  );
}

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Toaster position="top-right" />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <div className="flex flex-col min-h-screen">
                      <Navbar />
                      <main className="flex-1 container mx-auto px-4 py-8 transition-all duration-300 ease-in-out">
                        <Dashboard />
                      </main>
                      <Footer />
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customers"
                element={
                  <ProtectedRoute>
                    <div className="flex flex-col min-h-screen">
                      <Navbar />
                      <main className="flex-1 container mx-auto px-4 py-8 transition-all duration-300 ease-in-out">
                        <Customers />
                      </main>
                      <Footer />
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/products"
                element={
                  <ProtectedRoute>
                    <div className="flex flex-col min-h-screen">
                      <Navbar />
                      <main className="flex-1 container mx-auto px-4 py-8 transition-all duration-300 ease-in-out">
                        <Products />
                      </main>
                      <Footer />
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/receipts"
                element={
                  <ProtectedRoute>
                    <div className="flex flex-col min-h-screen">
                      <Navbar />
                      <main className="flex-1 container mx-auto px-4 py-8 transition-all duration-300 ease-in-out">
                        <Receipts />
                      </main>
                      <Footer />
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employees"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <div className="flex flex-col min-h-screen">
                      <Navbar />
                      <main className="flex-1 container mx-auto px-4 py-8 transition-all duration-300 ease-in-out">
                        <Employees />
                      </main>
                      <Footer />
                    </div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;