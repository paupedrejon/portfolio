export type BlockType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
// 0 air, 1 grass, 2 dirt, 3 stone, 4 water, 5 sand, 6 wood, 7 leaves,
// 8 gravel, 9 clay, 10 red sand, 11 moss

export const CHUNK_SIZE = 16;
export const WORLD_HEIGHT = 104;
export const SEA_LEVEL = 28;

const STONE_BASE = 10;
const MAX_WORLD_Y = WORLD_HEIGHT - 1;

export type VoxelChunk = {
  cx: number;
  cz: number;
  blocks: Uint8Array;
  version: number;
};

export type HeightSample = {
  worldX: number;
  worldZ: number;
  height: number;
};

type SurfaceType = "grass" | "sand" | "stone" | "gravel" | "clay" | "red_sand" | "moss";
type BiomeKind =
  | "ocean"
  | "beach"
  | "river"
  | "plains"
  | "forest"
  | "hills"
  | "mountains"
  | "desert"
  | "badlands"
  | "wetlands";

function hash2(x: number, z: number, seed: number): number {
  const n = Math.sin(x * 127.1 + z * 311.7 + seed * 101.3) * 43758.5453;
  return n - Math.floor(n);
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function valueNoise2D(x: number, z: number, seed: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;

  const v00 = hash2(ix, iz, seed);
  const v10 = hash2(ix + 1, iz, seed);
  const v01 = hash2(ix, iz + 1, seed);
  const v11 = hash2(ix + 1, iz + 1, seed);

  const ux = smoothstep(fx);
  const uz = smoothstep(fz);
  const x0 = v00 * (1 - ux) + v10 * ux;
  const x1 = v01 * (1 - ux) + v11 * ux;
  return x0 * (1 - uz) + x1 * uz;
}

function fbm(x: number, z: number, seed: number, octaves = 5): number {
  let value = 0;
  let amp = 0.62;
  let freq = 1;
  let ampSum = 0;
  for (let i = 0; i < octaves; i++) {
    value += valueNoise2D(x * freq, z * freq, seed + i * 17) * amp;
    ampSum += amp;
    amp *= 0.52;
    freq *= 2;
  }
  return value / Math.max(0.0001, ampSum);
}

function ridgeNoise(x: number, z: number, seed: number): number {
  const n = valueNoise2D(x, z, seed);
  return 1 - Math.abs(n * 2 - 1);
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export class WorldGenerator {
  private readonly seed: number;
  private readonly chunkCache = new Map<string, VoxelChunk>();

  constructor(seed = 1337) {
    this.seed = seed;
  }

  key(cx: number, cz: number): string {
    return `${cx},${cz}`;
  }

  private getBiomeFields(worldX: number, worldZ: number) {
    const continental = fbm(worldX * 0.0015, worldZ * 0.0015, this.seed + 5);
    const erosion = fbm(worldX * 0.004, worldZ * 0.004, this.seed + 91);
    const peaks = ridgeNoise(worldX * 0.0034, worldZ * 0.0034, this.seed + 153);
    const humidity = fbm(worldX * 0.007, worldZ * 0.007, this.seed + 331);
    const temperature = fbm(worldX * 0.006, worldZ * 0.006, this.seed + 773);
    const riverSignal = ridgeNoise(worldX * 0.0082, worldZ * 0.0082, this.seed + 509);
    const lakeMask = fbm(worldX * 0.0028, worldZ * 0.0028, this.seed + 919);
    return { continental, erosion, peaks, humidity, temperature, riverSignal, lakeMask };
  }

  private classifyBiome(worldX: number, worldZ: number, height: number): BiomeKind {
    const { humidity, peaks, temperature, riverSignal } = this.getBiomeFields(worldX, worldZ);
    if (height <= SEA_LEVEL - 1) return "ocean";
    if (height <= SEA_LEVEL + 1) return "beach";
    if (riverSignal < 0.12 && height <= SEA_LEVEL + 4) return "river";
    if (humidity > 0.72 && temperature < 0.55 && height < 48) return "wetlands";
    if (temperature > 0.72 && humidity < 0.4 && height > SEA_LEVEL + 1) return "desert";
    if (temperature > 0.66 && humidity < 0.33 && height > SEA_LEVEL + 5) return "badlands";
    if (height >= 66 || peaks > 0.72) return "mountains";
    if (height >= 52) return "hills";
    if (humidity > 0.58) return "forest";
    return "plains";
  }

  getColumnHeight(worldX: number, worldZ: number): number {
    const f = this.getBiomeFields(worldX, worldZ);
    const baseLand = 14 + f.continental * 28;
    const hills = f.erosion * 14;
    const mountainBoost = f.peaks > 0.57 ? (f.peaks - 0.57) * 70 : 0;
    const detail = fbm(worldX * 0.03, worldZ * 0.03, this.seed + 1211, 4) * 4.2;
    const riverCut = clamp((0.17 - f.riverSignal) * 95, 0, 14);
    const lakeCut = clamp((0.42 - f.lakeMask) * 24, 0, 7.5);
    const oceanShift = clamp((0.36 - f.continental) * 30, 0, 11);

    const height = baseLand + hills + mountainBoost + detail - riverCut - lakeCut - oceanShift;
    return clamp(Math.floor(height), STONE_BASE + 2, MAX_WORLD_Y - 2);
  }

  getSurfaceType(worldX: number, worldZ: number, height: number): SurfaceType {
    const biome = this.classifyBiome(worldX, worldZ, height);
    if (biome === "ocean" || biome === "beach") return "sand";
    if (biome === "river") return "gravel";
    if (biome === "wetlands") return "moss";
    if (biome === "desert") return "sand";
    if (biome === "badlands") return "red_sand";
    if (biome === "mountains") return "stone";
    const { humidity, temperature } = this.getBiomeFields(worldX, worldZ);
    if (temperature > 0.68 && humidity < 0.52 && height < SEA_LEVEL + 6) return "sand";
    return "grass";
  }

  shouldPlaceTree(worldX: number, worldZ: number, topHeight: number, surface: SurfaceType): boolean {
    if (surface !== "grass" && surface !== "moss") return false;
    if (topHeight <= SEA_LEVEL + 1 || topHeight > 58) return false;
    const biome = this.classifyBiome(worldX, worldZ, topHeight);
    if (biome === "desert" || biome === "badlands" || biome === "river") return false;
    if (biome === "plains" && hash2(worldX, worldZ, this.seed + 19) > 0.22) return false;
    if (biome === "hills" && hash2(worldX, worldZ, this.seed + 23) > 0.45) return false;
    if (biome === "mountains") return false;
    const humidity = fbm(worldX * 0.01, worldZ * 0.01, this.seed + 1777);
    const jitter = hash2(worldX * 5, worldZ * 5, this.seed + 311);
    return humidity > 0.46 && jitter > 0.7;
  }

  private blockIndex(lx: number, y: number, lz: number): number {
    return y * CHUNK_SIZE * CHUNK_SIZE + lz * CHUNK_SIZE + lx;
  }

  private setBlockLocal(
    blocks: Uint8Array,
    lx: number,
    y: number,
    lz: number,
    block: BlockType
  ) {
    if (lx < 0 || lz < 0 || y < 0 || lx >= CHUNK_SIZE || lz >= CHUNK_SIZE || y >= WORLD_HEIGHT) return;
    blocks[this.blockIndex(lx, y, lz)] = block;
  }

  private placeTree(blocks: Uint8Array, lx: number, lz: number, topY: number) {
    const trunkH = 4 + ((lx * 19 + lz * 11 + this.seed) & 1);
    for (let i = 1; i <= trunkH; i++) {
      this.setBlockLocal(blocks, lx, topY + i, lz, 6);
    }
    const leafBase = topY + trunkH - 1;
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        for (let dy = 0; dy <= 2; dy++) {
          const dist = Math.abs(dx) + Math.abs(dz) + dy;
          if (dist > 4) continue;
          if (dx === 0 && dz === 0 && dy <= 1) continue;
          this.setBlockLocal(blocks, lx + dx, leafBase + dy, lz + dz, 7);
        }
      }
    }
  }

  private generateChunk(cx: number, cz: number): VoxelChunk {
    const blocks = new Uint8Array(CHUNK_SIZE * WORLD_HEIGHT * CHUNK_SIZE);

    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        const wx = cx * CHUNK_SIZE + lx;
        const wz = cz * CHUNK_SIZE + lz;
        const h = this.getColumnHeight(wx, wz);
        const surface = this.getSurfaceType(wx, wz, h);

        for (let y = 0; y <= h; y++) {
          const idx = this.blockIndex(lx, y, lz);
          if (y === h) {
            if (surface === "sand") blocks[idx] = 5;
            else if (surface === "red_sand") blocks[idx] = 10;
            else if (surface === "stone") blocks[idx] = 3;
            else if (surface === "gravel") blocks[idx] = 8;
            else if (surface === "clay") blocks[idx] = 9;
            else if (surface === "moss") blocks[idx] = 11;
            else blocks[idx] = 1;
          } else if (y > h - 3 && surface !== "stone") {
            if (surface === "red_sand") blocks[idx] = 10;
            else if (surface === "gravel") blocks[idx] = 8;
            else if (surface === "clay") blocks[idx] = 9;
            else if (surface === "moss") blocks[idx] = 2;
            else blocks[idx] = 2;
          } else {
            blocks[idx] = 3;
          }
        }

        if (h < SEA_LEVEL) {
          for (let y = h + 1; y <= SEA_LEVEL; y++) {
            this.setBlockLocal(blocks, lx, y, lz, 4);
          }
        }

        // Extra inland lakes where humidity is high and terrain is gentle.
        const fields = this.getBiomeFields(wx, wz);
        const biome = this.classifyBiome(wx, wz, h);
        const localLakeLevel = biome === "wetlands" ? SEA_LEVEL : SEA_LEVEL - 2;
        if (h < localLakeLevel && fields.humidity > 0.62 && fields.lakeMask < 0.46) {
          for (let y = h + 1; y <= localLakeLevel; y++) {
            this.setBlockLocal(blocks, lx, y, lz, 4);
          }
        }

        if (this.shouldPlaceTree(wx, wz, h, surface)) {
          this.placeTree(blocks, lx, lz, h);
        }
      }
    }

    return { cx, cz, blocks, version: 0 };
  }

  getChunk(cx: number, cz: number): VoxelChunk {
    const k = this.key(cx, cz);
    const cached = this.chunkCache.get(k);
    if (cached) return cached;
    const chunk = this.generateChunk(cx, cz);
    this.chunkCache.set(k, chunk);
    return chunk;
  }

  getChunkVersion(cx: number, cz: number): number {
    return this.getChunk(cx, cz).version;
  }

  getBlockWorld(worldX: number, y: number, worldZ: number): BlockType {
    if (y < 0 || y >= WORLD_HEIGHT) return 0;
    const cx = Math.floor(worldX / CHUNK_SIZE);
    const cz = Math.floor(worldZ / CHUNK_SIZE);
    const lx = ((worldX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((worldZ % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const chunk = this.getChunk(cx, cz);
    return chunk.blocks[this.blockIndex(lx, y, lz)] as BlockType;
  }

  setBlockWorld(worldX: number, y: number, worldZ: number, block: BlockType): boolean {
    if (y < 0 || y >= WORLD_HEIGHT) return false;
    const cx = Math.floor(worldX / CHUNK_SIZE);
    const cz = Math.floor(worldZ / CHUNK_SIZE);
    const lx = ((worldX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((worldZ % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const chunk = this.getChunk(cx, cz);
    const idx = this.blockIndex(lx, y, lz);
    if (chunk.blocks[idx] === block) return false;
    chunk.blocks[idx] = block;
    chunk.version++;
    return true;
  }

  getSpawnHeight(worldX: number, worldZ: number): number {
    const h = this.getColumnHeight(worldX, worldZ);
    // Spawn above water level and above vegetation canopy.
    return Math.max(h + 3, SEA_LEVEL + 3);
  }

  collectNearbyHeights(
    centerX: number,
    centerZ: number,
    radius = 24,
    step = 2
  ): HeightSample[] {
    const data: HeightSample[] = [];
    for (let x = centerX - radius; x <= centerX + radius; x += step) {
      for (let z = centerZ - radius; z <= centerZ + radius; z += step) {
        data.push({ worldX: x, worldZ: z, height: this.getColumnHeight(x, z) });
      }
    }
    return data;
  }

  pruneCache(activeKeys: Set<string>) {
    for (const key of this.chunkCache.keys()) {
      if (!activeKeys.has(key)) this.chunkCache.delete(key);
    }
  }
}
