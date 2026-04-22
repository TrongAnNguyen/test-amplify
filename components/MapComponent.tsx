'use client';

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, Menu, ZoomIn, ZoomOut, Maximize, Upload } from "lucide-react";

// --- CONFIGURATION ---
const RING_RADIUS = 220; // Perfect distance for proportional spacing

// --- DEFAULT DATA (Based on your CSV Snippet) ---
const DEFAULT_CSV = `"Primary Contact","Category","Company / Brand","Client Name","Client Title"
"Lee Leggett","Retail & Marketplaces","7-Eleven","Fiona Hayes","CEO"
"Lee Leggett","Retail & Marketplaces","7-Eleven","Matt Keogh","Chief Commercial Officer"
"Lee Leggett","Retail & Marketplaces","7-Eleven","Adam Jacka","CMO"
"Lee Leggett","Retail & Marketplaces","Style Runner","Anna Brennan","General Manager"
"Lee Leggett","Retail & Marketplaces","Rachel Gilbert","Rachel Gilbert","Founder"
"Lee Leggett","Retail & Marketplaces","Bunnings","Justine Mills","CMO"
"Lee Leggett","Retail & Marketplaces","Bunnings","Sarah Horder","Marketing Lead"
"Lee Leggett","Retail & Marketplaces","Christian Dior","Liesel Petersen","Development Manager"
"Lee Leggett","Retail & Marketplaces","Coles","Kate Bailey","General Manager Brand, Digital & Media"
"Lee Leggett","Retail & Marketplaces","Iconic","Georgia Thomas","Director of Brand Growth & Content"
"Lee Leggett","Retail & Marketplaces","Kmart & Target","Rennie Freer","CMO"
"Lee Leggett","FMCG, Food & Beverage","Arnotts","Jenni Dill","CMO"
"Lee Leggett","FMCG, Food & Beverage","Asahi","Lauren Fildes","General Manager Brand and Portfolio"
"Lee Leggett","FMCG, Food & Beverage","Guzman y Gomez","Lara Thom","Global CMO"
"Lee Leggett","FMCG, Food & Beverage","Guzman y Gomez","Naomi Higgins","Director of Operational Excellence"
"Lee Leggett","FMCG, Food & Beverage","Harris Farm","Angus Harris","Co-CEO"
"Lee Leggett","FMCG, Food & Beverage","KFC","Joanna Baxter","Group Marketing Manager - Retail"
"Lee Leggett","FMCG, Food & Beverage","McDonalds","Annabel Fribrence","CMO"
"Lee Leggett","Media","ABC","Milla McPhee","Director of Audiences"
"Lee Leggett","Media","Channel 9","Clive Bingwah","MD WA"
"Lee Leggett","Media","Guardian AU","Danika Johnson","Director of Commercial Partnerships"
"Lee Leggett","Media","Hoyts Group","Damian Keogh","President & CEO"
"Lee Leggett","Media","ITV Australia","Beth Hart","Chief Content Officer"
"Lee Leggett","Media","NewsCorp","Michael Miller","Chairman"
"Lee Leggett","Media","NewsCorp","Bettina Brown","Director, Consumer Marketing"
"Lee Leggett","Media","NewsCorp","Diana Kay","GM, Events & Experiences"
"Lee Leggett","Media","NewsCorp","Penny Fowler","Chairman Herald & Weekly Times"
"Lee Leggett","Media","Netflix","Rebecca Nadilo","Director, Marketing Partnerships"
"Lee Leggett","Industry","Marketing Academy","Sherilyn Shackell","Founder & CEO"
"Lee Leggett","Industry","System 1","Jon Evans","Chief Customer Officer"
"Lee Leggett","Industry","AANA","Josh Faulks","CEO"`;

// --- SUPPLEMENTAL DATA FOR MIKE NAPOLITANO ---
const MIKE_SUPPLEMENT = [
  ["Mike Napolitano", "FMCG, Food & Beverage", "McDonalds", "Annabel Fribrence", "CMO"],
  ["Mike Napolitano", "Technology", "Canva", "Zach Kitschke", "CMO"],
  ["Mike Napolitano", "Technology", "Atlassian", "Robert Chatwani", "CMO"]
];

// --- CUSTOM CSV PARSER ---
const parseCSV = (str: string) => {
  const result: string[][] = [];
  let row: string[] = [], col = "", inQuotes = false;
  for (let i = 0; i < str.length; i++) {
    let char = str[i];
    if (inQuotes) {
      if (char === '"') {
        if (str[i + 1] === '"') { col += '"'; i++; } 
        else { inQuotes = false; }
      } else { col += char; }
    } else {
      if (char === '"') { inQuotes = true; } 
      else if (char === ',') { row.push(col.trim()); col = ""; } 
      else if (char === '\n') { row.push(col.trim()); result.push(row); row = []; col = ""; } 
      else if (char !== '\r') { col += char; }
    }
  }
  if (col !== "" || row.length > 0) { row.push(col.trim()); result.push(row); }
  return result.filter(r => r.some(c => c !== ''));
};

const safeId = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '_');

interface MapNode {
  id: string;
  label: string;
  category: string;
  subLabel?: string;
}

interface LayoutNode extends MapNode {
  x: number;
  y: number;
  angle: number;
  radius: number;
  depth: number;
}

export default function MapComponent() {
  const [csvString, setCsvString] = useState(DEFAULT_CSV);
  const [viewMode, setViewMode] = useState<'industry' | 'exec'>('industry'); // 'industry' or 'exec'
  
  // SVG Pan/Zoom state
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 0.8 }); // Start slightly zoomed out
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Styling helpers
  const getColor = (c: string) => (({ 'center': '#fff', 'executive': '#f59e0b', 'industry': '#3b82f6', 'company': '#8b5cf6', 'person': '#10b981' } as Record<string, string>)[c] || '#6b7280');
  const getStroke = (c: string) => (({ 'center': '#fff', 'executive': '#b45309', 'industry': '#1e3a8a', 'company': '#4c1d95', 'person': '#064e3b' } as Record<string, string>)[c] || '#374151');

  // 1. Process CSV string into Nodes and Relationship Edges
  const { nodesMap, edges, execNodes, indNodes, combinedRows } = useMemo(() => {
    const rawArray = parseCSV(csvString);
    const dataRows = rawArray.slice(1);
    const allRows = [...dataRows, ...MIKE_SUPPLEMENT]; 
    
    // Safely filter out any empty or malformed rows from the CSV
    const validRows = allRows.filter(r => r.length >= 4 && r[0] && r[1] && r[2] && r[3]);

    const nodes = new Map<string, MapNode>();
    nodes.set('omnicom', { id: 'omnicom', label: 'Omnicom Oceania', category: 'center' });

    const rels = { base: new Set<string>(), execInd: new Set<string>(), indComp: new Set<string>(), compExec: new Set<string>(), personExec: new Set<string>() };
    const execs: MapNode[] = [], inds: MapNode[] = [];

    validRows.forEach(row => {
      const exec = row[0], ind = row[1], comp = row[2], person = row[3], role = row[4] || '';

      const execId = `exec_${safeId(exec)}`;
      const indId = `ind_${safeId(ind)}`;
      const compId = `comp_${safeId(comp)}`;
      const personId = `p_${safeId(person)}`;

      if (!nodes.has(execId)) { const n = { id: execId, label: exec, category: 'executive' }; nodes.set(execId, n); execs.push(n); }
      if (!nodes.has(indId)) { const n = { id: indId, label: ind, category: 'industry' }; nodes.set(indId, n); inds.push(n); }
      if (!nodes.has(compId)) nodes.set(compId, { id: compId, label: comp, category: 'company' });
      
      // Append company name to the contact's title
      if (!nodes.has(personId)) nodes.set(personId, { id: personId, label: person, subLabel: role ? `${role}, ${comp}` : comp, category: 'person' });

      rels.execInd.add(`${execId}|${indId}`);
      rels.indComp.add(`${indId}|${compId}`);
      rels.compExec.add(`${compId}|${execId}`); // Top-down for Exec View
      rels.personExec.add(`${personId}|${execId}`); // Bottom-up Contact -> Exec mapping for Industry View
      rels.base.add(`${compId}|${personId}`);
    });

    return { nodesMap: nodes, edges: rels, execNodes: execs, indNodes: inds, combinedRows: validRows };
  }, [csvString]);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [path, setPath] = useState<MapNode[]>([]);
  
  // Search logic
  const searchResults = useMemo(() => {
    if (searchQuery.length < 3) return [];
    const query = searchQuery.toLowerCase();
    
    return Array.from(nodesMap.values())
      .filter(node => {
        if (node.category === 'center') return false;
        const matchLabel = node.label.toLowerCase().includes(query);
        const matchSub = node.subLabel ? node.subLabel.toLowerCase().includes(query) : false;
        return matchLabel || matchSub;
      })
      .slice(0, 12); // Limit to top 12 results
  }, [searchQuery, nodesMap]);

  // Handle click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to smartly expand nodes based on view mode to avoid clutter
  const getInitialExpanded = (mode: string, map: Map<string, MapNode>) => {
    const ids = new Set<string>();
    map.forEach(n => {
      if (mode === 'industry' && n.category === 'person') return; // Hide Execs by collapsing contacts
      ids.add(n.id);
    });
    return ids;
  };

  useEffect(() => {
    setExpandedIds(getInitialExpanded(viewMode, nodesMap));
    setPath([nodesMap.get('omnicom')!]);
    setTransform({ x: 0, y: 0, k: 0.8 });
  }, [nodesMap, viewMode]);

  const currentRoot = path[path.length - 1] || nodesMap.get('omnicom');

  // --- CALCULATE TRUE DATA PORTFOLIO FOR FOCUS NODE ---
  const focusStats = useMemo(() => {
    let matchingRows: string[][] = [];
    
    // If we are at the center, we count everything
    if (!currentRoot || currentRoot.id === 'omnicom') {
      matchingRows = combinedRows;
    } else {
      // Filter raw dataset based on exactly what is clicked
      matchingRows = combinedRows.filter(row => {
        if (currentRoot.category === 'executive') return row[0] === currentRoot.label;
        if (currentRoot.category === 'industry') return row[1] === currentRoot.label;
        if (currentRoot.category === 'company') return row[2] === currentRoot.label;
        if (currentRoot.category === 'person') return row[3] === currentRoot.label;
        return false;
      });
    }

    const execs = new Set();
    const inds = new Set();
    const comps = new Set();
    const persons = new Set();

    // Count unique connections within the matched dataset
    matchingRows.forEach(r => {
      execs.add(safeId(r[0]));
      inds.add(safeId(r[1]));
      comps.add(safeId(r[2]));
      persons.add(safeId(r[3]));
    });

    return {
      executive: execs.size,
      industry: inds.size,
      company: comps.size,
      person: persons.size
    };
  }, [currentRoot, combinedRows]);

  // 2. Generate active links based on View Mode
  const activeLinks = useMemo(() => {
    const links: { source: string; target: string; id: string }[] = [];
    edges.base.forEach(e => { const [s, t] = e.split('|'); links.push({ source: s, target: t, id: e }); });

    if (viewMode === 'exec') {
      // 1. Omnicom -> Execs
      execNodes.forEach(n => links.push({ source: 'omnicom', target: n.id, id: `omn|${n.id}` }));
      
      // 2. Execs -> Companies (Bypassing Industries entirely)
      edges.compExec.forEach(e => { const [s, t] = e.split('|'); links.push({ source: s, target: t, id: `ce|${s}|${t}` }); }); 
      
      // 3. Dynamic Loop-back: If a contact (person) is clicked, reveal their direct connection back to the Execs
      if (currentRoot && currentRoot.category === 'person') {
        edges.personExec.forEach(e => { const [s, t] = e.split('|'); links.push({ source: s, target: t, id: `pe|${s}|${t}` }); });
      }
    } else {
      indNodes.forEach(n => links.push({ source: 'omnicom', target: n.id, id: `omn|${n.id}` }));
      edges.indComp.forEach(e => { const [s, t] = e.split('|'); links.push({ source: s, target: t, id: e }); });
      // Map Executives directly to Contacts instead of Companies
      edges.personExec.forEach(e => { const [s, t] = e.split('|'); links.push({ source: s, target: t, id: e }); });
    }
    return links;
  }, [viewMode, edges, execNodes, indNodes, currentRoot]);

  // 3. Build Adjacency List for fast graph traversal
  const adjList = useMemo(() => {
    const list = new Map<string, string[]>();
    activeLinks.forEach(link => {
      if (!list.has(link.source)) list.set(link.source, []);
      if (!list.has(link.target)) list.set(link.target, []);
      list.get(link.source)!.push(link.target);
      list.get(link.target)!.push(link.source);
    });
    return list;
  }, [activeLinks]);

  // 4. Core Layout Engine: Breadth-First Search Radial Layout with Proportional Weight Spacing
  const { layoutNodes, layoutLinks, maxDepth } = useMemo(() => {
    if (!currentRoot) return { layoutNodes: [], layoutLinks: [], maxDepth: 0 };
    
    const focusId = currentRoot.id;
    const visited = new Set([focusId]);
    const queue = [{ id: focusId, depth: 0 }];
    const treeLinks: { source: string; target: string; id: string }[] = [];
    const nodeChildren = new Map<string, string[]>();

    // Pass 1: Build the BFS Tree
    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      if (!expandedIds.has(id)) continue;

      const neighbors = adjList.get(id) || [];
      neighbors.forEach(neighborId => {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push({ id: neighborId, depth: depth + 1 });
          if (!nodeChildren.has(id)) nodeChildren.set(id, []);
          nodeChildren.get(id)!.push(neighborId);
          treeLinks.push({ source: id, target: neighborId, id: `${id}-${neighborId}` });
        }
      });
    }

    // Pass 2: Calculate the "weight" of every node to ensure perfectly even spacing
    const getWeight = (id: string): number => {
      if (!expandedIds.has(id)) return 1;
      const children = nodeChildren.get(id) || [];
      if (children.length === 0) return 1;
      return children.reduce((sum, childId) => sum + getWeight(childId), 0);
    };

    const calculatedNodes: LayoutNode[] = [];
    let maximumDepth = 0;

    // Pass 3: Calculate Layout using the proportional weights
    const calcNodeLayout = (id: string, startAngle: number, endAngle: number, depth: number) => {
      maximumDepth = Math.max(maximumDepth, depth);
      const radius = depth * RING_RADIUS;
      const angle = depth === 0 ? 0 : startAngle + (endAngle - startAngle) / 2;
      const nodeObj = nodesMap.get(id)!;

      calculatedNodes.push({ ...nodeObj, x: radius * Math.cos(angle), y: radius * Math.sin(angle), angle, radius, depth });

      const children = nodeChildren.get(id) || [];
      if (children.length > 0) {
        const totalWeight = children.reduce((sum, cid) => sum + getWeight(cid), 0);
        let currentStartAngle = startAngle;
        
        children.forEach((childId) => {
          const childWeight = getWeight(childId);
          const ratio = childWeight / totalWeight; // Dynamic sizing!
          const arcSpread = (endAngle - startAngle) * ratio;
          
          // Create larger gaps between major categories (depth 1) and smaller gaps for deeper nodes
          const padding = depth === 0 ? 0 : (arcSpread * (depth === 1 ? 0.08 : 0.02)); 
          const childStart = currentStartAngle + padding;
          const childEnd = currentStartAngle + arcSpread - padding;
          
          calcNodeLayout(childId, childStart, childEnd, depth + 1);
          currentStartAngle += arcSpread; // Advance the pointer
        });
      }
    };

    calcNodeLayout(focusId, 0, Math.PI * 2, 0);

    const calculatedLinks: any[] = [];
    // Iterate over ALL activeLinks in the graph to draw cross-connections
    activeLinks.forEach(link => {
      const sourceNode = calculatedNodes.find(n => n.id === link.source);
      const targetNode = calculatedNodes.find(n => n.id === link.target);
      
      // Only draw the link if both nodes are currently expanded/visible on the board
      if (sourceNode && targetNode) {
         calculatedLinks.push({
           id: link.id,
           source: { x: sourceNode.x, y: sourceNode.y, category: sourceNode.category, id: sourceNode.id },
           target: { x: targetNode.x, y: targetNode.y, category: targetNode.category, id: targetNode.id }
         });
      }
    });

    return { layoutNodes: calculatedNodes, layoutLinks: calculatedLinks, maxDepth: maximumDepth };
  }, [currentRoot, expandedIds, adjList, nodesMap, activeLinks]);


  // Actions
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setCsvString(event.target?.result as string);
    reader.readAsText(file);
  };

  const handleViewChange = (mode: 'industry' | 'exec') => {
    setViewMode(mode);
    setExpandedIds(getInitialExpanded(mode, nodesMap));
    setPath([nodesMap.get('omnicom')!]);
    setTransform({ x: 0, y: 0, k: 0.8 });
  };

  const handleNodeClick = (node: MapNode) => {
    // If clicking current center, step back out
    if (node.id === currentRoot.id) {
      if (path.length > 1) {
        setPath(prev => prev.slice(0, -1));
        setTransform({ x: 0, y: 0, k: 1 });
      }
      return;
    }
    
    // Auto-expand the node you click into to guarantee you see its connections
    setExpandedIds(prev => new Set(prev).add(node.id));

    const rootNode = nodesMap.get('omnicom')!;
    if (node.id === 'omnicom') setPath([rootNode]);
    else setPath([rootNode, node]);
    setTransform({ x: 0, y: 0, k: 1 });
  };

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Pan & Zoom
  const handleWheel = (e: React.WheelEvent) => {
    const scaleAdjust = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(p => ({ ...p, k: Math.max(0.1, Math.min(3, p.k * scaleAdjust)) }));
  };
  const handleMouseDown = (e: React.MouseEvent) => { setIsDragging(true); setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y }); };
  const handleMouseMove = (e: React.MouseEvent) => { if (isDragging) setTransform(p => ({ ...p, x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })); };
  const handleMouseUp = () => setIsDragging(false);

  const backgroundRings = Array.from({ length: maxDepth }, (_, i) => (i + 1) * RING_RADIUS);

  // Layout visible stats for the sidebar
  const visibleExecs = layoutNodes.filter(n=>n.category==='executive').length;
  const visibleInds = layoutNodes.filter(n=>n.category==='industry').length;
  const visibleComps = layoutNodes.filter(n=>n.category==='company').length;
  const visiblePersons = layoutNodes.filter(n=>n.category==='person').length;

  if (!currentRoot) return null;

  return (
    <div className="w-full h-screen bg-slate-950 text-slate-300 font-sans overflow-hidden flex flex-col selection:bg-blue-500/30">
      
      {/* HEADER NAV */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 z-50 relative bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center gap-4 w-64">
          <Menu className="w-5 h-5 text-slate-400 cursor-pointer hover:text-white" />
          <h1 className="font-bold tracking-widest text-sm text-white">OMNICOM <span className="text-slate-500 font-normal">OCEANIA</span></h1>
        </div>
        
        {/* VIEW TOGGLE & FILE UPLOAD */}
        <div className="hidden md:flex items-center gap-3">
          <div className="bg-slate-900 border border-white/10 rounded-lg p-1">
            <button 
              onClick={() => handleViewChange('industry')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === 'industry' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
            >
              Industry POV
            </button>
            <button 
              onClick={() => handleViewChange('exec')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === 'exec' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
            >
              Executive POV
            </button>
          </div>
          
          <label className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white cursor-pointer transition-all">
            <Upload className="w-3.5 h-3.5" />
            Upload CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>

        {/* SEARCH BAR */}
        <div className="flex-1 max-w-sm relative hidden lg:block ml-8" ref={searchContainerRef}>
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={() => setShowSearchDropdown(true)}
            placeholder="Search companies, contacts, industries..." 
            className="w-full bg-white/5 border border-white/10 rounded px-10 py-1.5 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-white placeholder-slate-500"
          />
          
          {/* SEARCH DROPDOWN */}
          {showSearchDropdown && searchQuery.length >= 3 && (
            <div className="absolute top-full mt-2 left-0 w-full bg-slate-900 border border-white/10 rounded-md shadow-2xl z-50 overflow-hidden">
              {searchResults.length > 0 ? (
                <ul className="max-h-80 overflow-y-auto">
                  {searchResults.map(node => (
                    <li 
                      key={`search-${node.id}`}
                      onClick={() => {
                        handleNodeClick(node);
                        setShowSearchDropdown(false);
                        setSearchQuery('');
                      }}
                      className="px-4 py-3 hover:bg-slate-800 cursor-pointer border-b border-white/5 last:border-0 transition-colors flex flex-col gap-1"
                    >
                      <div className="text-sm font-medium text-white">{node.label}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full inline-block shadow-sm" style={{ backgroundColor: getColor(node.category) }}></span>
                        <span className="uppercase tracking-wider font-semibold">{node.category}</span>
                        {node.subLabel && <span className="text-slate-500">• {node.subLabel}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-4 text-sm text-slate-400 text-center">
                  No matches found for "<span className="text-white">{searchQuery}</span>"
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* BREADCRUMB */}
      <div className="flex items-center gap-2 px-6 py-2 bg-slate-900 border-b border-white/5 text-xs z-40 relative w-full shadow-md">
        <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Focus:</span>
        {path.map((p, i) => (
          <React.Fragment key={p.id}>
            <button onClick={() => { setPath(prev => prev.slice(0, i + 1)); setTransform({ x: 0, y: 0, k: 1 }); }} className="text-slate-300 hover:text-white font-medium transition-colors">
              {p.label}
            </button>
            {i < path.length - 1 && <span className="text-slate-600">/</span>}
          </React.Fragment>
        ))}
      </div>

      <div className="flex-1 relative flex">
        {/* LEFT SIDEBAR STATS */}
        <div className="w-64 border-r border-white/5 p-6 z-10 bg-slate-950/50 backdrop-blur-sm hidden lg:block">
          <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-6 font-semibold">Network Overview</h2>
          <ul className="space-y-4">
            <li className="flex items-center justify-between group">
              <div className="flex items-center gap-3 text-sm text-slate-300"><span className="w-2 h-2 rounded-full bg-amber-500"></span>Executives</div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-mono text-white">{focusStats.executive}</span>
                <span className="text-[9px] font-mono text-slate-500">{visibleExecs} Rendered</span>
              </div>
            </li>
            <li className="flex items-center justify-between group">
              <div className="flex items-center gap-3 text-sm text-slate-300"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Industries</div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-mono text-white">{focusStats.industry}</span>
                <span className="text-[9px] font-mono text-slate-500">{visibleInds} Rendered</span>
              </div>
            </li>
            <li className="flex items-center justify-between group">
              <div className="flex items-center gap-3 text-sm text-slate-300"><span className="w-2 h-2 rounded-full bg-purple-500"></span>Companies</div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-mono text-white">{focusStats.company}</span>
                <span className="text-[9px] font-mono text-slate-500">{visibleComps} Rendered</span>
              </div>
            </li>
            <li className="flex items-center justify-between group">
              <div className="flex items-center gap-3 text-sm text-slate-300"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Contacts</div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-mono text-white">{focusStats.person}</span>
                <span className="text-[9px] font-mono text-slate-500">{visiblePersons} Rendered</span>
              </div>
            </li>
          </ul>
        </div>

        {/* MAIN CANVAS */}
        <div 
          className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing relative"
          onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
        >
          {/* Zoom Controls */}
          <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2 bg-slate-900 border border-white/10 rounded-lg p-1">
            <button onClick={() => setTransform(p => ({...p, k: p.k * 1.2}))} className="p-2 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"><ZoomIn className="w-4 h-4" /></button>
            <button onClick={() => setTransform(p => ({...p, k: p.k * 0.8}))} className="p-2 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"><ZoomOut className="w-4 h-4" /></button>
            <button onClick={() => setTransform({x: 0, y: 0, k: 1})} className="p-2 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"><Maximize className="w-4 h-4" /></button>
          </div>

          <svg className="w-full h-full block" ref={svgRef}>
            <g transform={`translate(${transform.x + (svgRef.current?.clientWidth || 800) / 2}, ${transform.y + (svgRef.current?.clientHeight || 800) / 2}) scale(${transform.k})`}>
              {backgroundRings.map(r => <circle key={`ring-${r}`} r={r} fill="none" stroke="#ffffff" strokeOpacity="0.03" strokeWidth="1" strokeDasharray="4 8" />)}

              {layoutLinks.map((link: any) => {
                // DIM OUT IRRELEVANT CONTACT LINKS WHEN FOCUSING ON A CONTACT OR COMPANY
                let isLinkDimmed = false;
                if (currentRoot.category === 'person') {
                  isLinkDimmed = (link.source.category === 'person' && link.source.id !== currentRoot.id) || 
                                 (link.target.category === 'person' && link.target.id !== currentRoot.id);
                } else if (currentRoot.category === 'company') {
                  isLinkDimmed = (link.source.category === 'person' && !edges.base.has(`${currentRoot.id}|${link.source.id}`)) ||
                                 (link.target.category === 'person' && !edges.base.has(`${currentRoot.id}|${link.target.id}`));
                }

                return (
                  <line 
                    key={link.id} 
                    x1={link.source.x} y1={link.source.y} 
                    x2={link.target.x} y2={link.target.y} 
                    stroke={getColor(link.target.category)} 
                    strokeOpacity={isLinkDimmed ? 0.15 : 0.4} 
                    strokeWidth={1} 
                    className="transition-all duration-500 ease-out" 
                  />
                );
              })}

              {layoutNodes.map((node) => {
                const isExpandable = viewMode === 'industry' ? node.category !== 'executive' : node.category !== 'person';
                const isExpanded = expandedIds.has(node.id);
                const isLeft = Math.cos(node.angle) < 0;
                
                // SMART FADE FOR NON-FOCUS CONTACTS
                let isDimmed = false;
                if (currentRoot.category === 'person') {
                  isDimmed = node.category === 'person' && node.id !== currentRoot.id;
                } else if (currentRoot.category === 'company') {
                  isDimmed = node.category === 'person' && !edges.base.has(`${currentRoot.id}|${node.id}`);
                }

                // STRICT LEFT/RIGHT ANCHORING
                let anchor: "start" | "end" | "middle" = isLeft ? 'end' : 'start';
                let tx = isLeft ? -16 : 16;
                let ty = 4;
                let subTy = 18;

                // Center the root node
                if (node.depth === 0) {
                  anchor = 'middle'; 
                  tx = 0; 
                  ty = 32; 
                  subTy = 48;
                }
                
                return (
                  <g key={node.id} transform={`translate(${node.x}, ${node.y})`} 
                    className={`transition-all duration-500 ease-out group cursor-pointer ${isDimmed ? 'opacity-20 hover:opacity-100' : 'opacity-100'}`}
                    onClick={(e) => { e.stopPropagation(); handleNodeClick(node); }}
                    onContextMenu={(e) => { 
                      if (isExpandable) toggleExpand(e, node.id); 
                      else e.preventDefault(); 
                    }}
                  >
                    <circle r={24} fill="transparent" />
                    <circle r={node.depth === 0 ? 14 : 10} fill={getColor(node.category)} stroke={getStroke(node.category)} strokeWidth={2}
                      className="transition-all duration-200 group-hover:stroke-white" style={{ filter: isExpanded ? `drop-shadow(0 0 8px ${getColor(node.category)}80)` : 'none' }} />
                    
                    {isExpandable && !isExpanded && <circle r={15} fill="none" stroke={getColor(node.category)} strokeWidth={1.5} strokeOpacity={0.5} strokeDasharray="2 2" className="animate-[spin_4s_linear_infinite]" />}

                    {/* Standard Horizontal Label */}
                    <text 
                      x={tx} 
                      y={ty} 
                      textAnchor={anchor}
                      fill={node.depth === 0 ? '#fff' : '#cbd5e1'} 
                      className={`text-[11px] select-none transition-colors group-hover:text-white ${node.depth === 0 ? 'font-bold tracking-widest text-sm' : 'font-medium'}`}
                    >
                      {node.label}
                    </text>
                    
                    {node.subLabel && (
                      <text 
                        x={tx} 
                        y={subTy} 
                        textAnchor={anchor} 
                        fill="#64748b" 
                        className={`text-[9px] select-none transition-colors group-hover:text-slate-300 ${node.depth === 0 ? 'tracking-wide' : ''}`}
                      >
                        {node.subLabel}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
