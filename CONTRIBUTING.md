# Contributing to INKAD (إنقاذ)

Welcome to the **INKAD** open-source repository! We are excited to collaborate with engineers, data scientists, and disaster-response technology enthusiasts.

> **Project Context**: INKAD is an enterprise-grade capstone project developed within the **Thirduni** AI Builder Cohort. It simulates a national-scale emergency operations and forest fire prediction platform for Northern Algeria, serving Civil Protection (DGPC), Forest Conservation (DGF), and Central Administration authorities.

Please take a moment to review these contribution guidelines before submitting code, pull requests, or opening issues.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Architecture Overview](#architecture-overview)
3. [Local Environment Setup](#local-environment-setup)
   - [Prerequisites](#prerequisites)
   - [Backend Setup (FastAPI)](#backend-setup-fastapi)
   - [Frontend Setup (Next.js 14)](#frontend-setup-nextjs-14)
4. [Branching & Git Strategy](#branching--git-strategy)
5. [Pull Request Process](#pull-request-process)
6. [Coding Standards](#coding-standards)
   - [Frontend (TypeScript & React)](#frontend-typescript--react)
   - [Styling & Dual-Theme (Tailwind CSS)](#styling--dual-theme-tailwind-css)
   - [Backend (Python & FastAPI)](#backend-python--fastapi)
   - [Internationalization (i18n)](#internationalization-i18n)
7. [AI & ML Model Documentation Policy](#ai--ml-model-documentation-policy)
8. [Community & Contact](#community--contact)

---

## Code of Conduct

All contributors and maintainers are expected to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please treat all participants with respect, professionalism, and constructive empathy.

---

## Architecture Overview

INKAD is structured as a decoupled monorepo:

```
forest-fire-project/
├── backend/                  # FastAPI REST API & Machine Learning engine
│   ├── app/
│   │   ├── models/           # Pydantic schemas & data structures
│   │   ├── routers/          # Modular API routes (predict, weather, alerts, notifications, etc.)
│   │   ├── services/         # Huygens elliptical spread simulation & FWI calculations
│   │   └── utils/            # Shared helpers
│   ├── model.pkl             # Trained XGBoost classifier
│   ├── inkad_history.db      # SQLite operational event store & audit log
│   └── main.py               # Uvicorn entrypoint & CORS configuration
├── frontend/                 # Next.js 14 App Router tactical frontend
│   ├── src/
│   │   ├── app/              # Next.js App Router pages (Tactical Map, Alerts, Analytics, Admin, etc.)
│   │   ├── components/       # Reusable UI widgets, Modals, Leaflet Map, ThemeToggle, Tooltip
│   │   ├── context/          # React Contexts (Language, Notifications, Theme)
│   │   ├── lib/              # Client API connectors, Auth, Export utilities, Leaflet helpers
│   │   ├── locales/          # Tri-lingual dictionary files (en.json, fr.json, ar.json)
│   │   └── types/            # TypeScript type definitions
├── .github/                  # Issue & Pull Request templates
└── docs/                     # Architectural documentation & technical specs
```

---

## Local Environment Setup

### Prerequisites

- **Node.js**: v18.17.0+ or v20.x LTS
- **Python**: v3.10+ (v3.10 or v3.11 recommended)
- **Git**: 2.30+
- **Package Managers**: `npm` (v9+) and `pip` / `virtualenv`

---

### Backend Setup (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   - **Linux / macOS**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```

3. Install required Python packages:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. Launch the local FastAPI server:
   ```bash
   python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```

5. Verify the API health at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) (Interactive Swagger UI).

---

### Frontend Setup (Next.js 14)

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create or configure `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
   ```

4. Launch the Next.js development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser. Default demo credentials are provided directly on the `/login` page for all three operational tiers (Civil Protection, Forest Guard, and Central Administration).

---

## Branching & Git Strategy

We follow a structured branching model. Please branch from `main` and use descriptive prefixes:

| Branch Type | Purpose | Example |
| :--- | :--- | :--- |
| `feature/` | New UI, operational capability, or feature | `feature/wind-particle-animation` |
| `bugfix/` | Resolving an existing bug or regression | `bugfix/map-light-mode-tiles` |
| `hotfix/` | Urgent fix for production or presentation | `hotfix/token-refresh-handling` |
| `ml/` | AI model training, weights, or drift analysis | `ml/xgboost-algeria-recalibration` |
| `docs/` | Updates to documentation, guides, or specs | `docs/update-contributing-guide` |

### Commit Message Format

We adhere to **Conventional Commits**:
- `feat(scope): short description`
- `fix(scope): short description`
- `docs(scope): documentation update`
- `refactor(scope): code reorganization without feature change`
- `perf(scope): performance improvements`
- `test(scope): test cases or seeding scripts`

*Example*: `feat(map): add Esri light gray canvas basemap for daylight operations`

---

## Pull Request Process

1. **Verify Type Safety**: Run TypeScript validation before committing:
   ```bash
   cd frontend
   npx tsc --noEmit
   ```
   PRs with TypeScript errors will not be merged.

2. **Verify Theme Adaptability**: Test your changes in **both Dark Mode** (default emergency nocturnal view) and **Light Mode** (outdoor daylight view). Check contrast against WCAG AA standards.

3. **Verify Tri-Lingual Support**: If adding or altering user-facing text, ensure matching keys are added to:
   - `frontend/src/locales/en.json` & `en.ts`
   - `frontend/src/locales/fr.json` & `fr.ts`
   - `frontend/src/locales/ar.json` & `ar.ts` (ensuring correct Right-to-Left styling)

4. **Verify RBAC Integrity**: Ensure role gates (`RoleGate` component or `hasPermission`) are respected so Civil Protection, Forest Guards, and Central Admin view only authorized workflows.

5. **Open the Pull Request**: Fill out the [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md) completely, including verification steps and screenshots.

---

## Coding Standards

### Frontend (TypeScript & React)

- **Strict Typing**: Avoid `any`. Define interfaces in `frontend/src/types/` or within the component file.
- **Client vs Server Components**: Use `"use client";` only when state, event handlers, or browser APIs (e.g. Leaflet) are required.
- **Dynamic Leaflet Imports**: Leaflet requires `window`. Always import maps dynamically with SSR disabled:
  ```tsx
  const DynamicMap = dynamic(() => import("@/components/Map").then((m) => m.Map), {
    ssr: false,
    loading: () => <MapSkeleton />,
  });
  ```

### Styling & Dual-Theme (Tailwind CSS)

- All text, card backgrounds, and borders must support both themes:
  ```tsx
  /* Correct: High contrast in both themes */
  className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800"

  /* Incorrect: Hardcoded light text disappearing on white background */
  className="text-white bg-slate-900"
  ```
- Use accessible touch targets (minimum `36px x 36px`, ideally `44px x 44px` on mobile) in line with Nielsen Heuristics and Web Interface Guidelines.

### Backend (Python & FastAPI)

- Follow **PEP 8** style guidelines.
- Use explicit type annotations for function signatures and Pydantic request/response models.
- Handle database operations safely with parameterized queries or SQLite connection context managers.
- Keep external API calls (NASA FIRMS, Open-Meteo) wrapped in defensive try/catch blocks with cached fallbacks to guarantee uninterrupted emergency simulation.

### Internationalization (i18n)

- **No Hardcoded French, English, or Arabic prose in JSX**: Always retrieve localized copy using `const { t, language, isRTL } = useLanguage()`.
- Respect RTL layout semantics: use logical margin/padding (`ms-`, `me-`, `start-`, `end-`) or `${isRTL ? "text-right" : "text-left"}` where bidirectional layouts differ.

---

## AI & ML Model Documentation Policy

Machine learning is at the core of INKAD. When updating the wildfire risk predictor:

1. **Model Serialization**: Models must be serialized to `backend/model.pkl` with compatibility across Scikit-learn and XGBoost versions specified in `requirements.txt`.
2. **Evaluation Metrics**: Any new model training run must document:
   - ROC-AUC score (minimum acceptable threshold: 0.85).
   - Precision, Recall, and F1-score on holdout test datasets.
   - Canadian Forest Fire Weather Index (FWI) components (ISI, BUI, FFMC, DMC, DC).
3. **Drift Detection**: Ensure the model health telemetry endpoints (`/analytics/model-health` and `/analytics/drift-status`) accurately reflect the updated model metadata.

---

## Community & Contact

- **Course Platform**: Thirduni AI Builder Cohort
- **Team Lead & Maintainer**: Boudour Hanine ([hanine.boudour@univ-constantine2.dz](mailto:hanine.boudour@univ-constantine2.dz))
- **Security Vulnerabilities**: Please consult [SECURITY.md](SECURITY.md) for private disclosure instructions.

Thank you for contributing to the protection of Northern Algeria's forest massifs and communities!

