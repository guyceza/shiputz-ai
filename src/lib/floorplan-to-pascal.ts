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

interface FurnitureItem {
  id: string; name: string; category: string;
  dimensions: [number, number, number];
  offset?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

function getFurnitureForRoom(roomType: string): FurnitureItem[] {
  const t = roomType.replace(/[_-]/g, ' ').trim()

  // Bedroom / חדר שינה
  if (/bedroom|חדר שינה|חד"ש|master/i.test(t)) return [
    { id: 'double-bed', name: 'Double Bed', category: 'furniture', dimensions: [1.6, 0.5, 2.0] },
    { id: 'bedside-table', name: 'Bedside Table', category: 'furniture', dimensions: [0.5, 0.5, 0.4] },
    { id: 'closet', name: 'Closet', category: 'furniture', dimensions: [1.2, 2.2, 0.6] },
  ]

  // Kids room / חדר ילדים
  if (/kids|children|ילדים|ילד/i.test(t)) return [
    { id: 'single-bed', name: 'Single Bed', category: 'furniture', dimensions: [0.9, 0.5, 2.0] },
    { id: 'bedside-table', name: 'Bedside Table', category: 'furniture', dimensions: [0.5, 0.5, 0.4] },
    { id: 'bookshelf', name: 'Bookshelf', category: 'furniture', dimensions: [0.8, 1.8, 0.3] },
  ]

  // Kitchen / מטבח
  if (/kitchen|מטבח/i.test(t)) return [
    { id: 'kitchen-counter', name: 'Kitchen Counter', category: 'kitchen', dimensions: [2, 0.9, 0.6] },
    { id: 'fridge', name: 'Fridge', category: 'kitchen', dimensions: [0.7, 1.8, 0.7] },
    { id: 'stove', name: 'Stove', category: 'kitchen', dimensions: [0.6, 0.9, 0.6] },
  ]

  // Bathroom / שירותים / אמבטיה
  if (/bath|שירות|אמבט|wc|toilet|מקלחת/i.test(t)) return [
    { id: 'toilet', name: 'Toilet', category: 'bathroom', dimensions: [0.4, 0.4, 0.7] },
    { id: 'shower-square', name: 'Shower', category: 'bathroom', dimensions: [0.9, 2.0, 0.9] },
    { id: 'bathroom-sink', name: 'Sink', category: 'bathroom', dimensions: [0.6, 0.8, 0.5] },
  ]

  // Living room / סלון
  if (/living|salon|lounge|סלון|מגורים|אורח/i.test(t)) return [
    { id: 'sofa', name: 'Sofa', category: 'furniture', dimensions: [2.0, 0.8, 0.9] },
    { id: 'coffee-table', name: 'Coffee Table', category: 'furniture', dimensions: [1.0, 0.45, 0.6] },
    { id: 'television', name: 'Television', category: 'appliance', dimensions: [1.2, 0.7, 0.1] },
  ]

  // Office / עבודה / משרד
  if (/office|work|עבודה|משרד|לימוד/i.test(t)) return [
    { id: 'office-table', name: 'Office Table', category: 'furniture', dimensions: [1.4, 0.75, 0.7] },
    { id: 'office-chair', name: 'Office Chair', category: 'furniture', dimensions: [0.6, 1.1, 0.6] },
    { id: 'bookshelf', name: 'Bookshelf', category: 'furniture', dimensions: [0.8, 1.8, 0.3] },
  ]

  // Dining / פינת אוכל
  if (/dining|אוכל|פינת/i.test(t)) return [
    { id: 'dining-table', name: 'Dining Table', category: 'furniture', dimensions: [1.6, 0.75, 0.9] },
    { id: 'dining-chair', name: 'Dining Chair', category: 'furniture', dimensions: [0.45, 0.9, 0.45] },
  ]

  // Laundry / כביסה
  if (/laundry|כביסה|שירות/i.test(t)) return [
    { id: 'washing-machine', name: 'Washing Machine', category: 'bathroom', dimensions: [0.6, 0.85, 0.6] },
  ]

  // Hall / מסדרון / כניסה
  if (/hall|entry|מסדרון|כניסה|פרוזדור/i.test(t)) return [
    { id: 'coat-rack', name: 'Coat Rack', category: 'furniture', dimensions: [0.4, 1.7, 0.4] },
  ]

  return []
}

export function floorplanToPascalScene(data: FloorplanData) {
  const nodes: Record<string, any> = {}

  const siteId = genId('site')
  const buildingId = genId('building')
  const levelId = genId('level')

  const wallIds: string[] = []
  const walls = Array.isArray(data.walls) ? data.walls : []

  // Create walls
  for (const wall of walls) {
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
      const nearest = findNearestWall(door.position, walls)
      if (!nearest) continue

      const wallId = wallIds[nearest.wallIdx]
      const w = walls[nearest.wallIdx]
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
      const nearest = findNearestWall(win.position, walls)
      if (!nearest) continue

      const wallId = wallIds[nearest.wallIdx]
      const w = walls[nearest.wallIdx]
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

  // Create furniture based on room types
  const itemIds: string[] = []
  if (data.rooms) {
    for (const room of data.rooms) {
      const roomType = (room.type || room.name || '').toLowerCase()
      const furniture = getFurnitureForRoom(roomType)
      if (!furniture.length || !room.polygon?.length) continue

      // Calculate room center from polygon
      const cx = room.polygon.reduce((s, p) => s + p[0], 0) / room.polygon.length
      const cy = room.polygon.reduce((s, p) => s + p[1], 0) / room.polygon.length

      // Calculate room bounds for spacing
      const minX = Math.min(...room.polygon.map(p => p[0]))
      const maxX = Math.max(...room.polygon.map(p => p[0]))
      const minY = Math.min(...room.polygon.map(p => p[1]))
      const maxY = Math.max(...room.polygon.map(p => p[1]))
      const roomW = maxX - minX
      const roomH = maxY - minY

      for (let fi = 0; fi < furniture.length; fi++) {
        const f = furniture[fi]
        // Spread items around the room center
        const angle = (fi / furniture.length) * Math.PI * 2
        const radius = Math.min(roomW, roomH) * 0.25
        const px = cx + Math.cos(angle) * radius
        const py = cy + Math.sin(angle) * radius

        const itemId = genId('item')
        itemIds.push(itemId)
        nodes[itemId] = {
          object: 'node', id: itemId, type: 'item',
          name: f.name,
          parentId: levelId, visible: true,
          position: [px, 0, py], // [x, y(height), z] — y=0 is floor
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          children: [],
          asset: {
            id: f.id,
            category: f.category,
            name: f.name,
            thumbnail: `/items/${f.id}/thumbnail.webp`,
            src: `/items/${f.id}/model.glb`,
            dimensions: f.dimensions,
            offset: f.offset || [0, 0, 0],
            rotation: f.rotation || [0, 0, 0],
            scale: f.scale || [1, 1, 1],
          },
          metadata: {},
        }
      }
    }
  }

  // Level — walls and items are direct children
  nodes[levelId] = {
    object: 'node', id: levelId, type: 'level',
    name: 'Level 0', parentId: buildingId, visible: true,
    children: [...wallIds, ...itemIds],
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
