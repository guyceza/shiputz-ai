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
  const doorIds: string[] = []
  const windowIds: string[] = []

  // Create walls
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

  // Create doors — attach to nearest wall
  if (data.doors) {
    for (const door of data.doors) {
      const nearest = findNearestWall(door.position, data.walls, wallIds)
      if (!nearest) continue
      
      const doorId = genId('door')
      doorIds.push(doorId)
      nodes[doorId] = {
        object: 'node', id: doorId, type: 'door',
        name: `Door ${doorIds.length}`,
        parentId: nearest.wallId, visible: true,
        position: [0, 0, 0], rotation: [0, 0, 0],
        wallId: nearest.wallId, side: 'front',
        width: door.width || 0.9, height: 2.1,
        frameThickness: 0.05, frameDepth: 0.07,
        threshold: true, thresholdHeight: 0.02,
        hingesSide: 'left', swingDirection: 'inward',
        segments: [
          { type: 'panel', heightRatio: 0.4, columnRatios: [1], dividerThickness: 0.03, panelDepth: 0.01, panelInset: 0.04 },
          { type: 'panel', heightRatio: 0.6, columnRatios: [1], dividerThickness: 0.03, panelDepth: 0.01, panelInset: 0.04 },
        ],
        handle: true, handleHeight: 1.05, handleSide: 'right',
        contentPadding: [0.04, 0.04],
        doorCloser: false, panicBar: false, panicBarHeight: 1.0,
        metadata: {},
      }
      // Add door as child of wall
      nodes[nearest.wallId].children.push(doorId)
    }
  }

  // Create windows — attach to nearest wall
  if (data.windows) {
    for (const win of data.windows) {
      const nearest = findNearestWall(win.position, data.walls, wallIds)
      if (!nearest) continue
      
      const windowId = genId('window')
      windowIds.push(windowId)
      nodes[windowId] = {
        object: 'node', id: windowId, type: 'window',
        name: `Window ${windowIds.length}`,
        parentId: nearest.wallId, visible: true,
        position: [0, 0, 0], rotation: [0, 0, 0],
        wallId: nearest.wallId, side: 'front',
        width: win.width || 1.2, height: 1.2,
        sillHeight: 0.9,
        frameThickness: 0.05, frameDepth: 0.07,
        panes: { rows: 1, columns: 1 },
        metadata: {},
      }
      nodes[nearest.wallId].children.push(windowId)
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
