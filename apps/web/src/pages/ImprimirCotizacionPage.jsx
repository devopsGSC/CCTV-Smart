import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useParams } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import { getConfig, money } from '@/lib/db';

const calcular = (requeridos, cotizacion) => {
    const subtotal = (requeridos || []).reduce(
        (s, r) => s + Number(r.cantidad || 0) * Number(r.precio || 0), 0,
    );
    const descuentoPct = Number(cotizacion?.descuentoPct || 0);
    const ivaPct = Number(cotizacion?.ivaPorcentaje ?? 13);
    const descuentoMonto = subtotal * descuentoPct / 100;
    const subtotalConDescuento = subtotal - descuentoMonto;
    const ivaMonto = subtotalConDescuento * ivaPct / 100;
    const total = subtotalConDescuento + ivaMonto;
    return { subtotal, descuentoPct, ivaPct, descuentoMonto, subtotalConDescuento, ivaMonto, total };
};

export default function ImprimirCotizacionPage() {
    const { id } = useParams();
    const [orden, setOrden] = useState(null);
    const [cliente, setCliente] = useState(null);
    const [lugar, setLugar] = useState(null);
    const [empresa, setEmpresa] = useState({});

    useEffect(() => {
        (async () => {
            const [rec, gen] = await Promise.all([
                pb.collection('ordenes').getOne(id, { requestKey: `print-cotizacion-${id}` }),
                getConfig('general'),
            ]);
            setOrden(rec);
            setEmpresa(gen?.valor || {});
            if (rec.cliente) {
                const c = await pb.collection('clientes').getOne(rec.cliente, { requestKey: 'print-cot-cliente' });
                setCliente(c);
            }
            if (rec.lugar) {
                const l = await pb.collection('lugares').getOne(rec.lugar, { requestKey: 'print-cot-lugar' });
                setLugar(l);
            }
        })();
    }, [id]);

    useEffect(() => {
        if (orden) {
            setTimeout(() => window.print(), 600);
        }
    }, [orden]);

    if (!orden) {
        return (
            <div className="flex h-screen items-center justify-center text-muted-foreground">
                Preparando cotización…
            </div>
        );
    }

    const requeridos = (orden.requeridos || []).filter((r) => r.seleccionado !== false);
    const cotizacion = orden.cotizacion || {};
    const { subtotal, descuentoPct, ivaPct, descuentoMonto, subtotalConDescuento, ivaMonto, total } =
        calcular(requeridos, cotizacion);

    const fotos = (orden.fotos || []).slice(0, 8);
    const hoy = new Date().toLocaleDateString('es-SV', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <>
            <Helmet>
                <title>{`Cotización ${orden.numero}`}</title>
                <meta name="description" content="Cotización de materiales y servicios" />
            </Helmet>

            <style>{`
                @page { size: letter; margin: 0.6in; }
                @media print { .no-print { display: none !important; } }
                body { font-family: 'Arial', sans-serif; font-size: 11px; color: #1e293b; }
            `}</style>

            <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
                <button
                    onClick={() => window.print()}
                    className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-800"
                >
                    Imprimir / Guardar PDF
                </button>
                <button
                    onClick={() => window.close()}
                    className="rounded-md border border-input bg-card px-4 py-2 text-sm font-medium text-foreground shadow hover:bg-secondary"
                >
                    Cerrar
                </button>
            </div>

            <div className="doc mx-auto max-w-[720px] bg-card p-8" style={{ minHeight: '100vh' }}>
                {/* Encabezado */}
                <div className="doc-block mb-6 flex items-start justify-between border-b-2 border-blue-700 pb-4">
                    <div>
                        <h1 className="text-xl font-bold text-blue-800">{empresa.empresa || 'Empresa de Seguridad CCTV'}</h1>
                        <p className="text-xs text-muted-foreground">{empresa.direccion || ''}</p>
                        <p className="text-xs text-muted-foreground">{empresa.telefono || ''} · {empresa.correo || ''}</p>
                        {empresa.nit && <p className="text-xs text-muted-foreground">NIT: {empresa.nit}</p>}
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cotización</p>
                        <p className="text-2xl font-bold text-blue-700">{orden.numero}</p>
                        <p className="text-xs text-muted-foreground">Fecha: {hoy}</p>
                    </div>
                </div>

                {/* Cliente y lugar */}
                <div className="doc-block mb-5 grid grid-cols-2 gap-4 rounded-lg border border-border bg-secondary p-4 text-xs">
                    <div>
                        <p className="mb-1 font-bold uppercase text-muted-foreground">Cliente / Institución</p>
                        <p className="font-semibold text-foreground">{cliente?.nombre || '—'}</p>
                        {cliente?.dependencia && <p>{cliente.dependencia}</p>}
                        {cliente?.contacto && <p>Atención: {cliente.contacto} ({cliente.cargo || ''})</p>}
                        {cliente?.telefono && <p>{cliente.telefono}</p>}
                        {cliente?.correo && <p>{cliente.correo}</p>}
                    </div>
                    <div>
                        <p className="mb-1 font-bold uppercase text-muted-foreground">Lugar / Sede</p>
                        <p className="font-semibold text-foreground">{lugar?.nombre || '—'}</p>
                        {lugar?.direccion && <p>{lugar.direccion}</p>}
                        {lugar?.municipio && <p>{lugar.municipio}{lugar.departamento ? `, ${lugar.departamento}` : ''}</p>}
                        {lugar?.responsable && <p>Responsable: {lugar.responsable}</p>}
                    </div>
                </div>

                {/* Diagnóstico */}
                {(orden.motivo?.descripcion || orden.correctivo?.diagnostico) && (
                    <div className="doc-block mb-5">
                        <p className="mb-1 font-bold uppercase tracking-wider text-muted-foreground text-xs">Descripción del problema / Diagnóstico</p>
                        <p className="rounded border border-border bg-secondary p-3 text-xs text-foreground whitespace-pre-wrap">
                            {orden.correctivo?.diagnostico || orden.motivo?.descripcion || ''}
                        </p>
                        {orden.motivo?.motivo && (
                            <p className="mt-1 text-xs text-muted-foreground">Motivo: {orden.motivo.motivo}</p>
                        )}
                    </div>
                )}

                {/* Tabla de materiales */}
                <div className="doc-block mb-2">
                    <p className="mb-2 font-bold uppercase tracking-wider text-blue-800 text-xs border-b border-blue-200 pb-1">Detalle de materiales y servicios</p>
                    <table className="doc-table w-full border-collapse text-xs">
                        <thead>
                            <tr className="bg-blue-700 text-white">
                                <th className="border border-blue-600 px-2 py-1.5 text-left">Ítem</th>
                                <th className="border border-blue-600 px-2 py-1.5 text-left">Código</th>
                                <th className="border border-blue-600 px-2 py-1.5 text-left">Descripción</th>
                                <th className="border border-blue-600 px-2 py-1.5 text-center">Unidad</th>
                                <th className="border border-blue-600 px-2 py-1.5 text-right">Cantidad</th>
                                <th className="border border-blue-600 px-2 py-1.5 text-right">Precio unit.</th>
                                <th className="border border-blue-600 px-2 py-1.5 text-right">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requeridos.map((r, i) => (
                                <tr key={r.id} className={i % 2 === 0 ? 'bg-card' : 'bg-secondary'}>
                                    <td className="border border-border px-2 py-1.5 text-center">{i + 1}</td>
                                    <td className="border border-border px-2 py-1.5 font-mono">{r.codigo || '—'}</td>
                                    <td className="border border-border px-2 py-1.5">{r.descripcion}</td>
                                    <td className="border border-border px-2 py-1.5 text-center">{r.unidad}</td>
                                    <td className="border border-border px-2 py-1.5 text-right">{Number(r.cantidad).toLocaleString('es-SV')}</td>
                                    <td className="border border-border px-2 py-1.5 text-right">{money(r.precio)}</td>
                                    <td className="border border-border px-2 py-1.5 text-right font-semibold">{money(Number(r.cantidad || 0) * Number(r.precio || 0))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totales */}
                <div className="doc-block mb-6 flex justify-end">
                    <div className="w-64 rounded border border-border text-xs">
                        <div className="flex justify-between border-b border-border px-3 py-1.5">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-semibold">{money(subtotal)}</span>
                        </div>
                        {descuentoPct > 0 && (
                            <div className="flex justify-between border-b border-border px-3 py-1.5">
                                <span className="text-muted-foreground">Descuento ({descuentoPct}%)</span>
                                <span className="font-semibold text-rose-700">−{money(descuentoMonto)}</span>
                            </div>
                        )}
                        <div className="flex justify-between border-b border-border px-3 py-1.5">
                            <span className="text-muted-foreground">Subtotal con descuento</span>
                            <span className="font-semibold">{money(subtotalConDescuento)}</span>
                        </div>
                        <div className="flex justify-between border-b border-border px-3 py-1.5">
                            <span className="text-muted-foreground">IVA ({ivaPct}%)</span>
                            <span className="font-semibold">{money(ivaMonto)}</span>
                        </div>
                        <div className="flex justify-between bg-blue-700 px-3 py-2 text-white">
                            <span className="font-bold">TOTAL</span>
                            <span className="text-base font-bold">{money(total)}</span>
                        </div>
                    </div>
                </div>

                {/* Imágenes de diagnóstico */}
                {fotos.length > 0 && (
                    <div className="doc-block mb-6">
                        <p className="mb-2 font-bold uppercase tracking-wider text-blue-800 text-xs border-b border-blue-200 pb-1">Imágenes de diagnóstico</p>
                        <div className="grid grid-cols-4 gap-2">
                            {fotos.map((f) => (
                                <div key={f.id} className="text-center">
                                    <img src={f.dataUrl} alt={f.descripcion || 'Imagen'} className="h-28 w-full rounded border border-border object-cover" />
                                    <p className="mt-0.5 text-[9px] text-muted-foreground truncate">{f.clasificacion}</p>
                                    {f.descripcion && <p className="text-[9px] text-muted-foreground truncate">{f.descripcion}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Condiciones */}
                <div className="doc-block mb-6">
                    <p className="mb-2 font-bold uppercase tracking-wider text-blue-800 text-xs border-b border-blue-200 pb-1">Condiciones de la oferta</p>
                    {(() => {
                        const cond = cotizacion.condiciones || {};
                        const rows = [
                            ['Alcance', cond.alcance || 'Suministro e instalación de los materiales y servicios descritos.'],
                            ['Tiempo de entrega', cond.tiempoEntrega || '5 días hábiles posteriores a la aprobación.'],
                            ['Tiempo de ejecución', cond.tiempoEjecucion || '3 días hábiles.'],
                            ['Vigencia de la oferta', cond.vigencia || '15 días calendario.'],
                            ['Forma de pago', cond.formaPago || 'Crédito 30 días contra entrega de factura.'],
                            ['Garantía', cond.garantia || '12 meses en equipos y 6 meses en mano de obra.'],
                            ['Exclusiones', cond.exclusiones || 'Obra civil y trabajos eléctricos mayores.'],
                        ];
                        return (
                            <table className="w-full text-xs">
                                <tbody>
                                    {rows.map(([label, val]) => val ? (
                                        <tr key={label} className="border-b border-border">
                                            <td className="py-1 pr-3 font-semibold text-foreground w-40 align-top">{label}</td>
                                            <td className="py-1 text-muted-foreground">{val}</td>
                                        </tr>
                                    ) : null)}
                                </tbody>
                            </table>
                        );
                    })()}
                </div>

                {/* Firmas */}
                <div className="doc-block mt-8 grid grid-cols-2 gap-8">
                    <div>
                        <div className="mb-1 h-16 border-b-2 border-input" />
                        <p className="text-xs font-semibold text-foreground">Representante de la empresa</p>
                        <p className="text-[10px] text-muted-foreground">{empresa.empresa || ''}</p>
                        <p className="mt-2 text-[10px] text-muted-foreground">Fecha: ___________________</p>
                    </div>
                    <div>
                        <div className="mb-1 h-16 border-b-2 border-input" />
                        <p className="text-xs font-semibold text-foreground">Autorizado por (Cliente)</p>
                        <p className="text-[10px] text-muted-foreground">{cliente?.nombre || ''}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground">Nombre: ___________________</p>
                        <p className="mt-1 text-[10px] text-muted-foreground">Cargo: ____________________</p>
                        <p className="mt-1 text-[10px] text-muted-foreground">Fecha: ____________________</p>
                    </div>
                </div>

                {/* Pie */}
                <div className="mt-8 border-t border-border pt-3 text-center text-[9px] text-muted-foreground">
                    <p>{empresa.empresa || ''} · {empresa.direccion || ''} · {empresa.telefono || ''} · {empresa.correo || ''}</p>
                    <p className="mt-0.5">Generado el {hoy} · Orden de trabajo: {orden.numero}</p>
                </div>
            </div>
        </>
    );
}
