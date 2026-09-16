import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import AppLayout from '@/components/AppLayout';
import { Seccion, Tabla, Vacio, Cargando, EstadoBadge, Texto, Selector, btn, useToastMsg } from '@/components/kit';
import {
    useCollection,
    createRec,
    removeRec,
    nextCorrelativo,
    TIPOS_VISITA,
    PRIORIDADES,
    ESTADOS_ORDEN,
} from '@/lib/db';

const filtrosVacios = {
    desde: '',
    hasta: '',
    cliente: '',
    lugar: '',
    tecnico: '',
    tipo: '',
    estado: '',
    prioridad: '',
};

export default function OrdenesPage() {
    const navigate = useNavigate();
    const { items, loading, reload } = useCollection('ordenes', { expand: 'cliente,lugar,tecnico' });
    const { items: clientes } = useCollection('clientes');
    const { items: lugares } = useCollection('lugares');
    const { items: tecnicos } = useCollection('tecnicos');
    const [f, setF] = useState(filtrosVacios);
    const [creando, setCreando] = useState(false);
    const [toast, setToast] = useToastMsg();

    const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

    const filtradas = useMemo(
        () =>
            items.filter((o) => {
                if (f.desde && (o.fechaProgramada || '') < f.desde) return false;
                if (f.hasta && (o.fechaProgramada || '') > f.hasta) return false;
                if (f.cliente && o.cliente !== f.cliente) return false;
                if (f.lugar && o.lugar !== f.lugar) return false;
                if (f.tecnico && o.tecnico !== f.tecnico) return false;
                if (f.tipo && o.tipoVisita !== f.tipo) return false;
                if (f.estado && o.estado !== f.estado) return false;
                if (f.prioridad && o.prioridad !== f.prioridad) return false;
                return true;
            }),
        [items, f],
    );

    const nuevaOrden = async () => {
        setCreando(true);
        try {
            const numero = await nextCorrelativo('ordenes', 'OT-CCTV');
            const hoy = new Date().toISOString().slice(0, 10);
            const rec = await createRec('ordenes', {
                numero,
                fechaCreacion: hoy,
                fechaProgramada: hoy,
                estado: 'Programada',
                prioridad: 'Media',
                tipoVisita: 'Mantenimiento preventivo',
                motivo: {},
                equipos: [],
                checklist: [],
                correctivo: {},
                materiales: [],
                requeridos: [],
                fotos: [],
                cierre: {},
                firmas: {},
                creadoPor: pb.authStore.record?.id || '',
            });
            navigate(`/ordenes/${rec.id}`);
        } catch (err) {
            setToast(err?.message || 'No se pudo crear la orden');
        } finally {
            setCreando(false);
        }
    };

    const eliminar = async (o) => {
        try {
            await removeRec('ordenes', o.id);
            setToast('Orden eliminada');
            reload();
        } catch (err) {
            setToast(err?.message || 'No se pudo eliminar');
        }
    };

    return (
        <AppLayout
            title="Órdenes de Trabajo"
            subtitle="Correlativo automático OT-CCTV-AAAA-00000"
            actions={
                <button type="button" className={btn.primary} onClick={nuevaOrden} disabled={creando}>
                    <Plus className="h-4 w-4" /> Nueva orden
                </button>
            }
        >
            <Helmet>
                <title>Órdenes de Trabajo | Sistema de Mantenimiento CCTV</title>
                <meta name="description" content="Listado, filtros y creación de órdenes de trabajo de mantenimiento preventivo y correctivo de CCTV." />
            </Helmet>

            <Seccion
                title="Filtros"
                actions={
                    <button type="button" className={btn.ghost} onClick={() => setF(filtrosVacios)}>
                        Limpiar filtros
                    </button>
                }
            >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Texto label="Fecha desde" type="date" value={f.desde} onChange={set('desde')} />
                    <Texto label="Fecha hasta" type="date" value={f.hasta} onChange={set('hasta')} />
                    <Selector label="Cliente" value={f.cliente} onChange={set('cliente')} placeholder="Todos" options={clientes.map((c) => ({ value: c.id, label: c.nombre }))} />
                    <Selector label="Lugar" value={f.lugar} onChange={set('lugar')} placeholder="Todos" options={lugares.map((c) => ({ value: c.id, label: c.nombre }))} />
                    <Selector label="Técnico" value={f.tecnico} onChange={set('tecnico')} placeholder="Todos" options={tecnicos.map((c) => ({ value: c.id, label: c.nombre }))} />
                    <Selector label="Tipo de mantenimiento" value={f.tipo} onChange={set('tipo')} placeholder="Todos" options={TIPOS_VISITA} />
                    <Selector label="Estado" value={f.estado} onChange={set('estado')} placeholder="Todos" options={ESTADOS_ORDEN} />
                    <Selector label="Prioridad" value={f.prioridad} onChange={set('prioridad')} placeholder="Todas" options={PRIORIDADES} />
                </div>
            </Seccion>

            <Seccion title={`${filtradas.length} órdenes`} className="mt-6">
                {loading ? (
                    <Cargando />
                ) : filtradas.length === 0 ? (
                    <Vacio mensaje="Sin órdenes registradas" />
                ) : (
                    <Tabla columns={['N.º Orden', 'Fecha prog.', 'Cliente', 'Lugar', 'Tipo', 'Técnico', 'Prioridad', 'Estado', 'Acciones']}>
                        {filtradas.map((o) => (
                            <tr key={o.id} className="hover:bg-secondary">
                                <td className="px-3 py-2 font-semibold text-blue-700">
                                    <Link to={`/ordenes/${o.id}`} className="hover:underline">
                                        {o.numero}
                                    </Link>
                                </td>
                                <td className="px-3 py-2">{o.fechaProgramada || '—'}</td>
                                <td className="px-3 py-2">{o.expand?.cliente?.nombre || '—'}</td>
                                <td className="px-3 py-2">{o.expand?.lugar?.nombre || '—'}</td>
                                <td className="px-3 py-2">{o.tipoVisita || '—'}</td>
                                <td className="px-3 py-2">{o.expand?.tecnico?.nombre || '—'}</td>
                                <td className="px-3 py-2">{o.prioridad || '—'}</td>
                                <td className="px-3 py-2"><EstadoBadge estado={o.estado} /></td>
                                <td className="px-3 py-2">
                                    <button type="button" className={btn.danger} onClick={() => eliminar(o)}>
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
