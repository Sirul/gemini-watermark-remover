# Request-Layer Asset Interceptor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current fail-open preview/clipboard/download mix with a fail-closed request-layer pipeline for original/full-quality Gemini assets used by copy and download.

**Architecture:** Keep Gemini history/RPC parsing as the binding source, but move correctness to a single response-transform layer for `rd-gg` assets. Disable default preview DOM replacement so page display is no longer the main success path for copy/download.

**Tech Stack:** Userscript runtime, page `fetch`/XHR interception, shared image session store, Node `node:test`, Playwright CDP validation

---

## File Structure

- Modify: `src/userscript/index.js`
  - stop installing DOM preview replacement by default
  - wire the new request-layer path early during startup
- Modify: `src/userscript/downloadHook.js`
  - expand from download-only interception into a stricter original/full-quality interceptor
  - remove silent fallback behavior for action-critical flows
- Modify: `src/userscript/clipboardHook.js`
  - keep only minimal clipboard-specific behavior
  - stop treating preview/session fallback as success
- Modify: `src/shared/imageSessionStore.js`
  - make copy/download resource selection strict instead of best-effort
- Add or split if needed: `src/userscript/generatedAssetHook.js`
  - hold request classification and response-transformation helpers if `downloadHook.js` grows too large
- Test: `tests/userscript/downloadHook.test.js`
- Test: `tests/userscript/clipboardHook.test.js`
- Test: `tests/shared/imageSessionStore.test.js`
- Test: `tests/userscript/downloadOnlyEntry.test.js`

### Task 1: Lock In The New Phase-1 Contract With Tests

**Files:**
- Modify: `tests/userscript/downloadHook.test.js`
- Modify: `tests/userscript/clipboardHook.test.js`
- Modify: `tests/shared/imageSessionStore.test.js`
- Modify: `tests/userscript/downloadOnlyEntry.test.js`

- [ ] **Step 1: Add failing tests for strict original/full-quality semantics**

Add tests for:

```js
test('download path should not fall back to the original response when full-quality processing fails', async () => {
  // expect explicit failure instead of returning the original response body
});

test('clipboard path should not reuse preview processed resources as a successful copy result', async () => {
  // expect explicit failure or null-result handling for action-critical flows
});

test('userscript entry should not install page image replacement by default in phase 1', () => {
  // assert installPageImageReplacement is absent or gated behind an off-by-default flag
});
```

- [ ] **Step 2: Run targeted tests and verify they fail**

Run:

```bash
node --test tests/userscript/downloadHook.test.js
node --test tests/userscript/clipboardHook.test.js
node --test tests/shared/imageSessionStore.test.js
node --test tests/userscript/downloadOnlyEntry.test.js
```

Expected:

- at least the newly added assertions fail
- failures point to current fallback behavior or current preview installation

- [ ] **Step 3: Commit the test-only checkpoint**

```bash
git add tests/userscript/downloadHook.test.js tests/userscript/clipboardHook.test.js tests/shared/imageSessionStore.test.js tests/userscript/downloadOnlyEntry.test.js
git commit -m "test: lock phase-1 request-layer contract"
```

### Task 2: Make Download/Original Interception Fail-Closed

**Files:**
- Modify: `src/userscript/downloadHook.js`
- Test: `tests/userscript/downloadHook.test.js`

- [ ] **Step 1: Change the request hook contract so action-critical failures are surfaced instead of silently passed through**

Target behavior:

```js
try {
  const processedBlob = await pendingBlob;
  return buildProcessedResponse(response, processedBlob);
} catch (error) {
  throw createActionCriticalProcessingError(error, resolvedActionContext);
}
```

- [ ] **Step 2: Keep interception scoped to original/full-quality Gemini assets in phase 1**

Guard rails:

```js
if (!isGeminiOriginalAssetUrl(url)) {
  return originalFetch(...args);
}
```

- [ ] **Step 3: Run the focused download-hook tests**

```bash
node --test tests/userscript/downloadHook.test.js
```

Expected:

- download hook tests pass
- old fallback-to-original expectations are replaced with explicit failure expectations

- [ ] **Step 4: Commit the download-hook change**

```bash
git add src/userscript/downloadHook.js tests/userscript/downloadHook.test.js
git commit -m "feat: make original-asset interception fail closed"
```

### Task 3: Remove Preview-As-Success Semantics From Clipboard And Session Lookup

**Files:**
- Modify: `src/userscript/clipboardHook.js`
- Modify: `src/shared/imageSessionStore.js`
- Test: `tests/userscript/clipboardHook.test.js`
- Test: `tests/shared/imageSessionStore.test.js`

- [ ] **Step 1: Make session lookup action-specific for correctness**

Target rule:

```js
if (action === 'download' || action === 'clipboard') {
  return readProcessedSlotResource(session, 'full');
}
```

- [ ] **Step 2: Stop clipboard from treating preview/session fallback as success**

Target behavior:

```js
if (!processedBlob) {
  throw new Error('Original image is unavailable for clipboard processing');
}
```

- [ ] **Step 3: Run the session-store and clipboard tests**

```bash
node --test tests/shared/imageSessionStore.test.js
node --test tests/userscript/clipboardHook.test.js
```

Expected:

- clipboard tests reflect explicit failure semantics
- session-store tests prove preview processed results are no longer accepted for copy/download

- [ ] **Step 4: Commit the strict resource-selection change**

```bash
git add src/userscript/clipboardHook.js src/shared/imageSessionStore.js tests/userscript/clipboardHook.test.js tests/shared/imageSessionStore.test.js
git commit -m "feat: require full-quality results for copy and download"
```

### Task 4: Disable Default DOM Preview Replacement In Userscript Entry

**Files:**
- Modify: `src/userscript/index.js`
- Test: `tests/userscript/downloadOnlyEntry.test.js`

- [ ] **Step 1: Remove or gate the default preview replacement installation**

Target direction:

```js
const pageImageReplacementController = null;
```

or:

```js
if (isPreviewReplacementEnabled()) {
  installPageImageReplacement(...);
}
```

with the default remaining off in phase 1.

- [ ] **Step 2: Keep original-asset discovery bootstrap intact**

Preserve:

```js
createGeminiDownloadRpcFetchHook(...)
installGeminiDownloadRpcXmlHttpRequestHook(...)
requestGeminiConversationHistoryBindings(...)
```

- [ ] **Step 3: Run the userscript entry tests**

```bash
node --test tests/userscript/downloadOnlyEntry.test.js
```

Expected:

- entry tests pass with new phase-1 startup semantics

- [ ] **Step 4: Commit the entry simplification**

```bash
git add src/userscript/index.js tests/userscript/downloadOnlyEntry.test.js
git commit -m "feat: disable default preview replacement in phase 1"
```

### Task 5: Add Explicit User-Facing Failure Messaging And Real-Page Verification

**Files:**
- Modify: `src/userscript/index.js`
- Modify: `src/userscript/clipboardHook.js`
- Modify: `src/userscript/downloadHook.js`
- Add if needed: `src/userscript/userNotice.js`

- [ ] **Step 1: Centralize the refresh/retry error message**

Target message:

```js
export const GWR_ORIGINAL_ASSET_REFRESH_MESSAGE = '无法获取原图，请刷新页面后重试';
```

- [ ] **Step 2: Surface this message on action-critical failures**

Expected usage:

```js
showUserNotice(GWR_ORIGINAL_ASSET_REFRESH_MESSAGE);
```

- [ ] **Step 3: Run the affected unit tests again**

```bash
node --test tests/userscript/downloadHook.test.js
node --test tests/userscript/clipboardHook.test.js
node --test tests/userscript/downloadOnlyEntry.test.js
```

Expected:

- all targeted tests pass

- [ ] **Step 4: Run build verification**

```bash
pnpm build
```

Expected:

- build completes successfully

- [ ] **Step 5: Run fixed-profile real-page verification**

```bash
node scripts/open-tampermonkey-profile.js --cdp-port 9226 --url "https://gemini.google.com/u/1/app/d3cd7d14852ecd3b?pageId=none"
```

Manual checks:

- `复制图片` triggers `rd-gg` interception and produces de-watermarked clipboard output
- `下载完整尺寸的图片` either succeeds through the same path or fails with the explicit refresh/retry message
- no default page-level preview replacement is required for action correctness

- [ ] **Step 6: Commit the user-facing failure handling**

```bash
git add src/userscript/index.js src/userscript/clipboardHook.js src/userscript/downloadHook.js src/userscript/userNotice.js
git commit -m "feat: show explicit retry guidance for missing original assets"
```

## Self-Review

- Spec coverage:
  - request-layer original/full-quality interception: covered by Tasks 1-2
  - strict copy/download semantics: covered by Tasks 1 and 3
  - preview replacement disabled by default: covered by Task 4
  - explicit refresh/retry failure message: covered by Task 5
- Placeholder scan:
  - no `TODO` or deferred implementation markers remain in task steps
- Type consistency:
  - all tasks refer to the same phase-1 contract: original/full-quality interception, no preview-as-success fallback

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-03-request-layer-asset-interceptor.md`. Two execution options:

1. Subagent-Driven (recommended) - I dispatch a fresh subagent per task, review between tasks, fast iteration
2. Inline Execution - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
