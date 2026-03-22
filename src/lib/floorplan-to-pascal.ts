/**
 * Converts Gemini floorplan analysis to Pascal Editor SceneGraph.
 */

import { customAlphabet } from 'nanoid'

const makeId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 16)
const genId = (prefix: string) => `${prefix}_${makeId()}`

interface FloorplanData {
  walls: Array<{ start: [number, number]; end: [number, number]; thickness?: number }>
  rooms?: Array<{ name: string; polygon: [number, number][]; type?: string }>
  doors?: Array<{ position: [number, number]; width?: number; rotation?: number }>
  windows?: Array<{ position: [number, number]; width?: number }>
  dimensions?: { width: number; height: number }
}

function pointToSegmentDistance(
  p: [number, number], a: [number, number], b: [number, number]
): { dist: number; t: number } {
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return { dist: Math.hypot(p[0] - a[0], p[1] - a[1]), t: 0 }
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  return {
    dist: Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy)),
    t,
  }
}

function findNearestWall(
  pos: [number, number],
  walls: Array<{ start: [number, number]; end: [number, number] }>,
  wallIds: string[]
): { wallId: string; t: number } | null {
  let minDist = Infinity, bestIdx = -1, bestT = 0
  for (let i = 0; i < walls.length; i++) {
    const { dist, t } = pointToSegmentDistance(pos, walls[i].start, walls[i].end)
    if (dist < minDist) { minDist = dist; bestIdx = i; bestT = t }
  }
  return bestIdx >= 0 && minDist < 1.5 ? { wallId: wallIds[bestIdx], t: bestT } : null
}

export function floorplanToPascalScene(data: FloorplanData) {
  const nodes: Record<string, any> = {}

  const siteId = genId('site')
  const buildingId = genId('building')
  const levelId = genId('level')

  const wallIds: string[] = []
  // Create walls — doors/windows will be gaps (no physical door/window nodes for now)
  for (const wall of data.walls) {
    const wallId = genId('wall')
    wallIds.push(wallId)
    nodes[wallId] = {
      object: 'node', id: wallId, type: 'wall',
      name: `Wall ${wallIds.length}`,
      parentId: levelId, visible: true, children: [],
      start: [wall.start[0], wall.start[1]],
      end: [wall.end[0], wall.end[1]],
      thickness: wall.thickness || 0.15, height: 2.8,
      frontSide: 'unknown', backSide: 'unknown', metadata: {},
    }
  }

  // Level — walls are direct children, doors/windows are children of walls
  nodes[levelId] = {
    object: 'node', id: levelId, type: 'level',
    name: 'Level 0', parentId: buildingId, visible: true,
    children: [...wallIds],
    elevation: 0, height: 2.8, level: 0, metadata: {},
  }

  nodes[buildingId] = {
    object: 'node', id: buildingId, type: 'building',
    name: 'Building', parentId: siteId, visible: true,
    children: [levelId], metadata: {},
  }

  nodes[siteId] = {
    object: 'node', id: siteId, type: 'site',
    name: 'Site', parentId: null, visible: true,
    children: [buildingId], boundary: [], metadata: {},
  }

  return { nodes, rootNodeIds: [siteId] }
}
