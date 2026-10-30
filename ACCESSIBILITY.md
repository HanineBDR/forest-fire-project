# Accessibility Statement (Déclaration d'Accessibilité / بيان إمكانية الوصول)

## Commitment to Accessibility

The **INKAD** platform team is committed to ensuring digital accessibility for all users, including emergency responders, civil protection officers, forest guards, public administrators, and citizens with diverse physical, sensory, cognitive, or situational abilities.

We actively target and uphold the **Web Content Accessibility Guidelines (WCAG) 2.1 Level AA** standards across the entire application interface.

---

## Operational Context & Ergonomics

INKAD is deployed across demanding operational environments:
- **Nocturnal Emergency Command Rooms (CODIS)**: Requiring low-glare, dark slate/navy interfaces to reduce eye fatigue during overnight incident monitoring.
- **Daylight Field Deployments (DGF & Field Units)**: Requiring a crisp, high-contrast **Light Mode** that remains clearly legible on rugged tablets and mobile screens under intense sunlight and Sirocco conditions.

---

## Accessibility Measures Implemented

To meet WCAG 2.1 AA compliance, INKAD incorporates the following architectural and visual design practices:

### 1. Visual Contrast & Color Independence
- **Dual-Theme High Contrast**: All text, interactive controls, and borders maintain contrast ratios of at least **4.5:1** for regular text and **3:1** for graphical user interface components against their respective backgrounds in both Dark Mode and Light Mode.
- **Information Without Color Reliance**: Critical status indicators (e.g., Fire Danger Level, Active vs. Extinguished perimeters) convey information using explicit text labels, numerical values, and distinct SVG icon shapes—never color alone.

### 2. Keyboard Navigation & Focus Indicators
- **Complete Keyboard Operability**: All primary navigation links, role switchers, action buttons, modals, and tutorial steps are fully reachable via the `Tab` and `Shift + Tab` keys.
- **High-Visibility Focus Rings**: Interactive elements feature prominent, high-contrast focus rings (`focus-visible:ring-2 focus-visible:ring-red-500`) to clearly indicate keyboard cursor position.
- **Escape Key Dismissal**: Modals, dropdowns, and tutorial guides immediately dismiss upon pressing the `Escape` key, restoring focus to the triggering element.

### 3. Screen Reader Support & Semantic HTML
- **Semantic Structure**: Interfaces utilize native semantic HTML5 landmark tags (`<header>`, `<nav>`, `<main>`, `<section>`, `<aside>`, `<footer>`, `<table>`).
- **ARIA Semantics**: Dynamic status banners, loading indicators, and notifications are annotated with appropriate ARIA roles (`role="status"`, `role="alert"`, `aria-live="polite"`, `aria-expanded`).
- **Immediate Tooltip Text**: Tooltips are programmatically linked to their triggers using unique `aria-describedby` attributes, allowing assistive technologies to announce helper copy instantly.

### 4. Tri-Lingual & Bidirectional (RTL) Adaptability
- Native, human-crafted translations for **English (EN)**, **French (FR)**, and **Arabic (AR)**.
- When Arabic is selected, the application automatically dynamically flips its document direction (`dir="rtl"`) and activates tailored Arabic typography, ensuring a natural reading order and logical spatial navigation.

---

## Known Limitations & Accessible Alternatives

While we strive for comprehensive accessibility, certain cutting-edge geospatial features present technical constraints:

### 1. Interactive Tactical Cartography (Leaflet Map)
- **Limitation**: The interactive tactical map renders complex spatial data (Huygens elliptical fire spread projections, dynamic wind particle animations, and NASA FIRMS satellite thermal points) onto HTML5 Canvas and SVG layers. These visual elements rely heavily on pointer/touch interaction and have limited native screen-reader interpretation for raw spatial coordinates.
- **Accessible Alternative**: Every piece of critical cartographic data is mirrored textually in accessible formats:
  - The **Risk Panel** provides direct numerical risk percentages, temperatures, wind speeds, and hazard levels.
  - The **Wilaya Burn Statistics Table** provides tabular summaries of hectares burned and hotspot counts.
  - The **Active Alerts Queue** (`/dashboard/alerts`) presents complete tabular records with status progression and GPS coordinates.
  - The **Official PV Report Generator** exports comprehensive, screen-reader-compatible PDF and CSV documents in English, French, and Arabic.

---

## Testing & Verification Methodology

The INKAD interface is evaluated through:
- Automated accessibility scanners (Lighthouse Accessibility Audits, axe DevTools).
- Manual keyboard-only navigation testing across all supported routes.
- Screen reader testing using NVDA (Windows) and VoiceOver (macOS / iOS).
- Dual-theme WCAG color-contrast verification across OLED and IPS displays.

---

## Feedback, Inquiries & Reporting Barriers

We welcome your feedback on the accessibility of INKAD. If you encounter any accessibility barrier or require an alternative format for operational documents, please reach out to us:

- **Email**: [accessibility@in9ad.dz](mailto:accessibility@in9ad.dz)
- **Academic Maintainer**: [hanine.boudour@univ-constantine2.dz](mailto:hanine.boudour@univ-constantine2.dz)
- **Response Commitment**: We aim to respond to accessibility inquiries within **48 hours** with a viable workaround or timeline for remediation.

*This statement was created on October 31, 2026, as part of the INKAD Capstone Project for the Thirduni AI Cohort.*
