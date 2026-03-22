/**
 * Converts Gemini floorplan analysis to Pascal Editor SceneGraph.
 * Uses the same node structure as Pascal's loadScene.
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
      object: 'node',
      id: wallId,
      type: 'wall',
      name: `Wall ${wallIds.length}`,
      parentId: levelId,
      visible: true,
      children: [],
      start: [wall.start[0], wall.start[1]],
      end: [wall.end[0], wall.end[1]],
      thickness: wall.thickness || 0.15,
      height: 2.8,
      frontSide: 'unknown',
      backSide: 'unknown',
      metadata: {},
    }
  }

  // Level
  nodes[levelId] = {
    object: 'node',
    id: levelId,
    type: 'level',
    name: 'Level 0',
    parentId: buildingId,
    visible: true,
    children: [...wallIds],
    elevation: 0,
    height: 2.8,
    level: 0,
    metadata: {},
  }

  // Building
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

  // Site
  nodes[siteId] = {
    object: 'node',
    id: siteId,
    type: 'site',
    name: 'Site',
    parentId: null,
    visible: true,
    children: [buildingId],
    boundary: [],
    metadata: {},
  }

  return {
    nodes,
    rootNodeIds: [siteId],
  }
}
