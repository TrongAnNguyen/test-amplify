# Design Document: Node Interaction Hitbox Expansion

**Date:** 2026-06-01  
**Topic:** Node Hitbox Expansion for MapComponentV2  
**Status:** Approved  

---

## 1. Problem Statement
In the [MapComponentV2.tsx](file:///Users/annguyen/Documents/tribal/repo/omnicom-network/components/MapComponentV2.tsx) relationship view, nodes are visually small (radius of 10px for regular nodes and 14px for the center node). At normal and zoomed-out scales, these small targets are hard for users to click or hover over accurately.

---

## 2. Selected Approach: Custom Shadow Canvas Hitbox
We will use the `nodePointerAreaPaint` callback from `react-force-graph-2d` to paint a larger interactive hitbox onto a hidden shadow canvas.

### Sizing Configuration:
- **Center Node (depth = 0):** Hitbox radius of `24px` (visual radius is `14px`).
- **Regular Nodes (depth > 0):** Hitbox radius of `18px` (visual radius is `10px`).

### Why this is selected:
- Extends the click and hover area without affecting the clean visual design.
- Fits safely within the D3 collision boundaries (`45px` collision radius, meaning nodes are spaced at least `90px` apart), ensuring interactive zones do not overlap.

---

## 3. Implementation Details
The following callback will be added to the `<ForceGraph2D>` component:

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

---

## 4. Verification Plan
1. Run local dev server (`rtk yarn dev`) and verify that node interactions (hover, click, right-click) are highly responsive with a larger pointer target.
2. Run linting (`rtk yarn lint`) and build (`rtk yarn build`) to verify that no compilation errors are introduced.
