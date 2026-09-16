import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { Seccion, Tabla, Vacio, Cargando, Modal, Texto, Selector, AreaTexto, btn, useToastMsg, inputCls } from '@/components/kit';
import { useCollection, createRec, updateRec, removeRec, UNIDADES, money } from '@/lib/db';

const CATALOGOS = {
    clientes: {
        titulo: 'Clientes / Instituciones',
        subtitulo: 'Instituciones, dependencias y contactos',
        campos: [
            { k: 'codigo', l: 'Código' },
            { k: 'nombre', l: 'Cliente / Institución', req: true },
            { k: 'dependencia', l: 'Dependencia' },
            { k: 'contacto', l: 'Persona contacto' },
            { k: 'cargo', l: 'Cargo' },
            { k: 'telefono', l: 'Teléfono' },
            { k: 'correo', l: 'Correo' },
            { k: 'observaciones', l: 'Observaciones', area: true },
        ],
        columnas: ['codigo', 'nombre', 'dependencia', 'contacto', 'telefono', 'correo'],
    },
    lugares: {
        titulo: 'Lugares / Sedes',
        subtitulo: 'Sedes e instalaciones por cliente',
        rel: { k: 'cliente', col: 'clientes', l: 'Cliente / Institución' },
        campos: [
            { k: 'codigo', l: 'Código' },
            { k: 'nombre', l: 'Nombre del lugar', req: true },
            { k: 'tipo', l: 'Tipo de instalación' },
            { k: 'direccion', l: 'Dirección' },
            { k: 'municipio', l: 'Municipio' },
            { k: 'departamento', l: 'Departamento' },
            { k: 'responsable', l: 'Persona responsable' },
            { k: 'cargo', l: 'Cargo' },
            { k: 'telefono', l: 'Teléfono' },
            { k: 'correo', l: 'Correo' },
            { k: 'observaciones', l: 'Observaciones', area: true },
        ],
        columnas: ['codigo', 'nombre', 'cliente', 'municipio', 'responsable', 'telefono'],
    },
    equipos: {
        titulo: 'Equipos',
        subtitulo: 'Inventario de equipos instalados por sede',
        rel: { k: 'lugar', col: 'lugares', l: 'Lugar / Sede' },
        campos: [
            { k: 'tipo', l: 'Tipo de equipo', req: true },
            { k: 'marca', l: 'Marca' },
            { k: 'modelo', l: 'Modelo' },
            { k: 'serie', l: 'Número de serie' },
            { k: 'ip', l: 'Dirección IP' },
            { k: 'ubicacion', l: 'Ubicación física' },
            { k: 'estado', l: 'Estado' },
            { k: 'observaciones', l: 'Observaciones', area: true },
        ],
        columnas: ['tipo', 'marca', 'modelo', 'serie', 'ip', 'lugar', 'estado'],
    },
    materiales: {
        titulo: 'Materiales y Servicios',
        subtitulo: 'Catálogo general de materiales, equipos y servicios',
        campos: [
            { k: 'codigo', l: 'Código' },
            { k: 'categoria', l: 'Categoría' },
            { k: 'subcategoria', l: 'Subcategoría' },
            { k: 'descripcion', l: 'Descripción', req: true },
            { k: 'marca', l: 'Marca' },
            { k: 'modelo', l: 'Modelo' },
            { k: 'unidad', l: 'Unidad de medida', options: UNIDADES },
            { k: 'precio', l: 'Precio unitario', type: 'number' },
            { k: 'iva', l: 'Aplica IVA', bool: true },
            { k: 'activo', l: 'Activo', bool: true },
        ],
        columnas: ['codigo', 'categoria', 'descripcion', 'unidad', 'precio', 'activo'],
    },
    tecnicos: {
        titulo: 'Técnicos',
        subtitulo: 'Personal técnico responsable y auxiliar',
        campos: [
            { k: 'codigo', l: 'Código' },
            { k: 'nombre', l: 'Nombre completo', req: true },
            { k: 'cargo', l: 'Cargo' },
            { k: 'especialidad', l: 'Especialidad' },
            { k: 'telefono', l: 'Teléfono' },
            { k: 'correo', l: 'Correo' },
            { k: 'activo', l: 'Activo', bool: true },
        ],
        columnas: ['codigo', 'nombre', 'cargo', 'especialidad', 'telefono', 'activo'],
    },
};

const etiquetas = {
    codigo: 'Código',
    nombre: 'Nombre',
    dependencia: 'Dependencia',
    contacto: 'Contacto',
    telefono: 'Teléfono',
    correo: 'Correo',
    cliente: 'Cliente',
    lugar: 'Lugar',
    municipio: 'Municipio',
    responsable: 'Responsable',
    tipo: 'Tipo',
    marca: 'Marca',
    modelo: 'Modelo',
    serie: 'Serie',
    ip: 'IP',
    estado: 'Estado',
    categoria: 'Categoría',
    descripcion: 'Descripción',
    unidad: 'Unidad',
    precio: 'Precio',
    activo: 'Activo',
    especialidad: 'Especialidad',
    cargo: 'Cargo',
};

export default function CatalogoPage({ tipo }) {
    const cfg = CATALOGOS[tipo];
    const nombreCol = tipo === 'materiales' ? 'catalogo' : tipo;
    const { items, loading, reload } = useCollection(nombreCol, cfg.rel ? { expand: cfg.rel.k } : undefined);
    const { items: relItems } = useCollection(cfg.rel ? cfg.rel.col : 'configuracion');
    const [abierto, setAbierto] = useState(false);
    const [form, setForm] = useState({});
    const [busqueda, setBusqueda] = useState('');
    const [toast, setToast] = useToastMsg();

    const filtrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        if (!q) return items;
        return items.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
    }, [items, busqueda]);

    const abrir = (row) => {
        setForm(row ? { ...row } : { activo: true, iva: true });
        setAbierto(true);
    };

    const guardar = async (e) => {
        e.preventDefault();
        const data = {};
        cfg.campos.forEach((c) => {
            let v = form[c.k];
            if (c.type === 'number') v = Number(v || 0);
            if (c.bool) v = Boolean(v);
            data[c.k] = v ?? '';
        });
        if (cfg.rel) data[cfg.rel.k] = form[cfg.rel.k] || '';
        try {
            if (form.id) await updateRec(nombreCol, form.id, data);
            else await createRec(nombreCol, data);
            setAbierto(false);
            setToast('Registro guardado');
            reload();
        } catch (err) {
            setToast(err?.message || 'Error al guardar');
        }
    };

    const eliminar = async (row) => {
        try {
            await removeRec(nombreCol, row.id);
            setToast('Registro eliminado');
            reload();
        } catch (err) {
            setToast(err?.message || 'No se pudo eliminar');
        }
    };

    const celda = (row, k) => {
        if (k === 'precio') return money(row[k]);
        if (k === 'activo' || k === 'iva') return row[k] ? 'Sí' : 'No';
        if (cfg.rel && k === cfg.rel.k) return row.expand?.[k]?.nombre || '—';
        return row[k] || '—';
    };

    return (
        <AppLayout
            title={cfg.titulo}
            subtitle={cfg.subtitulo}
            actions={
                <button type="button" className={btn.primary} onClick={() => abrir(null)}>
                    <Plus className="h-4 w-4" /> Nuevo registro
                </button>
            }
        >
            <Helmet>
                <title>{cfg.titulo} | Sistema de Mantenimiento CCTV</title>
                <meta name="description" content={`Administración del catálogo de ${cfg.titulo.toLowerCase()} del sistema de mantenimiento CCTV.`} />
            </Helmet>

            <Seccion
                title={`${filtrados.length} registros`}
                actions={
                    <input
                        className={`${inputCls} sm:w-64`}
                        placeholder="Buscar..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                }
            >
                {loading ? (
                    <Cargando />
                ) : filtrados.length === 0 ? (
                    <Vacio />
                ) : (
                    <Tabla columns={[...cfg.columnas.map((c) => etiquetas[c] || c), 'Acciones']}>
                        {filtrados.map((row) => (
                            <tr key={row.id} className="hover:bg-secondary">
                                {cfg.columnas.map((k) => (
                                    <td key={k} className="px-3 py-2">
                                        {celda(row, k)}
                                    </td>
                                ))}
                                <td className="px-3 py-2">
                                    <div className="flex gap-2">
                                        <button type="button" className={btn.ghost} onClick={() => abrir(row)}>
                                            <Pencil className="h-3.5 w-3.5" /> Editar
                                        </button>
                                        <button type="button" className={btn.danger} onClick={() => eliminar(row)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </Tabla>
                )}
            </Seccion>

            <Modal open={abierto} onClose={() => setAbierto(false)} title={form.id ? 'Editar registro' : 'Nuevo registro'} wide>
                <form onSubmit={guardar} className="grid gap-4 sm:grid-cols-2">
                    {cfg.rel && (
                        <Selector
                            label={cfg.rel.l}
                            value={form[cfg.rel.k]}
                            onChange={(v) => setForm((p) => ({ ...p, [cfg.rel.k]: v }))}
                            options={relItems.map((r) => ({ value: r.id, label: r.nombre }))}
                        />
                    )}
                    {cfg.campos.map((c) => {
                        if (c.bool) {
                            return (
                                <label key={c.k} className="flex items-center gap-2 pt-6 text-sm font-medium text-foreground">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(form[c.k])}
                                        onChange={(e) => setForm((p) => ({ ...p, [c.k]: e.target.checked }))}
                                    />
                                    {c.l}
                                </label>
                            );
                        }
                        if (c.options) {
                            return (
                                <Selector
                                    key={c.k}
                                    label={c.l}
                                    value={form[c.k]}
                                    onChange={(v) => setForm((p) => ({ ...p, [c.k]: v }))}
                                    options={c.options}
                                />
                            );
                        }
                        if (c.area) {
                            return (
                                <AreaTexto
                                    key={c.k}
                                    label={c.l}
                                    className="sm:col-span-2"
                                    value={form[c.k]}
                                    onChange={(v) => setForm((p) => ({ ...p, [c.k]: v }))}
                                />
                            );
                        }
                        return (
                            <Texto
                                key={c.k}
                                label={c.l}
                                type={c.type || 'text'}
                                required={c.req}
                                value={form[c.k]}
                                onChange={(v) => setForm((p) => ({ ...p, [c.k]: v }))}
                            />
                        );
                    })}
                    <div className="flex gap-2 sm:col-span-2">
                        <button type="submit" className={btn.primary}>
                            Guardar
                        </button>
                        <button type="button" className={btn.ghost} onClick={() => setAbierto(false)}>
                            Cancelar
                        </button>
                    </div>
                </form>
            </Modal>
            {toast}
        </AppLayout>
    );
}
