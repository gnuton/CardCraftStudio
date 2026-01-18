---
description: Run a full product development cycle: Architect -> Backend -> Frontend -> QA
---
# Product Squad Workflow

This workflow simulates a team of agents working together to implement a feature.

## 1. 🏛️ Architect Phase
**Goal**: Analyze requirements and create a technical specification.
1.  **Analyze**: Read the User Request and current `src/` (if any).
2.  **Plan**: Create or overwrite `plans/implementation_plan.md`.
    *   **Must Include**:
        *   User Stories/Requirements
        *   Technical Architecture (Components, State, APIs)
        *   Step-by-Step Implementation Guide
        *   Testing Strategy
3.  **Review**: (Optional) Ask the user for confirmation if the feature is complex.

## 2. ⚙️ Backend / Logic Phase
**Goal**: Implement the core logic and data structures.
1.  **Reference**: Read `plans/implementation_plan.md`.
2.  **Implement**:
    *   Create/Update data models associated with the feature.
    *   Implement business logic/hooks (e.g., storage services, context providers).
    *   Write unit tests for the logic.
3.  **Verify**: Run `npm test` (or `npx vitest`) to ensure logic is sound.
4.  **Document**: Update `README.md` and any relevant docs if new features/architecture changes were made.

## 3. 🎨 Frontend / UI Phase
**Goal**: Build the user interface.
1.  **Reference**: Read `plans/implementation_plan.md`.
2.  **Implement**:
    *   Create React components.
    *   Apply styling (using Tailwind/CSS as per project config).
    *   Integrate with Logic/Backend.
3.  **Refine**: Ensure the UI looks premium (responsive, animations) as per global instructions.
4.  **Document**: Update `README.md` and any relevant docs if new features/architecture changes were made.

## 4. 🕵️ QA / Tester Phase
**Goal**: Verify the feature works as intended.
1.  **Automated**: Run `npm test` to verify all new tests pass.
2.  **Manual Simulation** (Optional/As needed):
    *   Check for linting errors (`npm run lint`) and fix them.
3.  **Report**: Update `plans/implementation_plan.md` with a "Status" section marking items as "Verified".
