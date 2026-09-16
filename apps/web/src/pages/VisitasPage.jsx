import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { Seccion, EstadoBadge, btn, Vacio } from '@/components/kit';
import { useCollection } from '@/lib/db';

const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
};
const startOfWeek = (d) => addDays(d, -((d.getDay() + 6) % 7));

export default function VisitasPage() {
    const { items: ordenes } = useCollection('ordenes', { expand: 'cliente,lugar,tecnico', sort: 'fechaProgramada' });
    const [vista, setVista] = useState('Mes');
    const [ref, setRef] = useState(new Date());

    const porFecha = useMemo(() => {
        const map = {};
        ordenes.forEach((o) => {
            if (!o.fechaProgramada) return;
            map[o.fechaProgramada] = [...(map[o.fechaProgramada] || []), o];
        });
        return map;
    }, [ordenes]);

    const dias = useMemo(() => {
        if (vista === 'Día') return [new Date(ref)];
        if (vista === 'Semana') {
            const s = startOfWeek(ref);
            return Array.from({ length: 7 }, (_, i) => addDays(s, i));
        }
        const first = new Date(ref.getFullYear(), ref.getMonth(), 1);
        const start = startOfWeek(first);
        return Array.from({ length: 42 }, (_, i) => addDays(start, i));
    }, [vista, ref]);

    const mover = (dir) => {
        if (vista === 'Día') setRef((d) => addDays(d, dir));
        else if (vista === 'Semana') setRef((d) => addDays(d, dir * 7));
        else setRef((d) => new Date(d.getFullYear(), d.getMonth() + dir, 1));
    };

    const titulo = ref.toLocaleDateString('es-SV', { month: 'long', year: 'numeric', day: vista === 'Día' ? 'numeric' : undefined });

    const Evento = ({ o }) => (
        <Link
            to={`/ordenes/${o.id}`}
            className="mb-1 block rounded border border-blue-200 bg-blue-50 px-1.5 py-1 text-[11px] leading-tight text-foreground hover:bg-blue-50"
        >
            <span className="font-semibold">{o.horaProgramada || '--:--'}</span> {o.expand?.lugar?.nombre || 'Sin lugar'}
            <span className="block text-muted-foreground">{o.expand?.cliente?.nombre}</span>
            <span className="block text-muted-foreground">{o.expand?.tecnico?.nombre} · {o.tipoVisita}</span>
            <span className="mt-1 block"><EstadoBadge estado={o.estado} /></span>
        </Link>
    );

    return (
        <AppLayout title="Programación de Visitas" subtitle="Calendario de visitas técnicas programadas">
            <Helmet>
                <title>Programación de Visitas | Sistema de Mantenimiento CCTV</title>
                <meta name="description" content="Calendario mensual, semanal y diario de visitas técnicas de mantenimiento CCTV." />
            </Helmet>

            <Seccion
                title={titulo}
                actions={
                    <>
                        {['Mes', 'Semana', 'Día'].map((v) => (
                            <button key={v} type="button" className={vista === v ? btn.primary : btn.ghost} onClick={() => setVista(v)}>
                                {v}
                            </button>
                        ))}
                        <button type="button" className={btn.ghost} onClick={() => mover(-1)}><ChevronLeft className="h-4 w-4" /></button>
                        <button type="button" className={btn.ghost} onClick={() => setRef(new Date())}>Hoy</button>
                        <button type="button" className={btn.ghost} onClick={() => mover(1)}><ChevronRight className="h-4 w-4" /></button>
                    </>
                }
            >
                {vista === 'Día' ? (
                    <div>
                        {(porFecha[iso(dias[0])] || []).length === 0 ? (
                            <Vacio mensaje="Sin visitas programadas este día" />
                        ) : (
                            porFecha[iso(dias[0])].map((o) => <Evento key={o.id} o={o} />)
                        )}
                    </div>
                ) : (
                    <div className={`grid gap-1 ${vista === 'Semana' ? 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-7' : 'grid-cols-7'}`}>
                        {vista === 'Mes' &&
                            ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                                <div key={`${d}${i}`} className="pb-1 text-center text-xs font-bold uppercase text-muted-foreground">
                                    {d}
                                </div>
                            ))}
                        {dias.map((d) => {
                            const key = iso(d);
                            const fuera = vista === 'Mes' && d.getMonth() !== ref.getMonth();
                            return (
                                <div key={key} className={`min-h-[92px] rounded-lg border p-1.5 ${fuera ? 'border-border bg-secondary text-muted-foreground' : 'border-border bg-card'}`}>
                                    <p className="mb-1 text-xs font-bold">{d.getDate()}</p>
                                    {(porFecha[key] || []).map((o) => <Evento key={o.id} o={o} />)}
                                </div>
                            );
                        })}
                    </div>
                )}
            </Seccion>
        </AppLayout>
    );
}
