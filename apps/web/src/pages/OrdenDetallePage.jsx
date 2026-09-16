import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Helmet } from 'react-helmet';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    Plus, Trash2, Save, Play, CheckCircle2, FileText, Printer, X,
    ThumbsUp, ThumbsDown, AlertCircle, Search, FileOutput, Wrench, ClipboardCheck, FlaskConical,
} from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import AppLayout from '@/components/AppLayout';
import {
    Seccion, Tabla, Vacio, Cargando, Texto, AreaTexto, Selector,
    Modal, EstadoBadge, FirmaCanvas, btn, inputCls, useToastMsg,
} from '@/components/kit';
import {
    useCollection, updateRec, createRec, nextCorrelativo, getConfig, saveConfig,
    money, uid, TIPOS_VISITA, PRIORIDADES, ESTADOS_ORDEN, ESTADOS_FINALES,
    ESTADOS_CIERRE, CLASIF_FOTOS, UNIDADES,
} from '@/lib/db';

const TABS = ['General', 'Diagnóstico', 'Imágenes', 'Materiales', 'Cotización', 'Aprobación', 'Correctivo', 'Cierre'];

const ESTADOS_COTIZACION = [
    'Sin cotización',
    'Generada',
    'Enviada',
    'Pendiente de aprobación',
    'Aprobada',
    'Rechazada',
    'Modificada',
];

const leerImagen = (file) =>
    new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const escala = Math.min(1, 900 / img.width);
                const canvas = document.createElement('canvas');
                canvas.width = img.width * escala;
                canvas.height = img.height * escala;
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });

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

function TipoEquipoCombobox({ value, tipos, onChange, onCreate, placeholder = 'Buscar o crear tipo...' }) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState('');
    const [rect, setRect] = useState(null);
    const inputRef = useRef(null);
    const popRef = useRef(null);

    const openMenu = () => {
        if (inputRef.current) {
            const r = inputRef.current.getBoundingClientRect();
            setRect({ left: r.left, top: r.bottom + 4, width: Math.max(r.width, 240) });
        }
        setOpen(true);
        setQ('');
    };

    useEffect(() => {
        if (!open) return undefined;
        const handler = (e) => {
            if (inputRef.current && inputRef.current.contains(e.target)) return;
            if (popRef.current && popRef.current.contains(e.target)) return;
            setOpen(false);
        };
        const onScroll = () => setOpen(false);
        document.addEventListener('mousedown', handler);
        window.addEventListener('scroll', onScroll, true);
        return () => {
            document.removeEventListener('mousedown', handler);
            window.removeEventListener('scroll', onScroll, true);
        };
    }, [open]);

    const filtrados = useMemo(() => {
        const list = (tipos || []).slice().sort((a, b) => a.localeCompare(b));
        if (!q.trim()) return list;
        const ql = q.trim().toLowerCase();
        return list.filter((t) => t.toLowerCase().includes(ql));
    }, [tipos, q]);

    const existe = (tipos || []).some((t) => t.trim().toLowerCase() === q.trim().toLowerCase());
    const puedeCrear = q.trim() && !existe;

    const seleccionar = (t) => { onChange(t); setOpen(false); setQ(''); };
    const crear = async () => {
        const t = q.trim();
        if (!t) return;
        const nuevo = await onCreate(t);
        seleccionar(nuevo || t);
    };

    return (
        <>
            <input
                ref={inputRef}
                className={inputCls}
                value={open ? q : (value || '')}
                placeholder={placeholder}
                onFocus={openMenu}
                onChange={(e) => { if (!open) openMenu(); setQ(e.target.value); }}
            />
            {open && rect && createPortal(
                <div
                    ref={popRef}
                    className="fixed z-[70] max-h-56 overflow-y-auto rounded-md border border-border bg-card shadow-lg"
                    style={{ left: rect.left, top: rect.top, width: rect.width }}
                >
                    {filtrados.length === 0 && !puedeCrear && (
                        <p className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</p>
                    )}
                    {filtrados.map((t) => (
                        <button
                            key={t}
                            type="button"
                            className="w-full border-b border-border px-3 py-2 text-left text-sm last:border-0 hover:bg-blue-50"
                            onClick={() => seleccionar(t)}
                        >
                            {t}
                        </button>
                    ))}
                    {puedeCrear && (
                        <button
                            type="button"
                            className="w-full border-t border-border px-3 py-2 text-left text-sm font-semibold text-blue-700 hover:bg-blue-50"
                            onClick={crear}
                        >
                            <Plus className="mr-1 inline h-3.5 w-3.5" /> Crear nuevo tipo: “{q.trim()}”
                        </button>
                    )}
                </div>,
                document.body,
            )}
        </>
    );
}

function ResumenFinanciero({ requeridos, cotizacion, onChangePct, onChangeIva }) {
    const { subtotal, descuentoPct, ivaPct, descuentoMonto, subtotalConDescuento, ivaMonto, total } = calcular(requeridos, cotizacion);
    return (
        <div className="ml-auto mt-4 w-full max-w-sm space-y-2 rounded-lg border border-border bg-secondary p-4 text-sm">
            <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{money(subtotal)}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-36">Descuento (%)</span>
                <input
                    type="number" min="0" max="100" step="0.1"
                    className={`${inputCls} w-20 py-1 text-right`}
                    value={descuentoPct}
                    onChange={(e) => onChangePct(Number(e.target.value))}
                />
                <span className="ml-auto font-semibold text-rose-700">−{money(descuentoMonto)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">Subtotal con descuento</span>
                <span className="font-semibold">{money(subtotalConDescuento)}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-36">IVA (%)</span>
                <input
                    type="number" min="0" max="100" step="0.1"
                    className={`${inputCls} w-20 py-1 text-right`}
                    value={ivaPct}
                    onChange={(e) => onChangeIva(Number(e.target.value))}
                />
                <span className="ml-auto font-semibold">{money(ivaMonto)}</span>
            </div>
            <div className="flex justify-between border-t-2 border-border pt-2 text-base">
                <span className="font-bold text-foreground">TOTAL</span>
                <span className="font-bold text-blue-700">{money(total)}</span>
            </div>
        </div>
    );
}

function ModalAgregarMaterial({ open, onClose, catalogo, onAdd }) {
    const [buscar, setBuscar] = useState('');
    const [seleccionado, setSeleccionado] = useState(null);
    const [form, setForm] = useState({ codigo: '', descripcion: '', unidad: 'Unidad', cantidad: 1, precio: 0 });

    useEffect(() => {
        if (open) {
            setBuscar('');
            setSeleccionado(null);
            setForm({ codigo: '', descripcion: '', unidad: 'Unidad', cantidad: 1, precio: 0 });
        }
    }, [open]);

    const filtrado = useMemo(
        () => catalogo.filter((c) =>
            `${c.codigo} ${c.descripcion} ${c.categoria}`.toLowerCase().includes(buscar.toLowerCase()),
        ).slice(0, 30),
        [catalogo, buscar],
    );

    const elegir = (c) => {
        setSeleccionado(c);
        setForm({ codigo: c.codigo, descripcion: c.descripcion, unidad: c.unidad || 'Unidad', cantidad: 1, precio: c.precio || 0 });
    };

    const subtotal = Number(form.cantidad || 0) * Number(form.precio || 0);

    const handleAdd = () => {
        if (!form.descripcion) return;
        onAdd({ id: uid(), seleccionado: true, ...form, cantidad: Number(form.cantidad), precio: Number(form.precio) });
        onClose();
    };

    if (!open) return null;
    return (
        <Modal open={open} onClose={onClose} title="Agregar material / servicio" wide>
            <div className="space-y-4">
                <div>
                    <label className="text-xs font-semibold text-muted-foreground">Buscar en catálogo</label>
                    <div className="relative mt-1.5">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            className={`${inputCls} pl-8`}
                            placeholder="Código, descripción o categoría..."
                            value={buscar}
                            onChange={(e) => setBuscar(e.target.value)}
                            autoFocus
                        />
                    </div>
                    {buscar && (
                        <div className="mt-1 max-h-44 overflow-y-auto rounded-md border border-border bg-card">
                            {filtrado.length === 0 ? (
                                <p className="p-3 text-sm text-muted-foreground">Sin resultados</p>
                            ) : filtrado.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => elegir(c)}
                                    className={`flex w-full items-center justify-between border-b border-border px-3 py-2 text-left text-sm hover:bg-blue-50 ${seleccionado?.id === c.id ? 'bg-blue-50 font-semibold' : ''}`}
                                >
                                    <span className="flex-1">{c.codigo && <span className="mr-2 font-mono text-muted-foreground">{c.codigo}</span>}{c.descripcion}</span>
                                    <span className="ml-4 shrink-0 font-semibold text-blue-700">{money(c.precio)}/{c.unidad}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-muted-foreground">Código</span>
                        <input className={inputCls} value={form.codigo} onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))} />
                    </label>
                    <label className="flex flex-col gap-1.5 sm:col-span-2">
                        <span className="text-xs font-semibold text-muted-foreground">Descripción *</span>
                        <input className={inputCls} value={form.descripcion} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))} />
                    </label>
                    <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-muted-foreground">Unidad de medida</span>
                        <select className={inputCls} value={form.unidad} onChange={(e) => setForm((p) => ({ ...p, unidad: e.target.value }))}>
                            {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-muted-foreground">Cantidad</span>
                        <input type="number" min="1" step="0.01" className={inputCls} value={form.cantidad} onChange={(e) => setForm((p) => ({ ...p, cantidad: e.target.value }))} />
                    </label>
                    <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-muted-foreground">Precio unitario</span>
                        <input type="number" min="0" step="0.01" className={inputCls} value={form.precio} onChange={(e) => setForm((p) => ({ ...p, precio: e.target.value }))} />
                    </label>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-muted-foreground">Subtotal</span>
                        <p className="rounded-md border border-border bg-secondary px-3 py-2 text-sm font-bold text-blue-700">{money(subtotal)}</p>
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                    <button type="button" className={btn.ghost} onClick={onClose}>Cancelar</button>
                    <button type="button" className={btn.primary} onClick={handleAdd} disabled={!form.descripcion}>
                        <Plus className="h-4 w-4" /> Agregar material
                    </button>
                </div>
            </div>
        </Modal>
    );
}

/* ─── Resumen financiero materiales correctivo ─── */
function ResumenCorr({ items, cotizacion, onChangePct, onChangeIva }) {
    const subtotal = (items || []).reduce((s, r) => s + Number(r.cantidad || 0) * Number(r.precio || 0), 0);
    const descuentoPct = Number(cotizacion?.descCorrPct || 0);
    const ivaPct = Number(cotizacion?.ivaCorrPct ?? 13);
    const descuentoMonto = subtotal * descuentoPct / 100;
    const subtotalConDescuento = subtotal - descuentoMonto;
    const ivaMonto = subtotalConDescuento * ivaPct / 100;
    const total = subtotalConDescuento + ivaMonto;
    return (
        <div className="ml-auto mt-4 w-full max-w-sm space-y-2 rounded-xl border border-border bg-card p-5 shadow-sm text-sm">
            <p className="text-xs font-bold text-muted-foreground mb-3">Resumen financiero</p>
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-semibold">{money(subtotal)}</span></div>
            <div className="flex items-center gap-2">
                <span className="text-muted-foreground flex-1">Descuento (%)</span>
                <input type="number" min="0" max="100" step="0.1" className={`${inputCls} w-20 py-1 text-right`} value={descuentoPct} onChange={(e) => onChangePct(Number(e.target.value))} />
                <span className="text-rose-700 font-semibold w-24 text-right">−{money(descuentoMonto)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2"><span className="text-muted-foreground">Subtotal con descuento</span><span className="font-semibold">{money(subtotalConDescuento)}</span></div>
            <div className="flex items-center gap-2">
                <span className="text-muted-foreground flex-1">IVA (%)</span>
                <input type="number" min="0" max="100" step="0.1" className={`${inputCls} w-20 py-1 text-right`} value={ivaPct} onChange={(e) => onChangeIva(Number(e.target.value))} />
                <span className="font-semibold w-24 text-right">{money(ivaMonto)}</span>
            </div>
            <div className="flex justify-between border-t-2 border-border pt-2 text-base"><span className="font-bold text-foreground">TOTAL</span><span className="font-bold text-blue-700">{money(total)}</span></div>
        </div>
    );
}

/* ─── Panel completo pestaña Correctivo ─── */
function CorrectivoPanelFull({ orden, habilitado, hayMateriales, catalogo, config, setSub, filas, setFilas, editFila, guardar, setToast, reloadCartas, clienteSel, lugarSel }) {
    const [modalMat, setModalMat] = useState(false);
    const [generando, setGenerando] = useState(false);
    const setCot = (k, v) => setSub('correctivo', k)(v);

    const items = filas('corrMateriales') || [];
    const cotizacion = orden?.correctivo || {};

    const generarCarta = async () => {
        setGenerando(true);
        try {
            const numero = await nextCorrelativo('cartas', 'CO-CCTV');
            const subtotal = items.reduce((s, r) => s + Number(r.cantidad || 0) * Number(r.precio || 0), 0);
            const descuentoPct = Number(cotizacion?.descCorrPct || 0);
            const ivaPct = Number(cotizacion?.ivaCorrPct ?? 13);
            const diagFotos = (filas('fotos') || []).filter((f) => f.clasificacion === 'Evidencia' || f.clasificacion === 'Diagnóstico' || f.clasificacion === 'Antes' || f.clasificacion === 'Después');
            const cartaData = {
                numero,
                version: 1,
                orden: orden.id,
                cliente: orden.cliente || '',
                lugar: orden.lugar || '',
                fecha: new Date().toISOString().slice(0, 10),
                diagnostico: cotizacion?.diagnostico || cotizacion?.fallaEncontrada || '',
                justificacion: cotizacion?.accion || '',
                items: items.map((r) => ({ ...r })),
                descuento: subtotal * descuentoPct / 100,
                ivaPorcentaje: ivaPct,
                estado: 'Borrador',
                condiciones: { alcance: cotizacion?.accion || '', observaciones: cotizacion?.recomendacion || '' },
                aprobacion: {},
            };
            await import('@/lib/pocketbaseClient').then(({ default: pb }) => pb.collection('cartas').create(cartaData));
            await reloadCartas();
            setToast('Carta Oferta generada correctamente — revísela en la pestaña Cotización');
        } catch (err) {
            setToast(err?.message || 'Error al generar carta oferta');
        }
        setGenerando(false);
    };

    return (
        <div className="space-y-6">
            {!habilitado && hayMateriales && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                    <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-semibold">Cotización pendiente de aprobación</p>
                        <p>La cotización debe estar aprobada para registrar el mantenimiento correctivo. Vaya a la pestaña <strong>Aprobación</strong>.</p>
                    </div>
                </div>
            )}

            {/* Sección 1: Diagnóstico */}
            <Seccion title="1. Diagnóstico">
                <div className="flex items-center gap-2 mb-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-700"><AlertCircle className="h-4 w-4" /></span>
                    <p className="text-xs text-muted-foreground">Descripción de las fallas encontradas durante el mantenimiento</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <AreaTexto label="Falla reportada" value={orden.correctivo?.fallaReportada} onChange={setSub('correctivo', 'fallaReportada')} />
                    <AreaTexto label="Falla encontrada" value={orden.correctivo?.fallaEncontrada} onChange={setSub('correctivo', 'fallaEncontrada')} />
                    <AreaTexto label="Diagnóstico técnico" value={orden.correctivo?.diagnostico} onChange={setSub('correctivo', 'diagnostico')} />
                    <AreaTexto label="Causa probable" value={orden.correctivo?.causa} onChange={setSub('correctivo', 'causa')} />
                </div>
            </Seccion>

            {/* Sección 2: Acciones */}
            <Seccion title="2. Acciones correctivas">
                <div className="flex items-center gap-2 mb-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><Wrench className="h-4 w-4" /></span>
                    <p className="text-xs text-muted-foreground">Trabajos realizados para corregir las fallas detectadas</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Texto label="Equipo afectado" value={orden.correctivo?.equipoAfectado} onChange={setSub('correctivo', 'equipoAfectado')} />
                    <Texto label="Repuesto sustituido" value={orden.correctivo?.repuesto} onChange={setSub('correctivo', 'repuesto')} />
                    <AreaTexto label="Acción correctiva realizada" value={orden.correctivo?.accion} onChange={setSub('correctivo', 'accion')} />
                    <AreaTexto label="Configuración realizada" value={orden.correctivo?.configuracion} onChange={setSub('correctivo', 'configuracion')} />
                </div>
            </Seccion>

            {/* Sección 3: Pruebas */}
            <Seccion title="3. Pruebas y resultado">
                <div className="flex items-center gap-2 mb-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700"><FlaskConical className="h-4 w-4" /></span>
                    <p className="text-xs text-muted-foreground">Verificación del correcto funcionamiento después de las acciones</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <AreaTexto label="Pruebas efectuadas" value={orden.correctivo?.pruebas} onChange={setSub('correctivo', 'pruebas')} />
                    <AreaTexto label="Resultado" value={orden.correctivo?.resultado} onChange={setSub('correctivo', 'resultado')} />
                    <AreaTexto label="Recomendación técnica" className="sm:col-span-2" value={orden.correctivo?.recomendacion} onChange={setSub('correctivo', 'recomendacion')} />
                    <Selector label="Estado final del equipo" value={orden.correctivo?.estadoFinal} onChange={setSub('correctivo', 'estadoFinal')} options={ESTADOS_FINALES} />
                </div>
            </Seccion>

            {/* Sección 4: Materiales utilizados */}
            <Seccion
                title="4. Materiales utilizados"
                actions={
                    <button type="button" className={btn.primary} onClick={() => setModalMat(true)}>
                        <Plus className="h-4 w-4" /> Agregar material utilizado
                    </button>
                }
            >
                <div className="flex items-center gap-2 mb-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 text-orange-700"><ClipboardCheck className="h-4 w-4" /></span>
                    <p className="text-xs text-muted-foreground">Materiales y repuestos empleados durante el mantenimiento correctivo</p>
                </div>
                {items.length === 0 ? (
                    <Vacio mensaje="Sin materiales registrados. Use el botón para agregar." />
                ) : (
                    <>
                        <Tabla columns={['Ítem', 'Código', 'Descripción', 'Unidad', 'Cantidad', 'Precio unit.', 'Subtotal', '']}>
                            {items.map((r, i) => (
                                <tr key={r.id}>
                                    <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                                    <td className="px-2 py-1.5"><input className={`${inputCls} w-24`} value={r.codigo || ''} onChange={(e) => editFila('corrMateriales', r.id, 'codigo', e.target.value)} /></td>
                                    <td className="px-2 py-1.5"><input className={`${inputCls} w-48`} value={r.descripcion || ''} onChange={(e) => editFila('corrMateriales', r.id, 'descripcion', e.target.value)} /></td>
                                    <td className="px-2 py-1.5">
                                        <select className={`${inputCls} w-28`} value={r.unidad || 'Unidad'} onChange={(e) => editFila('corrMateriales', r.id, 'unidad', e.target.value)}>
                                            {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-2 py-1.5"><input type="number" step="0.01" min="0" className={`${inputCls} w-20`} value={r.cantidad} onChange={(e) => editFila('corrMateriales', r.id, 'cantidad', e.target.value)} /></td>
                                    <td className="px-2 py-1.5"><input type="number" step="0.01" min="0" className={`${inputCls} w-24`} value={r.precio} onChange={(e) => editFila('corrMateriales', r.id, 'precio', e.target.value)} /></td>
                                    <td className="px-3 py-2 font-semibold text-blue-700">{money(Number(r.cantidad || 0) * Number(r.precio || 0))}</td>
                                    <td className="px-2 py-1.5">
                                        <button type="button" className={btn.danger} onClick={() => setFilas('corrMateriales', items.filter((x) => x.id !== r.id))}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </Tabla>
                        <ResumenCorr
                            items={items}
                            cotizacion={orden.correctivo}
                            onChangePct={(v) => setSub('correctivo', 'descCorrPct')(v)}
                            onChangeIva={(v) => setSub('correctivo', 'ivaCorrPct')(v)}
                        />
                    </>
                )}
            </Seccion>

            {/* Sección 5: Generar Carta Oferta */}
            <Seccion title="5. Generar Carta Oferta">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground mb-1">Crear Carta Oferta formal</p>
                        <p className="text-sm text-muted-foreground">Se generará automáticamente una Carta Oferta con los materiales utilizados, diagnóstico, cliente y lugar de esta orden. Estado inicial: <strong>Borrador</strong>.</p>
                    </div>
                    <button
                        type="button"
                        disabled={items.length === 0 || generando}
                        className={`shrink-0 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition active:scale-[0.98] ${items.length === 0 ? 'bg-secondary text-muted-foreground cursor-not-allowed' : 'bg-blue-700 text-white hover:bg-blue-800 shadow-md hover:shadow-lg'}`}
                        onClick={generarCarta}
                        title={items.length === 0 ? 'Agregue materiales primero' : 'Generar Carta Oferta'}
                    >
                        <FileOutput className="h-5 w-5" />
                        {generando ? 'Generando...' : 'Generar Carta Oferta'}
                    </button>
                </div>
                {items.length === 0 && (
                    <p className="mt-3 text-xs text-amber-700">Agregue al menos un material utilizado para poder generar la Carta Oferta.</p>
                )}
            </Seccion>

            {/* Modal agregar material en correctivo */}
            <ModalMaterialCorr
                open={modalMat}
                onClose={() => setModalMat(false)}
                catalogo={catalogo}
                onAdd={(item) => setFilas('corrMateriales', [...items, item])}
            />
        </div>
    );
}

function ModalMaterialCorr({ open, onClose, catalogo, onAdd }) {
    const [form, setForm] = useState({ codigo: '', descripcion: '', unidad: 'Unidad', cantidad: 1, precio: 0 });
    const [busq, setBusq] = useState('');
    const subtotal = Number(form.cantidad || 0) * Number(form.precio || 0);
    const filtrados = catalogo.filter((c) => !busq || `${c.codigo} ${c.descripcion} ${c.categoria}`.toLowerCase().includes(busq.toLowerCase())).slice(0, 12);

    const handleAdd = () => {
        onAdd({ id: uid(), ...form, cantidad: Number(form.cantidad), precio: Number(form.precio) });
        setForm({ codigo: '', descripcion: '', unidad: 'Unidad', cantidad: 1, precio: 0 });
        setBusq('');
        onClose();
    };

    return (
        <Modal open={open} onClose={onClose} title="Agregar material utilizado">
            <div className="space-y-4">
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Buscar en catálogo</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input className={`${inputCls} pl-9`} placeholder="Código, descripción o categoría..." value={busq} onChange={(e) => setBusq(e.target.value)} />
                    </div>
                    {busq && filtrados.length > 0 && (
                        <div className="mt-1 rounded-md border border-border bg-card shadow-sm max-h-48 overflow-y-auto">
                            {filtrados.map((c) => (
                                <button key={c.id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-border last:border-0"
                                    onClick={() => { setForm((p) => ({ ...p, codigo: c.codigo || '', descripcion: c.descripcion, unidad: c.unidad || 'Unidad', precio: c.precio || 0 })); setBusq(''); }}>
                                    <span className="font-semibold text-blue-700">{c.codigo}</span>{' — '}{c.descripcion}
                                    <span className="ml-2 text-xs text-muted-foreground">{c.categoria}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-muted-foreground">Código</span>
                        <input className={inputCls} value={form.codigo} onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))} />
                    </label>
                    <label className="flex flex-col gap-1.5 sm:col-span-2">
                        <span className="text-xs font-semibold text-muted-foreground">Descripción</span>
                        <input className={inputCls} value={form.descripcion} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))} />
                    </label>
                    <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-muted-foreground">Unidad</span>
                        <select className={inputCls} value={form.unidad} onChange={(e) => setForm((p) => ({ ...p, unidad: e.target.value }))}>
                            {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-muted-foreground">Cantidad</span>
                        <input type="number" min="0" step="0.01" className={inputCls} value={form.cantidad} onChange={(e) => setForm((p) => ({ ...p, cantidad: e.target.value }))} />
                    </label>
                    <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-muted-foreground">Precio unitario</span>
                        <input type="number" min="0" step="0.01" className={inputCls} value={form.precio} onChange={(e) => setForm((p) => ({ ...p, precio: e.target.value }))} />
                    </label>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-muted-foreground">Subtotal</span>
                        <p className="rounded-md border border-border bg-secondary px-3 py-2 text-sm font-bold text-blue-700">{money(subtotal)}</p>
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                    <button type="button" className={btn.ghost} onClick={onClose}>Cancelar</button>
                    <button type="button" className={btn.primary} onClick={handleAdd} disabled={!form.descripcion}>
                        <Plus className="h-4 w-4" /> Agregar material
                    </button>
                </div>
            </div>
        </Modal>
    );
}

export default function OrdenDetallePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [orden, setOrden] = useState(null);
    const [tab, setTab] = useState('General');
    const [config, setConfig] = useState({ actividades: [], tiposEquipo: [], general: { iva: 13 } });
    const [toast, setToast] = useToastMsg();
    const [modalCliente, setModalCliente] = useState(false);
    const [modalLugar, setModalLugar] = useState(false);
    const [modalMaterial, setModalMaterial] = useState(false);
    const [nuevoTipo, setNuevoTipo] = useState('');
    const [fotoAmpliada, setFotoAmpliada] = useState(null);
    const [confirmAccion, setConfirmAccion] = useState(null);

    const { items: clientes, reload: reloadClientes } = useCollection('clientes');
    const { items: lugares, reload: reloadLugares } = useCollection('lugares');
    const { items: tecnicos } = useCollection('tecnicos');
    const { items: catalogo } = useCollection('catalogo', { sort: 'descripcion' });
    const { items: cartas, reload: reloadCartas } = useCollection('cartas', { filter: `orden = "${id}"` });

    const cargar = useCallback(async () => {
        try {
            const rec = await pb.collection('ordenes').getOne(id, { requestKey: `orden-${id}` });
            setOrden(rec);
        } catch (err) {
            if (err?.status !== 0) setToast('No se encontró la orden');
        }
    }, [id, setToast]);

    useEffect(() => { cargar(); }, [cargar]);

    useEffect(() => {
        (async () => {
            const [gen, act, tipos] = await Promise.all([
                getConfig('general'),
                getConfig('actividades'),
                getConfig('tiposEquipo'),
            ]);
            setConfig({
                general: gen?.valor || { iva: 13 },
                actividades: act?.valor || [],
                tiposEquipo: tipos?.valor || [],
            });
        })();
    }, []);

    const set = (k) => (v) => setOrden((p) => ({ ...p, [k]: v }));
    const setSub = (grupo, k) => (v) => setOrden((p) => ({ ...p, [grupo]: { ...(p[grupo] || {}), [k]: v } }));

    const guardar = async (extra = {}) => {
        if (!orden) return;
        const data = {
            fechaProgramada: orden.fechaProgramada || '',
            horaProgramada: orden.horaProgramada || '',
            horaLlegada: orden.horaLlegada || '',
            horaFinalizacion: orden.horaFinalizacion || '',
            cliente: orden.cliente || '',
            lugar: orden.lugar || '',
            tecnico: orden.tecnico || '',
            auxiliares: orden.auxiliares || [],
            tipoVisita: orden.tipoVisita || '',
            prioridad: orden.prioridad || '',
            estado: orden.estado || '',
            motivo: orden.motivo || {},
            equipos: orden.equipos || [],
            checklist: orden.checklist || [],
            correctivo: orden.correctivo || {},
            corrMateriales: orden.corrMateriales || [],
            materiales: orden.materiales || [],
            requeridos: orden.requeridos || [],
            fotos: orden.fotos || [],
            cierre: orden.cierre || {},
            firmas: orden.firmas || {},
            cotizacion: orden.cotizacion || {},
            ...extra,
        };
        try {
            const rec = await updateRec('ordenes', orden.id, data);
            setOrden(rec);
            setToast('Orden guardada');
        } catch (err) {
            setToast(err?.message || 'Error al guardar');
        }
    };

    const lugaresCliente = useMemo(
        () => lugares.filter((l) => !orden?.cliente || l.cliente === orden.cliente),
        [lugares, orden?.cliente],
    );
    const lugarSel = lugares.find((l) => l.id === orden?.lugar);
    const clienteSel = clientes.find((c) => c.id === orden?.cliente);
    const tecnicoSel = tecnicos.find((t) => t.id === orden?.tecnico);

    const filas = (k) => orden?.[k] || [];
    const setFilas = (k, rows) => setOrden((p) => ({ ...p, [k]: rows }));
    const editFila = (k, fid, campo, valor) =>
        setFilas(k, filas(k).map((r) => (r.id === fid ? { ...r, [campo]: valor } : r)));

    const cotizacion = orden?.cotizacion || {};
    const setCotizacion = (k, v) => setOrden((p) => ({ ...p, cotizacion: { ...(p.cotizacion || {}), [k]: v } }));
    const estadoCot = cotizacion.estado || 'Sin cotización';
    const cotizacionAprobada = estadoCot === 'Aprobada';
    const hayMateriales = filas('requeridos').length > 0;

    const { subtotal, descuentoPct, ivaPct, descuentoMonto, subtotalConDescuento, ivaMonto, total } =
        calcular(filas('requeridos'), cotizacion);

    const guardarCliente = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const rec = await createRec('clientes', Object.fromEntries(fd.entries()));
        await reloadClientes();
        setOrden((p) => ({ ...p, cliente: rec.id }));
        setModalCliente(false);
        setToast('Cliente registrado');
    };

    const guardarLugar = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const rec = await createRec('lugares', { ...Object.fromEntries(fd.entries()), cliente: orden.cliente || '' });
        await reloadLugares();
        setOrden((p) => ({ ...p, lugar: rec.id }));
        setModalLugar(false);
        setToast('Lugar registrado');
    };

    const subirFotos = async (files) => {
        const nuevas = [];
        for (const file of Array.from(files)) {
            const dataUrl = await leerImagen(file);
            nuevas.push({
                id: uid(), dataUrl,
                clasificacion: 'Evidencia',
                descripcion: file.name,
                fecha: new Date().toISOString().slice(0, 10),
            });
        }
        setFilas('fotos', [...filas('fotos'), ...nuevas]);
        setToast('Fotografías agregadas (recuerde guardar)');
    };

    const agregarActividadesFaltantes = () => {
        const actuales = filas('checklist');
        const nuevas = config.actividades
            .filter((a) => !actuales.some((c) => c.actividad === a))
            .map((a) => ({ id: uid(), actividad: a, estado: '', corregido: false, observaciones: '' }));
        setFilas('checklist', [...actuales, ...nuevas]);
    };

    const agregarTipoEquipo = async (nombre) => {
        const limpio = String(nombre || '').trim();
        if (!limpio) return null;
        const actuales = config.tiposEquipo || [];
        if (actuales.some((t) => t.toLowerCase() === limpio.toLowerCase())) {
            return limpio;
        }
        const nuevos = [...actuales, limpio].sort((a, b) => a.localeCompare(b));
        try {
            await saveConfig('tiposEquipo', nuevos);
            setConfig((p) => ({ ...p, tiposEquipo: nuevos }));
            setToast(`Tipo de equipo “${limpio}” agregado`);
        } catch (err) {
            setToast(err?.message || 'No se pudo guardar el tipo de equipo');
        }
        return limpio;
    };

    const aprobarCotizacion = async () => {
        const nuevaCot = {
            ...cotizacion,
            estado: 'Aprobada',
            fechaAprobacion: new Date().toISOString().slice(0, 10),
        };
        await guardar({ cotizacion: nuevaCot, estado: 'En proceso' });
        setToast('Cotización aprobada — Puede iniciar el mantenimiento correctivo');
        setConfirmAccion(null);
    };

    const rechazarCotizacion = async () => {
        const nuevaCot = {
            ...cotizacion,
            estado: 'Rechazada',
        };
        await guardar({ cotizacion: nuevaCot });
        setToast('Cotización rechazada — Modifique los materiales y regenere la cotización');
        setConfirmAccion(null);
    };

    const marcarEnviada = async () => {
        const nuevaCot = {
            ...cotizacion,
            estado: 'Enviada',
            fechaEnvio: cotizacion.fechaEnvio || new Date().toISOString().slice(0, 10),
        };
        await guardar({ cotizacion: nuevaCot });
        setToast('Cotización marcada como enviada');
    };

    const estadoCotColor = {
        'Sin cotización': 'bg-secondary text-muted-foreground border-border',
        'Generada': 'bg-blue-50 text-blue-700 border-blue-200',
        'Enviada': 'bg-indigo-50 text-indigo-700 border-indigo-200',
        'Pendiente de aprobación': 'bg-amber-50 text-amber-700 border-amber-200',
        'Aprobada': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'Rechazada': 'bg-rose-50 text-rose-700 border-rose-200',
        'Modificada': 'bg-orange-50 text-orange-700 border-orange-200',
    };

    const cotBadge = (
        <span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${estadoCotColor[estadoCot] || 'bg-secondary text-muted-foreground'}`}>
            Cotización: {estadoCot}
        </span>
    );

    if (!orden) {
        return <AppLayout title="Orden de Trabajo"><Cargando /></AppLayout>;
    }

    const correctivoHabilitado = !hayMateriales || cotizacionAprobada;

    return (
        <AppLayout
            title={orden.numero}
            subtitle={`${orden.tipoVisita || 'Sin tipo'} · ${clienteSel?.nombre || 'Sin cliente'} · ${lugarSel?.nombre || 'Sin lugar'}`}
            actions={
                <>
                    <button type="button" className={btn.primary} onClick={() => guardar()}>
                        <Save className="h-4 w-4" /> Guardar
                    </button>
                    <button
                        type="button"
                        className={correctivoHabilitado ? btn.ghost : `${btn.ghost} opacity-50 cursor-not-allowed`}
                        title={!correctivoHabilitado ? 'La cotización debe estar aprobada para iniciar' : ''}
                        onClick={() => {
                            if (!correctivoHabilitado) { setToast('Apruebe la cotización antes de iniciar el mantenimiento correctivo'); return; }
                            guardar({ estado: 'En proceso', horaLlegada: orden.horaLlegada || new Date().toTimeString().slice(0, 5) });
                        }}
                    >
                        <Play className="h-4 w-4" /> Iniciar correctivo
                    </button>
                    <button type="button" className={btn.ghost} onClick={() => guardar({ estado: 'Finalizada', horaFinalizacion: new Date().toTimeString().slice(0, 5) })}>
                        <CheckCircle2 className="h-4 w-4" /> Finalizar
                    </button>
                    <Link to={`/imprimir/orden/${orden.id}`} className={btn.ghost}>
                        <Printer className="h-4 w-4" /> PDF Orden
                    </Link>
                    {cotBadge}
                </>
            }
        >
            <Helmet>
                <title>{`Orden ${orden.numero} | Sistema CCTV`}</title>
                <meta name="description" content="Detalle de orden de trabajo con diagnóstico, materiales, cotización, aprobación y cierre." />
            </Helmet>

            <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1.5 shadow-sm">
                {TABS.map((t) => {
                    const disabled = t === 'Correctivo' && !correctivoHabilitado && hayMateriales;
                    return (
                        <button
                            key={t}
                            type="button"
                            onClick={() => { if (disabled) { setToast('Apruebe la cotización para acceder a esta sección'); return; } setTab(t); }}
                            className={`relative whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                                tab === t ? 'bg-blue-700 text-white' : disabled ? 'text-muted-foreground cursor-not-allowed' : 'text-muted-foreground hover:bg-secondary'
                            }`}
                        >
                            {t}
                            {t === 'Correctivo' && !correctivoHabilitado && hayMateriales && (
                                <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-amber-400 text-[8px] text-white">!</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── GENERAL ── */}
            {tab === 'General' && (
                <div className="space-y-6">
                    <Seccion title="Información general">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <Texto label="N.º Orden" value={orden.numero} onChange={() => {}} disabled />
                            <Texto label="Fecha de creación" value={orden.fechaCreacion} onChange={() => {}} disabled />
                            <Texto label="Fecha programada" type="date" value={orden.fechaProgramada} onChange={set('fechaProgramada')} />
                            <Texto label="Hora programada" type="time" value={orden.horaProgramada} onChange={set('horaProgramada')} />
                            <Texto label="Hora de llegada" type="time" value={orden.horaLlegada} onChange={set('horaLlegada')} />
                            <Texto label="Hora de finalización" type="time" value={orden.horaFinalizacion} onChange={set('horaFinalizacion')} />
                            <Selector label="Tipo de visita" value={orden.tipoVisita} onChange={set('tipoVisita')} options={TIPOS_VISITA} />
                            <Selector label="Prioridad" value={orden.prioridad} onChange={set('prioridad')} options={PRIORIDADES} />
                            <Selector label="Estado" value={orden.estado} onChange={set('estado')} options={ESTADOS_ORDEN} />
                        </div>
                    </Seccion>

                    <Seccion
                        title="Cliente y lugar"
                        actions={
                            <>
                                <button type="button" className={btn.ghost} onClick={() => setModalCliente(true)}>
                                    <Plus className="h-3.5 w-3.5" /> Nuevo cliente
                                </button>
                                <button type="button" className={btn.ghost} onClick={() => setModalLugar(true)}>
                                    <Plus className="h-3.5 w-3.5" /> Nuevo lugar
                                </button>
                            </>
                        }
                    >
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <Selector label="Cliente / Institución" value={orden.cliente} onChange={(v) => setOrden((p) => ({ ...p, cliente: v, lugar: '' }))} options={clientes.map((c) => ({ value: c.id, label: c.nombre }))} />
                            <Selector label="Lugar / Sede" value={orden.lugar} onChange={set('lugar')} options={lugaresCliente.map((l) => ({ value: l.id, label: l.nombre }))} />
                            <Selector label="Técnico responsable" value={orden.tecnico} onChange={set('tecnico')} options={tecnicos.map((t) => ({ value: t.id, label: t.nombre }))} />
                            <div className="sm:col-span-2 lg:col-span-3">
                                <span className="text-xs font-semibold text-muted-foreground">Técnicos auxiliares</span>
                                <div className="mt-2 flex flex-wrap gap-3">
                                    {tecnicos.map((t) => (
                                        <label key={t.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm">
                                            <input type="checkbox" checked={(orden.auxiliares || []).includes(t.id)} onChange={(e) => {
                                                const arr = new Set(orden.auxiliares || []);
                                                if (e.target.checked) arr.add(t.id); else arr.delete(t.id);
                                                set('auxiliares')([...arr]);
                                            }} />
                                            {t.nombre}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {lugarSel && (
                            <div className="mt-4 grid gap-2 rounded-lg bg-secondary p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                                <p><span className="font-semibold">Dependencia:</span> {clienteSel?.dependencia || '—'}</p>
                                <p><span className="font-semibold">Dirección:</span> {lugarSel.direccion || '—'}</p>
                                <p><span className="font-semibold">Municipio:</span> {lugarSel.municipio || '—'}</p>
                                <p><span className="font-semibold">Departamento:</span> {lugarSel.departamento || '—'}</p>
                                <p><span className="font-semibold">Contacto:</span> {lugarSel.responsable || '—'} ({lugarSel.cargo || '—'})</p>
                                <p><span className="font-semibold">Teléfono:</span> {lugarSel.telefono || '—'}</p>
                            </div>
                        )}
                    </Seccion>

                    <Seccion title="Equipos intervenidos" actions={
                        <button type="button" className={btn.primary} onClick={() => setFilas('equipos', [...filas('equipos'), { id: uid(), cantidad: 1, tipo: '', marca: '', modelo: '', serie: '', ubicacion: '', ip: '', estadoInicial: '', estadoFinal: '', observaciones: '' }])}>
                            <Plus className="h-4 w-4" /> Agregar equipo
                        </button>
                    }>
                        {filas('equipos').length === 0 ? <Vacio mensaje="Sin equipos agregados" /> : (
                            <Tabla columns={['Cant.', 'Tipo', 'Marca', 'Modelo', 'Serie', 'Ubicación', 'IP', 'Estado inicial', 'Estado final', 'Observaciones', '']}>
                                {filas('equipos').map((r) => (
                                    <tr key={r.id}>
                                        <td className="px-2 py-1.5"><input className={`${inputCls} w-16`} type="number" value={r.cantidad} onChange={(e) => editFila('equipos', r.id, 'cantidad', e.target.value)} /></td>
                                        <td className="px-2 py-1.5" style={{ minWidth: 220 }}>
                                            <TipoEquipoCombobox
                                                value={r.tipo}
                                                tipos={config.tiposEquipo}
                                                onChange={(v) => editFila('equipos', r.id, 'tipo', v)}
                                                onCreate={agregarTipoEquipo}
                                            />
                                        </td>
                                        {['marca', 'modelo', 'serie', 'ubicacion', 'ip'].map((k) => (
                                            <td key={k} className="px-2 py-1.5"><input className={`${inputCls} w-28`} value={r[k] || ''} onChange={(e) => editFila('equipos', r.id, k, e.target.value)} /></td>
                                        ))}
                                        <td className="px-2 py-1.5">
                                            <select className={`${inputCls} w-40`} value={r.estadoInicial || ''} onChange={(e) => editFila('equipos', r.id, 'estadoInicial', e.target.value)}>
                                                <option value="">—</option>
                                                {ESTADOS_FINALES.map((t) => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-2 py-1.5">
                                            <select className={`${inputCls} w-40`} value={r.estadoFinal || ''} onChange={(e) => editFila('equipos', r.id, 'estadoFinal', e.target.value)}>
                                                <option value="">—</option>
                                                {ESTADOS_FINALES.map((t) => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-2 py-1.5"><input className={`${inputCls} w-40`} value={r.observaciones || ''} onChange={(e) => editFila('equipos', r.id, 'observaciones', e.target.value)} /></td>
                                        <td className="px-2 py-1.5">
                                            <button type="button" className={btn.danger} onClick={() => setFilas('equipos', filas('equipos').filter((x) => x.id !== r.id))}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </Tabla>
                        )}
                    </Seccion>
                </div>
            )}

            {/* ── DIAGNÓSTICO ── */}
            {tab === 'Diagnóstico' && (
                <div className="space-y-6">
                    <Seccion title="Motivo de la visita">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <Texto label="Motivo" value={orden.motivo?.motivo} onChange={setSub('motivo', 'motivo')} />
                            <Texto label="Número de ticket" value={orden.motivo?.ticket} onChange={setSub('motivo', 'ticket')} />
                            <Texto label="Fecha del reporte" type="date" value={orden.motivo?.fechaReporte} onChange={setSub('motivo', 'fechaReporte')} />
                            <Texto label="Persona que reportó" value={orden.motivo?.reportadoPor} onChange={setSub('motivo', 'reportadoPor')} />
                            <AreaTexto label="Descripción del problema" className="sm:col-span-2 lg:col-span-2" value={orden.motivo?.descripcion} onChange={setSub('motivo', 'descripcion')} />
                            <AreaTexto label="Observaciones iniciales" className="sm:col-span-2 lg:col-span-3" value={orden.motivo?.observaciones} onChange={setSub('motivo', 'observaciones')} />
                        </div>
                    </Seccion>

                    <Seccion title="Checklist de mantenimiento preventivo" actions={
                        <button type="button" className={btn.primary} onClick={agregarActividadesFaltantes}>
                            <Plus className="h-4 w-4" /> Cargar actividades
                        </button>
                    }>
                        {filas('checklist').length === 0 ? <Vacio mensaje="Cargue las actividades del checklist" /> : (
                            <Tabla columns={['Actividad', 'Cumple', 'No cumple', 'No aplica', 'Corregido', 'Observaciones']}>
                                {filas('checklist').map((r) => (
                                    <tr key={r.id}>
                                        <td className="px-3 py-2">{r.actividad}</td>
                                        {['Cumple', 'No cumple', 'No aplica'].map((op) => (
                                            <td key={op} className="px-3 py-2 text-center">
                                                <input type="radio" name={`chk-${r.id}`} checked={r.estado === op} onChange={() => editFila('checklist', r.id, 'estado', op)} />
                                            </td>
                                        ))}
                                        <td className="px-3 py-2 text-center">
                                            <input type="checkbox" checked={Boolean(r.corregido)} onChange={(e) => editFila('checklist', r.id, 'corregido', e.target.checked)} />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input className={`${inputCls} w-56`} value={r.observaciones || ''} onChange={(e) => editFila('checklist', r.id, 'observaciones', e.target.value)} />
                                        </td>
                                    </tr>
                                ))}
                            </Tabla>
                        )}
                    </Seccion>
                </div>
            )}

            {/* ── IMÁGENES ── */}
            {tab === 'Imágenes' && (
                <Seccion title="Imágenes de diagnóstico" actions={
                    <label className={btn.primary}>
                        <Plus className="h-4 w-4" /> Adjuntar imágenes
                        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => subirFotos(e.target.files)} />
                    </label>
                }>
                    {filas('fotos').length === 0 ? <Vacio mensaje="Sin imágenes adjuntas" /> : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filas('fotos').map((f) => (
                                <div key={f.id} className="rounded-lg border border-border bg-card p-2 shadow-sm">
                                    <button type="button" className="block w-full" onClick={() => setFotoAmpliada(f)}>
                                        <img src={f.dataUrl} alt={f.descripcion || 'Imagen'} className="h-40 w-full rounded object-cover hover:opacity-90 transition" />
                                    </button>
                                    <select className={`${inputCls} mt-2`} value={f.clasificacion} onChange={(e) => editFila('fotos', f.id, 'clasificacion', e.target.value)}>
                                        {CLASIF_FOTOS.map((c) => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <input className={`${inputCls} mt-2`} placeholder="Descripción" value={f.descripcion || ''} onChange={(e) => editFila('fotos', f.id, 'descripcion', e.target.value)} />
                                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{f.fecha}</span>
                                        <button type="button" className="text-rose-700 hover:underline" onClick={() => setFilas('fotos', filas('fotos').filter((x) => x.id !== f.id))}>
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Seccion>
            )}

            {/* ── MATERIALES ── */}
            {tab === 'Materiales' && (
                <div className="space-y-6">
                    <Seccion title="Materiales usados en la visita" actions={
                        <button type="button" className={btn.ghost} onClick={() => setFilas('materiales', [...filas('materiales'), { id: uid(), codigo: '', descripcion: '', unidad: 'Unidad', cantidad: 1, observaciones: '' }])}>
                            <Plus className="h-4 w-4" /> Agregar
                        </button>
                    }>
                        {filas('materiales').length === 0 ? <Vacio mensaje="Sin materiales utilizados en esta visita" /> : (
                            <Tabla columns={['Código', 'Material', 'Unidad', 'Cantidad', 'Observaciones', '']}>
                                {filas('materiales').map((r, i) => (
                                    <tr key={r.id}>
                                        <td className="px-2 py-1.5">
                                            <select className={`${inputCls} w-52`} value={r.codigo || ''} onChange={(e) => {
                                                const item = catalogo.find((c) => c.codigo === e.target.value);
                                                setFilas('materiales', filas('materiales').map((x) =>
                                                    x.id === r.id ? { ...x, codigo: e.target.value, descripcion: item?.descripcion || x.descripcion, unidad: item?.unidad || x.unidad } : x,
                                                ));
                                            }}>
                                                <option value="">Del catálogo...</option>
                                                {catalogo.map((c) => <option key={c.id} value={c.codigo}>{`${c.codigo} · ${c.descripcion}`}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-2 py-1.5"><input className={`${inputCls} w-48`} value={r.descripcion || ''} onChange={(e) => editFila('materiales', r.id, 'descripcion', e.target.value)} /></td>
                                        <td className="px-2 py-1.5">
                                            <select className={`${inputCls} w-28`} value={r.unidad || ''} onChange={(e) => editFila('materiales', r.id, 'unidad', e.target.value)}>
                                                {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-2 py-1.5"><input type="number" className={`${inputCls} w-20`} value={r.cantidad} onChange={(e) => editFila('materiales', r.id, 'cantidad', e.target.value)} /></td>
                                        <td className="px-2 py-1.5"><input className={`${inputCls} w-40`} value={r.observaciones || ''} onChange={(e) => editFila('materiales', r.id, 'observaciones', e.target.value)} /></td>
                                        <td className="px-2 py-1.5">
                                            <button type="button" className={btn.danger} onClick={() => setFilas('materiales', filas('materiales').filter((x) => x.id !== r.id))}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </Tabla>
                        )}
                    </Seccion>

                    <Seccion title="Materiales y servicios requeridos (cotización)" actions={
                        <button type="button" className={btn.primary} onClick={() => setModalMaterial(true)}>
                            <Plus className="h-4 w-4" /> Agregar material
                        </button>
                    }>
                        {estadoCot === 'Rechazada' && (
                            <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                <span>Cotización rechazada. Modifique los materiales y regenere la cotización desde la pestaña <strong>Cotización</strong>.</span>
                            </div>
                        )}
                        {filas('requeridos').length === 0 ? <Vacio mensaje="Agregue materiales o servicios requeridos" /> : (
                            <>
                                <Tabla columns={['Sel.', 'Ítem', 'Código', 'Descripción', 'Unidad', 'Cantidad', 'Precio unit.', 'Subtotal', '']}>
                                    {filas('requeridos').map((r, i) => (
                                        <tr key={r.id}>
                                            <td className="px-3 py-2 text-center">
                                                <input type="checkbox" checked={r.seleccionado !== false} onChange={(e) => editFila('requeridos', r.id, 'seleccionado', e.target.checked)} />
                                            </td>
                                            <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                                            <td className="px-2 py-1.5"><input className={`${inputCls} w-24`} value={r.codigo || ''} onChange={(e) => editFila('requeridos', r.id, 'codigo', e.target.value)} /></td>
                                            <td className="px-2 py-1.5"><input className={`${inputCls} w-52`} value={r.descripcion || ''} onChange={(e) => editFila('requeridos', r.id, 'descripcion', e.target.value)} /></td>
                                            <td className="px-2 py-1.5">
                                                <select className={`${inputCls} w-28`} value={r.unidad || ''} onChange={(e) => editFila('requeridos', r.id, 'unidad', e.target.value)}>
                                                    {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-2 py-1.5"><input type="number" step="0.01" className={`${inputCls} w-20`} value={r.cantidad} onChange={(e) => editFila('requeridos', r.id, 'cantidad', e.target.value)} /></td>
                                            <td className="px-2 py-1.5"><input type="number" step="0.01" className={`${inputCls} w-24`} value={r.precio} onChange={(e) => editFila('requeridos', r.id, 'precio', e.target.value)} /></td>
                                            <td className="px-3 py-2 font-semibold text-blue-700">{money(Number(r.cantidad || 0) * Number(r.precio || 0))}</td>
                                            <td className="px-2 py-1.5">
                                                <button type="button" className={btn.danger} onClick={() => setFilas('requeridos', filas('requeridos').filter((x) => x.id !== r.id))}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </Tabla>
                                <ResumenFinanciero
                                    requeridos={filas('requeridos')}
                                    cotizacion={cotizacion}
                                    onChangePct={(v) => setCotizacion('descuentoPct', v)}
                                    onChangeIva={(v) => setCotizacion('ivaPorcentaje', v)}
                                />
                            </>
                        )}
                    </Seccion>
                </div>
            )}

            {/* ── COTIZACIÓN ── */}
            {tab === 'Cotización' && (
                <div className="space-y-6">
                    <Seccion title="Estado de la cotización" actions={
                        <div className="flex flex-wrap gap-2">
                            {hayMateriales && (
                                <Link
                                    to={`/imprimir/cotizacion/${orden.id}`}
                                    target="_blank"
                                    className={btn.primary}
                                    onClick={async (e) => { await guardar(); }}
                                >
                                    <Printer className="h-4 w-4" /> Generar PDF cotización
                                </Link>
                            )}
                            {(estadoCot === 'Generada' || estadoCot === 'Sin cotización') && hayMateriales && (
                                <button type="button" className={btn.ghost} onClick={marcarEnviada}>
                                    <FileText className="h-4 w-4" /> Marcar como enviada
                                </button>
                            )}
                        </div>
                    }>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <Selector
                                label="Estado de cotización"
                                value={estadoCot}
                                onChange={(v) => setCotizacion('estado', v)}
                                options={ESTADOS_COTIZACION}
                            />
                            <Texto label="Fecha de envío" type="date" value={cotizacion.fechaEnvio || ''} onChange={(v) => setCotizacion('fechaEnvio', v)} />
                        </div>

                        {!hayMateriales && (
                            <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>Agregue materiales requeridos en la pestaña <strong>Materiales</strong> para generar la cotización.</span>
                            </div>
                        )}

                        {hayMateriales && (
                            <div className="mt-6 rounded-lg border border-border bg-secondary p-4">
                                <h4 className="mb-4 text-sm font-bold text-foreground">Vista previa de la cotización</h4>
                                <Tabla columns={['Ítem', 'Código', 'Descripción', 'Unidad', 'Cantidad', 'Precio unit.', 'Subtotal']}>
                                    {filas('requeridos').filter((r) => r.seleccionado !== false).map((r, i) => (
                                        <tr key={r.id}>
                                            <td className="px-3 py-2">{i + 1}</td>
                                            <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{r.codigo || '—'}</td>
                                            <td className="px-3 py-2">{r.descripcion}</td>
                                            <td className="px-3 py-2">{r.unidad}</td>
                                            <td className="px-3 py-2 text-right">{r.cantidad}</td>
                                            <td className="px-3 py-2 text-right">{money(r.precio)}</td>
                                            <td className="px-3 py-2 text-right font-semibold">{money(Number(r.cantidad || 0) * Number(r.precio || 0))}</td>
                                        </tr>
                                    ))}
                                </Tabla>
                                <div className="ml-auto mt-4 w-full max-w-xs space-y-1.5 text-sm">
                                    <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{money(subtotal)}</span></div>
                                    {descuentoPct > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Descuento ({descuentoPct}%)</span><span className="text-rose-700">−{money(descuentoMonto)}</span></div>}
                                    <div className="flex justify-between"><span className="text-muted-foreground">IVA ({ivaPct}%)</span><span>{money(ivaMonto)}</span></div>
                                    <div className="flex justify-between border-t-2 border-border pt-2 text-base font-bold">
                                        <span>TOTAL</span><span className="text-blue-700">{money(total)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Seccion>

                    <Seccion title="Cartas Oferta relacionadas" actions={
                        <Link to={`/cartas`} className={btn.ghost}><FileText className="h-4 w-4" /> Ver cartas</Link>
                    }>
                        {cartas.length === 0 ? <Vacio mensaje="Sin Cartas Oferta formales relacionadas" /> : (
                            <Tabla columns={['N.º Carta Oferta', 'Versión', 'Fecha', 'Estado', 'Total']}>
                                {cartas.map((c) => {
                                    const sub = (c.items || []).reduce((s, i) => s + Number(i.cantidad || 0) * Number(i.precio || 0), 0);
                                    const tot = (sub - Number(c.descuento || 0)) * (1 + Number(c.ivaPorcentaje || 0) / 100);
                                    return (
                                        <tr key={c.id} className="hover:bg-secondary">
                                            <td className="px-3 py-2 font-semibold text-blue-700">
                                                <Link to={`/cartas/${c.id}`} className="hover:underline">{c.numero}</Link>
                                            </td>
                                            <td className="px-3 py-2">V{c.version}</td>
                                            <td className="px-3 py-2">{c.fecha}</td>
                                            <td className="px-3 py-2"><EstadoBadge estado={c.estado} /></td>
                                            <td className="px-3 py-2 font-semibold">{money(tot)}</td>
                                        </tr>
                                    );
                                })}
                            </Tabla>
                        )}
                    </Seccion>
                </div>
            )}

            {/* ── APROBACIÓN ── */}
            {tab === 'Aprobación' && (
                <div className="space-y-6">
                    <Seccion title="Aprobación de cotización">
                        <div className="mb-4 flex items-center gap-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${estadoCotColor[estadoCot] || ''}`}>
                                {estadoCot === 'Aprobada' && <CheckCircle2 className="h-4 w-4" />}
                                {estadoCot === 'Rechazada' && <X className="h-4 w-4" />}
                                {estadoCot}
                            </span>
                            {cotizacionAprobada && <span className="text-sm text-emerald-700 font-medium">Puede iniciar el mantenimiento correctivo</span>}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <Texto label="Fecha de envío" type="date" value={cotizacion.fechaEnvio || ''} onChange={(v) => setCotizacion('fechaEnvio', v)} />
                            <Texto label="Fecha de aprobación / rechazo" type="date" value={cotizacion.fechaAprobacion || ''} onChange={(v) => setCotizacion('fechaAprobacion', v)} />
                            <Texto label="Nombre de quien autoriza" value={cotizacion.autorizadoPor || ''} onChange={(v) => setCotizacion('autorizadoPor', v)} />
                            <Texto label="Cargo" value={cotizacion.cargoAutoriza || ''} onChange={(v) => setCotizacion('cargoAutoriza', v)} />
                            <AreaTexto label="Observaciones" className="sm:col-span-2" value={cotizacion.observaciones || ''} onChange={(v) => setCotizacion('observaciones', v)} />
                            {estadoCot === 'Rechazada' && (
                                <AreaTexto label="Motivo del rechazo" className="sm:col-span-2" value={cotizacion.motivoRechazo || ''} onChange={(v) => setCotizacion('motivoRechazo', v)} />
                            )}
                        </div>

                        {!cotizacionAprobada && hayMateriales && (
                            <div className="mt-6 flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 active:scale-[0.98]"
                                    onClick={() => setConfirmAccion('aprobar')}
                                >
                                    <ThumbsUp className="h-4 w-4" /> Aprobar cotización
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 active:scale-[0.98]"
                                    onClick={() => setConfirmAccion('rechazar')}
                                >
                                    <ThumbsDown className="h-4 w-4" /> Rechazar cotización
                                </button>
                            </div>
                        )}

                        {cotizacionAprobada && (
                            <div className="mt-6">
                                <button
                                    type="button"
                                    className={btn.primary}
                                    onClick={() => setTab('Correctivo')}
                                >
                                    <Play className="h-4 w-4" /> Ir a Mantenimiento Correctivo
                                </button>
                            </div>
                        )}

                        {estadoCot === 'Rechazada' && (
                            <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                <span>Cotización rechazada. Vaya a <strong>Materiales</strong> para modificar los ítems, luego a <strong>Cotización</strong> para generar el nuevo PDF y reenviar.</span>
                            </div>
                        )}
                    </Seccion>
                </div>
            )}

            {/* ── CORRECTIVO ── */}
            {tab === 'Correctivo' && (
                <CorrectivoPanelFull
                    orden={orden}
                    habilitado={correctivoHabilitado}
                    hayMateriales={hayMateriales}
                    catalogo={catalogo}
                    config={config}
                    setSub={setSub}
                    filas={filas}
                    setFilas={setFilas}
                    editFila={editFila}
                    guardar={guardar}
                    setToast={setToast}
                    reloadCartas={reloadCartas}
                    clienteSel={clienteSel}
                    lugarSel={lugarSel}
                />
            )}

            {/* ── CIERRE ── */}
            {tab === 'Cierre' && (
                <div className="space-y-6">
                    <Seccion title="Cierre de la orden de trabajo">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <AreaTexto label="Trabajo realizado" value={orden.cierre?.trabajo} onChange={setSub('cierre', 'trabajo')} />
                            <AreaTexto label="Resultado" value={orden.cierre?.resultado} onChange={setSub('cierre', 'resultado')} />
                            <AreaTexto label="Material utilizado" value={orden.cierre?.material} onChange={setSub('cierre', 'material')} />
                            <AreaTexto label="Pendientes" value={orden.cierre?.pendientes} onChange={setSub('cierre', 'pendientes')} />
                            <AreaTexto label="Recomendaciones" value={orden.cierre?.recomendaciones} onChange={setSub('cierre', 'recomendaciones')} />
                            <AreaTexto label="Próxima visita recomendada" value={orden.cierre?.proximaVisita} onChange={setSub('cierre', 'proximaVisita')} />
                            <Texto label="Fecha sugerida de próxima visita" type="date" value={orden.cierre?.fechaProxima} onChange={setSub('cierre', 'fechaProxima')} />
                            <Selector label="Estado de cierre" value={orden.cierre?.estadoCierre} onChange={setSub('cierre', 'estadoCierre')} options={ESTADOS_CIERRE} />
                        </div>
                        <button type="button" className={`${btn.soft} mt-4`} onClick={() => guardar({ estado: orden.cierre?.estadoCierre || 'Finalizada' })}>
                            <CheckCircle2 className="h-4 w-4" /> Cerrar orden
                        </button>
                    </Seccion>

                    <Seccion title="Firma de recepción">
                        <div className="grid gap-6 lg:grid-cols-2">
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold text-foreground">Técnico responsable</h4>
                                <Texto label="Nombre" value={orden.firmas?.tecnicoNombre} onChange={setSub('firmas', 'tecnicoNombre')} />
                                <div className="grid grid-cols-2 gap-3">
                                    <Texto label="Fecha" type="date" value={orden.firmas?.tecnicoFecha} onChange={setSub('firmas', 'tecnicoFecha')} />
                                    <Texto label="Hora" type="time" value={orden.firmas?.tecnicoHora} onChange={setSub('firmas', 'tecnicoHora')} />
                                </div>
                                <FirmaCanvas label="Firma del técnico" valor={orden.firmas?.tecnicoFirma} onChange={setSub('firmas', 'tecnicoFirma')} />
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold text-foreground">Responsable del cliente</h4>
                                <Texto label="Nombre" value={orden.firmas?.clienteNombre} onChange={setSub('firmas', 'clienteNombre')} />
                                <Texto label="Cargo" value={orden.firmas?.clienteCargo} onChange={setSub('firmas', 'clienteCargo')} />
                                <div className="grid grid-cols-2 gap-3">
                                    <Texto label="Fecha" type="date" value={orden.firmas?.clienteFecha} onChange={setSub('firmas', 'clienteFecha')} />
                                    <Texto label="Hora" type="time" value={orden.firmas?.clienteHora} onChange={setSub('firmas', 'clienteHora')} />
                                </div>
                                <FirmaCanvas label="Firma del cliente" valor={orden.firmas?.clienteFirma} onChange={setSub('firmas', 'clienteFirma')} />
                            </div>
                        </div>
                    </Seccion>
                </div>
            )}

            {/* ── Modales ── */}
            <ModalAgregarMaterial
                open={modalMaterial}
                onClose={() => setModalMaterial(false)}
                catalogo={catalogo}
                onAdd={(item) => setFilas('requeridos', [...filas('requeridos'), item])}
            />

            <Modal open={modalCliente} onClose={() => setModalCliente(false)} title="Nuevo cliente / institución">
                <form onSubmit={guardarCliente} className="grid gap-3 sm:grid-cols-2">
                    {[['nombre', 'Cliente / Institución', true], ['dependencia', 'Dependencia'], ['contacto', 'Persona contacto'], ['cargo', 'Cargo'], ['telefono', 'Teléfono'], ['correo', 'Correo']].map(([name, label, req]) => (
                        <label key={name} className="flex flex-col gap-1.5">
                            <span className="text-xs font-semibold text-muted-foreground">{label}</span>
                            <input name={name} required={Boolean(req)} className={inputCls} />
                        </label>
                    ))}
                    <button type="submit" className={`${btn.primary} sm:col-span-2`}>Guardar cliente</button>
                </form>
            </Modal>

            <Modal open={modalLugar} onClose={() => setModalLugar(false)} title="Nuevo lugar / sede">
                <form onSubmit={guardarLugar} className="grid gap-3 sm:grid-cols-2">
                    {[['nombre', 'Nombre del lugar', true], ['tipo', 'Tipo de instalación'], ['direccion', 'Dirección'], ['municipio', 'Municipio'], ['departamento', 'Departamento'], ['responsable', 'Persona responsable'], ['cargo', 'Cargo'], ['telefono', 'Teléfono'], ['correo', 'Correo']].map(([name, label, req]) => (
                        <label key={name} className="flex flex-col gap-1.5">
                            <span className="text-xs font-semibold text-muted-foreground">{label}</span>
                            <input name={name} required={Boolean(req)} className={inputCls} />
                        </label>
                    ))}
                    <button type="submit" className={`${btn.primary} sm:col-span-2`}>Guardar lugar</button>
                </form>
            </Modal>

            {/* Confirmar aprobación/rechazo */}
            {confirmAccion && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
                    <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-xl">
                        <h3 className="mb-2 text-base font-bold text-foreground">
                            {confirmAccion === 'aprobar' ? 'Aprobar cotización' : 'Rechazar cotización'}
                        </h3>
                        <p className="mb-5 text-sm text-muted-foreground">
                            {confirmAccion === 'aprobar'
                                ? 'Al aprobar, se habilitará el mantenimiento correctivo y se actualizará el estado de la orden a "En proceso".'
                                : 'Al rechazar, deberá modificar los materiales y generar una nueva cotización.'}
                        </p>
                        <div className="flex justify-end gap-2">
                            <button type="button" className={btn.ghost} onClick={() => setConfirmAccion(null)}>Cancelar</button>
                            <button
                                type="button"
                                className={confirmAccion === 'aprobar'
                                    ? 'inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700'
                                    : 'inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700'}
                                onClick={confirmAccion === 'aprobar' ? aprobarCotizacion : rechazarCotizacion}
                            >
                                {confirmAccion === 'aprobar' ? <ThumbsUp className="h-4 w-4" /> : <ThumbsDown className="h-4 w-4" />}
                                {confirmAccion === 'aprobar' ? 'Aprobar' : 'Rechazar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Foto ampliada */}
            {fotoAmpliada && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-6" onClick={() => setFotoAmpliada(null)}>
                    <div className="max-h-full max-w-3xl overflow-auto rounded-lg bg-card p-3" onClick={(e) => e.stopPropagation()}>
                        <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="font-semibold">{fotoAmpliada.clasificacion} · {fotoAmpliada.fecha}</span>
                            <button type="button" onClick={() => setFotoAmpliada(null)}><X className="h-5 w-5" /></button>
                        </div>
                        <img src={fotoAmpliada.dataUrl} alt={fotoAmpliada.descripcion || 'Imagen'} className="max-h-[70vh] w-full object-contain" />
                        <p className="mt-2 text-sm text-muted-foreground">{fotoAmpliada.descripcion}</p>
                    </div>
                </div>
            )}

            {toast}
        </AppLayout>
    );
}
