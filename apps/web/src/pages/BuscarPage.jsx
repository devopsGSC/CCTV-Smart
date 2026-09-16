import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useSearchParams } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { Seccion, Tabla, Vacio, EstadoBadge } from '@/components/kit';
import { useCollection } from '@/lib/db';

export default function BuscarPage() {
    const [params] = useSearchParams();
    const q = (params.get('q') || '').toLowerCase();

    const { items: ordenes } = useCollection('ordenes', { expand: 'cliente,lugar,tecnico' });
    const { items: cartas } = useCollection('cartas', { expand: 'cliente,lugar,orden' });
    const { items: equipos } = useCollection('equipos', { expand: 'lugar' });

    const coincide = (obj) => JSON.stringify(obj).toLowerCase().includes(q);

    const ordRes = useMemo(() => (q ? ordenes.filter(coincide) : []), [ordenes, q]);
    const cartaRes = useMemo(() => (q ? cartas.filter(coincide) : []), [cartas, q]);
    const equipoRes = useMemo(() => (q ? equipos.filter(coincide) : []), [equipos, q]);

    return (
        <AppLayout title="Resultados de búsqueda" subtitle={q ? `Coincidencias para "${q}"` : 'Escriba un término en el buscador'}>
            <Helmet>
                <title>Búsqueda | Sistema de Mantenimiento CCTV</title>
                <meta name="description" content="Buscador global por correlativo, cliente, lugar, técnico, equipo, serie, marca o modelo." />
            </Helmet>

            <div className="space-y-6">
                <Seccion title={`Órdenes de Trabajo (${ordRes.length})`}>
                    {ordRes.length === 0 ? (
                        <Vacio mensaje="Sin coincidencias" />
                    ) : (
                        <Tabla columns={['N.º Orden', 'Fecha', 'Cliente', 'Lugar', 'Técnico', 'Estado']}>
                            {ordRes.map((o) => (
                                <tr key={o.id}>
                                    <td className="px-3 py-2 font-semibold text-blue-700">
                                        <Link to={`/ordenes/${o.id}`} className="hover:underline">{o.numero}</Link>
                                    </td>
                                    <td className="px-3 py-2">{o.fechaProgramada}</td>
                                    <td className="px-3 py-2">{o.expand?.cliente?.nombre || '—'}</td>
                                    <td className="px-3 py-2">{o.expand?.lugar?.nombre || '—'}</td>
                                    <td className="px-3 py-2">{o.expand?.tecnico?.nombre || '—'}</td>
                                    <td className="px-3 py-2"><EstadoBadge estado={o.estado} /></td>
                                </tr>
                            ))}
                        </Tabla>
                    )}
                </Seccion>

                <Seccion title={`Cartas Oferta (${cartaRes.length})`}>
                    {cartaRes.length === 0 ? (
                        <Vacio mensaje="Sin coincidencias" />
                    ) : (
                        <Tabla columns={['N.º Carta', 'Fecha', 'Cliente', 'Orden origen', 'Estado']}>
                            {cartaRes.map((c) => (
                                <tr key={c.id}>
                                    <td className="px-3 py-2 font-semibold text-blue-700">
                                        <Link to={`/cartas/${c.id}`} className="hover:underline">{c.numero}</Link>
                                    </td>
                                    <td className="px-3 py-2">{c.fecha}</td>
                                    <td className="px-3 py-2">{c.expand?.cliente?.nombre || '—'}</td>
                                    <td className="px-3 py-2">{c.expand?.orden?.numero || '—'}</td>
                                    <td className="px-3 py-2"><EstadoBadge estado={c.estado} /></td>
                                </tr>
                            ))}
                        </Tabla>
                    )}
                </Seccion>

                <Seccion title={`Equipos (${equipoRes.length})`}>
                    {equipoRes.length === 0 ? (
                        <Vacio mensaje="Sin coincidencias" />
                    ) : (
                        <Tabla columns={['Tipo', 'Marca', 'Modelo', 'Serie', 'IP', 'Lugar']}>
                            {equipoRes.map((e) => (
                                <tr key={e.id}>
                                    <td className="px-3 py-2">{e.tipo}</td>
                                    <td className="px-3 py-2">{e.marca}</td>
                                    <td className="px-3 py-2">{e.modelo}</td>
                                    <td className="px-3 py-2">{e.serie}</td>
                                    <td className="px-3 py-2">{e.ip}</td>
                                    <td className="px-3 py-2">{e.expand?.lugar?.nombre || '—'}</td>
                                </tr>
                            ))}
                        </Tabla>
                    )}
                </Seccion>
            </div>
        </AppLayout>
    );
}
