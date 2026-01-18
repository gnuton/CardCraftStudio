# Architecture Plan: Monorepo Migration (Simple)

## 1. Requirements
*   **Goal**: Move current app to `apps/web` and create empty `apps/backend`.
*   **Purpose**: Backend will eventually serve as a secure proxy for Google APIs (hiding secrets).
*   **Structure**: NPM Workspaces (Simple).
*   **Constraint**: NO `packages/shared` for now. Keep it minimal.
*   **CI/CD**: Fix GitHub Pages workflow.

## 2. Target Structure
```text
/ (Root)
├── package.json        # Workspaces: ["apps/*"]
├── apps/
│   ├── web/            # Moved CardCraftStudio
│   └── backend/        # New Express/Node app (Empty for now)
└── .github/workflows/  # Updated paths
```

## 3. Execution Steps
### Phase 1: Relocation (Dev)
1.  [ ] Create `apps/` directory.
2.  [ ] Move `src`, `public`, `index.html`, `vite.config.ts`, `tsconfig*.json`, `postcss.config.js`, `tailwind.config.js`, `.eslintrc.js` (if any) to `apps/web`.
3.  [ ] Move `package.json` to `apps/web` and rename package to `@cardcraft/web`.
4.  [ ] Create root `package.json` with `private: true` and `workspaces: ["apps/*"]`.

### Phase 2: Backend Init (Backend)
1.  [ ] Create `apps/backend/package.json`.
2.  [ ] Initialize basic structure (src/index.ts).

### Phase 3: CI/CD Fix (Devops)
1.  [ ] Update `.github/workflows/deploy.yml` (or similar) to change working directory to `apps/web` before building.
2.  [ ] Verify local `npm install` and `npm run dev --workspace=@cardcraft/web`.
