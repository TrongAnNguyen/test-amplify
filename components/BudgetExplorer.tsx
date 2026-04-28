"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CircleDollarSign,
  Maximize,
  Search,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import ExplorerShell from "@/components/ExplorerShell";

type BudgetRow = {
  category: string;
  company: string;
  budgetName: string;
  amount: number;
  omnicom: boolean;
};

type ViewMode = "client" | "category";
type InteractionMode = "hand" | "zoom";

type NodeLevel = "root" | "category" | "client" | "budget";

type ExplorerNode = {
  id: string;
  label: string;
  amount: number;
  level: NodeLevel;
  category?: string;
  colourIndex?: number;
  omnicomAmount?: number;
  children?: ExplorerNode[];
};

type PackedCircle = ExplorerNode & {
  x: number;
  y: number;
  r: number;
};

type BudgetCallout = {
  circle: PackedCircle;
  side: "left" | "right";
  startX: number;
  startY: number;
  elbowX: number;
  labelX: number;
  labelY: number;
};

type BubblePalette = {
  fill: string;
  fillInner: string;
  stroke: string;
  ring: string;
  label: string;
  meta: string;
};

const BUDGET_DATA: BudgetRow[] = [
  {
    category: "FMCG, Food & Beverage",
    company: "McDonalds",
    budgetName: "OMD retainer",
    amount: 12000000,
    omnicom: true,
  },
  {
    category: "FMCG, Food & Beverage",
    company: "McDonalds",
    budgetName: "Media billings",
    amount: 150000000,
    omnicom: false,
  },
  {
    category: "FMCG, Food & Beverage",
    company: "McDonalds",
    budgetName: "AFL Code rights",
    amount: 7500000,
    omnicom: false,
  },
  {
    category: "FMCG, Food & Beverage",
    company: "McDonalds",
    budgetName: "Coates Group Digital Signage",
    amount: 5000000,
    omnicom: true,
  },
  {
    category: "FMCG, Food & Beverage",
    company: "McDonalds",
    budgetName: "LSM",
    amount: 4600000,
    omnicom: true,
  },
  {
    category: "FMCG, Food & Beverage",
    company: "McDonalds",
    budgetName: "Unknown",
    amount: 8920000,
    omnicom: false,
  },
  {
    category: "FMCG, Food & Beverage",
    company: "McDonalds",
    budgetName: "Production licensing fees",
    amount: 1500000,
    omnicom: true,
  },
  {
    category: "FMCG, Food & Beverage",
    company: "McDonalds",
    budgetName: "Creator",
    amount: 2500000,
    omnicom: false,
  },
  {
    category: "FMCG, Food & Beverage",
    company: "McDonalds",
    budgetName: "Local digital marketing",
    amount: 3080000,
    omnicom: true,
  },
  {
    category: "FMCG, Food & Beverage",
    company: "McDonalds",
    budgetName: "Akcelo retainer",
    amount: 23000000,
    omnicom: false,
  },
  {
    category: "FMCG, Food & Beverage",
    company: "McDonalds",
    budgetName: "Global digital marketing",
    amount: 19000000,
    omnicom: false,
  },
  {
    category: "FMCG, Food & Beverage",
    company: "McDonalds",
    budgetName: "W&K Retainer",
    amount: 33000000,
    omnicom: false,
  },
  {
    category: "FMCG, Food & Beverage",
    company: "McDonalds",
    budgetName: "Digitas Retainer",
    amount: 650000,
    omnicom: false,
  },
  {
    category: "FMCG, Food & Beverage",
    company: "McDonalds",
    budgetName: "Elevent retainer",
    amount: 1000000,
    omnicom: false,
  },
  {
    category: "FMCG, Food & Beverage",
    company: "McDonalds",
    budgetName: "CYPHA",
    amount: 300000,
    omnicom: false,
  },
  {
    category: "FMCG, Food & Beverage",
    company: "McDonalds",
    budgetName: "TMS",
    amount: 500000,
    omnicom: false,
  },
  {
    category: "FMCG, Food & Beverage",
    company: "McDonalds",
    budgetName: "Tech licenses",
    amount: 1000000,
    omnicom: false,
  },
  {
    category: "FMCG, Food & Beverage",
    company: "KFC",
    budgetName: "Ogilvy retainer",
    amount: 20000000,
    omnicom: false,
  },
  {
    category: "FMCG, Food & Beverage",
    company: "KFC",
    budgetName: "Media billings",
    amount: 100000000,
    omnicom: false,
  },
  {
    category: "FMCG, Food & Beverage",
    company: "KFC",
    budgetName: "State of Origin rights",
    amount: 10000000,
    omnicom: false,
  },
  {
    category: "Banking & Financial Services",
    company: "IAG",
    budgetName: "Media Billings (ATL, Google, Social)",
    amount: 90000000,
    omnicom: false,
  },
  {
    category: "Banking & Financial Services",
    company: "IAG",
    budgetName: "Cricket Australia",
    amount: 6000000,
    omnicom: false,
  },
  {
    category: "Banking & Financial Services",
    company: "IAG",
    budgetName: "Accenture Song Retainer",
    amount: 6000000,
    omnicom: false,
  },
  {
    category: "Banking & Financial Services",
    company: "IAG",
    budgetName: "Initiative Retainer",
    amount: 2800000,
    omnicom: false,
  },
  {
    category: "Banking & Financial Services",
    company: "IAG",
    budgetName: "Adobe CDP License",
    amount: 1200000,
    omnicom: false,
  },
  {
    category: "Banking & Financial Services",
    company: "IAG",
    budgetName: "Thinkerbell Retainer",
    amount: 1000000,
    omnicom: false,
  },
  {
    category: "Banking & Financial Services",
    company: "IAG",
    budgetName: "Tech & Ops Fee",
    amount: 1000000,
    omnicom: false,
  },
  {
    category: "Banking & Financial Services",
    company: "IAG",
    budgetName: "IPSOS Measurement fees",
    amount: 800000,
    omnicom: false,
  },
  {
    category: "Banking & Financial Services",
    company: "IAG",
    budgetName: "SA Cricket Oval Naming Rights",
    amount: 800000,
    omnicom: false,
  },
  {
    category: "Banking & Financial Services",
    company: "IAG",
    budgetName: "Adelaide Fringe Presenting Partner",
    amount: 500000,
    omnicom: false,
  },
  {
    category: "Banking & Financial Services",
    company: "IAG",
    budgetName: "Munitex MMM (SA & NSW models)",
    amount: 500000,
    omnicom: false,
  },
  {
    category: "Banking & Financial Services",
    company: "IAG",
    budgetName: "MBCS (Cricket Activation)",
    amount: 200000,
    omnicom: false,
  },
  {
    category: "Banking & Financial Services",
    company: "IAG",
    budgetName: "Surfing Australia Partnership",
    amount: 200000,
    omnicom: false,
  },
  {
    category: "Travel, Aviation & Leisure",
    company: "Virgin",
    budgetName: "Media Billings (ATL, Google, Social)",
    amount: 90000000,
    omnicom: false,
  },
  {
    category: "Travel, Aviation & Leisure",
    company: "Virgin",
    budgetName: "Accenture Song Retainer",
    amount: 6000000,
    omnicom: false,
  },
  {
    category: "Travel, Aviation & Leisure",
    company: "Virgin",
    budgetName: "Partnerships (Cricket Australia)",
    amount: 6000000,
    omnicom: false,
  },
  {
    category: "Travel, Aviation & Leisure",
    company: "Virgin",
    budgetName: "Initiative Retainer",
    amount: 2800000,
    omnicom: false,
  },
  {
    category: "Travel, Aviation & Leisure",
    company: "Virgin",
    budgetName: "Adobe CDP License",
    amount: 1200000,
    omnicom: false,
  },
  {
    category: "Travel, Aviation & Leisure",
    company: "Virgin",
    budgetName: "Thinkerbell Retainer",
    amount: 1000000,
    omnicom: false,
  },
  {
    category: "Travel, Aviation & Leisure",
    company: "Virgin",
    budgetName: "Tech & Ops Fee",
    amount: 1000000,
    omnicom: false,
  },
  {
    category: "Travel, Aviation & Leisure",
    company: "Virgin",
    budgetName: "IPSOS Measurement fees",
    amount: 800000,
    omnicom: false,
  },
  {
    category: "Travel, Aviation & Leisure",
    company: "Virgin",
    budgetName: "SA Cricket Oval Naming Rights",
    amount: 800000,
    omnicom: false,
  },
  {
    category: "Travel, Aviation & Leisure",
    company: "Virgin",
    budgetName: "Adelaide Fringe Presenting Partner",
    amount: 500000,
    omnicom: false,
  },
  {
    category: "Travel, Aviation & Leisure",
    company: "Virgin",
    budgetName: "Munitex MMM (x2 market models SA&NSW)",
    amount: 500000,
    omnicom: false,
  },
  {
    category: "Travel, Aviation & Leisure",
    company: "Virgin",
    budgetName: "MBCS (Cricket Activation)",
    amount: 200000,
    omnicom: false,
  },
  {
    category: "Travel, Aviation & Leisure",
    company: "Virgin",
    budgetName: "Surfing Australia Partnership",
    amount: 200000,
    omnicom: false,
  },
];

const ROOT_ID = "root";
const SVG_SIZE = 960;
const VIEWPORT_CENTER = SVG_SIZE / 2;
const ROOT_RADIUS = 344;
const DEFAULT_ZOOM = 1.16;
const CLIENT_ZOOM = 1.32;
const INLINE_BUDGET_LABEL_MIN_RADIUS = 62;
const INLINE_BUDGET_AMOUNT_MIN_RADIUS = 20;

const getDefaultZoom = (level: NodeLevel) =>
  level === "client" ? CLIENT_ZOOM : DEFAULT_ZOOM;

const getDefaultPan = (level: NodeLevel) => ({
  x: level === "client" ? 36 : 0,
  y: 0,
});

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);

const formatCompactAmount = (value: number) => {
  if (value >= 1000000) {
    const millions = value / 1000000;
    return `${Number.isInteger(millions) ? millions.toFixed(0) : millions.toFixed(1)}M`;
  }

  if (value >= 1000) {
    const thousands = value / 1000;
    return `${Number.isInteger(thousands) ? thousands.toFixed(0) : thousands.toFixed(1)}K`;
  }

  return value.toLocaleString("en-AU");
};

const slugify = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-");

const CATEGORY_ORDER = [
  "FMCG, Food & Beverage",
  "Banking & Financial Services",
  "Travel, Aviation & Leisure",
];

const CLIENT_COLOURS = [
  { name: "Amber", fill: "#f59e0b", stroke: "#fde68a" },
  { name: "Red", fill: "#ef4444", stroke: "#fecaca" },
  { name: "Rose", fill: "#f43f5e", stroke: "#fecdd3" },
  { name: "Pink", fill: "#ec4899", stroke: "#fbcfe8" },
  { name: "Fuchsia", fill: "#d946ef", stroke: "#f5d0fe" },
  { name: "Purple", fill: "#a855f7", stroke: "#e9d5ff" },
  { name: "Violet", fill: "#8b5cf6", stroke: "#ddd6fe" },
  { name: "Indigo", fill: "#6366f1", stroke: "#c7d2fe" },
  { name: "Blue", fill: "#3b82f6", stroke: "#bfdbfe" },
  { name: "Sky", fill: "#0ea5e9", stroke: "#bae6fd" },
  { name: "Cyan", fill: "#06b6d4", stroke: "#a5f3fc" },
  { name: "Teal", fill: "#14b8a6", stroke: "#99f6e4" },
  { name: "Emerald", fill: "#10b981", stroke: "#a7f3d0" },
  { name: "Green", fill: "#22c55e", stroke: "#bbf7d0" },
  { name: "Lime", fill: "#84cc16", stroke: "#d9f99d" },
  { name: "Yellow", fill: "#eab308", stroke: "#fef08a" },
  { name: "Orange", fill: "#ea580c", stroke: "#fed7aa" },
  { name: "Slate", fill: "#64748b", stroke: "#cbd5e1" },
  { name: "Gray", fill: "#6b7280", stroke: "#d1d5db" },
  { name: "Zinc", fill: "#71717a", stroke: "#d4d4d8" },
  { name: "Neutral", fill: "#737373", stroke: "#d4d4d4" },
  { name: "Stone", fill: "#78716c", stroke: "#d6d3d1" },
  { name: "Mint", fill: "#34d399", stroke: "#6ee7b7" },
  { name: "Cerulean", fill: "#0284c7", stroke: "#7dd3fc" },
  { name: "Crimson", fill: "#be123c", stroke: "#fda4af" },
];

const OMNICOM_PURPLES = [
  { fill: "#2e1065", stroke: "#c4b5fd" },
  { fill: "#4c1d95", stroke: "#ddd6fe" },
  { fill: "#6d28d9", stroke: "#e9d5ff" },
  { fill: "#8b5cf6", stroke: "#ede9fe" },
  { fill: "#a78bfa", stroke: "#f5f3ff" },
  { fill: "#c4b5fd", stroke: "#4c1d95" },
];

const NON_OMNICOM_COLOURS = [
  { fill: "#f59e0b", stroke: "#fde68a" },
  { fill: "#ef4444", stroke: "#fecaca" },
  { fill: "#ea580c", stroke: "#fed7aa" },
  { fill: "#eab308", stroke: "#fef08a" },
  { fill: "#84cc16", stroke: "#d9f99d" },
  { fill: "#22c55e", stroke: "#bbf7d0" },
  { fill: "#10b981", stroke: "#a7f3d0" },
  { fill: "#14b8a6", stroke: "#99f6e4" },
  { fill: "#06b6d4", stroke: "#a5f3fc" },
  { fill: "#0ea5e9", stroke: "#bae6fd" },
  { fill: "#3b82f6", stroke: "#bfdbfe" },
  { fill: "#64748b", stroke: "#cbd5e1" },
  { fill: "#78716c", stroke: "#d6d3d1" },
  { fill: "#34d399", stroke: "#6ee7b7" },
  { fill: "#0284c7", stroke: "#7dd3fc" },
  { fill: "#be123c", stroke: "#fda4af" },
];

const getCategoryPalette = (category?: string): BubblePalette => {
  if (category === "FMCG, Food & Beverage") {
    return {
      fill: "#f59e0b",
      fillInner: "#fcd34d",
      stroke: "#fef3c7",
      ring: "#92400e",
      label: "#fff7ed",
      meta: "#ffedd5",
    };
  }

  if (category === "Banking & Financial Services") {
    return {
      fill: "#3b82f6",
      fillInner: "#93c5fd",
      stroke: "#dbeafe",
      ring: "#1d4ed8",
      label: "#eff6ff",
      meta: "#dbeafe",
    };
  }

  return {
    fill: "#8b5cf6",
    fillInner: "#c4b5fd",
    stroke: "#ede9fe",
    ring: "#6d28d9",
    label: "#f5f3ff",
    meta: "#ede9fe",
  };
};

const getClientPalette = (colourIndex = 0): BubblePalette => {
  const index = colourIndex % CLIENT_COLOURS.length;
  const colour = CLIENT_COLOURS[index];

  return {
    fill: colour.fill,
    fillInner: colour.stroke,
    stroke: colour.stroke,
    ring: colour.fill,
    label: "#ffffff",
    meta: colour.stroke,
  };
};

const getBudgetPalette = (
  isOmnicom?: number,
  colourIndex = 0,
): BubblePalette => {
  const colour = isOmnicom
    ? OMNICOM_PURPLES[colourIndex % OMNICOM_PURPLES.length]
    : NON_OMNICOM_COLOURS[colourIndex % NON_OMNICOM_COLOURS.length];

  return {
    fill: colour.fill,
    fillInner: colour.stroke,
    stroke: colour.stroke,
    ring: colour.fill,
    label: "#ffffff",
    meta: colour.stroke,
  };
};

function buildClientHierarchy(rows: BudgetRow[]): ExplorerNode {
  const clientColourIndex = new Map<string, number>();
  const budgetColourIndex = new Map<string, number>();
  rows.forEach((row) => {
    if (!clientColourIndex.has(row.company)) {
      clientColourIndex.set(row.company, clientColourIndex.size);
    }
    const budgetKey = `${row.company}|${row.budgetName}`;
    if (!budgetColourIndex.has(budgetKey)) {
      budgetColourIndex.set(budgetKey, budgetColourIndex.size);
    }
  });

  const groupedByCategory = new Map<string, BudgetRow[]>();

  rows.forEach((row) => {
    const list = groupedByCategory.get(row.category) ?? [];
    list.push(row);
    groupedByCategory.set(row.category, list);
  });

  const categories = Array.from(groupedByCategory.entries())
    .sort(([left], [right]) => {
      return CATEGORY_ORDER.indexOf(left) - CATEGORY_ORDER.indexOf(right);
    })
    .map(([category, categoryRows]) => {
      const groupedByClient = new Map<string, BudgetRow[]>();

      categoryRows.forEach((row) => {
        const list = groupedByClient.get(row.company) ?? [];
        list.push(row);
        groupedByClient.set(row.company, list);
      });

      const clients = Array.from(groupedByClient.entries())
        .map(([company, companyRows]) => {
          const companyAmount = companyRows.reduce(
            (sum, row) => sum + row.amount,
            0,
          );
          const companyOmnicomAmount = companyRows.reduce(
            (sum, row) => sum + (row.omnicom ? row.amount : 0),
            0,
          );

          return {
            id: `client-${slugify(category)}-${slugify(company)}`,
            label: company,
            amount: companyAmount,
            level: "client" as const,
            category,
            colourIndex: clientColourIndex.get(company) ?? 0,
            omnicomAmount: companyOmnicomAmount,
            children: companyRows
              .map((row) => ({
                id: `budget-${slugify(company)}-${slugify(row.budgetName)}`,
                label: row.budgetName,
                amount: row.amount,
                level: "budget" as const,
                category,
                colourIndex:
                  budgetColourIndex.get(`${row.company}|${row.budgetName}`) ??
                  0,
                omnicomAmount: row.omnicom ? row.amount : 0,
              }))
              .sort((a, b) => b.amount - a.amount),
          };
        })
        .sort((a, b) => b.amount - a.amount);

      const categoryAmount = clients.reduce(
        (sum, client) => sum + client.amount,
        0,
      );
      const categoryOmnicomAmount = clients.reduce(
        (sum, client) => sum + (client.omnicomAmount ?? 0),
        0,
      );

      return {
        id: `category-${slugify(category)}`,
        label: category,
        amount: categoryAmount,
        level: "category" as const,
        category,
        omnicomAmount: categoryOmnicomAmount,
        children: clients,
      };
    });

  return {
    id: ROOT_ID,
    label: "All Categories",
    amount: categories.reduce((sum, category) => sum + category.amount, 0),
    level: "root",
    omnicomAmount: categories.reduce(
      (sum, category) => sum + (category.omnicomAmount ?? 0),
      0,
    ),
    children: categories,
  };
}

function computeRadii(nodes: ExplorerNode[], containerRadius: number) {
  const total = nodes.reduce((sum, node) => sum + node.amount, 0);
  const areaScale = Math.PI * containerRadius * containerRadius * 0.58;

  return [...nodes]
    .map((node) => ({
      ...node,
      r: Math.max(30, Math.sqrt(((node.amount / total) * areaScale) / Math.PI)),
    }))
    .sort((a, b) => b.r - a.r);
}

function lineUpCircles(
  nodes: ExplorerNode[],
  containerRadius: number,
): PackedCircle[] {
  const circles = computeRadii(nodes, containerRadius);
  const gap = 24;
  const totalWidth =
    circles.reduce((sum, circle) => sum + circle.r * 2, 0) +
    gap * (circles.length - 1);
  const maxWidth = containerRadius * 2 - 40;
  const scale = totalWidth > maxWidth ? maxWidth / totalWidth : 1;

  let cursor =
    -(
      circles.reduce((sum, circle) => sum + circle.r * scale * 2, 0) +
      gap * (circles.length - 1)
    ) / 2;

  return circles.map((circle) => {
    const scaledRadius = circle.r * scale;
    const x = cursor + scaledRadius;
    cursor += scaledRadius * 2 + gap;

    return {
      ...circle,
      x,
      y: 0,
      r: scaledRadius,
    };
  });
}

function packCircles(
  nodes: ExplorerNode[],
  containerRadius: number,
): PackedCircle[] {
  if (nodes.length === 0) return [];
  if (nodes.length <= 4) return lineUpCircles(nodes, containerRadius);

  const sorted = computeRadii(nodes, containerRadius);
  const placed: PackedCircle[] = [];

  sorted.forEach((node, index) => {
    if (index === 0) {
      placed.push({ ...node, x: 0, y: 0 });
      return;
    }

    let candidate: PackedCircle | null = null;

    for (let step = 0; step < 7000; step += 1) {
      const angle = step * 0.38;
      const distance = 14 + step * 0.72;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      const insideBoundary = Math.hypot(x, y) + node.r <= containerRadius - 8;
      const overlaps = placed.some((circle) => {
        const gap = node.r + circle.r + 14;
        return Math.hypot(circle.x - x, circle.y - y) < gap;
      });

      if (insideBoundary && !overlaps) {
        candidate = { ...node, x, y };
        break;
      }
    }

    placed.push(candidate ?? { ...node, x: 0, y: 0 });
  });

  return placed;
}

function layoutBudgetCircles(nodes: ExplorerNode[]): PackedCircle[] {
  if (nodes.length === 0) return [];

  const sorted = [...nodes].sort((a, b) => b.amount - a.amount);
  const maxAmount = sorted[0]?.amount ?? 1;
  const boundaryRadius = 376;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  const circles: PackedCircle[] = sorted.map((node, index) => {
    const ratio = Math.sqrt(node.amount / maxAmount);
    const r = Math.max(18, Math.min(146, 16 + ratio * 132));

    if (index === 0) {
      return { ...node, x: 0, y: 0, r };
    }

    const ring = Math.floor(Math.sqrt(index));
    const distance = 86 + ring * 54 + r * 0.62;
    const omnicomNudge = (node.omnicomAmount ?? 0) > 0 ? -0.35 : 0.35;
    const angle = index * goldenAngle + omnicomNudge;

    return {
      ...node,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      r,
    };
  });

  for (let iteration = 0; iteration < 260; iteration += 1) {
    for (let leftIndex = 0; leftIndex < circles.length; leftIndex += 1) {
      for (
        let rightIndex = leftIndex + 1;
        rightIndex < circles.length;
        rightIndex += 1
      ) {
        const left = circles[leftIndex];
        const right = circles[rightIndex];
        const dx = right.x - left.x;
        const dy = right.y - left.y;
        const distance = Math.max(0.01, Math.hypot(dx, dy));
        const targetDistance = left.r + right.r + 5;

        if (distance >= targetDistance) continue;

        const push = (targetDistance - distance) / distance;
        const pushX = dx * push;
        const pushY = dy * push;

        if (leftIndex === 0) {
          right.x += pushX;
          right.y += pushY;
        } else {
          left.x -= pushX * 0.5;
          left.y -= pushY * 0.5;
          right.x += pushX * 0.5;
          right.y += pushY * 0.5;
        }
      }
    }

    circles.forEach((circle, index) => {
      if (index === 0) {
        circle.x = 0;
        circle.y = 0;
        return;
      }

      // A small inward gravity keeps the layout clustered instead of drifting into a loose spiral.
      circle.x *= 0.992;
      circle.y *= 0.992;

      const distanceFromCenter = Math.max(0.01, Math.hypot(circle.x, circle.y));
      const maxDistance = boundaryRadius - circle.r;

      if (distanceFromCenter > maxDistance) {
        const scale = maxDistance / distanceFromCenter;
        circle.x *= scale;
        circle.y *= scale;
      }
    });
  }

  return circles;
}

function distributeCalloutYPositions(
  circles: PackedCircle[],
  side: "left" | "right",
) {
  const top = 126;
  const bottom = SVG_SIZE - 126;
  const minGap = 48;
  const sorted = [...circles].sort((a, b) => a.y - b.y);

  if (sorted.length === 0) return [];

  const naturalPositions = sorted.map((circle) =>
    Math.max(top, Math.min(bottom, VIEWPORT_CENTER + circle.y)),
  );
  const totalMinHeight = minGap * (sorted.length - 1);
  const start = Math.max(top, (SVG_SIZE - totalMinHeight) / 2);

  const positions =
    totalMinHeight > bottom - top
      ? sorted.map((_, index) =>
          sorted.length === 1
            ? VIEWPORT_CENTER
            : top + ((bottom - top) * index) / (sorted.length - 1),
        )
      : naturalPositions.reduce<number[]>((result, y, index) => {
          const previous = result[index - 1] ?? start - minGap;
          result.push(Math.max(y, previous + minGap));
          return result;
        }, []);

  for (let index = positions.length - 2; index >= 0; index -= 1) {
    positions[index] = Math.min(
      positions[index],
      positions[index + 1] - minGap,
    );
  }

  const overflowTop = top - positions[0];
  const overflowBottom = positions[positions.length - 1] - bottom;
  const shift =
    overflowTop > 0 ? overflowTop : overflowBottom > 0 ? -overflowBottom : 0;

  return sorted.map((circle, index) => ({
    circle,
    side,
    y: positions[index] + shift,
  }));
}

function buildBudgetCallouts(circles: PackedCircle[]): BudgetCallout[] {
  const budgetCircles = circles.filter(
    (circle) =>
      circle.level === "budget" && circle.r < INLINE_BUDGET_LABEL_MIN_RADIUS,
  );
  const left = budgetCircles.filter((circle) => circle.x < 0);
  const right = budgetCircles.filter((circle) => circle.x >= 0);
  const assignments = [
    ...distributeCalloutYPositions(left, "left"),
    ...distributeCalloutYPositions(right, "right"),
  ];

  return assignments.map(({ circle, side, y }) => {
    const labelX = side === "left" ? 162 : SVG_SIZE - 208;
    const elbowX = side === "left" ? 232 : SVG_SIZE - 232;
    const circleCenterX = VIEWPORT_CENTER + circle.x;
    const circleCenterY = VIEWPORT_CENTER + circle.y;
    const labelAnchorX = labelX + 5;
    const angle = Math.atan2(y - circleCenterY, labelAnchorX - circleCenterX);

    return {
      circle,
      side,
      startX: circleCenterX + Math.cos(angle) * circle.r,
      startY: circleCenterY + Math.sin(angle) * circle.r,
      elbowX,
      labelX,
      labelY: y,
    };
  });
}

export default function BudgetExplorer() {
  const [viewMode, setViewMode] = useState<ViewMode>("client");
  const [interactionMode, setInteractionMode] =
    useState<InteractionMode>("hand");
  const [focusId, setFocusId] = useState(ROOT_ID);
  const [searchQuery, setSearchQuery] = useState("");
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [pan, setPan] = useState(getDefaultPan("root"));
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  const hierarchy = useMemo(() => buildClientHierarchy(BUDGET_DATA), []);

  const { nodesById, parentById } = useMemo(() => {
    const nodesMap = new Map<string, ExplorerNode>();
    const parentsMap = new Map<string, string | null>();

    const visit = (node: ExplorerNode, parentId: string | null) => {
      nodesMap.set(node.id, node);
      parentsMap.set(node.id, parentId);
      node.children?.forEach((child) => visit(child, node.id));
    };

    visit(hierarchy, null);
    return { nodesById: nodesMap, parentById: parentsMap };
  }, [hierarchy]);

  const focusNode = nodesById.get(focusId) ?? hierarchy;

  const searchResults = useMemo(() => {
    if (searchQuery.trim().length < 2) return [];

    const query = searchQuery.toLowerCase();
    return Array.from(nodesById.values())
      .filter((node) => node.level !== "root")
      .filter((node) => node.label.toLowerCase().includes(query))
      .slice(0, 8);
  }, [nodesById, searchQuery]);

  const breadcrumb = useMemo(() => {
    const path: ExplorerNode[] = [];
    let currentId: string | null = focusNode.id;

    while (currentId) {
      const node = nodesById.get(currentId);
      if (!node) break;
      path.unshift(node);
      currentId = parentById.get(currentId) ?? null;
    }

    return path;
  }, [focusNode.id, nodesById, parentById]);

  const visibleCircles = useMemo(
    () =>
      focusNode.level === "client"
        ? layoutBudgetCircles(focusNode.children ?? [])
        : packCircles(focusNode.children ?? [], ROOT_RADIUS),
    [focusNode],
  );

  const budgetCallouts = useMemo(
    () =>
      focusNode.level === "client" ? buildBudgetCallouts(visibleCircles) : [],
    [focusNode.level, visibleCircles],
  );

  const focusStats = useMemo(() => {
    const currentChildren = focusNode.children ?? [];

    return {
      totalAmount: focusNode.amount,
      omnicomAmount: focusNode.omnicomAmount ?? 0,
      categoryCount: hierarchy.children?.length ?? 0,
      clientCount: Array.from(nodesById.values()).filter(
        (node) => node.level === "client",
      ).length,
      budgetCount: focusNode.level === "budget" ? 1 : currentChildren.length,
      share:
        focusNode.amount === 0
          ? 0
          : Math.round(
              ((focusNode.omnicomAmount ?? 0) / focusNode.amount) * 100,
            ),
    };
  }, [focusNode, hierarchy.children, nodesById]);

  const resetViewport = (node = focusNode) => {
    setZoom(getDefaultZoom(node.level));
    setPan(getDefaultPan(node.level));
  };

  const handleFocusChange = (nodeId: string) => {
    const nextNode = nodesById.get(nodeId) ?? hierarchy;
    setFocusId(nodeId);
    resetViewport(nextNode);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (event.key === "z" || event.key === "Z") {
        event.preventDefault();
        setInteractionMode("zoom");
      }

      if (event.key === "h" || event.key === "H") {
        event.preventDefault();
        setInteractionMode("hand");
      }

      if (event.key === "Shift") {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Shift") {
        setIsShiftPressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const reverse = interactionMode === "zoom" && event.shiftKey;
    setZoom((value) =>
      Math.max(
        0.8,
        Math.min(2.5, value * (event.deltaY > 0 !== reverse ? 0.92 : 1.08)),
      ),
    );
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (interactionMode !== "hand") return;
    setIsDragging(true);
    setDragStart({ x: event.clientX - pan.x, y: event.clientY - pan.y });
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (interactionMode !== "hand") return;
    if (!isDragging) return;
    setPan({ x: event.clientX - dragStart.x, y: event.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (interactionMode !== "zoom") return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const localX = event.clientX - bounds.left;
    const localY = event.clientY - bounds.top;
    const offsetX = localX - bounds.width / 2;
    const offsetY = localY - bounds.height / 2;
    const nextZoom = isShiftPressed ? zoom * 0.8 : zoom * 1.25;
    const clampedZoom = Math.max(0.8, Math.min(2.5, nextZoom));
    const zoomFactor = clampedZoom / zoom;

    setPan((currentPan) => ({
      x: currentPan.x - offsetX * (zoomFactor - 1),
      y: currentPan.y - offsetY * (zoomFactor - 1),
    }));
    setZoom(clampedZoom);
  };

  const controls = (
    <>
      <div className="hidden items-center gap-1 rounded-xl border border-input bg-muted p-1 md:flex">
        <button
          onClick={() => {
            setViewMode("client");
            resetViewport();
          }}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            viewMode === "client"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          Client POV
        </button>
        <button
          onClick={() => {
            setViewMode("category");
            resetViewport();
          }}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            viewMode === "category"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Category POV
        </button>
      </div>

      <div className="hidden items-center gap-1 rounded-xl border border-input bg-muted p-1 md:flex">
        <button
          onClick={() => setInteractionMode("hand")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            interactionMode === "hand"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          Hand (H)
        </button>
        <button
          onClick={() => setInteractionMode("zoom")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            interactionMode === "zoom"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          Zoom (Z)
        </button>
      </div>

      <div className="relative hidden md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search categories or clients..."
          className="w-64 rounded-xl border border-input bg-muted py-2 pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:bg-muted"
        />
        {searchResults.length > 0 ? (
          <div className="absolute right-0 top-full z-30 mt-2 w-64 overflow-hidden rounded-2xl border border-input bg-card shadow-2xl">
            {searchResults.map((result) => (
              <button
                key={result.id}
                onClick={() => {
                  handleFocusChange(result.id);
                  setSearchQuery("");
                }}
                className="flex w-full items-center justify-between border-b border-border px-4 py-3 text-left text-sm text-foreground transition last:border-b-0 hover:bg-muted hover:text-foreground"
              >
                <span>{result.label}</span>
                <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  {result.level}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );

  const sidebar = (
    <div className="space-y-8">
      <section className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-300">
            <CircleDollarSign className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
              Focus
            </div>
            <div className="mt-1 text-lg font-semibold text-foreground">
              {focusNode.label}
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Start at category level, click through to clients, then drill into
          budget lines.
        </p>
      </section>

      <section>
        <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.35em] text-muted-foreground">
          Portfolio Snapshot
        </div>
        <div className="space-y-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Total Budget
            </div>
            <div className="mt-2 text-xl font-semibold text-foreground">
              {formatCurrency(focusStats.totalAmount)}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Omnicom Share
            </div>
            <div className="mt-2 text-xl font-semibold text-foreground">
              {formatCurrency(focusStats.omnicomAmount)}
            </div>
            <div className="mt-1 text-xs text-emerald-500">
              {focusStats.share}% of visible scope
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.35em] text-muted-foreground">
          Counts
        </div>
        <ul className="space-y-3">
          <li className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
            <span className="text-sm text-foreground">Categories</span>
            <span className="text-sm font-semibold text-foreground">
              {focusStats.categoryCount}
            </span>
          </li>
          <li className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
            <span className="text-sm text-foreground">Clients</span>
            <span className="text-sm font-semibold text-foreground">
              {focusStats.clientCount}
            </span>
          </li>
          <li className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
            <span className="text-sm text-foreground">Visible Children</span>
            <span className="text-sm font-semibold text-foreground">
              {focusStats.budgetCount}
            </span>
          </li>
        </ul>
      </section>
    </div>
  );

  return (
    <ExplorerShell
      pageTitle="Budget Explorer"
      pageSubtitle="Circle-packed budget explorer using the same colour family as the Contact Explorer."
      controls={controls}
      sidebar={sidebar}
      breadcrumb={
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold uppercase tracking-[0.35em] text-muted-foreground">
            Focus
          </span>
          {breadcrumb.map((node, index) => (
            <div key={node.id} className="flex items-center gap-2">
              {index > 0 ? (
                <span className="text-muted-foreground">/</span>
              ) : null}
              <button
                onClick={() => handleFocusChange(node.id)}
                className="font-medium text-foreground transition hover:text-foreground"
              >
                {node.label}
              </button>
            </div>
          ))}
        </div>
      }
    >
      <div
        className={`relative h-full overflow-hidden ${
          interactionMode === "hand"
            ? "cursor-grab active:cursor-grabbing"
            : isShiftPressed
              ? "cursor-zoom-out"
              : "cursor-zoom-in"
        }`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
      >
        <div className="absolute inset-0 bg-background" />

        <div className="absolute right-6 top-6 z-20 flex flex-col gap-2 rounded-2xl border border-input bg-(--card)/90 p-1">
          <button
            onClick={() => setZoom((value) => Math.min(2.5, value * 1.15))}
            className="rounded-xl p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={() => setZoom((value) => Math.max(0.8, value * 0.85))}
            className="rounded-xl p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={() => resetViewport()}
            className="rounded-xl p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Maximize className="h-4 w-4" />
          </button>
        </div>

        <div className="absolute inset-0 overflow-hidden">
          <div className="flex h-full w-full items-center justify-center">
            <div
              className="relative"
              style={{
                width: SVG_SIZE,
                height: SVG_SIZE,
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: "center center",
              }}
            >
              {focusNode.level !== "client"
                ? [120, 220, 344].map((ring) => (
                    <div
                      key={ring}
                      className="absolute rounded-full border border-dashed border-input"
                      style={{
                        width: ring * 2,
                        height: ring * 2,
                        left: VIEWPORT_CENTER - ring,
                        top: VIEWPORT_CENTER - ring,
                      }}
                    />
                  ))
                : null}

              {focusNode.level !== "client" ? (
                <div className="pointer-events-none absolute left-1/2 top-34 -translate-x-1/2 text-center">
                  <div className="text-base font-semibold tracking-[0.24em] text-foreground">
                    {focusNode.level === "root"
                      ? "CATEGORIES"
                      : focusNode.label.toUpperCase()}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {focusNode.level === "root"
                      ? "Click a category to see its clients"
                      : focusNode.level === "category"
                        ? "Click a client to see budget names"
                        : "Budget detail"}
                  </div>
                </div>
              ) : null}

              {focusNode.level === "client" ? (
                <svg
                  viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
                  className="pointer-events-none absolute inset-0 h-full w-full"
                >
                  {budgetCallouts.map((callout) => {
                    const palette = getBudgetPalette(
                      callout.circle.omnicomAmount,
                      callout.circle.colourIndex,
                    );

                    return (
                      <g key={`leader-${callout.circle.id}`}>
                        <path
                          d={`M ${callout.startX} ${callout.startY} L ${callout.elbowX} ${callout.labelY} L ${callout.labelX + 5} ${callout.labelY}`}
                          fill="none"
                          stroke={palette.fill}
                          strokeOpacity={0.4}
                          strokeWidth={1}
                          className="transition-all duration-500 ease-out"
                        />
                        <circle
                          cx={callout.startX}
                          cy={callout.startY}
                          r={2.5}
                          fill={palette.stroke}
                          opacity={0.75}
                        />
                      </g>
                    );
                  })}
                </svg>
              ) : null}

              {visibleCircles.map((circle) => {
                const palette =
                  circle.level === "category"
                    ? getCategoryPalette(circle.category)
                    : circle.level === "client"
                      ? getClientPalette(circle.colourIndex)
                      : getBudgetPalette(
                          circle.omnicomAmount,
                          circle.colourIndex,
                        );
                const hasInlineBudgetLabel =
                  circle.level === "budget" &&
                  circle.r >= INLINE_BUDGET_LABEL_MIN_RADIUS;
                const hasInlineBudgetAmount =
                  circle.level === "budget" &&
                  circle.r >= INLINE_BUDGET_AMOUNT_MIN_RADIUS;
                const hasInlineHierarchyLabel =
                  circle.level !== "budget" && circle.r > 42;

                return (
                  <button
                    key={circle.id}
                    type="button"
                    title={`${circle.label} ${formatCompactAmount(circle.amount)}`}
                    className="absolute flex items-center justify-center rounded-full transition-transform duration-300 hover:scale-[1.02]"
                    style={{
                      width: circle.r * 2,
                      height: circle.r * 2,
                      left: VIEWPORT_CENTER + circle.x - circle.r,
                      top: VIEWPORT_CENTER + circle.y - circle.r,
                      backgroundColor: palette.fill,
                      border: `${circle.level === "budget" ? 5 : 4}px solid ${palette.stroke}`,
                      cursor: "default",
                    }}
                    onMouseDown={(event) => {
                      event.stopPropagation();
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (viewMode === "category") return;
                      if (circle.children?.length) {
                        handleFocusChange(circle.id);
                      }
                    }}
                  >
                    {hasInlineHierarchyLabel ? (
                      <div
                        className="pointer-events-none px-5 text-center"
                        style={{
                          maxWidth: circle.r * 1.55,
                          color: "#ffffff",
                          textShadow: "0 2px 12px rgba(2, 6, 23, 0.72)",
                        }}
                      >
                        <div
                          className="font-extrabold leading-tight tracking-wide"
                          style={{ fontSize: circle.r > 118 ? 17 : 13 }}
                        >
                          {circle.label}
                        </div>
                        <div
                          className="mt-1 font-semibold"
                          style={{
                            color: palette.stroke,
                            fontSize: circle.r > 118 ? 14 : 12,
                          }}
                        >
                          {formatCompactAmount(circle.amount)}
                        </div>
                      </div>
                    ) : hasInlineBudgetLabel ? (
                      <div
                        className="pointer-events-none px-5 text-center"
                        style={{
                          maxWidth: circle.r * 1.5,
                          color: "#ffffff",
                          textShadow: "0 2px 12px rgba(2, 6, 23, 0.65)",
                        }}
                      >
                        <div
                          className="font-extrabold leading-tight tracking-wide"
                          style={{ fontSize: circle.r > 100 ? 16 : 13 }}
                        >
                          {circle.label}
                        </div>
                        <div
                          className="mt-1 font-semibold"
                          style={{
                            color: palette.stroke,
                            fontSize: circle.r > 100 ? 14 : 12,
                          }}
                        >
                          {formatCompactAmount(circle.amount)}
                        </div>
                      </div>
                    ) : hasInlineBudgetAmount ? (
                      <div
                        className="pointer-events-none text-center font-bold text-white"
                        style={{
                          fontSize: circle.r > 32 ? 10 : 8,
                          textShadow: "0 2px 10px rgba(2, 6, 23, 0.85)",
                        }}
                      >
                        {formatCompactAmount(circle.amount)}
                      </div>
                    ) : null}
                  </button>
                );
              })}

              {budgetCallouts.map((callout) => {
                const palette = getBudgetPalette(
                  callout.circle.omnicomAmount,
                  callout.circle.colourIndex,
                );
                const isLeft = callout.side === "left";

                return (
                  <div
                    key={`callout-${callout.circle.id}`}
                    className="pointer-events-none absolute flex items-center gap-2"
                    style={{
                      left: isLeft ? callout.labelX - 200 : callout.labelX,
                      top: callout.labelY - 18,
                      width: 200,
                      justifyContent: isLeft ? "flex-end" : "flex-start",
                      textAlign: isLeft ? "right" : "left",
                    }}
                  >
                    {!isLeft ? (
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: palette.fill }}
                      />
                    ) : null}
                    <div className="min-w-0">
                      <div
                        className="text-[11px] font-semibold leading-tight text-foreground"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {callout.circle.label}
                      </div>
                      <div
                        className="mt-0.5 text-[10px] font-medium"
                        style={{ color: palette.fill }} // fix
                      >
                        {formatCompactAmount(callout.circle.amount)}
                      </div>
                    </div>
                    {isLeft ? (
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: palette.fill }}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {viewMode === "category" ? (
          <div className="pointer-events-none absolute inset-x-6 bottom-6 z-20 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100 shadow-[0_0_40px_rgba(251,191,36,0.08)]">
            Category POV is still a placeholder. Client POV now starts from
            category bubbles and drills into clients, then budgets.
          </div>
        ) : null}
      </div>
    </ExplorerShell>
  );
}
