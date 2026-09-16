import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    ClipboardList,
    CalendarDays,
    FileText,
    Building2,
    MapPin,
    Camera,
    Package,
    Users,
    History,
    BarChart3,
    Settings,
    Menu,
    Search,
    ShieldCheck,
    UserCog,
    LogOut,
    X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const MODULOS = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Usuario'] },
    { to: '/ordenes', label: 'Órdenes de Trabajo', icon: ClipboardList, roles: ['Admin', 'Usuario'] },
    { to: '/visitas', label: 'Programación de Visitas', icon: CalendarDays, roles: ['Admin', 'Usuario'] },
    { to: '/cartas', label: 'Carta Oferta', icon: FileText, roles: ['Admin', 'Usuario'] },
    { to: '/clientes', label: 'Clientes / Instituciones', icon: Building2, roles: ['Admin'] },
    { to: '/lugares', label: 'Lugares / Sedes', icon: MapPin, roles: ['Admin'] },
    { to: '/equipos', label: 'Equipos', icon: Camera, roles: ['Admin'] },
    { to: '/materiales', label: 'Materiales y Servicios', icon: Package, roles: ['Admin'] },
    { to: '/tecnicos', label: 'Técnicos', icon: Users, roles: ['Admin'] },
    { to: '/historial', label: 'Historial', icon: History, roles: ['Admin', 'Usuario'] },
    { to: '/reportes', label: 'Reportes', icon: BarChart3, roles: ['Admin'] },
    { to: '/usuarios', label: 'Gestión de Usuarios', icon: UserCog, roles: ['Admin'] },
    { to: '/configuracion', label: 'Configuración', icon: Settings, roles: ['Admin'] },
];

function useClock() {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);
    const p = (n) => String(n).padStart(2, '0');
    return `${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}`;
}

export default function AppLayout({ title, subtitle, actions, children }) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState('');
    const navigate = useNavigate();
    const { user, role, isAdmin, logout } = useAuth();
    const clock = useClock();

    const modulos = MODULOS.filter((m) => m.roles.includes(isAdmin ? 'Admin' : 'Usuario'));

    const buscar = (e) => {
        e.preventDefault();
        if (!q.trim()) return;
        navigate(`/buscar?q=${encodeURIComponent(q.trim())}`);
        setOpen(false);
    };

    const cerrarSesion = () => {
        logout();
        navigate('/login', { replace: true });
    };

    const iniciales = (user?.name || user?.email || '?')
        .split(' ')
        .map((s) => s[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const NavItems = ({ withLabel }) =>
        modulos.map(({ to, label, icon: Icon }) => (
            <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setOpen(false)}
                title={label}
                className={({ isActive }) =>
                    `group relative flex items-center rounded-md transition ${
                        withLabel ? 'gap-3 px-3 py-2.5' : 'h-10 w-10 justify-center'
                    } ${
                        isActive
                            ? 'bg-primary/15 text-primary'
                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`
                }
            >
                {({ isActive }) => (
                    <>
                        {isActive && !withLabel && (
                            <span className="absolute -right-3 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary" />
                        )}
                        <Icon className="h-[18px] w-[18px] shrink-0" />
                        {withLabel && <span className="text-sm font-medium">{label}</span>}
                    </>
                )}
            </NavLink>
        ));

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <div className="flex min-w-0 flex-1 flex-col md:pr-16">
                <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur-xl">
                    <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
                        <Link to="/" className="flex items-center gap-2.5 md:hidden">
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
                                <ShieldCheck className="h-4 w-4" />
                            </span>
                            <span className="font-display text-base font-semibold leading-none">Sistema CCTV</span>
                        </Link>
                        <form onSubmit={buscar} className="relative order-3 w-full sm:order-none sm:w-80 lg:w-96">
                            <Search className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Buscar OT, oferta, cliente, serie..."
                                className="w-full rounded-full border-0 bg-secondary py-2 pl-10 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-primary focus:bg-background"
                            />
                        </form>
                        <div className="ml-auto flex flex-wrap items-center gap-3">
                            {actions}
                            <span className="hidden items-center gap-1.5 rounded-full bg-good/10 px-2.5 py-1 text-xs font-semibold text-good sm:inline-flex">
                                <span className="h-1.5 w-1.5 rounded-full bg-good" />
                                Sistema en línea
                            </span>
                            <span className="hidden font-mono text-xs text-muted-foreground md:inline">{clock}</span>
                            <div className="flex items-center gap-2 border-l border-border pl-3">
                                <div className="hidden text-right sm:block">
                                    <p className="text-sm font-semibold leading-tight text-foreground">{user?.name || 'Usuario'}</p>
                                    <p className="text-xs leading-tight text-muted-foreground">
                                        {isAdmin ? 'Administrador' : 'Usuario'}
                                    </p>
                                </div>
                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                                    {iniciales}
                                </span>
                                <button
                                    type="button"
                                    onClick={cerrarSesion}
                                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-critical"
                                    title="Cerrar sesión"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span className="hidden sm:inline">Salir</span>
                                </button>
                                <button
                                    type="button"
                                    className="rounded-md border border-border p-2 text-muted-foreground md:hidden"
                                    onClick={() => setOpen((v) => !v)}
                                    aria-label="Menú"
                                >
                                    <Menu className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-6">
                    <div className="mb-5">
                        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
                        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
                    </div>
                    {children}
                </main>
            </div>

            {/* Riel de navegación — lado derecho, efecto Mica translúcido */}
            <nav className="fixed inset-y-0 right-0 z-40 hidden w-16 flex-col items-center gap-1 border-l border-border bg-card/70 py-4 backdrop-blur-xl backdrop-saturate-150 md:flex">
                <Link to="/" className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground" title="Sistema CCTV">
                    <ShieldCheck className="h-[18px] w-[18px]" />
                </Link>
                <div className="flex flex-1 flex-col items-center gap-1 overflow-y-auto">
                    <NavItems withLabel={false} />
                </div>
            </nav>

            {/* Panel deslizante — móvil */}
            {open && (
                <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setOpen(false)} aria-hidden="true" />
            )}
            <aside
                className={`fixed inset-y-0 right-0 z-40 w-72 transform overflow-y-auto border-l border-border bg-card text-foreground shadow-xl transition-transform duration-300 ease-out md:hidden ${
                    open ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="flex items-center justify-between border-b border-border px-5 py-5">
                    <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                            <ShieldCheck className="h-[18px] w-[18px]" />
                        </span>
                        <div>
                            <span className="block text-sm font-semibold leading-tight">Sistema CCTV</span>
                            <span className="block text-xs text-muted-foreground">Gestión de mantenimiento</span>
                        </div>
                    </div>
                    <button type="button" onClick={() => setOpen(false)} className="rounded p-1.5 text-muted-foreground hover:bg-secondary" aria-label="Cerrar menú">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <nav className="space-y-1 p-3">
                    <NavItems withLabel />
                </nav>
            </aside>
        </div>
    );
}
