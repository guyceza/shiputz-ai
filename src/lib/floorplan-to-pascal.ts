/**
 * Converts Gemini floorplan analysis output to Pascal Editor SceneGraph format.
 * SceneGraph = { nodes: Record<string, unknown>, rootNodeIds: string[] }
 */

let counter = 0
function genId(prefix: string): string {
  counter++
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36).padStart(4, '0')}`
}

interface FloorplanData {
  walls: Array<{ start: [number, number]; end: [number, number]; thickness?: number }>
  rooms?: Array<{ name: string; polygon: [number, number][]; type?: string }>
  doors?: Array<{ position: [number, number]; width?: number; rotation?: number }>
  windows?: Array<{ position: [number, number]; width?: number }>
  dimensions?: { width: number; height: number }
}

export function floorplanToPascalScene(data: FloorplanData) {
  counter = 0
  const nodes: Record<string, any> = {}

  // 1. Site node
  const siteId = genId('site')
  const buildingId = genId('building')
  const levelId = genId('level')

  nodes[siteId] = {
    object: 'node',
    id: siteId,
    type: 'site',
    name: 'Site',
    parentId: null,
    visible: true,
    children: [buildingId],
    metadata: {},
    boundary: [],
  }

  nodes[buildingId] = {
    object: 'node',
    id: buildingId,
    type: 'building',
    name: 'Building',
    parentId: siteId,
    visible: true,
    children: [levelId],
    metadata: {},
  }

  const wallIds: string[] = []
  const doorIds: string[] = []
  const windowIds: string[] = []
  const zoneIds: string[] = []

  // 2. Create walls
  for (const wall of data.walls) {
    const wallId = genId('wall')
    wallIds.push(wallId)
    nodes[wallId] = {
      object: 'node',
      id: wallId,
      type: 'wall',
      name: `Wall ${wallIds.length}`,
      parentId: levelId,
      visible: true,
      children: [],
      start: wall.start,
      end: wall.end,
      thickness: wall.thickness || 0.15,
      height: 2.8,
      frontSide: 'unknown',
      backSide: 'unknown',
      metadata: {},
    }
  }

  // 3. Create doors
  if (data.doors) {
    for (const door of data.doors) {
      const doorId = genId('door')
      doorIds.push(doorId)
      
      // Find nearest wall for this door
      const nearestWallId = findNearestWall(door.position, data.walls, wallIds)
      
      nodes[doorId] = {
        object: 'node',
        id: doorId,
        type: 'door',
        name: `Door ${doorIds.length}`,
        parentId: nearestWallId || levelId,
        visible: true,
        position: door.position,
        width: door.width || 0.9,
        height: 2.1,
        offset: 0.5, // center of wall
        swing: 'left',
        metadata: {},
      }
      
      // Add door as child of its wall
      if (nearestWallId && nodes[nearestWallId]) {
        nodes[nearestWallId].children.push(doorId)
      }
    }
  }

  // 4. Create windows
  if (data.windows) {
    for (const win of data.windows) {
      const windowId = genId('window')
      windowIds.push(windowId)
      
      const nearestWallId = findNearestWall(win.position, data.walls, wallIds)
      
      nodes[windowId] = {
        object: 'node',
        id: windowId,
        type: 'window',
        name: `Window ${windowIds.length}`,
        parentId: nearestWallId || levelId,
        visible: true,
        position: win.position,
        width: win.width || 1.2,
        height: 1.2,
        sillHeight: 0.9,
        offset: 0.5,
        metadata: {},
      }
      
      if (nearestWallId && nodes[nearestWallId]) {
        nodes[nearestWallId].children.push(windowId)
      }
    }
  }

  // 5. Create zones (rooms)
  if (data.rooms) {
    for (const room of data.rooms) {
      const zoneId = genId('zone')
      zoneIds.push(zoneId)
      nodes[zoneId] = {
        object: 'node',
        id: zoneId,
        type: 'zone',
        name: room.name,
        parentId: levelId,
        visible: true,
        boundary: room.polygon.map(([x, y]) => [x, y]),
        zoneType: room.type || 'room',
        metadata: {},
      }
    }
  }

  // 6. Level node
  nodes[levelId] = {
    object: 'node',
    id: levelId,
    type: 'level',
    name: 'Level 0',
    parentId: buildingId,
    visible: true,
    children: [...wallIds, ...doorIds, ...windowIds, ...zoneIds],
    elevation: 0,
    height: 2.8,
    metadata: {},
  }

  return {
    nodes,
    rootNodeIds: [siteId],
  }
}

function findNearestWall(
  point: [number, number],
  walls: Array<{ start: [number, number]; end: [number, number] }>,
  wallIds: string[]
): string | null {
  let minDist = Infinity
  let nearestIdx = -1

  for (let i = 0; i < walls.length; i++) {
    const dist = pointToSegmentDistance(point, walls[i].start, walls[i].end)
    if (dist < minDist) {
      minDist = dist
      nearestIdx = i
    }
  }

  return nearestIdx >= 0 && minDist < 1.0 ? wallIds[nearestIdx] : null
}

function pointToSegmentDistance(
  p: [number, number],
  a: [number, number],
  b: [number, number]
): number {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return Math.hypot(p[0] - a[0], p[1] - a[1])

  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))

  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy))
}
