---
description: Enforce strict testing protocols for git operations and test modifications.
---

# Testing Policy

This skill enforces critical rules regarding testing and git operations to maintain code quality and stability.

## 1. Git Push Safety
- **NEVER** push to a remote git repository without running the tests first.
- **FORBIDDEN**: Do not use `--no-verify` or any other flag that skips pre-push hooks or testing.
- Always ensure tests pass locally before attempting to push.

## 2. Test Modification Review
- If any changes are required to existing tests (logic, assertions, or test setup), you **MUST** pause and ask the user for a review of the proposed changes before implementing them.
- Explain clearly why the test needs to be changed (e.g., requirement change, bug in test code, etc.).
- Do not proceed with the change until explicit approval is received.

## 3. Test Preservation
- **NEVER** delete an existing test file.
- **NEVER** replace the majority of a test file's content (e.g., rewriting the entire file from scratch).
- Refactoring is allowed but must strictly preserve the original test coverage and intent.
- If a test seems obsolete or incorrect, propose a modification as per Rule 2, rather than deletion.
