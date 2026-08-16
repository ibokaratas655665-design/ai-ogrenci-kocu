/**
 * SÜPER AKILLI PARSER - GPT Benzeri Doğal Dil Anlama
 * Kullanıcının yazdığı GERÇEKTEN HER ŞEYİ anlar!
 */
// AI PARSER'I İÇE AKTAR
import { parseCustomRequest as aiParseCustomRequest } from '../services/aiParser.js';

/**
 * Wrapper - Geriye uyumluluk için
 */
export const parseCustomRequest = aiParseCustomRequest;




/**
 * FİNAL ALGORİTMA v9 - TÜM ÖZELLİKLER
 * ✅ examType kullanıyor (TYT/YDT ayrımı doğru)
 * ✅ Her hafta tüm dersler garantili
 * ✅ Ardışık max 2
 * ✅ Ders çeşitliliği
 * ✅ Tüm programDurationMonths ayları dolduruyor
 */
export const smartDistributeTopics = (distributionQueue, existingSchedule, config, customRequest) => {
    const { programDurationMonths, dailySlotCount, days, disabledCells = {} } = config;

    // DEĞIŞIKLIK 1: TYT/YDT günleri haftalık değişken olacak
    const TYT_DAYS_BASE = ['Perşembe', 'Cuma'];
    const YDT_DAYS_BASE = ['Pazartesi', 'Salı', 'Çarşamba'];
    const rules = parseCustomRequest(customRequest || '');

    console.log('🚀 ALGORİTMA v10 - GÜNCELLENMIŞ ÖZELLİKLER');
    console.log('📆 Program:', programDurationMonths, 'ay');
    console.log('📚 Konular:', distributionQueue.map(t => `[${t.examType || 'TYT'}] ${t.subject} (${t.weight}x)`));
    console.log('🚫 Kapalı etütler:', Object.keys(disabledCells).length);

    const newSchedule = {};

    // Helper: Slot kullanılabilir mi? (kapalı değilse true)
    const isSlotAllowed = (slotKey) => !disabledCells[slotKey];

    // Konuları examType ile grupla
    const itemsByExamType = {};
    distributionQueue.forEach(item => {
        const examType = item.examType || 'TYT';
        const key = `${item.subject}_${examType}`;

        if (!itemsByExamType[key]) {
            itemsByExamType[key] = {
                subject: item.subject,
                examType: examType,
                topics: []
            };
        }

        itemsByExamType[key].topics.push({
            topic: item.topic,
            color: item.color,
            remaining: item.weight,
            total: item.weight
        });
    });

    const allKeys = Object.keys(itemsByExamType);
    console.log('📊 Ders grupları:', allKeys);

    // Her ders için mevcut topic index
    const currentTopicIndex = {};
    allKeys.forEach(k => currentTopicIndex[k] = 0);

    // Haftalık sayaçlar
    const weeklySubjectCount = {};
    const resetWeekly = () => allKeys.forEach(k => weeklySubjectCount[k] = 0);

    let lastKey = null;
    let consecutiveCount = 0;

    // 🎯 ORANLAMA SİSTEMİ: Toplam slot'a göre konuları ölçeklendir
    // UYARI: Türkçe ve tekrar slotları çıkarılmalı!
    const totalDays = programDurationMonths * 4 * 7;
    const totalSlotsRaw = totalDays * dailySlotCount;

    // Ayrılmış slotları çıkar
    let reservedSlots = 0;

    const weekCount = programDurationMonths * 4;

    // 1. ETÜT: Günlük Tekrar (SADECE Pazartesi-Cuma, 5 gün/hafta)
    reservedSlots += weekCount * 5; // Her hafta 5 gün × 1 slot


    // 2. ETÜT: İngilizce Paragraf (Her gün 7 gün/hafta) - SABİT, HER ZAMAN
    reservedSlots += weekCount * 7; // Her hafta 7 gün (Pzt-Pazar) × 1 slot


    // 3. ETÜT: Türkçe (Pazartesi-Pazar, her gün) - SADECE TÜRKÇE SEÇİLMİŞSE
    const hasTurkce = allKeys.some(k => {
        const g = itemsByExamType[k];
        return (g.subject === 'Türkçe' || g.subject === 'Turkce') && g.examType === 'TYT';
    });

    if (hasTurkce) {
        reservedSlots += weekCount * 7; // Her hafta 7 gün × 1 slot
    }

    // Cumartesi: s=0,1,2,3 kullanılabilir, s>=4 tekrar
    reservedSlots += weekCount * Math.max(0, dailySlotCount - 4); // Her hafta (dailySlotCount - 4) slot TYT tekrar

    // DEĞIŞIKLIK 2: Pazar - Son 2 etüt (s >= dailySlotCount-2) YDT tekrar
    const sundayReviewSlots = 2; // Son 2 etüt
    reservedSlots += weekCount * sundayReviewSlots;

    const totalSlots = totalSlotsRaw - reservedSlots;

    // TÜRKÇE VE İNGİLİZCE DÖNGÜLÜ - totalWeight'ten çıkar!
    const totalWeight = distributionQueue.reduce((sum, item) => {
        // Türkçe TYT'yi çıkar - döngülü olduğu için oranlama dışı
        if ((item.subject === 'Türkçe' || item.subject === 'Turkce') && item.examType === 'TYT') {
            return sum;
        }
        // İngilizce TYT'yi çıkar - döngülü olduğu için oranlama dışı
        if ((item.subject === 'İngilizce' || item.subject === 'Ingilizce') && item.examType === 'TYT') {
            return sum;
        }
        return sum + item.weight;
    }, 0);

    const scaleFactor = totalSlots / totalWeight;

    console.log(`📐 ORANLAMA DETAYLI:`);
    console.log(`  📦 Ham slot: ${totalSlotsRaw}`);
    console.log(`  🔒 Ayrılmış: ${reservedSlots} (Günlük:${weekCount * 5}, İngilizce:${weekCount * 7}, Türkçe:${hasTurkce ? weekCount * 7 : 0}, Cmt s>=4:${weekCount * Math.max(0, dailySlotCount - 4)}, Pzr son ${sundayReviewSlots})`);
    console.log(`  ✅ Kullanılabilir: ${totalSlots}`);
    console.log(`  ⚖️ Toplam weight (İng+Tür hariç): ${totalWeight}`);
    console.log(`  🎯 Ölçek: ${scaleFactor.toFixed(2)}x`);

    // Her konunun remaining'ini ölçeklendir
    allKeys.forEach(key => {
        const group = itemsByExamType[key];
        group.topics.forEach(topic => {
            const scaledRemaining = Math.ceil(topic.total * scaleFactor);
            topic.remaining = scaledRemaining;
            console.log(`  📊 ${group.subject} - ${topic.topic}: ${topic.total}x → ${scaledRemaining} slot`);
        });
    });


    // Tüm ayları dön
    for (let m = 1; m <= programDurationMonths; m++) {
        for (let w = 1; w <= 4; w++) {
            resetWeekly(); // Hafta başında sıfırla

            // DEĞIŞIKLIK 3: Hafta numarasına göre TYT/YDT günlerini değiştir
            const isOddWeek = w % 2 === 1;
            const TYT_DAYS = isOddWeek ? TYT_DAYS_BASE : YDT_DAYS_BASE;
            const YDT_DAYS = isOddWeek ? YDT_DAYS_BASE : TYT_DAYS_BASE;

            console.log(`📅 ${m}.Ay ${w}.Hafta - TYT: ${TYT_DAYS.join(',')} / YDT: ${YDT_DAYS.join(',')}`);

            for (let d = 0; d < 7; d++) {
                const dayName = days[d];
                const isPazar = dayName === 'Pazar';
                const isCumartesi = dayName === 'Cumartesi';
                const isWeekend = isPazar || isCumartesi;

                let todaySlotCount = dailySlotCount;
                if (rules.weekdaySlots && !isWeekend) todaySlotCount = rules.weekdaySlots;
                if (rules.weekendSlots && isWeekend) todaySlotCount = rules.weekendSlots;

                // CUMARTESİ - İlk 4 etüt TYT, geri kalanı (s>=4) TYT Tekrar
                if (isCumartesi) {
                    for (let s = 0; s < todaySlotCount; s++) {
                        const slotKey = `m${m}-w${w}-${dayName}-${s}`;

                        // Kapalı slot kontrolü
                        if (!isSlotAllowed(slotKey)) continue;

                        if (s >= 4) {
                            // s=4+ : TYT Genel Tekrar
                            newSchedule[slotKey] = {
                                subject: 'TYT',
                                topic: 'TYT Genel Tekrar',
                                color: 'bg-blue-100 text-blue-800',
                                slotType: 'TYT Tekrar',
                                examType: 'TYT'
                            };
                        }
                    }
                }

                // PAZAR - İlk etütler normal, son 2 etüt (s >= dailySlotCount-2) YDT Tekrar
                if (isPazar) {
                    for (let s = 0; s < todaySlotCount; s++) {
                        const slotKey = `m${m}-w${w}-${dayName}-${s}`;

                        // Kapalı slot kontrolü
                        if (!isSlotAllowed(slotKey)) continue;

                        if (s >= todaySlotCount - 2) {
                            // Son 2 slot: YDT Genel Tekrar
                            newSchedule[slotKey] = {
                                subject: 'YDT',
                                topic: 'YDT Genel Tekrar',
                                color: 'bg-green-100 text-green-800',
                                slotType: 'YDT Tekrar',
                                examType: 'YDT'
                            };
                        }
                    }
                }

                // NORMAL GÜNLER (Pazartesi-Cuma) + Cumartesi/Pazar'ın kullanılabilir etütleri
                for (let s = 0; s < todaySlotCount; s++) {
                    const slotKey = `m${m}-w${w}-${dayName}-${s}`;

                    // Kapalı slot kontrolü - en başta yap
                    if (!isSlotAllowed(slotKey)) {
                        continue; // Bu slot kapalı, atla
                    }

                    // CUMARTESİ: s>=4 zaten yukarda tekrar olarak atandı, skip et
                    if (isCumartesi && s >= 4) {
                        continue; // Zaten yukarda TYT tekrar atandı
                    }

                    // PAZAR: s >= dailySlotCount-2 zaten yukarda tekrar olarak atandı, skip et
                    if (isPazar && s >= todaySlotCount - 2) {
                        continue; // Zaten yukarda YDT tekrar atandı
                    }

                    // 1. ETÜT: Günlük Tekrar (s=0, SADECE Pazartesi-Cuma)
                    // CUMARTESI/PAZAR: s=0 Türkçe Paragraf
                    if (s === 0) {
                        if (isWeekend) {
                            // HaftaSonu: s=0 = Türkçe
                            const turkceKey = allKeys.find(k => {
                                const g = itemsByExamType[k];
                                return (g.subject === 'Türkçe' || g.subject === 'Turkce') && g.examType === 'TYT';
                            });

                            if (turkceKey) {
                                const group = itemsByExamType[turkceKey];
                                const topicIdx = currentTopicIndex[turkceKey];

                                if (topicIdx < group.topics.length && group.topics[topicIdx].remaining > 0) {
                                    const currentTopic = group.topics[topicIdx];

                                    newSchedule[slotKey] = {
                                        subject: group.subject,
                                        topic: currentTopic.topic,
                                        color: currentTopic.color,
                                        slotType: 'Türkçe Konu',
                                        examType: 'TYT'
                                    };

                                    currentTopic.remaining--;
                                    weeklySubjectCount[turkceKey]++;
                                    lastKey = turkceKey;
                                    consecutiveCount = 1;

                                    if (currentTopic.remaining <= 0) {
                                        currentTopicIndex[turkceKey]++;
                                    }
                                } else {
                                    newSchedule[slotKey] = {
                                        subject: group.subject,
                                        topic: 'Türkçe Tekrar',
                                        color: group.topics[0].color,
                                        slotType: 'Türkçe Tekrar',
                                        examType: 'TYT'
                                    };

                                    weeklySubjectCount[turkceKey]++;
                                    lastKey = turkceKey;
                                    consecutiveCount = 1;
                                }

                                continue;
                            }
                        } else {
                            // Hafta içi: Günlük Tekrar
                            newSchedule[slotKey] = {
                                subject: 'Genel',
                                topic: 'Günlük Tekrar',
                                color: 'bg-blue-100 text-blue-800',
                                slotType: 'Günlük Tekrar'
                            };
                            continue;
                        }
                    }

                    // 2. ETÜT: 
                    // Hafta içi (s=1): Türkçe
                    // Hafta sonu (s=1): İngilizce Paragraf
                    if (s === 1) {
                        if (isWeekend) {
                            // HaftaSonu: s=1 = İngilizce Paragraf
                            newSchedule[slotKey] = {
                                subject: 'İngilizce',
                                topic: 'İngilizce Paragraf',
                                color: 'bg-purple-100 text-purple-800',
                                slotType: 'Paragraf Çalışması',
                                examType: 'YDT'
                            };
                            continue;
                        } else {
                            // Hafta içi: s=1 = Türkçe
                            const turkceKey = allKeys.find(k => {
                                const g = itemsByExamType[k];
                                return (g.subject === 'Türkçe' || g.subject === 'Turkce') && g.examType === 'TYT';
                            });

                            if (turkceKey) {
                                const group = itemsByExamType[turkceKey];
                                const topicIdx = currentTopicIndex[turkceKey];

                                if (topicIdx < group.topics.length && group.topics[topicIdx].remaining > 0) {
                                    const currentTopic = group.topics[topicIdx];

                                    newSchedule[slotKey] = {
                                        subject: group.subject,
                                        topic: currentTopic.topic,
                                        color: currentTopic.color,
                                        slotType: 'Türkçe Konu',
                                        examType: 'TYT'
                                    };

                                    currentTopic.remaining--;
                                    weeklySubjectCount[turkceKey]++;
                                    lastKey = turkceKey;
                                    consecutiveCount = 1;

                                    if (currentTopic.remaining <= 0) {
                                        currentTopicIndex[turkceKey]++;
                                    }
                                } else {
                                    newSchedule[slotKey] = {
                                        subject: group.subject,
                                        topic: 'Türkçe Tekrar',
                                        color: group.topics[0].color,
                                        slotType: 'Türkçe Tekrar',
                                        examType: 'TYT'
                                    };

                                    weeklySubjectCount[turkceKey]++;
                                    lastKey = turkceKey;
                                    consecutiveCount = 1;
                                }

                                continue;
                            }
                        }
                    }

                    // 3. ETÜT: İngilizce Paragraf (s=2, SADECE Hafta İçi) - SABİT - YDT
                    if (s === 2 && !isWeekend) {
                        // Her zaman sabit "İngilizce Paragraf" - konu takibi YOK
                        newSchedule[slotKey] = {
                            subject: 'İngilizce',
                            topic: 'İngilizce Paragraf',
                            color: 'bg-purple-100 text-purple-800',
                            slotType: 'Paragraf Çalışması',
                            examType: 'YDT'
                        };
                        continue;
                    }







                    // Günlük examType kısıtlaması
                    let allowedKeys;

                    // ÖZEL İSTEK KONTROLÜ - Kullanıcının yazdığı kuralları uygula!
                    let customExamType = null;

                    // 0. Global kurallar (onlyTYT, noYDT)
                    if (rules.onlyTYT && !customExamType) {
                        customExamType = 'TYT';
                        console.log(`🎯 GLOBAL KURAL: Sadece TYT → ${dayName}`);
                    }
                    if (rules.noYDT && !customExamType) {
                        customExamType = 'TYT';
                        console.log(`🎯 GLOBAL KURAL: YDT yok → TYT`);
                    }

                    // 1. Slot bazlı kurallar (örn: "4. etüt YDT")
                    if (rules.slotRules && rules.slotRules.length > 0) {
                        rules.slotRules.forEach(rule => {
                            if (rule.slot !== undefined && rule.slot === s) {
                                customExamType = rule.examType;
                                console.log(`🎯 ÖZEL KURAL: ${dayName} ${s + 1}. etüt → ${customExamType}`);
                            } else if (rule.position === 'last' && s === todaySlotCount - 1) {
                                customExamType = rule.examType;
                                console.log(`🎯 ÖZEL KURAL: ${dayName} son etüt → ${customExamType}`);
                            } else if (rule.position === 'first' && s === 0) {
                                customExamType = rule.examType;
                                console.log(`🎯 ÖZEL KURAL: ${dayName} ilk etüt → ${customExamType}`);
                            }
                        });
                    }

                    // 2. Gün bazlı kurallar (örn: "Cuma TYT")
                    if (rules.dayRules && rules.dayRules.length > 0) {
                        rules.dayRules.forEach(rule => {
                            if (rule.day === dayName && !customExamType) {
                                customExamType = rule.examType;
                                console.log(`🎯 ÖZEL KURAL: ${dayName} günü → ${customExamType}`);
                            }
                        });
                    }

                    // 3. Hafta sonu kuralı (örn: "hafta sonu TYT")
                    if (rules.weekendType && isWeekend && !customExamType) {
                        customExamType = rules.weekendType;
                        console.log(`🎯 ÖZEL KURAL: Hafta sonu → ${customExamType}`);
                    }

                    // ÖZEL KURAL VARSA UYGULA
                    if (customExamType) {
                        if (customExamType === 'TYT') {
                            allowedKeys = allKeys.filter(k => {
                                const group = itemsByExamType[k];
                                const isTurkce = group.subject === 'Türkçe' || group.subject === 'Turkce';
                                if (isTurkce) return false;
                                return group.examType === 'TYT' || !group.examType;
                            });
                        } else if (customExamType === 'YDT') {
                            allowedKeys = allKeys.filter(k => {
                                const group = itemsByExamType[k];
                                const isTurkce = group.subject === 'Türkçe' || group.subject === 'Turkce';
                                if (isTurkce) return false;
                                return group.examType !== 'TYT';
                            });
                        }
                    } else {
                        // VARSAYILAN KURALLAR (özel istek yoksa)
                        // Pazartesi-Perşembe: 4. etüt (s=3) YDT, diğerleri (s=4+) TYT
                        const isMonToThu = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe'].includes(dayName);
                        const isCuma = dayName === 'Cuma';
                        const isSlot4 = s === 3; // 4. etüt (index 3)

                        if (isPazar) {
                            // Pazar: s=0,1,2,3 (1-4. etütler) TYT, s=4+ (5. etüt sonrası) YDT
                            const needTYT = s <= 3; // 4. etüte kadar TYT
                            allowedKeys = allKeys.filter(k => {
                                const group = itemsByExamType[k];
                                const isTurkce = group.subject === 'Türkçe' || group.subject === 'Turkce';
                                if (isTurkce) return false;
                                const isTYT = group.examType === 'TYT';
                                return needTYT ? isTYT : !isTYT;
                            });
                        } else if (isMonToThu && isSlot4) {
                            // Pazartesi-Perşembe 4. ETÜT (s=3): YDT
                            allowedKeys = allKeys.filter(k => {
                                const group = itemsByExamType[k];
                                const isTurkce = group.subject === 'Türkçe' || group.subject === 'Turkce';
                                if (isTurkce) return false;
                                return group.examType !== 'TYT'; // YDT
                            });
                        } else if (isMonToThu) {
                            // Pazartesi-Perşembe DİĞER ETÜTLER (s=4,5,6...): TYT
                            allowedKeys = allKeys.filter(k => {
                                const group = itemsByExamType[k];
                                const isTurkce = group.subject === 'Türkçe' || group.subject === 'Turkce';
                                if (isTurkce) return false;
                                return group.examType === 'TYT' || !group.examType;
                            });
                        } else if (isCuma) {
                            // CUMA: HER ZAMAN TYT (haftalık rotasyondan bağımsız)
                            allowedKeys = allKeys.filter(k => {
                                const group = itemsByExamType[k];
                                const isTurkce = group.subject === 'Türkçe' || group.subject === 'Turkce';
                                if (isTurkce) return false;
                                return group.examType === 'TYT' || !group.examType;
                            });
                        } else if (isCumartesi) {
                            // Cumartesi: TYT
                            allowedKeys = allKeys.filter(k => {
                                const group = itemsByExamType[k];
                                const isTurkce = group.subject === 'Türkçe' || group.subject === 'Turkce';
                                if (isTurkce) return false;
                                return group.examType === 'TYT' || !group.examType;
                            });
                        } else if (TYT_DAYS.includes(dayName)) {
                            // Diğer TYT günleri (rotasyona göre)
                            allowedKeys = allKeys.filter(k => {
                                const group = itemsByExamType[k];
                                const isTurkce = group.subject === 'Türkçe' || group.subject === 'Turkce';
                                if (isTurkce) return false;
                                return group.examType === 'TYT' || !group.examType;
                            });
                        } else if (YDT_DAYS.includes(dayName)) {
                            allowedKeys = allKeys.filter(k => {
                                const group = itemsByExamType[k];
                                const isTurkce = group.subject === 'Türkçe' || group.subject === 'Turkce';
                                if (isTurkce) return false;
                                return group.examType !== 'TYT';
                            });
                        } else {
                            allowedKeys = allKeys.filter(k => {
                                const group = itemsByExamType[k];
                                const isTurkce = group.subject === 'Türkçe' || group.subject === 'Turkce';
                                return !isTurkce;
                            });
                        }
                    }


                    // Konu bitmemiş olanlar
                    // Aşağıda yeniden atanıyor; const olduğu için çalışma
                    // anında "Assignment to constant variable" hatası veriyordu.
                    let available = allowedKeys.filter(k => {
                        const topicIdx = currentTopicIndex[k];
                        const topics = itemsByExamType[k].topics;
                        return topicIdx < topics.length && topics[topicIdx].remaining > 0;
                    });

                    // FALLBACK: İzin verilen ders yoksa, diğerlerine de bak (boş bırakma!)
                    if (available.length === 0) {
                        console.log(`⚠️ ${m}.ay ${w}.hafta ${dayName} - İzin verilen derste konu yok, FALLBACK!`);

                        // AKILLI FALLBACK: Önce TYT günündeyse TYT, YDT günündeyse YDT dene
                        let fallbackKeys = [];

                        if (TYT_DAYS.includes(dayName)) {
                            // TYT günü - önce TYT dene
                            fallbackKeys = allKeys.filter(k => {
                                const group = itemsByExamType[k];
                                const isTurkce = group.subject === 'Türkçe' || group.subject === 'Turkce';
                                return !isTurkce && (group.examType === 'TYT' || !group.examType);
                            });
                        } else if (YDT_DAYS.includes(dayName)) {
                            // YDT günü - önce YDT dene
                            fallbackKeys = allKeys.filter(k => {
                                const group = itemsByExamType[k];
                                const isTurkce = group.subject === 'Türkçe' || group.subject === 'Turkce';
                                return !isTurkce && group.examType !== 'TYT';
                            });
                        } else {
                            // Pazar - hepsine bak
                            fallbackKeys = allKeys.filter(k => {
                                const group = itemsByExamType[k];
                                const isTurkce = group.subject === 'Türkçe' || group.subject === 'Turkce';
                                return !isTurkce;
                            });
                        }

                        const fallbackAvailable = fallbackKeys.filter(k => {
                            const topicIdx = currentTopicIndex[k];
                            const topics = itemsByExamType[k].topics;
                            return topicIdx < topics.length && topics[topicIdx].remaining > 0;
                        });

                        if (fallbackAvailable.length === 0) {
                            // Aynı tip ders yok, ŞIMDI karışık bak
                            console.log(`⚠️ Aynı tip ders yok, karışık fallback...`);
                            const mixedFallback = allKeys.filter(k => {
                                const group = itemsByExamType[k];
                                const isTurkce = group.subject === 'Türkçe' || group.subject === 'Turkce';
                                if (isTurkce) return false;

                                const topicIdx = currentTopicIndex[k];
                                const topics = group.topics;
                                return topicIdx < topics.length && topics[topicIdx].remaining > 0;
                            });

                            if (mixedFallback.length === 0) {
                                console.log(`❌ ${dayName} - Hiçbir ders kalmadı, slot boş`);
                                continue;
                            }

                            available.push(...mixedFallback);
                        } else {
                            available.push(...fallbackAvailable);
                        }
                    }

                    let selectedKey = null;

                    // DERS TERCİHLERİNİ UYGULA (örn: "çok matematik", "az kimya")
                    if (rules.subjectPreferences && rules.subjectPreferences.length > 0) {
                        rules.subjectPreferences.forEach(pref => {
                            const subjectName = pref.subject.charAt(0).toUpperCase() + pref.subject.slice(1);

                            // Yüksek ağırlık: Bu dersi öncelikli seç
                            if (pref.weight === 'high' || pref.frequency === 'daily') {
                                const preferredKey = available.find(k => {
                                    const group = itemsByExamType[k];
                                    return group.subject.toLowerCase() === pref.subject.toLowerCase();
                                });

                                if (preferredKey && (!selectedKey || Math.random() > 0.3)) {
                                    selectedKey = preferredKey;
                                    console.log(`⭐ TERCIH: ${subjectName} önceliklendirild i (${pref.weight || pref.frequency})`);
                                }
                            }

                            // Düşük ağırlık: Bu dersi filtrele
                            if (pref.weight === 'low') {
                                available = available.filter(k => {
                                    const group = itemsByExamType[k];
                                    return group.subject.toLowerCase() !== pref.subject.toLowerCase();
                                });
                                console.log(`⚠️ TERCIH: ${subjectName} azaltıldı`);
                            }
                        });
                    }

                    // 1. Ardışık (max 2)
                    if (!selectedKey && lastKey && consecutiveCount < 2 && available.includes(lastKey)) {
                        selectedKey = lastKey;
                    }

                    // 2. Bu hafta hiç gelmemiş
                    if (!selectedKey) {
                        consecutiveCount = 0;
                        const notSeen = available.filter(k => weeklySubjectCount[k] === 0 && k !== lastKey);
                        if (notSeen.length > 0) {
                            selectedKey = notSeen[0];
                            console.log(`🆕 ${itemsByExamType[selectedKey].subject} (${itemsByExamType[selectedKey].examType}) ilk kez`);
                        }
                    }

                    // 3. En az görünen FARKLI ders
                    if (!selectedKey) {
                        const different = available.filter(k => k !== lastKey);
                        if (different.length > 0) {
                            different.sort((a, b) => weeklySubjectCount[a] - weeklySubjectCount[b]);
                            selectedKey = different[0];
                        } else {
                            selectedKey = available[0]; // Başka seçenek yok
                        }
                    }

                    // Seçilen konuyu yerleştir
                    const group = itemsByExamType[selectedKey];
                    const topicIdx = currentTopicIndex[selectedKey];
                    const currentTopic = group.topics[topicIdx];

                    newSchedule[slotKey] = {
                        subject: group.subject,
                        topic: currentTopic.topic,
                        color: currentTopic.color,
                        slotType: 'Konu Çalışması',
                        examType: group.examType
                    };

                    // Güncelle
                    currentTopic.remaining--;
                    weeklySubjectCount[selectedKey]++;
                    consecutiveCount++;
                    lastKey = selectedKey;

                    if (currentTopic.remaining <= 0) {
                        console.log(`✅ ${group.subject} (${group.examType}) - ${currentTopic.topic} tamamlandı`);
                        currentTopicIndex[selectedKey]++;
                        // DÖNGÜ YOK - Oranlama sistemi konuları zaten doğru sayıda dağıttı
                    }
                }
            }
        }
    }

    console.log(`✅ Program hazır: ${Object.keys(newSchedule).length} slot`);
    return newSchedule;
};
