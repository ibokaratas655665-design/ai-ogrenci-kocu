/**
 * 🕸️ SOSYOMETRİ GÖRSEL AĞ HARİTASI (Madde 8)
 * D3-benzeri pure SVG ile interaktif sınıf ilişki ağı
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, RefreshCw, Download, Info, Users, Star, UserX, Heart } from 'lucide-react';

const ROLE_COLORS = {
    star:     { fill: 'var(--warn)', stroke: 'var(--warn)', label: 'Yıldız' },
    mutual:   { fill: 'var(--c1)', stroke: 'var(--brand)', label: 'Karşılıklı Seçim' },
    isolate:  { fill: 'var(--danger)', stroke: 'var(--danger)', label: 'İzole' },
    normal:   { fill: 'var(--ink-3)', stroke: 'var(--ink-3)', label: 'Normal' },
    selected: { fill: 'var(--ok)', stroke: '#059669', label: 'Seçilen' },
};

const getNodeRole = (name, results) => {
    const allChoices = results.flatMap(r => r.choices || []).map(c => String(c));
    const receivedCount = allChoices.filter(c => c === name).length;
    const gaveChoices = (results.find(r => r.name === name)?.choices || []);
    const mutualCount = gaveChoices.filter(c => allChoices.includes(name) && (results.find(r => r.name === c)?.choices || []).includes(name)).length;

    if (receivedCount >= 3) return 'star';
    if (receivedCount === 0 && gaveChoices.length === 0) return 'isolate';
    if (mutualCount > 0) return 'mutual';
    return 'normal';
};

const layoutNodes = (names, width, height) => {
    const cx = width / 2, cy = height / 2;
    const r = Math.min(width, height) * 0.35;
    return names.map((name, i) => {
        const angle = (i / names.length) * 2 * Math.PI - Math.PI / 2;
        return { name, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    });
};

const SociometryNetworkMap = ({ results = [], className = '' }) => {
    const svgRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 600, height: 450 });
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(null);
    const [selected, setSelected] = useState(null);
    const [showLegend, setShowLegend] = useState(true);

    useEffect(() => {
        const updateSize = () => {
            if (svgRef.current?.parentElement) {
                const { width } = svgRef.current.parentElement.getBoundingClientRect();
                setDimensions({ width: Math.max(300, width), height: Math.max(300, Math.min(width * 0.75, 500)) });
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    const { width, height } = dimensions;
    const names = [...new Set([
        ...results.map(r => r.name),
        ...results.flatMap(r => r.choices || [])
    ].filter(Boolean))];

    const nodes = layoutNodes(names, width, height);
    const nodeMap = Object.fromEntries(nodes.map(n => [n.name, n]));

    const allEdges = [];
    results.forEach(r => {
        (r.choices || []).forEach((choice, rank) => {
            const from = nodeMap[r.name];
            const to = nodeMap[choice];
            if (from && to) {
                const isMutual = (results.find(x => x.name === choice)?.choices || []).includes(r.name);
                allEdges.push({ from: r.name, to: choice, fromNode: from, toNode: to, rank: rank + 1, mutual: isMutual });
            }
        });
    });

    const mutualEdges = allEdges.filter(e => e.mutual && e.from < e.to);
    const oneWayEdges = allEdges.filter(e => !e.mutual);

    const receivedCounts = {};
    names.forEach(n => {
        receivedCounts[n] = allEdges.filter(e => e.to === n).length;
    });

    const handleNodeClick = (name) => setSelected(s => s === name ? null : name);

    // SVG arrow marker
    const ARROW_ID = 'arrow-marker';
    const ARROW_MUTUAL_ID = 'arrow-mutual';

    const selectedConnections = selected ? {
        chose: (results.find(r => r.name === selected)?.choices || []),
        chosenBy: allEdges.filter(e => e.to === selected).map(e => e.from),
    } : null;

    const stats = {
        stars: names.filter(n => getNodeRole(n, results) === 'star'),
        isolates: names.filter(n => getNodeRole(n, results) === 'isolate'),
        mutuals: mutualEdges.length,
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {/* KPI */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-warn-soft border border-warn rounded-2xl p-3 text-center">
                    <Star size={18} className="text-warn mx-auto mb-1" />
                    <p className="text-2xl font-black text-warn">{stats.stars.length}</p>
                    <p className="text-xs text-warn font-bold">Yıldız Öğrenci</p>
                    {stats.stars.length > 0 && <p className="text-[10px] text-warn truncate">{stats.stars.slice(0, 2).map(s => s.split(' ')[0]).join(', ')}</p>}
                </div>
                <div className="bg-danger-soft border border-danger rounded-2xl p-3 text-center">
                    <UserX size={18} className="text-danger mx-auto mb-1" />
                    <p className="text-2xl font-black text-danger">{stats.isolates.length}</p>
                    <p className="text-xs text-danger font-bold">İzole Öğrenci</p>
                </div>
                <div className="bg-brand-soft border border-brand-line rounded-2xl p-3 text-center">
                    <Heart size={18} className="text-brand mx-auto mb-1" />
                    <p className="text-2xl font-black text-brand">{stats.mutuals}</p>
                    <p className="text-xs text-brand font-bold">Karşılıklı Seçim</p>
                </div>
            </div>

            {/* Araçlar */}
            <div className="flex items-center justify-between">
                <div className="flex gap-1">
                    <button onClick={() => setZoom(z => Math.min(2, z + 0.2))} className="p-2 bg-surface border border-line rounded-xl hover:bg-surface-2 transition">
                        <ZoomIn size={14} className="text-ink-2" />
                    </button>
                    <button onClick={() => setZoom(z => Math.max(0.4, z - 0.2))} className="p-2 bg-surface border border-line rounded-xl hover:bg-surface-2 transition">
                        <ZoomOut size={14} className="text-ink-2" />
                    </button>
                    <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); setSelected(null); }} className="p-2 bg-surface border border-line rounded-xl hover:bg-surface-2 transition">
                        <RefreshCw size={14} className="text-ink-2" />
                    </button>
                </div>
                <button onClick={() => setShowLegend(l => !l)} className="flex items-center gap-1.5 text-xs text-ink-2 hover:text-ink-2 font-bold">
                    <Info size={13} /> Gösterge
                </button>
            </div>

            {/* SVG Harita */}
            <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-sm">
                <svg
                    ref={svgRef}
                    width={width}
                    height={height}
                    className="select-none"
                    style={{ cursor: 'grab' }}
                >
                    <defs>
                        <marker id={ARROW_ID} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                            <path d="M0,0 L0,6 L8,3 z" fill="var(--ink-3)" />
                        </marker>
                        <marker id={ARROW_MUTUAL_ID} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                            <path d="M0,0 L0,6 L8,3 z" fill="var(--c1)" />
                        </marker>
                    </defs>

                    <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
                        {/* Tek yönlü oklar */}
                        {oneWayEdges.map((e, i) => {
                            const dx = e.toNode.x - e.fromNode.x;
                            const dy = e.toNode.y - e.fromNode.y;
                            const len = Math.sqrt(dx * dx + dy * dy);
                            const ux = dx / len, uy = dy / len;
                            const nodeR = 18;
                            const x1 = e.fromNode.x + ux * nodeR;
                            const y1 = e.fromNode.y + uy * nodeR;
                            const x2 = e.toNode.x - ux * (nodeR + 6);
                            const y2 = e.toNode.y - uy * (nodeR + 6);
                            const isHighlighted = selected && (e.from === selected || e.to === selected);
                            const isDeemphasized = selected && !isHighlighted;
                            return (
                                <line
                                    key={`ow-${i}`}
                                    x1={x1} y1={y1} x2={x2} y2={y2}
                                    stroke={isHighlighted ? 'var(--c1)' : 'var(--line-2)'}
                                    strokeWidth={isHighlighted ? 2 : 1}
                                    strokeDasharray={e.rank === 1 ? '' : '3,3'}
                                    markerEnd={`url(#${ARROW_ID})`}
                                    opacity={isDeemphasized ? 0.15 : 0.7}
                                    className="transition-opacity duration-normal"
                                />
                            );
                        })}

                        {/* Karşılıklı çift çizgiler */}
                        {mutualEdges.map((e, i) => {
                            const isHighlighted = selected && (e.from === selected || e.to === selected);
                            const isDeemphasized = selected && !isHighlighted;
                            return (
                                <line
                                    key={`me-${i}`}
                                    x1={e.fromNode.x} y1={e.fromNode.y}
                                    x2={e.toNode.x}   y2={e.toNode.y}
                                    stroke="var(--c1)"
                                    strokeWidth={isHighlighted ? 3 : 2}
                                    opacity={isDeemphasized ? 0.1 : 0.6}
                                    strokeDasharray=""
                                    className="transition-opacity duration-normal"
                                />
                            );
                        })}

                        {/* Düğümler */}
                        {nodes.map(node => {
                            const role = getNodeRole(node.name, results);
                            const cfg = ROLE_COLORS[role];
                            const isSelected = selected === node.name;
                            const isConnected = selected && selectedConnections &&
                                (selectedConnections.chose.includes(node.name) || selectedConnections.chosenBy.includes(node.name));
                            const isDim = selected && !isSelected && !isConnected;
                            const r = isSelected ? 22 : receivedCounts[node.name] > 0 ? 18 + receivedCounts[node.name] : 16;

                            return (
                                <g
                                    key={node.name}
                                    transform={`translate(${node.x},${node.y})`}
                                    onClick={() => handleNodeClick(node.name)}
                                    style={{ cursor: 'pointer' }}
                                    opacity={isDim ? 0.2 : 1}
                                    className="transition-opacity duration-normal"
                                >
                                    <circle r={r + 3} fill={isSelected ? '#c7d2fe' : 'transparent'} />
                                    <circle
                                        r={r}
                                        fill={cfg.fill}
                                        stroke={isSelected ? 'var(--brand)' : cfg.stroke}
                                        strokeWidth={isSelected ? 3 : 2}
                                        className="transition-all duration-normal"
                                    />
                                    <text
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        fontSize="8"
                                        fontWeight="bold"
                                        fill="white"
                                        style={{ pointerEvents: 'none' }}
                                    >
                                        {node.name.split(' ').map(w => w.charAt(0)).join('').substring(0, 2).toUpperCase()}
                                    </text>
                                    {receivedCounts[node.name] > 0 && (
                                        <text
                                            x={r - 4} y={-(r - 4)}
                                            fontSize="7"
                                            fontWeight="black"
                                            fill="#312e81"
                                            textAnchor="middle"
                                            style={{ pointerEvents: 'none' }}
                                        >
                                            {receivedCounts[node.name]}
                                        </text>
                                    )}
                                    <text
                                        y={r + 12}
                                        textAnchor="middle"
                                        fontSize="9"
                                        fontWeight="600"
                                        fill={isSelected ? 'var(--brand)' : '#374151'}
                                        style={{ pointerEvents: 'none' }}
                                    >
                                        {node.name.split(' ')[0]}
                                    </text>
                                </g>
                            );
                        })}
                    </g>
                </svg>
            </div>

            {/* Seçili Öğrenci Bilgisi */}
            {selected && selectedConnections && (
                <div className="bg-brand-soft border border-brand-line rounded-2xl p-4 animate-fade-in">
                    <p className="font-black text-brand text-sm mb-3">📌 {selected}</p>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-xs font-bold text-brand mb-1">Seçtikleri ({selectedConnections.chose.length})</p>
                            {selectedConnections.chose.length > 0
                                ? selectedConnections.chose.map((c, i) => <p key={i} className="text-xs text-ink-2">→ {c}</p>)
                                : <p className="text-xs text-ink-3">Kimseyi seçmedi</p>}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-ok mb-1">Onu Seçenler ({selectedConnections.chosenBy.length})</p>
                            {selectedConnections.chosenBy.length > 0
                                ? selectedConnections.chosenBy.map((c, i) => <p key={i} className="text-xs text-ink-2">← {c}</p>)
                                : <p className="text-xs text-ink-3">Kimse seçmedi</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* Legend */}
            {showLegend && (
                <div className="flex flex-wrap gap-3">
                    {Object.entries(ROLE_COLORS).filter(([k]) => k !== 'selected').map(([role, cfg]) => (
                        <div key={role} className="flex items-center gap-1.5 text-xs text-ink-2">
                            <div className="w-3.5 h-3.5 rounded-full border-2" style={{ background: cfg.fill, borderColor: cfg.stroke }} />
                            {cfg.label}
                        </div>
                    ))}
                    <div className="flex items-center gap-1.5 text-xs text-ink-2">
                        <div className="w-5 h-0.5 bg-brand" /> Karşılıklı
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-ink-2">
                        <div className="w-5 h-0.5 bg-gray-300 border-t-2 border-dashed border-line-2" /> Tek Yönlü
                    </div>
                </div>
            )}
        </div>
    );
};

export default SociometryNetworkMap;
