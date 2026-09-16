import React, { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Save, Printer, Copy } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import AppLayout from '@/components/AppLayout';
import { Seccion, Tabla, Vacio, Cargando, Texto, AreaTexto, Selector, btn, inputCls, useToastMsg } from '@/components/kit';
import { useCollection, updateRec, createRec, money, uid, ESTADOS_CARTA, UNIDADES } from '@/lib/db';
import { totalCarta } from '@/pages/CartasPage';

export default function CartaDetallePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [carta, setCarta] = useState(null);
    const [toast, setToast] = useToastMsg();
    const [buscar, setBuscar] = useState('');
    const { items: catalogo } = useCollection('catalogo', { sort: 'descripcion' });
    const { items: clientes } = useCollection('clientes');
    const { items: lugares } = useCollection('lugares');

    const cargar = useCallback(async () => {
        try {
            const rec = await pb.collection('cartas').getOne(id, { expand: 'orden' });
            setCarta(rec);
        } catch (err) {
            if (err?.status !== 0) setToast('No se encontró la carta oferta');
        }
    }, [id, setToast]);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const set = (k) => (v) => setCarta((p) => ({ ...p, [k]: v }));
    const setSub = (grupo, k) => (v) => setCarta((p) => ({ ...p, [grupo]: { ...(p[grupo] || {}), [k]: v } }));
    const items = carta?.items || [];
    const setItems = (rows) => setCarta((p) => ({ ...p, items: rows }));
    const editItem = (iid, k, v) => setItems(items.map((r) => (r.id === iid ? { ...r, [k]: v } : r)));

    const payload = () => ({
        cliente: carta.cliente || '',
        lugar: carta.lugar || '',
        fecha: carta.fecha || '',
        diagnostico: carta.diagnostico || '',
        justificacion: carta.justificacion || '',
        items,
        descuento: Number(carta.descuento || 0),
        ivaPorcentaje: Number(carta.ivaPorcentaje || 0),
        estado: carta.estado || '',
        condiciones: carta.condiciones || {},
        aprobacion: carta.aprobacion || {},
    });

    const guardar = async () => {
        try {
            const rec = await updateRec('cartas', carta.id, payload());
            setCarta({ ...rec, expand: carta.expand });
            setToast('Carta Oferta guardada');
        } catch (err) {
            setToast(err?.message || 'Error al guardar');
        }
    };

    const nuevaVersion = async () => {
        try {
            const base = carta.numero.replace(/-V\d+$/, '');
            const existentes = await pb.collection('cartas').getList(1, 100, { filter: `numero ~ "${base}"` });
            const maxV = existentes.items.reduce((m, c) => Math.max(m, Number(c.version || 1)), 0);
            const rec = await createRec('cartas', {
                ...payload(),
                numero: `${base}-V${maxV + 1}`,
                version: maxV + 1,
                orden: carta.orden || '',
                estado: 'Modificada',
                creadoPor: carta.creadoPor || pb.authStore.record?.id || '',
            });
            setToast(`Versión ${rec.numero} creada`);
            navigate(`/cartas/${rec.id}`);
        } catch (err) {
            setToast(err?.message || 'No se pudo crear la versión');
        }
    };

    if (!carta) {
        return (
            <AppLayout title="Carta Oferta">
                <Cargando />
            </AppLayout>
        );
    }

    const t = totalCarta({ ...carta, items });
    const catalogoFiltrado = catalogo.filter((c) => `${c.codigo} ${c.descripcion}`.toLowerCase().includes(buscar.toLowerCase()));

    return (
        <AppLayout
            title={carta.numero}
            subtitle={`Versión ${carta.version} · ${carta.estado}`}
            actions={
                <>
                    <button type="button" className={btn.primary} onClick={guardar}>
                        <Save className="h-4 w-4" /> Guardar
                    </button>
                    <button type="button" className={btn.ghost} onClick={nuevaVersion}>
                        <Copy className="h-4 w-4" /> Nueva versión
                    </button>
                    <Link to={`/imprimir/carta/${carta.id}`} className={btn.soft}>
                        <Printer className="h-4 w-4" /> Descargar Carta Oferta PDF
                    </Link>
                </>
            }
        >
            <Helmet>
                <title>{`Carta Oferta ${carta.numero} | Sistema CCTV`}</title>
                <meta name="description" content="Detalle económico, condiciones, aprobación y versiones de la carta oferta." />
            </Helmet>

            <div className="space-y-6">
                <Seccion title="Datos generales">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <Texto label="N.º Carta Oferta" value={carta.numero} onChange={() => {}} disabled />
                        <Texto label="Fecha" type="date" value={carta.fecha} onChange={set('fecha')} />
                        <Selector label="Estado" value={carta.estado} onChange={set('estado')} options={ESTADOS_CARTA} />
                        <Selector label="Cliente / Institución" value={carta.cliente} onChange={set('cliente')} options={clientes.map((c) => ({ value: c.id, label: c.nombre }))} />
                        <Selector label="Lugar / Sede" value={carta.lugar} onChange={set('lugar')} options={lugares.map((c) => ({ value: c.id, label: c.nombre }))} />
                        <div className="flex flex-col gap-1.5">
                            <span className="text-xs font-semibold text-muted-foreground">Referencia Orden de Trabajo</span>
                            {carta.expand?.orden ? (
                                <Link to={`/ordenes/${carta.orden}`} className="pt-2 font-semibold text-blue-700 hover:underline">
                                    {carta.expand.orden.numero}
                                </Link>
                            ) : (
                                <span className="pt-2 text-muted-foreground">Sin orden relacionada</span>
                            )}
                        </div>
                        <AreaTexto label="Diagnóstico" className="sm:col-span-2" value={carta.diagnostico} onChange={set('diagnostico')} />
                        <AreaTexto label="Justificación de la oferta" value={carta.justificacion} onChange={set('justificacion')} />
                    </div>
                </Seccion>

                <Seccion
                    title="Detalle económico"
                    actions={
                        <>
                            <input className={`${inputCls} sm:w-56`} placeholder="Buscar en catálogo" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
                            <button
                                type="button"
                                className={btn.primary}
                                onClick={() => setItems([...items, { id: uid(), codigo: '', descripcion: '', unidad: 'Unidad', cantidad: 1, precio: 0, aprobado: true }])}
                            >
                                <Plus className="h-4 w-4" /> Agregar ítem
                            </button>
                        </>
                    }
                >
                    {buscar && (
                        <div className="mb-4 max-h-48 overflow-y-auto rounded-lg border border-border">
                            {catalogoFiltrado.slice(0, 40).map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    className="flex w-full items-center justify-between border-b border-border px-3 py-2 text-left text-sm hover:bg-blue-50"
                                    onClick={() => setItems([...items, { id: uid(), codigo: c.codigo, descripcion: c.descripcion, unidad: c.unidad, cantidad: 1, precio: c.precio, aprobado: true }])}
                                >
                                    <span>{c.codigo} · {c.descripcion}</span>
                                    <span className="font-semibold">{money(c.precio)}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {items.length === 0 ? (
                        <Vacio mensaje="Sin ítems en la oferta" />
                    ) : (
                        <Tabla columns={['Ítem', 'Cantidad', 'Unidad', 'Código', 'Descripción', 'Precio unit.', 'Subtotal', 'Aprobado', '']}>
                            {items.map((r, i) => (
                                <tr key={r.id}>
                                    <td className="px-3 py-2">{i + 1}</td>
                                    <td className="px-2 py-1.5"><input type="number" className={`${inputCls} w-20`} value={r.cantidad} onChange={(e) => editItem(r.id, 'cantidad', e.target.value)} /></td>
                                    <td className="px-2 py-1.5">
                                        <select className={`${inputCls} w-28`} value={r.unidad || ''} onChange={(e) => editItem(r.id, 'unidad', e.target.value)}>
                                            {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-2 py-1.5"><input className={`${inputCls} w-28`} value={r.codigo || ''} onChange={(e) => editItem(r.id, 'codigo', e.target.value)} /></td>
                                    <td className="px-2 py-1.5"><input className={`${inputCls} w-64`} value={r.descripcion || ''} onChange={(e) => editItem(r.id, 'descripcion', e.target.value)} /></td>
                                    <td className="px-2 py-1.5"><input type="number" step="0.01" className={`${inputCls} w-24`} value={r.precio} onChange={(e) => editItem(r.id, 'precio', e.target.value)} /></td>
                                    <td className="px-3 py-2 font-semibold">{money(Number(r.cantidad || 0) * Number(r.precio || 0))}</td>
                                    <td className="px-3 py-2 text-center">
                                        <input type="checkbox" checked={r.aprobado !== false} onChange={(e) => editItem(r.id, 'aprobado', e.target.checked)} />
                                    </td>
                                    <td className="px-2 py-1.5">
                                        <button type="button" className={btn.danger} onClick={() => setItems(items.filter((x) => x.id !== r.id))}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </Tabla>
                    )}

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-3">
                            <Texto label="Descuento" type="number" step="0.01" value={carta.descuento} onChange={set('descuento')} />
                            <Texto label="IVA (%)" type="number" step="0.01" value={carta.ivaPorcentaje} onChange={set('ivaPorcentaje')} />
                        </div>
                        <dl className="space-y-1.5 rounded-lg bg-secondary p-4 text-sm">
                            <div className="flex justify-between"><dt>Subtotal</dt><dd className="font-semibold">{money(t.sub)}</dd></div>
                            <div className="flex justify-between"><dt>Descuento</dt><dd className="font-semibold">-{money(t.desc)}</dd></div>
                            <div className="flex justify-between"><dt>Subtotal con descuento</dt><dd className="font-semibold">{money(t.base)}</dd></div>
                            <div className="flex justify-between"><dt>IVA ({Number(carta.ivaPorcentaje || 0)}%)</dt><dd className="font-semibold">{money(t.iva)}</dd></div>
                            <div className="flex justify-between border-t border-border pt-2 text-base"><dt className="font-bold">Total</dt><dd className="font-bold">{money(t.total)}</dd></div>
                        </dl>
                    </div>
                </Seccion>

                <Seccion title="Condiciones de la oferta">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <AreaTexto label="Alcance de los trabajos" value={carta.condiciones?.alcance} onChange={setSub('condiciones', 'alcance')} />
                        <AreaTexto label="Exclusiones" value={carta.condiciones?.exclusiones} onChange={setSub('condiciones', 'exclusiones')} />
                        <Texto label="Tiempo de entrega" value={carta.condiciones?.tiempoEntrega} onChange={setSub('condiciones', 'tiempoEntrega')} />
                        <Texto label="Tiempo de ejecución" value={carta.condiciones?.tiempoEjecucion} onChange={setSub('condiciones', 'tiempoEjecucion')} />
                        <Texto label="Vigencia de la oferta" value={carta.condiciones?.vigencia} onChange={setSub('condiciones', 'vigencia')} />
                        <Texto label="Forma de pago" value={carta.condiciones?.formaPago} onChange={setSub('condiciones', 'formaPago')} />
                        <Texto label="Garantía" value={carta.condiciones?.garantia} onChange={setSub('condiciones', 'garantia')} />
                        <AreaTexto label="Observaciones" value={carta.condiciones?.observaciones} onChange={setSub('condiciones', 'observaciones')} />
                    </div>
                </Seccion>

                <Seccion title="Aprobación">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <Texto label="Fecha de envío" type="date" value={carta.aprobacion?.fechaEnvio} onChange={setSub('aprobacion', 'fechaEnvio')} />
                        <Texto label="Fecha de aprobación" type="date" value={carta.aprobacion?.fechaAprobacion} onChange={setSub('aprobacion', 'fechaAprobacion')} />
                        <Texto label="Nombre de quien autoriza" value={carta.aprobacion?.autoriza} onChange={setSub('aprobacion', 'autoriza')} />
                        <Texto label="Cargo" value={carta.aprobacion?.cargo} onChange={setSub('aprobacion', 'cargo')} />
                        <AreaTexto label="Observaciones de aprobación" className="sm:col-span-2" value={carta.aprobacion?.observaciones} onChange={setSub('aprobacion', 'observaciones')} />
                    </div>
                    {carta.estado === 'Aprobada parcialmente' && (
                        <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
                            Marque en el detalle económico los ítems aprobados usando la columna &quot;Aprobado&quot;. Los totales consideran solo los ítems aprobados.
                        </p>
                    )}
                </Seccion>
            </div>
            {toast}
        </AppLayout>
    );
}
