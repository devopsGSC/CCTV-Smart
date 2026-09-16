import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { Seccion, Tabla, Vacio, Cargando, EstadoBadge, Selector, Texto, btn } from '@/components/kit';
import { useCollection, TIPOS_VISITA, ESTADOS_ORDEN } from '@/lib/db';

const tonos = {
    sky: 'text-blue-700',
    amber: 'text-amber-700',
    emerald: 'text-emerald-700',
    orange: 'text-orange-700',
    rose: 'text-rose-700',
};

const dots = {
    sky: 'bg-blue-600',
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-600',
    orange: 'bg-orange-500',
    rose: 'bg-rose-600',
};

const Tarjeta = ({ label, value, tono = 'sky' }) => (
    <div className="relative rounded-lg border border-border bg-card p-4 shadow-sm">
        <span className={`absolute right-4 top-4 h-1.5 w-1.5 rounded-full ${dots[tono]}`} />
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <p className={`mt-2 text-3xl font-bold tabular-nums ${tonos[tono]}`}>{value}</p>
    </div>
);

export default function DashboardPage() {
    const { items: ordenes, loading } = useCollection('ordenes', {
        expand: 'cliente,lugar,tecnico',
        sort: 'fechaProgramada',
    });
    const { items: cartas } = useCollection('cartas', { expand: 'cliente,lugar' });
    const [f, setF] = useState({ fecha: '', cliente: '', lugar: '', tecnico: '', tipo: '', estado: '' });

    const set = (k) => (v) => setF((prev) => ({ ...prev, [k]: v }));

    const conteo = (estado) => ordenes.filter((o) => o.estado === estado).length;
    const tipoCount = (t) => ordenes.filter((o) => o.tipoVisita === t).length;
    const cartaCount = (e) => cartas.filter((c) => c.estado === e).length;

    const clientes = useMemo(
        () => [...new Set(ordenes.map((o) => o.expand?.cliente?.nombre).filter(Boolean))],
        [ordenes],
    );
    const lugares = useMemo(
        () => [...new Set(ordenes.map((o) => o.expand?.lugar?.nombre).filter(Boolean))],
        [ordenes],
    );
    const tecnicos = useMemo(
        () => [...new Set(ordenes.map((o) => o.expand?.tecnico?.nombre).filter(Boolean))],
        [ordenes],
    );

    const proximas = ordenes.filter((o) => {
        if (f.fecha && o.fechaProgramada !== f.fecha) return false;
        if (f.cliente && o.expand?.cliente?.nombre !== f.cliente) return false;
        if (f.lugar && o.expand?.lugar?.nombre !== f.lugar) return false;
        if (f.tecnico && o.expand?.tecnico?.nombre !== f.tecnico) return false;
        if (f.tipo && o.tipoVisita !== f.tipo) return false;
        if (f.estado && o.estado !== f.estado) return false;
        return true;
    });

    return (
        <AppLayout title="Dashboard" subtitle="Resumen operativo de mantenimiento CCTV">
            <Helmet>
                <title>Dashboard | Sistema de Mantenimiento CCTV</title>
                <meta
                    name="description"
                    content="Resumen de órdenes de trabajo, visitas técnicas y cartas oferta para sistemas de seguridad electrónica CCTV."
                />
            </Helmet>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Tarjeta label="Órdenes abiertas" value={ordenes.filter((o) => !['Finalizada', 'Cancelada'].includes(o.estado)).length} />
                <Tarjeta label="Programadas" value={conteo('Programada')} />
                <Tarjeta label="En proceso" value={conteo('En proceso')} tono="amber" />
                <Tarjeta label="Finalizadas" value={conteo('Finalizada')} tono="emerald" />
                <Tarjeta label="Mant. preventivos" value={tipoCount('Mantenimiento preventivo')} />
                <Tarjeta label="Mant. correctivos" value={tipoCount('Mantenimiento correctivo')} tono="orange" />
                <Tarjeta label="Visitas pendientes" value={ordenes.filter((o) => ['Programada', 'Reprogramada', 'Pendiente'].includes(o.estado)).length} />
                <Tarjeta label="Visitas realizadas" value={ordenes.filter((o) => ['Finalizada'].includes(o.estado)).length} tono="emerald" />
                <Tarjeta label="Ofertas pendientes" value={cartaCount('Pendiente de aprobación') + cartaCount('Enviada')} />
                <Tarjeta label="Ofertas aprobadas" value={cartaCount('Aprobada') + cartaCount('Aprobada parcialmente')} tono="emerald" />
                <Tarjeta label="Ofertas rechazadas" value={cartaCount('Rechazada')} tono="rose" />
                <Tarjeta label="Pendientes por materiales" value={conteo('Pendiente de materiales')} tono="orange" />
            </div>

            <Seccion
                title="Próximas visitas"
                className="mt-6"
                actions={
                    <button type="button" className={btn.ghost} onClick={() => setF({ fecha: '', cliente: '', lugar: '', tecnico: '', tipo: '', estado: '' })}>
                        Limpiar filtros
                    </button>
                }
            >
                <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    <Texto label="Fecha" type="date" value={f.fecha} onChange={set('fecha')} />
                    <Selector label="Cliente" value={f.cliente} onChange={set('cliente')} options={clientes} placeholder="Todos" />
                    <Selector label="Lugar" value={f.lugar} onChange={set('lugar')} options={lugares} placeholder="Todos" />
                    <Selector label="Técnico" value={f.tecnico} onChange={set('tecnico')} options={tecnicos} placeholder="Todos" />
                    <Selector label="Tipo" value={f.tipo} onChange={set('tipo')} options={TIPOS_VISITA} placeholder="Todos" />
                    <Selector label="Estado" value={f.estado} onChange={set('estado')} options={ESTADOS_ORDEN} placeholder="Todos" />
                </div>

                {loading ? (
                    <Cargando />
                ) : proximas.length === 0 ? (
                    <Vacio mensaje="No hay visitas que coincidan con los filtros" />
                ) : (
                    <Tabla columns={['Fecha', 'Hora', 'Lugar', 'Cliente', 'Técnico', 'Tipo', 'Estado', '']}>
                        {proximas.map((o) => (
                            <tr key={o.id} className="hover:bg-secondary/60">
                                <td className="px-3 py-2 font-mono">{o.fechaProgramada || '—'}</td>
                                <td className="px-3 py-2 font-mono">{o.horaProgramada || '—'}</td>
                                <td className="px-3 py-2">{o.expand?.lugar?.nombre || '—'}</td>
                                <td className="px-3 py-2">{o.expand?.cliente?.nombre || '—'}</td>
                                <td className="px-3 py-2">{o.expand?.tecnico?.nombre || '—'}</td>
                                <td className="px-3 py-2">{o.tipoVisita || '—'}</td>
                                <td className="px-3 py-2"><EstadoBadge estado={o.estado} /></td>
                                <td className="px-3 py-2">
                                    <Link className="font-mono font-semibold text-primary hover:underline" to={`/ordenes/${o.id}`}>
                                        {o.numero}
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </Tabla>
                )}
            </Seccion>
        </AppLayout>
    );
}
