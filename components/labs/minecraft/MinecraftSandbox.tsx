"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import * as Quarks from "three.quarks";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import {
  type BlockType,
  CHUNK_SIZE,
  SEA_LEVEL,
  WORLD_HEIGHT,
  WorldGenerator,
  type VoxelChunk,
} from "@/lib/labs/minecraft/world-generator";
import { PlayerController } from "@/lib/labs/minecraft/player-controller";

type ChunkRender = {
  key: string;
  cx: number;
  cz: number;
  mesh: THREE.Group;
  version: number;
};

type ItemId =
  | `block:${BlockType}`
  | "wanda_focus"
  | "stick"
  | "bow"
  | "fire_bow"
  | "water_orb"
  | "thunder_staff"
  | "rifle"
  | "smg"
  | "shotgun"
  | "wood_sword"
  | "stone_sword"
  | "wood_pickaxe"
  | "stone_pickaxe"
  | "wood_axe"
  | "stone_axe";
type InventorySlot = { item: ItemId; count: number } | null;
type CraftingCell = { item: ItemId; count: number } | null;
type CraftingRecipe = {
  pattern: Array<ItemId | null>;
  output: { item: ItemId; count: number };
};
type CraftingMatch = {
  recipe: CraftingRecipe;
};

const DRAW_RADIUS = 6;
const ATLAS_TILES = 12;
const ATLAS_TILE_SIZE = 128;
const ATLAS_WIDTH = ATLAS_TILE_SIZE * ATLAS_TILES;
const UV_EPS_U = 0.75 / ATLAS_WIDTH;
const UV_EPS_V = 0.75 / ATLAS_TILE_SIZE;
const FACE_OFFSETS = [
  { n: [1, 0, 0], v: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]] },
  { n: [-1, 0, 0], v: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]] },
  { n: [0, 1, 0], v: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]] },
  { n: [0, -1, 0], v: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
  { n: [0, 0, 1], v: [[1, 0, 1], [1, 1, 1], [0, 1, 1], [0, 0, 1]] },
  { n: [0, 0, -1], v: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]] },
] as const;

const TILE_INDEX = {
  grassTop: 0,
  grassSide: 1,
  dirt: 2,
  stone: 3,
  sand: 4,
  logSide: 5,
  logTop: 6,
  leaves: 7,
  gravel: 8,
  clay: 9,
  redSand: 10,
  moss: 11,
} as const;

function makeNoise(seed: number, x: number, y: number): number {
  const v = Math.sin((x * 127.1 + y * 311.7 + seed * 17.17) * 0.045) * 43758.5453;
  return v - Math.floor(v);
}

function makeProceduralTile(
  size: number,
  kind:
    | "grassTop"
    | "grassSide"
    | "dirt"
    | "stone"
    | "sand"
    | "logSide"
    | "logTop"
    | "leaves"
    | "gravel"
    | "clay"
    | "redSand"
    | "moss"
) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  if (!ctx) return c;

  const img = ctx.createImageData(size, size);
  const data = img.data;

  const paint = (x: number, y: number, r: number, g: number, b: number, a = 255) => {
    const q = (v: number) => Math.max(0, Math.min(255, Math.round(v / 4) * 4));
    const i = (y * size + x) * 4;
    data[i] = q(r);
    data[i + 1] = q(g);
    data[i + 2] = q(b);
    data[i + 3] = a;
  };

  const tileNoise = (seed: number, x: number, y: number, freq = 1) => {
    const fx = (x / size) * Math.PI * 2 * freq;
    const fy = (y / size) * Math.PI * 2 * freq;
    const a = Math.sin(fx + seed * 0.21) * 0.5 + 0.5;
    const b = Math.sin(fy + seed * 0.37) * 0.5 + 0.5;
    const c = Math.sin(fx + fy + seed * 0.17) * 0.5 + 0.5;
    return a * 0.42 + b * 0.34 + c * 0.24;
  };
  const grain = (seed: number, x: number, y: number) => {
    const xi = ((x % size) + size) % size;
    const yi = ((y % size) + size) % size;
    const n = Math.sin((xi * 12.9898 + yi * 78.233 + seed * 37.719) * 0.87) * 43758.5453;
    return n - Math.floor(n);
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n0 = tileNoise(3, x, y, 1);
      const n1 = tileNoise(11, x, y, 2);
      const n2 = tileNoise(29, x, y, 4);
      const n = (n0 * 0.5 + n1 * 0.35 + n2 * 0.15);
      const g0 = grain(7, x, y);
      const g1 = grain(19, x + 11, y - 7);
      let r = 120, g = 120, b = 120, a = 255;

      if (kind === "dirt") {
        r = 86 + n * 42 + (g0 - 0.5) * 36;
        g = 60 + n * 30 + (g1 - 0.5) * 24;
        b = 40 + n * 20 + (g0 - 0.5) * 16;
      } else if (kind === "grassTop") {
        r = 52 + n * 22 + (g0 - 0.5) * 18;
        g = 102 + n * 56 + (g1 - 0.5) * 22;
        b = 48 + n * 22 + (g0 - 0.5) * 14;
      } else if (kind === "grassSide") {
        const topBand = y < size * 0.26;
        if (topBand) {
          const gn = tileNoise(41, x, y, 5);
          r = 48 + gn * 18 + (g0 - 0.5) * 14;
          g = 100 + gn * 48 + (g1 - 0.5) * 18;
          b = 44 + gn * 18 + (g0 - 0.5) * 12;
        } else {
          r = 88 + n * 36 + (g0 - 0.5) * 26;
          g = 62 + n * 24 + (g1 - 0.5) * 20;
          b = 42 + n * 18 + (g0 - 0.5) * 14;
        }
      } else if (kind === "stone") {
        r = 106 + n * 34 + (g0 - 0.5) * 28;
        g = 110 + n * 34 + (g1 - 0.5) * 28;
        b = 114 + n * 34 + (g0 - 0.5) * 28;
      } else if (kind === "sand") {
        r = 164 + n * 36 + (g0 - 0.5) * 20;
        g = 148 + n * 30 + (g1 - 0.5) * 16;
        b = 116 + n * 24 + (g0 - 0.5) * 14;
      } else if (kind === "redSand") {
        r = 154 + n * 46 + (g0 - 0.5) * 24;
        g = 92 + n * 28 + (g1 - 0.5) * 16;
        b = 64 + n * 20 + (g0 - 0.5) * 12;
      } else if (kind === "gravel") {
        r = 122 + n * 30 + (g0 - 0.5) * 26;
        g = 118 + n * 28 + (g1 - 0.5) * 22;
        b = 112 + n * 26 + (g0 - 0.5) * 20;
      } else if (kind === "clay") {
        r = 118 + n * 22 + (g0 - 0.5) * 16;
        g = 126 + n * 24 + (g1 - 0.5) * 16;
        b = 136 + n * 28 + (g0 - 0.5) * 18;
      } else if (kind === "moss") {
        r = 52 + n * 20 + (g0 - 0.5) * 14;
        g = 90 + n * 42 + (g1 - 0.5) * 18;
        b = 46 + n * 20 + (g0 - 0.5) * 12;
      } else if (kind === "logSide") {
        const rings = Math.sin((x * 0.45 + tileNoise(63, y, x, 2) * 6) * 0.55) * 0.5 + 0.5;
        r = 82 + rings * 36 + n * 14 + (g0 - 0.5) * 14;
        g = 58 + rings * 24 + n * 10 + (g1 - 0.5) * 10;
        b = 38 + rings * 18 + n * 9 + (g0 - 0.5) * 8;
      } else if (kind === "logTop") {
        const cx = x - size / 2;
        const cy = y - size / 2;
        const d = Math.sqrt(cx * cx + cy * cy);
        const rings = Math.sin(d * 0.8 + tileNoise(71, x, y, 3) * 3.2) * 0.5 + 0.5;
        r = 110 + rings * 26 + n * 10 + (g0 - 0.5) * 10;
        g = 86 + rings * 20 + n * 8 + (g1 - 0.5) * 8;
        b = 58 + rings * 15 + n * 8 + (g0 - 0.5) * 8;
      } else if (kind === "leaves") {
        const leaf = tileNoise(89, x, y, 6);
        r = 42 + n * 26 + (g0 - 0.5) * 14;
        g = 88 + n * 68 + (g1 - 0.5) * 18;
        b = 40 + n * 24 + (g0 - 0.5) * 12;
        a = leaf > 0.09 ? 240 : 175;
      }
      paint(x, y, r | 0, g | 0, b | 0, a);
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function colorForBlock(id: number): THREE.Color {
  switch (id) {
    case 1: return new THREE.Color("#39a65f");
    case 2: return new THREE.Color("#7f5539");
    case 3: return new THREE.Color("#6b7280");
    case 4: return new THREE.Color("#3b82f6");
    case 5: return new THREE.Color("#c8a66d");
    case 6: return new THREE.Color("#8b5a2b");
    case 7: return new THREE.Color("#2e8b57");
    case 8: return new THREE.Color("#8f918f");
    case 9: return new THREE.Color("#7d8fa0");
    case 10: return new THREE.Color("#b26b3f");
    case 11: return new THREE.Color("#4f8b4f");
    default: return new THREE.Color("#000000");
  }
}

const toBlockItem = (block: BlockType): ItemId => `block:${block}`;
const fromBlockItem = (item: ItemId): BlockType | null =>
  item.startsWith("block:") ? (Number(item.slice(6)) as BlockType) : null;

function itemLabel(item: ItemId): string {
  const block = fromBlockItem(item);
  if (block !== null) {
    switch (block) {
      case 1: return "Grass";
      case 2: return "Dirt";
      case 3: return "Stone";
      case 5: return "Sand";
      case 6: return "Wood";
      case 7: return "Leaves";
      case 8: return "Gravel";
      case 9: return "Clay";
      case 10: return "RedSand";
      case 11: return "Moss";
      default: return "Block";
    }
  }
  switch (item) {
    case "wanda_focus": return "Wanda Focus";
    case "stick": return "Stick";
    case "bow": return "Bow";
    case "fire_bow": return "Fire Bow";
    case "water_orb": return "Water Orb";
    case "thunder_staff": return "Thunder Staff";
    case "rifle": return "Rifle";
    case "smg": return "SMG";
    case "shotgun": return "Shotgun";
    case "wood_sword": return "Wood Sword";
    case "stone_sword": return "Stone Sword";
    case "wood_pickaxe": return "Wood Pickaxe";
    case "stone_pickaxe": return "Stone Pickaxe";
    case "wood_axe": return "Wood Axe";
    case "stone_axe": return "Stone Axe";
    default: return "Item";
  }
}

function itemColor(item: ItemId): string {
  const block = fromBlockItem(item);
  if (block !== null) return colorForBlock(block).getStyle();
  switch (item) {
    case "wanda_focus": return "#991b1b";
    case "stick": return "#c4a070";
    case "bow": return "#a47c4f";
    case "fire_bow": return "#ef4444";
    case "water_orb": return "#38bdf8";
    case "thunder_staff": return "#facc15";
    case "rifle": return "#94a3b8";
    case "smg": return "#a3a3a3";
    case "shotgun": return "#cbd5e1";
    case "wood_sword":
    case "wood_pickaxe":
    case "wood_axe": return "#8b5a2b";
    case "stone_sword":
    case "stone_pickaxe":
    case "stone_axe": return "#9aa3ad";
    default: return "#ffffff";
  }
}

function itemGlyph(item: ItemId): string {
  switch (item) {
    case "wanda_focus": return "WND";
    case "stick": return "I";
    case "bow": return "BOW";
    case "fire_bow": return "FBW";
    case "water_orb": return "WTR";
    case "thunder_staff": return "⚡";
    case "rifle": return "RFL";
    case "smg": return "SMG";
    case "shotgun": return "SGN";
    case "wood_sword": return "WS";
    case "stone_sword": return "SS";
    case "wood_pickaxe": return "WP";
    case "stone_pickaxe": return "SP";
    case "wood_axe": return "WA";
    case "stone_axe": return "SA";
    default: {
      const b = fromBlockItem(item);
      if (b === 1) return "GR";
      if (b === 2) return "DI";
      if (b === 3) return "ST";
      if (b === 5) return "SD";
      if (b === 6) return "WD";
      if (b === 7) return "LF";
      if (b === 8) return "GV";
      if (b === 9) return "CL";
      if (b === 10) return "RS";
      if (b === 11) return "MS";
      return "BL";
    }
  }
}

function makePattern(rows: Array<Array<ItemId | null>>): Array<ItemId | null> {
  return rows.flat();
}

function toolRecipes(material: BlockType, prefix: "wood" | "stone"): CraftingRecipe[] {
  const m = toBlockItem(material);
  const s: ItemId = "stick";
  return [
    {
      pattern: makePattern([[null, m, null], [null, m, null], [null, s, null]]),
      output: { item: `${prefix}_sword` as ItemId, count: 1 },
    },
    {
      pattern: makePattern([[m, m, m], [null, s, null], [null, s, null]]),
      output: { item: `${prefix}_pickaxe` as ItemId, count: 1 },
    },
    {
      pattern: makePattern([[m, m, null], [m, s, null], [null, s, null]]),
      output: { item: `${prefix}_axe` as ItemId, count: 1 },
    },
    {
      pattern: makePattern([[null, m, m], [null, s, m], [null, s, null]]),
      output: { item: `${prefix}_axe` as ItemId, count: 1 },
    },
  ];
}

const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    pattern: makePattern([[null, toBlockItem(6), null], [null, toBlockItem(6), null], [null, null, null]]),
    output: { item: "stick", count: 4 },
  },
  ...toolRecipes(6, "wood"),
  ...toolRecipes(3, "stone"),
];

function addToInventoryState(inv: InventorySlot[], item: ItemId, amount: number): InventorySlot[] {
  const next = [...inv];
  let remaining = amount;
  for (let i = 0; i < next.length && remaining > 0; i++) {
    const slot = next[i];
    if (!slot || slot.item !== item || slot.count >= 99) continue;
    const can = Math.min(99 - slot.count, remaining);
    next[i] = { item, count: slot.count + can };
    remaining -= can;
  }
  for (let i = 0; i < next.length && remaining > 0; i++) {
    if (next[i] !== null) continue;
    const can = Math.min(99, remaining);
    next[i] = { item, count: can };
    remaining -= can;
  }
  return next;
}

function normalizePattern(pattern: Array<ItemId | null>) {
  const cells = [];
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      const item = pattern[y * 3 + x];
      if (item) cells.push({ x, y, item });
    }
  }
  if (cells.length === 0) return null;
  const minX = Math.min(...cells.map((c) => c.x));
  const minY = Math.min(...cells.map((c) => c.y));
  const maxX = Math.max(...cells.map((c) => c.x));
  const maxY = Math.max(...cells.map((c) => c.y));
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const compact: Array<ItemId | null> = Array.from({ length: w * h }, () => null);
  for (const c of cells) {
    compact[(c.y - minY) * w + (c.x - minX)] = c.item;
  }
  return { w, h, compact };
}

function matchingRecipe(cells: CraftingCell[]): CraftingMatch | null {
  const cellPattern = cells.map((c) => (c && c.count > 0 ? c.item : null));
  const normalizedCells = normalizePattern(cellPattern);
  if (!normalizedCells) return null;
  for (const recipe of CRAFTING_RECIPES) {
    const normalizedRecipe = normalizePattern(recipe.pattern);
    if (!normalizedRecipe) continue;
    if (normalizedCells.w !== normalizedRecipe.w || normalizedCells.h !== normalizedRecipe.h) continue;
    let ok = true;
    for (let i = 0; i < normalizedRecipe.compact.length; i++) {
      if (normalizedCells.compact[i] !== normalizedRecipe.compact[i]) { ok = false; break; }
    }
    if (ok) return { recipe };
  }
  return null;
}

function chunkKey(cx: number, cz: number) { return `${cx},${cz}`; }

function tileForFace(block: number, faceIndex: number): number {
  switch (block) {
    case 1:
      if (faceIndex === 2) return TILE_INDEX.grassTop;
      if (faceIndex === 3) return TILE_INDEX.dirt;
      return TILE_INDEX.grassSide;
    case 2: return TILE_INDEX.dirt;
    case 3: return TILE_INDEX.stone;
    case 5: return TILE_INDEX.sand;
    case 6: return faceIndex === 2 || faceIndex === 3 ? TILE_INDEX.logTop : TILE_INDEX.logSide;
    case 7: return TILE_INDEX.leaves;
    case 8: return TILE_INDEX.gravel;
    case 9: return TILE_INDEX.clay;
    case 10: return TILE_INDEX.redSand;
    case 11: return TILE_INDEX.moss;
    default: return TILE_INDEX.stone;
  }
}

function pushAtlasUV(uvs: number[], tile: number) {
  const du = 1 / ATLAS_TILES;
  const u0 = tile * du + UV_EPS_U;
  const u1 = (tile + 1) * du - UV_EPS_U;
  const v0 = UV_EPS_V;
  const v1 = 1 - UV_EPS_V;
  uvs.push(u0, v0, u0, v1, u1, v1, u1, v0);
}

function isTransparentFor(blockId: number, neighborId: number): boolean {
  if (blockId === 4) return neighborId !== 4;
  return neighborId === 0 || neighborId === 4;
}

function raycastVoxel(world: WorldGenerator, origin: THREE.Vector3, dir: THREE.Vector3, maxDistance = 9) {
  const step = 0.12;
  const p = origin.clone();
  let lastAir: { x: number; y: number; z: number } | null = null;
  for (let t = 0; t <= maxDistance; t += step) {
    p.copy(origin).addScaledVector(dir, t);
    const bx = Math.floor(p.x);
    const by = Math.floor(p.y);
    const bz = Math.floor(p.z);
    const block = world.getBlockWorld(bx, by, bz);
    if (block === 0) { lastAir = { x: bx, y: by, z: bz }; continue; }
    if (block === 4) continue;
    return { x: bx, y: by, z: bz, block, place: lastAir };
  }
  return null;
}

function hasAdjacentWater(world: WorldGenerator, x: number, y: number, z: number): boolean {
  return (
    world.getBlockWorld(x + 1, y, z) === 4 ||
    world.getBlockWorld(x - 1, y, z) === 4 ||
    world.getBlockWorld(x, y, z + 1) === 4 ||
    world.getBlockWorld(x, y, z - 1) === 4 ||
    world.getBlockWorld(x, y + 1, z) === 4
  );
}

function findSafeSpawn(world: WorldGenerator, x: number, z: number) {
  let bestX = x, bestZ = z, bestY = world.getSpawnHeight(x, z), bestScore = -Infinity;
  for (let dz = -6; dz <= 6; dz += 2) {
    for (let dx = -6; dx <= 6; dx += 2) {
      const sx = x + dx, sz = z + dz;
      const sy = world.getSpawnHeight(sx, sz);
      const below = world.getBlockWorld(sx, sy - 1, sz);
      const score = sy - Math.abs(dx) * 0.08 - Math.abs(dz) * 0.08 - (below === 4 ? 2.5 : 0);
      if (score > bestScore) { bestScore = score; bestX = sx; bestY = sy; bestZ = sz; }
    }
  }
  return new THREE.Vector3(bestX + 0.5, bestY, bestZ + 0.5);
}

export default function MinecraftSandbox() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [seed] = useState(20260406);
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [health, setHealth] = useState(20);
  const healthRef = useRef(20);
  const [mobCount, setMobCount] = useState(0);
  const [thunderCooldownUI, setThunderCooldownUI] = useState(0);
  const [wandaHud, setWandaHud] = useState<null | {
    energy: number;
    shieldCd: number;
    ultCd: number;
    shieldActive: boolean;
    tkActive: boolean;
    tkRadius: number;
    tkCaptured: number;
    charging: number;
    mode: "idle" | "charging" | "telek_hold" | "flying" | "shielding" | "ultimate_cast";
  }>(null);
  const [weaponHud, setWeaponHud] = useState<null | {
    id: ItemId;
    label: string;
    ammo: number;
    mag: number;
    reloading: boolean;
    reloadFrac: number;
  }>(null);
  const [inventory, setInventory] = useState<InventorySlot[]>(() => {
    const base = Array.from({ length: 36 }, () => null) as InventorySlot[];
    base[0] = { item: "wanda_focus", count: 1 };
    return base;
  });
  const [craftGrid, setCraftGrid] = useState<CraftingCell[]>(() => Array.from({ length: 9 }, () => null));
  const [dragItem, setDragItem] = useState<{ source: "inv" | "craft"; index: number } | null>(null);
  const [cursorStack, setCursorStack] = useState<{ item: ItemId; count: number } | null>(null);
  const [showInventory, setShowInventory] = useState(false);
  const selectedSlotRef = useRef(0);
  const inventoryRef = useRef<InventorySlot[]>((() => {
    const base = Array.from({ length: 36 }, () => null) as InventorySlot[];
    base[0] = { item: "wanda_focus", count: 1 };
    return base;
  })());
  const showInventoryRef = useRef(false);
  useEffect(() => { selectedSlotRef.current = selectedSlot; }, [selectedSlot]);
  useEffect(() => { inventoryRef.current = inventory; }, [inventory]);
  useEffect(() => { showInventoryRef.current = showInventory; }, [showInventory]);
  useEffect(() => { healthRef.current = health; }, [health]);

  const craftResult = useMemo(() => matchingRecipe(craftGrid), [craftGrid]);

  const clickSlot = (source: "inv" | "craft", index: number, button: "left" | "right") => {
    const sourceSetter = source === "inv" ? setInventory : setCraftGrid;
    const maxStack = source === "inv" ? 99 : 64;
    sourceSetter((prevSlots) => {
      const nextSlots = [...prevSlots];
      const slot = nextSlots[index];
      let nextCursor = cursorStack ? { ...cursorStack } : null;
      if (button === "left") {
        if (!nextCursor) {
          if (!slot) return prevSlots;
          nextCursor = { item: slot.item, count: slot.count };
          nextSlots[index] = null;
        } else if (!slot) {
          nextSlots[index] = { item: nextCursor.item, count: nextCursor.count };
          nextCursor = null;
        } else if (slot.item === nextCursor.item) {
          const can = Math.min(maxStack - slot.count, nextCursor.count);
          if (can > 0) { nextSlots[index] = { item: slot.item, count: slot.count + can }; nextCursor.count -= can; }
          if (nextCursor.count <= 0) nextCursor = null;
        } else {
          nextSlots[index] = { item: nextCursor.item, count: nextCursor.count };
          nextCursor = { item: slot.item, count: slot.count };
        }
      } else {
        if (!nextCursor) {
          if (!slot) return prevSlots;
          const take = Math.ceil(slot.count / 2);
          nextCursor = { item: slot.item, count: take };
          const left = slot.count - take;
          nextSlots[index] = left > 0 ? { item: slot.item, count: left } : null;
        } else if (!slot) {
          nextSlots[index] = { item: nextCursor.item, count: 1 };
          nextCursor.count -= 1;
          if (nextCursor.count <= 0) nextCursor = null;
        } else if (slot.item === nextCursor.item && slot.count < maxStack) {
          nextSlots[index] = { item: slot.item, count: slot.count + 1 };
          nextCursor.count -= 1;
          if (nextCursor.count <= 0) nextCursor = null;
        }
      }
      setCursorStack(nextCursor);
      return nextSlots;
    });
  };

  const craftOne = () => {
    if (!craftResult) return;
    setCraftGrid((prev) => prev.map((cell) => {
      if (!cell) return null;
      return cell.count <= 1 ? null : { item: cell.item, count: cell.count - 1 };
    }));
    setInventory((prev) => addToInventoryState(prev, craftResult.recipe.output.item, craftResult.recipe.output.count));
  };

  const moveDragToCraft = (cellIdx: number) => {
    if (!dragItem || dragItem.source !== "inv") return;
    setInventory((prevInv) => {
      const slot = prevInv[dragItem.index];
      if (!slot) return prevInv;
      const nextInv = [...prevInv];
      if (slot.count <= 1) nextInv[dragItem.index] = null;
      else nextInv[dragItem.index] = { item: slot.item, count: slot.count - 1 };
      setCraftGrid((prevGrid) => {
        const next = [...prevGrid];
        const cur = next[cellIdx];
        if (cur && cur.item !== slot.item) return prevGrid;
        next[cellIdx] = cur ? { item: cur.item, count: Math.min(64, cur.count + 1) } : { item: slot.item, count: 1 };
        return next;
      });
      return nextInv;
    });
  };

  const moveDragToInventory = (invIdx: number) => {
    if (!dragItem) return;
    if (dragItem.source === "inv") {
      if (dragItem.index === invIdx) return;
      setInventory((prev) => {
        const next = [...prev];
        const a = next[dragItem.index];
        next[dragItem.index] = next[invIdx];
        next[invIdx] = a;
        return next;
      });
      return;
    }
    setCraftGrid((prevGrid) => {
      const cell = prevGrid[dragItem.index];
      if (!cell) return prevGrid;
      const nextGrid = [...prevGrid];
      if (cell.count <= 1) nextGrid[dragItem.index] = null;
      else nextGrid[dragItem.index] = { item: cell.item, count: cell.count - 1 };
      setInventory((prevInv) => {
        const nextInv = [...prevInv];
        const dst = nextInv[invIdx];
        if (!dst) nextInv[invIdx] = { item: cell.item, count: 1 };
        else if (dst.item === cell.item && dst.count < 99) nextInv[invIdx] = { item: dst.item, count: dst.count + 1 };
        else return prevInv;
        return nextInv;
      });
      return nextGrid;
    });
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#8fd6ff");
    scene.fog = new THREE.Fog(0x9fd9ff, 58, 255);

    const renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setPixelRatio(1);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.domElement.style.imageRendering = "pixelated";
    mount.appendChild(renderer.domElement);
    const bloomComposer = new EffectComposer(renderer);

    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 500);
    const world = new WorldGenerator(seed);
    const controller = new PlayerController(world);
    const unbindControls = controller.bind(renderer.domElement);
    const heldItemRoot = new THREE.Group();
    camera.add(heldItemRoot);
    scene.add(camera);
    let heldItemMesh: THREE.Object3D | null = null;
    let heldItemId: ItemId | null = null;
    let heldBowString: THREE.Line | null = null;
    let heldBowArrow: THREE.Mesh | null = null;
    let swingTime = 0;
    let bowDrawTime = 0;
    let isDrawingBow = false;
    let bowCooldown = 0;
    let thunderCooldown = 0;
    let rifleCooldown = 0;
    let smgCooldown = 0;
    let shotgunCooldown = 0;
    let smgHolding = false;
    let smgAutoTimer = 0;
    let gunKick = 0;
    let wandaCharging = false;
    let wandaPrimaryBeamHold = false;
    let wandaChargeTime = 0;
    let wandaShieldCd = 0;
    let wandaShieldTimer = 0;
    let wandaShieldAbsorb = 0;
    let wandaUltCd = 0;
    let wandaUltCastTimer = 0;
    let wandaUltAfterTimer = 0;
    const wandaUltCenter = new THREE.Vector3();
    let wandaEnergy = 100;
    let wandaFlyUp = false;
    let wandaDescend = false;
    let wandaTelekHold = false;
    let wandaFlightActive = false;
    let wandaTkDistance = 5.4;
    let wandaTkStrength = 24;
    let wandaTkRadius = 3.8;
    let wandaTkRange = 24;
    let wandaFlightLift = 0;
    let wandaFlightForward = 0;
    let wandaMode: "idle" | "charging" | "telek_hold" | "flying" | "shielding" | "ultimate_cast" = "idle";
    let wandaAudioReady = false;
    let wandaHumTarget = 0;
    let wandaLastMode = "idle";
    let wandaLastHudKey = "";
    const ENABLE_WANDA_HANDS = false;
    const handsRoot = new THREE.Group();
    camera.add(handsRoot);
    let leftHand: THREE.Object3D | null = null;
    let rightHand: THREE.Object3D | null = null;
    let wandaBeamActive = false;
    let wandaBeamShaderTime = 0;
    let wandaBeamIntensity = 0;
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(mount.clientWidth, mount.clientHeight),
      0.9,
      0.6,
      0.18
    );
    bloomComposer.addPass(renderPass);
    bloomComposer.addPass(bloomPass);

    const GUNS = {
      rifle: { mag: 12, reload: 1.35, fireCd: 0.18 },
      smg: { mag: 30, reload: 1.55, fireCd: 0.08 },
      shotgun: { mag: 6, reload: 1.95, fireCd: 0.6 },
    } as const;
    type GunId = keyof typeof GUNS;
    const gunState: Record<GunId, { ammo: number; reloadT: number; reloadMax: number }> = {
      rifle: { ammo: GUNS.rifle.mag, reloadT: 0, reloadMax: GUNS.rifle.reload },
      smg: { ammo: GUNS.smg.mag, reloadT: 0, reloadMax: GUNS.smg.reload },
      shotgun: { ammo: GUNS.shotgun.mag, reloadT: 0, reloadMax: GUNS.shotgun.reload },
    };
    let lastHudKey = "";
    const updateWeaponHud = () => {
      const cur = inventoryRef.current[selectedSlotRef.current]?.item ?? null;
      const isGun = cur === "rifle" || cur === "smg" || cur === "shotgun";
      if (!isGun) {
        if (lastHudKey !== "none") { lastHudKey = "none"; setWeaponHud(null); }
        return;
      }
      const id = cur as GunId;
      const st = gunState[id];
      const reloading = st.reloadT > 0;
      const reloadFrac = reloading ? 1 - st.reloadT / Math.max(0.001, st.reloadMax) : 0;
      const key = `${id}|${st.ammo}|${reloading ? st.reloadT.toFixed(2) : "0"}`;
      if (key === lastHudKey) return;
      lastHudKey = key;
      setWeaponHud({
        id: cur,
        label: itemLabel(cur),
        ammo: st.ammo,
        mag: GUNS[id].mag,
        reloading,
        reloadFrac,
      });
    };

    const startReload = (id: GunId) => {
      const st = gunState[id];
      if (st.reloadT > 0) return;
      if (st.ammo >= GUNS[id].mag) return;
      st.reloadMax = GUNS[id].reload;
      st.reloadT = st.reloadMax;
      updateWeaponHud();
    };

    // Screen shake state
    let screenShakeTimer = 0;
    let screenShakeIntensity = 0;

    const gltfLoader = new GLTFLoader();
    const mtlLoader = new MTLLoader();
    const objLoader = new OBJLoader();
    const modelCache = new Map<string, THREE.Object3D>();
    const modelPending = new Map<string, Promise<THREE.Object3D>>();
    const loadHandsModel = async (): Promise<THREE.Object3D> => {
      return new Promise((resolve, reject) => {
        gltfLoader.load(
          "/labs/minecraft/models/hands.glb",
          (gltf) => resolve(gltf.scene),
          undefined,
          (err) => reject(err)
        );
      });
    };
    const makeFallbackHand = (isLeft: boolean) => {
      const g = new THREE.Group();
      const skin = new THREE.MeshStandardMaterial({ color: "#f2c8a8", roughness: 0.56, metalness: 0.02 });
      const palm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.11), skin);
      const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.03), skin);
      thumb.position.set(isLeft ? -0.07 : 0.07, -0.005, 0.01);
      thumb.rotation.z = isLeft ? 0.45 : -0.45;
      g.add(palm);
      g.add(thumb);
      for (let i = 0; i < 4; i++) {
        const finger = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.05, 0.024), skin);
        finger.position.set((i - 1.5) * 0.028, 0.048, 0.018);
        g.add(finger);
      }
      return g;
    };
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const drawRadius =
      window.matchMedia("(max-width: 900px)").matches || (typeof memory === "number" && memory <= 4)
        ? Math.max(4, DRAW_RADIUS - 1)
        : DRAW_RADIUS;

    const hemi = new THREE.HemisphereLight(0xdaf0ff, 0x8aa66f, 0.95);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff3c4, 1.55);
    sun.position.set(115, 145, 55);
    scene.add(sun);
    const sunSphere = new THREE.Mesh(
      new THREE.SphereGeometry(8, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0xfff2a1 })
    );
    sunSphere.position.set(220, 170, -120);
    scene.add(sunSphere);

    const voxelMaterial = new THREE.MeshStandardMaterial({
      map: null, roughness: 0.86, metalness: 0.03, alphaTest: 0.1,
    });
    const waterMaterial = new THREE.MeshStandardMaterial({
      map: null, color: new THREE.Color("#7dc8ff"), roughness: 0.18, metalness: 0.02,
      transparent: true, opacity: 0.72, depthWrite: false,
    });

    const atlasCanvas = document.createElement("canvas");
    atlasCanvas.width = ATLAS_TILE_SIZE * ATLAS_TILES;
    atlasCanvas.height = ATLAS_TILE_SIZE;
    const atlasCtx = atlasCanvas.getContext("2d");
    const atlasTexture = new THREE.CanvasTexture(atlasCanvas);
    atlasTexture.magFilter = THREE.NearestFilter;
    atlasTexture.minFilter = THREE.NearestFilter;
    atlasTexture.wrapS = THREE.ClampToEdgeWrapping;
    atlasTexture.wrapT = THREE.ClampToEdgeWrapping;
    atlasTexture.colorSpace = THREE.SRGBColorSpace;
    atlasTexture.generateMipmaps = false;
    atlasTexture.anisotropy = 1;
    voxelMaterial.map = atlasTexture;
    voxelMaterial.needsUpdate = true;

    const waterCanvas = document.createElement("canvas");
    waterCanvas.width = 64; waterCanvas.height = 64;
    const waterCtx = waterCanvas.getContext("2d");
    if (waterCtx) {
      const img = waterCtx.createImageData(64, 64);
      const d = img.data;
      for (let y = 0; y < 64; y++) {
        for (let x = 0; x < 64; x++) {
          const n = makeNoise(121, x * 1.2, y * 1.2) * 0.55 + makeNoise(151, x * 0.5, y * 0.5) * 0.45;
          const i = (y * 64 + x) * 4;
          d[i] = 72 + n * 34; d[i + 1] = 140 + n * 36; d[i + 2] = 186 + n * 52; d[i + 3] = 190;
        }
      }
      waterCtx.putImageData(img, 0, 0);
    }
    const waterTex = new THREE.CanvasTexture(waterCanvas);
    waterTex.magFilter = THREE.NearestFilter;
    waterTex.minFilter = THREE.NearestFilter;
    waterTex.wrapS = THREE.RepeatWrapping;
    waterTex.wrapT = THREE.RepeatWrapping;
    waterTex.colorSpace = THREE.SRGBColorSpace;
    waterTex.generateMipmaps = false;
    waterMaterial.map = waterTex;
    waterMaterial.needsUpdate = true;

    if (atlasCtx) {
      atlasCtx.clearRect(0, 0, atlasCanvas.width, atlasCanvas.height);
      atlasCtx.imageSmoothingEnabled = false;
      const drawTile = (tile: number, kind: Parameters<typeof makeProceduralTile>[1]) => {
        atlasCtx.drawImage(makeProceduralTile(ATLAS_TILE_SIZE, kind), tile * ATLAS_TILE_SIZE, 0);
      };
      drawTile(TILE_INDEX.grassTop, "grassTop");
      drawTile(TILE_INDEX.grassSide, "grassSide");
      drawTile(TILE_INDEX.dirt, "dirt");
      drawTile(TILE_INDEX.stone, "stone");
      drawTile(TILE_INDEX.sand, "sand");
      drawTile(TILE_INDEX.logSide, "logSide");
      drawTile(TILE_INDEX.logTop, "logTop");
      drawTile(TILE_INDEX.leaves, "leaves");
      drawTile(TILE_INDEX.gravel, "gravel");
      drawTile(TILE_INDEX.clay, "clay");
      drawTile(TILE_INDEX.redSand, "redSand");
      drawTile(TILE_INDEX.moss, "moss");
      atlasTexture.needsUpdate = true;
    }

    const chunkGroup = new THREE.Group();
    scene.add(chunkGroup);
    const dropGroup = new THREE.Group();
    scene.add(dropGroup);
    const mobGroup = new THREE.Group();
    scene.add(mobGroup);
    const activeChunks = new Map<string, ChunkRender>();
    const dirtyChunks = new Set<string>();
    const waterQueue: Array<{ x: number; y: number; z: number }> = [];
    const waterQueued = new Set<string>();

    const drops: Array<{ item: ItemId; mesh: THREE.Mesh; velocity: THREE.Vector3; age: number }> = [];

    // Extended mob type with health bar and ranged attack
    const mobs: Array<{
      mesh: THREE.Group;
      pupils: [THREE.Mesh, THREE.Mesh];
      burnOverlay: THREE.Mesh;
      healthBarBg: THREE.Mesh;
      healthBarFill: THREE.Mesh;
      velocity: THREE.Vector3;
      wanderYaw: number;
      wanderTimer: number;
      jumpTimer: number;
      attackCooldown: number;
      rangedCooldown: number;
      shadowTeleportCooldown: number;
      health: number;
      maxHealth: number;
      burnTimer: number;
      burnTickTimer: number;
      fireVfx: THREE.Group | null;
      kind: "slime" | "boar" | "inferno" | "aqua" | "shadow" | "storm" | "brine";
    }> = [];

    // Mob projectiles (fireballs, water blobs)
    const mobProjectiles: Array<{
      mesh: THREE.Mesh;
      trail: THREE.Mesh[];
      velocity: THREE.Vector3;
      life: number;
      damage: number;
      fire: boolean;
      water: boolean;
      captureKind: "none" | "telek" | "shield";
      captureAngle: number;
    }> = [];

    const arrows: Array<{
      mesh: THREE.Group;
      trail: THREE.Vector3[];
      trailMesh: THREE.Line | null;
      velocity: THREE.Vector3;
      life: number;
      damage: number;
      fire: boolean;
      water: boolean;
      gravityScale: number;
      splashRadius: number;
    }> = [];

    // Thunder lightning effects
    const lightningEffects: Array<{
      mesh: THREE.Group;
      ttl: number;
    }> = [];
    const lightningGroup = new THREE.Group();
    scene.add(lightningGroup);

    const fireGroup = new THREE.Group();
    scene.add(fireGroup);
    const splashGroup = new THREE.Group();
    scene.add(splashGroup);
    const wandaGroup = new THREE.Group();
    scene.add(wandaGroup);
    const burningQueue: Array<{ x: number; y: number; z: number }> = [];
    const burningSet = new Set<string>();
    const burningCells = new Map<string, {
      x: number; y: number; z: number;
      ttl: number; spreadCooldown: number;
      mesh: THREE.Group; emberOverlay: THREE.Mesh;
    }>();

    // Extended water splash type for expanding rings
    const waterSplashes: Array<{
      mesh: THREE.Mesh;
      ttl: number;
      maxTtl: number;
      expanding: boolean;
      targetScale: number;
    }> = [];
    const pendingWaterBursts: Array<{ timer: number; seeds: Array<{ x: number; y: number; z: number }> }> = [];
    const wandaBolts: Array<{
      mesh: THREE.Group;
      trail: THREE.Line;
      velocity: THREE.Vector3;
      life: number;
      damage: number;
      splash: number;
    }> = [];
    const wandaBursts: Array<{ mesh: THREE.Mesh; ttl: number; max: number; scale: number }> = [];
    const wandaRings: Array<{ mesh: THREE.Mesh; ttl: number; max: number; grow: number }> = [];
    const wandaTethers: Array<{ mesh: THREE.Line; ttl: number; max: number }> = [];
    const handAuraL = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 12, 12),
      new THREE.MeshBasicMaterial({ color: "#9f1239", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    const handAuraR = handAuraL.clone();
    wandaGroup.add(handAuraL);
    wandaGroup.add(handAuraR);
    const makeWandaShieldShaderMaterial = () =>
      new THREE.ShaderMaterial({
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: 0.0 },
          uColorA: { value: new THREE.Color("#450a0a") },
          uColorB: { value: new THREE.Color("#9f1239") },
        },
        vertexShader: `
          varying vec3 vWorldPos;
          varying vec3 vWorldNormal;
          varying vec2 vUv;
          void main() {
            vUv = uv;
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            vWorldPos = worldPos.xyz;
            vWorldNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * viewMatrix * worldPos;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform float uOpacity;
          uniform vec3 uColorA;
          uniform vec3 uColorB;
          varying vec3 vWorldPos;
          varying vec3 vWorldNormal;
          varying vec2 vUv;

          float hash(vec3 p) {
            p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
            p *= 17.0;
            return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
          }
          float noise3D(vec3 p) {
            vec3 i = floor(p);
            vec3 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            float n000 = hash(i + vec3(0.0, 0.0, 0.0));
            float n100 = hash(i + vec3(1.0, 0.0, 0.0));
            float n010 = hash(i + vec3(0.0, 1.0, 0.0));
            float n110 = hash(i + vec3(1.0, 1.0, 0.0));
            float n001 = hash(i + vec3(0.0, 0.0, 1.0));
            float n101 = hash(i + vec3(1.0, 0.0, 1.0));
            float n011 = hash(i + vec3(0.0, 1.0, 1.0));
            float n111 = hash(i + vec3(1.0, 1.0, 1.0));
            float nx00 = mix(n000, n100, f.x);
            float nx10 = mix(n010, n110, f.x);
            float nx01 = mix(n001, n101, f.x);
            float nx11 = mix(n011, n111, f.x);
            float nxy0 = mix(nx00, nx10, f.y);
            float nxy1 = mix(nx01, nx11, f.y);
            return mix(nxy0, nxy1, f.z);
          }
          float fbm(vec3 p) {
            float v = 0.0;
            float a = 0.5;
            for (int i = 0; i < 5; i++) {
              v += a * noise3D(p);
              p *= 2.03;
              a *= 0.5;
            }
            return v;
          }
          void main() {
            vec3 V = normalize(cameraPosition - vWorldPos);
            vec3 N = normalize(vWorldNormal);
            float fresnel = pow(1.0 - max(dot(V, N), 0.0), 3.0);
            vec3 flowP = vWorldPos * 1.8 + vec3(0.0, uTime * 0.9, 0.0);
            float e1 = fbm(flowP);
            float e2 = fbm(flowP * 1.9 + vec3(uTime * 0.4, 0.0, -uTime * 0.35));
            float energy = smoothstep(0.35, 0.9, 0.55 * e1 + 0.45 * e2);
            float filaments = smoothstep(0.55, 1.0, sin((vUv.y + uTime * 0.22) * 40.0) * 0.5 + 0.5);
            vec3 col = mix(uColorA, uColorB, clamp(energy * 0.9 + filaments * 0.2, 0.0, 1.0));
            float alpha = (fresnel * (0.18 + energy * 0.65) + energy * 0.08) * uOpacity;
            gl_FragColor = vec4(col, alpha);
          }
        `,
      });

    const wandaShieldBubble = new THREE.Mesh(
      new THREE.SphereGeometry(0.95, 48, 48),
      makeWandaShieldShaderMaterial()
    );
    wandaGroup.add(wandaShieldBubble);
    const wandaShieldRingA = new THREE.Mesh(
      new THREE.TorusGeometry(1.15, 0.045, 16, 72),
      makeWandaShieldShaderMaterial()
    );
    const wandaShieldRingB = wandaShieldRingA.clone();
    wandaShieldRingA.rotation.x = Math.PI / 2;
    wandaShieldRingB.rotation.z = Math.PI / 2;
    wandaGroup.add(wandaShieldRingA);
    wandaGroup.add(wandaShieldRingB);
    const wandaHeatWaves: Array<{ mesh: THREE.Mesh; ttl: number; max: number; baseScale: number }> = [];
    const sigilCanvas = document.createElement("canvas");
    sigilCanvas.width = 256;
    sigilCanvas.height = 256;
    const sigilCtx = sigilCanvas.getContext("2d");
    if (sigilCtx) {
      sigilCtx.clearRect(0, 0, 256, 256);
      sigilCtx.translate(128, 128);
      sigilCtx.strokeStyle = "rgba(180,30,40,0.92)";
      sigilCtx.lineWidth = 2.2;
      for (let i = 0; i < 3; i++) {
        sigilCtx.beginPath();
        sigilCtx.arc(0, 0, 52 + i * 20, 0, Math.PI * 2);
        sigilCtx.stroke();
      }
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        sigilCtx.beginPath();
        sigilCtx.moveTo(Math.cos(a) * 28, Math.sin(a) * 28);
        sigilCtx.lineTo(Math.cos(a) * 92, Math.sin(a) * 92);
        sigilCtx.stroke();
      }
      sigilCtx.rotate(Math.PI / 10);
      sigilCtx.strokeStyle = "rgba(140,28,36,0.82)";
      sigilCtx.beginPath();
      sigilCtx.arc(0, 0, 76, 0, Math.PI * 2);
      sigilCtx.stroke();
    }
    const sigilTex = new THREE.CanvasTexture(sigilCanvas);
    sigilTex.colorSpace = THREE.SRGBColorSpace;
    sigilTex.needsUpdate = true;
    const handSigilL = new THREE.Mesh(
      new THREE.PlaneGeometry(0.34, 0.34),
      new THREE.MeshBasicMaterial({ map: sigilTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    const handSigilR = handSigilL.clone();
    wandaGroup.add(handSigilL);
    wandaGroup.add(handSigilR);
    type BeamHit = ReturnType<typeof raycastVoxel>;
    type WandaBeamVisual = {
      curve: THREE.CatmullRomCurve3;
      mesh: THREE.Mesh;
      halo: THREE.Mesh;
      breakKey: string;
      breakTimer: number;
      wigglePhase: number;
      wigglePhaseB: number;
      wiggleSpeed: number;
      wiggleSpeedB: number;
      wiggleAmp: number;
    };
    const makeWandaBeamShaderMaterial = () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uIntensity: { value: 0 },
          uColorA: { value: new THREE.Color("#520014") },
          uColorB: { value: new THREE.Color("#c1002f") },
        },
        vertexShader: `
          uniform float uTime;
          uniform float uIntensity;
          varying vec2 vUv;
          void main() {
            vUv = uv;
            vec3 p = position;
            float wobble = sin((uv.y * 30.0) + uTime * 22.0) * 0.015 * uIntensity;
            p.x += wobble;
            p.y += cos((uv.y * 24.0) + uTime * 17.0) * 0.01 * uIntensity;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform float uIntensity;
          uniform vec3 uColorA;
          uniform vec3 uColorB;
          varying vec2 vUv;
          void main() {
            float edge = abs(vUv.x - 0.5) * 2.0;
            float core = smoothstep(1.0, 0.04, edge);
            float smoke = 0.62 + 0.55 * sin((vUv.y * 18.0) - uTime * 7.0 + edge * 10.0);
            float pulse = 0.65 + 0.35 * sin((vUv.y * 30.0) - uTime * 14.0);
            vec3 col = mix(uColorA, uColorB, 0.35 + 0.55 * pulse);
            float alpha = core * smoke * (0.44 + uIntensity * 1.35);
            gl_FragColor = vec4(col, alpha);
          }
        `,
      });
    const makeBeamVisual = (): WandaBeamVisual => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(),
        new THREE.Vector3(0, 0, -1),
        new THREE.Vector3(0, 0, -2),
        new THREE.Vector3(0, 0, -3),
      ]);
      const mesh = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 36, 0.062, 12, false),
        makeWandaBeamShaderMaterial()
      );
      mesh.visible = false;
      wandaGroup.add(mesh);
      const halo = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 30, 0.118, 10, false),
        new THREE.MeshBasicMaterial({ color: "#7a001f", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      halo.visible = false;
      wandaGroup.add(halo);
      return {
        curve,
        mesh,
        halo,
        breakKey: "",
        breakTimer: 0,
        wigglePhase: Math.random() * Math.PI * 2,
        wigglePhaseB: Math.random() * Math.PI * 2,
        wiggleSpeed: 5 + Math.random() * 16,
        wiggleSpeedB: 6 + Math.random() * 18,
        wiggleAmp: 0.1 + Math.random() * 0.2,
      };
    };
    const wandaBeamVisuals: WandaBeamVisual[] = [makeBeamVisual()];
    const ensureBeamVisualCount = (count: number) => {
      while (wandaBeamVisuals.length < count) wandaBeamVisuals.push(makeBeamVisual());
      for (let i = count; i < wandaBeamVisuals.length; i++) {
        wandaBeamVisuals[i].mesh.visible = false;
        wandaBeamVisuals[i].halo.visible = false;
        wandaBeamVisuals[i].breakKey = "";
        wandaBeamVisuals[i].breakTimer = 0;
      }
    };
    const wandaBeamImpacts: Array<{ mesh: THREE.Mesh; ttl: number; max: number }> = [];

    const audioCtor = (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
    let wandaAudioCtx: AudioContext | null = null;
    let wandaMasterGain: GainNode | null = null;
    let wandaHumOsc: OscillatorNode | null = null;
    let wandaHumGain: GainNode | null = null;
    const ensureWandaAudio = () => {
      if (!audioCtor || wandaAudioReady) return;
      wandaAudioCtx = new audioCtor();
      wandaMasterGain = wandaAudioCtx.createGain();
      wandaMasterGain.gain.value = 0.04;
      wandaMasterGain.connect(wandaAudioCtx.destination);
      wandaHumOsc = wandaAudioCtx.createOscillator();
      wandaHumGain = wandaAudioCtx.createGain();
      wandaHumOsc.type = "triangle";
      wandaHumOsc.frequency.value = 92;
      wandaHumGain.gain.value = 0;
      wandaHumOsc.connect(wandaHumGain);
      wandaHumGain.connect(wandaMasterGain);
      wandaHumOsc.start();
      wandaAudioReady = true;
    };
    const wandaTone = (freq: number, dur = 0.14, type: OscillatorType = "sine", vol = 0.08) => {
      if (!wandaAudioCtx || !wandaMasterGain) return;
      const osc = wandaAudioCtx.createOscillator();
      const g = wandaAudioCtx.createGain();
      const t0 = wandaAudioCtx.currentTime;
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      osc.frequency.exponentialRampToValueAtTime(Math.max(45, freq * 0.7), t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g);
      g.connect(wandaMasterGain);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    };
    const spawnHeatWave = (x: number, y: number, z: number, scale = 1) => {
      const mat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uAlpha: { value: 0.35 },
          uColor: { value: new THREE.Color("#9f1239") },
        },
        vertexShader: `
          uniform float uTime;
          varying vec2 vUv;
          void main() {
            vUv = uv;
            vec3 p = position;
            float n = sin((p.x + p.y) * 16.0 + uTime * 10.0) * 0.03;
            p.z += n;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uAlpha;
          uniform vec3 uColor;
          varying vec2 vUv;
          void main() {
            vec2 c = vUv - 0.5;
            float r = length(c);
            float ring = smoothstep(0.48, 0.12, r);
            float shimmer = 0.75 + 0.25 * sin((vUv.x + vUv.y) * 30.0);
            gl_FragColor = vec4(uColor, uAlpha * ring * shimmer);
          }
        `,
      });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.7 * scale, 0.7 * scale), mat);
      m.position.set(x, y, z);
      wandaGroup.add(m);
      wandaHeatWaves.push({ mesh: m, ttl: 0.34 + scale * 0.1, max: 0.34 + scale * 0.1, baseScale: scale });
    };
    type TkHeldTarget =
      | { kind: "mob"; ref: (typeof mobs)[number]; anchor: THREE.Vector3; weight: number }
      | { kind: "drop"; ref: (typeof drops)[number]; anchor: THREE.Vector3; weight: number };
    type TkMeteorHeld = { root: THREE.Group; items: Map<ItemId, number>; mass: number };
    type TkMeteorFlying = { mesh: THREE.Group; velocity: THREE.Vector3; items: Map<ItemId, number>; mass: number; life: number; prevPos: THREE.Vector3 };
    let tkMeteorHeld: TkMeteorHeld | null = null;
    const tkMeteorFlying: TkMeteorFlying[] = [];

    const addWandaTkGlow = (obj: THREE.Object3D, scale: number) => {
      if (obj.userData.wandaTkGlow) return;
      const g = new THREE.Mesh(
        new THREE.SphereGeometry(1, 14, 14),
        new THREE.MeshBasicMaterial({ color: "#9f1239", transparent: true, opacity: 0.26, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      g.scale.setScalar(scale);
      g.renderOrder = 2;
      obj.add(g);
      obj.userData.wandaTkGlow = g;
    };
    const removeWandaTkGlow = (obj: THREE.Object3D) => {
      const g = obj.userData.wandaTkGlow as THREE.Mesh | undefined;
      if (!g) return;
      obj.remove(g);
      g.geometry.dispose();
      (g.material as THREE.Material).dispose();
      delete obj.userData.wandaTkGlow;
    };

    const disposeTkMeteorHeld = () => {
      if (!tkMeteorHeld) return;
      wandaGroup.remove(tkMeteorHeld.root);
      tkMeteorHeld.root.traverse((ch) => {
        if (ch instanceof THREE.Mesh) {
          ch.geometry.dispose();
          (ch.material as THREE.Material).dispose();
        }
      });
      tkMeteorHeld = null;
    };

    const meteorVisualScale = (mass: number) =>
      0.48 + Math.min(2.15, Math.pow(Math.max(1, mass), 0.3) * 0.34);
    const meteorBlastRadius = (mass: number) =>
      2.6 + Math.min(14, Math.pow(Math.max(1, mass), 0.48) * 2.35);

    const rebuildMeteorHeldMesh = (held: TkMeteorHeld) => {
      removeWandaTkGlow(held.root);
      held.root.clear();
      const maxVis = 72;
      const entries: Array<{ item: ItemId; block: BlockType }> = [];
      for (const [item, count] of held.items) {
        const b = fromBlockItem(item);
        if (b === null || b === 4) continue;
        for (let c = 0; c < count; c++) entries.push({ item, block: b });
      }
      const total = entries.length;
      const step = Math.max(1, Math.ceil(total / maxVis));
      for (let i = 0; i < total; i += step) {
        const { block } = entries[i];
        const bc = colorForBlock(block);
        const m = new THREE.Mesh(
          new THREE.BoxGeometry(0.26, 0.26, 0.26),
          new THREE.MeshStandardMaterial({
            color: bc,
            roughness: 0.5,
            metalness: 0.08,
            emissive: bc.clone().multiplyScalar(0.22),
            emissiveIntensity: 0.4,
          })
        );
        const phi = Math.acos(2 * Math.random() - 1);
        const theta = Math.random() * Math.PI * 2;
        const rad = 0.14 + Math.cbrt(held.mass) * 0.15;
        m.position.set(rad * Math.sin(phi) * Math.cos(theta), rad * Math.sin(phi) * Math.sin(theta), rad * Math.cos(phi));
        m.rotation.set(Math.random() * 0.8, Math.random() * 0.8, Math.random() * 0.8);
        held.root.add(m);
      }
      if (held.root.children.length === 0 && held.mass > 0) {
        const m = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.35 + Math.min(0.95, held.mass * 0.038), 1),
          new THREE.MeshStandardMaterial({ color: "#5c0a12", roughness: 0.4, metalness: 0.1, emissive: new THREE.Color("#b91c1c"), emissiveIntensity: 0.45 })
        );
        held.root.add(m);
      }
      held.root.scale.setScalar(meteorVisualScale(held.mass));
      addWandaTkGlow(held.root, 0.5 + Math.min(0.42, held.mass * 0.022));
    };

    const mergeDropIntoMeteor = (d: (typeof drops)[number]): boolean => {
      const block = fromBlockItem(d.item);
      if (block === null || block === 4) return false;
      const idx = drops.indexOf(d);
      if (idx < 0) return false;
      drops.splice(idx, 1);
      dropGroup.remove(d.mesh);
      (d.mesh.geometry as THREE.BufferGeometry).dispose();
      (d.mesh.material as THREE.Material).dispose();
      if (!tkMeteorHeld) {
        tkMeteorHeld = { root: new THREE.Group(), items: new Map(), mass: 0 };
        wandaGroup.add(tkMeteorHeld.root);
      }
      const prev = tkMeteorHeld.items.get(d.item) ?? 0;
      tkMeteorHeld.items.set(d.item, prev + 1);
      tkMeteorHeld.mass += 1;
      rebuildMeteorHeldMesh(tkMeteorHeld);
      return true;
    };

    const scatterTkMeteorHeldToDrops = (cx: number, cy: number, cz: number) => {
      if (!tkMeteorHeld || tkMeteorHeld.mass <= 0) return;
      for (const [item, count] of tkMeteorHeld.items) {
        for (let i = 0; i < count; i++) spawnDrop(item, cx + (Math.random() - 0.5) * 0.8, cy, cz + (Math.random() - 0.5) * 0.8);
      }
      disposeTkMeteorHeld();
    };

    const disposeScatterTkMeteorFlying = (m: TkMeteorFlying, cx: number, cy: number, cz: number, blastRadius: number) => {
      const scatterR = Math.max(2, blastRadius * 0.92);
      const ix = Math.floor(cx);
      const iz = Math.floor(cz);
      const baseGround = findGroundY(ix, iz);
      const baseY = baseGround !== null ? baseGround : Math.floor(cy);

      for (const [item, count] of m.items) {
        const block = fromBlockItem(item);
        for (let i = 0; i < count; i++) {
          let placed = false;
          for (let attempt = 0; attempt < 10; attempt++) {
            const ang = Math.random() * Math.PI * 2;
            const rr = Math.random() * scatterR;
            const gx = Math.floor(cx + Math.cos(ang) * rr);
            const gz = Math.floor(cz + Math.sin(ang) * rr);
            const py = findGroundY(gx, gz);
            if (py === null || block === null || block === 4) break;
            if (world.getBlockWorld(gx, py, gz) !== 0) continue;
            if (world.setBlockWorld(gx, py, gz, block)) {
              markWorldPosDirty(gx, gz);
              placed = true;
              break;
            }
          }
          if (!placed) {
            const ox = cx + (Math.random() - 0.5) * Math.min(4, scatterR * 0.5);
            const oz = cz + (Math.random() - 0.5) * Math.min(4, scatterR * 0.5);
            const py = findGroundY(Math.floor(ox), Math.floor(oz));
            const dropY = py !== null ? py : baseY;
            spawnDrop(item, ox, dropY, oz);
          }
        }
      }
      m.mesh.parent?.remove(m.mesh);
      m.mesh.traverse((ch) => {
        if (ch instanceof THREE.Mesh) {
          ch.geometry.dispose();
          (ch.material as THREE.Material).dispose();
        }
      });
    };

    const tkField = {
      active: false,
      center: new THREE.Vector3(),
      radius: wandaTkRadius,
      releaseCharge: 0,
      captured: [] as TkHeldTarget[],
    };
    const tkFieldPreviewMaterial = new THREE.MeshPhysicalMaterial({
      color: "#ffffff",
      transmission: 1,
      transparent: true,
      opacity: 0.09,
      roughness: 0.12,
      metalness: 0.0,
      attenuationColor: new THREE.Color("#5c0a12"),
      attenuationDistance: 3.2,
      ior: 1.18,
      thickness: 0.55,
      side: THREE.DoubleSide,
    });
    let tkFieldPreviewTimeUniform: { value: number } | null = null;
    tkFieldPreviewMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      tkFieldPreviewTimeUniform = shader.uniforms.uTime as { value: number };
      shader.vertexShader = `
        uniform float uTime;
      ` + shader.vertexShader.replace(
        "#include <begin_vertex>",
        `
        #include <begin_vertex>
        float nA = sin((position.y + uTime * 1.6) * 7.0 + position.x * 5.0);
        float nB = cos((position.x - uTime * 1.1) * 9.0 + position.z * 4.0);
        transformed += normal * ((nA + nB) * 0.018);
        `
      );
    };
    const tkFieldPreview = new THREE.Mesh(
      new THREE.SphereGeometry(1, 40, 40),
      tkFieldPreviewMaterial
    );
    wandaGroup.add(tkFieldPreview);

    const Q = Quarks as unknown as Record<string, any>;
    const quarksRenderer = new Q.BatchedRenderer();
    wandaGroup.add(quarksRenderer);
    const makeParticleSprite = (inner: string, outer: string) => {
      const c = document.createElement("canvas");
      c.width = 128; c.height = 128;
      const ctx = c.getContext("2d");
      if (!ctx) return new THREE.Texture();
      const g = ctx.createRadialGradient(64, 64, 6, 64, 64, 62);
      g.addColorStop(0, inner);
      g.addColorStop(0.4, outer);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.needsUpdate = true;
      return t;
    };
    const makeQuarkSystem = (rate: number, inner: string, outer: string, sizeMin: number, sizeMax: number) => {
      const mat = new THREE.MeshBasicMaterial({
        map: makeParticleSprite(inner, outer),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const ps = new Q.ParticleSystem({
        looping: true,
        duration: 1.2,
        worldSpace: true,
        shape: new Q.SphereEmitter({ radius: 0.18, thickness: 0.6 }),
        startLife: new Q.IntervalValue(0.2, 0.85),
        startSpeed: new Q.IntervalValue(0.25, 2.2),
        startSize: new Q.IntervalValue(sizeMin, sizeMax),
        emissionOverTime: new Q.ConstantValue(rate),
        material: mat,
      });
      quarksRenderer.addSystem(ps);
      wandaGroup.add(ps.emitter);
      return { ps, mat };
    };
    const quarkCharge = makeQuarkSystem(0, "rgba(220,60,55,0.92)", "rgba(120,20,28,0.78)", 0.04, 0.13);
    const quarkTelek = makeQuarkSystem(0, "rgba(200,45,42,0.88)", "rgba(90,14,22,0.82)", 0.05, 0.16);
    const quarkShield = makeQuarkSystem(0, "rgba(210,70,65,0.9)", "rgba(100,18,26,0.76)", 0.04, 0.12);
    const quarkUlt = makeQuarkSystem(0, "rgba(235,85,72,0.95)", "rgba(140,24,32,0.82)", 0.08, 0.22);
    const quarkBeamMuzzle = makeQuarkSystem(0, "rgba(230,75,62,0.94)", "rgba(110,20,28,0.84)", 0.05, 0.14);
    const quarkBeamTrail = makeQuarkSystem(0, "rgba(200,55,48,0.9)", "rgba(95,16,24,0.78)", 0.03, 0.09);

    const setQuarkRate = (sys: { ps: any }, rate: number) => {
      sys.ps.emissionOverTime = new Q.ConstantValue(rate);
    };
    const spawnBeamImpact = (pos: THREE.Vector3, power: number) => {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.14 + power * 0.11, 12, 12),
        new THREE.MeshBasicMaterial({ color: "#3f0a0e", transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      m.position.copy(pos);
      wandaGroup.add(m);
      wandaBeamImpacts.push({ mesh: m, ttl: 0.18 + power * 0.08, max: 0.18 + power * 0.08 });
    };
    if (ENABLE_WANDA_HANDS) {
      loadHandsModel().then((base) => {
        const lh = base.clone(true);
        const rh = base.clone(true);
        lh.traverse((obj) => {
          if (!(obj instanceof THREE.Mesh)) return;
          obj.material = new THREE.MeshStandardMaterial({ color: "#f3c4a6", roughness: 0.62, metalness: 0.02 });
        });
        rh.traverse((obj) => {
          if (!(obj instanceof THREE.Mesh)) return;
          obj.material = new THREE.MeshStandardMaterial({ color: "#f3c4a6", roughness: 0.62, metalness: 0.02 });
        });
        lh.scale.set(0.28, 0.28, 0.28);
        rh.scale.set(0.28, 0.28, 0.28);
        lh.position.set(-0.24, -0.34, -0.34);
        rh.position.set(0.24, -0.34, -0.34);
        rh.scale.x *= -1;
        handsRoot.add(lh);
        handsRoot.add(rh);
        leftHand = lh;
        rightHand = rh;
      }).catch(() => {
        const lh = makeFallbackHand(true);
        const rh = makeFallbackHand(false);
        lh.position.set(-0.24, -0.34, -0.34);
        rh.position.set(0.24, -0.34, -0.34);
        handsRoot.add(lh);
        handsRoot.add(rh);
        leftHand = lh;
        rightHand = rh;
      });
    }

    const tryAddToInventory = (item: ItemId): boolean => {
      const prev = inventoryRef.current;
      const next = [...prev];
      let target = next.findIndex((s) => s?.item === item && (s?.count ?? 0) < 99);
      if (target === -1) target = next.findIndex((s) => s === null);
      if (target === -1) return false;
      const cur = next[target];
      next[target] = cur ? { item, count: Math.min(99, cur.count + 1) } : { item, count: 1 };
      inventoryRef.current = next;
      setInventory(next);
      return true;
    };

    const consumeSelectedOne = (): ItemId | null => {
      const slot = selectedSlotRef.current;
      const cur = inventoryRef.current[slot];
      if (!cur) return null;
      const next = [...inventoryRef.current];
      if (cur.count <= 1) next[slot] = null;
      else next[slot] = { item: cur.item, count: cur.count - 1 };
      inventoryRef.current = next;
      setInventory(next);
      return cur.item;
    };

    const spawnDrop = (item: ItemId, x: number, y: number, z: number) => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.32, 0.32),
        new THREE.MeshStandardMaterial({ color: itemColor(item), roughness: 0.46, metalness: 0.06 })
      );
      mesh.position.set(x + 0.5, y + 0.45, z + 0.5);
      dropGroup.add(mesh);
      drops.push({
        item, mesh,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 1.2, 2.5, (Math.random() - 0.5) * 1.2),
        age: 0,
      });
    };

    const spawnWandaBurst = (x: number, y: number, z: number, power = 1) => {
      const burst = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 14, 14),
        new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          uniforms: {
            uColorA: { value: new THREE.Color("#7f1d1d") },
            uColorB: { value: new THREE.Color("#dc2626") },
            uIntensity: { value: 1.0 + power * 0.4 },
          },
          vertexShader: `
            varying vec3 vNormalW;
            varying vec3 vPosW;
            void main() {
              vNormalW = normalize(normalMatrix * normal);
              vec4 worldPos = modelMatrix * vec4(position, 1.0);
              vPosW = worldPos.xyz;
              gl_Position = projectionMatrix * viewMatrix * worldPos;
            }
          `,
          fragmentShader: `
            varying vec3 vNormalW;
            varying vec3 vPosW;
            uniform vec3 uColorA;
            uniform vec3 uColorB;
            uniform float uIntensity;
            void main() {
              vec3 V = normalize(cameraPosition - vPosW);
              float fres = pow(1.0 - abs(dot(V, normalize(vNormalW))), 2.2);
              vec3 col = mix(uColorA, uColorB, fres);
              float alpha = clamp((0.18 + fres * 0.9) * uIntensity * 0.55, 0.0, 1.0);
              gl_FragColor = vec4(col, alpha);
            }
          `,
        })
      );
      burst.position.set(x, y, z);
      wandaGroup.add(burst);
      wandaBursts.push({ mesh: burst, ttl: 0.32 + power * 0.08, max: 0.32 + power * 0.08, scale: 1.4 + power * 1.8 });

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.18, 0.045, 8, 26),
        new THREE.MeshBasicMaterial({ color: "#9f1239", transparent: true, opacity: 0.72, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      ring.position.set(x, y, z);
      ring.rotation.x = Math.PI / 2;
      wandaGroup.add(ring);
      wandaRings.push({ mesh: ring, ttl: 0.26 + power * 0.06, max: 0.26 + power * 0.06, grow: 1.4 + power * 1.5 });
      spawnHeatWave(x, y, z, 0.8 + power * 0.4);
    };

    const castWandaBolt = (charge: number) => {
      const origin = controller.getViewPosition(new THREE.Vector3());
      const dir = controller.getCameraDirection(new THREE.Vector3()).normalize();
      const mesh = new THREE.Group();
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.09 + charge * 0.06, 12, 12),
        new THREE.MeshBasicMaterial({ color: "#991b1b", transparent: true, opacity: 0.86, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.16 + charge * 0.1, 12, 12),
        new THREE.MeshBasicMaterial({ color: "#7f1d1d", transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      mesh.add(halo);
      mesh.add(core);
      mesh.position.copy(origin).addScaledVector(dir, 0.58);
      wandaGroup.add(mesh);
      const trail = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([mesh.position.clone(), mesh.position.clone()]),
        new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          uniforms: {
            uColorA: { value: new THREE.Color("#7f1d1d") },
            uColorB: { value: new THREE.Color("#dc2626") },
            uOpacity: { value: 0.68 },
          },
          vertexShader: `
            varying float vT;
            void main() {
              vT = position.y;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform vec3 uColorA;
            uniform vec3 uColorB;
            uniform float uOpacity;
            varying float vT;
            void main() {
              vec3 col = mix(uColorA, uColorB, 0.65);
              gl_FragColor = vec4(col, uOpacity);
            }
          `,
        })
      );
      wandaGroup.add(trail);
      wandaBolts.push({
        mesh,
        trail,
        velocity: dir.multiplyScalar(18 + charge * 16),
        life: 1.25 + charge * 0.35,
        damage: 6 + charge * 10,
        splash: 2.2 + charge * 2.8,
      });
      spawnWandaBurst(mesh.position.x, mesh.position.y, mesh.position.z, 0.45 + charge * 0.5);
      wandaTone(260 + charge * 120, 0.16 + charge * 0.06, "sawtooth", 0.07 + charge * 0.03);
      screenShakeTimer = 0.08 + charge * 0.06;
      screenShakeIntensity = 0.045 + charge * 0.03;
    };

    const tryStartTelekinesis = () => {
      const origin = controller.getViewPosition(new THREE.Vector3());
      const dir = controller.getCameraDirection(new THREE.Vector3());
      const hit = raycastVoxel(world, origin, dir, wandaTkRange);
      tkField.center.copy(hit?.place ?? hit ?? origin.clone().addScaledVector(dir, wandaTkRange * 0.85));
      tkField.radius = wandaTkRadius;
      tkField.releaseCharge = 0;
      tkField.captured.length = 0;
      tkField.active = true;
      return true;
    };

    // ---- Health bar factory ----
    const makeHealthBar = () => {
      const bg = new THREE.Mesh(
        new THREE.PlaneGeometry(0.9, 0.1),
        new THREE.MeshBasicMaterial({ color: "#1e293b", transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide })
      );
      const fill = new THREE.Mesh(
        new THREE.PlaneGeometry(0.88, 0.08),
        new THREE.MeshBasicMaterial({ color: "#22c55e", transparent: true, opacity: 0.95, depthWrite: false, side: THREE.DoubleSide })
      );
      fill.position.z = 0.001;
      return { bg, fill };
    };

    const makeFlameVisual = (scale = 1) => {
      const g = new THREE.Group();
      const flameMat = new THREE.MeshBasicMaterial({
        color: "#ff6b00", transparent: true, opacity: 0.9,
        side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const planeA = new THREE.Mesh(new THREE.PlaneGeometry(0.52 * scale, 0.82 * scale), flameMat);
      const planeB = new THREE.Mesh(new THREE.PlaneGeometry(0.52 * scale, 0.82 * scale), flameMat.clone());
      planeA.position.y = 0.48 * scale;
      planeB.position.y = 0.48 * scale;
      planeB.rotation.y = Math.PI / 2;
      g.add(planeA); g.add(planeB);
      return g;
    };

    const tracers: Array<{ mesh: THREE.Group; ttl: number; maxTtl: number }> = [];
    const spawnTracer = (from: THREE.Vector3, to: THREE.Vector3, color: string, ttl = 0.08) => {
      const dir = to.clone().sub(from);
      const len = Math.max(0.001, dir.length());
      dir.normalize();

      const g = new THREE.Group();
      const coreMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const glowMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      // Core bolt (cylinder along +Y)
      const core = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, len, 8, 1, true), coreMat);
      const halo = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, len, 8, 1, true), glowMat);
      g.add(halo);
      g.add(core);

      // Impact glow
      const impact = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), glowMat.clone());
      impact.position.set(0, len * 0.5, 0);
      g.add(impact);

      // Orient bolt from +Y to dir
      const up = new THREE.Vector3(0, 1, 0);
      g.quaternion.setFromUnitVectors(up, dir);
      g.position.copy(from).add(to).multiplyScalar(0.5);

      scene.add(g);
      tracers.push({ mesh: g, ttl, maxTtl: ttl });
    };

    const hitscanShoot = (origin: THREE.Vector3, dir: THREE.Vector3, maxDist: number, baseDamage: number, color: string) => {
      const blockHit = raycastVoxel(world, origin, dir, maxDist);
      const blockDist = blockHit ? origin.distanceTo(new THREE.Vector3(blockHit.x + 0.5, blockHit.y + 0.5, blockHit.z + 0.5)) : Infinity;

      let bestIdx = -1;
      let bestDist = Infinity;
      let bestClosest: THREE.Vector3 | null = null;
      for (let i = 0; i < mobs.length; i++) {
        const toMob = mobs[i].mesh.position.clone().sub(origin);
        const proj = toMob.dot(dir);
        if (proj < 0 || proj > maxDist) continue;
        if (proj >= blockDist) continue;
        const closest = origin.clone().addScaledVector(dir, proj);
        const radial = closest.distanceTo(mobs[i].mesh.position);
        if (radial > 0.72) continue;
        if (proj < bestDist) { bestDist = proj; bestIdx = i; bestClosest = closest; }
      }

      const end = bestIdx >= 0
        ? origin.clone().addScaledVector(dir, bestDist)
        : blockHit
          ? new THREE.Vector3(blockHit.x + 0.5, blockHit.y + 0.5, blockHit.z + 0.5)
          : origin.clone().addScaledVector(dir, maxDist);

      spawnTracer(origin.clone(), end.clone(), color);

      if (bestIdx >= 0) {
        const distFrac = Math.max(0, Math.min(1, bestDist / Math.max(0.001, maxDist)));
        const distanceMult = 1.2 + (0.6 - 1.2) * distFrac; // 1.2 close -> 0.6 far
        let damage = baseDamage * distanceMult;

        // Headshot: upper part of mob body.
        if (bestClosest) {
          const headLine = mobs[bestIdx].mesh.position.y + 0.22;
          if (bestClosest.y >= headLine) damage *= 1.85;
        }

        mobs[bestIdx].health -= Math.max(1, Math.round(damage));
        mobs[bestIdx].mesh.scale.set(1.16, 0.9, 1.16);
        if (mobs[bestIdx].health <= 0) killMob(bestIdx);
        return;
      }
      // if no mob hit, optional: breakables later
    };

    const makeBurnOverlay = () => {
      const mat = new THREE.MeshBasicMaterial({
        color: "#ff3b0a", transparent: true, opacity: 0.32,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      return new THREE.Mesh(new THREE.BoxGeometry(1.02, 1.02, 1.02), mat);
    };

    const canBurnBlock = (b: number) => b === 6 || b === 7;
    const isWaterAt = (x: number, y: number, z: number) => world.getBlockWorld(x, y, z) === 4;

    const enqueueBurn = (x: number, y: number, z: number) => {
      if (!canBurnBlock(world.getBlockWorld(x, y, z))) return;
      const k = `${x},${y},${z}`;
      if (burningSet.has(k)) return;
      burningSet.add(k);
      burningQueue.push({ x, y, z });
    };

    const enqueueWater = (x: number, y: number, z: number) => {
      const k = `${x},${y},${z}`;
      if (waterQueued.has(k) || y < 0 || y >= WORLD_HEIGHT) return;
      waterQueued.add(k);
      waterQueue.push({ x, y, z });
    };

    const markWorldPosDirty = (wx: number, wz: number) => {
      const ccx = Math.floor(wx / CHUNK_SIZE);
      const ccz = Math.floor(wz / CHUNK_SIZE);
      const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
      const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
      dirtyChunks.add(chunkKey(ccx, ccz));
      if (lx === 0) dirtyChunks.add(chunkKey(ccx - 1, ccz));
      if (lx === CHUNK_SIZE - 1) dirtyChunks.add(chunkKey(ccx + 1, ccz));
      if (lz === 0) dirtyChunks.add(chunkKey(ccx, ccz - 1));
      if (lz === CHUNK_SIZE - 1) dirtyChunks.add(chunkKey(ccx, ccz + 1));
    };

    // ---- Enhanced water splash visuals ----
    const spawnWaterSplash = (x: number, y: number, z: number, radius = 1.6) => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 12, 12),
        new THREE.MeshBasicMaterial({ color: "#7dd3fc", transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
      mesh.scale.setScalar(Math.max(0.35, radius * 0.55));
      splashGroup.add(mesh);
      waterSplashes.push({ mesh, ttl: 0.32, maxTtl: 0.32, expanding: false, targetScale: 1 });

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.45, 0.06, 10, 28),
        new THREE.MeshBasicMaterial({ color: "#bae6fd", transparent: true, opacity: 0.78, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      ring.position.set(x + 0.5, y + 0.25, z + 0.5);
      ring.rotation.x = Math.PI / 2;
      ring.scale.setScalar(Math.max(0.4, radius * 0.42));
      splashGroup.add(ring);
      waterSplashes.push({ mesh: ring, ttl: 0.28, maxTtl: 0.28, expanding: false, targetScale: 1 });
    };

    // Massive water explosion for water orb
    const spawnWaterExplosion = (x: number, y: number, z: number, radius: number) => {
      const cx = x + 0.5, cy = y + 0.5, cz = z + 0.5;

      // Central burst sphere
      const burst = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 16, 16),
        new THREE.MeshBasicMaterial({ color: "#38bdf8", transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      burst.position.set(cx, cy, cz);
      splashGroup.add(burst);
      waterSplashes.push({ mesh: burst, ttl: 0.5, maxTtl: 0.5, expanding: true, targetScale: radius * 0.9 });

      // Expanding rings at multiple heights
      for (let i = 0; i < 4; i++) {
        const ringRadius = 0.3 + i * 0.2;
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(ringRadius, 0.09 + i * 0.03, 10, 36),
          new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? "#7dd3fc" : "#bae6fd", transparent: true, opacity: 0.88, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        ring.position.set(cx, cy - 0.3 + i * 0.08, cz);
        ring.rotation.x = Math.PI / 2;
        splashGroup.add(ring);
        waterSplashes.push({ mesh: ring, ttl: 0.55 + i * 0.12, maxTtl: 0.55 + i * 0.12, expanding: true, targetScale: 1.5 + i * 0.6 });
      }

      // Upward geyser particles
      for (let i = 0; i < 10; i++) {
        const ang = (i / 10) * Math.PI * 2;
        const r = radius * 0.45;
        const geyser = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 8, 8),
          new THREE.MeshBasicMaterial({ color: "#e0f2fe", transparent: true, opacity: 0.92, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        geyser.position.set(
          cx + Math.cos(ang) * r * 0.5,
          cy + 0.3,
          cz + Math.sin(ang) * r * 0.5
        );
        splashGroup.add(geyser);
        waterSplashes.push({ mesh: geyser, ttl: 0.4 + Math.random() * 0.25, maxTtl: 0.65, expanding: true, targetScale: 1.4 });
      }

      // Outer shockwave ring
      const shockwave = new THREE.Mesh(
        new THREE.TorusGeometry(0.5, 0.15, 10, 48),
        new THREE.MeshBasicMaterial({ color: "#93c5fd", transparent: true, opacity: 0.72, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      shockwave.position.set(cx, cy - 0.4, cz);
      shockwave.rotation.x = Math.PI / 2;
      splashGroup.add(shockwave);
      waterSplashes.push({ mesh: shockwave, ttl: 0.6, maxTtl: 0.6, expanding: true, targetScale: radius * 1.3 });
    };

    const extinguishAt = (x: number, y: number, z: number) => {
      const k = `${x},${y},${z}`;
      const burn = burningCells.get(k);
      if (!burn) return false;
      fireGroup.remove(burn.mesh);
      fireGroup.remove(burn.emberOverlay);
      burn.mesh.traverse((obj) => { if (obj instanceof THREE.Mesh) { (obj.geometry as THREE.BufferGeometry).dispose(); (obj.material as THREE.Material).dispose(); } });
      (burn.emberOverlay.geometry as THREE.BufferGeometry).dispose();
      (burn.emberOverlay.material as THREE.Material).dispose();
      burningCells.delete(k);
      burningSet.delete(k);
      return true;
    };

    const extinguishArea = (x: number, y: number, z: number, radius: number) => {
      const r2 = radius * radius;
      for (const [, burn] of burningCells) {
        const dx = burn.x - x, dy = burn.y - y, dz = burn.z - z;
        if (dx * dx + dy * dy + dz * dz > r2) continue;
        extinguishAt(burn.x, burn.y, burn.z);
      }
    };

    const applyWaterBlast = (bx: number, by: number, bz: number, radius: number) => {
      spawnWaterExplosion(bx, by, bz, radius);
      extinguishArea(bx, by, bz, radius * 1.6);

      // Trigger screen shake
      screenShakeTimer = 0.4;
      screenShakeIntensity = 0.14;

      // Generate water seeds in a dome shape
      const seeds: Array<{ x: number; y: number; z: number }> = [];
      const r = Math.floor(radius * 0.65);
      // Do not seed above impact height; it causes floating sheets.
      for (let dy = -2; dy <= 0; dy++) {
        for (let dz = -r; dz <= r; dz++) {
          for (let dx = -r; dx <= r; dx++) {
            if (dx * dx + dz * dz <= r * r) {
              seeds.push({ x: bx + dx, y: by + dy, z: bz + dz });
            }
          }
        }
      }
      if (seeds.length === 0) seeds.push({ x: bx, y: by, z: bz });

      pendingWaterBursts.push({ timer: 0.18, seeds });

      // Damage mobs in radius (more damage to inferno)
      for (const mob of mobs) {
        const md = mob.mesh.position.distanceTo(new THREE.Vector3(bx + 0.5, by + 0.5, bz + 0.5));
        if (md > radius * 1.3) continue;
        const falloff = Math.max(0, 1 - md / (radius * 1.3));
        mob.health -= mob.kind === "inferno" ? Math.ceil(16 * falloff) : Math.ceil(6 * falloff);
        mob.burnTimer = 0;
        mob.burnTickTimer = 0;
        if (mob.health <= 0) {
          const idx = mobs.indexOf(mob);
          if (idx >= 0) killMob(idx);
        }
      }
      const pd = new THREE.Vector3(controller.position.x, controller.position.y + 0.9, controller.position.z)
        .distanceTo(new THREE.Vector3(bx + 0.5, by + 0.5, bz + 0.5));
      if (pd <= radius) { playerBurnTimer = 0; playerBurnTick = 0; }
    };

    // ---- Thunder staff ----
    const spawnLightning = (x: number, y: number, z: number) => {
      const g = new THREE.Group();
      // Main bolt from sky
      const startY = y + 25;
      const points: THREE.Vector3[] = [];
      const segments = 12;
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const jitter = (1 - t) * 1.4;
        points.push(new THREE.Vector3(
          x + 0.5 + (Math.random() - 0.5) * jitter,
          startY - t * 25,
          z + 0.5 + (Math.random() - 0.5) * jitter,
        ));
      }
      points[points.length - 1].set(x + 0.5, y + 0.5, z + 0.5);

      const mainBolt = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({ color: "#facc15" })
      );
      g.add(mainBolt);

      // Branch bolts
      for (let b = 0; b < 3; b++) {
        const branchStart = Math.floor(segments * (0.3 + Math.random() * 0.4));
        const bPts: THREE.Vector3[] = [];
        const bp = points[branchStart].clone();
        bPts.push(bp.clone());
        for (let i = 0; i < 4; i++) {
          bp.x += (Math.random() - 0.5) * 1.2;
          bp.y -= 1.5 + Math.random() * 2;
          bp.z += (Math.random() - 0.5) * 1.2;
          bPts.push(bp.clone());
        }
        const branch = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(bPts),
          new THREE.LineBasicMaterial({ color: "#fde68a", transparent: true, opacity: 0.75 })
        );
        g.add(branch);
      }

      // Impact glow
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 14, 14),
        new THREE.MeshBasicMaterial({ color: "#fbbf24", transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      glow.position.set(x + 0.5, y + 0.5, z + 0.5);
      g.add(glow);

      // Ring at impact
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.0, 0.12, 10, 32),
        new THREE.MeshBasicMaterial({ color: "#fef08a", transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      ring.position.set(x + 0.5, y + 0.1, z + 0.5);
      ring.rotation.x = Math.PI / 2;
      g.add(ring);

      lightningGroup.add(g);
      lightningEffects.push({ mesh: g, ttl: 0.38 });

      // Brief flash: sky brightens momentarily
      screenShakeTimer = 0.25;
      screenShakeIntensity = 0.1;
    };

    const strikeThunder = (bx: number, by: number, bz: number) => {
      spawnLightning(bx, by, bz);
      const strikeRadius = 4.5;
      const center = new THREE.Vector3(bx + 0.5, by + 0.5, bz + 0.5);

      // Damage all mobs in radius
      for (let i = mobs.length - 1; i >= 0; i--) {
        const d = mobs[i].mesh.position.distanceTo(center);
        if (d > strikeRadius) continue;
        const falloff = Math.max(0, 1 - d / strikeRadius);
        mobs[i].health -= Math.ceil(22 * falloff);
        mobs[i].burnTimer = Math.max(mobs[i].burnTimer, 3.0 * falloff);
        if (mobs[i].health <= 0) killMob(i);
      }
      // Minor damage to player if too close
      const pd = new THREE.Vector3(controller.position.x, controller.position.y + 0.9, controller.position.z).distanceTo(center);
      if (pd < 2.0) applyPlayerDamage(2, "environment");

      // Set fire to flammable blocks around
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -2; dz <= 2; dz++) {
          for (let dx = -2; dx <= 2; dx++) {
            const nx = bx + dx, ny = by + dy, nz = bz + dz;
            if (canBurnBlock(world.getBlockWorld(nx, ny, nz))) enqueueBurn(nx, ny, nz);
          }
        }
      }
    };

    // ---- Mob projectile spawning ----
    const spawnMobProjectile = (
      fromPos: THREE.Vector3,
      toPos: THREE.Vector3,
      fire: boolean,
      water: boolean,
      damage: number
    ) => {
      const dir = toPos.clone().sub(fromPos).normalize();
      const color = fire ? "#fb923c" : water ? "#38bdf8" : "#ffffff";
      const emissive = fire ? "#ff4500" : water ? "#0ea5e9" : "#ffffff";

      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(fire ? 0.25 : 0.22, 10, 10),
        new THREE.MeshStandardMaterial({
          color,
          emissive: new THREE.Color(emissive),
          emissiveIntensity: 0.85,
          roughness: 0.22,
          metalness: 0.05,
          transparent: true,
          opacity: 0.92,
        })
      );
      mesh.position.copy(fromPos);
      mobGroup.add(mesh);

      // Aura
      const aura = new THREE.Mesh(
        new THREE.SphereGeometry(fire ? 0.38 : 0.34, 8, 8),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      mesh.add(aura);

      const speed = fire ? 10 : 8;
      mobProjectiles.push({
        mesh,
        trail: [],
        velocity: dir.multiplyScalar(speed).add(new THREE.Vector3(0, 2, 0)),
        life: 3.5,
        damage,
        fire,
        water,
        captureKind: "none",
        captureAngle: Math.random() * Math.PI * 2,
      });
    };

    const makeHeldItem = (item: ItemId): THREE.Object3D => {
      const mat = new THREE.MeshStandardMaterial({
        color: itemColor(item),
        roughness: 0.45,
        metalness: item.includes("stone") ? 0.08 : 0.02,
      });

      const makeFallback = () => {
        if (item.endsWith("sword")) {
          const g = new THREE.Group();
          const blade = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.36, 0.038), mat);
          blade.position.y = 0.04;
          g.add(blade);
          const tip = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.09, 6), mat);
          tip.position.y = 0.255; tip.rotation.z = Math.PI;
          g.add(tip);
          const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.05), new THREE.MeshStandardMaterial({ color: "#d4af37" }));
          grip.position.y = -0.19; g.add(grip);
          const guard = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.05), new THREE.MeshStandardMaterial({ color: "#f1f5f9" }));
          guard.position.y = -0.13; g.add(guard);
          return g;
        }
        if (item === "bow" || item === "fire_bow") {
          const g = new THREE.Group();
          g.add(new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.018, 8, 24, Math.PI), mat));
          return g;
        }
        if (item.endsWith("pickaxe")) {
          const g = new THREE.Group();
          g.add(new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.28, 0.045), new THREE.MeshStandardMaterial({ color: "#8b5a2b" })));
          const head = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.05), mat);
          head.position.y = 0.09; g.add(head);
          return g;
        }
        if (item.endsWith("axe")) {
          const g = new THREE.Group();
          g.add(new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.28, 0.045), new THREE.MeshStandardMaterial({ color: "#8b5a2b" })));
          const blade = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.045), mat);
          blade.position.set(0.06, 0.09, 0); g.add(blade);
          return g;
        }
        const block = fromBlockItem(item);
        if (block !== null) return new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.17, 0.17), mat);
        return new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.08), mat);
      };

      const attachModelAsync = (key: string, targetGroup: THREE.Group, factory: () => Promise<THREE.Object3D>, transform: (m: THREE.Object3D) => void) => {
        const applyClone = (src: THREE.Object3D) => {
          targetGroup.clear();
          const model = src.clone(true);
          transform(model);
          targetGroup.add(model);
        };
        const cached = modelCache.get(key);
        if (cached) { applyClone(cached); return; }
        let pending = modelPending.get(key);
        if (!pending) {
          pending = factory().then((obj) => { modelCache.set(key, obj); modelPending.delete(key); return obj; })
            .catch((err) => { modelPending.delete(key); throw err; });
          modelPending.set(key, pending);
        }
        pending.then((obj) => { if (heldItemMesh !== targetGroup) return; applyClone(obj); }).catch(() => {});
      };

      // Thunder staff
      if (item === "thunder_staff") {
        const g = new THREE.Group();
        const shaft = new THREE.Mesh(
          new THREE.CylinderGeometry(0.022, 0.028, 0.44, 8),
          new THREE.MeshStandardMaterial({ color: "#1e3a5f", roughness: 0.38, metalness: 0.35 })
        );
        g.add(shaft);
        const orb = new THREE.Mesh(
          new THREE.SphereGeometry(0.068, 14, 14),
          new THREE.MeshStandardMaterial({
            color: "#facc15",
            emissive: new THREE.Color("#fbbf24"),
            emissiveIntensity: 1.1,
            roughness: 0.12,
            metalness: 0.04,
          })
        );
        orb.position.y = 0.265;
        g.add(orb);
        // Crackle rings
        for (let i = 0; i < 2; i++) {
          const crackle = new THREE.Mesh(
            new THREE.TorusGeometry(0.09 + i * 0.04, 0.008, 6, 18),
            new THREE.MeshBasicMaterial({ color: "#fef08a", transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false })
          );
          crackle.position.y = 0.265;
          crackle.rotation.x = i * Math.PI / 3;
          g.add(crackle);
        }
        return g;
      }

      if (item === "wanda_focus") {
        const g = new THREE.Group();
        const orb = new THREE.Mesh(
          new THREE.SphereGeometry(0.07, 14, 14),
          new THREE.MeshStandardMaterial({
            color: "#7f1d1d",
            emissive: new THREE.Color("#991b1b"),
            emissiveIntensity: 0.85,
            roughness: 0.15,
            metalness: 0.1,
          })
        );
        g.add(orb);
        const ringA = new THREE.Mesh(
          new THREE.TorusGeometry(0.12, 0.012, 10, 30),
          new THREE.MeshBasicMaterial({ color: "#9f1239", transparent: true, opacity: 0.72, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        ringA.rotation.x = Math.PI / 3;
        const ringB = ringA.clone();
        ringB.rotation.y = Math.PI / 2;
        g.add(ringA);
        g.add(ringB);
        return g;
      }

      if (item === "rifle" || item === "smg" || item === "shotgun") {
        const g = new THREE.Group();
        const metal = new THREE.MeshStandardMaterial({ color: item === "smg" ? "#b0b7c2" : "#d6dee8", roughness: 0.22, metalness: 0.72 });
        const dark = new THREE.MeshStandardMaterial({ color: "#111827", roughness: 0.45, metalness: 0.45 });
        const polymer = new THREE.MeshStandardMaterial({ color: item === "shotgun" ? "#1f2937" : "#0f172a", roughness: 0.62, metalness: 0.12 });
        const wood = new THREE.MeshStandardMaterial({ color: "#7c4a2c", roughness: 0.72, metalness: 0.05 });

        // Receiver
        const recvLen = item === "rifle" ? 0.34 : item === "smg" ? 0.26 : 0.32;
        const receiver = new THREE.Mesh(new THREE.BoxGeometry(recvLen, 0.09, 0.09), metal);
        receiver.position.set(0.02, 0.035, 0);
        g.add(receiver);

        // Upper rail + sight
        const rail = new THREE.Mesh(new THREE.BoxGeometry(recvLen * 0.92, 0.018, 0.07), dark);
        rail.position.set(0.02, 0.085, 0);
        g.add(rail);
        const sight = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.05), dark);
        sight.position.set(item === "rifle" ? 0.02 : 0.04, 0.12, 0);
        g.add(sight);

        // Barrel + muzzle
        const barrelLen = item === "shotgun" ? 0.46 : item === "rifle" ? 0.56 : 0.38;
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, barrelLen, 12), dark);
        barrel.rotation.z = Math.PI / 2;
        barrel.position.set(recvLen * 0.5 + barrelLen * 0.5 - 0.02, 0.05, 0);
        g.add(barrel);
        const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.018, 0.06, 12), dark);
        muzzle.rotation.z = Math.PI / 2;
        muzzle.position.set(barrel.position.x + barrelLen * 0.5 + 0.02, 0.05, 0);
        g.add(muzzle);

        // Handguard / pump
        if (item === "shotgun") {
          const pump = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.075, 0.085), wood);
          pump.position.set(0.22, 0.02, 0);
          g.add(pump);
          const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.38, 10), dark);
          tube.rotation.z = Math.PI / 2;
          tube.position.set(0.33, 0.0, 0);
          g.add(tube);
        } else {
          const hand = new THREE.Mesh(new THREE.BoxGeometry(item === "rifle" ? 0.22 : 0.16, 0.07, 0.085), polymer);
          hand.position.set(item === "rifle" ? 0.22 : 0.18, 0.015, 0);
          g.add(hand);
        }

        // Stock
        const stock = new THREE.Mesh(new THREE.BoxGeometry(item === "smg" ? 0.14 : 0.2, 0.075, 0.095), polymer);
        stock.position.set(-recvLen * 0.5 - (item === "smg" ? 0.07 : 0.1) + 0.02, 0.02, 0);
        g.add(stock);
        const stockPad = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.08, 0.1), dark);
        stockPad.position.set(stock.position.x - stock.geometry.parameters.width / 2 + 0.014, 0.02, 0);
        g.add(stockPad);

        // Grip
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.12, 0.06), polymer);
        grip.position.set(-0.02, -0.075, 0);
        grip.rotation.z = item === "rifle" ? -0.12 : -0.18;
        g.add(grip);

        // Magazine
        if (item !== "shotgun") {
          const mag = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.13, 0.065), dark);
          mag.position.set(item === "rifle" ? 0.02 : 0.05, -0.09, 0);
          mag.rotation.z = item === "rifle" ? 0.06 : 0.14;
          g.add(mag);
          const magLip = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.02, 0.062), metal);
          magLip.position.set(0.006, 0.07, 0);
          mag.add(magLip);
        } else {
          // Shell port hint
          const port = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.04), dark);
          port.position.set(0.02, 0.02, -0.05);
          g.add(port);
        }

        // Small emissive accent (not too neon)
        const accent = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 0.02, 0.02),
          new THREE.MeshStandardMaterial({ color: "#93c5fd", emissive: new THREE.Color("#60a5fa"), emissiveIntensity: 0.35, roughness: 0.2, metalness: 0.1 })
        );
        accent.position.set(0.12, 0.065, 0.052);
        g.add(accent);

        // Orient so the barrel points forward in first-person.
        // Built along +X; rotate so +X becomes -Z (camera forward).
        g.rotation.y = -Math.PI / 2;
        g.rotation.z = Math.PI;

        return g;
      }

      if (item === "bow" || item === "fire_bow") {
        const g = new THREE.Group();
        g.add(makeFallback());
        const stringGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-0.085, 0.34, 0),
          new THREE.Vector3(0.015, 0, 0),
          new THREE.Vector3(-0.085, -0.34, 0),
        ]);
        heldBowString = new THREE.Line(stringGeo, new THREE.LineBasicMaterial({ color: "#f3f4f6", transparent: true, opacity: 0.95 }));
        g.add(heldBowString);
        heldBowArrow = new THREE.Mesh(
          new THREE.BoxGeometry(0.018, 0.018, 0.58),
          new THREE.MeshStandardMaterial({
            color: item === "fire_bow" ? "#fb923c" : "#d6d3d1",
            roughness: 0.4, metalness: 0.05,
            emissive: item === "fire_bow" ? new THREE.Color("#ff5a00") : new THREE.Color("#000000"),
            emissiveIntensity: item === "fire_bow" ? 0.4 : 0,
          })
        );
        heldBowArrow.position.set(-0.03, 0, 0.1);
        g.add(heldBowArrow);
        const fletch = new THREE.Mesh(
          new THREE.BoxGeometry(0.04, 0.045, 0.012),
          new THREE.MeshStandardMaterial({ color: "#cbd5e1", roughness: 0.55, metalness: 0 })
        );
        fletch.position.set(-0.03, 0, -0.2);
        heldBowArrow.add(fletch);
        attachModelAsync(
          item === "fire_bow" ? "bow-obj-fire" : "bow-obj", g,
          async () => {
            const materials = await mtlLoader.loadAsync("https://raw.githubusercontent.com/imgntn/jBow/master/assets/models/sg-bow-2-obj/sg-bow-2-rotated-b.mtl");
            materials.preload();
            objLoader.setMaterials(materials);
            return objLoader.loadAsync("https://raw.githubusercontent.com/imgntn/jBow/master/assets/models/sg-bow-2-obj/sg-bow-2-rotated-b.obj");
          },
          (model) => {
            model.traverse((obj) => {
              if (!(obj instanceof THREE.Mesh)) return;
              const arr = Array.isArray(obj.material) ? obj.material : [obj.material];
              for (const m of arr) {
                const mat = m as THREE.MeshStandardMaterial;
                if (item === "fire_bow") {
                  mat.color = new THREE.Color("#2b0d0d"); mat.emissive = new THREE.Color("#c81e1e");
                  mat.emissiveIntensity = 0.46; mat.roughness = 0.56; mat.metalness = 0.06;
                } else {
                  mat.color = new THREE.Color("#8b5a2b"); mat.emissive = new THREE.Color("#1f1208");
                  mat.emissiveIntensity = 0.2; mat.roughness = 0.72; mat.metalness = 0.02;
                }
                mat.map = null; mat.needsUpdate = true;
              }
            });
            model.position.set(-0.015, -0.015, -0.01);
            model.rotation.set(0, Math.PI, 0);
            model.scale.setScalar(0.052);
          }
        );
        return g;
      }

      if (item.endsWith("sword")) {
        const g = new THREE.Group();
        g.add(makeFallback());
        attachModelAsync("katana-glb", g,
          async () => { const gltf = await gltfLoader.loadAsync("https://raw.githubusercontent.com/BoQsc/cc0-melee-weapons-pack-glb/main/Katana/Katana.glb"); return gltf.scene; },
          (model) => { model.position.set(0.02, -0.16, -0.03); model.rotation.set(0, Math.PI / 2, 0.08); model.scale.setScalar(0.2); }
        );
        return g;
      }

      if (item === "water_orb") {
        const g = new THREE.Group();
        const orb = new THREE.Mesh(
          new THREE.SphereGeometry(0.1, 16, 16),
          new THREE.MeshStandardMaterial({
            color: "#7dd3fc", transparent: true, opacity: 0.82, roughness: 0.14, metalness: 0.02,
            emissive: new THREE.Color("#38bdf8"), emissiveIntensity: 0.45,
          })
        );
        g.add(orb);
        // Orbiting ring
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.14, 0.012, 8, 24),
          new THREE.MeshBasicMaterial({ color: "#bae6fd", transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        ring.rotation.x = Math.PI / 2;
        g.add(ring);
        return g;
      }

      if (item.endsWith("pickaxe")) {
        const g = new THREE.Group();
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.28, 0.045), new THREE.MeshStandardMaterial({ color: "#8b5a2b" })));
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.05), mat);
        head.position.y = 0.09; g.add(head);
        return g;
      }
      if (item.endsWith("axe")) {
        const g = new THREE.Group();
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.28, 0.045), new THREE.MeshStandardMaterial({ color: "#8b5a2b" })));
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.045), mat);
        blade.position.set(0.06, 0.09, 0); g.add(blade);
        return g;
      }
      const block = fromBlockItem(item);
      if (block !== null) return new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.17, 0.17), mat);
      return new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.08), mat);
    };

    const syncHeldItem = () => {
      const item = inventoryRef.current[selectedSlotRef.current]?.item ?? null;
      if (item === heldItemId) return;
      heldItemId = item;
      if (heldItemMesh) {
        heldItemRoot.remove(heldItemMesh);
        heldItemMesh.traverse((obj) => { if (obj instanceof THREE.Mesh) { (obj.geometry as THREE.BufferGeometry).dispose(); (obj.material as THREE.Material).dispose(); } });
      }
      heldItemMesh = null; heldBowString = null; heldBowArrow = null;
      if (!item) return;
      heldItemMesh = makeHeldItem(item);
      heldItemRoot.add(heldItemMesh);
    };

    const buildChunkMesh = (chunk: VoxelChunk): THREE.Group => {
      const solidPos: number[] = [], solidNormal: number[] = [], solidUV: number[] = [], solidIndex: number[] = [];
      const waterPos: number[] = [], waterNormal: number[] = [], waterUV: number[] = [], waterIndex: number[] = [];
      let solidBase = 0, waterBase = 0;

      for (let y = 0; y < WORLD_HEIGHT; y++) {
        for (let lz = 0; lz < CHUNK_SIZE; lz++) {
          for (let lx = 0; lx < CHUNK_SIZE; lx++) {
            const idx = y * CHUNK_SIZE * CHUNK_SIZE + lz * CHUNK_SIZE + lx;
            const block = chunk.blocks[idx];
            if (block === 0) continue;
            const wx = chunk.cx * CHUNK_SIZE + lx;
            const wz = chunk.cz * CHUNK_SIZE + lz;

            for (let faceIndex = 0; faceIndex < FACE_OFFSETS.length; faceIndex++) {
              const face = FACE_OFFSETS[faceIndex];
              const nx = face.n[0], ny = face.n[1], nz = face.n[2];
              const neighbor = world.getBlockWorld(wx + nx, y + ny, wz + nz);
              if (!isTransparentFor(block, neighbor)) continue;

              if (block === 4) {
                const topLevel = 0.9;
                for (const v of face.v) {
                  const yv = v[1] === 1 ? topLevel : 0;
                  waterPos.push(wx + v[0], y + yv, wz + v[2]);
                  waterNormal.push(nx, ny, nz);
                }
                waterUV.push(0, 1, 0, 0, 1, 0, 1, 1);
                waterIndex.push(waterBase, waterBase + 1, waterBase + 2, waterBase, waterBase + 2, waterBase + 3);
                waterBase += 4;
                continue;
              }

              for (const v of face.v) { solidPos.push(wx + v[0], y + v[1], wz + v[2]); solidNormal.push(nx, ny, nz); }
              pushAtlasUV(solidUV, tileForFace(block, faceIndex));
              solidIndex.push(solidBase, solidBase + 1, solidBase + 2, solidBase, solidBase + 2, solidBase + 3);
              solidBase += 4;
            }
          }
        }
      }

      const group = new THREE.Group();
      if (solidPos.length > 0) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.Float32BufferAttribute(solidPos, 3));
        geo.setAttribute("normal", new THREE.Float32BufferAttribute(solidNormal, 3));
        geo.setAttribute("uv", new THREE.Float32BufferAttribute(solidUV, 2));
        geo.setIndex(solidIndex);
        geo.computeBoundingSphere();
        const mesh = new THREE.Mesh(geo, voxelMaterial);
        mesh.frustumCulled = true;
        group.add(mesh);
      }
      if (waterPos.length > 0) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.Float32BufferAttribute(waterPos, 3));
        geo.setAttribute("normal", new THREE.Float32BufferAttribute(waterNormal, 3));
        geo.setAttribute("uv", new THREE.Float32BufferAttribute(waterUV, 2));
        geo.setIndex(waterIndex);
        geo.computeBoundingSphere();
        group.add(new THREE.Mesh(geo, waterMaterial));
      }
      return group;
    };

    const rebuildChunk = (cx: number, cz: number) => {
      const key = chunkKey(cx, cz);
      const existing = activeChunks.get(key);
      if (existing) {
        chunkGroup.remove(existing.mesh);
        existing.mesh.traverse((obj) => { if (obj instanceof THREE.Mesh) (obj.geometry as THREE.BufferGeometry).dispose(); });
        activeChunks.delete(key);
      }
      const chunk = world.getChunk(cx, cz);
      const mesh = buildChunkMesh(chunk);
      chunkGroup.add(mesh);
      activeChunks.set(key, { key, cx, cz, mesh, version: chunk.version });
    };

    const syncChunksAroundPlayer = () => {
      const cx = Math.floor(controller.position.x / CHUNK_SIZE);
      const cz = Math.floor(controller.position.z / CHUNK_SIZE);
      const needed = new Set<string>();
      for (let dz = -drawRadius; dz <= drawRadius; dz++) {
        for (let dx = -drawRadius; dx <= drawRadius; dx++) {
          const ncx = cx + dx, ncz = cz + dz;
          const key = chunkKey(ncx, ncz);
          needed.add(key);
          const existing = activeChunks.get(key);
          const version = world.getChunkVersion(ncx, ncz);
          if (!existing || existing.version !== version || dirtyChunks.has(key)) {
            rebuildChunk(ncx, ncz);
            dirtyChunks.delete(key);
          }
        }
      }
      for (const [key, render] of activeChunks) {
        if (needed.has(key)) continue;
        chunkGroup.remove(render.mesh);
        render.mesh.traverse((obj) => { if (obj instanceof THREE.Mesh) (obj.geometry as THREE.BufferGeometry).dispose(); });
        activeChunks.delete(key);
      }
      world.pruneCache(needed);
    };

    syncChunksAroundPlayer();
    controller.position.copy(findSafeSpawn(world, 8, 8));
    for (let i = 0; i < 24; i++) {
      const bx = Math.floor(controller.position.x), by = Math.floor(controller.position.y + controller.eyeHeight * 0.65), bz = Math.floor(controller.position.z);
      if (world.getBlockWorld(bx, by, bz) === 0) break;
      controller.position.y += 1;
    }

    const findGroundY = (x: number, z: number): number | null => {
      for (let y = WORLD_HEIGHT - 2; y >= 1; y--) {
        const b = world.getBlockWorld(x, y, z);
        if (b !== 0 && b !== 4) return y + 1;
      }
      return null;
    };

    const spawnMobNearPlayer = () => {
      if (mobs.length >= 7) return;
      const infernoAlive = mobs.filter((m) => m.kind === "inferno").length;
      const aquaAlive = mobs.filter((m) => m.kind === "aqua").length;
      const shadowAlive = mobs.filter((m) => m.kind === "shadow").length;
      const stormAlive = mobs.filter((m) => m.kind === "storm").length;
      const brineAlive = mobs.filter((m) => m.kind === "brine").length;

      for (let tries = 0; tries < 18; tries++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = 12 + Math.random() * 14;
        const x = Math.floor(controller.position.x + Math.cos(ang) * dist);
        const z = Math.floor(controller.position.z + Math.sin(ang) * dist);
        const y = findGroundY(x, z);
        if (y === null || y <= SEA_LEVEL + 1) continue;
        if (world.getBlockWorld(x, y, z) !== 0 || world.getBlockWorld(x, y + 1, z) !== 0) continue;

        const roll = Math.random();
        const kind: "slime" | "boar" | "inferno" | "aqua" | "shadow" | "storm" | "brine" =
          shadowAlive < 1 && roll < 0.08 ? "shadow"
          : stormAlive < 1 && roll < 0.11 ? "storm"
          : infernoAlive < 2 && roll < 0.16 ? "inferno"
          : brineAlive < 1 && roll < 0.2 ? "brine"
          : aquaAlive < 2 && roll < 0.26 ? "aqua"
          : roll < 0.6 ? "slime" : "boar";

        const mesh = new THREE.Group();
        const bodyColor =
          kind === "inferno" ? "#7f1d1d"
          : kind === "aqua" ? "#0f4c81"
          : kind === "brine" ? "#0c4a6e"
          : kind === "shadow" ? "#0f0f1a"
          : kind === "storm" ? "#312e81"
          : kind === "slime" ? "#7ed957"
          : "#8c6a4f";

        const body = new THREE.Mesh(
          new THREE.BoxGeometry(0.72, kind === "boar" ? 0.68 : 0.78, 0.72),
          new THREE.MeshStandardMaterial({
            color: bodyColor,
            roughness: kind === "shadow" || kind === "storm" ? 0.1 : kind === "inferno" ? 0.42 : kind === "aqua" || kind === "brine" ? 0.46 : 0.62,
            metalness: kind === "shadow" || kind === "storm" ? 0.28 : kind === "inferno" ? 0.08 : 0.02,
            emissive: kind === "inferno" ? new THREE.Color("#ff3b0a")
              : kind === "aqua" || kind === "brine" ? new THREE.Color("#22d3ee")
              : kind === "storm" ? new THREE.Color("#facc15")
              : kind === "shadow" ? new THREE.Color("#7c3aed")
              : new THREE.Color("#000000"),
            emissiveIntensity: kind === "inferno" ? 0.26 : kind === "aqua" || kind === "brine" ? 0.18 : kind === "shadow" ? 0.22 : kind === "storm" ? 0.28 : 0,
          })
        );
        mesh.add(body);

        const eyeY = kind === "boar" ? 0.11 : 0.15;
        const eyeColor = kind === "shadow" || kind === "storm" ? "#fff0f0" : "#fff8fb";
        const pupilEmissive = kind === "inferno" ? "#ff6a00" : kind === "aqua" || kind === "brine" ? "#38bdf8" : kind === "shadow" ? "#a855f7" : kind === "storm" ? "#facc15" : "#020617";
        const pupilEmissiveI = kind === "inferno" ? 0.7 : kind === "aqua" || kind === "brine" ? 0.45 : kind === "shadow" ? 0.95 : kind === "storm" ? 1 : 0.35;

        const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 14), new THREE.MeshStandardMaterial({ color: eyeColor, roughness: 0.42, metalness: 0.01 }));
        const rightEye = leftEye.clone();
        leftEye.position.set(-0.165, eyeY, 0.34);
        rightEye.position.set(0.165, eyeY, 0.34);

        const leftPupil = new THREE.Mesh(
          new THREE.SphereGeometry(0.028, 10, 10),
          new THREE.MeshStandardMaterial({ color: "#111827", roughness: 0.35, metalness: 0.01, emissive: new THREE.Color(pupilEmissive), emissiveIntensity: pupilEmissiveI })
        );
        const rightPupil = leftPupil.clone();
        leftPupil.position.set(0, -0.004, 0.067);
        rightPupil.position.set(0, -0.004, 0.067);
        leftEye.add(leftPupil); rightEye.add(rightPupil);

        const leftShine = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 8), new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.2, metalness: 0 }));
        const rightShine = leftShine.clone();
        leftShine.position.set(0.008, 0.008, 0.069);
        rightShine.position.set(0.008, 0.008, 0.069);
        leftEye.add(leftShine); rightEye.add(rightShine);

        const blushColor = kind === "shadow" ? "#a855f7" : kind === "storm" ? "#fde047" : kind === "inferno" ? "#ef4444" : kind === "aqua" || kind === "brine" ? "#93c5fd" : "#f9a8d4";
        const blushMat = new THREE.MeshStandardMaterial({ color: blushColor, roughness: 0.6, metalness: 0, transparent: true, opacity: kind === "shadow" || kind === "storm" ? 0.5 : 0.56 });
        const leftBlush = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 10), blushMat);
        const rightBlush = leftBlush.clone();
        leftBlush.position.set(-0.24, kind === "boar" ? 0.02 : 0.04, 0.32);
        rightBlush.position.set(0.24, kind === "boar" ? 0.02 : 0.04, 0.32);

        mesh.add(leftEye); mesh.add(rightEye); mesh.add(leftBlush); mesh.add(rightBlush);

        const burnOverlay = new THREE.Mesh(
          new THREE.BoxGeometry(0.76, kind === "boar" ? 0.72 : 0.82, 0.76),
          new THREE.MeshBasicMaterial({ color: "#ff3b0a", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        burnOverlay.position.y = 0.02;
        mesh.add(burnOverlay);

        // Health bar
        const { bg: healthBarBg, fill: healthBarFill } = makeHealthBar();
        healthBarBg.position.set(0, 0.7, 0);
        healthBarFill.position.set(0, 0.7, 0.002);
        mesh.add(healthBarBg);
        mesh.add(healthBarFill);

        let fireVfx: THREE.Group | null = null;
        if (kind === "inferno" || kind === "aqua" || kind === "shadow" || kind === "storm" || kind === "brine") {
          fireVfx = makeFlameVisual(kind === "shadow" || kind === "storm" ? 0.9 : 1.15);
          fireVfx.position.set(0, -0.12, 0);
          if (kind === "aqua" || kind === "brine") {
            fireVfx.traverse((obj) => { if (obj instanceof THREE.Mesh) { const mat = obj.material as THREE.MeshBasicMaterial; mat.color = new THREE.Color("#38bdf8"); mat.opacity = 0.75; } });
          }
          if (kind === "shadow") {
            fireVfx.traverse((obj) => { if (obj instanceof THREE.Mesh) { const mat = obj.material as THREE.MeshBasicMaterial; mat.color = new THREE.Color("#8b5cf6"); mat.opacity = 0.65; } });
          }
          if (kind === "storm") {
            fireVfx.traverse((obj) => { if (obj instanceof THREE.Mesh) { const mat = obj.material as THREE.MeshBasicMaterial; mat.color = new THREE.Color("#fde047"); mat.opacity = 0.72; } });
          }
          mesh.add(fireVfx);
        }

        mesh.position.set(x + 0.5, y + 0.45, z + 0.5);
        mobGroup.add(mesh);

        const maxHp = kind === "inferno" ? 36 : kind === "aqua" ? 24 : kind === "brine" ? 28 : kind === "storm" ? 30 : kind === "shadow" ? 20 : kind === "boar" ? 18 : 10;
        mobs.push({
          mesh, pupils: [leftPupil, rightPupil], burnOverlay,
          healthBarBg, healthBarFill,
          velocity: new THREE.Vector3(),
          wanderYaw: Math.random() * Math.PI * 2,
          wanderTimer: 0.5 + Math.random() * 1.3,
          jumpTimer: 0.6 + Math.random() * 1.6,
          attackCooldown: kind === "inferno" ? 0.35 + Math.random() * 0.5 : kind === "aqua" || kind === "brine" ? 0.8 + Math.random() * 0.5 : kind === "storm" ? 0.55 + Math.random() * 0.5 : 0.4 + Math.random() * 0.8,
          rangedCooldown: 1.5 + Math.random() * 2,
          shadowTeleportCooldown: 3 + Math.random() * 2,
          health: maxHp, maxHealth: maxHp,
          burnTimer: 0, burnTickTimer: 0, fireVfx, kind,
        });
        setMobCount(mobs.length);
        break;
      }
    };

    const fireArrow = (power: number, fire = false, water = false) => {
      const origin = controller.getViewPosition(new THREE.Vector3());
      const dir = controller.getCameraDirection(new THREE.Vector3()).normalize();
      const mesh = new THREE.Group();
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.62, 8),
        new THREE.MeshStandardMaterial({
          color: water ? "#7dd3fc" : fire ? "#ffb74d" : "#e5e7eb",
          roughness: 0.3, metalness: 0.05,
          emissive: water ? new THREE.Color("#38bdf8") : fire ? new THREE.Color("#ff6a00") : new THREE.Color("#000000"),
          emissiveIntensity: water ? 0.45 : fire ? 0.55 : 0,
        })
      );
      shaft.rotation.x = Math.PI / 2;
      mesh.add(shaft);
      const tip = new THREE.Mesh(
        new THREE.ConeGeometry(0.038, 0.14, 6),
        new THREE.MeshStandardMaterial({ color: water ? "#bae6fd" : fire ? "#fb923c" : "#94a3b8", roughness: 0.22, metalness: 0.2 })
      );
      tip.rotation.x = Math.PI / 2; tip.position.z = 0.36;
      mesh.add(tip);
      if (fire || water) {
        const aura = makeFlameVisual(0.42);
        aura.position.set(0, 0, 0.08);
        if (water) {
          aura.traverse((obj) => { if (obj instanceof THREE.Mesh) { const mat = obj.material as THREE.MeshBasicMaterial; mat.color = new THREE.Color("#38bdf8"); mat.opacity = 0.7; } });
        }
        mesh.add(aura);
      }
      mesh.position.copy(origin).addScaledVector(dir, 0.55);
      mesh.lookAt(mesh.position.clone().add(dir));

      // Trail line
      const trailGeo = new THREE.BufferGeometry().setFromPoints([mesh.position.clone(), mesh.position.clone()]);
      const trailMesh = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({
        color: water ? "#93c5fd" : fire ? "#fb923c" : "#e2e8f0",
        transparent: true, opacity: 0.6,
      }));
      scene.add(trailMesh);
      mobGroup.add(mesh);

      arrows.push({
        mesh, trailMesh, trail: [mesh.position.clone()],
        velocity: dir.multiplyScalar(water ? 20 + power * 20 : 12 + power * 20),
        life: water ? 2.4 : 2.7,
        damage: (water ? 3 : fire ? 4 : 3) + power * (water ? 6 : fire ? 10 : 8),
        fire, water,
        gravityScale: water ? 0.05 : 0.55,
        splashRadius: water ? 6.0 : 0,
      });
    };

    const killMob = (idx: number) => {
      const mob = mobs[idx];
      if (!mob) return;
      const pos = mob.mesh.position;
      mobGroup.remove(mob.mesh);
      mob.mesh.traverse((obj) => { if (obj instanceof THREE.Mesh) { (obj.geometry as THREE.BufferGeometry).dispose(); (obj.material as THREE.Material).dispose(); } });
      mobs.splice(idx, 1);
      setMobCount(mobs.length);

      if (mob.kind === "inferno") spawnDrop("fire_bow", Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z));
      if (mob.kind === "aqua") {
        spawnDrop("water_orb", Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z));
        spawnDrop("water_orb", Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z));
        if (Math.random() < 0.7) spawnDrop("water_orb", Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z));
        if (Math.random() < 0.4) spawnDrop("thunder_staff", Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z));
      }
      if (mob.kind === "shadow") {
        if (Math.random() < 0.55) spawnDrop("thunder_staff", Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z));
        if (Math.random() < 0.4) spawnDrop("bow", Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z));
        if (Math.random() < 0.28) spawnDrop("rifle", Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z));
      }
      if (mob.kind === "storm") {
        spawnDrop("thunder_staff", Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z));
        if (Math.random() < 0.45) spawnDrop("thunder_staff", Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z));
        if (Math.random() < 0.22) spawnDrop("shotgun", Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z));
      }
      if (mob.kind === "brine") {
        spawnDrop("water_orb", Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z));
        spawnDrop("water_orb", Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z));
        if (Math.random() < 0.3) spawnDrop("thunder_staff", Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z));
        if (Math.random() < 0.22) spawnDrop("smg", Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z));
      }
      if (Math.random() < 0.34) spawnDrop("bow", Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z));
      spawnDrop("stick", Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z));
      if (Math.random() < 0.5) spawnDrop(toBlockItem(mob.kind === "boar" ? 3 : mob.kind === "brine" ? 9 : 11), Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z));
    };

    const applyPlayerDamage = (damage: number, source: "melee" | "projectile" | "dot" | "environment" = "projectile") => {
      let incoming = Math.max(0, damage);
      if (wandaShieldTimer > 0) {
        const flatBlock = source === "dot" ? 0.5 : 1.2;
        const pctBlock = source === "melee" ? 0.58 : 0.66;
        incoming = Math.max(0, incoming - flatBlock);
        incoming *= (1 - pctBlock);
        if (wandaShieldAbsorb > 0) {
          const used = Math.min(wandaShieldAbsorb, incoming);
          wandaShieldAbsorb -= used;
          incoming -= used;
        }
        if (wandaShieldAbsorb <= 0) {
          wandaShieldTimer = 0;
          wandaShieldAbsorb = 0;
        }
      }
      const finalDamage = Math.max(0, Math.ceil(incoming));
      const next = Math.max(0, healthRef.current - finalDamage);
      if (next !== healthRef.current) { healthRef.current = next; setHealth(next); }
      if (next <= 0) {
        controller.position.copy(findSafeSpawn(world, Math.floor(controller.position.x), Math.floor(controller.position.z)));
        controller.velocity.set(0, 0, 0);
        healthRef.current = 20; setHealth(20);
      }
    };
    const hitPlayer = (damage: number) => applyPlayerDamage(damage, "projectile");
    let playerBurnTimer = 0, playerBurnTick = 0;

    const processBurnQueue = (budget = 4) => {
      for (let i = 0; i < budget && burningQueue.length > 0; i++) {
        const node = burningQueue.shift()!;
        const k = `${node.x},${node.y},${node.z}`;
        if (!canBurnBlock(world.getBlockWorld(node.x, node.y, node.z))) { burningSet.delete(k); continue; }
        if (!burningCells.has(k)) {
          const flame = makeFlameVisual(1);
          const overlay = makeBurnOverlay();
          flame.position.set(node.x + 0.5, node.y + 0.04, node.z + 0.5);
          overlay.position.set(node.x + 0.5, node.y + 0.5, node.z + 0.5);
          fireGroup.add(flame); fireGroup.add(overlay);
          burningCells.set(k, { x: node.x, y: node.y, z: node.z, ttl: 5.2 + Math.random() * 1.8, spreadCooldown: 0.28 + Math.random() * 0.34, mesh: flame, emberOverlay: overlay });
        }
      }
    };

    const processWaterTicks = (budget = 2) => {
      for (let i = 0; i < budget && waterQueue.length > 0; i++) {
        const node = waterQueue.shift()!;
        waterQueued.delete(`${node.x},${node.y},${node.z}`);
        const block = world.getBlockWorld(node.x, node.y, node.z);
        if (block === 0) {
          if (!hasAdjacentWater(world, node.x, node.y, node.z)) continue;
          if (!world.setBlockWorld(node.x, node.y, node.z, 4)) continue;
          markWorldPosDirty(node.x, node.z);
        } else if (block !== 4) continue;
        const below = { x: node.x, y: node.y - 1, z: node.z };
        if (below.y >= 0 && world.getBlockWorld(below.x, below.y, below.z) === 0) enqueueWater(below.x, below.y, below.z);
        for (const [sx, sy, sz] of [[node.x + 1, node.y, node.z], [node.x - 1, node.y, node.z], [node.x, node.y, node.z + 1], [node.x, node.y, node.z - 1]] as const) {
          if (world.getBlockWorld(sx, sy, sz) === 0) enqueueWater(sx, sy, sz);
        }
      }
    };

    const breakState = { holdingLeft: false, timer: 0, targetKey: "" };
    let breakProgressValue = 0;
    const breakTexLoader = new THREE.TextureLoader();
    const breakTextures = Array.from({ length: 10 }, (_, i) => {
      const tex = breakTexLoader.load(`/labs/minecraft/break/destroy_stage_${i}.png`);
      tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter;
      tex.wrapS = THREE.ClampToEdgeWrapping; tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    });
    const breakOverlayMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1, map: breakTextures[0],
    });
    const breakOverlay = new THREE.Mesh(new THREE.BoxGeometry(1.02, 1.02, 1.02), breakOverlayMaterial);
    breakOverlay.visible = false;
    scene.add(breakOverlay);

    const onMouseDownDestroy = (e: MouseEvent) => {
      ensureWandaAudio();
      if (showInventoryRef.current) return;
      if (document.pointerLockElement !== renderer.domElement) return;
      const selectedItem = inventoryRef.current[selectedSlotRef.current]?.item ?? null;

      if (selectedItem === "wanda_focus" && e.button === 2) {
        wandaTelekHold = true;
        tryStartTelekinesis();
        wandaMode = "telek_hold";
        wandaTone(180, 0.22, "triangle", 0.07);
        return;
      }
      if (selectedItem === "wanda_focus" && e.button === 0) {
        wandaCharging = true;
        wandaPrimaryBeamHold = true;
        wandaChargeTime = 0;
        wandaMode = "charging";
        wandaTone(140, 0.1, "sine", 0.04);
        return;
      }

      if (e.button === 0 && selectedItem && (selectedItem.endsWith("sword") || selectedItem.endsWith("axe") || selectedItem.endsWith("pickaxe"))) {
        swingTime = 0.24;
      }

      // Thunder staff: LMB to strike lightning at target
      if (e.button === 0 && selectedItem === "thunder_staff") {
        if (thunderCooldown > 0) return;
        const origin = controller.getViewPosition(new THREE.Vector3());
        const dir = controller.getCameraDirection(new THREE.Vector3());
        const hit = raycastVoxel(world, origin, dir, 22);
        if (hit) {
          strikeThunder(hit.x, hit.y, hit.z);
          thunderCooldown = 6.0;
          setThunderCooldownUI(6.0);
        }
        return;
      }

      if (e.button === 0 && selectedItem === "water_orb") {
        fireArrow(0.85, false, true);
        return;
      }

      if (e.button === 0 && selectedItem === "rifle") {
        if (rifleCooldown > 0) return;
        if (gunState.rifle.reloadT > 0) return;
        if (gunState.rifle.ammo <= 0) { startReload("rifle"); return; }
        const origin = controller.getViewPosition(new THREE.Vector3());
        const dir = controller.getCameraDirection(new THREE.Vector3()).normalize();
        const spread = 0.012;
        dir.x += (Math.random() - 0.5) * spread;
        dir.y += (Math.random() - 0.5) * spread;
        dir.z += (Math.random() - 0.5) * spread;
        dir.normalize();
        hitscanShoot(origin, dir, 42, 9, "#e2e8f0");
        gunState.rifle.ammo = Math.max(0, gunState.rifle.ammo - 1);
        gunKick = Math.min(1, gunKick + 0.55);
        rifleCooldown = 0.18;
        screenShakeTimer = 0.08; screenShakeIntensity = 0.05;
        if (gunState.rifle.ammo <= 0) startReload("rifle");
        return;
      }
      if (e.button === 0 && selectedItem === "smg") {
        smgHolding = true;
        smgAutoTimer = 0;
        if (smgCooldown > 0) return;
        if (gunState.smg.reloadT > 0) return;
        if (gunState.smg.ammo <= 0) { startReload("smg"); return; }
        const origin = controller.getViewPosition(new THREE.Vector3());
        const dir = controller.getCameraDirection(new THREE.Vector3()).normalize();
        const spread = 0.024;
        dir.x += (Math.random() - 0.5) * spread;
        dir.y += (Math.random() - 0.5) * spread;
        dir.z += (Math.random() - 0.5) * spread;
        dir.normalize();
        hitscanShoot(origin, dir, 36, 5, "#cbd5e1");
        gunState.smg.ammo = Math.max(0, gunState.smg.ammo - 1);
        gunKick = Math.min(1, gunKick + 0.28);
        smgCooldown = 0.08;
        screenShakeTimer = 0.06; screenShakeIntensity = 0.035;
        if (gunState.smg.ammo <= 0) startReload("smg");
        return;
      }
      if (e.button === 0 && selectedItem === "shotgun") {
        if (shotgunCooldown > 0) return;
        if (gunState.shotgun.reloadT > 0) return;
        if (gunState.shotgun.ammo <= 0) { startReload("shotgun"); return; }
        const origin = controller.getViewPosition(new THREE.Vector3());
        const baseDir = controller.getCameraDirection(new THREE.Vector3()).normalize();
        for (let p = 0; p < 7; p++) {
          const dir = baseDir.clone();
          const spread = 0.06;
          dir.x += (Math.random() - 0.5) * spread;
          dir.y += (Math.random() - 0.5) * spread;
          dir.z += (Math.random() - 0.5) * spread;
          dir.normalize();
          hitscanShoot(origin, dir, 24, 3, "#f8fafc");
        }
        gunState.shotgun.ammo = Math.max(0, gunState.shotgun.ammo - 1);
        gunKick = Math.min(1, gunKick + 0.85);
        shotgunCooldown = 0.6;
        screenShakeTimer = 0.12; screenShakeIntensity = 0.08;
        if (gunState.shotgun.ammo <= 0) startReload("shotgun");
        return;
      }

      if (e.button === 0 && (selectedItem === "bow" || selectedItem === "fire_bow")) {
        if (bowCooldown > 0) return;
        isDrawingBow = true; bowDrawTime = 0;
        return;
      }

      const origin = controller.getViewPosition(new THREE.Vector3());
      const dir = controller.getCameraDirection(new THREE.Vector3());

      if (e.button === 0) {
        if (selectedItem === "smg" && smgHolding) return;
        let bestIdx = -1, bestDist = 3.2;
        for (let i = 0; i < mobs.length; i++) {
          const toMob = mobs[i].mesh.position.clone().sub(origin);
          const proj = toMob.dot(dir);
          if (proj < 0 || proj > bestDist) continue;
          const closest = origin.clone().addScaledVector(dir, proj);
          const radial = closest.distanceTo(mobs[i].mesh.position);
          if (radial > 0.85) continue;
          bestDist = proj; bestIdx = i;
        }
        if (bestIdx >= 0) {
          swingTime = 0.18;
          const dmg = selectedItem === "stone_sword" ? 8 : selectedItem === "wood_sword" ? 5
            : selectedItem === "stone_axe" ? 6 : selectedItem === "wood_axe" ? 4 : 2;
          mobs[bestIdx].health -= dmg;
          mobs[bestIdx].mesh.scale.set(1.12, 0.92, 1.12);
          if (mobs[bestIdx].health <= 0) killMob(bestIdx);
          return;
        }
      }

      const hit = raycastVoxel(world, origin, dir, 9.5);
      if (!hit) return;
      if (e.button === 0) {
        breakState.holdingLeft = true; breakState.timer = 0;
        breakState.targetKey = `${hit.x},${hit.y},${hit.z}`;
        return;
      }
      if (e.button !== 2) return;
      if (!hit.place) return;
      const selected = inventoryRef.current[selectedSlotRef.current];
      if (!selected) return;
      const { x: placeX, y: placeY, z: placeZ } = hit.place;
      if (world.getBlockWorld(placeX, placeY, placeZ) !== 0) return;
      const bodyMinY = controller.position.y, bodyMaxY = controller.position.y + 1.82;
      const intersectsPlayer = placeX >= Math.floor(controller.position.x - 0.35) && placeX <= Math.floor(controller.position.x + 0.35)
        && placeZ >= Math.floor(controller.position.z - 0.35) && placeZ <= Math.floor(controller.position.z + 0.35)
        && placeY + 1 > bodyMinY && placeY < bodyMaxY;
      if (intersectsPlayer) return;
      const placementItem = consumeSelectedOne();
      if (!placementItem) return;
      const itemBlock = fromBlockItem(placementItem);
      if (itemBlock === null || itemBlock === 4) { tryAddToInventory(placementItem); return; }
      const changed = world.setBlockWorld(placeX, placeY, placeZ, itemBlock);
      if (!changed) { tryAddToInventory(placementItem); return; }
      markWorldPosDirty(placeX, placeZ);
    };
    window.addEventListener("mousedown", onMouseDownDestroy);

    const onMouseUpBreak = (e: MouseEvent) => {
      if (e.button === 2) {
        if (tkField.active) {
          const dir = controller.getCameraDirection(new THREE.Vector3()).normalize();
          const releasePower = Math.max(0.35, Math.min(1, tkField.releaseCharge));
          const impulse = wandaTkStrength * (0.8 + releasePower * 0.95);
          if (tkMeteorHeld && tkMeteorHeld.mass > 0) {
            const root = tkMeteorHeld.root;
            const worldPos = new THREE.Vector3();
            root.getWorldPosition(worldPos);
            const items = new Map(tkMeteorHeld.items);
            const mass = tkMeteorHeld.mass;
            wandaGroup.remove(root);
            scene.add(root);
            root.position.copy(worldPos);
            const spd = 16 + releasePower * 22 + Math.min(18, mass * 0.42);
            const vel = dir.clone().multiplyScalar(spd);
            tkMeteorFlying.push({ mesh: root, velocity: vel, items, mass, life: 0, prevPos: worldPos.clone() });
            tkMeteorHeld = null;
            wandaTone(90, 0.12, "sawtooth", 0.09);
          }
          for (const target of tkField.captured) {
            if (target.kind === "mob") {
              const idx = mobs.indexOf(target.ref);
              if (idx < 0) continue;
              removeWandaTkGlow(target.ref.mesh);
              const radial = mobs[idx].mesh.position.clone().sub(tkField.center).normalize();
              const launch = dir.clone().multiplyScalar(impulse).addScaledVector(radial, impulse * 0.42);
              mobs[idx].velocity.add(launch);
              mobs[idx].velocity.y += impulse * 0.32;
              mobs[idx].health -= Math.round(3 + releasePower * 7);
              if (mobs[idx].health <= 0) killMob(idx);
            } else {
              removeWandaTkGlow(target.ref.mesh);
              const radial = target.ref.mesh.position.clone().sub(tkField.center).normalize();
              target.ref.velocity.add(dir.clone().multiplyScalar(impulse * 0.85)).addScaledVector(radial, impulse * 0.28);
              target.ref.velocity.y += impulse * 0.22;
            }
          }
          for (const mp of mobProjectiles) {
            if (mp.captureKind !== "telek") continue;
            removeWandaTkGlow(mp.mesh);
            mp.captureKind = "none";
            mp.velocity.add(dir.clone().multiplyScalar(impulse * 1.15));
            mp.velocity.y += impulse * 0.25;
          }
          const splashCenter = tkField.center.clone().addScaledVector(dir, 0.35);
          for (let i = mobs.length - 1; i >= 0; i--) {
            const d = mobs[i].mesh.position.distanceTo(splashCenter);
            if (d > tkField.radius * 1.25) continue;
            mobs[i].velocity.add(mobs[i].mesh.position.clone().sub(splashCenter).normalize().multiplyScalar((1 - d / (tkField.radius * 1.25)) * impulse * 0.8));
            mobs[i].health -= Math.round(2 + (1 - d / (tkField.radius * 1.25)) * 5);
            if (mobs[i].health <= 0) killMob(i);
          }
          spawnWandaBurst(splashCenter.x, splashCenter.y, splashCenter.z, 1.05 + releasePower * 0.85);
          wandaTone(120, 0.18, "sawtooth", 0.08);
        }
        tkField.active = false;
        tkField.releaseCharge = 0;
        tkField.captured.length = 0;
        wandaTelekHold = false;
        if (wandaMode === "telek_hold") wandaMode = "idle";
        return;
      }
      if (e.button !== 0) return;
      smgHolding = false;
      wandaPrimaryBeamHold = false;
      if (wandaCharging) {
        const charge = Math.max(0.08, Math.min(1, wandaChargeTime / 1.1));
        spawnWandaBurst(controller.position.x, controller.position.y + 0.9, controller.position.z, 0.7 + charge * 0.8);
        wandaTone(180 + charge * 120, 0.15, "sawtooth", 0.07);
        wandaCharging = false;
        wandaPrimaryBeamHold = false;
        wandaChargeTime = 0;
        wandaMode = "idle";
      }
      if (isDrawingBow) {
        const power = Math.max(0.16, Math.min(1, bowDrawTime / 0.9));
        const currentItem = inventoryRef.current[selectedSlotRef.current]?.item ?? null;
        fireArrow(power, currentItem === "fire_bow");
        bowCooldown = 0.15 + (1 - power) * 0.12;
        isDrawingBow = false; bowDrawTime = 0;
      }
      breakState.holdingLeft = false; breakState.timer = 0; breakState.targetKey = "";
      breakProgressValue = 0;
    };
    window.addEventListener("mouseup", onMouseUpBreak);

    const onWheelSlot = (e: WheelEvent) => {
      if (showInventoryRef.current) return;
      if (document.pointerLockElement !== renderer.domElement) return;
      if (wandaTelekHold && tkField.active) {
        wandaTkDistance = Math.max(4.5, Math.min(18, wandaTkDistance + (e.deltaY > 0 ? 0.75 : -0.75)));
        wandaTkRadius = Math.max(2.2, Math.min(7.4, wandaTkRadius + (e.deltaY > 0 ? -0.2 : 0.2)));
        tkField.radius = wandaTkRadius;
        wandaTkStrength = Math.max(16, Math.min(48, wandaTkStrength + (e.deltaY > 0 ? -1.1 : 1.1)));
        return;
      }
      setSelectedSlot((prev) => { const dir = e.deltaY > 0 ? 1 : -1; return (prev + dir + 9) % 9; });
    };
    const onKeySlot = (e: KeyboardEvent) => {
      ensureWandaAudio();
      if (e.code === "KeyE") {
        e.preventDefault();
        setShowInventory((prev) => {
          const next = !prev;
          if (next && document.pointerLockElement === renderer.domElement) document.exitPointerLock();
          return next;
        });
        return;
      }
      if (e.code === "KeyR") {
        if (showInventoryRef.current) return;
        const cur = inventoryRef.current[selectedSlotRef.current]?.item ?? null;
        if (cur === "rifle" || cur === "smg" || cur === "shotgun") {
          startReload(cur);
        }
        return;
      }
      if (e.code === "Space") wandaFlyUp = true;
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") wandaDescend = true;
      if (e.code === "KeyQ") {
        const cur = inventoryRef.current[selectedSlotRef.current]?.item ?? null;
        if (cur === "wanda_focus" && wandaShieldCd <= 0) {
          wandaShieldTimer = 3.2;
          wandaShieldCd = 10;
          wandaShieldAbsorb = 20;
          wandaMode = "shielding";
          spawnWandaBurst(controller.position.x, controller.position.y + 0.9, controller.position.z, 1.15);
          wandaTone(110, 0.32, "triangle", 0.09);
        }
      }
      if (e.code === "KeyF") {
        const cur = inventoryRef.current[selectedSlotRef.current]?.item ?? null;
        if (cur === "wanda_focus" && wandaUltCd <= 0 && wandaUltCastTimer <= 0 && wandaUltAfterTimer <= 0) {
          wandaUltCd = 18;
          wandaUltCastTimer = 0.8; // windup
          wandaUltAfterTimer = 0.45; // aftermath pulse
          wandaUltCenter.set(controller.position.x, controller.position.y + 0.9, controller.position.z);
          wandaMode = "ultimate_cast";
          spawnWandaBurst(wandaUltCenter.x, wandaUltCenter.y, wandaUltCenter.z, 1.25);
          wandaTone(72, 0.42, "sawtooth", 0.11);
        }
      }
      if (e.code.startsWith("Digit")) {
        const n = Number(e.code.slice(5));
        if (n >= 1 && n <= 9) setSelectedSlot(n - 1);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") wandaFlyUp = false;
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") wandaDescend = false;
    };
    window.addEventListener("wheel", onWheelSlot, { passive: true });
    window.addEventListener("keydown", onKeySlot);
    window.addEventListener("keyup", onKeyUp);

    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      renderer.setSize(w, h);
      bloomComposer.setSize(w, h);
      bloomPass.setSize(w, h);
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", resize);

    const clock = new THREE.Clock();
    let raf = 0, syncTimer = 0, waterTickTimer = 0, mobSpawnTimer = 0, regenTimer = 0, lastChunkPos = "";

    const tick = () => {
      const dt = Math.min(0.05, clock.getDelta());
      if (!showInventoryRef.current) controller.update(dt);
      syncHeldItem();

      // Thunder cooldown tick
      if (thunderCooldown > 0) {
        thunderCooldown = Math.max(0, thunderCooldown - dt);
        setThunderCooldownUI(thunderCooldown);
      }
      if (rifleCooldown > 0) rifleCooldown = Math.max(0, rifleCooldown - dt);
      if (smgCooldown > 0) smgCooldown = Math.max(0, smgCooldown - dt);
      if (shotgunCooldown > 0) shotgunCooldown = Math.max(0, shotgunCooldown - dt);
      if (wandaShieldCd > 0) wandaShieldCd = Math.max(0, wandaShieldCd - dt);
      if (wandaUltCd > 0) wandaUltCd = Math.max(0, wandaUltCd - dt);
      if (wandaShieldTimer > 0) wandaShieldTimer = Math.max(0, wandaShieldTimer - dt);
      if (wandaCharging) wandaChargeTime = Math.min(1.5, wandaChargeTime + dt);
      if (wandaShieldTimer <= 0 && wandaShieldAbsorb > 0) wandaShieldAbsorb = Math.max(0, wandaShieldAbsorb - dt * 8);

      const wandaEquipped = (inventoryRef.current[selectedSlotRef.current]?.item ?? null) === "wanda_focus";
      if (wandaEquipped && !showInventoryRef.current) {
        if (wandaFlyUp && wandaEnergy > 0) wandaFlightActive = true;
        if (!wandaFlyUp && !wandaDescend && controller.debug.onGround) wandaFlightActive = false;
        if (wandaEnergy <= 0.5) wandaFlightActive = false;
        if (wandaFlightActive) wandaMode = "flying";
        const liftTarget = wandaFlightActive ? (wandaDescend ? 0.22 : 1) : 0;
        wandaFlightLift = THREE.MathUtils.damp(wandaFlightLift, liftTarget, 5.4, dt);
        const look = controller.getCameraDirection(new THREE.Vector3()).normalize();
        wandaFlightForward = THREE.MathUtils.lerp(wandaFlightForward, wandaFlightActive ? 1 : 0, Math.min(1, dt * 5));
        if (wandaFlightLift > 0.01) {
          const lift = 18.5 * wandaFlightLift;
          const baseUp = wandaFlyUp ? 6.6 : wandaDescend ? -4.4 : 1.2;
          controller.velocity.y = THREE.MathUtils.clamp(controller.velocity.y + (lift + baseUp) * dt, -9.5, 12.5);
          controller.velocity.x = THREE.MathUtils.clamp(controller.velocity.x * 0.975 + look.x * (7.6 * wandaFlightForward) * dt, -10, 10);
          controller.velocity.z = THREE.MathUtils.clamp(controller.velocity.z * 0.975 + look.z * (7.6 * wandaFlightForward) * dt, -10, 10);
          if (wandaFlyUp) controller.velocity.y = Math.max(controller.velocity.y, 4.4);
          wandaEnergy = Math.max(0, wandaEnergy - (11 + wandaFlightLift * 11) * dt);
          if (Math.random() < 0.16) {
            spawnWandaBurst(controller.position.x - look.x * 0.25, controller.position.y + 0.35, controller.position.z - look.z * 0.25, 0.14 + wandaFlightLift * 0.14);
          }
        } else if (wandaMode === "flying") {
          wandaMode = "idle";
        }
      }
      wandaEnergy = Math.min(100, wandaEnergy + (wandaEquipped ? (wandaFlightActive ? 5.5 : 10) : 14) * dt);
      if (!wandaEquipped && wandaMode !== "ultimate_cast" && wandaMode !== "shielding") wandaMode = "idle";
      if (wandaShieldTimer <= 0 && wandaMode === "shielding") wandaMode = "idle";

      if (wandaTelekHold && tkField.active && wandaEquipped) {
        wandaMode = "telek_hold";
        const targetPos = controller.getViewPosition(new THREE.Vector3()).addScaledVector(controller.getCameraDirection(new THREE.Vector3()), wandaTkDistance);
        tkField.center.lerp(targetPos, Math.min(1, dt * 7));
        tkField.releaseCharge = Math.min(1, tkField.releaseCharge + dt * 0.58);
        tkFieldPreview.visible = true;
        tkFieldPreview.position.copy(tkField.center);
        tkFieldPreview.scale.setScalar(tkField.radius * (1.45 + tkField.releaseCharge * 0.22));
        (tkFieldPreview.material as THREE.MeshPhysicalMaterial).opacity = 0.07 + tkField.releaseCharge * 0.06;
        for (const m of mobs) {
          if (tkField.captured.some((t) => t.kind === "mob" && t.ref === m)) continue;
          if (m.mesh.position.distanceTo(tkField.center) > tkField.radius + 2.4) continue;
          tkField.captured.push({ kind: "mob", ref: m, anchor: new THREE.Vector3(), weight: 1 + Math.random() * 0.5 });
        }
        for (let di = drops.length - 1; di >= 0; di--) {
          const d = drops[di];
          if (d.mesh.position.distanceTo(tkField.center) > tkField.radius + 2.8) continue;
          if (fromBlockItem(d.item) !== null && fromBlockItem(d.item) !== 4) {
            if (mergeDropIntoMeteor(d)) continue;
          }
          if (tkField.captured.some((t) => t.kind === "drop" && t.ref === d)) continue;
          tkField.captured.push({ kind: "drop", ref: d, anchor: new THREE.Vector3(), weight: 0.45 + Math.random() * 0.35 });
        }
        for (let vacuum = 0; vacuum < 5; vacuum++) {
          const cx = Math.floor(tkField.center.x + (Math.random() - 0.5) * tkField.radius * 2.2);
          const cy = Math.floor(tkField.center.y + (Math.random() - 0.5) * tkField.radius * 1.25);
          const cz = Math.floor(tkField.center.z + (Math.random() - 0.5) * tkField.radius * 2.2);
          const b = world.getBlockWorld(cx, cy, cz);
          if (b !== 0 && b !== 4) {
            if (world.setBlockWorld(cx, cy, cz, 0)) {
              markWorldPosDirty(cx, cz);
              const item = toBlockItem(b as BlockType);
              if (!tkMeteorHeld) {
                tkMeteorHeld = { root: new THREE.Group(), items: new Map(), mass: 0 };
                wandaGroup.add(tkMeteorHeld.root);
              }
              const prev = tkMeteorHeld.items.get(item) ?? 0;
              tkMeteorHeld.items.set(item, prev + 1);
              tkMeteorHeld.mass += 1;
              rebuildMeteorHeldMesh(tkMeteorHeld);
            }
          }
        }
        if (tkMeteorHeld && tkMeteorHeld.mass > 0) {
          tkMeteorHeld.root.position.lerp(tkField.center, Math.min(1, dt * 12));
          tkMeteorHeld.root.rotation.x += dt * 0.9;
          tkMeteorHeld.root.rotation.y += dt * 1.35;
        }
        const eye = controller.getViewPosition(new THREE.Vector3());
        const phase = clock.elapsedTime * 3.2;
        tkField.captured = tkField.captured.filter((t, idx) => {
          if (t.kind === "mob" && !mobs.includes(t.ref)) return false;
          if (t.kind === "drop" && !drops.includes(t.ref)) return false;
          const targetObj = t.ref.mesh.position;
          const ringOffset = new THREE.Vector3(
            Math.cos(phase + idx * 0.6) * tkField.radius * 0.45,
            0.55 + Math.sin(phase * 0.7 + idx) * 0.35,
            Math.sin(phase + idx * 0.6) * tkField.radius * 0.45
          );
          const holdPos = tkField.center.clone().add(ringOffset);
          const to = holdPos.sub(targetObj);
          const spring = 18 + tkField.releaseCharge * 10;
          const damping = 0.85;
          if (t.kind === "mob") {
            t.ref.velocity.addScaledVector(to, spring * dt * t.weight);
            t.ref.velocity.multiplyScalar(damping);
            t.ref.velocity.y += (1.1 + tkField.releaseCharge) * dt;
            (t.ref.burnOverlay.material as THREE.MeshBasicMaterial).color = new THREE.Color("#9f1239");
            (t.ref.burnOverlay.material as THREE.MeshBasicMaterial).opacity = 0.18 + tkField.releaseCharge * 0.28;
            addWandaTkGlow(t.ref.mesh, 0.52 + Math.min(0.28, t.weight * 0.08));
          } else {
            t.ref.velocity.addScaledVector(to, spring * dt * 0.8);
            t.ref.velocity.multiplyScalar(0.86);
            t.ref.velocity.y += 0.65 * dt;
            t.ref.mesh.scale.setScalar(1.05 + Math.sin(phase + idx) * 0.06);
            addWandaTkGlow(t.ref.mesh, 0.4 + tkField.releaseCharge * 0.12);
          }
          if (idx < 7) {
            const tether = new THREE.Line(
              new THREE.BufferGeometry().setFromPoints([eye, targetObj.clone()]),
              new THREE.ShaderMaterial({
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                uniforms: {
                  uColorA: { value: new THREE.Color("#5c0a12") },
                  uColorB: { value: new THREE.Color("#b91c1c") },
                  uAlpha: { value: 0.48 + tkField.releaseCharge * 0.24 },
                },
                vertexShader: "varying float vSeg; void main(){ vSeg = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
                fragmentShader: "uniform vec3 uColorA; uniform vec3 uColorB; uniform float uAlpha; varying float vSeg; void main(){ vec3 c = mix(uColorA,uColorB,0.55); gl_FragColor = vec4(c,uAlpha); }",
              })
            );
            wandaGroup.add(tether);
            wandaTethers.push({ mesh: tether, ttl: 0.07, max: 0.07 });
          }
          return true;
        });
      } else {
        tkFieldPreview.visible = false;
        if (!wandaTelekHold) {
          for (const t of tkField.captured) {
            removeWandaTkGlow(t.ref.mesh);
          }
          tkField.active = false;
          tkField.captured.length = 0;
          tkField.releaseCharge = 0;
          if (tkMeteorHeld && tkMeteorHeld.mass > 0) {
            scatterTkMeteorHeldToDrops(tkField.center.x, tkField.center.y, tkField.center.z);
          }
        }
      }

      const handMid = handAuraL.position.clone().add(handAuraR.position).multiplyScalar(0.5);
      quarkCharge.ps.emitter.position.copy(handMid);
      quarkTelek.ps.emitter.position.copy(tkField.center);
      quarkShield.ps.emitter.position.set(controller.position.x, controller.position.y + 0.9, controller.position.z);
      quarkUlt.ps.emitter.position.copy(wandaUltCenter);
      quarkBeamMuzzle.ps.emitter.position.copy(handAuraR.position);
      const primaryBeamCurve = wandaBeamVisuals[0]?.curve;
      quarkBeamTrail.ps.emitter.position.copy(
        primaryBeamCurve ? primaryBeamCurve.getPoint(0.52) : handAuraR.position
      );
      setQuarkRate(quarkCharge, wandaCharging ? 28 + wandaChargeTime * 90 : 0);
      setQuarkRate(quarkTelek, tkField.active ? 46 + tkField.releaseCharge * 84 : 0);
      setQuarkRate(quarkShield, wandaShieldTimer > 0 ? 34 : 0);
      setQuarkRate(quarkUlt, wandaUltCastTimer > 0 || wandaUltAfterTimer > 0 ? 68 : 0);
      setQuarkRate(quarkBeamMuzzle, wandaBeamIntensity > 0.06 ? 10 + wandaBeamIntensity * 26 : 0);
      setQuarkRate(quarkBeamTrail, wandaBeamIntensity > 0.06 ? 8 + wandaBeamIntensity * 20 : 0);
      quarksRenderer.update(dt);

      // Reload timers
      for (const id of ["rifle", "smg", "shotgun"] as const) {
        const st = gunState[id];
        if (st.reloadT > 0) {
          st.reloadT = Math.max(0, st.reloadT - dt);
          if (st.reloadT <= 0) st.ammo = GUNS[id].mag;
        }
      }

      // SMG auto-fire while holding click
      if (smgHolding && !showInventoryRef.current && document.pointerLockElement === renderer.domElement) {
        const cur = inventoryRef.current[selectedSlotRef.current]?.item ?? null;
        if (cur === "smg") {
          smgAutoTimer += dt;
          if (smgCooldown <= 0 && smgAutoTimer >= 0.0001) {
            if (gunState.smg.reloadT > 0) { smgCooldown = 0.02; smgAutoTimer = 0; }
            else if (gunState.smg.ammo <= 0) { startReload("smg"); smgCooldown = 0.08; smgAutoTimer = 0; }
            else {
            const origin = controller.getViewPosition(new THREE.Vector3());
            const dir = controller.getCameraDirection(new THREE.Vector3()).normalize();
            const spread = 0.026;
            dir.x += (Math.random() - 0.5) * spread;
            dir.y += (Math.random() - 0.5) * spread;
            dir.z += (Math.random() - 0.5) * spread;
            dir.normalize();
            hitscanShoot(origin, dir, 36, 5, "#cbd5e1");
            gunState.smg.ammo = Math.max(0, gunState.smg.ammo - 1);
            smgCooldown = 0.08;
            smgAutoTimer = 0;
            screenShakeTimer = 0.06; screenShakeIntensity = 0.035;
            gunKick = Math.min(1, gunKick + 0.18);
            if (gunState.smg.ammo <= 0) startReload("smg");
            }
          }
        } else {
          smgHolding = false;
        }
      }

      updateWeaponHud();

      // Ultimate cast phases: windup -> burst -> aftermath
      if (wandaUltCastTimer > 0) {
        wandaUltCastTimer = Math.max(0, wandaUltCastTimer - dt);
        const hexRadius = 14.5;
        for (let m = mobs.length - 1; m >= 0; m--) {
          const toC = wandaUltCenter.clone().sub(mobs[m].mesh.position);
          const d = toC.length();
          if (d > hexRadius) continue;
          const pull = Math.max(0.1, 1 - d / hexRadius);
          mobs[m].velocity.addScaledVector(toC.normalize(), (8 + pull * 13) * dt);
          mobs[m].velocity.y += (2.5 + pull * 2.8) * dt;
          mobs[m].health -= dt * (4.5 + pull * 7.5);
          mobs[m].mesh.scale.set(1.14, 0.88, 1.14);
          if (mobs[m].health <= 0) { killMob(m); continue; }
        }
        for (const mp of mobProjectiles) {
          const d = mp.mesh.position.distanceTo(wandaUltCenter);
          if (d <= hexRadius) mp.captureKind = "telek";
        }
        if (Math.random() < 0.28) {
          const jitter = new THREE.Vector3((Math.random() - 0.5) * 1.2, Math.random() * 0.8, (Math.random() - 0.5) * 1.2);
          spawnWandaBurst(wandaUltCenter.x + jitter.x, wandaUltCenter.y + jitter.y, wandaUltCenter.z + jitter.z, 0.42);
        }
        if (wandaUltCastTimer <= 0) {
          const radius = 12.5;
          spawnWandaBurst(wandaUltCenter.x, wandaUltCenter.y, wandaUltCenter.z, 2.8);
          wandaTone(58, 0.62, "sawtooth", 0.14);
          for (let m = mobs.length - 1; m >= 0; m--) {
            const d = mobs[m].mesh.position.distanceTo(wandaUltCenter);
            if (d > radius) continue;
            const f = Math.max(0, 1 - d / radius);
            mobs[m].health -= Math.ceil(36 * f);
            const push = mobs[m].mesh.position.clone().sub(wandaUltCenter).normalize();
            mobs[m].velocity.addScaledVector(push, 19 * f);
            mobs[m].velocity.y += 9.5 * f;
            mobs[m].burnTimer = Math.max(mobs[m].burnTimer, 2.4 * f);
            if (mobs[m].health <= 0) killMob(m);
          }
          for (let i = 0; i < 18; i++) {
            const a = (i / 18) * Math.PI * 2;
            const r = 2.5 + Math.random() * 5.2;
            spawnWandaBurst(
              wandaUltCenter.x + Math.cos(a) * r,
              wandaUltCenter.y + 0.2 + Math.random() * 0.8,
              wandaUltCenter.z + Math.sin(a) * r,
              0.8
            );
          }
          screenShakeTimer = 0.34;
          screenShakeIntensity = 0.14;
        }
      }
      if (wandaUltAfterTimer > 0) {
        wandaUltAfterTimer = Math.max(0, wandaUltAfterTimer - dt);
        const detRadius = 12.5;
        for (let m = mobs.length - 1; m >= 0; m--) {
          const d = mobs[m].mesh.position.distanceTo(wandaUltCenter);
          if (d > detRadius) continue;
          const w = Math.max(0.15, 1 - d / detRadius);
          mobs[m].health -= dt * (6 + w * 9);
          mobs[m].velocity.addScaledVector(mobs[m].mesh.position.clone().sub(wandaUltCenter).normalize(), w * 10.5 * dt);
          if (mobs[m].health <= 0) { killMob(m); continue; }
        }
        if (Math.random() < 0.18) {
          const a = Math.random() * Math.PI * 2;
          const r = 1.4 + Math.random() * 2.4;
          spawnWandaBurst(
            wandaUltCenter.x + Math.cos(a) * r,
            wandaUltCenter.y + Math.random() * 0.6,
            wandaUltCenter.z + Math.sin(a) * r,
            0.45
          );
        }
        if (wandaUltAfterTimer <= 0 && wandaMode === "ultimate_cast") wandaMode = "idle";
      }

      if (wandaAudioReady && wandaAudioCtx && wandaHumGain && wandaHumOsc) {
        if (wandaMode === "shielding") wandaHumTarget = 0.028;
        else if (wandaMode === "telek_hold") wandaHumTarget = 0.02;
        else if (wandaMode === "charging") wandaHumTarget = 0.012 + Math.min(1, wandaChargeTime) * 0.02;
        else wandaHumTarget = 0.0;
        const tNow = wandaAudioCtx.currentTime;
        wandaHumGain.gain.cancelScheduledValues(tNow);
        wandaHumGain.gain.linearRampToValueAtTime(wandaHumTarget, tNow + 0.06);
        wandaHumOsc.frequency.linearRampToValueAtTime(88 + wandaHumTarget * 240, tNow + 0.06);
      }
      if (wandaMode !== wandaLastMode && wandaAudioReady) {
        if (wandaMode === "telek_hold") wandaTone(165, 0.12, "triangle", 0.05);
        if (wandaMode === "flying") wandaTone(210, 0.1, "sine", 0.04);
        wandaLastMode = wandaMode;
      }

      if (heldItemMesh) {
        const t = clock.elapsedTime;
        const swayX = Math.sin(t * 6.2) * 0.01;
        const swayY = Math.cos(t * 4.1) * 0.008;
        const drawAmount = isDrawingBow ? Math.min(1, bowDrawTime / 0.9) : 0;
        if (isDrawingBow) bowDrawTime = Math.min(1.2, bowDrawTime + dt);
        if (bowCooldown > 0) bowCooldown = Math.max(0, bowCooldown - dt);
        if (swingTime > 0) swingTime = Math.max(0, swingTime - dt);
        gunKick = Math.max(0, gunKick - dt * 8.5);
        const currentItem = inventoryRef.current[selectedSlotRef.current]?.item ?? null;
        const isBow = currentItem === "bow" || currentItem === "fire_bow";
        const isThunder = currentItem === "thunder_staff";
        const isGun = currentItem === "rifle" || currentItem === "smg" || currentItem === "shotgun";
        const isWanda = currentItem === "wanda_focus";

        // Thunder staff sway animation
        if (isThunder) {
          const staffBob = Math.sin(t * 4) * 0.008;
          heldItemRoot.position.set(0.28 + swayX, -0.22 + swayY + staffBob, -0.48);
          heldItemRoot.rotation.set(-0.28, 0.38, -0.05 + Math.sin(t * 3.5) * 0.02);
          // Animate crackle rings on thunder staff
          if (heldItemMesh) {
            heldItemMesh.children.forEach((child, idx) => {
              if (idx >= 2) { // crackle rings
                child.rotation.y += dt * (2.5 + idx * 1.2);
                (child as THREE.Mesh).scale.setScalar(0.9 + Math.sin(t * 8 + idx) * 0.12);
              }
            });
          }
        } else if (isWanda) {
          const pulse = 0.35 + Math.sin(t * 8) * 0.12;
          heldItemRoot.position.set(0.28 + swayX, -0.19 + swayY, -0.44);
          heldItemRoot.rotation.set(-0.28, 0.24, -0.14);
          if (heldItemMesh) {
            heldItemMesh.rotation.y += dt * 1.9;
            heldItemMesh.rotation.x = Math.sin(t * 4) * 0.15;
            heldItemMesh.scale.setScalar(1 + pulse * 0.08);
          }
        } else {
          heldItemRoot.position.set(
            (isBow ? 0.3 : 0.34) + swayX,
            (isBow ? -0.24 : -0.28) + swayY,
            (isBow ? -0.52 : -0.58) + drawAmount * (isBow ? 0.08 : 0.05)
          );
          heldItemRoot.rotation.set(
            (isBow ? -0.22 : -0.36) - drawAmount * 0.18,
            (isBow ? 0.2 : 0.52) - drawAmount * 0.55,
            (isBow ? 0.08 : -0.12) - swingTime * 1.3
          );
          if (isGun) {
            const kick = gunKick;
            heldItemRoot.position.z += kick * 0.06;
            heldItemRoot.position.y -= kick * 0.02;
            heldItemRoot.rotation.x -= kick * 0.22;
            heldItemRoot.rotation.y += kick * 0.06;
          }
          if (!isBow && currentItem?.endsWith("sword")) {
            const attack = Math.max(0, Math.min(1, swingTime / 0.24));
            const tAtk = 1 - attack;
            const arc = Math.sin(tAtk * Math.PI);
            const sweep = THREE.MathUtils.lerp(0.2, -0.12, tAtk);
            heldItemRoot.position.x += sweep;
            heldItemRoot.position.y -= arc * 0.11;
            heldItemRoot.rotation.x -= arc * 1.6;
            heldItemRoot.rotation.y += arc * 1.05;
            heldItemRoot.rotation.z -= 0.45 + arc * 1.85;
          }
        }

        if (heldBowString) {
          const pts = [
            new THREE.Vector3(-0.085, 0.34, 0),
            new THREE.Vector3(0.015 + drawAmount * 0.13, 0, 0),
            new THREE.Vector3(-0.085, -0.34, 0),
          ];
          (heldBowString.geometry as THREE.BufferGeometry).setFromPoints(pts);
        }
        if (heldBowArrow) {
          heldBowArrow.visible = isBow && (isDrawingBow || bowDrawTime > 0.02);
          heldBowArrow.position.set(-0.03 + drawAmount * 0.13, 0, 0.1);
        }
      }

      const camDir = controller.getCameraDirection(new THREE.Vector3());
      const camRight = new THREE.Vector3().crossVectors(camDir, new THREE.Vector3(0, 1, 0)).normalize();
      const camPos = controller.getViewPosition(new THREE.Vector3());
      const leftPos = camPos.clone().addScaledVector(camDir, 0.44).addScaledVector(camRight, -0.24).add(new THREE.Vector3(0, -0.2, 0));
      const rightPos = camPos.clone().addScaledVector(camDir, 0.44).addScaledVector(camRight, 0.24).add(new THREE.Vector3(0, -0.2, 0));
      const wandaEquippedNow = (inventoryRef.current[selectedSlotRef.current]?.item ?? null) === "wanda_focus";
      if (ENABLE_WANDA_HANDS && leftHand && rightHand) {
        const pulse = Math.sin(clock.elapsedTime * 7.5) * 0.04;
        const chargeF = Math.min(1, wandaChargeTime / 1.1);
        const telekF = tkField.active ? Math.min(1, tkField.releaseCharge + 0.25) : 0;
        const flyF = wandaFlightActive ? 1 : 0;
        leftHand.visible = wandaEquippedNow;
        rightHand.visible = wandaEquippedNow;
        if (wandaEquippedNow) {
          const modeMul = wandaMode === "ultimate_cast" ? 1.2 : wandaMode === "shielding" ? 0.8 : wandaMode === "telek_hold" ? 1.05 : 1;
          const leftTargetX = wandaMode === "shielding" ? -0.34 : wandaMode === "ultimate_cast" ? -0.4 : -0.28;
          const rightTargetX = wandaMode === "shielding" ? 0.34 : wandaMode === "ultimate_cast" ? 0.4 : 0.28;
          const zForward = wandaMode === "charging" || wandaPrimaryBeamHold ? -0.2 : wandaMode === "telek_hold" ? -0.24 : -0.34;
          leftHand.position.lerp(new THREE.Vector3(leftTargetX, -0.34 + pulse * 0.28, zForward), Math.min(1, dt * 12));
          rightHand.position.lerp(new THREE.Vector3(rightTargetX, -0.34 - pulse * 0.28, zForward + (wandaPrimaryBeamHold ? 0.06 : 0)), Math.min(1, dt * 12));
          leftHand.rotation.x = -0.32 - chargeF * 0.95 - telekF * 0.35 + flyF * 0.22;
          rightHand.rotation.x = -0.34 - chargeF * 1.05 - telekF * 0.45 + flyF * 0.24 - (wandaPrimaryBeamHold ? 0.32 : 0);
          leftHand.rotation.y = -0.24 - telekF * 0.55;
          rightHand.rotation.y = 0.24 + telekF * 0.65 + (wandaPrimaryBeamHold ? 0.25 : 0);
          leftHand.rotation.z = -0.26 * modeMul + pulse * 0.7;
          rightHand.rotation.z = 0.26 * modeMul - pulse * 0.7;
        }
      } else {
        if (leftHand) leftHand.visible = false;
        if (rightHand) rightHand.visible = false;
      }
      handAuraL.position.copy(leftPos);
      handAuraR.position.copy(rightPos);
      handSigilL.position.copy(leftPos.clone().addScaledVector(camDir, 0.08));
      handSigilR.position.copy(rightPos.clone().addScaledVector(camDir, 0.08));
      handSigilL.quaternion.copy(camera.quaternion);
      handSigilR.quaternion.copy(camera.quaternion);
      handSigilL.rotation.z += dt * 1.8;
      handSigilR.rotation.z -= dt * 2.1;
      const auraPulse = (inventoryRef.current[selectedSlotRef.current]?.item === "wanda_focus")
        ? 0.18 + (Math.sin(clock.elapsedTime * 10) * 0.5 + 0.5) * 0.5 + (wandaCharging ? 0.35 : 0)
        : 0;
      (handAuraL.material as THREE.MeshBasicMaterial).opacity = auraPulse;
      (handAuraR.material as THREE.MeshBasicMaterial).opacity = auraPulse;
      (handSigilL.material as THREE.MeshBasicMaterial).opacity = auraPulse * 0.7;
      (handSigilR.material as THREE.MeshBasicMaterial).opacity = auraPulse * 0.7;
      wandaShieldBubble.position.set(controller.position.x, controller.position.y + 0.9, controller.position.z);
      wandaShieldRingA.position.copy(wandaShieldBubble.position);
      wandaShieldRingB.position.copy(wandaShieldBubble.position);
      (wandaShieldBubble.material as THREE.ShaderMaterial).uniforms.uTime.value += dt;
      (wandaShieldRingA.material as THREE.ShaderMaterial).uniforms.uTime.value += dt;
      (wandaShieldRingB.material as THREE.ShaderMaterial).uniforms.uTime.value += dt;
      if (tkFieldPreviewTimeUniform) tkFieldPreviewTimeUniform.value += dt;
      if (wandaShieldTimer > 0) {
        const s = 0.92 + Math.sin(clock.elapsedTime * 8) * 0.06;
        wandaShieldBubble.scale.setScalar(s);
        (wandaShieldBubble.material as THREE.ShaderMaterial).uniforms.uOpacity.value = 0.34 + (Math.sin(clock.elapsedTime * 14) * 0.5 + 0.5) * 0.16;
        wandaShieldRingA.rotation.y += dt * 1.8;
        wandaShieldRingB.rotation.x += dt * 2.2;
        (wandaShieldRingA.material as THREE.ShaderMaterial).uniforms.uOpacity.value = 0.3;
        (wandaShieldRingB.material as THREE.ShaderMaterial).uniforms.uOpacity.value = 0.24;
      } else {
        (wandaShieldBubble.material as THREE.ShaderMaterial).uniforms.uOpacity.value = 0;
        (wandaShieldRingA.material as THREE.ShaderMaterial).uniforms.uOpacity.value = 0;
        (wandaShieldRingB.material as THREE.ShaderMaterial).uniforms.uOpacity.value = 0;
      }
      wandaBeamActive = wandaEquippedNow && (wandaCharging || tkField.active || wandaMode === "ultimate_cast");
      wandaBeamActive = wandaBeamActive && (wandaPrimaryBeamHold || wandaMode === "ultimate_cast");
      wandaBeamIntensity = wandaBeamActive ? THREE.MathUtils.damp(wandaBeamIntensity, 0.38 + Math.min(1, wandaChargeTime) * 0.62 + (tkField.active ? 0.22 : 0), 8, dt) : THREE.MathUtils.damp(wandaBeamIntensity, 0, 10, dt);
      bloomPass.threshold = 0.72;
      bloomPass.radius = 0.58;
      bloomPass.strength = 0.36 + wandaBeamIntensity * 1.15 + (wandaMode === "ultimate_cast" ? 0.45 : 0);
      wandaBeamShaderTime += dt;
      for (const bv of wandaBeamVisuals) {
        const bm = bv.mesh.material as THREE.ShaderMaterial;
        bm.uniforms.uTime.value = wandaBeamShaderTime;
        bm.uniforms.uIntensity.value = wandaBeamIntensity;
      }
      if (wandaBeamIntensity > 0.02) {
        const origin = rightPos.clone().addScaledVector(camDir, 0.05);
        const baseBeamHit = raycastVoxel(world, camPos, camDir, 24);
        const baseAim = tkField.active
          ? tkField.center.clone()
          : baseBeamHit?.place
            ? new THREE.Vector3(baseBeamHit.place.x + 0.5, baseBeamHit.place.y + 0.5, baseBeamHit.place.z + 0.5)
            : baseBeamHit
              ? new THREE.Vector3(baseBeamHit.x + 0.5, baseBeamHit.y + 0.5, baseBeamHit.z + 0.5)
              : camPos.clone().addScaledVector(camDir, 22);
        const targets: Array<{ aim: THREE.Vector3; hit: BeamHit | null }> = [];
        const seen = new Set<string>();
        const range = 24;
        const coneDot = 0.8;
        const pushTarget = (aim: THREE.Vector3, forcedHit?: BeamHit | null) => {
          const key = `${Math.round(aim.x * 3)},${Math.round(aim.y * 3)},${Math.round(aim.z * 3)}`;
          if (seen.has(key)) return;
          seen.add(key);
          const dirToAim = aim.clone().sub(origin).normalize();
          const hit = forcedHit === undefined ? raycastVoxel(world, origin, dirToAim, range) : forcedHit;
          targets.push({ aim, hit });
        };
        for (const mob of mobs) {
          const center = mob.mesh.position.clone().add(new THREE.Vector3(0, 0.8, 0));
          const to = center.clone().sub(camPos);
          const dist = to.length();
          if (dist < 1.1 || dist > range) continue;
          if (to.normalize().dot(camDir) < coneDot) continue;
          pushTarget(center);
        }
        for (const mp of mobProjectiles) {
          const to = mp.mesh.position.clone().sub(camPos);
          const dist = to.length();
          if (dist < 1.0 || dist > range) continue;
          if (to.normalize().dot(camDir) < coneDot) continue;
          pushTarget(mp.mesh.position.clone());
        }
        // Fan rays so beam can split into multiple impactable points ahead (blocks/surfaces)
        const camUp = camera.up.clone().normalize();
        const fanOffsets = [
          [0, 0],
          [-0.2, 0], [0.2, 0],
          [0, -0.14], [0, 0.14],
          [-0.18, -0.12], [0.18, -0.12], [-0.18, 0.12], [0.18, 0.12],
        ] as const;
        for (const [ox, oy] of fanOffsets) {
          const d = camDir.clone()
            .addScaledVector(camRight, ox)
            .addScaledVector(camUp, oy)
            .normalize();
          const h = raycastVoxel(world, origin, d, range);
          const aim = h?.place
            ? new THREE.Vector3(h.place.x + 0.5, h.place.y + 0.5, h.place.z + 0.5)
            : h
              ? new THREE.Vector3(h.x + 0.5, h.y + 0.5, h.z + 0.5)
              : origin.clone().addScaledVector(d, 18);
          pushTarget(aim, h);
        }
        pushTarget(baseAim);
        targets.sort((a, b) => camPos.distanceTo(a.aim) - camPos.distanceTo(b.aim));
        const activeTargetCount = Math.min(9, targets.length);
        ensureBeamVisualCount(activeTargetCount);

        const beamDps = 24 + Math.min(1.2, wandaChargeTime) * 38;
        const tickDamage = beamDps * dt;
        const aoeRadius = 3.6;
        const mobDamage = new Map<number, number>();

        for (let i = 0; i < activeTargetCount; i++) {
          const visual = wandaBeamVisuals[i];
          const target = targets[i];
          const aim = target.hit?.place
            ? new THREE.Vector3(target.hit.place.x + 0.5, target.hit.place.y + 0.5, target.hit.place.z + 0.5)
            : target.hit
              ? new THREE.Vector3(target.hit.x + 0.5, target.hit.y + 0.5, target.hit.z + 0.5)
              : target.aim;
          visual.wigglePhase += dt * visual.wiggleSpeed;
          visual.wigglePhaseB += dt * visual.wiggleSpeedB;
          const dist = Math.max(0.25, origin.distanceTo(aim));
          const dir = aim.clone().sub(origin).divideScalar(dist);
          const binormal = new THREE.Vector3().crossVectors(camDir, dir);
          if (binormal.lengthSq() < 1e-8) binormal.crossVectors(camUp, dir);
          binormal.normalize();
          const wa = visual.wiggleAmp * wandaBeamIntensity;
          const arc = dist * (0.075 + 0.045 * wandaBeamIntensity);
          const cp1 = origin.clone()
            .addScaledVector(dir, dist * 0.44)
            .addScaledVector(binormal, arc + Math.sin(visual.wigglePhase) * wa * dist * 0.22)
            .addScaledVector(camRight, Math.sin(visual.wigglePhase * 0.88) * wa * dist * 0.16)
            .addScaledVector(camUp, Math.cos(visual.wigglePhase * 0.62 + visual.wigglePhaseB) * wa * dist * 0.12);
          const cp2 = aim.clone()
            .addScaledVector(dir, -dist * 0.38)
            .addScaledVector(binormal, -arc * 0.42 + Math.cos(visual.wigglePhaseB) * wa * dist * 0.2)
            .addScaledVector(camRight, Math.cos(visual.wigglePhaseB * 0.79) * wa * dist * 0.14)
            .addScaledVector(camUp, Math.sin(visual.wigglePhaseB * 0.55) * wa * dist * 0.1);
          const c = visual.curve;
          c.points[0].copy(origin);
          c.points[1].copy(cp1);
          c.points[2].copy(cp2);
          c.points[3].copy(aim);
          visual.mesh.geometry.dispose();
          visual.halo.geometry.dispose();
          visual.mesh.geometry = new THREE.TubeGeometry(visual.curve, 36, 0.062, 12, false);
          visual.halo.geometry = new THREE.TubeGeometry(visual.curve, 30, 0.118, 10, false);
          visual.mesh.visible = true;
          visual.halo.visible = true;
          (visual.halo.material as THREE.MeshBasicMaterial).opacity = 0.22 + wandaBeamIntensity * 0.34;
          if (Math.random() < 0.04 && aim.distanceTo(camPos) > 1.2) spawnBeamImpact(aim, wandaBeamIntensity);

          if (!wandaPrimaryBeamHold) continue;
          for (let m = mobs.length - 1; m >= 0; m--) {
            const dm = mobs[m].mesh.position.distanceTo(aim);
            if (dm > aoeRadius) continue;
            const falloff = Math.max(0.2, 1 - dm / aoeRadius);
            const dmg = tickDamage * falloff;
            const prev = mobDamage.get(m) ?? 0;
            if (dmg > prev) mobDamage.set(m, dmg);
          }
          for (let p = mobProjectiles.length - 1; p >= 0; p--) {
            const dp = mobProjectiles[p].mesh.position.distanceTo(aim);
            if (dp > aoeRadius * 1.1) continue;
            mobProjectiles[p].captureKind = "telek";
          }
          if (target.hit) {
            const blockKey = `${target.hit.x},${target.hit.y},${target.hit.z}`;
            if (visual.breakKey !== blockKey) {
              visual.breakKey = blockKey;
              visual.breakTimer = 0;
            } else {
              visual.breakTimer += dt;
              const breakTime = Math.max(0.14, 0.45 - Math.min(0.18, wandaChargeTime * 0.12));
              if (visual.breakTimer >= breakTime) {
                const changed = world.setBlockWorld(target.hit.x, target.hit.y, target.hit.z, 0);
                if (changed) {
                  spawnDrop(toBlockItem(target.hit.block as BlockType), target.hit.x, target.hit.y, target.hit.z);
                  markWorldPosDirty(target.hit.x, target.hit.z);
                }
                visual.breakTimer = 0;
              }
            }
          } else {
            visual.breakKey = "";
            visual.breakTimer = 0;
          }
        }

        if (wandaPrimaryBeamHold) {
          for (let m = mobs.length - 1; m >= 0; m--) {
            const dmg = mobDamage.get(m);
            if (!dmg) continue;
            mobs[m].health -= dmg;
            mobs[m].mesh.scale.set(1.07, 0.94, 1.07);
            if (mobs[m].health <= 0) killMob(m);
          }
        }
      } else {
        ensureBeamVisualCount(0);
      }

      for (let i = wandaHeatWaves.length - 1; i >= 0; i--) {
        const h = wandaHeatWaves[i];
        h.ttl -= dt;
        const p = Math.max(0, h.ttl / Math.max(0.001, h.max));
        h.mesh.lookAt(camera.position);
        h.mesh.scale.setScalar((1 - p) * (1.6 * h.baseScale) + 0.35);
        const mat = h.mesh.material as THREE.ShaderMaterial;
        mat.uniforms.uTime.value += dt;
        mat.uniforms.uAlpha.value = p * 0.34;
        if (h.ttl <= 0) {
          wandaGroup.remove(h.mesh);
          (h.mesh.geometry as THREE.BufferGeometry).dispose();
          (h.mesh.material as THREE.Material).dispose();
          wandaHeatWaves.splice(i, 1);
        }
      }
      for (let i = wandaBeamImpacts.length - 1; i >= 0; i--) {
        const it = wandaBeamImpacts[i];
        it.ttl -= dt;
        const p = Math.max(0, it.ttl / it.max);
        it.mesh.scale.setScalar(0.4 + (1 - p) * 1.25);
        (it.mesh.material as THREE.MeshBasicMaterial).opacity = p * 0.8;
        if (it.ttl <= 0) {
          wandaGroup.remove(it.mesh);
          (it.mesh.geometry as THREE.BufferGeometry).dispose();
          (it.mesh.material as THREE.Material).dispose();
          wandaBeamImpacts.splice(i, 1);
        }
      }

      const px = Math.floor(controller.position.x);
      const py = Math.floor(controller.position.y + controller.eyeHeight * 0.8);
      const pz = Math.floor(controller.position.z);
      if (world.getBlockWorld(px, py, pz) !== 0) controller.position.y += 0.3;

      camera.position.copy(controller.getViewPosition(new THREE.Vector3()));
      const dir = controller.getCameraDirection(new THREE.Vector3());
      camera.lookAt(camera.position.clone().add(dir));

      // Screen shake
      if (screenShakeTimer > 0) {
        screenShakeTimer -= dt;
        const intensity = screenShakeIntensity * (screenShakeTimer / 0.4);
        camera.position.x += (Math.random() - 0.5) * intensity;
        camera.position.y += (Math.random() - 0.5) * intensity * 0.6;
        camera.position.z += (Math.random() - 0.5) * intensity;
      }

      syncTimer += dt;
      const currentChunkPos = `${Math.floor(controller.position.x / CHUNK_SIZE)},${Math.floor(controller.position.z / CHUNK_SIZE)}`;
      if (syncTimer > 0.08 || currentChunkPos !== lastChunkPos || dirtyChunks.size > 0) {
        syncTimer = 0; lastChunkPos = currentChunkPos;
        syncChunksAroundPlayer();
      }

      const target = raycastVoxel(world, camera.position, dir, 10);

      const playerFeetX = Math.floor(controller.position.x);
      const playerFeetY = Math.floor(controller.position.y + 0.05);
      const playerFeetZ = Math.floor(controller.position.z);
      if (burningSet.has(`${playerFeetX},${playerFeetY},${playerFeetZ}`)) playerBurnTimer = Math.max(playerBurnTimer, 3.2);
      if (isWaterAt(playerFeetX, playerFeetY, playerFeetZ) || isWaterAt(playerFeetX, playerFeetY + 1, playerFeetZ)) {
        playerBurnTimer = 0; playerBurnTick = 0;
      }

      if (breakState.holdingLeft) {
        if (!target) { breakState.timer = 0; breakState.targetKey = ""; breakProgressValue = 0; }
        else {
          const k = `${target.x},${target.y},${target.z}`;
          if (k !== breakState.targetKey) { breakState.targetKey = k; breakState.timer = 0; breakProgressValue = 0; swingTime = 0.1; }
          else {
            breakState.timer += dt;
            breakProgressValue = Math.min(1, breakState.timer / 1.0);
            if (breakState.timer >= 1.0) {
              const changed = world.setBlockWorld(target.x, target.y, target.z, 0);
              if (changed) {
                spawnDrop(toBlockItem(target.block as BlockType), target.x, target.y, target.z);
                markWorldPosDirty(target.x, target.z);
                for (const [nx, ny, nz] of [[target.x + 1, target.y, target.z], [target.x - 1, target.y, target.z], [target.x, target.y, target.z + 1], [target.x, target.y, target.z - 1], [target.x, target.y + 1, target.z]] as const) {
                  if (world.getBlockWorld(nx, ny, nz) === 4) { enqueueWater(target.x, target.y, target.z); break; }
                }
              }
              breakState.timer = 0; breakProgressValue = 0;
            }
          }
        }
      }

      sunSphere.position.x = camera.position.x + 140;
      sunSphere.position.y = Math.max(SEA_LEVEL + 80, camera.position.y + 90);
      sunSphere.position.z = camera.position.z - 120;

      waterTickTimer += dt;
      if (waterTickTimer >= 0.25) { waterTickTimer = 0; processWaterTicks(2); }

      mobSpawnTimer += dt;
      if (mobSpawnTimer >= 2.7) { mobSpawnTimer = 0; spawnMobNearPlayer(); }

      waterTex.offset.x = (waterTex.offset.x + dt * 0.04) % 1;
      waterTex.offset.y = (waterTex.offset.y + dt * 0.012) % 1;
      processBurnQueue(2);

      // Pending water bursts
      for (let i = pendingWaterBursts.length - 1; i >= 0; i--) {
        const burst = pendingWaterBursts[i];
        burst.timer -= dt;
        if (burst.timer > 0) continue;
        for (const s of burst.seeds) {
          // Let the generated water fall a bit so it doesn't create hovering layers.
          let sy = s.y;
          for (let fall = 0; fall < 8; fall++) {
            if (sy <= 1) break;
            const here = world.getBlockWorld(s.x, sy, s.z);
            const below = world.getBlockWorld(s.x, sy - 1, s.z);
            if (here !== 0) break;
            if (below === 0) { sy--; continue; }
            break;
          }

          const b = world.getBlockWorld(s.x, sy, s.z);
          if (b !== 0 && !canBurnBlock(b)) continue;
          if (world.setBlockWorld(s.x, sy, s.z, 4)) {
            markWorldPosDirty(s.x, s.z);
            enqueueWater(s.x, sy, s.z);
            enqueueWater(s.x, sy - 1, s.z);
            enqueueWater(s.x + 1, sy, s.z);
            enqueueWater(s.x - 1, sy, s.z);
            enqueueWater(s.x, sy, s.z + 1);
            enqueueWater(s.x, sy, s.z - 1);
          }
        }
        pendingWaterBursts.splice(i, 1);
      }

      // Burn cells
      for (const [k, burn] of burningCells) {
        burn.ttl -= dt; burn.spreadCooldown -= dt;
        burn.mesh.rotation.y += dt * 1.8;
        burn.mesh.position.y = burn.y + 0.46 + Math.sin(clock.elapsedTime * 8 + burn.x + burn.z) * 0.04;
        const heatPulse = 0.22 + (Math.sin(clock.elapsedTime * 10 + burn.x * 0.7 + burn.z * 0.9) * 0.5 + 0.5) * 0.2;
        (burn.emberOverlay.material as THREE.MeshBasicMaterial).opacity = heatPulse;
        if (burn.spreadCooldown <= 0) {
          burn.spreadCooldown = 0.44 + Math.random() * 0.32;
          const neigh = [[burn.x + 1, burn.y, burn.z], [burn.x - 1, burn.y, burn.z], [burn.x, burn.y, burn.z + 1], [burn.x, burn.y, burn.z - 1], [burn.x, burn.y + 1, burn.z], [burn.x, burn.y - 1, burn.z]] as const;
          const candidates = neigh.filter(([nx, ny, nz]) => canBurnBlock(world.getBlockWorld(nx, ny, nz)));
          if (candidates.length > 0) { const [nx, ny, nz] = candidates[(Math.random() * candidates.length) | 0]; enqueueBurn(nx, ny, nz); }
        }
        if (burn.ttl <= 0) {
          const b = world.getBlockWorld(burn.x, burn.y, burn.z);
          if (canBurnBlock(b)) { world.setBlockWorld(burn.x, burn.y, burn.z, 0); markWorldPosDirty(burn.x, burn.z); }
          fireGroup.remove(burn.mesh); fireGroup.remove(burn.emberOverlay);
          burn.mesh.traverse((obj) => { if (obj instanceof THREE.Mesh) { (obj.geometry as THREE.BufferGeometry).dispose(); (obj.material as THREE.Material).dispose(); } });
          (burn.emberOverlay.geometry as THREE.BufferGeometry).dispose();
          (burn.emberOverlay.material as THREE.Material).dispose();
          burningCells.delete(k); burningSet.delete(k);
        }
      }

      // Lightning effects
      for (let i = lightningEffects.length - 1; i >= 0; i--) {
        const le = lightningEffects[i];
        le.ttl -= dt;
        const p = Math.max(0, le.ttl / 0.38);
        le.mesh.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            const mat = obj.material as THREE.MeshBasicMaterial;
            if (mat.transparent) mat.opacity = p * 0.85;
          }
          if (obj instanceof THREE.Line) {
            const mat = obj.material as THREE.LineBasicMaterial;
            if (mat.transparent) mat.opacity = p * 0.75;
          }
        });
        if (le.ttl <= 0) {
          lightningGroup.remove(le.mesh);
          le.mesh.traverse((obj) => {
            if (obj instanceof THREE.Mesh) { (obj.geometry as THREE.BufferGeometry).dispose(); (obj.material as THREE.Material).dispose(); }
            if (obj instanceof THREE.Line) { (obj.geometry as THREE.BufferGeometry).dispose(); }
          });
          lightningEffects.splice(i, 1);
        }
      }

      // Gun tracers
      for (let i = tracers.length - 1; i >= 0; i--) {
        const t = tracers[i];
        t.ttl -= dt;
        const p = Math.max(0, t.ttl / Math.max(0.0001, t.maxTtl));
        t.mesh.traverse((obj) => {
          if (!(obj instanceof THREE.Mesh)) return;
          const mat = obj.material as THREE.MeshBasicMaterial;
          if (!mat.transparent) return;
          mat.opacity = Math.min(mat.opacity, p * (obj.geometry instanceof THREE.SphereGeometry ? 0.5 : 0.9));
        });
        if (t.ttl <= 0) {
          scene.remove(t.mesh);
          t.mesh.traverse((obj) => {
            if (!(obj instanceof THREE.Mesh)) return;
            (obj.geometry as THREE.BufferGeometry).dispose();
            (obj.material as THREE.Material).dispose();
          });
          tracers.splice(i, 1);
        }
      }

      const playerCenter = new THREE.Vector3(controller.position.x, controller.position.y + 0.9, controller.position.z);

      // Mob update
      for (let i = mobs.length - 1; i >= 0; i--) {
        const mob = mobs[i];
        const mpos = mob.mesh.position;
        const toPlayer = playerCenter.clone().sub(mpos);
        const dist = toPlayer.length();

        if (dist > 72) {
          mobGroup.remove(mob.mesh);
          mob.mesh.traverse((obj) => { if (obj instanceof THREE.Mesh) { (obj.geometry as THREE.BufferGeometry).dispose(); (obj.material as THREE.Material).dispose(); } });
          mobs.splice(i, 1); setMobCount(mobs.length);
          continue;
        }

        // Health bar update
        const hpFrac = Math.max(0, mob.health / mob.maxHealth);
        mob.healthBarFill.scale.x = hpFrac;
        mob.healthBarFill.position.x = (hpFrac - 1) * 0.44;
        const hpColor = hpFrac > 0.6 ? "#22c55e" : hpFrac > 0.3 ? "#f59e0b" : "#ef4444";
        (mob.healthBarFill.material as THREE.MeshBasicMaterial).color.set(hpColor);
        mob.healthBarBg.visible = hpFrac < 0.999;
        mob.healthBarFill.visible = hpFrac < 0.999;
        // Make health bar face camera
        mob.healthBarBg.lookAt(camera.position);
        mob.healthBarFill.lookAt(camera.position);
        const telekControlled = tkField.active && tkField.captured.some((t) => t.kind === "mob" && t.ref === mob);
        if (telekControlled) {
          mob.attackCooldown = Math.max(0.2, mob.attackCooldown);
          mob.rangedCooldown = Math.max(0.2, mob.rangedCooldown);
          mob.shadowTeleportCooldown = Math.max(0.4, mob.shadowTeleportCooldown);
          mob.velocity.multiplyScalar(0.9);
          mob.mesh.rotation.y += dt * 0.7;
          continue;
        }

        mob.wanderTimer -= dt;
        if (mob.wanderTimer <= 0) {
          mob.wanderYaw += (Math.random() - 0.5) * 1.6;
          mob.wanderTimer = 0.8 + Math.random() * 1.8;
        }

        const speed = mob.kind === "shadow" || mob.kind === "storm" ? 2.5 : mob.kind === "boar" ? 1.75 : mob.kind === "brine" ? 1.55 : 1.35;
        const chase = dist < (mob.kind === "shadow" || mob.kind === "storm" ? 22 : 16);
        let vx = Math.cos(mob.wanderYaw) * speed;
        let vz = Math.sin(mob.wanderYaw) * speed;
        if (chase && dist > 0.001) {
          vx = (toPlayer.x / dist) * speed * (mob.kind === "shadow" || mob.kind === "storm" ? 1.5 : 1.2);
          vz = (toPlayer.z / dist) * speed * (mob.kind === "shadow" || mob.kind === "storm" ? 1.5 : 1.2);
        }
        mob.velocity.x = vx; mob.velocity.z = vz;
        mob.velocity.y -= 14 * dt;

        const nextX = mpos.x + mob.velocity.x * dt;
        const nextZ = mpos.z + mob.velocity.z * dt;
        const solidAhead = world.getBlockWorld(Math.floor(nextX), Math.floor(mpos.y + 0.1), Math.floor(nextZ));
        if (solidAhead === 0 || solidAhead === 4) { mpos.x = nextX; mpos.z = nextZ; }
        else mob.wanderYaw += Math.PI * (0.5 + Math.random() * 0.6);

        mpos.y += mob.velocity.y * dt;
        const groundY = Math.floor(mpos.y - 0.45);
        const below = world.getBlockWorld(Math.floor(mpos.x), groundY, Math.floor(mpos.z));
        mob.jumpTimer -= dt;
        if (mob.velocity.y <= 0 && below !== 0 && below !== 4) {
          mpos.y = groundY + 1.45; mob.velocity.y = 0;
          if (mob.jumpTimer <= 0) {
            mob.velocity.y = mob.kind === "slime" ? 4.8 : mob.kind === "shadow" || mob.kind === "storm" ? 5.5 : 4.1;
            mob.jumpTimer = 0.9 + Math.random() * 1.7;
          }
        }

        // Shadow teleport
        if (mob.kind === "shadow" || mob.kind === "storm") {
          mob.shadowTeleportCooldown -= dt;
          if (mob.shadowTeleportCooldown <= 0 && dist > 10) {
            mob.shadowTeleportCooldown = 4 + Math.random() * 3;
            const ang = Math.random() * Math.PI * 2;
            const tpDist = 3 + Math.random() * 3;
            const tpX = Math.floor(playerCenter.x + Math.cos(ang) * tpDist);
            const tpZ = Math.floor(playerCenter.z + Math.sin(ang) * tpDist);
            const tpY = findGroundY(tpX, tpZ);
            if (tpY !== null) {
              mpos.set(tpX + 0.5, tpY + 0.5, tpZ + 0.5);
              // Purple poof effect
              const poof = new THREE.Mesh(
                new THREE.SphereGeometry(0.6, 10, 10),
                new THREE.MeshBasicMaterial({ color: mob.kind === "storm" ? "#fde047" : "#8b5cf6", transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })
              );
              poof.position.copy(mpos);
              splashGroup.add(poof);
              waterSplashes.push({ mesh: poof, ttl: 0.3, maxTtl: 0.3, expanding: true, targetScale: 2.0 });
            }
          }
        }

        mob.mesh.rotation.y = Math.atan2(mob.velocity.x, mob.velocity.z);
        const lookDir = toPlayer.lengthSq() > 0.0001 ? toPlayer.clone().normalize() : new THREE.Vector3(0, 0, 1);
        const pupilX = THREE.MathUtils.clamp(lookDir.x * 0.013, -0.011, 0.011);
        const pupilY = THREE.MathUtils.clamp(lookDir.y * 0.01, -0.008, 0.008);
        const pupilZ = THREE.MathUtils.clamp(lookDir.z * 0.014, -0.003, 0.012);
        for (const p of mob.pupils) p.position.set(pupilX, -0.004 + pupilY, 0.067 + pupilZ);

        const mobFeetX = Math.floor(mpos.x), mobFeetY = Math.floor(mpos.y + 0.05), mobFeetZ = Math.floor(mpos.z);
        if (burningSet.has(`${mobFeetX},${mobFeetY},${mobFeetZ}`)) mob.burnTimer = Math.max(mob.burnTimer, 3.8);
        if (isWaterAt(mobFeetX, mobFeetY, mobFeetZ) || isWaterAt(mobFeetX, mobFeetY + 1, mobFeetZ)) {
          mob.burnTimer = 0; mob.burnTickTimer = 0;
          (mob.burnOverlay.material as THREE.MeshBasicMaterial).opacity = 0;
        }

        if (mob.fireVfx) {
          mob.fireVfx.visible = true;
          mob.fireVfx.rotation.y += dt * 2.4;
        }
        if (mob.burnTimer > 0) {
          mob.burnTimer -= dt; mob.burnTickTimer += dt;
          if (mob.burnTickTimer >= 0.55) {
            mob.burnTickTimer = 0; mob.health -= 1;
            if (mob.health <= 0) { killMob(i); break; }
          }
          const burnPulse = 0.14 + (Math.sin(clock.elapsedTime * 14 + i) * 0.5 + 0.5) * 0.26;
          (mob.burnOverlay.material as THREE.MeshBasicMaterial).opacity = burnPulse;
        } else {
          mob.burnTickTimer = 0;
          (mob.burnOverlay.material as THREE.MeshBasicMaterial).opacity = 0;
          if (mob.fireVfx && mob.kind !== "inferno" && mob.kind !== "shadow" && mob.kind !== "storm") mob.fireVfx.visible = false;
        }

        mob.mesh.scale.lerp(new THREE.Vector3(1, 1, 1), Math.min(1, dt * 10));

        // Melee attack
        mob.attackCooldown -= dt;
        if (dist < 1.15 && mob.attackCooldown <= 0) {
          mob.attackCooldown = mob.kind === "inferno" ? 0.95 : mob.kind === "boar" ? 1.15 : mob.kind === "shadow" || mob.kind === "storm" ? 0.75 : mob.kind === "brine" ? 1.05 : 1.35;
          applyPlayerDamage(mob.kind === "inferno" ? 3 : mob.kind === "boar" ? 2 : mob.kind === "shadow" || mob.kind === "storm" ? 3 : mob.kind === "brine" ? 2 : 1, "melee");
          if (mob.kind === "inferno") playerBurnTimer = Math.max(playerBurnTimer, 3.5);
          if (mob.kind === "shadow" || mob.kind === "storm") { screenShakeTimer = 0.2; screenShakeIntensity = 0.08; }
        }

        // Ranged attacks (inferno fireballs, aqua water blobs)
        mob.rangedCooldown -= dt;
        if (mob.rangedCooldown <= 0 && dist > 5 && dist < 18) {
          if (mob.kind === "inferno") {
            mob.rangedCooldown = 2.5 + Math.random() * 1.5;
            spawnMobProjectile(mpos.clone().add(new THREE.Vector3(0, 0.3, 0)), playerCenter, true, false, 3);
          } else if (mob.kind === "aqua" || mob.kind === "brine") {
            mob.rangedCooldown = 3.5 + Math.random() * 2;
            spawnMobProjectile(mpos.clone().add(new THREE.Vector3(0, 0.3, 0)), playerCenter, false, true, mob.kind === "brine" ? 3 : 2);
          } else if ((mob.kind === "shadow" || mob.kind === "storm") && dist > 8) {
            mob.rangedCooldown = 2.0 + Math.random() * 1.5;
            // Shadow launches a dark bolt
            spawnMobProjectile(mpos.clone().add(new THREE.Vector3(0, 0.3, 0)), playerCenter, false, false, mob.kind === "storm" ? 5 : 4);
          }
        }
      }

      // Wanda projectile update
      for (let i = wandaBolts.length - 1; i >= 0; i--) {
        const b = wandaBolts[i];
        b.life -= dt;
        if (b.life <= 0) {
          wandaGroup.remove(b.mesh);
          wandaGroup.remove(b.trail);
          b.mesh.traverse((obj) => {
            if (obj instanceof THREE.Mesh) { (obj.geometry as THREE.BufferGeometry).dispose(); (obj.material as THREE.Material).dispose(); }
          });
          (b.trail.geometry as THREE.BufferGeometry).dispose();
          (b.trail.material as THREE.Material).dispose();
          wandaBolts.splice(i, 1);
          continue;
        }
        b.mesh.position.addScaledVector(b.velocity, dt);
        b.mesh.rotation.y += dt * 7;
        b.trail.geometry.dispose();
        b.trail.geometry = new THREE.BufferGeometry().setFromPoints([
          b.mesh.position.clone(),
          b.mesh.position.clone().addScaledVector(b.velocity.clone().normalize(), -0.45),
        ]);
        (b.trail.material as THREE.ShaderMaterial).uniforms.uOpacity.value = Math.max(0.18, b.life * 0.65);

        const bx = Math.floor(b.mesh.position.x);
        const by = Math.floor(b.mesh.position.y);
        const bz = Math.floor(b.mesh.position.z);

        let hitMob = false;
        for (let m = mobs.length - 1; m >= 0; m--) {
          const d = b.mesh.position.distanceTo(mobs[m].mesh.position);
          if (d > 1.1) continue;
          mobs[m].health -= b.damage;
          mobs[m].velocity.addScaledVector(b.velocity.clone().normalize(), 8);
          mobs[m].velocity.y += 3.2;
          mobs[m].burnTimer = Math.max(mobs[m].burnTimer, 1.6);
          if (mobs[m].health <= 0) killMob(m);
          hitMob = true;
          break;
        }

        const block = world.getBlockWorld(bx, by, bz);
        if (hitMob || (block !== 0 && block !== 4)) {
          spawnWandaBurst(b.mesh.position.x, b.mesh.position.y, b.mesh.position.z, 0.9);
          const center = b.mesh.position.clone();
          for (let m = mobs.length - 1; m >= 0; m--) {
            const d = mobs[m].mesh.position.distanceTo(center);
            if (d > b.splash) continue;
            const f = Math.max(0, 1 - d / b.splash);
            mobs[m].health -= Math.ceil(5 * f);
            mobs[m].velocity.addScaledVector(mobs[m].mesh.position.clone().sub(center).normalize(), 9 * f);
            mobs[m].velocity.y += 4 * f;
            if (mobs[m].health <= 0) killMob(m);
          }
          wandaGroup.remove(b.mesh);
          wandaGroup.remove(b.trail);
          b.mesh.traverse((obj) => {
            if (obj instanceof THREE.Mesh) { (obj.geometry as THREE.BufferGeometry).dispose(); (obj.material as THREE.Material).dispose(); }
          });
          (b.trail.geometry as THREE.BufferGeometry).dispose();
          (b.trail.material as THREE.Material).dispose();
          wandaBolts.splice(i, 1);
        }
      }

      for (let i = wandaBursts.length - 1; i >= 0; i--) {
        const w = wandaBursts[i];
        w.ttl -= dt;
        const p = Math.max(0, w.ttl / Math.max(0.001, w.max));
        w.mesh.scale.setScalar((1 - p) * w.scale + 0.2);
        (w.mesh.material as THREE.MeshBasicMaterial).opacity = p * 0.82;
        if (w.ttl <= 0) {
          wandaGroup.remove(w.mesh);
          (w.mesh.geometry as THREE.BufferGeometry).dispose();
          (w.mesh.material as THREE.Material).dispose();
          wandaBursts.splice(i, 1);
        }
      }
      for (let i = wandaRings.length - 1; i >= 0; i--) {
        const w = wandaRings[i];
        w.ttl -= dt;
        const p = Math.max(0, w.ttl / Math.max(0.001, w.max));
        w.mesh.scale.setScalar((1 - p) * w.grow + 0.3);
        w.mesh.rotation.z += dt * 3.2;
        (w.mesh.material as THREE.MeshBasicMaterial).opacity = p * 0.74;
        if (w.ttl <= 0) {
          wandaGroup.remove(w.mesh);
          (w.mesh.geometry as THREE.BufferGeometry).dispose();
          (w.mesh.material as THREE.Material).dispose();
          wandaRings.splice(i, 1);
        }
      }
      for (let i = wandaTethers.length - 1; i >= 0; i--) {
        const t = wandaTethers[i];
        t.ttl -= dt;
        (t.mesh.material as THREE.ShaderMaterial).uniforms.uAlpha.value = Math.max(0, t.ttl / t.max) * 0.62;
        if (t.ttl <= 0) {
          wandaGroup.remove(t.mesh);
          (t.mesh.geometry as THREE.BufferGeometry).dispose();
          (t.mesh.material as THREE.Material).dispose();
          wandaTethers.splice(i, 1);
        }
      }

      const wandaKey = `${Math.round(wandaEnergy)}|${wandaShieldCd.toFixed(1)}|${wandaUltCd.toFixed(1)}|${wandaShieldTimer > 0 ? 1 : 0}|${tkField.active ? 1 : 0}|${Math.min(1, wandaChargeTime).toFixed(2)}|${wandaEquipped ? 1 : 0}|${wandaMode}|${tkField.radius.toFixed(1)}|${tkField.captured.length}`;
      if (wandaKey !== wandaLastHudKey) {
        wandaLastHudKey = wandaKey;
        setWandaHud(wandaEquipped ? {
          energy: wandaEnergy,
          shieldCd: wandaShieldCd,
          ultCd: wandaUltCd,
          shieldActive: wandaShieldTimer > 0,
          tkActive: tkField.active,
          tkRadius: tkField.radius,
          tkCaptured: tkField.captured.length,
          charging: Math.min(1, wandaChargeTime),
          mode: wandaMode,
        } : null);
      }

      // Mob projectile update
      for (let i = mobProjectiles.length - 1; i >= 0; i--) {
        const mp = mobProjectiles[i];
        mp.life -= dt;
        if (mp.life <= 0) {
          mobGroup.remove(mp.mesh);
          (mp.mesh.geometry as THREE.BufferGeometry).dispose();
          (mp.mesh.material as THREE.Material).dispose();
          mobProjectiles.splice(i, 1);
          continue;
        }
        const shieldCaptureDist = 3.1;
        const pd = mp.mesh.position.distanceTo(playerCenter);
        if (mp.captureKind === "shield" && wandaShieldTimer <= 0) mp.captureKind = "none";
        if (mp.captureKind === "telek" && !tkField.active) {
          removeWandaTkGlow(mp.mesh);
          mp.captureKind = "none";
        }
        if (wandaShieldTimer > 0 && pd < shieldCaptureDist) mp.captureKind = "shield";
        if (tkField.active && mp.mesh.position.distanceTo(tkField.center) < tkField.radius + 2.2) mp.captureKind = "telek";
        if (mp.captureKind !== "none") {
          const center = mp.captureKind === "telek" ? tkField.center : playerCenter;
          mp.captureAngle += dt * 2.3;
          const radius = mp.captureKind === "telek" ? 0.9 + (i % 3) * 0.28 : 1.2 + (i % 3) * 0.24;
          const target = center.clone().add(new THREE.Vector3(Math.cos(mp.captureAngle) * radius, 0.6 + Math.sin(mp.captureAngle * 2.2) * 0.25, Math.sin(mp.captureAngle) * radius));
          mp.mesh.position.lerp(target, Math.min(1, dt * 8));
          mp.velocity.multiplyScalar(0.88);
          mp.mesh.rotation.x += dt * 2.1;
          mp.mesh.rotation.y += dt * 2.7;
          if (mp.captureKind === "telek") addWandaTkGlow(mp.mesh, 0.48 + (i % 4) * 0.04);
          continue;
        }
        mp.velocity.y -= 9.8 * dt * (mp.fire ? 0.1 : 0.3);
        mp.mesh.position.addScaledVector(mp.velocity, dt);
        mp.mesh.rotation.x += dt * 3;
        mp.mesh.rotation.y += dt * 2;

        // Hit player
        if (pd < 0.85) {
          applyPlayerDamage(mp.damage, "projectile");
          if (mp.fire) playerBurnTimer = Math.max(playerBurnTimer, 3.0);
          if (mp.water) { playerBurnTimer = 0; playerBurnTick = 0; }
          spawnWaterSplash(mp.mesh.position.x, mp.mesh.position.y, mp.mesh.position.z, 0.8);
          mobGroup.remove(mp.mesh);
          (mp.mesh.geometry as THREE.BufferGeometry).dispose();
          (mp.mesh.material as THREE.Material).dispose();
          mobProjectiles.splice(i, 1);
          continue;
        }

        // Hit block
        const bx = Math.floor(mp.mesh.position.x), by = Math.floor(mp.mesh.position.y), bz = Math.floor(mp.mesh.position.z);
        const hitBlock = world.getBlockWorld(bx, by, bz);
        if (hitBlock !== 0 && hitBlock !== 4) {
          if (mp.fire && canBurnBlock(hitBlock)) enqueueBurn(bx, by, bz);
          if (mp.water) { enqueueWater(bx, by, bz); markWorldPosDirty(bx, bz); }
          spawnWaterSplash(mp.mesh.position.x, mp.mesh.position.y, mp.mesh.position.z, 0.6);
          mobGroup.remove(mp.mesh);
          (mp.mesh.geometry as THREE.BufferGeometry).dispose();
          (mp.mesh.material as THREE.Material).dispose();
          mobProjectiles.splice(i, 1);
        }
      }

      for (let i = tkMeteorFlying.length - 1; i >= 0; i--) {
        const m = tkMeteorFlying[i];
        m.life += dt;
        m.mesh.scale.setScalar(meteorVisualScale(m.mass));
        m.prevPos.copy(m.mesh.position);
        m.velocity.y -= 20 * dt;
        m.mesh.position.addScaledVector(m.velocity, dt);
        m.mesh.rotation.x += dt * 2.6;
        m.mesh.rotation.y += dt * 3.2;
        const step = new THREE.Vector3().subVectors(m.mesh.position, m.prevPos);
        const len = step.length();
        let hitBlock = false;
        if (len > 1e-4) {
          const hit = raycastVoxel(world, m.prevPos, step.clone().normalize(), len + 0.65);
          if (hit) hitBlock = true;
        }
        const blastR = meteorBlastRadius(m.mass);
        const innerHit = 1.02 + Math.min(2.5, m.mass * 0.03);
        const dmgMax = Math.round(10 + m.mass * 1.05 + m.velocity.length() * 0.88);
        let explode = hitBlock || m.life > 11;
        if (!explode) {
          if (playerCenter.distanceTo(m.mesh.position) < innerHit) explode = true;
          else {
            for (let hi = mobs.length - 1; hi >= 0; hi--) {
              if (mobs[hi].mesh.position.distanceTo(m.mesh.position) < innerHit) {
                explode = true;
                break;
              }
            }
          }
        }
        if (explode) {
          const cx = m.mesh.position.x, cy = m.mesh.position.y, cz = m.mesh.position.z;
          for (let mi = mobs.length - 1; mi >= 0; mi--) {
            const d = mobs[mi].mesh.position.distanceTo(m.mesh.position);
            if (d > blastR) continue;
            const falloff = Math.max(0.1, 1 - d / blastR);
            const dmg = Math.max(1, Math.round(dmgMax * falloff * falloff));
            mobs[mi].health -= dmg;
            const push = mobs[mi].mesh.position.clone().sub(m.mesh.position);
            if (push.lengthSq() > 1e-6) push.normalize().multiplyScalar(Math.min(26, 7 + dmg * 0.22));
            mobs[mi].velocity.add(push);
            if (mobs[mi].health <= 0) killMob(mi);
          }
          const pd = playerCenter.distanceTo(m.mesh.position);
          if (pd <= blastR) {
            const falloff = Math.max(0.1, 1 - pd / blastR);
            applyPlayerDamage(Math.min(52, Math.round(dmgMax * falloff * falloff * 0.92)), "projectile");
          }
          spawnWandaBurst(cx, cy, cz, 0.85 + Math.min(2.8, m.mass * 0.07));
          screenShakeTimer = Math.max(screenShakeTimer, 0.22 + Math.min(0.28, m.mass * 0.009));
          screenShakeIntensity = Math.max(screenShakeIntensity, 0.09 + Math.min(0.2, m.mass * 0.005));
          wandaTone(48, 0.22, "sawtooth", 0.12);
          disposeScatterTkMeteorFlying(m, cx, cy, cz, blastR);
          tkMeteorFlying.splice(i, 1);
        }
      }

      if (playerBurnTimer > 0) {
        playerBurnTimer -= dt; playerBurnTick += dt;
        if (playerBurnTick >= 0.6) { playerBurnTick = 0; applyPlayerDamage(1, "dot"); }
      } else playerBurnTick = 0;

      // Player arrows
      for (let i = arrows.length - 1; i >= 0; i--) {
        const a = arrows[i];
        a.life -= dt;
        if (a.life <= 0) {
          mobGroup.remove(a.mesh);
          a.mesh.traverse((obj) => { if (obj instanceof THREE.Mesh) { (obj.geometry as THREE.BufferGeometry).dispose(); (obj.material as THREE.Material).dispose(); } });
          if (a.trailMesh) { scene.remove(a.trailMesh); (a.trailMesh.geometry as THREE.BufferGeometry).dispose(); }
          arrows.splice(i, 1);
          continue;
        }
        a.velocity.y -= 9.8 * dt * a.gravityScale;
        const stepCount = Math.max(1, Math.ceil((a.velocity.length() * dt) / 0.35));
        const stepDt = dt / stepCount;
        let impacted = false;
        for (let step = 0; step < stepCount; step++) {
          a.mesh.position.addScaledVector(a.velocity, stepDt);
          a.mesh.lookAt(a.mesh.position.clone().add(a.velocity.clone().normalize()));

          // Update trail
          a.trail.push(a.mesh.position.clone());
          if (a.trail.length > 8) a.trail.shift();
          if (a.trailMesh && a.trail.length >= 2) {
            (a.trailMesh.geometry as THREE.BufferGeometry).setFromPoints(a.trail);
          }

          const bx = Math.floor(a.mesh.position.x), by = Math.floor(a.mesh.position.y), bz = Math.floor(a.mesh.position.z);

          for (let m = mobs.length - 1; m >= 0; m--) {
            const targetMob = mobs[m];
            if (!targetMob) continue;
            const d = a.mesh.position.distanceTo(targetMob.mesh.position);
            if (d > 1.35) continue;
            if (a.water) {
              const mbx = Math.floor(targetMob.mesh.position.x), mby = Math.floor(targetMob.mesh.position.y), mbz = Math.floor(targetMob.mesh.position.z);
              applyWaterBlast(mbx, mby, mbz, a.splashRadius);
            }

            // applyWaterBlast can kill/swap mobs (splices from `mobs`), so locate the same target by reference.
            const newIdx = mobs.indexOf(targetMob);
            const currentTarget = newIdx >= 0 ? mobs[newIdx] : null;
            if (!currentTarget) {
              a.life = 0; impacted = true; break;
            }

            currentTarget.health -= a.damage;
            if (a.water) {
              currentTarget.burnTimer = 0; currentTarget.burnTickTimer = 0;
              if (currentTarget.kind === "inferno") currentTarget.health -= 4;
            }
            if (a.fire) {
              currentTarget.burnTimer = Math.max(currentTarget.burnTimer, 4.8); currentTarget.burnTickTimer = 0;
              if (!currentTarget.fireVfx) { const mobFire = makeFlameVisual(0.9); mobFire.position.set(0, -0.1, 0); currentTarget.mesh.add(mobFire); currentTarget.fireVfx = mobFire; }
            }
            currentTarget.mesh.scale.set(1.2, 0.85, 1.2);
            a.life = 0;
            if (currentTarget.health <= 0) killMob(newIdx);
            impacted = true; break;
          }
          if (impacted) break;

          let hitBlock = world.getBlockWorld(bx, by, bz);
          const fracY = a.mesh.position.y - Math.floor(a.mesh.position.y);
          if (hitBlock === 0 && a.velocity.y < -0.5 && fracY < 0.18) {
            const bbelow = world.getBlockWorld(bx, by - 1, bz);
            if (bbelow !== 0 && bbelow !== 4) hitBlock = bbelow;
          }
          if (hitBlock !== 0 && hitBlock !== 4) {
            if (a.water) applyWaterBlast(bx, by, bz, a.splashRadius);
            if (a.fire && canBurnBlock(hitBlock)) enqueueBurn(bx, by, bz);
            a.life = 0; impacted = true; break;
          }
        }
        if (impacted && a.trailMesh) { scene.remove(a.trailMesh); (a.trailMesh.geometry as THREE.BufferGeometry).dispose(); a.trailMesh = null; }
      }

      // Water splash update
      for (let i = waterSplashes.length - 1; i >= 0; i--) {
        const s = waterSplashes[i];
        s.ttl -= dt;
        const p = Math.max(0, s.ttl / s.maxTtl);
        if (s.expanding) {
          const t = 1 - p;
          s.mesh.scale.setScalar(Math.max(0.05, t * s.targetScale));
          (s.mesh.material as THREE.MeshBasicMaterial).opacity = p * 0.88;
        } else {
          s.mesh.scale.setScalar((1 - p) * 2.0 + 0.4);
          (s.mesh.material as THREE.MeshBasicMaterial).opacity = p * 0.85;
        }
        if (s.ttl <= 0) {
          splashGroup.remove(s.mesh);
          (s.mesh.geometry as THREE.BufferGeometry).dispose();
          (s.mesh.material as THREE.Material).dispose();
          waterSplashes.splice(i, 1);
        }
      }

      // Regen
      if (healthRef.current < 20) {
        regenTimer += dt;
        if (regenTimer >= 3.2) {
          regenTimer = 0;
          const next = Math.min(20, healthRef.current + 1);
          if (next !== healthRef.current) { healthRef.current = next; setHealth(next); }
        }
      } else regenTimer = 0;

      // Drops
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        const prevPos = d.mesh.position.clone();
        d.age += dt; d.velocity.y -= 14 * dt;
        d.mesh.position.addScaledVector(d.velocity, dt);
        d.mesh.rotation.y += dt * 2.1;
        const dropBlock = fromBlockItem(d.item);
        if (dropBlock !== null && dropBlock !== 4 && d.velocity.length() > 8.2) {
          const step = d.mesh.position.clone().sub(prevPos);
          if (step.lengthSq() > 1e-6) {
            const hit = raycastVoxel(world, prevPos, step.normalize(), step.length() + 0.75);
            if (hit?.place && world.getBlockWorld(hit.place.x, hit.place.y, hit.place.z) === 0) {
              const placed = world.setBlockWorld(hit.place.x, hit.place.y, hit.place.z, dropBlock);
              if (placed) {
                markWorldPosDirty(hit.place.x, hit.place.z);
                dropGroup.remove(d.mesh);
                (d.mesh.geometry as THREE.BufferGeometry).dispose();
                (d.mesh.material as THREE.Material).dispose();
                drops.splice(i, 1);
                continue;
              }
            }
          }
        }
        const bx = Math.floor(d.mesh.position.x), by = Math.floor(d.mesh.position.y - 0.2), bz = Math.floor(d.mesh.position.z);
        if (d.velocity.y < 0 && world.getBlockWorld(bx, by, bz) !== 0) {
          d.mesh.position.y = by + 1.2; d.velocity.y *= -0.22; d.velocity.x *= 0.72; d.velocity.z *= 0.72;
        }
        if (d.age > 0.15) {
          const dist = d.mesh.position.distanceTo(new THREE.Vector3(controller.position.x, controller.position.y + 0.9, controller.position.z));
          if (dist < 1.15 && tryAddToInventory(d.item)) {
            dropGroup.remove(d.mesh);
            (d.mesh.geometry as THREE.BufferGeometry).dispose();
            (d.mesh.material as THREE.Material).dispose();
            drops.splice(i, 1);
          }
        }
      }

      if (target) {
        breakOverlay.visible = true;
        breakOverlay.position.set(target.x + 0.5, target.y + 0.5, target.z + 0.5);
        const tint = colorForBlock(target.block).clone().lerp(new THREE.Color(0x000000), 0.58);
        breakOverlayMaterial.color.copy(tint);
        if (breakState.holdingLeft) {
          const stage = Math.min(9, Math.floor(breakProgressValue * 10));
          breakOverlayMaterial.map = breakTextures[stage];
          breakOverlayMaterial.opacity = 0.92;
        } else breakOverlayMaterial.opacity = 0;
      } else breakOverlay.visible = false;

      bloomComposer.render();
      raf = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousedown", onMouseDownDestroy);
      window.removeEventListener("mouseup", onMouseUpBreak);
      window.removeEventListener("wheel", onWheelSlot);
      window.removeEventListener("keydown", onKeySlot);
      window.removeEventListener("keyup", onKeyUp);
      unbindControls();
      for (const render of activeChunks.values()) {
        render.mesh.traverse((obj) => { if (obj instanceof THREE.Mesh) (obj.geometry as THREE.BufferGeometry).dispose(); });
      }
      for (const d of drops) { dropGroup.remove(d.mesh); (d.mesh.geometry as THREE.BufferGeometry).dispose(); (d.mesh.material as THREE.Material).dispose(); }
      for (const m of mobs) { mobGroup.remove(m.mesh); m.mesh.traverse((obj) => { if (obj instanceof THREE.Mesh) { (obj.geometry as THREE.BufferGeometry).dispose(); (obj.material as THREE.Material).dispose(); } }); }
      for (const a of arrows) {
        mobGroup.remove(a.mesh);
        a.mesh.traverse((obj) => { if (obj instanceof THREE.Mesh) { (obj.geometry as THREE.BufferGeometry).dispose(); (obj.material as THREE.Material).dispose(); } });
        if (a.trailMesh) { scene.remove(a.trailMesh); (a.trailMesh.geometry as THREE.BufferGeometry).dispose(); }
      }
      for (const mp of mobProjectiles) { mobGroup.remove(mp.mesh); (mp.mesh.geometry as THREE.BufferGeometry).dispose(); (mp.mesh.material as THREE.Material).dispose(); }
      for (const burn of burningCells.values()) {
        fireGroup.remove(burn.mesh); fireGroup.remove(burn.emberOverlay);
        burn.mesh.traverse((obj) => { if (obj instanceof THREE.Mesh) { (obj.geometry as THREE.BufferGeometry).dispose(); (obj.material as THREE.Material).dispose(); } });
        (burn.emberOverlay.geometry as THREE.BufferGeometry).dispose(); (burn.emberOverlay.material as THREE.Material).dispose();
      }
      for (const s of waterSplashes) { splashGroup.remove(s.mesh); (s.mesh.geometry as THREE.BufferGeometry).dispose(); (s.mesh.material as THREE.Material).dispose(); }
      for (const le of lightningEffects) {
        lightningGroup.remove(le.mesh);
        le.mesh.traverse((obj) => { if (obj instanceof THREE.Mesh) { (obj.geometry as THREE.BufferGeometry).dispose(); (obj.material as THREE.Material).dispose(); } });
      }
      for (const t of tracers) {
        scene.remove(t.mesh);
        t.mesh.traverse((obj) => {
          if (!(obj instanceof THREE.Mesh)) return;
          (obj.geometry as THREE.BufferGeometry).dispose();
          (obj.material as THREE.Material).dispose();
        });
      }
      for (const b of wandaBolts) {
        wandaGroup.remove(b.mesh);
        wandaGroup.remove(b.trail);
        b.mesh.traverse((obj) => {
          if (!(obj instanceof THREE.Mesh)) return;
          (obj.geometry as THREE.BufferGeometry).dispose();
          (obj.material as THREE.Material).dispose();
        });
        (b.trail.geometry as THREE.BufferGeometry).dispose();
        (b.trail.material as THREE.Material).dispose();
      }
      for (const w of wandaBursts) {
        wandaGroup.remove(w.mesh);
        (w.mesh.geometry as THREE.BufferGeometry).dispose();
        (w.mesh.material as THREE.Material).dispose();
      }
      for (const w of wandaRings) {
        wandaGroup.remove(w.mesh);
        (w.mesh.geometry as THREE.BufferGeometry).dispose();
        (w.mesh.material as THREE.Material).dispose();
      }
      for (const t of wandaTethers) {
        wandaGroup.remove(t.mesh);
        (t.mesh.geometry as THREE.BufferGeometry).dispose();
        (t.mesh.material as THREE.Material).dispose();
      }
      disposeTkMeteorHeld();
      for (const mf of tkMeteorFlying) {
        mf.mesh.parent?.remove(mf.mesh);
        mf.mesh.traverse((ch) => {
          if (ch instanceof THREE.Mesh) {
            ch.geometry.dispose();
            (ch.material as THREE.Material).dispose();
          }
        });
      }
      tkMeteorFlying.length = 0;
      for (const h of wandaHeatWaves) {
        wandaGroup.remove(h.mesh);
        (h.mesh.geometry as THREE.BufferGeometry).dispose();
        (h.mesh.material as THREE.Material).dispose();
      }
      for (const bi of wandaBeamImpacts) {
        wandaGroup.remove(bi.mesh);
        (bi.mesh.geometry as THREE.BufferGeometry).dispose();
        (bi.mesh.material as THREE.Material).dispose();
      }
      for (const bv of wandaBeamVisuals) {
        wandaGroup.remove(bv.mesh);
        wandaGroup.remove(bv.halo);
        (bv.mesh.geometry as THREE.BufferGeometry).dispose();
        (bv.mesh.material as THREE.Material).dispose();
        (bv.halo.geometry as THREE.BufferGeometry).dispose();
        (bv.halo.material as THREE.Material).dispose();
      }
      wandaGroup.remove(tkFieldPreview);
      (tkFieldPreview.geometry as THREE.BufferGeometry).dispose();
      (tkFieldPreview.material as THREE.Material).dispose();
      for (const q of [quarkCharge, quarkTelek, quarkShield, quarkUlt, quarkBeamMuzzle, quarkBeamTrail]) {
        quarksRenderer.deleteSystem(q.ps);
        q.ps.dispose();
        q.mat.map?.dispose();
        q.mat.dispose();
      }
      wandaGroup.remove(quarksRenderer);
      handAuraL.geometry.dispose();
      (handAuraL.material as THREE.Material).dispose();
      handAuraR.geometry.dispose();
      (handAuraR.material as THREE.Material).dispose();
      handSigilL.geometry.dispose();
      (handSigilL.material as THREE.Material).dispose();
      handSigilR.geometry.dispose();
      (handSigilR.material as THREE.Material).dispose();
      sigilTex.dispose();
      wandaShieldBubble.geometry.dispose();
      (wandaShieldBubble.material as THREE.Material).dispose();
      if (wandaHumOsc) wandaHumOsc.stop();
      if (wandaAudioCtx) wandaAudioCtx.close();
      if (heldItemMesh) {
        heldItemRoot.remove(heldItemMesh);
        heldItemMesh.traverse((obj) => { if (obj instanceof THREE.Mesh) { (obj.geometry as THREE.BufferGeometry).dispose(); (obj.material as THREE.Material).dispose(); } });
      }
      if (leftHand) {
        handsRoot.remove(leftHand);
        leftHand.traverse((obj) => { if (obj instanceof THREE.Mesh) { (obj.geometry as THREE.BufferGeometry).dispose(); (obj.material as THREE.Material).dispose(); } });
      }
      if (rightHand) {
        handsRoot.remove(rightHand);
        rightHand.traverse((obj) => { if (obj instanceof THREE.Mesh) { (obj.geometry as THREE.BufferGeometry).dispose(); (obj.material as THREE.Material).dispose(); } });
      }
      bloomComposer.dispose();
      voxelMaterial.dispose(); waterMaterial.dispose(); atlasTexture.dispose(); waterTex.dispose();
      (breakOverlay.geometry as THREE.BufferGeometry).dispose(); breakOverlayMaterial.dispose();
      for (const tex of breakTextures) tex.dispose();
      (sunSphere.geometry as THREE.BufferGeometry).dispose(); (sunSphere.material as THREE.Material).dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [seed, inventory.length]);

  const currentItem = inventory[selectedSlot];
  const isThunderStaff = currentItem?.item === "thunder_staff";
  const isBow = currentItem?.item === "bow" || currentItem?.item === "fire_bow";
  const isWanda = currentItem?.item === "wanda_focus";

  return (
    <section className="fixed inset-0 z-[1] h-screen w-screen overflow-hidden bg-black">
      <div ref={mountRef} className="absolute inset-0 h-full w-full" />

      {/* Crosshair */}
      <div style={{ position: "fixed", inset: 0, zIndex: 10050, pointerEvents: "none", display: "grid", placeItems: "center" }}>
        <div style={{ width: 18, height: 18, position: "relative", filter: "drop-shadow(0 0 2px rgba(0,0,0,0.95))" }}>
          <div style={{ position: "absolute", left: 1, right: 1, top: "50%", height: 2, transform: "translateY(-50%)", background: isWanda ? "#991b1b" : isThunderStaff ? "#facc15" : "#ffffff", borderRadius: 999, boxShadow: "0 0 0 1px rgba(0,0,0,0.6)" }} />
          <div style={{ position: "absolute", top: 1, bottom: 1, left: "50%", width: 2, transform: "translateX(-50%)", background: isWanda ? "#991b1b" : isThunderStaff ? "#facc15" : "#ffffff", borderRadius: 999, boxShadow: "0 0 0 1px rgba(0,0,0,0.6)" }} />
          <div style={{ position: "absolute", left: "50%", top: "50%", width: 3, height: 3, transform: "translate(-50%, -50%)", background: isWanda ? "#991b1b" : isThunderStaff ? "#facc15" : "#ffffff", borderRadius: "999px", boxShadow: "0 0 0 1px rgba(0,0,0,0.65)" }} />
        </div>
      </div>

      {/* HUD top left */}
      <div style={{ position: "fixed", left: "14px", top: "14px", zIndex: 9999, pointerEvents: "none", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.45)", background: "linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.08))", backdropFilter: "blur(12px) saturate(125%)", color: "white", padding: "8px 10px", minWidth: "170px", boxShadow: "0 8px 20px rgba(0,0,0,0.22)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.02em" }}>
        <div style={{ marginBottom: "4px", opacity: 0.96 }}>HP {health}/20</div>
        <div style={{ height: "8px", borderRadius: "999px", background: "rgba(255,255,255,0.2)", overflow: "hidden", marginBottom: "6px" }}>
          <div style={{ width: `${(health / 20) * 100}%`, height: "100%", background: health > 10 ? "linear-gradient(90deg, #22c55e, #4ade80)" : "linear-gradient(90deg, #ef4444, #f97316)", transition: "width 120ms ease" }} />
        </div>
        <div style={{ opacity: 0.88 }}>Mobs: {mobCount}</div>

        {/* Thunder cooldown */}
        {thunderCooldownUI > 0 && (
          <div style={{ marginTop: "6px", opacity: 0.95 }}>
            <div style={{ fontSize: "10px", marginBottom: "3px", color: "#facc15" }}>⚡ Recarga: {thunderCooldownUI.toFixed(1)}s</div>
            <div style={{ height: "6px", borderRadius: "999px", background: "rgba(255,255,255,0.2)", overflow: "hidden" }}>
              <div style={{ width: `${((6 - thunderCooldownUI) / 6) * 100}%`, height: "100%", background: "linear-gradient(90deg, #facc15, #fbbf24)", transition: "width 100ms ease" }} />
            </div>
          </div>
        )}
      </div>

      {/* Bow charge indicator */}
      {isBow && (
        <div style={{ position: "fixed", left: "50%", bottom: "110px", transform: "translateX(-50%)", zIndex: 9999, pointerEvents: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
          <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.85)", fontWeight: 700, textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
            {currentItem?.item === "fire_bow" ? "🔥 Fire Bow" : "🏹 Bow"}
          </div>
          <div style={{ width: "80px", height: "6px", borderRadius: "999px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.3)", overflow: "hidden" }}>
            <div style={{ width: "0%", height: "100%", background: currentItem?.item === "fire_bow" ? "linear-gradient(90deg, #fb923c, #ef4444)" : "linear-gradient(90deg, #a3e635, #22c55e)", transition: "none" }} id="bow-charge-bar" />
          </div>
        </div>
      )}

      {/* Weapon ammo HUD */}
      {weaponHud && (
        <div style={{
          position: "fixed",
          right: "14px",
          bottom: "112px",
          zIndex: 9999,
          pointerEvents: "none",
          borderRadius: "14px",
          border: "1px solid rgba(255,255,255,0.45)",
          background: "linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0.07))",
          backdropFilter: "blur(14px) saturate(130%)",
          color: "white",
          padding: "10px 12px",
          minWidth: "168px",
          boxShadow: "0 10px 26px rgba(0,0,0,0.24)",
          fontSize: "11px",
          fontWeight: 800,
          letterSpacing: "0.02em",
        }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "10px" }}>
            <div style={{ opacity: 0.95 }}>{weaponHud.label}</div>
            <div style={{ fontSize: "16px", lineHeight: 1, fontWeight: 900 }}>
              {weaponHud.ammo}
              <span style={{ fontSize: "11px", opacity: 0.7, fontWeight: 900 }}>/{weaponHud.mag}</span>
            </div>
          </div>
          <div style={{ marginTop: "8px", height: "7px", borderRadius: 999, background: "rgba(255,255,255,0.18)", overflow: "hidden" }}>
            <div style={{
              width: `${weaponHud.reloading ? weaponHud.reloadFrac * 100 : (weaponHud.ammo / Math.max(1, weaponHud.mag)) * 100}%`,
              height: "100%",
              background: weaponHud.reloading
                ? "linear-gradient(90deg, rgba(250,204,21,0.9), rgba(251,191,36,0.95))"
                : "linear-gradient(90deg, rgba(59,130,246,0.85), rgba(34,211,238,0.9))",
              transition: "width 80ms linear",
            }} />
          </div>
          <div style={{ marginTop: "6px", opacity: 0.8, fontSize: "10px", fontWeight: 900 }}>
            {weaponHud.reloading ? "Recargando… (R)" : "R para recargar"}
          </div>
        </div>
      )}

      {wandaHud && (
        <div style={{
          position: "fixed",
          right: "14px",
          bottom: "198px",
          zIndex: 9999,
          pointerEvents: "none",
          borderRadius: "14px",
          border: "1px solid rgba(120,24,28,0.55)",
          background: "linear-gradient(145deg, rgba(60,10,14,0.42), rgba(120,20,28,0.2))",
          backdropFilter: "blur(12px) saturate(130%)",
          color: "white",
          padding: "10px 12px",
          minWidth: "190px",
          boxShadow: "0 10px 26px rgba(0,0,0,0.24)",
          fontSize: "11px",
          fontWeight: 800,
          letterSpacing: "0.02em",
        }}>
          <div style={{ marginBottom: "5px", color: "#dc2626" }}>Wanda Power</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", rowGap: "4px", columnGap: "8px", fontSize: "10px" }}>
            <span>Energy</span><span>{Math.round(wandaHud.energy)}%</span>
            <span>Shield (Q)</span><span>{wandaHud.shieldActive ? "ACTIVE" : wandaHud.shieldCd > 0 ? `${wandaHud.shieldCd.toFixed(1)}s` : "READY"}</span>
            <span>Ultimate (F)</span><span>{wandaHud.ultCd > 0 ? `${wandaHud.ultCd.toFixed(1)}s` : "READY"}</span>
            <span>Telekinesis</span><span>{wandaHud.tkActive ? `FIELD (${wandaHud.tkCaptured})` : "idle"}</span>
            <span>TK Radius</span><span>{wandaHud.tkRadius.toFixed(1)}m</span>
            <span>State</span><span>{wandaHud.mode}</span>
          </div>
          <div style={{ marginTop: "7px", height: "6px", borderRadius: "999px", background: "rgba(255,255,255,0.18)", overflow: "hidden" }}>
            <div style={{ width: `${wandaHud.energy}%`, height: "100%", background: "linear-gradient(90deg, #7f1d1d, #b91c1c)", transition: "width 100ms linear" }} />
          </div>
          <div style={{ marginTop: "6px", height: "5px", borderRadius: "999px", background: "rgba(255,255,255,0.14)", overflow: "hidden" }}>
            <div style={{ width: `${Math.round(wandaHud.charging * 100)}%`, height: "100%", background: "linear-gradient(90deg, #991b1b, #dc2626)", transition: "width 60ms linear" }} />
          </div>
        </div>
      )}

      {/* Thunder staff hint */}
      {isThunderStaff && thunderCooldownUI <= 0 && (
        <div style={{ position: "fixed", left: "50%", bottom: "110px", transform: "translateX(-50%)", zIndex: 9999, pointerEvents: "none", background: "rgba(250,204,21,0.15)", border: "1px solid rgba(250,204,21,0.5)", borderRadius: "999px", padding: "4px 12px", color: "#facc15", fontSize: "11px", fontWeight: 700, backdropFilter: "blur(8px)" }}>
          ⚡ Click para lanzar RAYO — Daño en área
        </div>
      )}
      {isWanda && (
        <div style={{ position: "fixed", left: "50%", bottom: "110px", transform: "translateX(-50%)", zIndex: 9999, pointerEvents: "none", background: "rgba(60,10,14,0.35)", border: "1px solid rgba(120,28,32,0.55)", borderRadius: "999px", padding: "4px 12px", color: "#ef4444", fontSize: "11px", fontWeight: 700, backdropFilter: "blur(8px)" }}>
          Wanda: LMB carga y lanza • RMB telekinesis • Space/Shift volar • Q escudo • F ultimate
        </div>
      )}

      {/* Hotbar */}
      <div key={`hotbar-${selectedSlot}`} style={{ position: "fixed", left: "50%", bottom: "14px", transform: "translateX(-50%)", zIndex: 9999, pointerEvents: "none", display: "flex", alignItems: "center", gap: "5px", padding: "6px 8px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.55)", background: "linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0.1))", boxShadow: "0 10px 26px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.55)", backdropFilter: "blur(18px) saturate(130%)" }}>
        {inventory.slice(0, 9).map((slot, i) => (
          <div key={i} style={{ width: "42px", height: "42px", borderRadius: "999px", border: i === selectedSlot ? "2px solid rgba(251,191,36,0.85)" : "1px solid rgba(255,255,255,0.42)", background: i === selectedSlot ? "rgba(255,255,255,0.34)" : "rgba(255,255,255,0.16)", position: "relative", boxShadow: i === selectedSlot ? "0 0 0 1px rgba(255,243,190,0.7), 0 0 14px rgba(251,191,36,0.28)" : "inset 0 1px 0 rgba(255,255,255,0.3)" }}>
            <div style={{ position: "absolute", left: "8px", right: "8px", top: "5px", height: "20px", borderRadius: "999px", background: slot ? itemColor(slot.item) : "transparent", opacity: slot ? 0.9 : 0 }} />
            {slot && (
              <div style={{ position: "absolute", left: 0, right: 0, top: 11, textAlign: "center", fontSize: "8px", fontWeight: 800, color: "rgba(15,23,42,0.85)" }}>
                {itemGlyph(slot.item)}
              </div>
            )}
            <div style={{ position: "absolute", bottom: "3px", left: 0, right: 0, textAlign: "center", fontSize: "9px", fontWeight: 700, color: "rgba(248,250,252,0.96)", textShadow: "0 1px 2px rgba(15,23,42,0.5)", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{i + 1}</div>
            {slot && <div style={{ position: "absolute", top: "2px", right: "5px", fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,0.95)", textShadow: "0 1px 2px rgba(0,0,0,0.85)" }}>{slot.count}</div>}
          </div>
        ))}
      </div>

      {/* Using indicator */}
      <div style={{ position: "fixed", left: "14px", bottom: "88px", zIndex: 9999, pointerEvents: "none", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.55)", background: "linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.08))", color: "rgba(248,250,252,0.96)", padding: "6px 10px", fontSize: "11px", fontWeight: 600, letterSpacing: "0.02em", backdropFilter: "blur(16px) saturate(125%)", boxShadow: "0 8px 22px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.5)" }}>
        Using: {inventory[selectedSlot] ? `${itemLabel(inventory[selectedSlot]!.item)} x${inventory[selectedSlot]!.count}` : "Empty"}
      </div>

      {/* Mob legend */}
      <div style={{ position: "fixed", right: "14px", top: "14px", zIndex: 9999, pointerEvents: "none", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.35)", background: "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.07))", backdropFilter: "blur(12px)", color: "white", padding: "8px 10px", fontSize: "10px", fontWeight: 600, lineHeight: 1.7 }}>
        <div style={{ marginBottom: "2px", fontWeight: 700, opacity: 0.9 }}>Mobs</div>
        <div>🟢 Slime — debil</div>
        <div>🟤 Boar — rapido</div>
        <div>🔴 Inferno — fuego</div>
        <div>🔵 Aqua — agua</div>
        <div>🟣 Shadow — teletransporte</div>
        <div>🔴 Wanda Focus — poder caos</div>
      </div>

      {showInventory && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(2,6,23,0.45)", backdropFilter: "blur(8px)", display: "grid", placeItems: "center" }} onContextMenu={(e) => e.preventDefault()}>
          <div style={{ width: "min(920px, 92vw)", borderRadius: "18px", border: "1px solid rgba(255,255,255,0.35)", background: "linear-gradient(145deg, rgba(255,255,255,0.22), rgba(255,255,255,0.08))", boxShadow: "0 20px 60px rgba(0,0,0,0.35)", padding: "14px", color: "white" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "11px", opacity: 0.9 }}>
              <span>LMB: stack | RMB: 1 unidad</span>
              <span>{cursorStack ? `Cursor: ${itemLabel(cursorStack.item)} x${cursorStack.count}` : "Cursor: empty"}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "16px" }}>
              <div>
                <div style={{ marginBottom: "10px", fontWeight: 700, opacity: 0.95 }}>Inventory</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: "8px" }}>
                  {inventory.map((slot, i) => (
                    <button key={i} type="button" onClick={() => clickSlot("inv", i, "left")} onContextMenu={(e) => { e.preventDefault(); clickSlot("inv", i, "right"); }}
                      draggable={!!slot} onDragStart={(e) => { if (!slot) return; e.dataTransfer.effectAllowed = "move"; setDragItem({ source: "inv", index: i }); }}
                      onDragEnd={() => setDragItem(null)} onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.preventDefault(); moveDragToInventory(i); setDragItem(null); }}
                      title={slot ? itemLabel(slot.item) : "Empty"}
                      style={{ height: "54px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.28)", background: "rgba(255,255,255,0.12)", position: "relative", cursor: slot ? "pointer" : "default" }}>
                      {slot && (
                        <>
                          <div style={{ position: "absolute", left: 8, right: 8, top: 8, height: 26, borderRadius: 8, background: itemColor(slot.item) }} />
                          <div style={{ position: "absolute", left: 0, right: 0, top: 16, textAlign: "center", fontSize: "9px", fontWeight: 800, color: "rgba(15,23,42,0.85)" }}>{itemGlyph(slot.item)}</div>
                          <div style={{ position: "absolute", left: 5, bottom: 4, fontSize: "8px", maxWidth: "70%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: 0.95 }}>{itemLabel(slot.item)}</div>
                          <div style={{ position: "absolute", right: 7, bottom: 5, fontSize: "10px", fontWeight: 700, color: "white", textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>{slot.count}</div>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ marginBottom: "10px", fontWeight: 700, opacity: 0.95 }}>Crafting (3×3)</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "10px" }}>
                  {craftGrid.map((cell, i) => (
                    <button key={i} type="button" onClick={() => clickSlot("craft", i, "left")} onContextMenu={(e) => { e.preventDefault(); clickSlot("craft", i, "right"); }}
                      draggable={!!cell} onDragStart={(e) => { if (!cell) return; e.dataTransfer.effectAllowed = "move"; setDragItem({ source: "craft", index: i }); }}
                      onDragEnd={() => setDragItem(null)} onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.preventDefault(); moveDragToCraft(i); setDragItem(null); }}
                      title={cell ? itemLabel(cell.item) : "Empty"}
                      style={{ height: "62px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.28)", background: "rgba(255,255,255,0.12)", position: "relative", cursor: cell ? "pointer" : "default" }}>
                      {cell && (
                        <>
                          <div style={{ position: "absolute", left: 10, right: 10, top: 10, height: 30, borderRadius: 9, background: itemColor(cell.item) }} />
                          <div style={{ position: "absolute", left: 0, right: 0, top: 20, textAlign: "center", fontSize: "9px", fontWeight: 800, color: "rgba(15,23,42,0.85)" }}>{itemGlyph(cell.item)}</div>
                          <div style={{ position: "absolute", left: 5, bottom: 4, fontSize: "8px", maxWidth: "70%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: 0.95 }}>{itemLabel(cell.item)}</div>
                          <div style={{ position: "absolute", right: 8, bottom: 6, fontSize: "10px", fontWeight: 700, color: "white", textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>{cell.count}</div>
                        </>
                      )}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "10px", padding: "8px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.24)", background: "rgba(255,255,255,0.1)" }}>
                  <span style={{ fontSize: "12px", opacity: 0.9 }}>Result</span>
                  <span style={{ fontSize: "12px", fontWeight: 700 }}>{craftResult ? `${itemLabel(craftResult.recipe.output.item)} x${craftResult.recipe.output.count}` : "-"}</span>
                </div>
                <button type="button" onClick={craftOne} disabled={!craftResult}
                  style={{ width: "100%", height: "38px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.35)", background: craftResult ? "linear-gradient(135deg, rgba(99,102,241,0.62), rgba(168,85,247,0.56))" : "rgba(255,255,255,0.12)", color: "white", fontWeight: 700, cursor: craftResult ? "pointer" : "not-allowed" }}>
                  Craft
                </button>
                <div style={{ marginTop: "12px", fontSize: "10px", opacity: 0.7, lineHeight: 1.6 }}>
                  <div style={{ fontWeight: 700, marginBottom: "4px" }}>Drops especiales:</div>
                  <div>🔴 Inferno → fire_bow</div>
                  <div>🔵 Aqua → water_orb + ⚡</div>
                  <div>🟣 Shadow → ⚡ thunder staff</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}