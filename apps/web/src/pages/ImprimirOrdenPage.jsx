import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { getConfig } from '@/lib/db';
import { btn } from '@/components/kit';

const Fila = ({ label, valor }) => (
    <p className="text-[12px]">
        <span className="font-semibold">{label}: </span>
        {valor || '—'}
    </p>
);

const Bloque = ({ titulo, children }) => (
    <section className="doc-block mt-4">
        <h2 className="mb-1.5 border-b border-border pb-1 text-[12px] font-bold uppercase tracking-wide">{titulo}</h2>
        {children}
    </section>
);

export default function ImprimirOrdenPage() {
    const { id } = useParams();
    const [orden, setOrden] = useState(null);
    const [empresa, setEmpresa] = useState({});

    useEffect(() => {
        (async () => {
            try {
                const rec = await pb.collection('ordenes').getOne(id, { expand: 'cliente,lugar,tecnico,auxiliares' });
                setOrden(rec);
                const g = await getConfig('general');
                setEmpresa(g?.valor || {});
            } catch (err) {
                if (err?.status !== 0) setOrden(false);
            }
        })();
    }, [id]);

    if (orden === false) return <p className="p-8">No se encontró la orden.</p>;
    if (!orden) return <p className="p-8">Cargando...</p>;

    const cl = orden.expand?.cliente;
    const lu = orden.expand?.lugar;

    return (
        <div className="min-h-screen bg-muted py-6 print:bg-card print:py-0">
            <Helmet>
                <title>{`Orden ${orden.numero} PDF | Sistema CCTV`}</title>
                <meta name="description" content="Vista imprimible de la orden de trabajo de mantenimiento CCTV en formato carta." />
            </Helmet>

            <div className="no-print mx-auto mb-4 flex max-w-[8.5in] items-center justify-between px-4">
                <Link to={`/ordenes/${orden.id}`} className={btn.ghost}>
                    <ArrowLeft className="h-4 w-4" /> Volver a la orden
                </Link>
                <button type="button" className={btn.primary} onClick={() => window.print()}>
                    <Printer className="h-4 w-4" /> Descargar / Imprimir PDF
                </button>
            </div>

            <article className="doc mx-auto w-[8.5in] bg-card p-[0.6in] text-foreground shadow-lg print:shadow-none">
                <header className="flex items-start justify-between border-b-2 border-border pb-3">
                    <div className="flex items-center gap-3">
                        {empresa.logo ? (
                            <img src={empresa.logo} alt="Logo" className="h-14 w-14 object-contain" />
                        ) : (
                            <div className="grid h-14 w-14 place-items-center rounded bg-muted text-xs font-bold text-white">CCTV</div>
                        )}
                        <div>
                            <p className="text-base font-bold">{empresa.empresa || 'Seguridad Electrónica CCTV'}</p>
                            <p className="text-[11px]">{empresa.direccion}</p>
                            <p className="text-[11px]">{empresa.telefono} · {empresa.correo}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-bold uppercase">Orden de Trabajo</p>
                        <p className="text-lg font-bold">{orden.numero}</p>
                        <p className="text-[11px]">Creación: {orden.fechaCreacion}</p>
                        <p className="text-[11px]">Programada: {orden.fechaProgramada} {orden.horaProgramada}</p>
                    </div>
                </header>

                <Bloque titulo="Datos del cliente y lugar">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
                        <Fila label="Cliente / Institución" valor={cl?.nombre} />
                        <Fila label="Dependencia" valor={cl?.dependencia} />
                        <Fila label="Lugar / Sede" valor={lu?.nombre} />
                        <Fila label="Dirección" valor={lu?.direccion} />
                        <Fila label="Municipio" valor={lu?.municipio} />
                        <Fila label="Departamento" valor={lu?.departamento} />
                        <Fila label="Contacto" valor={lu?.responsable} />
                        <Fila label="Teléfono" valor={lu?.telefono} />
                    </div>
                </Bloque>

                <Bloque titulo="Datos de la visita">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
                        <Fila label="Tipo de mantenimiento" valor={orden.tipoVisita} />
                        <Fila label="Prioridad" valor={orden.prioridad} />
                        <Fila label="Estado" valor={orden.estado} />
                        <Fila label="Técnico responsable" valor={orden.expand?.tecnico?.nombre} />
                        <Fila label="Auxiliares" valor={(orden.expand?.auxiliares || []).map((t) => t.nombre).join(', ')} />
                        <Fila label="Hora llegada / finalización" valor={`${orden.horaLlegada || '—'} / ${orden.horaFinalizacion || '—'}`} />
                        <Fila label="Motivo" valor={orden.motivo?.motivo} />
                        <Fila label="Ticket" valor={orden.motivo?.ticket} />
                    </div>
                    <p className="mt-1 text-[12px]"><span className="font-semibold">Descripción: </span>{orden.motivo?.descripcion || '—'}</p>
                </Bloque>

                {(orden.equipos || []).length > 0 && (
                    <Bloque titulo="Equipos intervenidos">
                        <table className="doc-table w-full border-collapse text-[11px]">
                            <thead>
                                <tr className="bg-secondary">
                                    {['Cant.', 'Tipo', 'Marca', 'Modelo', 'Serie', 'Ubicación', 'IP', 'Estado final'].map((h) => (
                                        <th key={h} className="border border-input px-1.5 py-1 text-left">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {orden.equipos.map((e) => (
                                    <tr key={e.id}>
                                        <td className="border border-input px-1.5 py-1">{e.cantidad}</td>
                                        <td className="border border-input px-1.5 py-1">{e.tipo}</td>
                                        <td className="border border-input px-1.5 py-1">{e.marca}</td>
                                        <td className="border border-input px-1.5 py-1">{e.modelo}</td>
                                        <td className="border border-input px-1.5 py-1">{e.serie}</td>
                                        <td className="border border-input px-1.5 py-1">{e.ubicacion}</td>
                                        <td className="border border-input px-1.5 py-1">{e.ip}</td>
                                        <td className="border border-input px-1.5 py-1">{e.estadoFinal}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Bloque>
                )}

                {(orden.checklist || []).length > 0 && (
                    <Bloque titulo="Checklist de mantenimiento preventivo">
                        <table className="doc-table w-full border-collapse text-[11px]">
                            <thead>
                                <tr className="bg-secondary">
                                    {['Actividad', 'Cumple', 'No cumple', 'No aplica', 'Corregido', 'Observaciones'].map((h) => (
                                        <th key={h} className="border border-input px-1.5 py-1 text-left">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {orden.checklist.map((c) => (
                                    <tr key={c.id}>
                                        <td className="border border-input px-1.5 py-1">{c.actividad}</td>
                                        <td className="border border-input px-1.5 py-1 text-center">{c.estado === 'Cumple' ? 'X' : ''}</td>
                                        <td className="border border-input px-1.5 py-1 text-center">{c.estado === 'No cumple' ? 'X' : ''}</td>
                                        <td className="border border-input px-1.5 py-1 text-center">{c.estado === 'No aplica' ? 'X' : ''}</td>
                                        <td className="border border-input px-1.5 py-1 text-center">{c.corregido ? 'X' : ''}</td>
                                        <td className="border border-input px-1.5 py-1">{c.observaciones}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Bloque>
                )}

                <Bloque titulo="Diagnóstico y trabajo realizado">
                    <Fila label="Falla encontrada" valor={orden.correctivo?.fallaEncontrada} />
                    <Fila label="Diagnóstico técnico" valor={orden.correctivo?.diagnostico} />
                    <Fila label="Acción correctiva" valor={orden.correctivo?.accion} />
                    <Fila label="Trabajo realizado" valor={orden.cierre?.trabajo} />
                    <Fila label="Resultado" valor={orden.cierre?.resultado} />
                    <Fila label="Pendientes" valor={orden.cierre?.pendientes} />
                    <Fila label="Recomendaciones" valor={orden.cierre?.recomendaciones} />
                    <Fila label="Próxima visita recomendada" valor={`${orden.cierre?.proximaVisita || '—'} ${orden.cierre?.fechaProxima || ''}`} />
                </Bloque>

                {(orden.materiales || []).length > 0 && (
                    <Bloque titulo="Material utilizado">
                        <table className="doc-table w-full border-collapse text-[11px]">
                            <thead>
                                <tr className="bg-secondary">
                                    {['Ítem', 'Código', 'Material', 'Unidad', 'Cantidad', 'Observaciones'].map((h) => (
                                        <th key={h} className="border border-input px-1.5 py-1 text-left">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {orden.materiales.map((m, i) => (
                                    <tr key={m.id}>
                                        <td className="border border-input px-1.5 py-1">{i + 1}</td>
                                        <td className="border border-input px-1.5 py-1">{m.codigo}</td>
                                        <td className="border border-input px-1.5 py-1">{m.descripcion}</td>
                                        <td className="border border-input px-1.5 py-1">{m.unidad}</td>
                                        <td className="border border-input px-1.5 py-1">{m.cantidad}</td>
                                        <td className="border border-input px-1.5 py-1">{m.observaciones}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Bloque>
                )}

                {(orden.fotos || []).length > 0 && (
                    <Bloque titulo="Fotografías">
                        <div className="grid grid-cols-3 gap-3">
                            {orden.fotos.map((f) => (
                                <figure key={f.id} className="doc-block">
                                    <img src={f.dataUrl} alt={f.descripcion || 'Evidencia'} className="h-28 w-full border border-input object-cover" />
                                    <figcaption className="text-[10px]">{f.clasificacion} · {f.descripcion}</figcaption>
                                </figure>
                            ))}
                        </div>
                    </Bloque>
                )}

                <Bloque titulo="Firmas">
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            {orden.firmas?.tecnicoFirma ? (
                                <img src={orden.firmas.tecnicoFirma} alt="Firma del técnico" className="h-16 object-contain" />
                            ) : (
                                <div className="h-16" />
                            )}
                            <p className="border-t border-border pt-1 text-[11px] font-semibold">Técnico responsable</p>
                            <p className="text-[11px]">{orden.firmas?.tecnicoNombre || orden.expand?.tecnico?.nombre || ''}</p>
                            <p className="text-[10px]">{orden.firmas?.tecnicoFecha} {orden.firmas?.tecnicoHora}</p>
                        </div>
                        <div>
                            {orden.firmas?.clienteFirma ? (
                                <img src={orden.firmas.clienteFirma} alt="Firma del cliente" className="h-16 object-contain" />
                            ) : (
                                <div className="h-16" />
                            )}
                            <p className="border-t border-border pt-1 text-[11px] font-semibold">Responsable del cliente</p>
                            <p className="text-[11px]">{orden.firmas?.clienteNombre || ''} {orden.firmas?.clienteCargo ? `· ${orden.firmas.clienteCargo}` : ''}</p>
                            <p className="text-[10px]">{orden.firmas?.clienteFecha} {orden.firmas?.clienteHora}</p>
                        </div>
                    </div>
                </Bloque>
            </article>
        </div>
    );
}
