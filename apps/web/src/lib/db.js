import { useCallback, useEffect, useState } from 'react';
import pb from '@/lib/pocketbaseClient';

export const listAll = (name, options = {}) =>
    pb.collection(name).getFullList({ sort: '-created', ...options });

export const createRec = (name, data) => pb.collection(name).create(data);
export const updateRec = (name, id, data) => pb.collection(name).update(id, data);
export const removeRec = (name, id) => pb.collection(name).delete(id);

export function useCollection(name, options) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const key = JSON.stringify(options || {});

    const reload = useCallback(async () => {
        setLoading(true);
        try {
            const rows = await listAll(name, JSON.parse(key));
            setItems(rows);
            setError(null);
        } catch (err) {
            if (err?.status !== 0) setError(err?.message || 'Error al cargar datos');
        } finally {
            setLoading(false);
        }
    }, [name, key]);

    useEffect(() => {
        reload();
    }, [reload]);

    return { items, loading, error, reload, setItems };
}

export async function nextCorrelativo(collection, prefix) {
    const year = new Date().getFullYear();
    const base = `${prefix}-${year}-`;
    const rows = await pb.collection(collection).getList(1, 200, {
        filter: `numero ~ "${base}"`,
        sort: '-numero',
    });
    let max = 0;
    rows.items.forEach((r) => {
        const m = String(r.numero).match(new RegExp(`${prefix}-${year}-(\\d{5})`));
        if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    return `${base}${String(max + 1).padStart(5, '0')}`;
}

export async function getConfig(clave) {
    const rows = await pb.collection('configuracion').getList(1, 1, {
        filter: `clave = "${clave}"`,
        requestKey: `config-${clave}`,
    });
    return rows.items[0] || null;
}

export async function saveConfig(clave, valor) {
    const existing = await getConfig(clave);
    if (existing) return updateRec('configuracion', existing.id, { valor });
    return createRec('configuracion', { clave, valor });
}

export const money = (n, simbolo = '$') =>
    `${simbolo}${Number(n || 0).toLocaleString('es-SV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const uid = () => Math.random().toString(36).slice(2, 10);

export const TIPOS_VISITA = [
    'Mantenimiento preventivo',
    'Mantenimiento correctivo',
    'Sustitución de equipo tecnológico',
    'Sustitución de equipo informático',
    'Generación de planos',
    'Emergencia',
    'Diagnóstico',
    'Instalación',
    'Configuración',
    'Seguimiento',
];

export const PRIORIDADES = ['Baja', 'Media', 'Alta', 'Crítica'];

export const ESTADOS_ORDEN = [
    'Programada',
    'En proceso',
    'Finalizada',
    'Pendiente',
    'Pendiente de materiales',
    'Pendiente de autorización',
    'Pendiente de Carta Oferta',
    'Reprogramada',
    'Cancelada',
];

export const ESTADOS_CARTA = [
    'Borrador',
    'Enviada',
    'Pendiente de aprobación',
    'Aprobada',
    'Aprobada parcialmente',
    'Rechazada',
    'Modificada',
    'Vencida',
];

export const ESTADOS_FINALES = [
    'Operativo',
    'Operativo con observaciones',
    'Reparado',
    'Reparación temporal',
    'Pendiente de repuesto',
    'Pendiente de autorización',
    'Pendiente de sustitución',
    'Fuera de servicio',
    'Requiere nueva visita',
];

export const ESTADOS_CIERRE = [
    'Finalizada',
    'Finalizada con pendientes',
    'Requiere nueva visita',
    'Pendiente de Carta Oferta',
    'Pendiente de materiales',
];

export const CLASIF_FOTOS = [
    'Antes',
    'Durante',
    'Después',
    'Equipo dañado',
    'Material requerido',
    'Evidencia',
    'Otro',
];

export const UNIDADES = [
    'Unidad',
    'Metro',
    'Pie',
    'Rollo',
    'Caja',
    'Bolsa',
    'Paquete',
    'Par',
    'Juego',
    'Kit',
    'Galón',
    'Litro',
    'Hora',
    'Día',
    'Servicio',
    'Global',
];

export const estadoColor = (estado) => {
    const map = {
        Programada: 'bg-blue-50 text-blue-700',
        'En proceso': 'bg-amber-50 text-amber-800',
        Finalizada: 'bg-emerald-50 text-emerald-700',
        Aprobada: 'bg-emerald-50 text-emerald-700',
        'Aprobada parcialmente': 'bg-teal-50 text-teal-700',
        Rechazada: 'bg-rose-50 text-rose-700',
        Cancelada: 'bg-rose-50 text-rose-700',
        Enviada: 'bg-indigo-50 text-indigo-700',
        Borrador: 'bg-muted text-muted-foreground',
        Vencida: 'bg-zinc-100 text-zinc-700',
    };
    return map[estado] || 'bg-orange-50 text-orange-800';
};
