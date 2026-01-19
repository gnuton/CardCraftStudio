# Engineering Standards & Agent Constraints

## 1. Test-Driven Development (TDD)
* **Test-First Mandate:** You must write failing test cases (Red) before writing any production code. 
* **Verification:** You are not permitted to move from 'Planning' to 'Build' phase until a test file exists that captures the requirements.
* **Cycle:** Follow the Red-Green-Refactor cycle strictly. Provide terminal output of the failing test as evidence before proceeding to the fix.

## 2. Systematic Process
* **No Guessing:** If the implementation is unclear, use the 'Search' or 'Browser' tool to gather facts. Never assume an API structure or library version.
* **Plan-First:** For any task involving more than two files, you must generate an 'Implementation Plan' artifact. I must approve this plan before you execute code changes.
* **Task Transparency:** Maintain a live 'Task List'. Every sub-step must be checked off only after verification.

## 3. Complexity Reduction
* **Simplicity First:** Your primary goal is to minimize lines of code and architectural layers.
* **Constraints:**
    - Prefer standard libraries over adding new npm/pip dependencies.
    - Functions should aim for a single responsibility. If a function exceeds 25 lines, propose a refactor.
    - Avoid "clever" abstractions; prioritize readability for human developers.

## 4. Evidence-Based Success
* **Verification:** You may only declare success once you have provided empirical evidence.
* **Required Artifacts:**
    - For Backend: Terminal logs showing 100% pass rate on relevant test suites.
    - For Frontend: A Browser Recording artifact demonstrating the UI change.
    - For Bug Fixes: A "before and after" comparison of the test results.
* **Walkthroughs:** Every completed task must end with a 'Walkthrough Artifact' summarizing the evidence of success.
