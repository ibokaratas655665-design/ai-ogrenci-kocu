# Tasarım Dizgesi

Öncelik: **tutarlılık > süsleme.** Ekranlar süslü değil, aynı ürünün
parçası gibi görünmeli.

## Nerede ne var

| Dosya | İçerik |
|---|---|
| `src/styles/theme.css` | Renkler — açık ve koyu tema |
| `src/styles/dizge.css` | Ölçekler — tipografi, boşluk, yarıçap, yükseklik, süre |
| `tailwind.config.js` | Belirteçlerin Tailwind sınıflarına bağlanması |
| `src/components/ui/` | Bileşenler |
| `src/services/uiGeriBildirim.js` | Toast ve onay penceresi |

## Renk anlamları — her ekranda aynı

| Rol | Belirteç | Sınıf |
|---|---|---|
| Primary | `--brand` | `bg-brand` `text-brand` |
| Secondary | `--accent` | `bg-accent` |
| Accent | `--highlight` | `bg-highlight` |
| Background | `--bg` | `bg-page` |
| Surface | `--surface` | `bg-surface` |
| Surface elevated | `--surface-e` | `bg-surface-e` |
| Border | `--line` / `--line-2` | `border-line` |
| Text primary | `--ink` | `text-ink` |
| Text secondary | `--ink-2` | `text-ink-2` |
| Muted | `--ink-3` | `text-ink-3` |
| Success | `--ok` | `bg-ok` `text-ok` |
| Warning | `--warn` | `bg-warn` |
| Error | `--danger` | `bg-danger` |
| Info | `--info` | `bg-info` |
| Disabled | `--disabled` | `bg-disabled text-disabled-ink` |

Her durum renginin bir de `-soft` zemini var (`bg-ok-soft`). Rozet ve
uyarı kutularında zemin `-soft`, yazı ana renk olur.

⚠️ Aynı durumu bir ekranda yeşil, başkasında mavi gösterme. Renk anlam
taşır; anlam değişirse kullanıcı renkten bir şey okuyamaz.

## Tipografi

Sınıf olarak kullan, punto/ağırlık elle yazma.

`tip-display` `tip-h1` `tip-h2` `tip-h3` `tip-h4` `tip-body` `tip-small`
`tip-caption` `tip-label` `tip-mini` `tip-nav` `tip-tab`

Ölçek: 11 · 12 · 13 · 14 · 16 · 20 · 26 · 34 · 44. **11'in altı yok.**
Sayı sütunlarında `rakam` sınıfını ekle (hizalı rakam).

## Ölçekler

- **Boşluk:** `p-sikisik` `p-alan` `p-kart` `p-bolum` `p-sayfa` (4px ızgara)
- **Yarıçap:** `rounded-dsm` (rozet) · `rounded-dmd` (düğme, girdi) ·
  `rounded-dlg` (kart, modal) · `rounded-pill` (avatar, hap)
- **Yükseklik:** `shadow-kart` < `shadow-acilir` = `shadow-yuzen` < `shadow-modal`
- **Süre:** `duration-hizli` (120ms) · `duration-normal` (200ms) ·
  `duration-yavas` (320ms)

## Bileşenler

```jsx
import { Button, Card, Badge, Field, Input, Tabs, Modal,
         Dropdown, Tooltip, Progress, Avatar, Icon,
         BosDurum, IskeletKart, BolumHataSiniri } from '../components/ui';
```

**Button** — `varyant`: `primary` `secondary` `outline` `ghost` `danger`
`success`. `boyut`: `sm` `md` `lg`. `yukleniyor`, `simge`, `yalnizSimge`
(bu durumda `etiket` zorunlu). Altı durumun hepsi (default/hover/active/
focus/disabled/loading) bileşende hazır.

**Field + Input** — `id` ve `htmlFor` otomatik bağlanır; `hata` verince
`aria-invalid` ve kırmızı durum kendiliğinden gelir.

**Modal** — Escape, odak tuzağı, arka plan kilidi, `dvh` yükseklik,
yapışık başlık ve alt çubuk içinde.

**Toast / onay** — bileşen değil, servis:

```js
import { bildir, onayla } from '../services/uiGeriBildirim';
bildir('Kaydedildi', 'basari');
if (await onayla({ mesaj: '…silinecek?', tehlikeli: true })) { … }
```

`window.alert` ve `window.confirm` **kullanma**.

## Simge

`lucide-react`, `Icon` sarmalayıcısı üzerinden. Punto ölçeği sabit
(`xs`–`xxl`), çizgi kalınlığı 1.75. Emoji yalnızca öğrenciye dönük
kutlama/rozet içeriğinde; düğme etiketinde değil.

## Kurallar

1. Belirteç dışına çıkma. Ara değer gerekiyorsa ölçeğe basamak ekle,
   tek seferlik `text-[13px]` yazma.
2. Sabit renk yazma (`bg-indigo-500`, `#4F46E5`) — karanlık temada bozulur.
3. Yeni ekranda düğme/kart/rozet/pencere elle kurma.
4. Mevcut ekranlar **dokunuldukça** taşınır; toplu dönüşüm yapılmaz.

## Bilerek dokunulmayanlar

Tailwind'in `rounded-lg/xl/2xl`, `text-sm/xs` gibi sınıfları
değiştirilmedi — kodda binlerce yerde kullanılıyor ve hepsini kırardı.
Dizge yeni, anlamlı adlar ekler; eskiler kademeli olarak bırakılır.
