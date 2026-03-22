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

/**
 * Find nearest wall to a point, returns wall index and the localX
 * (distance along the wall from start) where the point projects.
 */
function findNearestWall(
  pos: [number, number],
  walls: Array<{ start: [number, number]; end: [number, number] }>
): { wallIdx: number; localX: number; dist: number } | null {
  let best: { wallIdx: number; localX: number; dist: number } | null = null

  for (let i = 0; i < walls.length; i++) {
    const w = walls[i]
    const dx = w.end[0] - w.start[0]
    const dy = w.end[1] - w.start[1]
    const lenSq = dx * dx + dy * dy
    if (lenSq === 0) continue
    const wallLen = Math.sqrt(lenSq)

    // Project point onto wall line
    let t = ((pos[0] - w.start[0]) * dx + (pos[1] - w.start[1]) * dy) / lenSq
    t = Math.max(0, Math.min(1, t))

    const projX = w.start[0] + t * dx
    const projY = w.start[1] + t * dy
    const dist = Math.hypot(pos[0] - projX, pos[1] - projY)

    const localX = t * wallLen

    if (!best || dist < best.dist) {
      best = { wallIdx: i, localX, dist }
    }
  }

  return best && best.dist < 2.0 ? best : null
}

export function floorplanToPascalScene(data: FloorplanData) {
  const nodes: Record<string, any> = {}

  const siteId = genId('site')
  const buildingId = genId('building')
  const levelId = genId('level')

  const wallIds: string[] = []

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

  // Create doors — position is [localX, height/2, 0] in wall-local space
  if (data.doors) {
    for (const door of data.doors) {
      const nearest = findNearestWall(door.position, data.walls)
      if (!nearest) continue

      const wallId = wallIds[nearest.wallIdx]
      const w = data.walls[nearest.wallIdx]
      const wallAngle = Math.atan2(w.end[1] - w.start[1], w.end[0] - w.start[0])
      const doorWidth = door.width || 0.9
      const doorHeight = 2.1

      // Clamp localX so door stays within wall
      const wallLen = Math.hypot(w.end[0] - w.start[0], w.end[1] - w.start[1])
      const localX = Math.max(doorWidth / 2, Math.min(wallLen - doorWidth / 2, nearest.localX))

      const doorId = genId('door')
      nodes[doorId] = {
        object: 'node', id: doorId, type: 'door',
        name: `Door ${Object.values(nodes).filter((n: any) => n.type === 'door').length + 1}`,
        parentId: wallId, visible: true,
        position: [localX, doorHeight / 2, 0],
        rotation: [0, 0, 0],
        wallId: wallId, side: 'front',
        width: doorWidth, height: doorHeight,
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
      nodes[wallId].children.push(doorId)
    }
  }

  // Create windows — position is [localX, sillHeight + height/2, 0]
  if (data.windows) {
    for (const win of data.windows) {
      const nearest = findNearestWall(win.position, data.walls)
      if (!nearest) continue

      const wallId = wallIds[nearest.wallIdx]
      const w = data.walls[nearest.wallIdx]
      const winWidth = win.width || 1.2
      const winHeight = 1.2
      const sillHeight = 0.9

      const wallLen = Math.hypot(w.end[0] - w.start[0], w.end[1] - w.start[1])
      const localX = Math.max(winWidth / 2, Math.min(wallLen - winWidth / 2, nearest.localX))

      const windowId = genId('window')
      nodes[windowId] = {
        object: 'node', id: windowId, type: 'window',
        name: `Window ${Object.values(nodes).filter((n: any) => n.type === 'window').length + 1}`,
        parentId: wallId, visible: true,
        position: [localX, sillHeight + winHeight / 2, 0],
        rotation: [0, 0, 0],
        wallId: wallId, side: 'front',
        width: winWidth, height: winHeight,
        sillHeight: sillHeight,
        frameThickness: 0.05, frameDepth: 0.07,
        panes: { rows: 1, columns: 1 },
        metadata: {},
      }
      nodes[wallId].children.push(windowId)
    }
  }

  // Level — walls are direct children
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
