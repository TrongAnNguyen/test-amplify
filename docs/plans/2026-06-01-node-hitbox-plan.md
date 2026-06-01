# Node Hitbox Expansion Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Increase the click/hover hitbox of nodes on the relationship graph to make interaction easier.

**Architecture:** Use the native `nodePointerAreaPaint` callback of `react-force-graph-2d` to paint a larger pointer-detection area (radius 18px/24px vs visual 10px/14px) on the internal shadow canvas.

**Tech Stack:** React, Next.js, HTML5 Canvas API (via react-force-graph-2d).

---

### Task 1: Add Hitbox Painting to MapComponentV2

**Files:**
- Modify: `components/MapComponentV2.tsx`

**Step 1: Add nodePointerAreaPaint implementation**
Add the `nodePointerAreaPaint` property to the `<ForceGraph2D>` rendering block in [components/MapComponentV2.tsx](file:///Users/annguyen/Documents/tribal/repo/omnicom-network/components/MapComponentV2.tsx#L964-L1000).

```tsx
          nodePointerAreaPaint={(node, color, ctx) => {
            const isCenter = (node as any).depth === 0
            const radius = isCenter ? 24 : 18
            ctx.save()
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.arc(node.x ?? 0, node.y ?? 0, radius, 0, 2 * Math.PI)
            ctx.fill()
            ctx.restore()
          }}
```

**Step 2: Run linter**
Run command:
```bash
rtk yarn lint
```
Expected: PASS (No ESLint errors or compilation errors introduced).

**Step 3: Commit code changes**
Run commands:
```bash
rtk git add components/MapComponentV2.tsx
rtk git commit -m "map: expand interactive hitbox of nodes"
```

---

### Task 2: Verify in Browser and Production Build

**Files:**
- Test: Manual verify in browser via development server.

**Step 1: Start dev server**
Run command:
```bash
rtk yarn dev
```
Expected: Dev server runs successfully at `http://localhost:3000`.

**Step 2: Verify interactions**
Inspect the Contact Explorer page. Test hover, left-click (pan/zoom), and right-click (expand/collapse) on nodes. Verify they trigger with a larger mouse-target area and do not overlap.

**Step 3: Verify production build**
Run command:
```bash
rtk yarn build
```
Expected: Next.js build finishes successfully without errors.
