import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { Seccion, Selector, Vacio, EstadoBadge } from '@/components/kit';
import { useCollection, money } from '@/lib/db';
import { totalCarta } from '@/pages/CartasPage';

export default function HistorialPage() {
    const { items: lugares } = useCollection('lugares', { expand: 'cliente' });
    const { items: ordenes } = useCollection('ordenes', { expand: 'cliente,lugar,tecnico' });
    const { items: cartas } = useCollection('cartas');
    const [lugarId, setLugarId] = useState('');

    const lugar = lugares.find((l) => l.id === lugarId);
    const historial = useMemo(
        () =>
            ordenes
                .filter((o) => o.lugar === lugarId)
                .sort((a, b) => (b.fechaProgramada || '').localeCompare(a.fechaProgramada || '')),
        [ordenes, lugarId],
    );

    return (
        <AppLayout title="Historial por lugar" subtitle="Toda la vida de mantenimiento de cada sede">
            <Helmet>
                <title>Historial | Sistema de Mantenimiento CCTV</title>
                <meta name="description" content="Historial cronológico de visitas, órdenes, equipos, fallas, materiales y cartas oferta por sede." />
            </Helmet>

            <Seccion title="Seleccionar lugar">
                <Selector
                    label="Lugar / Sede"
                    value={lugarId}
                    onChange={setLugarId}
                    options={lugares.map((l) => ({ value: l.id, label: `${l.nombre} — ${l.expand?.cliente?.nombre || 'Sin cliente'}` }))}
                />
                {lugar && (
                    <p className="mt-3 text-sm text-muted-foreground">
                        {lugar.direccion} · {lugar.municipio}, {lugar.departamento} · Responsable: {lugar.responsable || '—'}
                    </p>
                )}
            </Seccion>

            {!lugarId ? (
                <Seccion title="Historial" className="mt-6">
                    <Vacio mensaje="Seleccione un lugar para ver su historial" />
                </Seccion>
            ) : historial.length === 0 ? (
                <Seccion title="Historial" className="mt-6">
                    <Vacio mensaje="Esta sede no tiene órdenes registradas" />
                </Seccion>
            ) : (
                <div className="mt-6 space-y-4">
                    {historial.map((o) => {
                        const cartasOrden = cartas.filter((c) => c.orden === o.id);
                        return (
                            <Seccion
                                key={o.id}
                                title={`${o.fechaProgramada || 'Sin fecha'} · ${o.tipoVisita || 'Visita'}`}
                                actions={<EstadoBadge estado={o.estado} />}
                            >
                                <p className="mb-3 text-sm">
                                    <Link to={`/ordenes/${o.id}`} className="font-bold text-blue-700 hover:underline">{o.numero}</Link>
                                    {' · '}Técnico: {o.expand?.tecnico?.nombre || '—'}
                                </p>
                                <div className="grid gap-3 text-sm sm:grid-cols-2">
                                    <div>
                                        <p className="font-semibold text-foreground">Equipos intervenidos</p>
                                        <ul className="mt-1 list-inside list-disc text-muted-foreground">
                                            {(o.equipos || []).length === 0 ? <li>Sin equipos</li> : (o.equipos || []).map((e) => (
                                                <li key={e.id}>{e.tipo} {e.marca} {e.modelo} {e.serie ? `(${e.serie})` : ''} — {e.estadoFinal || 'sin estado'}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">Materiales utilizados</p>
                                        <ul className="mt-1 list-inside list-disc text-muted-foreground">
                                            {(o.materiales || []).length === 0 ? <li>Sin materiales</li> : (o.materiales || []).map((m) => (
                                                <li key={m.id}>{m.cantidad} {m.unidad} · {m.descripcion}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">Falla / reparación</p>
                                        <p className="text-muted-foreground">{o.correctivo?.fallaEncontrada || o.motivo?.descripcion || '—'}</p>
                                        <p className="text-muted-foreground">{o.correctivo?.accion || o.cierre?.trabajo || ''}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">Cartas Oferta</p>
                                        {cartasOrden.length === 0 ? (
                                            <p className="text-muted-foreground">Sin cartas oferta</p>
                                        ) : (
                                            cartasOrden.map((c) => (
                                                <p key={c.id}>
                                                    <Link to={`/cartas/${c.id}`} className="text-blue-700 hover:underline">{c.numero}</Link> · {c.estado} · {money(totalCarta(c).total)}
                                                </p>
                                            ))
                                        )}
                                    </div>
                                </div>
                                {(o.fotos || []).length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {(o.fotos || []).map((f) => (
                                            <img key={f.id} src={f.dataUrl} alt={f.descripcion || 'Evidencia'} className="h-20 w-28 rounded object-cover" />
                                        ))}
                                    </div>
                                )}
                            </Seccion>
                        );
                    })}
                </div>
            )}
        </AppLayout>
    );
}
