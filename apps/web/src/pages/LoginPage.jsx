import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [recordar, setRecordar] = useState(true);
    const [mostrar, setMostrar] = useState(false);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setError('');
        setCargando(true);
        try {
            await login(email.trim(), password);
            const dest = location.state?.from || '/';
            navigate(dest, { replace: true });
        } catch (err) {
            const msg = err?.response?.message || err?.message || '';
            if (err?.status === 400) {
                setError('Correo o contraseña incorrectos.');
            } else if (/not verified|verified/i.test(msg)) {
                setError('Su cuenta no está verificada. Contacte al administrador.');
            } else if (msg) {
                setError(msg);
            } else {
                setError('No se pudo iniciar sesión. Intente nuevamente.');
            }
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-background lg:flex-row">
            <Helmet>
                <title>Iniciar sesión | Sistema de Mantenimiento CCTV</title>
                <meta name="description" content="Acceso al sistema de gestión de mantenimiento de sistemas de seguridad CCTV." />
            </Helmet>

            {/* Panel de marca */}
            <div
                className="relative hidden flex-1 flex-col justify-between overflow-hidden p-10 text-white lg:flex"
                style={{ background: 'linear-gradient(160deg, hsl(206 100% 42%), hsl(206 90% 26%))' }}
            >
                <div className="relative flex items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-lg bg-white/15">
                        <ShieldCheck className="h-6 w-6" />
                    </span>
                    <div>
                        <p className="font-display text-lg font-semibold leading-tight">Sistema CCTV</p>
                        <p className="text-sm text-white/75">Gestión de mantenimiento</p>
                    </div>
                </div>
                <div className="relative max-w-md">
                    <h1 className="font-display text-3xl font-semibold leading-tight">
                        Control total de órdenes, visitas y cartas oferta
                    </h1>
                    <p className="mt-4 text-white/75">
                        Plataforma profesional para la administración de mantenimiento preventivo
                        y correctivo de sistemas de seguridad electrónica.
                    </p>
                </div>
                <p className="relative text-xs text-white/60">© {new Date().getFullYear()} Sistema CCTV. Todos los derechos reservados.</p>
            </div>

            {/* Formulario */}
            <div className="flex flex-1 items-center justify-center bg-card p-6 sm:p-10">
                <div className="w-full max-w-md">
                    <div className="mb-8 flex items-center gap-3 lg:hidden">
                        <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary text-primary-foreground">
                            <ShieldCheck className="h-5 w-5" />
                        </span>
                        <div>
                            <p className="font-display text-base font-semibold leading-tight text-foreground">Sistema CCTV</p>
                            <p className="text-xs text-muted-foreground">Gestión de mantenimiento</p>
                        </div>
                    </div>

                    <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">Iniciar sesión</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Ingrese sus credenciales para acceder al sistema.</p>

                    <form onSubmit={submit} className="mt-6 space-y-4">
                        <label className="flex flex-col gap-1.5">
                            <span className="text-xs font-semibold text-muted-foreground">Correo electrónico</span>
                            <input
                                type="email"
                                required
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@cctv.com"
                                className="min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                        </label>

                        <label className="flex flex-col gap-1.5">
                            <span className="text-xs font-semibold text-muted-foreground">Contraseña</span>
                            <div className="relative">
                                <input
                                    type={mostrar ? 'text' : 'password'}
                                    required
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                                <button
                                    type="button"
                                    onClick={() => setMostrar((v) => !v)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                                    aria-label={mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                >
                                    {mostrar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </label>

                        <label className="flex items-center gap-2 text-sm text-muted-foreground">
                            <input
                                type="checkbox"
                                checked={recordar}
                                onChange={(e) => setRecordar(e.target.checked)}
                                className="h-4 w-4 rounded border-input bg-background text-primary focus:ring-primary"
                            />
                            Recordar sesión
                        </label>

                        {error && (
                            <div className="flex items-start gap-2 rounded-md border border-critical/30 bg-critical/10 p-3 text-sm text-critical">
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={cargando}
                            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60"
                        >
                            <LogIn className="h-4 w-4" />
                            {cargando ? 'Ingresando…' : 'Iniciar sesión'}
                        </button>
                    </form>

                    <div className="mt-6 rounded-md border border-border bg-secondary/50 p-4 font-mono text-xs text-muted-foreground">
                        <p className="font-sans font-semibold text-foreground/80">Cuentas de prueba</p>
                        <p className="mt-1">Admin: <span className="text-primary">admin@cctv.com</span> / admin123</p>
                        <p>Usuario: <span className="text-primary">usuario@cctv.com</span> / usuario123</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
