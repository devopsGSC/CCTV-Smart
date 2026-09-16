import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { getConfig, money } from '@/lib/db';
import { btn } from '@/components/kit';
import { totalCarta } from '@/pages/CartasPage';

export default function ImprimirCartaPage() {
    const { id } = useParams();
    const [carta, setCarta] = useState(null);
    const [empresa, setEmpresa] = useState({});

    useEffect(() => {
        (async () => {
            try {
                const rec = await pb.collection('cartas').getOne(id, { expand: 'cliente,lugar,orden' });
                setCarta(rec);
                const g = await getConfig('general');
                setEmpresa(g?.valor || {});
            } catch (err) {
                if (err?.status !== 0) setCarta(false);
            }
        })();
    }, [id]);

    if (carta === false) return <p className="p-8">No se encontró la carta oferta.</p>;
    if (!carta) return <p className="p-8">Cargando...</p>;

    const t = totalCarta(carta);
    const cl = carta.expand?.cliente;
    const lu = carta.expand?.lugar;
    const cond = carta.condiciones || {};

    return (
        <div className="min-h-screen bg-muted py-6 print:bg-card print:py-0">
            <Helmet>
                <title>{`Carta Oferta ${carta.numero} PDF | Sistema CCTV`}</title>
                <meta name="description" content="Vista imprimible comercial de la carta oferta con detalle económico y condiciones." />
            </Helmet>

            <div className="no-print mx-auto mb-4 flex max-w-[8.5in] items-center justify-between px-4">
                <Link to={`/cartas/${carta.id}`} className={btn.ghost}>
                    <ArrowLeft className="h-4 w-4" /> Volver a la carta
                </Link>
                <button type="button" className={btn.primary} onClick={() => window.print()}>
                    <Printer className="h-4 w-4" /> Descargar / Imprimir PDF
                </button>
            </div>

            <article className="doc mx-auto w-[8.5in] bg-card p-[0.6in] text-foreground shadow-lg print:shadow-none">
                <header className="flex items-start justify-between border-b-2 border-blue-800 pb-3">
                    <div className="flex items-center gap-3">
                        {empresa.logo ? (
                            <img src={empresa.logo} alt="Logo" className="h-16 w-16 object-contain" />
                        ) : (
                            <div className="grid h-16 w-16 place-items-center rounded bg-blue-800 text-xs font-bold text-white">CCTV</div>
                        )}
                        <div>
                            <p className="text-base font-bold">{empresa.empresa || 'Seguridad Electrónica CCTV'}</p>
                            <p className="text-[11px]">{empresa.direccion}</p>
                            <p className="text-[11px]">{empresa.telefono} · {empresa.correo}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-bold uppercase tracking-wide text-blue-800">Carta Oferta</p>
                        <p className="text-base font-bold">{carta.numero}</p>
                        <p className="text-[11px]">Fecha: {carta.fecha}</p>
                        <p className="text-[11px]">Estado: {carta.estado}</p>
                    </div>
                </header>

                <section className="doc-block mt-4 grid grid-cols-2 gap-x-6 gap-y-0.5 text-[12px]">
                    <p><span className="font-semibold">Cliente: </span>{cl?.nombre || '—'}</p>
                    <p><span className="font-semibold">Dependencia: </span>{cl?.dependencia || '—'}</p>
                    <p><span className="font-semibold">Lugar: </span>{lu?.nombre || '—'}</p>
                    <p><span className="font-semibold">Dirección: </span>{lu?.direccion || '—'}</p>
                    <p><span className="font-semibold">Contacto: </span>{lu?.responsable || cl?.contacto || '—'}</p>
                    <p><span className="font-semibold">Ref. Orden de Trabajo: </span>{carta.expand?.orden?.numero || '—'}</p>
                </section>

                <section className="doc-block mt-4 text-[12px]">
                    <h2 className="mb-1 text-[12px] font-bold uppercase">Diagnóstico</h2>
                    <p>{carta.diagnostico || '—'}</p>
                    <h2 className="mb-1 mt-3 text-[12px] font-bold uppercase">Alcance de los trabajos</h2>
                    <p>{cond.alcance || '—'}</p>
                </section>

                <section className="doc-block mt-4">
                    <h2 className="mb-1.5 text-[12px] font-bold uppercase">Detalle económico</h2>
                    <table className="doc-table w-full border-collapse text-[11px]">
                        <thead>
                            <tr className="bg-blue-50">
                                {['Ítem', 'Cant.', 'Unidad', 'Descripción', 'Precio unitario', 'Subtotal'].map((h) => (
                                    <th key={h} className="border border-input px-1.5 py-1 text-left">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {(carta.items || []).map((it, i) => (
                                <tr key={it.id}>
                                    <td className="border border-input px-1.5 py-1">{i + 1}</td>
                                    <td className="border border-input px-1.5 py-1">{it.cantidad}</td>
                                    <td className="border border-input px-1.5 py-1">{it.unidad}</td>
                                    <td className="border border-input px-1.5 py-1">{it.descripcion}</td>
                                    <td className="border border-input px-1.5 py-1 text-right">{money(it.precio)}</td>
                                    <td className="border border-input px-1.5 py-1 text-right">{money(Number(it.cantidad || 0) * Number(it.precio || 0))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="mt-2 ml-auto w-64 text-[11px]">
                        <div className="flex justify-between border-b border-border py-0.5"><span>Subtotal</span><span>{money(t.sub)}</span></div>
                        <div className="flex justify-between border-b border-border py-0.5"><span>Descuento</span><span>-{money(t.desc)}</span></div>
                        <div className="flex justify-between border-b border-border py-0.5"><span>Subtotal con descuento</span><span>{money(t.base)}</span></div>
                        <div className="flex justify-between border-b border-border py-0.5"><span>IVA ({Number(carta.ivaPorcentaje || 0)}%)</span><span>{money(t.iva)}</span></div>
                        <div className="flex justify-between py-1 text-[13px] font-bold"><span>Total</span><span>{money(t.total)}</span></div>
                    </div>
                </section>

                <section className="doc-block mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-[11px]">
                    <p><span className="font-semibold">Tiempo de entrega: </span>{cond.tiempoEntrega || '—'}</p>
                    <p><span className="font-semibold">Tiempo de ejecución: </span>{cond.tiempoEjecucion || '—'}</p>
                    <p><span className="font-semibold">Vigencia de la oferta: </span>{cond.vigencia || '—'}</p>
                    <p><span className="font-semibold">Forma de pago: </span>{cond.formaPago || '—'}</p>
                    <p><span className="font-semibold">Garantía: </span>{cond.garantia || '—'}</p>
                    <p><span className="font-semibold">Exclusiones: </span>{cond.exclusiones || '—'}</p>
                    <p className="col-span-2"><span className="font-semibold">Observaciones: </span>{cond.observaciones || '—'}</p>
                </section>

                <section className="doc-block mt-10 grid grid-cols-3 gap-6 text-[11px]">
                    {['Elaborado por', 'Revisado por', 'Autorizado por'].map((l) => (
                        <div key={l}>
                            <div className="h-12" />
                            <p className="border-t border-border pt-1 text-center font-semibold">{l}</p>
                        </div>
                    ))}
                </section>
            </article>
        </div>
    );
}
