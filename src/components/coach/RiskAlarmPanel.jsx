import React, { useState, useMemo } from 'react';
import {
    AlertTriangle, TrendingDown, TrendingUp, CheckCircle,
    Flame, ClipboardList, BarChart2, ChevronDown, ChevronUp,
    Bell, MessageSquare, Target, Zap, X, Send
} from 'lucide-react';
import Modal from '../ui/Modal';
import { yaz, listeOku, nesneOku, gorevHaritasi } from '../../services/veriDeposu';
import { matchResultsForStudent } from '../../services/birlesikDeneme';

// ─── Risk Hesaplayıcı ───────────────────────────────────────
const calcStudentRisk = (student) => {
    const results = listeOku('v2_results_data');
    const tasks = gorevHaritasi();

    /* 04.09: alt-dize eşleşmesi merkezî eşleştirmeyle değiştirildi
       (id → okul no → normalize TAM AD) — "Ali"/"Alican" karışması biter. */
    const myExams = matchResultsForStudent(student, results)
        .sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt));

    // Son 3 deneme trendi
    const last3 = myExams.slice(-3);
    const last1 = myExams[myExams.length - 1];
    const prev1 = myExams[myExams.length - 2];

    const netTrend = last3.length >= 2
        ? (last3[last3.length - 1].totalNet || 0) - (last3[0].totalNet || 0)
        : 0;
    const lastNet = last1?.totalNet || 0;
    const netDrop = prev1 && last1 ? (last1.totalNet || 0) - (prev1.totalNet || 0) : 0;

    // Görev tamamlama oranı
    const myTasks = tasks[String(student.id)] || [];
    const totalTasks = myTasks.length;
    const doneTasks = myTasks.filter(t => t.completed || t.status === 'Tamamlandı').length;
    const taskRate = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 100;

    // Risk puanı hesapla (0-100, yüksek = riskli)
    let riskScore = 0;
    const reasons = [];

    if (myExams.length === 0) {
        riskScore += 30;
        reasons.push('Henüz deneme sonucu yok');
    } else if (netTrend < -5) {
        riskScore += 35;
        reasons.push(`Son denemeler: ${netTrend.toFixed(1)} net düşüş`);
    } else if (netTrend < 0) {
        riskScore += 15;
        reasons.push(`Net hafif düşüyor (${netTrend.toFixed(1)})`);
    }

    if (netDrop < -10) {
        riskScore += 30;
        reasons.push(`Son denemede ${Math.abs(netDrop).toFixed(1)} net kayıp`);
    }

    if (taskRate < 40) {
        riskScore += 25;
        reasons.push(`Görev tamamlama: %${taskRate.toFixed(0)} (kritik düşük)`);
    } else if (taskRate < 70) {
        riskScore += 10;
        reasons.push(`Görev tamamlama: %${taskRate.toFixed(0)}`);
    }

    if (lastNet < 60 && myExams.length > 0) {
        riskScore += 10;
        reasons.push(`Son net: ${lastNet.toFixed(1)} (düşük)`);
    }

    const level = riskScore >= 60 ? 'critical' : riskScore >= 35 ? 'warning' : 'safe';

    return {
        riskScore, level, reasons,
        netTrend, lastNet, taskRate, examCount: myExams.length,
        lastExamDate: last1?.uploadedAt,
    };
};

// ─── Risk Kartı ──────────────────────────────────────────────
const RiskCard = ({ student, risk, onMessage }) => {
    const [expanded, setExpanded] = useState(false);

    const cfg = {
        critical: { bg: 'bg-danger-soft border-danger', badge: 'bg-danger-soft text-danger', dot: 'bg-danger', label: 'KRİTİK', icon: AlertTriangle, iconColor: 'text-danger' },
        warning: { bg: 'bg-warn-soft border-warn', badge: 'bg-warn-soft text-warn', dot: 'bg-warn', label: 'DİKKAT', icon: TrendingDown, iconColor: 'text-warn' },
        safe: { bg: 'bg-ok-soft border-ok', badge: 'bg-ok-soft text-ok', dot: 'bg-green-400', label: 'İYİ', icon: TrendingUp, iconColor: 'text-ok' },
    }[risk.level];

    const Icon = cfg.icon;

    return (
        <div className={`rounded-2xl border-2 p-4 transition-all ${cfg.bg}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`on-color w-10 h-10 rounded-xl flex items-center justify-center font-black text-ink bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm text-sm`}>
                        {student.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                        <p className="font-black text-ink text-sm">{student.name}</p>
                        <p className="text-xs text-ink-2">{student.grade || ''} {student.section || ''} · #{student.schoolNumber || student.id}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1 ${cfg.badge}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                    </span>
                    <button
                        onClick={() => setExpanded(e => !e)}
                        className="p-1.5 rounded-lg hover:bg-surface-3 text-ink-3 transition"
                    >
                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                </div>
            </div>

            {/* Hızlı istatistikler */}
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="bg-surface/70 rounded-xl p-2 text-center">
                    <div className="font-black text-ink">{risk.examCount}</div>
                    <div className="text-ink-2">Deneme</div>
                </div>
                <div className="bg-surface/70 rounded-xl p-2 text-center">
                    <div className={`font-black ${risk.netTrend >= 0 ? 'text-ok' : 'text-danger'}`}>
                        {risk.netTrend >= 0 ? '+' : ''}{risk.netTrend.toFixed(1)}
                    </div>
                    <div className="text-ink-2">Net Trend</div>
                </div>
                <div className="bg-surface/70 rounded-xl p-2 text-center">
                    <div className={`font-black ${risk.taskRate >= 70 ? 'text-ok' : 'text-danger'}`}>%{risk.taskRate.toFixed(0)}</div>
                    <div className="text-ink-2">Görev</div>
                </div>
            </div>

            {/* Expanded detay */}
            {expanded && (
                <div className="mt-3 space-y-2 animate-fade-in">
                    {risk.reasons.map((r, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs bg-surface/80 rounded-lg px-3 py-2">
                            <Icon size={12} className={`mt-0.5 flex-shrink-0 ${cfg.iconColor}`} />
                            <span className="text-ink-2">{r}</span>
                        </div>
                    ))}
                    <button
                        onClick={() => onMessage(student)}
                        className="w-full flex items-center justify-center gap-2 mt-2 py-2 bg-brand text-white text-xs font-bold rounded-xl hover:bg-brand-hover transition"
                    >
                        <MessageSquare size={12} />
                        Mesaj Gönder
                    </button>
                </div>
            )}
        </div>
    );
};

// ─── Hızlı Mesaj Modal ───────────────────────────────────────
const QuickMessageModal = ({ student, onClose, onSend }) => {
    const [msg, setMsg] = useState('');
    const templates = [
        'Merhaba! Son denemelerine baktım, birlikte konuşalım mı? 🎯',
        'Bu hafta görevlerin bekliyor, hadi hep birlikte tamamlayalım! 💪',
        'Seni merak ettim, nasıl gidiyor? Destek olabileceğim bir şey var mı?',
        'Net gelişimini takip ettim. Birkaç önerin paylaşmak istiyorum. 📊',
    ];

    return (
        <Modal
            acik
            onClose={onClose}
            baslikGizle
            genislik="md"
            govdeClassName="p-6"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-ink flex items-center gap-2">
                    <MessageSquare size={18} className="text-brand" />
                    {student.name}'e Mesaj
                </h3>
                <button onClick={onClose} className="text-ink-3 hover:text-ink-2"><X size={18} /></button>
            </div>

            <p className="text-xs text-ink-2 mb-3 font-medium">Hızlı Şablonlar:</p>
            <div className="space-y-2 mb-4">
                {templates.map((t, i) => (
                    <button key={i} onClick={() => setMsg(t)}
                        className="w-full text-left text-xs p-2.5 bg-surface-2 hover:bg-brand-soft hover:text-brand rounded-lg border border-line hover:border-brand-line transition">
                        {t}
                    </button>
                ))}
            </div>

            <textarea
                value={msg}
                onChange={e => setMsg(e.target.value)}
                placeholder="Mesajınızı yazın..."
                rows={3}
                className="w-full p-3 border border-line rounded-xl text-sm focus:ring-2 focus:ring-brand outline-none resize-none"
            />
            <div className="pencere-alt-cubuk bg-surface flex gap-2 mt-3">
                <button onClick={onClose} className="flex-1 py-2 border border-line rounded-xl text-sm font-bold text-ink-2 hover:bg-surface-2">İptal</button>
                <button
                    onClick={() => { onSend(student, msg); onClose(); }}
                    disabled={!msg.trim()}
                    className="flex-1 py-2 bg-brand text-white rounded-xl text-sm font-bold hover:bg-brand-hover disabled:opacity-50 flex items-center justify-center gap-1.5 transition"
                >
                    <Send size={14} /> Gönder
                </button>
            </div>
        </Modal>
    );
};

// ─── Ana Bileşen ─────────────────────────────────────────────
const RiskAlarmPanel = ({ students = [], setToast }) => {
    const [filter, setFilter] = useState('all'); // all | critical | warning | safe
    const [msgStudent, setMsgStudent] = useState(null);

    const riskData = useMemo(() => {
        return students.map(s => ({
            student: s,
            risk: calcStudentRisk(s),
        })).sort((a, b) => b.risk.riskScore - a.risk.riskScore);
    }, [students]);

    const counts = useMemo(() => ({
        critical: riskData.filter(d => d.risk.level === 'critical').length,
        warning: riskData.filter(d => d.risk.level === 'warning').length,
        safe: riskData.filter(d => d.risk.level === 'safe').length,
    }), [riskData]);

    const filtered = filter === 'all' ? riskData : riskData.filter(d => d.risk.level === filter);

    const handleSendMessage = (student, msg) => {
        if (!msg.trim()) return;
        try {
            const allMsgs = nesneOku('student_messages');
            const key = String(student.id);
            if (!allMsgs[key]) allMsgs[key] = [];
            allMsgs[key].push({
                sender: 'coach',
                text: msg,
                senderName: 'Koçunuz',
                timestamp: new Date().toISOString(),
            });
            yaz('student_messages', allMsgs);
            setToast?.(`✅ ${student.name}'e mesaj gönderildi`);
        } catch { setToast?.('Mesaj gönderilemedi', 'error'); }
    };

    return (
        <div className="space-y-6">
            {/* Üst özet kartları */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { key: 'critical', label: 'Kritik Risk', count: counts.critical, icon: AlertTriangle, bg: 'from-red-500 to-red-600', light: 'bg-danger-soft border-danger text-danger' },
                    { key: 'warning', label: 'Dikkat', count: counts.warning, icon: TrendingDown, bg: 'from-amber-400 to-amber-500', light: 'bg-warn-soft border-warn text-warn' },
                    { key: 'safe', label: 'İyi Gidiyor', count: counts.safe, icon: CheckCircle, bg: 'from-green-400 to-green-500', light: 'bg-ok-soft border-ok text-ok' },
                ].map(({ key, label, count, icon: Icon, bg, light }) => (
                    <button
                        key={key}
                        onClick={() => setFilter(f => f === key ? 'all' : key)}
                        className={`relative rounded-2xl p-4 border-2 transition-all text-left group ${filter === key ? `bg-gradient-to-br ${bg} text-ink border-transparent shadow-lg scale-[1.02]` : light}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <Icon size={20} className={filter === key ? 'text-ink' : ''} />
                            <span className={`text-3xl font-black ${filter === key ? 'text-ink' : ''}`}>{count}</span>
                        </div>
                        <p className={`text-xs font-bold ${filter === key ? 'text-ink-2' : ''}`}>{label}</p>
                    </button>
                ))}
            </div>

            {/* Öğrenci listesi */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-black text-ink text-sm flex items-center gap-2">
                        <Bell size={16} className="text-brand" />
                        Risk Analizi — {filtered.length} öğrenci
                    </h3>
                    {filter !== 'all' && (
                        <button onClick={() => setFilter('all')} className="text-xs text-brand hover:underline font-bold">Tümünü Göster</button>
                    )}
                </div>

                {filtered.length === 0 ? (
                    <div className="text-center py-12 text-ink-3">
                        <CheckCircle size={40} className="mx-auto mb-2 text-ok" />
                        <p className="text-sm font-medium">Bu kategoride öğrenci yok</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filtered.map(({ student, risk }) => (
                            <RiskCard
                                key={student.id}
                                student={student}
                                risk={risk}
                                onMessage={setMsgStudent}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Hızlı mesaj modal */}
            {msgStudent && (
                <QuickMessageModal
                    student={msgStudent}
                    onClose={() => setMsgStudent(null)}
                    onSend={handleSendMessage}
                />
            )}
        </div>
    );
};

export default RiskAlarmPanel;
