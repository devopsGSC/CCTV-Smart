import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Plus, Save, Trash2, Pencil, Check, X, Search, AlertCircle } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import AppLayout from '@/components/AppLayout';
import { Seccion, Texto, Modal, btn, inputCls, useToastMsg } from '@/components/kit';
import { getConfig, saveConfig } from '@/lib/db';

const COLECCIONES_DEMO = ['cartas', 'ordenes', 'equipos', 'lugares', 'clientes', 'tecnicos'];

export default function ConfiguracionPage() {
    const [general, setGeneral] = useState({});
    const [actividades, setActividades] = useState([]);
    const [tipos, setTipos] = useState([]);
    const [nuevaAct, setNuevaAct] = useState('');
    const [toast, setToast] = useToastMsg();

    useEffect(() => {
        (async () => {
            const [g, a, t] = await Promise.all([getConfig('general'), getConfig('actividades'), getConfig('tiposEquipo')]);
            setGeneral(g?.valor || {});
            setActividades(a?.valor || []);
            setTipos(t?.valor || []);
        })();
    }, []);

    const guardarTodo = async () => {
        try {
            await saveConfig('general', { ...general, iva: Number(general.iva || 0) });
            await saveConfig('actividades', actividades);
            await saveConfig('tiposEquipo', tipos);
            setToast('Configuración guardada');
        } catch (err) {
            setToast(err?.message || 'Error al guardar');
        }
    };

    const borrarDemo = async () => {
        try {
            let total = 0;
            for (const col of COLECCIONES_DEMO) {
                const rows = await pb.collection(col).getFullList({ filter: 'demo = true' });
                for (const r of rows) {
                    await pb.collection(col).delete(r.id);
                    total += 1;
                }
            }
            setToast(`${total} registros de prueba eliminados`);
        } catch (err) {
            setToast(err?.message || 'No se pudieron eliminar los datos de prueba');
        }
    };

    const Lista = ({ titulo, valores, setValores, nuevo, setNuevo, placeholder }) => (
        <Seccion
            title={titulo}
            actions={
                <>
                    <input className={`${inputCls} sm:w-64`} placeholder={placeholder} value={nuevo} onChange={(e) => setNuevo(e.target.value)} />
                    <button
                        type="button"
                        className={btn.primary}
                        onClick={() => {
                            if (!nuevo.trim()) return;
                            setValores([...valores, nuevo.trim()]);
                            setNuevo('');
                        }}
                    >
                        <Plus className="h-4 w-4" /> Agregar
                    </button>
                </>
            }
        >
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {valores.map((v, i) => (
                    <li key={`${v}-${i}`} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-1.5 text-sm">
                        <span>{v}</span>
                        <button type="button" className="text-rose-700" onClick={() => setValores(valores.filter((_, j) => j !== i))}>
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </li>
                ))}
            </ul>
        </Seccion>
    );

    return (
        <AppLayout
            title="Configuración"
            subtitle="Datos de la empresa, IVA, actividades y catálogos internos"
            actions={
                <button type="button" className={btn.primary} onClick={guardarTodo}>
                    <Save className="h-4 w-4" /> Guardar configuración
                </button>
            }
        >
            <Helmet>
                <title>Configuración | Sistema de Mantenimiento CCTV</title>
                <meta name="description" content="Configuración de empresa, porcentaje de IVA, actividades del checklist preventivo y tipos de equipos." />
            </Helmet>

            <div className="space-y-6">
                <Seccion title="Datos de la empresa">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <Texto label="Nombre de la empresa" value={general.empresa} onChange={(v) => setGeneral((p) => ({ ...p, empresa: v }))} />
                        <Texto label="NIT / Registro" value={general.nit} onChange={(v) => setGeneral((p) => ({ ...p, nit: v }))} />
                        <Texto label="Teléfono" value={general.telefono} onChange={(v) => setGeneral((p) => ({ ...p, telefono: v }))} />
                        <Texto label="Correo" value={general.correo} onChange={(v) => setGeneral((p) => ({ ...p, correo: v }))} />
                        <Texto label="Dirección" value={general.direccion} onChange={(v) => setGeneral((p) => ({ ...p, direccion: v }))} />
                        <Texto label="URL del logo" value={general.logo} onChange={(v) => setGeneral((p) => ({ ...p, logo: v }))} />
                        <Texto label="Porcentaje de IVA (%)" type="number" value={general.iva} onChange={(v) => setGeneral((p) => ({ ...p, iva: v }))} />
                        <Texto label="Símbolo de moneda" value={general.moneda} onChange={(v) => setGeneral((p) => ({ ...p, moneda: v }))} />
                    </div>
                </Seccion>

                <Lista
                    titulo="Actividades del checklist preventivo"
                    valores={actividades}
                    setValores={setActividades}
                    nuevo={nuevaAct}
                    setNuevo={setNuevaAct}
                    placeholder="Nueva actividad"
                />

                <GestionTiposEquipo tipos={tipos} setTipos={setTipos} setToast={setToast} />

                <Seccion title="Datos de prueba">
                    <p className="mb-3 text-sm text-muted-foreground">
                        Elimina el cliente, lugar, técnico, equipos, orden y carta oferta creados como datos de prueba.
                    </p>
                    <button type="button" className={btn.danger} onClick={borrarDemo}>
                        <Trash2 className="h-4 w-4" /> Eliminar datos de prueba
                    </button>
                </Seccion>
            </div>
            {toast}
        </AppLayout>
    );
}

/* ───────────────── Gestor de Tipos de Equipo ───────────────── */

async function tipoEnUso(tipo) {
    try {
        const eqs = await pb.collection('equipos').getList(1, 1, {
            filter: pb.filter('tipo = {:t}', { t: tipo }),
            requestKey: `eq-tipo-${tipo}`,
        });
        if (eqs.totalItems > 0) return true;
    } catch (_) { /* ignore */ }
    try {
        const ordenes = await pb.collection('ordenes').getFullList({
            fields: 'id,equipos',
            requestKey: 'ordenes-tipos',
        });
        if (ordenes.some((o) => Array.isArray(o.equipos) && o.equipos.some((e) => e.tipo === tipo))) {
            return true;
        }
    } catch (_) { /* ignore */ }
    return false;
}

function GestionTiposEquipo({ tipos, setTipos, setToast }) {
    const [busq, setBusq] = useState('');
    const [nuevo, setNuevo] = useState('');
    const [editId, setEditId] = useState(null);
    const [editVal, setEditVal] = useState('');
    const [pendiente, setPendiente] = useState(null); // tipo a confirmar eliminación
    const [comprobando, setComprobando] = useState(null);
    const [guardando, setGuardando] = useState(false);

    const ordenados = useMemo(
        () => (tipos || []).slice().sort((a, b) => a.localeCompare(b)),
        [tipos],
    );
    const filtrados = useMemo(() => {
        if (!busq.trim()) return ordenados;
        const ql = busq.trim().toLowerCase();
        return ordenados.filter((t) => t.toLowerCase().includes(ql));
    }, [ordenados, busq]);

    const persistir = async (lista) => {
        setGuardando(true);
        try {
            await saveConfig('tiposEquipo', lista);
            setTipos(lista);
        } catch (err) {
            setToast(err?.message || 'Error al guardar tipos de equipo');
        } finally {
            setGuardando(false);
        }
    };

    const agregar = async () => {
        const limpio = nuevo.trim();
        if (!limpio) {
            setToast('Escriba un nombre de tipo de equipo');
            return;
        }
        if (tipos.some((t) => t.toLowerCase() === limpio.toLowerCase())) {
            setToast(`El tipo “${limpio}” ya existe`);
            return;
        }
        const lista = [...tipos, limpio].sort((a, b) => a.localeCompare(b));
        await persistir(lista);
        setNuevo('');
        setToast(`Tipo “${limpio}” agregado`);
    };

    const iniciarEdicion = (t) => { setEditId(t); setEditVal(t); };

    const guardarEdicion = async () => {
        const limpio = editVal.trim();
        if (!limpio) {
            setToast('El nombre no puede estar vacío');
            return;
        }
        if (limpio.toLowerCase() !== editId.toLowerCase() &&
            tipos.some((t) => t.toLowerCase() === limpio.toLowerCase())) {
            setToast(`Ya existe el tipo “${limpio}”`);
            return;
        }
        const lista = tipos.map((t) => (t === editId ? limpio : t)).sort((a, b) => a.localeCompare(b));
        await persistir(lista);
        setEditId(null);
        setEditVal('');
        setToast('Tipo actualizado');
    };

    const cancelarEdicion = () => { setEditId(null); setEditVal(''); };

    const confirmarEliminar = async () => {
        if (!pendiente) return;
        setComprobando(pendiente);
        try {
            const enUso = await tipoEnUso(pendiente);
            if (enUso) {
                setToast(`No se puede eliminar “${pendiente}”: está siendo usado en equipos u órdenes`);
                setPendiente(null);
                return;
            }
            const lista = tipos.filter((t) => t !== pendiente);
            await persistir(lista);
            setToast(`Tipo “${pendiente}” eliminado`);
        } catch (err) {
            setToast(err?.message || 'No se pudo comprobar el uso del tipo');
        } finally {
            setComprobando(null);
            setPendiente(null);
        }
    };

    return (
        <Seccion
            title="Tipos de equipo"
            actions={
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        className={`${inputCls} pl-9`}
                        placeholder="Buscar tipo..."
                        value={busq}
                        onChange={(e) => setBusq(e.target.value)}
                    />
                </div>
            }
        >
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end">
                <label className="flex flex-1 flex-col gap-1.5">
                    <span className="text-xs font-semibold text-muted-foreground">Nuevo tipo de equipo</span>
                    <input
                        className={inputCls}
                        placeholder="Ej. Cámara multisensor"
                        value={nuevo}
                        onChange={(e) => setNuevo(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregar(); } }}
                    />
                </label>
                <button type="button" className={btn.primary} onClick={agregar} disabled={guardando}>
                    <Plus className="h-4 w-4" /> Agregar tipo
                </button>
            </div>

            {filtrados.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                    {tipos.length === 0 ? 'Sin tipos de equipo. Agregue el primero arriba.' : 'Sin resultados para la búsqueda.'}
                </p>
            ) : (
                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {filtrados.map((t) => (
                        <li
                            key={t}
                            className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
                        >
                            {editId === t ? (
                                <>
                                    <input
                                        className={`${inputCls} py-1`}
                                        value={editVal}
                                        autoFocus
                                        onChange={(e) => setEditVal(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') { e.preventDefault(); guardarEdicion(); }
                                            if (e.key === 'Escape') cancelarEdicion();
                                        }}
                                    />
                                    <div className="flex shrink-0 gap-1">
                                        <button type="button" className="rounded p-1 text-emerald-700 hover:bg-emerald-50" onClick={guardarEdicion} title="Guardar">
                                            <Check className="h-4 w-4" />
                                        </button>
                                        <button type="button" className="rounded p-1 text-muted-foreground hover:bg-secondary" onClick={cancelarEdicion} title="Cancelar">
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <span className="truncate">{t}</span>
                                    <div className="flex shrink-0 gap-1">
                                        <button type="button" className="rounded p-1 text-blue-700 hover:bg-blue-50" onClick={() => iniciarEdicion(t)} title="Editar">
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                        <button type="button" className="rounded p-1 text-rose-700 hover:bg-rose-50" onClick={() => setPendiente(t)} title="Eliminar">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            <p className="mt-3 text-xs text-muted-foreground">
                Los tipos se guardan ordenados alfabéticamente. No se permiten duplicados ni nombres vacíos.
            </p>

            {/* Confirmación de eliminación */}
            <Modal open={Boolean(pendiente)} onClose={() => setPendiente(null)} title="Eliminar tipo de equipo">
                <div className="space-y-4">
                    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>
                            ¿Seguro que desea eliminar el tipo <strong>“{pendiente}”</strong>?
                            {comprobando === pendiente && ' Comprobando uso…'}
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Si el tipo está siendo usado en equipos u órdenes de trabajo, no se permitirá la eliminación.
                    </p>
                    <div className="flex justify-end gap-2">
                        <button type="button" className={btn.ghost} onClick={() => setPendiente(null)}>Cancelar</button>
                        <button type="button" className={btn.danger} onClick={confirmarEliminar} disabled={Boolean(comprobando)}>
                            <Trash2 className="h-4 w-4" /> Eliminar
                        </button>
                    </div>
                </div>
            </Modal>
        </Seccion>
    );
}
