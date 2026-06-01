'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Network, Search, ZoomIn, ZoomOut, Maximize, Loader2 } from 'lucide-react'
import ExplorerShell from '@/components/ExplorerShell'
import { apiClient } from '@/utils/apiClient'
import type { Schema } from '@/amplify/data/resource'
import { useQuery } from '@tanstack/react-query'
import { fetchAllPages } from '@/utils/amplifyFetch'
import dynamic from 'next/dynamic'
import * as d3 from 'd3-force'

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false })

// --- CONFIGURATION ---

const safeId = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '_')

const getBaseRadius = (depth: number) => {
  const LEVEL_RADII = [0, 340, 720, 1180]
  if (depth < 0) return 0
  if (depth < LEVEL_RADII.length) return LEVEL_RADII[depth]
  return LEVEL_RADII[LEVEL_RADII.length - 1] + (depth - LEVEL_RADII.length + 1) * 460
}

interface MapNode {
  id: string
  label: string
  category: string
  subLabel?: string
}

interface LayoutNode extends MapNode {
  x: number
  y: number
  angle: number
  radius: number
  depth: number
}

type LayoutLink = {
  id: string
  source: Pick<LayoutNode, 'x' | 'y' | 'category' | 'id'>
  target: Pick<LayoutNode, 'x' | 'y' | 'category' | 'id'>
}

const DEFAULT_EMPLOYEE_DATA: Schema['Employee']['type'][] = []

const resolveCSSVar = (varName: string, fallbackColor: string) => {
  if (typeof window === 'undefined') return fallbackColor
  const val = window.getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  return val || fallbackColor
}

export default function MapComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['employees'],
    queryFn: () =>
      fetchAllPages((nextToken) => apiClient.models.Employee.list({ nextToken, limit: 3000 })),
  })
  const employeeData = data || DEFAULT_EMPLOYEE_DATA
  const [viewMode, setViewMode] = useState<'industry' | 'exec'>('industry') // 'industry' or 'exec'

  // SVG Pan/Zoom state
  const containerRef = useRef<HTMLDivElement>(null)
  const fgRef = useRef<any>(null)
  const [viewportSize, setViewportSize] = useState({ width: 800, height: 800 })
  const [hoveredNode, setHoveredNode] = useState<any>(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Styling helpers
  const getColor = (c: string) =>
    (
      ({
        center: 'var(--center-node)', //fix
        executive: '#f59e0b',
        industry: '#3b82f6',
        company: '#8b5cf6',
        person: '#10b981',
      }) as Record<string, string>
    )[c] || '#6b7280'
  const getStroke = (c: string) =>
    (
      ({
        center: 'var(--center-node)', //fix
        executive: '#b45309',
        industry: '#1e3a8a',
        company: '#4c1d95',
        person: '#064e3b',
      }) as Record<string, string>
    )[c] || '#374151'

  // 1. Process Employee data into Nodes and Relationship Edges
  const { nodesMap, edges, execNodes, indNodes, filteredData } = useMemo(() => {
    const nodes = new Map<string, MapNode>()
    nodes.set('omnicom', {
      id: 'omnicom',
      label: 'Omnicom Oceania',
      category: 'center',
    })

    const rels = {
      base: new Set<string>(),
      execInd: new Set<string>(),
      indComp: new Set<string>(),
      compExec: new Set<string>(),
      personExec: new Set<string>(),
    }
    const execs: MapNode[] = [],
      inds: MapNode[] = []

    const validData = employeeData.filter(
      (emp) => emp.primaryContact && emp.category && emp.companyBrand && emp.clientName,
    )

    validData.forEach((emp) => {
      const exec = emp.primaryContact!
      const ind = emp.category!
      const comp = emp.companyBrand!
      const person = emp.clientName!
      const role = emp.clientTitle || ''

      const execId = `exec_${safeId(exec)}`
      const indId = `ind_${safeId(ind)}`
      const compId = `comp_${safeId(comp)}`
      const personId = `p_${safeId(person)}`
      if (!nodes.has(execId)) {
        const n = { id: execId, label: exec, category: 'executive' }
        nodes.set(execId, n)
        execs.push(n)
      }
      if (!nodes.has(indId)) {
        const n = { id: indId, label: ind, category: 'industry' }
        nodes.set(indId, n)
        inds.push(n)
      }
      if (!nodes.has(compId)) nodes.set(compId, { id: compId, label: comp, category: 'company' })

      // Append company name to the contact's title
      if (!nodes.has(personId))
        nodes.set(personId, {
          id: personId,
          label: person,
          subLabel: role ? `${role}, ${comp}` : comp,
          category: 'person',
        })

      rels.execInd.add(`${execId}|${indId}`)
      rels.indComp.add(`${indId}|${compId}`)
      rels.compExec.add(`${compId}|${execId}`) // Top-down for Exec View
      rels.personExec.add(`${personId}|${execId}`) // Bottom-up Contact -> Exec mapping for Industry View
      rels.base.add(`${compId}|${personId}`)
    })

    return {
      nodesMap: nodes,
      edges: rels,
      execNodes: execs,
      indNodes: inds,
      filteredData: validData,
    }
  }, [employeeData])

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())
  const [path, setPath] = useState<MapNode[]>([])

  // Search logic
  const searchResults = useMemo(() => {
    if (searchQuery.length < 3) return []
    const query = searchQuery.toLowerCase()

    return Array.from(nodesMap.values())
      .filter((node) => {
        if (node.category === 'center') return false
        const matchLabel = node.label.toLowerCase().includes(query)
        const matchSub = node.subLabel ? node.subLabel.toLowerCase().includes(query) : false
        return matchLabel || matchSub
      })
      .slice(0, 12) // Limit to top 12 results
  }, [searchQuery, nodesMap])

  // Handle click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSearchDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Helper to smartly expand nodes based on view mode to avoid clutter
  const getInitialExpanded = (mode: string, map: Map<string, MapNode>) => {
    const ids = new Set<string>()
    map.forEach((n) => {
      if (mode === 'industry' && n.category === 'person') return // Hide Execs by collapsing contacts
      ids.add(n.id)
    })
    return ids
  }

  useEffect(() => {
    setExpandedIds(getInitialExpanded(viewMode, nodesMap))
    setPath([nodesMap.get('omnicom')!])
    if (fgRef.current) {
      fgRef.current.centerAt(0, 0, 300)
      fgRef.current.zoom(0.8, 300)
    }
  }, [nodesMap, viewMode])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateSize = () => {
      setViewportSize({
        width: container.clientWidth || 800,
        height: container.clientHeight || 800,
      })
    }
    updateSize()

    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(container)

    return () => resizeObserver.disconnect()
  }, [])

  const currentRoot = path[path.length - 1] || nodesMap.get('omnicom')

  // --- CALCULATE TRUE DATA PORTFOLIO FOR FOCUS NODE ---
  const focusStats = useMemo(() => {
    let matchingRows: Schema['Employee']['type'][] = []

    // If we are at the center, we count everything
    if (!currentRoot || currentRoot.id === 'omnicom') {
      matchingRows = filteredData
    } else {
      // Filter raw dataset based on exactly what is clicked
      matchingRows = filteredData.filter((emp) => {
        if (currentRoot.category === 'executive') return emp.primaryContact === currentRoot.label
        if (currentRoot.category === 'industry') return emp.category === currentRoot.label
        if (currentRoot.category === 'company') return emp.companyBrand === currentRoot.label
        if (currentRoot.category === 'person') return emp.clientName === currentRoot.label
        return false
      })
    }

    const execs = new Set()
    const inds = new Set()
    const comps = new Set()
    const persons = new Set()

    // Count unique connections within the matched dataset
    matchingRows.forEach((emp) => {
      execs.add(safeId(emp.primaryContact!))
      inds.add(safeId(emp.category!))
      comps.add(safeId(emp.companyBrand!))
      persons.add(safeId(emp.clientName!))
    })

    return {
      executive: execs.size,
      industry: inds.size,
      company: comps.size,
      person: persons.size,
    }
  }, [currentRoot, filteredData])

  // 2. Generate active links based on View Mode
  const activeLinks = useMemo(() => {
    const links: { source: string; target: string; id: string }[] = []
    edges.base.forEach((e) => {
      const [s, t] = e.split('|')
      links.push({ source: s, target: t, id: e })
    })

    if (viewMode === 'exec') {
      // 1. Omnicom -> Execs
      execNodes.forEach((n) => links.push({ source: 'omnicom', target: n.id, id: `omn|${n.id}` }))

      // 2. Execs -> Companies (Bypassing Industries entirely)
      edges.compExec.forEach((e) => {
        const [s, t] = e.split('|')
        links.push({ source: s, target: t, id: `ce|${s}|${t}` })
      })

      // 3. Dynamic Loop-back: If a contact (person) is clicked, reveal their direct connection back to the Execs
      if (currentRoot && currentRoot.category === 'person') {
        edges.personExec.forEach((e) => {
          const [s, t] = e.split('|')
          links.push({ source: s, target: t, id: `pe|${s}|${t}` })
        })
      }
    } else {
      indNodes.forEach((n) => links.push({ source: 'omnicom', target: n.id, id: `omn|${n.id}` }))
      edges.indComp.forEach((e) => {
        const [s, t] = e.split('|')
        links.push({ source: s, target: t, id: e })
      })
      // Map Executives directly to Contacts instead of Companies
      edges.personExec.forEach((e) => {
        const [s, t] = e.split('|')
        links.push({ source: s, target: t, id: e })
      })
    }
    return links
  }, [viewMode, edges, execNodes, indNodes, currentRoot])

  // 3. Build Adjacency List for fast graph traversal
  const adjList = useMemo(() => {
    const list = new Map<string, string[]>()
    activeLinks.forEach((link) => {
      if (!list.has(link.source)) list.set(link.source, [])
      if (!list.has(link.target)) list.set(link.target, [])
      list.get(link.source)!.push(link.target)
      list.get(link.target)!.push(link.source)
    })
    return list
  }, [activeLinks])

  // 4. Core Layout Engine: Breadth-First Search Radial Layout with Proportional Weight Spacing
  const { layoutNodes, maxDepth } = useMemo(() => {
    if (!currentRoot) return { layoutNodes: [], layoutLinks: [], maxDepth: 0 }

    const focusId = currentRoot.id
    const visited = new Set([focusId])
    const queue = [{ id: focusId, depth: 0 }]
    const treeLinks: { source: string; target: string; id: string }[] = []
    const nodeChildren = new Map<string, string[]>()

    // Pass 1: Build the BFS Tree
    while (queue.length > 0) {
      const { id, depth } = queue.shift()!
      if (!expandedIds.has(id)) continue

      const neighbors = adjList.get(id) || []
      neighbors.forEach((neighborId) => {
        if (!visited.has(neighborId)) {
          visited.add(neighborId)
          queue.push({ id: neighborId, depth: depth + 1 })
          if (!nodeChildren.has(id)) nodeChildren.set(id, [])
          nodeChildren.get(id)!.push(neighborId)
          treeLinks.push({
            source: id,
            target: neighborId,
            id: `${id}-${neighborId}`,
          })
        }
      })
    }

    // Pass 2: Calculate the "weight" of every node to ensure perfectly even spacing
    const getWeight = (id: string): number => {
      if (!expandedIds.has(id)) return 1
      const children = nodeChildren.get(id) || []
      if (children.length === 0) return 1
      return children.reduce((sum, childId) => sum + getWeight(childId), 0)
    }

    const calculatedNodes: LayoutNode[] = []
    let maximumDepth = 0
    let globalStaggerIndex = 0

    const calcNodeLayout = (id: string, startAngle: number, endAngle: number, depth: number) => {
      maximumDepth = Math.max(maximumDepth, depth)

      // Increment a global counter for every placed node to guarantee sequential staggering
      if (depth > 0) globalStaggerIndex++

      // STAGGER RADIUS: To prevent label overlap in dense clusters, we distribute the radius
      // for sibling nodes across multiple levels. Outer clusters get more levels.
      const staggerLevels = depth >= 3 ? 8 : depth === 2 ? 6 : 4
      const staggerStep = depth >= 3 ? 60 : depth === 2 ? 50 : 40

      // Use the global index to guarantee adjacent angular nodes (regardless of parent)
      // will be placed on different radius levels
      const staggerOffset = depth > 0 ? (globalStaggerIndex % staggerLevels) * staggerStep : 0
      const radius = depth === 0 ? 0 : getBaseRadius(depth) + staggerOffset

      const angle = depth === 0 ? 0 : startAngle + (endAngle - startAngle) / 2
      const nodeObj = nodesMap.get(id)!

      calculatedNodes.push({
        ...nodeObj,
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
        angle,
        radius,
        depth,
      })

      const children = nodeChildren.get(id) || []
      if (children.length > 0) {
        const totalWeight = children.reduce((sum, cid) => sum + getWeight(cid), 0)
        let currentStartAngle = startAngle

        children.forEach((childId) => {
          const childWeight = getWeight(childId)
          const ratio = childWeight / totalWeight // Dynamic sizing!
          const arcSpread = (endAngle - startAngle) * ratio

          // Create larger gaps between major categories (depth 1) and smaller gaps for deeper nodes
          const padding = depth === 0 ? 0 : arcSpread * (depth === 1 ? 0.08 : 0.02)
          const childStart = currentStartAngle + padding
          const childEnd = currentStartAngle + arcSpread - padding

          calcNodeLayout(childId, childStart, childEnd, depth + 1)
          currentStartAngle += arcSpread // Advance the pointer
        })
      }
    }

    calcNodeLayout(focusId, 0, Math.PI * 2, 0)

    const calculatedLinks: LayoutLink[] = []
    // Iterate over ALL activeLinks in the graph to draw cross-connections
    activeLinks.forEach((link) => {
      const sourceNode = calculatedNodes.find((n) => n.id === link.source)
      const targetNode = calculatedNodes.find((n) => n.id === link.target)

      // Only draw the link if both nodes are currently expanded/visible on the board
      if (sourceNode && targetNode) {
        calculatedLinks.push({
          id: link.id,
          source: {
            x: sourceNode.x,
            y: sourceNode.y,
            category: sourceNode.category,
            id: sourceNode.id,
          },
          target: {
            x: targetNode.x,
            y: targetNode.y,
            category: targetNode.category,
            id: targetNode.id,
          },
        })
      }
    })

    return {
      layoutNodes: calculatedNodes,
      layoutLinks: calculatedLinks,
      maxDepth: maximumDepth,
    }
  }, [currentRoot, expandedIds, adjList, nodesMap, activeLinks])

  const forceGraphData = useMemo(() => {
    const nodeIds = new Set(layoutNodes.map((n) => n.id))
    return {
      nodes: layoutNodes,
      links: activeLinks
        .filter((link) => nodeIds.has(link.source) && nodeIds.has(link.target))
        .map((link) => ({
          ...link,
          source: link.source,
          target: link.target,
        })),
    }
  }, [layoutNodes, activeLinks])

  useEffect(() => {
    const fg = fgRef.current
    if (!fg) return

    // Remove default center force, let radial force do the centering
    fg.d3Force('center', null)

    // Set custom charge strength
    fg.d3Force('charge').strength(-250)

    // Add custom radial force centered at 0, 0
    fg.d3Force(
      'radial',
      d3.forceRadial((d: any) => getBaseRadius(d.depth || 0), 0, 0).strength(0.8),
    )

    // Add custom collision force
    fg.d3Force('collision', d3.forceCollide((d: any) => (d.depth === 0 ? 55 : 45)).iterations(2))

    // Warm up the simulation
    fg.d3ReheatSimulation()
  }, [forceGraphData])

  // Actions

  const handleViewChange = (mode: 'industry' | 'exec') => {
    setViewMode(mode)
    setExpandedIds(getInitialExpanded(mode, nodesMap))
    setPath([nodesMap.get('omnicom')!])
    if (fgRef.current) {
      fgRef.current.centerAt(0, 0, 300)
      fgRef.current.zoom(0.8, 300)
    }
  }

  const handleNodeClick = (node: MapNode) => {
    // If clicking current center, step back out
    if (node.id === currentRoot.id) {
      if (path.length > 1) {
        setPath((prev) => prev.slice(0, -1))
        if (fgRef.current) {
          fgRef.current.centerAt(0, 0, 300)
          fgRef.current.zoom(0.8, 300)
        }
      }
      return
    }

    // Auto-expand the node you click into to guarantee you see its connections
    setExpandedIds((prev) => new Set(prev).add(node.id))

    const rootNode = nodesMap.get('omnicom')!
    if (node.id === 'omnicom') setPath([rootNode])
    else setPath([rootNode, node])
    if (fgRef.current) {
      fgRef.current.centerAt(0, 0, 300)
      fgRef.current.zoom(0.8, 300)
    }
  }

  // Pan & Zoom

  const backgroundRings = Array.from({ length: maxDepth }, (_, i) => getBaseRadius(i + 1))

  // Layout visible stats for the sidebar
  const visibleExecs = layoutNodes.filter((n) => n.category === 'executive').length
  const visibleInds = layoutNodes.filter((n) => n.category === 'industry').length
  const visibleComps = layoutNodes.filter((n) => n.category === 'company').length
  const visiblePersons = layoutNodes.filter((n) => n.category === 'person').length

  const getResolvedNodeColor = (category: string) => {
    const raw = getColor(category)
    if (category === 'center') {
      return resolveCSSVar('--center-node', '#1e40af')
    }
    return raw
  }

  const getResolvedNodeStroke = (category: string) => {
    const raw = getStroke(category)
    if (category === 'center') {
      return resolveCSSVar('--center-node', '#1e40af')
    }
    return raw
  }

  // Trigger continuous rendering for the spinning dashed rings
  useEffect(() => {
    let animFrame: number
    const tick = () => {
      if (fgRef.current && typeof fgRef.current.refresh === 'function') {
        fgRef.current.refresh()
      }
      animFrame = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(animFrame)
  }, [])

  const handleRenderFramePre = (ctx: CanvasRenderingContext2D, globalScale: number) => {
    const borderCol = resolveCSSVar('--border', '#334155')
    ctx.save()
    ctx.strokeStyle = borderCol
    ctx.lineWidth = 1 / globalScale
    ctx.globalAlpha = 0.05
    ctx.setLineDash([4, 8])
    backgroundRings.forEach((r) => {
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, 2 * Math.PI)
      ctx.stroke()
    })
    ctx.restore()
  }

  const handleNodeCanvasObject = (node: any, ctx: CanvasRenderingContext2D) => {
    const category = node.category
    const isExpanded = expandedIds.has(node.id)
    const isExpandable = viewMode === 'industry' ? category !== 'executive' : category !== 'person'
    const isCenter = node.depth === 0
    const radius = isCenter ? 14 : 10

    let isNodeHighlighted = false
    const hasHover = hoveredNode !== null
    if (hasHover) {
      if (node.id === hoveredNode.id) {
        isNodeHighlighted = true
      } else {
        isNodeHighlighted = forceGraphData.links.some((link: any) => {
          const sId = typeof link.source === 'object' ? link.source.id : link.source
          const tId = typeof link.target === 'object' ? link.target.id : link.target
          return (sId === node.id && tId === hoveredNode.id) || (sId === hoveredNode.id && tId === node.id)
        })
      }
    }

    let isDimmed = false
    if (currentRoot.category === 'person') {
      isDimmed = node.category === 'person' && node.id !== currentRoot.id
    } else if (currentRoot.category === 'company') {
      isDimmed = node.category === 'person' && !edges.base.has(`${currentRoot.id}|${node.id}`)
    }

    if (hasHover && !isNodeHighlighted) {
      isDimmed = true
    }

    ctx.save()

    if (isDimmed) {
      ctx.globalAlpha = 0.2
    }

    if (isExpanded) {
      ctx.shadowColor = getResolvedNodeColor(category)
      ctx.shadowBlur = 8
    }

    ctx.beginPath()
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI)
    ctx.fillStyle = getResolvedNodeColor(category)
    ctx.fill()

    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0

    ctx.strokeStyle = hoveredNode === node ? '#ffffff' : getResolvedNodeStroke(category)
    ctx.lineWidth = 2
    ctx.stroke()

    if (isExpandable && !isExpanded) {
      ctx.beginPath()
      ctx.arc(node.x, node.y, radius + 5, 0, 2 * Math.PI)
      ctx.strokeStyle = getResolvedNodeColor(category)
      ctx.lineWidth = 1.5
      ctx.globalAlpha = isDimmed ? 0.1 : 0.5
      ctx.setLineDash([2, 2])
      ctx.lineDashOffset = -Date.now() / 200
      ctx.stroke()
      ctx.setLineDash([])
    }

    const label = node.label
    const isLeft = node.x < 0
    const foreCol = resolveCSSVar('--foreground', '#0f172a')
    const mutedCol = resolveCSSVar('--muted-foreground', '#475569')

    ctx.font = isCenter ? 'bold 13px Geist, sans-serif' : '500 11px Geist, sans-serif'
    ctx.fillStyle = foreCol
    ctx.textAlign = isCenter ? 'center' : isLeft ? 'right' : 'left'
    ctx.textBaseline = 'middle'

    const tx = node.x + (isCenter ? 0 : isLeft ? -16 : 16)
    const ty = node.y + (isCenter ? 32 : 0)

    ctx.fillText(label, tx, ty)

    if (node.subLabel) {
      ctx.font = '9px Geist, sans-serif'
      ctx.fillStyle = mutedCol
      ctx.fillText(node.subLabel, tx, ty + 14)
    }

    ctx.restore()
  }

  const handleLinkCanvasObject = (
    link: any,
    ctx: CanvasRenderingContext2D,
    globalScale: number,
  ) => {
    const source = link.source
    const target = link.target

    const sx = typeof source === 'object' ? source.x : 0
    const sy = typeof source === 'object' ? source.y : 0
    const tx = typeof target === 'object' ? target.x : 0
    const ty = typeof target === 'object' ? target.y : 0

    const targetCat = typeof target === 'object' ? target.category : 'default'
    const targetId = typeof target === 'object' ? target.id : target
    const sourceId = typeof source === 'object' ? source.id : source

    let isLinkHighlighted = false
    if (hoveredNode) {
      isLinkHighlighted = sourceId === hoveredNode.id || targetId === hoveredNode.id
    }

    let isLinkDimmed = false
    if (currentRoot.category === 'person') {
      isLinkDimmed =
        (typeof source === 'object' &&
          source.category === 'person' &&
          sourceId !== currentRoot.id) ||
        (typeof target === 'object' && target.category === 'person' && targetId !== currentRoot.id)
    } else if (currentRoot.category === 'company') {
      isLinkDimmed =
        (typeof source === 'object' &&
          source.category === 'person' &&
          !edges.base.has(`${currentRoot.id}|${sourceId}`)) ||
        (typeof target === 'object' &&
          target.category === 'person' &&
          !edges.base.has(`${currentRoot.id}|${targetId}`))
    }

    if (hoveredNode && !isLinkHighlighted) {
      isLinkDimmed = true
    }

    ctx.save()
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.lineTo(tx, ty)
    ctx.strokeStyle = getResolvedNodeColor(targetCat)
    ctx.lineWidth = 1 / globalScale
    ctx.globalAlpha = isLinkDimmed ? 0.05 : 0.25
    ctx.stroke()
    ctx.restore()
  }

  if (!currentRoot) return null

  const controls = (
    <>
      <div className="border-input bg-muted hidden items-center gap-1 rounded-xl border p-1 md:flex">
        <button
          onClick={() => handleViewChange('industry')}
          className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            viewMode === 'industry'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          Industry POV
        </button>
        <button
          onClick={() => handleViewChange('exec')}
          className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            viewMode === 'exec'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          Omnicom Leadership POV
        </button>
      </div>

      <div className="relative hidden md:block" ref={searchContainerRef}>
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setShowSearchDropdown(true)
          }}
          onFocus={() => setShowSearchDropdown(true)}
          placeholder="Search companies, contacts or industries"
          className="border-input bg-muted text-foreground placeholder:text-muted-foreground focus:border-ring focus:bg-muted w-80 rounded-xl border py-2 pr-3 pl-9 text-sm transition outline-none"
        />

        {showSearchDropdown && searchQuery.length >= 3 ? (
          <div className="border-input bg-card absolute top-full right-0 z-30 mt-2 w-80 overflow-hidden rounded-2xl border shadow-2xl">
            {searchResults.length > 0 ? (
              <ul className="max-h-80 overflow-y-auto">
                {searchResults.map((node) => (
                  <li
                    key={`search-${node.id}`}
                    onClick={() => {
                      handleNodeClick(node)
                      setShowSearchDropdown(false)
                      setSearchQuery('')
                    }}
                    className="border-border hover:bg-muted flex cursor-pointer flex-col gap-1 border-b px-4 py-3 transition-colors last:border-0"
                  >
                    <div className="text-foreground text-sm font-medium">{node.label}</div>
                    <div className="text-muted-foreground flex items-center gap-2 text-[10px]">
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full shadow-sm"
                        style={{ backgroundColor: getColor(node.category) }}
                      />
                      <span className="font-semibold tracking-wider uppercase">
                        {node.category}
                      </span>
                      {node.subLabel ? (
                        <span className="text-muted-foreground truncate">{node.subLabel}</span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-muted-foreground px-4 py-4 text-center text-sm">
                No matches found for <span className="text-foreground">{searchQuery}</span>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </>
  )

  const sidebar = (
    <div className="space-y-8">
      <section className="border-border bg-card rounded-3xl border p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-300">
            <Network className="h-5 w-5" />
          </div>
          <div>
            <div className="text-muted-foreground text-xs tracking-[0.35em] uppercase">Focus</div>
            <div className="text-foreground mt-1 text-lg font-semibold">{currentRoot.label}</div>
          </div>
        </div>
        <p className="text-muted-foreground mt-4 text-sm leading-6">
          Explore the relationship map by industry, executive, company, and contact.
        </p>
      </section>

      <section>
        <div className="text-muted-foreground mb-4 text-[10px] font-semibold tracking-[0.35em] uppercase">
          Network Snapshot
        </div>
        <ul className="space-y-3">
          <li className="border-border bg-card flex items-center justify-between rounded-2xl border px-4 py-3">
            <div className="text-foreground flex items-center gap-3 text-sm">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Omnicom Leadership
            </div>
            <div className="text-right">
              <div className="text-foreground text-sm font-semibold">{focusStats.executive}</div>
              <div className="text-muted-foreground text-[10px]">{visibleExecs} rendered</div>
            </div>
          </li>
          <li className="border-border bg-card flex items-center justify-between rounded-2xl border px-4 py-3">
            <div className="text-foreground flex items-center gap-3 text-sm">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Industries
            </div>
            <div className="text-right">
              <div className="text-foreground text-sm font-semibold">{focusStats.industry}</div>
              <div className="text-muted-foreground text-[10px]">{visibleInds} rendered</div>
            </div>
          </li>
          <li className="border-border bg-card flex items-center justify-between rounded-2xl border px-4 py-3">
            <div className="text-foreground flex items-center gap-3 text-sm">
              <span className="h-2 w-2 rounded-full bg-purple-500" />
              Companies
            </div>
            <div className="text-right">
              <div className="text-foreground text-sm font-semibold">{focusStats.company}</div>
              <div className="text-muted-foreground text-[10px]">{visibleComps} rendered</div>
            </div>
          </li>
          <li className="border-border bg-card flex items-center justify-between rounded-2xl border px-4 py-3">
            <div className="text-foreground flex items-center gap-3 text-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Contacts
            </div>
            <div className="text-right">
              <div className="text-foreground text-sm font-semibold">{focusStats.person}</div>
              <div className="text-muted-foreground text-[10px]">{visiblePersons} rendered</div>
            </div>
          </li>
        </ul>
      </section>
    </div>
  )

  return (
    <ExplorerShell
      pageTitle="Contact Explorer"
      pageSubtitle="Relationship map using the same navigation frame as the Budget Explorer."
      controls={controls}
      sidebar={sidebar}
      breadcrumb={
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground font-semibold tracking-[0.35em] uppercase">
            Focus
          </span>
          {path.map((p, i) => (
            <React.Fragment key={p.id}>
              {i > 0 ? <span className="text-muted-foreground">/</span> : null}
              <button
                onClick={() => {
                  setPath((prev) => prev.slice(0, i + 1))
                  if (fgRef.current) {
                    fgRef.current.centerAt(0, 0, 300)
                    fgRef.current.zoom(0.8, 300)
                  }
                }}
                className="text-foreground hover:text-foreground font-medium transition"
              >
                {p.label}
              </button>
            </React.Fragment>
          ))}
        </div>
      }
    >
      <div ref={containerRef} className="bg-background relative h-full w-full overflow-hidden">
        <div className="border-input absolute top-6 right-6 z-20 flex flex-col gap-2 rounded-2xl border bg-(--card)/90 p-1">
          <button
            onClick={() => {
              if (fgRef.current) fgRef.current.zoom(fgRef.current.zoom() * 1.2, 300)
            }}
            className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-xl p-2 transition"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              if (fgRef.current) fgRef.current.zoom(fgRef.current.zoom() * 0.8, 300)
            }}
            className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-xl p-2 transition"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              if (fgRef.current) {
                fgRef.current.centerAt(0, 0, 300)
                fgRef.current.zoom(0.8, 300)
              }
            }}
            className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-xl p-2 transition"
          >
            <Maximize className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="bg-background/60 absolute inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
            <Loader2 className="text-primary h-10 w-10 animate-spin" />
            <p className="text-muted-foreground mt-4 animate-pulse text-sm font-medium">
              Mapping your network...
            </p>
          </div>
        ) : error ? (
          <div className="bg-background/60 absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm">
            <div className="bg-destructive/10 text-destructive mb-4 rounded-2xl p-4">
              <Network className="h-8 w-8 opacity-50" />
            </div>
            <h3 className="text-foreground mb-2 text-lg font-semibold">Connection Failed</h3>
            <p className="text-muted-foreground mb-6 max-w-xs text-sm">{error.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6 py-2 text-sm font-semibold transition"
            >
              Try Again
            </button>
          </div>
        ) : null}

        <ForceGraph2D
          ref={fgRef}
          width={viewportSize.width}
          height={viewportSize.height}
          graphData={forceGraphData}
          nodeLabel="label"
          nodeCanvasObject={handleNodeCanvasObject}
          nodeCanvasObjectMode={() => 'replace'}
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
          linkCanvasObject={handleLinkCanvasObject}
          linkCanvasObjectMode={() => 'replace'}
          onRenderFramePre={handleRenderFramePre}
          onNodeClick={(node) => {
            handleNodeClick(node as any)
          }}
          onNodeRightClick={(node) => {
            const category = (node as any).category
            const nodeId = node.id as string
            const isExpandable = viewMode === 'industry' ? category !== 'executive' : category !== 'person'
            if (isExpandable && nodeId) {
              setExpandedIds((prev) => {
                const next = new Set(prev)
                if (next.has(nodeId)) next.delete(nodeId)
                else next.add(nodeId)
                return next
              })
              if (fgRef.current) {
                fgRef.current.d3ReheatSimulation()
              }
            }
          }}
          onNodeHover={(node) => {
            setHoveredNode(node || null)
          }}
        />
      </div>
    </ExplorerShell>
  )
}
