import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Plus, Trash2, Pencil, Search, ShieldCheck, UserCog, Save, X } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import AppLayout from '@/components/AppLayout';
import { Seccion, Tabla, Vacio, Cargando, Modal, btn, inputCls, useToastMsg } from '@/components/kit';

const ROLES = ['Admin', 'Usuario'];

const RolBadge = ({ rol }) => {
    const cls = rol === 'Admin'
        ? 'bg-blue-50 text-blue-800 border-blue-200'
        : 'bg-secondary text-foreground border-border';
    return (
        <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
            {rol === 'Admin' ? <ShieldCheck className="h-3 w-3" /> : <UserCog className="h-3 w-3" />}
            {rol || '—'}
        </span>
    );
};

const EstadoBadge = ({ activo }) => (
    <span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
        activo ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
    }`}>
        {activo ? 'Activo' : 'Inactivo'}
    </span>
);

const vacioForm = { email: '', name: '', role: 'Usuario', activo: true, password: '' };

export default function UsuariosPage() {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busq, setBusq] = useState('');
    const [fRol, setFRol] = useState('');
    const [fEstado, setFEstado] = useState('');
    const [modal, setModal] = useState(null); // { modo: 'crear'|'editar', data }
    const [pendiente, setPendiente] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const [toast, setToast] = useToastMsg();

    const cargar = async () => {
        setLoading(true);
        try {
            const rows = await pb.collection('users').getFullList({ sort: 'name', requestKey: 'users-list' });
            setUsuarios(rows);
        } catch (err) {
            setToast(err?.message || 'No se pudo cargar usuarios');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { cargar(); }, []);

    const filtrados = useMemo(() => {
        const q = busq.trim().toLowerCase();
        return usuarios.filter((u) => {
            if (fRol && u.role !== fRol) return false;
            if (fEstado === 'Activo' && u.activo === false) return false;
            if (fEstado === 'Inactivo' && u.activo !== false) return false;
            if (q && !(`${u.email} ${u.name || ''}`.toLowerCase().includes(q))) return false;
            return true;
        });
    }, [usuarios, busq, fRol, fEstado]);

    const abrirCrear = () => setModal({ modo: 'crear', data: { ...vacioForm } });
    const abrirEditar = (u) => setModal({ modo: 'editar', data: { id: u.id, email: u.email, name: u.name || '', role: u.role || 'Usuario', activo: u.activo !== false, password: '' } });

    const guardar = async () => {
        const d = modal.data;
        if (!d.email.trim() || !d.name.trim()) {
            setToast('Correo y nombre son obligatorios');
            return;
        }
        if (modal.modo === 'crear' && (!d.password || d.password.length < 8)) {
            setToast('La contraseña temporal debe tener al menos 8 caracteres');
            return;
        }
        setGuardando(true);
        try {
            if (modal.modo === 'crear') {
                await pb.collection('users').create({
                    email: d.email.trim(),
                    name: d.name.trim(),
                    role: d.role,
                    activo: d.activo,
                    password: d.password,
                    passwordConfirm: d.password,
                    verified: true,
                }, { requestKey: `user-create-${Date.now()}` });
                setToast('Usuario creado');
            } else {
                const payload = {
                    name: d.name.trim(),
                    role: d.role,
                    activo: d.activo,
                };
                if (d.password) {
                    if (d.password.length < 8) {
                        setToast('La nueva contraseña debe tener al menos 8 caracteres');
                        setGuardando(false);
                        return;
                    }
                    payload.password = d.password;
                    payload.passwordConfirm = d.password;
                }
                await pb.collection('users').update(d.id, payload, { requestKey: `user-update-${d.id}` });
                setToast('Usuario actualizado');
            }
            setModal(null);
            cargar();
        } catch (err) {
            const data = err?.response?.data || {};
            const msg = data.email?.message || err?.message || 'No se pudo guardar el usuario';
            setToast(typeof msg === 'string' ? msg : 'Error al guardar');
        } finally {
            setGuardando(false);
        }
    };

    const confirmarEliminar = async () => {
        if (!pendiente) return;
        try {
            await pb.collection('users').delete(pendiente.id, { requestKey: `user-del-${pendiente.id}` });
            setToast('Usuario eliminado');
            cargar();
        } catch (err) {
            setToast(err?.message || 'No se pudo eliminar');
        } finally {
            setPendiente(null);
        }
    };

    const setCampo = (k, v) => setModal((m) => ({ ...m, data: { ...m.data, [k]: v } }));

    return (
        <AppLayout
            title="Gestión de Usuarios"
            subtitle="Administre cuentas, roles y estados de acceso al sistema"
            actions={
                <button type="button" className={btn.primary} onClick={abrirCrear}>
                    <Plus className="h-4 w-4" /> Nuevo usuario
                </button>
            }
        >
            <Helmet>
                <title>Gestión de Usuarios | Sistema de Mantenimiento CCTV</title>
                <meta name="description" content="Administración de usuarios, roles y permisos del sistema de mantenimiento CCTV." />
            </Helmet>

            <Seccion
                title="Filtros"
                actions={
                    <button type="button" className={btn.ghost} onClick={() => { setBusq(''); setFRol(''); setFEstado(''); }}>
                        Limpiar
                    </button>
                }
            >
                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            className={`${inputCls} pl-9`}
                            placeholder="Buscar por nombre o correo…"
                            value={busq}
                            onChange={(e) => setBusq(e.target.value)}
                        />
                    </div>
                    <select className={inputCls} value={fRol} onChange={(e) => setFRol(e.target.value)}>
                        <option value="">Todos los roles</option>
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <select className={inputCls} value={fEstado} onChange={(e) => setFEstado(e.target.value)}>
                        <option value="">Todos los estados</option>
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                    </select>
                </div>
            </Seccion>

            <Seccion title={`${filtrados.length} usuarios`} className="mt-6">
                {loading ? (
                    <Cargando />
                ) : filtrados.length === 0 ? (
                    <Vacio mensaje="Sin usuarios que coincidan" />
                ) : (
                    <Tabla columns={['Nombre', 'Correo', 'Rol', 'Estado', 'Acciones']}>
                        {filtrados.map((u) => (
                            <tr key={u.id} className="hover:bg-secondary">
                                <td className="px-3 py-2 font-medium text-foreground">{u.name || '—'}</td>
                                <td className="px-3 py-2 text-muted-foreground">{u.email}</td>
                                <td className="px-3 py-2"><RolBadge rol={u.role} /></td>
                                <td className="px-3 py-2"><EstadoBadge activo={u.activo !== false} /></td>
                                <td className="px-3 py-2">
                                    <div className="flex gap-1">
                                        <button type="button" className="rounded p-1.5 text-blue-700 hover:bg-blue-50" onClick={() => abrirEditar(u)} title="Editar">
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button type="button" className="rounded p-1.5 text-rose-700 hover:bg-rose-50" onClick={() => setPendiente(u)} title="Eliminar">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </Tabla>
                )}
            </Seccion>

            {/* Modal crear / editar */}
            <Modal
                open={Boolean(modal)}
                onClose={() => setModal(null)}
                title={modal?.modo === 'crear' ? 'Nuevo usuario' : 'Editar usuario'}
            >
                {modal && (
                    <div className="space-y-4">
                        <label className="flex flex-col gap-1.5">
                            <span className="text-xs font-semibold text-muted-foreground">Nombre completo</span>
                            <input className={inputCls} value={modal.data.name} onChange={(e) => setCampo('name', e.target.value)} />
                        </label>
                        <label className="flex flex-col gap-1.5">
                            <span className="text-xs font-semibold text-muted-foreground">Correo electrónico</span>
                            <input
                                type="email"
                                className={inputCls}
                                value={modal.data.email}
                                disabled={modal.modo === 'editar'}
                                onChange={(e) => setCampo('email', e.target.value)}
                            />
                        </label>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="flex flex-col gap-1.5">
                                <span className="text-xs font-semibold text-muted-foreground">Rol</span>
                                <select className={inputCls} value={modal.data.role} onChange={(e) => setCampo('role', e.target.value)}>
                                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </label>
                            <label className="flex flex-col gap-1.5">
                                <span className="text-xs font-semibold text-muted-foreground">Estado</span>
                                <select className={inputCls} value={modal.data.activo ? 'Activo' : 'Inactivo'} onChange={(e) => setCampo('activo', e.target.value === 'Activo')}>
                                    <option value="Activo">Activo</option>
                                    <option value="Inactivo">Inactivo</option>
                                </select>
                            </label>
                        </div>
                        <label className="flex flex-col gap-1.5">
                            <span className="text-xs font-semibold text-muted-foreground">
                                {modal.modo === 'crear' ? 'Contraseña temporal' : 'Nueva contraseña (dejar vacío para mantener)'}
                            </span>
                            <input
                                type="password"
                                className={inputCls}
                                value={modal.data.password}
                                placeholder="Mínimo 8 caracteres"
                                onChange={(e) => setCampo('password', e.target.value)}
                            />
                        </label>

                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" className={btn.ghost} onClick={() => setModal(null)}>
                                <X className="h-4 w-4" /> Cancelar
                            </button>
                            <button type="button" className={btn.primary} onClick={guardar} disabled={guardando}>
                                <Save className="h-4 w-4" /> {guardando ? 'Guardando…' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Confirmar eliminación */}
            <Modal open={Boolean(pendiente)} onClose={() => setPendiente(null)} title="Eliminar usuario">
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        ¿Seguro que desea eliminar el usuario <strong>{pendiente?.name}</strong> ({pendiente?.email})?
                        Esta acción no se puede deshacer.
                    </p>
                    <div className="flex justify-end gap-2">
                        <button type="button" className={btn.ghost} onClick={() => setPendiente(null)}>Cancelar</button>
                        <button type="button" className={btn.danger} onClick={confirmarEliminar}>
                            <Trash2 className="h-4 w-4" /> Eliminar
                        </button>
                    </div>
                </div>
            </Modal>

            {toast}
        </AppLayout>
    );
}
