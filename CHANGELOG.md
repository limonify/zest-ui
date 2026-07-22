# Changelog

Tüm önemli değişiklikler bu dosyada belgelenecektir.

Biçim [Keep a Changelog](https://keepachangelog.com/tr/1.0.0/) temel alınarak hazırlanmıştır ve bu proje [Semantic Versioning](https://semver.org/lang/tr/) kurallarına uyar.

## [0.2.0] - 2025-01-23

### Yeni Özellikler

- **transitionStatus**: Dialog, Drawer, Popover, Menu, Select ve Tooltip bileşenlerine `transitionStatus` state field'ı eklendi. Bu, açılış/kapanış animasyonlarını kontrol etmeyi sağlar (`'starting'` | `'ending'` | `undefined`).
- **Slider.Thumb percent**: Slider.Thumb state'ine `percent` (0-100) field'ı eklendi. Thumb pozisyonunu yüzde olarak almak için kullanılabilir.
- **Subpath exports**: Tree-shaking optimizasyonu için her bileşene ayrı import yolu eklendi (örn: `@limonify/zest-ui/dialog`, `@limonify/zest-ui/button`).
- **Keyboard props**: SelectList'e `keyboardShouldPersistTaps: 'handled'` ve `keyboardDismissMode: 'on-drag'` default değerleri eklendi.

### Bug Düzeltmeleri

- **Collapsible Panel**: Panel yüksekliği ölçümünde `height <= 0` kontrolü eklendi. Bu, geçersiz layout ölçümlerinin state'e yansımasını engeller.
- **Tooltip Accessibility**: Tooltip.Popup'a `accessibilityRole: 'tooltip'` eklendi. Artık screen reader'lar tarafından doğru şekilde tanınır.

### Performans İyileştirmeleri

- **useMemo optimizasyonları**: Leaf bileşenlerde state object'leri `React.useMemo` ile sarıldı:
  - Button, Toggle, Separator, Input
  - MenuItem, TabsTab, AvatarRoot
  - RadioGroup, CheckboxGroup, ToggleGroup

### Altyapı

- **Bundle size monitoring**: `size-limit` eklendi. CI'da otomatik bundle size kontrolü yapılıyor (limit: 500 kB, mevcut: ~57 kB).
- **Test coverage**: Jest coverage konfigürasyonu eklendi. `bun run test:coverage` ile coverage raporu alınabilir.
- **TypeScript strictness**: `noImplicitReturns` ve `useUnknownInCatchVariables` compiler option'ları eklendi.
- **CI/CD**: Coverage reporting (Codecov) ve bundle size check adımları eklendi.
- **Changelog automation**: `@changesets/cli` eklendi. PR'larda changeset dosyası eklerek otomatik changelog oluşturulabilir.

### Dokümantasyon

- Slider dokümantasyonuna `SliderThumbState` (percent field dahil) eklendi.

---

## [0.1.5] - 2024-12-XX

### Bug Düzeltmeleri

- Accordion değerleri normalize edildi ve transition status effect düzeltildi.

---

## [0.1.4] - 2024-12-XX

### Özellikler

- Panel state context hooks ve `measurePadding` prop eklendi.
- Switch.Thumb'a `keepMounted` + `transitionStatus` eklendi.

---

## [0.1.3] - 2024-12-XX

### Bug Düzeltmeleri

- Toast animasyon lifecycle düzeltildi: auto-clear starting status ve measuredHeight koruması.
- Hook transition problemi düzeltildi.

---

## [0.1.2] - 2024-12-XX

### Özellikler

- Modal portal'lar için native fade transition eklendi.

---

## [0.1.1] - 2024-12-XX

### Altyapı

- `react-native-gesture-handler` 3.1'e yükseltildi.
- Expo ve jest-expo SDK 57 patch'lerine yükseltildi.
- npm provenance için repository URL ayarlandı.

---

## [0.1.0] - 2024-12-XX

### İlk Yayın

- 32 Base UI bileşeni React Native'e port edildi.
- Headless, unstyled, accessible primitive components.
- Store-based state management.
- Compound component pattern.
- 636 Jest testi.
