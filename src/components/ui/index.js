/**
 * 🎛️ TASARIM DİZGESİ — BİLEŞENLER
 *
 * Tek içe aktarma noktası:
 *   import { Button, Card, Badge, Field, Input } from '../components/ui';
 *
 * Belirteçler (renk/ölçek) `styles/theme.css` ve `styles/dizge.css`te.
 * Bu dosyadaki bileşenler o belirteçlerin DIŞINA çıkmaz; yeni bir renk
 * ya da punto gerekiyorsa önce belirteç eklenir.
 *
 * Kural: yeni ekran yazarken düğme/kart/rozet/pencere elle kurulmaz.
 * Mevcut ekranlar dokunuldukça buraya taşınır (bkz. geliştirme planı).
 */

export { default as Button } from './Button';
export { default as Card, CardBaslik } from './Card';
export { default as Badge, Sayac } from './Badge';
export { default as Modal } from './Modal';
export { default as Tabs } from './Tabs';
export { default as Dropdown } from './Dropdown';
export { default as Tooltip } from './Tooltip';
export { default as Progress, HalkaProgress } from './Progress';
export { default as Avatar, AvatarGrubu } from './Avatar';
export { default as Icon, SIMGE_PUNTO } from './Icon';
export { default as Field, Input, Textarea, Select, girdiSinifi } from './Field';
export { default as DataTable } from './DataTable';
export { default as OnayKutusu } from './OnayKutusu';
export { BosDurum, Iskelet, IskeletKart, BolumHataSiniri } from './Durumlar';

// Toast ve onay penceresi bileşen değil, servis üzerinden çağrılır:
//   import { bildir, onayla } from '../services/uiGeriBildirim';
