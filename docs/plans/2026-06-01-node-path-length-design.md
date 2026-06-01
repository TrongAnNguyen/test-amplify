# Design Document: Progressive Node Path Lengths

We want to increase the length of the path (radial spacing) for each node level in the network map visualization.

## Proposed Approach: Approach B (Progressive Depth Spacing)

Instead of scaling the radii linearly by a constant `RING_RADIUS` multiplier, we will use a progressive array of radius values for each depth. This provides:
1. Better visual separation between crowded levels (e.g. between level 1 and level 2).
2. A controlled growth rate for level 3, preventing nodes from rendering too far off-screen.
3. Automatic alignment of both the guide rings and the D3 simulation layout.

## Detailed Plan

### 1. Update Spacing Calculations in `components/MapComponentV2.tsx`
We will replace:
```typescript
const getBaseRadius = (depth: number) => {
  if (depth === 0) return 0
  if (depth < 3) return depth * RING_RADIUS
  return depth * RING_RADIUS * 1.25 // 25% larger for depth 3+ to handle volume
}
```

With:
```typescript
const getBaseRadius = (depth: number) => {
  const LEVEL_RADII = [0, 340, 720, 1180]
  if (depth < 0) return 0
  if (depth < LEVEL_RADII.length) return LEVEL_RADII[depth]
  // Extrapolate for deeper levels (if any) using the last step gap of 460px
  return LEVEL_RADII[LEVEL_RADII.length - 1] + (depth - LEVEL_RADII.length + 1) * 460
}
```

### 2. Validation
- The concentric guide rings (`backgroundRings`) use `getBaseRadius`, so they will automatically match the new distances.
- The D3 radial force (`d3.forceRadial`) uses `getBaseRadius`, so nodes will pull to the new positions correctly.
- Verify using lint checks and running local build/smoke test.
