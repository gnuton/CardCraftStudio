---
name: command-safety
description: Protocols for assessing command risk and determining SafeToAutoRun status.
---

# Command Safety Assessment Protocol

## Objective
To empower the agent to autonomously execute commands ONLY if they strictly match a pre-approved "Safe Whitelist".

## Safety Philosophy
**Zero Trust Default**: If a command does not match a specific "Safe" pattern, it is deemed "Risky" and requires user approval (`SafeToAutoRun: false`).

## Risk Categories & Whitelist

### 🟢 SAFE (Auto-Run Allowed: true)
A command is SAFE if and only if it matches one of the following Receiver Regex patterns.
**Constraint**: Even if a command matches, if it contains `>` or `>>` (redirection) and is not explicitly handled, it is UNSAFE.

#### 1. File Reading & Inspection
*   `^(cat|ls|grep|find|head|tail|pwd|wc|diff) .*`
    *   Examples: `ls -la`, `cat package.json`, `grep "foo" src/bar.ts`

#### 2. Testing
*   `^npm (run )?test.*`
*   `^jest.*`
    *   Examples: `npm test`, `npm run test:watch`, `jest src/`

#### 3. Local Builds & Typechecks
*   `^npm run build.*`
*   `^tsc.*`
*   `^npm run typecheck.*`
    *   Examples: `tsc --noEmit`, `npm run build`

#### 4. Git Information (Read-Only)
*   `^git (status|log|diff|show|branch|remote -v).*`
    *   Examples: `git status`, `git log --oneline`

#### 5. Node/Environment Info
*   `^node -v`
*   `^npm -v`

### 🔴 UNSAFE (Auto-Run Allowed: false)
**Default for everything else.** If it's not in the Green list, it's Red.

#### Explicitly Dangerous Examples (Always Ask User)
*   **Deletion**: `rm`, `clean`, `rimraf`
*   **File Writing**: `echo "foo" > bar`, `cp`, `mv`
*   **Network Push**: `git push`, `deploy`
*   **System/Config**: `sudo`, `chmod`, `chown`, `npm config`
*   **Package Management**: `npm install`, `npm uninstall`, `npm audit fix`

## Protocol for Agent
1.  **Analyze Command**: Identify the command string you intend to run.
2.  **Check Whitelist**: regex match against the 🟢 SAFE patterns.
3.  **Check Redirections**: Ensure no `>` or `>>` exists unless you are certain it's safe (e.g., writing to a temp log file you just created).
4.  **Determine Flag**:
    *   Match found AND No suspicious redirects -> `SafeToAutoRun: true`
    *   No match OR Suspicious elements -> `SafeToAutoRun: false`

## Usage in `run_command`
When calling `run_command`, explicitly evaluate this protocol before setting `SafeToAutoRun`.

```json
{
  "CommandLine": "npm test",
  "SafeToAutoRun": true // Matches ^npm (run )?test.*
}
```

```json
{
  "CommandLine": "npm install",
  "SafeToAutoRun": false // Does not match allowed patterns
}
```
