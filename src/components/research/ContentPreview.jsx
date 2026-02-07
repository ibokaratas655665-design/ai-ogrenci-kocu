import React, { useState } from 'react';
import pptxgen from "pptxgenjs";
import jsPDF from "jspdf";
import { Download, FileText, Monitor, CheckCircle, RotateCw, Image as ImageIcon } from 'lucide-react';

const ContentPreview = ({ content, onClose }) => {
    const [brochureSide, setBrochureSide] = useState('outside'); // 'outside' (Dış) or 'inside' (İç)

    if (!content) return null;

    // --- RENDER HELPERS ---

    const renderBrochurePanel = (panel, index) => {
        // Broşür paneli render fonksiyonu
        return (
            <div key={index} className={`flex-1 flex flex-col p-6 border-r border-dashed border-gray-300 last:border-0 relative overflow-hidden min-h-[500px] ${panel.color || 'bg-white'}`}>
                {/* Panel İçeriği */}
                <div className="relative z-10 flex flex-col h-full">
                    {/* Görsel Alanı (Gerçek AI Görseli) */}
                    {panel.image && (
                        <div className="w-full h-48 mb-4 rounded-lg overflow-hidden border border-gray-100 shadow-sm relative group">
                            {panel.image.url ? (
                                <>
                                    <img
                                        src={panel.image.url}
                                        alt={panel.image.alt}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                    {/* Fallback (Resim yüklenemezse görünür) */}
                                    <div className="hidden absolute inset-0 bg-indigo-50 flex items-center justify-center flex-col gap-2 text-indigo-300">
                                        <ImageIcon size={32} />
                                        <span className="text-xs font-bold uppercase">Görsel Yüklenemedi</span>
                                    </div>
                                    {/* Overlay Badge */}
                                    <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-md text-white px-2 py-1 rounded text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                        AI Generated
                                    </div>
                                </>
                            ) : (
                                <div className="w-full h-full bg-indigo-50 flex items-center justify-center flex-col gap-2 text-indigo-400">
                                    <ImageIcon size={24} />
                                    <span className="text-xs font-semibold uppercase tracking-wider">{panel.image.alt}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Başlıklar */}
                    {panel.logo && <div className="text-2xl font-bold text-indigo-800 mb-2">🎓 AI KOÇ</div>}

                    {panel.title && (
                        <h3 className={`font-bold mb-2 ${panel.isCover ? 'text-3xl text-center mt-10 text-indigo-900' : 'text-xl text-gray-800'}`}>
                            {panel.title}
                        </h3>
                    )}

                    {panel.subtitle && (
                        <h4 className={`font-medium mb-4 ${panel.isCover ? 'text-xl text-center text-indigo-600' : 'text-sm text-gray-500 uppercase tracking-wide'}`}>
                            {panel.subtitle}
                        </h4>
                    )}

                    {/* Metin İçeriği */}
                    {panel.content && (
                        <div className={`prose prose-sm text-gray-600 leading-relaxed ${panel.isCover ? 'text-center mt-4' : ''}`}>
                            {panel.content.split('\n').map((line, i) => (
                                <p key={i} className="mb-2">{line}</p>
                            ))}
                        </div>
                    )}

                    {/* Liste / Maddeler */}
                    {panel.list && (
                        <ul className="mt-4 space-y-2">
                            {panel.list.map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* İletişim / Alt Bilgi */}
                    {panel.isContact && (
                        <div className="mt-auto pt-8 text-center text-sm text-gray-500 border-t border-gray-100">
                            <p>© 2026 AI Öğrenci Koçu</p>
                        </div>
                    )}
                </div>

                {/* Arkaplan Büyüsü (Cover vs) */}
                {panel.isCover && (
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50 pointer-events-none" />
                )}
            </div>
        );
    };

    // --- EXPORT FUNCTIONS ---

    // PPTX İndirme
    const exportToPPTX = () => {
        let pres = new pptxgen();
        if (content.type === 'SLIDE') {
            // SLIDE Type Export
            let slide = pres.addSlide();
            slide.addText(content.title, { x: 1, y: 1, w: '80%', fontSize: 36, align: 'center', color: '363636' });

            content.sections.forEach(section => {
                let s = pres.addSlide();
                s.addText(section.title, { x: 0.5, y: 0.5, w: '90%', fontSize: 24, color: '363636', bold: true });
                if (section.content) s.addText(section.content, { x: 0.5, y: 1.5, w: '90%', h: 4, fontSize: 18, color: '363636' });
                if (section.bullets) {
                    let text = section.bullets.map(b => b.text).join('\n');
                    s.addText(text, { x: 0.5, y: 1.5, w: '90%', h: 4, fontSize: 18, color: '363636', bullet: true });
                }
            });
        }
        pres.writeFile({ fileName: `${content.topic}-Sunum.pptx` });
    };

    // PDF İndirme (Basit)
    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text(content.title, 20, 20);
        doc.setFontSize(12);

        let y = 40;
        doc.text("Lütfen detaylı tasarım için önizlemeyi kullanın.", 20, y);
        // Çok basit export, detaylandırılabilir
        doc.save(`${content.topic}-Materyal.pdf`);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-6xl max-h-[95vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">

                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <CheckCircle size={22} className="text-green-600" />
                            {content.title}
                        </h3>
                        <p className="text-sm text-gray-500 pl-8">
                            {content.type === 'SLIDE' && 'Sunum Taslağı'}
                            {content.type === 'BROCHURE' && 'Üç Kırımlı Broşür Tasarımı'}
                            {content.type === 'BOARD' && 'Pano Düzeni'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                            X
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-slate-100 p-8 flex justify-center">

                    {/* BROCHURE VIEW */}
                    {content.type === 'BROCHURE' && (
                        <div className="flex flex-col items-center gap-6 w-full max-w-5xl">
                            {/* Toggle Switch */}
                            <div className="flex bg-white rounded-full p-1 shadow-sm border border-gray-200">
                                <button
                                    onClick={() => setBrochureSide('outside')}
                                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${brochureSide === 'outside' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    Dış Yüz (Kapaklar)
                                </button>
                                <button
                                    onClick={() => setBrochureSide('inside')}
                                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${brochureSide === 'inside' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    İç Yüz (İçerik)
                                </button>
                            </div>

                            {/* The Brochure Paper */}
                            <div className="bg-white aspect-[297/210] w-full shadow-2xl rotate-0 transition-all duration-500 origin-center border border-gray-200 flex">
                                {brochureSide === 'outside' ? (
                                    // OUTSIDE: [Flap, Back, Front]
                                    content.sides.outside.map((panel, idx) => renderBrochurePanel(panel, idx))
                                ) : (
                                    // INSIDE: [Left, Center, Right]
                                    content.sides.inside.map((panel, idx) => renderBrochurePanel(panel, idx))
                                )}
                            </div>

                            <p className="text-sm text-gray-400 flex items-center gap-2">
                                <RotateCw size={14} />
                                Ön ve arka yüz arasında geçiş yaparak tasarımı inceleyin.
                            </p>
                        </div>
                    )}

                    {/* SLIDE VIEW (Old logic but cleaner) */}
                    {content.type === 'SLIDE' && (
                        <div className="space-y-8 w-full max-w-3xl">
                            {content.sections.map((slide, idx) => (
                                <div key={idx} className="bg-white aspect-[16/9] shadow-lg rounded-lg p-12 border border-gray-200 flex flex-col relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
                                    <h2 className="text-3xl font-bold text-gray-800 mb-6">{slide.title}</h2>
                                    <div className="flex-1 text-xl text-gray-600 leading-relaxed">
                                        {slide.content}
                                        {slide.bullets && (
                                            <ul className="mt-6 space-y-3 list-disc pl-6">
                                                {slide.bullets.map((b, i) => <li key={i}>{b.text}</li>)}
                                            </ul>
                                        )}
                                        {slide.chartData && (
                                            <div className="mt-8 h-48 bg-gray-50 rounded border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                                                [Grafik: {slide.chartData.title}]
                                            </div>
                                        )}
                                        {slide.imagePlaceholder && (
                                            <div className="mt-8 h-64 bg-indigo-50 rounded-lg overflow-hidden border border-indigo-100 flex items-center justify-center relative group">
                                                {slide.imagePlaceholder.url ? (
                                                    <>
                                                        <img
                                                            src={slide.imagePlaceholder.url}
                                                            alt={slide.imagePlaceholder.alt}
                                                            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'flex';
                                                            }}
                                                        />
                                                        {/* Fallback */}
                                                        <div className="hidden absolute inset-0 bg-indigo-50 flex-col items-center justify-center text-indigo-400 gap-2">
                                                            <ImageIcon size={32} />
                                                            <span className="text-sm font-medium">{slide.imagePlaceholder.alt}</span>
                                                        </div>
                                                        {/* Badge */}
                                                        <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm">
                                                            AI Image
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2 text-indigo-400">
                                                        <ImageIcon size={32} />
                                                        <span className="text-sm font-medium">{slide.imagePlaceholder.alt}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-auto pt-4 border-t flex justify-between text-sm text-gray-400">
                                        <span>AI Eğitim Koçu</span>
                                        <span>{idx + 1} / {content.sections.length}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* BOARD VIEW (Simple Grid) */}
                    {content.type === 'BOARD' && (
                        <div className="bg-[#f0e6d2] w-full max-w-5xl shadow-xl p-8 border-8 border-[#5c4033] rounded-sm relative pattern-cork">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gray-800 -translate-y-2"></div>
                            <h1 className="text-center text-4xl font-extrabold text-[#5c4033] mb-8 bg-white/50 py-2 inline-block px-12 mx-auto rounded shadow-sm border border-[#5c4033]/20">{content.title}</h1>

                            <div className="grid grid-cols-12 gap-6 auto-rows-min">
                                {content.items?.map((item, idx) => (
                                    <div key={idx} className={`bg-white p-6 shadow-md shadow-black/10 rotate-${idx % 2 === 0 ? '1' : '-1'} ${item.size === 'large' ? 'col-span-6 row-span-2' : item.size === 'medium' ? 'col-span-3' : 'col-span-3'}`}>
                                        <div className="w-4 h-4 rounded-full bg-red-800 mx-auto -mt-8 mb-4 shadow-sm"></div>
                                        <h3 className="font-bold text-lg mb-2 text-[#5c4033]">{item.title}</h3>
                                        <p className="text-sm font-handwriting text-gray-700">{item.content || "..."}</p>
                                        {item.list && (
                                            <ul className="list-disc pl-4 text-sm mt-2">
                                                {item.list.map((l, i) => <li key={i}>{l}</li>)}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3 z-20">
                    <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition">
                        Kapat
                    </button>
                    <button onClick={content.type === 'SLIDE' ? exportToPPTX : exportToPDF} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
                        {content.type === 'SLIDE' ? <Monitor size={18} /> : <FileText size={18} />}
                        {content.type === 'SLIDE' ? 'Sunumu İndir (.pptx)' : 'PDF Olarak İndir'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ContentPreview;
