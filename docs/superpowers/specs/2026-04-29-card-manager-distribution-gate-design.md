# Card Manager Distribution Gate Design

## Goal

Add a build-time distribution switch that controls whether card package management features are exposed in a given build.

This change is intended to support two release modes with the same codebase:

- online builds: hide card package management entry points
- local/offline builds: show card package management entry points

The first implementation target is the existing local HTML build and the deployed web build. The same switch should remain reusable for future EXE packaging.

## Decision

Use a public build-time environment variable:

- `NEXT_PUBLIC_ENABLE_CARD_MANAGER=true|false`

Recommended behavior:

- default: `false`
- local build script: force `true`
- online deployment: leave unset or explicitly set `false`

## Scope

This change includes:

1. A shared helper for checking whether card package management is enabled.
2. Hiding the `卡包` button in the main bottom dock when disabled.
3. Guarding `/card-manager` when disabled.
4. Guarding `/card-editor` when disabled.
5. Ensuring the existing local build path enables the feature by default.

This change does not include:

- EXE packaging
- runtime user settings for this switch
- changes to the actual import/export card package logic
- changes to built-in package override behavior

## Why Route Guards Are Included

Hiding only the bottom-dock button would make the UI inconsistent because users could still navigate directly to `/card-manager` or `/card-editor` by URL.

When the feature is disabled, the app should treat card package management as unavailable in that distribution, not merely hidden from the primary toolbar.

## UX Behavior

### Enabled build

- Main page bottom dock shows the `卡包` button.
- `/card-manager` behaves normally.
- `/card-editor` behaves normally.

### Disabled build

- Main page bottom dock does not show the `卡包` button.
- Visiting `/card-manager` shows a lightweight unavailable screen with:
  - a short explanation that this distribution does not enable card package management
  - a button to return to the home page
- Visiting `/card-editor` shows the same style of unavailable screen.

## Technical Design

### Shared gate helper

Add a small helper in `lib/` that returns a boolean derived from `process.env.NEXT_PUBLIC_ENABLE_CARD_MANAGER`.

Requirements:

- no extra abstraction beyond a boolean helper
- safe default of `false`
- usable in client components and page modules

### Bottom dock integration

File:

- `components/layout/bottom-dock.tsx`

Change:

- read the shared gate value
- conditionally render the `卡包` button group only when enabled

### Card manager page guard

File:

- `app/card-manager/page.tsx`

Change:

- short-circuit page rendering when the gate is disabled
- render a small unavailable-state page instead of the management UI

### Card editor page guard

File:

- `app/card-editor/page.tsx`

Change:

- same guard behavior as `/card-manager`

### Local build enablement

File:

- `scripts/run-next-build.js`

Change:

- when `--local` is used, also set `NEXT_PUBLIC_ENABLE_CARD_MANAGER=true`

This keeps `pnpm run build:local` aligned with the intended offline behavior.

## Validation Plan

Manual verification for disabled mode:

1. Run a normal production build.
2. Confirm the bottom dock no longer shows `卡包`.
3. Confirm `/card-manager` shows the unavailable state.
4. Confirm `/card-editor` shows the unavailable state.

Manual verification for enabled mode:

1. Run `pnpm run build:local`.
2. Confirm the bottom dock shows `卡包`.
3. Confirm `/card-manager` works normally.
4. Confirm `/card-editor` works normally.

## Risks

- If only one route is guarded, the feature boundary becomes inconsistent.
- If the default is `true`, online deployments may accidentally expose the feature.
- If the helper is duplicated instead of centralized, future EXE work will be harder to maintain.

## Out of Scope Follow-up

After this gate is in place, the next design cycle can cover:

- EXE packaging approach
- built-in resource update workflow via `.dhcb`
- how offline distributions should surface update/import affordances
