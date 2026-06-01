# Progressive Node Path Lengths Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Increase the length of the path (radial spacing) for each node level in the map layout component using progressive spacing.

**Architecture:** Replace the linear scaling calculation in `getBaseRadius` with a progressive array definition mapping each depth level directly to a target radius. D3 force simulation and canvas guide rings automatically update through this helper.

**Tech Stack:** React, Next.js, D3 (d3-force)

---

### Task 1: Update Node Level Radii Spacing

**Files:**
- Modify: `components/MapComponentV2.tsx:20-24`

**Step 1: Modify `getBaseRadius` helper**

Update `getBaseRadius` to use the progressive radius array `[0, 340, 720, 1180]`:

```typescript
const getBaseRadius = (depth: number) => {
  const LEVEL_RADII = [0, 340, 720, 1180]
  if (depth < 0) return 0
  if (depth < LEVEL_RADII.length) return LEVEL_RADII[depth]
  return LEVEL_RADII[LEVEL_RADII.length - 1] + (depth - LEVEL_RADII.length + 1) * 460
}
```

**Step 2: Run lint check to verify code syntax**

Run: `rtk yarn lint`
Expected output: No ESLint syntax or typescript compiler errors in `components/MapComponentV2.tsx`.

**Step 3: Run production build verification**

Run: `rtk yarn build`
Expected output: Success build output without compilation errors.

**Step 4: Commit changes**

Run:
```bash
rtk git add components/MapComponentV2.tsx
rtk git commit -m "map: apply progressive node level radii spacing"
```
