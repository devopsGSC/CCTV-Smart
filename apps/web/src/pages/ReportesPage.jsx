import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Download, FileSpreadsheet, FileText, FileDown, RefreshCw } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { Seccion, Tabla, Texto, btn, Vacio } from '@/components/kit';
import { useCollection, money } from '@/lib/db';
import { totalCarta } from '@/pages/CartasPage';

// ── helpers ──────────────────────────────────────────────────────────────────

const hoy = () => new Date().toISOString().slice(0, 10);

const fmtFecha = (s) => {
    if (!s) return '';
    const [y, m, d] = s.split('-');
    return `${d || ''}/${m || ''}/${y || ''}`;
};

// ── CSV ───────────────────────────────────────────────────────────────────────
const descargarCSV = (nombre, columnas, filas) => {
    const lineas = [columnas, ...filas].map((r) =>
        r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','),
    );
    const blob = new Blob([`\uFEFF${lineas.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_${nombre}_${hoy()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
};

// ── Excel ─────────────────────────────────────────────────────────────────────
const descargarExcel = async (nombre, columnas, filas) => {
    const { utils, writeFile } = await import('xlsx');
    const ws = utils.aoa_to_sheet([columnas, ...filas]);
    // bold header
    const range = utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; C++) {
        const cell = ws[utils.encode_cell({ r: 0, c: C })];
        if (cell) cell.s = { font: { bold: true }, fill: { fgColor: { rgb: '1E40AF' } }, font: { bold: true, color: { rgb: 'FFFFFF' } } };
    }
    // auto col width
    ws['!cols'] = columnas.map((_, ci) => {
        const maxLen = Math.max(
            columnas[ci].length,
            ...filas.map((r) => String(r[ci] ?? '').length),
        );
        return { wch: Math.min(maxLen + 2, 50) };
    });
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, nombre.slice(0, 31));
    writeFile(wb, `Reporte_${nombre}_${hoy()}.xlsx`);
};

// ── PDF ───────────────────────────────────────────────────────────────────────
const descargarPDF = async (nombre, columnas, filas, empresa) => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF({ orientation: filas.length > 10 ? 'landscape' : 'portrait', unit: 'mm', format: 'letter' });
    const fechaGen = fmtFecha(hoy());

    // header
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(empresa || 'Sistema CCTV', 14, 10);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Reporte: ${nombre}`, 14, 17);
    doc.text(`Generado: ${fechaGen}`, doc.internal.pageSize.getWidth() - 14, 17, { align: 'right' });
    doc.setTextColor(0, 0, 0);

    autoTable(doc, {
        startY: 28,
        head: [columnas],
        body: filas.map((r) => r.map((c) => String(c ?? ''))),
        headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [241, 245, 249] },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
            const pg = doc.getNumberOfPages();
            doc.setFontSize(7);
            doc.setTextColor(150);
            doc.text(`Página ${data.pageNumber} de ${pg}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' });
        },
    });

    doc.save(`Reporte_${nombre.replace(/\s+/g, '_')}_${hoy()}.pdf`);
};

// ── BotonesExport ─────────────────────────────────────────────────────────────
function BotonesExport({ nombre, columnas, filas, empresa }) {
    return (
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <button type="button" className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 active:scale-[0.98] sm:flex-none"
                onClick={() => descargarExcel(nombre, columnas, filas)}>
                <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
            </button>
            <button type="button" className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 active:scale-[0.98] sm:flex-none"
                onClick={() => descargarPDF(nombre, columnas, filas, empresa)}>
                <FileText className="h-3.5 w-3.5" /> PDF
            </button>
            <button type="button" className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-md border border-input bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-secondary active:scale-[0.98] sm:flex-none"
                onClick={() => descargarCSV(nombre, columnas, filas)}>
                <FileDown className="h-3.5 w-3.5" /> CSV
            </button>
        </div>
    );
}

// ── ReporteCard ───────────────────────────────────────────────────────────────
function ReporteCard({ titulo, descripcion, columnas, datos, empresa }) {
    return (
        <div className="rounded-xl border border-border bg-card shadow-sm">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
                <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-foreground">{titulo}</h3>
                    {descripcion && <p className="mt-0.5 text-xs text-muted-foreground">{descripcion}</p>}
                </div>
                <BotonesExport nombre={titulo} columnas={columnas} filas={datos} empresa={empresa} />
            </header>
            <div className="p-4">
                {datos.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">Sin datos en el período seleccionado</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[400px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-border bg-secondary text-xs text-muted-foreground">
                                    {columnas.map((c) => <th key={c} className="px-3 py-2 font-semibold">{c}</th>)}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {datos.map((row, i) => (
                                    <tr key={i} className="hover:bg-secondary">
                                        {row.map((c, j) => <td key={j} className="px-3 py-2">{c}</td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ReportesPage() {
    const { items: ordenes } = useCollection('ordenes', { expand: 'cliente,lugar,tecnico' });
    const { items: cartas } = useCollection('cartas', { expand: 'cliente' });
    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState('');
    const empresa = 'Sistema de Mantenimiento CCTV';

    const enRango = (fecha) => {
        if (desde && (fecha || '') < desde) return false;
        if (hasta && (fecha || '') > hasta) return false;
        return true;
    };

    const ords = useMemo(() => ordenes.filter((o) => enRango(o.fechaProgramada)), [ordenes, desde, hasta]);
    const cts = useMemo(() => cartas.filter((c) => enRango(c.fecha)), [cartas, desde, hasta]);

    const agrupar = (lista, fn) => {
        const map = {};
        lista.forEach((x) => { const k = fn(x); if (!k) return; map[k] = (map[k] || 0) + 1; });
        return Object.entries(map).sort((a, b) => b[1] - a[1]);
    };

    const equiposFallas = useMemo(() => {
        const map = {};
        ords.forEach((o) => (o.equipos || []).forEach((e) => {
            if (!e.estadoFinal || e.estadoFinal === 'Operativo') return;
            const k = `${e.tipo} ${e.marca} ${e.modelo}`.trim();
            map[k] = (map[k] || 0) + 1;
        }));
        return Object.entries(map).sort((a, b) => b[1] - a[1]);
    }, [ords]);

    const materiales = useMemo(() => {
        const map = {};
        ords.forEach((o) => (o.materiales || []).forEach((m) => {
            const k = `${m.codigo || ''} ${m.descripcion || ''}`.trim();
            if (!k) return;
            map[k] = (map[k] || 0) + Number(m.cantidad || 0);
        }));
        return Object.entries(map).sort((a, b) => b[1] - a[1]);
    }, [ords]);

    const valorOfertado = cts.reduce((s, c) => s + totalCarta(c).total, 0);
    const valorAprobado = cts.filter((c) => ['Aprobada', 'Aprobada parcialmente'].includes(c.estado)).reduce((s, c) => s + totalCarta(c).total, 0);

    // ── datasets ──────────────────────────────────────────────────────────────
    const dsOrdenes = useMemo(() => ords.map((o) => [
        o.numero,
        fmtFecha(o.fechaProgramada),
        o.expand?.cliente?.nombre || '—',
        o.expand?.lugar?.nombre || '—',
        o.tipoVisita || '—',
        o.expand?.tecnico?.nombre || '—',
        o.prioridad || '—',
        o.estado || '—',
    ]), [ords]);

    const colOrdenes = ['N.º Orden', 'Fecha', 'Cliente', 'Lugar', 'Tipo', 'Técnico', 'Prioridad', 'Estado'];

    const dsPreventivos = useMemo(() => ords.filter((o) => o.tipoVisita === 'Mantenimiento preventivo').map((o) => [
        o.numero, fmtFecha(o.fechaProgramada), o.expand?.cliente?.nombre || '—', o.expand?.lugar?.nombre || '—', o.estado || '—',
    ]), [ords]);

    const dsCorrectivos = useMemo(() => ords.filter((o) => o.tipoVisita === 'Mantenimiento correctivo').map((o) => [
        o.numero, fmtFecha(o.fechaProgramada), o.expand?.cliente?.nombre || '—', o.expand?.lugar?.nombre || '—', o.estado || '—',
    ]), [ords]);

    const dsFallas = useMemo(() => ords.filter((o) => o.correctivo?.fallaEncontrada).map((o) => [
        o.numero, fmtFecha(o.fechaProgramada), o.expand?.cliente?.nombre || '—', o.correctivo?.fallaEncontrada || '—',
    ]), [ords]);

    const dsLugares = useMemo(() => agrupar(ords, (o) => o.expand?.lugar?.nombre), [ords]);

    const dsCartasAprobadas = useMemo(() => cts.filter((c) => ['Aprobada', 'Aprobada parcialmente'].includes(c.estado)).map((c) => [
        c.numero, fmtFecha(c.fecha), c.expand?.cliente?.nombre || '—', c.estado, money(totalCarta(c).total),
    ]), [cts]);

    const dsCartasPendientes = useMemo(() => cts.filter((c) => ['Borrador', 'Enviada', 'Pendiente de aprobación'].includes(c.estado)).map((c) => [
        c.numero, fmtFecha(c.fecha), c.expand?.cliente?.nombre || '—', c.estado, money(totalCarta(c).total),
    ]), [cts]);

    const dsCartas = useMemo(() => cts.map((c) => [
        c.numero, fmtFecha(c.fecha), c.expand?.cliente?.nombre || '—', c.estado, money(totalCarta(c).total),
    ]), [cts]);

    const dsResumen = [
        ['Visitas / Órdenes en el período', ords.length],
        ['Preventivos realizados', ords.filter((o) => o.tipoVisita === 'Mantenimiento preventivo' && o.estado === 'Finalizada').length],
        ['Correctivos realizados', ords.filter((o) => o.tipoVisita === 'Mantenimiento correctivo' && o.estado === 'Finalizada').length],
        ['Fallas detectadas', ords.filter((o) => o.correctivo?.fallaEncontrada).length],
        ['Cartas Oferta emitidas', cts.length],
        ['Cartas Oferta aprobadas', cts.filter((c) => ['Aprobada', 'Aprobada parcialmente'].includes(c.estado)).length],
        ['Cartas Oferta pendientes', cts.filter((c) => ['Borrador', 'Enviada', 'Pendiente de aprobación'].includes(c.estado)).length],
        ['Valor total ofertado', money(valorOfertado)],
        ['Valor total aprobado', money(valorAprobado)],
    ];

    const reportes = [
        {
            titulo: 'Resumen del período',
            descripcion: 'KPIs consolidados de órdenes, visitas y cartas oferta.',
            columnas: ['Indicador', 'Valor'],
            datos: dsResumen,
        },
        {
            titulo: 'Órdenes por período',
            descripcion: 'Listado completo de órdenes de trabajo en el rango de fechas.',
            columnas: colOrdenes,
            datos: dsOrdenes,
        },
        {
            titulo: 'Preventivos realizados',
            descripcion: 'Mantenimientos preventivos en el período.',
            columnas: ['N.º Orden', 'Fecha', 'Cliente', 'Lugar', 'Estado'],
            datos: dsPreventivos,
        },
        {
            titulo: 'Correctivos realizados',
            descripcion: 'Mantenimientos correctivos en el período.',
            columnas: ['N.º Orden', 'Fecha', 'Cliente', 'Lugar', 'Estado'],
            datos: dsCorrectivos,
        },
        {
            titulo: 'Fallas detectadas',
            descripcion: 'Órdenes con falla encontrada en el correctivo.',
            columnas: ['N.º Orden', 'Fecha', 'Cliente', 'Falla'],
            datos: dsFallas,
        },
        {
            titulo: 'Equipos con mayor número de fallas',
            descripcion: 'Equipos que presentaron fallas ordenados por frecuencia.',
            columnas: ['Equipo', 'Fallas'],
            datos: equiposFallas,
        },
        {
            titulo: 'Lugares con mayor número de incidencias',
            descripcion: 'Sedes/lugares con más órdenes de trabajo.',
            columnas: ['Lugar', 'Órdenes'],
            datos: dsLugares,
        },
        {
            titulo: 'Materiales utilizados',
            descripcion: 'Materiales consumidos en el período.',
            columnas: ['Material', 'Cantidad'],
            datos: materiales,
        },
        {
            titulo: 'Cartas Oferta emitidas',
            descripcion: 'Todas las cartas oferta en el rango de fechas.',
            columnas: ['N.º Carta', 'Fecha', 'Cliente', 'Estado', 'Total'],
            datos: dsCartas,
        },
        {
            titulo: 'Cartas Oferta aprobadas',
            descripcion: 'Cartas oferta aprobadas (total y parcialmente).',
            columnas: ['N.º Carta', 'Fecha', 'Cliente', 'Estado', 'Total'],
            datos: dsCartasAprobadas,
        },
        {
            titulo: 'Cartas Oferta pendientes',
            descripcion: 'Cartas en borrador, enviadas o pendientes de aprobación.',
            columnas: ['N.º Carta', 'Fecha', 'Cliente', 'Estado', 'Total'],
            datos: dsCartasPendientes,
        },
    ];

    return (
        <AppLayout title="Reportes" subtitle="Indicadores operativos y exportación de datos">
            <Helmet>
                <title>Reportes | Sistema de Mantenimiento CCTV</title>
                <meta name="description" content="Reportes de visitas, órdenes, fallas, materiales y cartas oferta con exportación a Excel, PDF y CSV." />
            </Helmet>

            {/* Filtros */}
            <div className="rounded-xl border border-border bg-card shadow-sm mb-6">
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                    <h3 className="text-sm font-bold text-foreground">Período de análisis</h3>
                    <button type="button" className={btn.ghost} onClick={() => { setDesde(''); setHasta(''); }}>
                        Limpiar filtros
                    </button>
                </header>
                <div className="p-4">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-xs font-semibold text-muted-foreground">Fecha desde</span>
                            <input type="date" className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" value={desde} onChange={(e) => setDesde(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <span className="text-xs font-semibold text-muted-foreground">Fecha hasta</span>
                            <input type="date" className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" value={hasta} onChange={(e) => setHasta(e.target.value)} />
                        </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span><strong className="text-foreground">{ords.length}</strong> órdenes</span>
                        <span><strong className="text-foreground">{cts.length}</strong> cartas oferta</span>
                        <span><strong className="text-emerald-700">{money(valorAprobado)}</strong> aprobado</span>
                        <span><strong className="text-blue-700">{money(valorOfertado)}</strong> ofertado</span>
                    </div>
                </div>
            </div>

            {/* Reportes */}
            <div className="space-y-4">
                {reportes.map((r) => (
                    <ReporteCard key={r.titulo} empresa={empresa} {...r} />
                ))}
            </div>
        </AppLayout>
    );
}
