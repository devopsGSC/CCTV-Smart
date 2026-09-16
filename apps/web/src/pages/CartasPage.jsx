import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { Seccion, Tabla, Vacio, Cargando, EstadoBadge, Texto, Selector, btn, useToastMsg } from '@/components/kit';
import { useCollection, removeRec, money, ESTADOS_CARTA } from '@/lib/db';

const vacio = { desde: '', hasta: '', cliente: '', lugar: '', estado: '' };

export const totalCarta = (c) => {
    const items = (c.items || []).filter((i) => i.aprobado !== false || c.estado !== 'Aprobada parcialmente');
    const sub = items.reduce((s, i) => s + Number(i.cantidad || 0) * Number(i.precio || 0), 0);
    const desc = Number(c.descuento || 0);
    const base = sub - desc;
    const iva = base * (Number(c.ivaPorcentaje || 0) / 100);
    return { sub, desc, base, iva, total: base + iva };
};

export default function CartasPage() {
    const { items, loading, reload } = useCollection('cartas', { expand: 'cliente,lugar,orden' });
    const { items: clientes } = useCollection('clientes');
    const { items: lugares } = useCollection('lugares');
    const [f, setF] = useState(vacio);
    const [toast, setToast] = useToastMsg();
    const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

    const filtradas = useMemo(
        () =>
            items.filter((c) => {
                if (f.desde && (c.fecha || '') < f.desde) return false;
                if (f.hasta && (c.fecha || '') > f.hasta) return false;
                if (f.cliente && c.cliente !== f.cliente) return false;
                if (f.lugar && c.lugar !== f.lugar) return false;
                if (f.estado && c.estado !== f.estado) return false;
                return true;
            }),
        [items, f],
    );

    return (
        <AppLayout title="Cartas Oferta" subtitle="Correlativo automático CO-CCTV-AAAA-00000-Vn">
            <Helmet>
                <title>Cartas Oferta | Sistema de Mantenimiento CCTV</title>
                <meta name="description" content="Listado y control de cartas oferta relacionadas a órdenes de trabajo de sistemas CCTV." />
            </Helmet>

            <Seccion
                title="Filtros"
                actions={
                    <button type="button" className={btn.ghost} onClick={() => setF(vacio)}>
                        Limpiar filtros
                    </button>
                }
            >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <Texto label="Fecha desde" type="date" value={f.desde} onChange={set('desde')} />
                    <Texto label="Fecha hasta" type="date" value={f.hasta} onChange={set('hasta')} />
                    <Selector label="Cliente" value={f.cliente} onChange={set('cliente')} placeholder="Todos" options={clientes.map((c) => ({ value: c.id, label: c.nombre }))} />
                    <Selector label="Lugar" value={f.lugar} onChange={set('lugar')} placeholder="Todos" options={lugares.map((c) => ({ value: c.id, label: c.nombre }))} />
                    <Selector label="Estado" value={f.estado} onChange={set('estado')} placeholder="Todos" options={ESTADOS_CARTA} />
                </div>
            </Seccion>

            <Seccion title={`${filtradas.length} cartas oferta`} className="mt-6">
                {loading ? (
                    <Cargando />
                ) : filtradas.length === 0 ? (
                    <Vacio mensaje="Sin cartas oferta registradas" />
                ) : (
                    <Tabla columns={['N.º Carta Oferta', 'Fecha', 'Cliente', 'Lugar', 'Orden origen', 'Estado', 'Total', '']}>
                        {filtradas.map((c) => (
                            <tr key={c.id} className="hover:bg-secondary">
                                <td className="px-3 py-2 font-semibold text-blue-700">
                                    <Link to={`/cartas/${c.id}`} className="hover:underline">{c.numero}</Link>
                                </td>
                                <td className="px-3 py-2">{c.fecha || '—'}</td>
                                <td className="px-3 py-2">{c.expand?.cliente?.nombre || '—'}</td>
                                <td className="px-3 py-2">{c.expand?.lugar?.nombre || '—'}</td>
                                <td className="px-3 py-2">
                                    {c.expand?.orden ? (
                                        <Link to={`/ordenes/${c.orden}`} className="text-blue-700 hover:underline">{c.expand.orden.numero}</Link>
                                    ) : '—'}
                                </td>
                                <td className="px-3 py-2"><EstadoBadge estado={c.estado} /></td>
                                <td className="px-3 py-2 font-semibold">{money(totalCarta(c).total)}</td>
                                <td className="px-3 py-2">
                                    <button
                                        type="button"
                                        className={btn.danger}
                                        onClick={async () => {
                                            try {
                                                await removeRec('cartas', c.id);
                                                setToast('Carta eliminada');
                                                reload();
                                            } catch (err) {
                                                setToast(err?.message || 'No se pudo eliminar');
                                            }
                                        }}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </Tabla>
                )}
            </Seccion>
            {toast}
        </AppLayout>
    );
}
