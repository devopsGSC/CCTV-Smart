import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OrdenesPage from './pages/OrdenesPage';
import OrdenDetallePage from './pages/OrdenDetallePage';
import VisitasPage from './pages/VisitasPage';
import CartasPage from './pages/CartasPage';
import CartaDetallePage from './pages/CartaDetallePage';
import CatalogoPage from './pages/CatalogoPage';
import HistorialPage from './pages/HistorialPage';
import ReportesPage from './pages/ReportesPage';
import ConfiguracionPage from './pages/ConfiguracionPage';
import BuscarPage from './pages/BuscarPage';
import UsuariosPage from './pages/UsuariosPage';
import ImprimirOrdenPage from './pages/ImprimirOrdenPage';
import ImprimirCartaPage from './pages/ImprimirCartaPage';
import ImprimirCotizacionPage from './pages/ImprimirCotizacionPage';

const guard = (element, roles) => <ProtectedRoute roles={roles}>{element}</ProtectedRoute>;

function App() {
    return (
        <AuthProvider>
            <Router>
                <ScrollToTop />
                <Routes>
                    <Route path="/login" element={<LoginPage />} />

                    <Route path="/" element={guard(<DashboardPage />)} />
                    <Route path="/ordenes" element={guard(<OrdenesPage />)} />
                    <Route path="/ordenes/:id" element={guard(<OrdenDetallePage />)} />
                    <Route path="/visitas" element={guard(<VisitasPage />)} />
                    <Route path="/cartas" element={guard(<CartasPage />)} />
                    <Route path="/cartas/:id" element={guard(<CartaDetallePage />)} />

                    <Route path="/clientes" element={guard(<CatalogoPage tipo="clientes" />, ['Admin'])} />
                    <Route path="/lugares" element={guard(<CatalogoPage tipo="lugares" />, ['Admin'])} />
                    <Route path="/equipos" element={guard(<CatalogoPage tipo="equipos" />, ['Admin'])} />
                    <Route path="/materiales" element={guard(<CatalogoPage tipo="materiales" />, ['Admin'])} />
                    <Route path="/tecnicos" element={guard(<CatalogoPage tipo="tecnicos" />, ['Admin'])} />

                    <Route path="/historial" element={guard(<HistorialPage />)} />
                    <Route path="/reportes" element={guard(<ReportesPage />, ['Admin'])} />
                    <Route path="/configuracion" element={guard(<ConfiguracionPage />, ['Admin'])} />
                    <Route path="/usuarios" element={guard(<UsuariosPage />, ['Admin'])} />
                    <Route path="/buscar" element={guard(<BuscarPage />)} />

                    <Route path="/imprimir/orden/:id" element={guard(<ImprimirOrdenPage />)} />
                    <Route path="/imprimir/carta/:id" element={guard(<ImprimirCartaPage />)} />
                    <Route path="/imprimir/cotizacion/:id" element={guard(<ImprimirCotizacionPage />)} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
