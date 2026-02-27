#!/usr/bin/env python3
"""
Blender script v2 - Fixed house generation with proper wall connections.
Key fix: Interior walls are created ONCE with door openings, not skipped.
"""

import bpy
import sys
import json
import math
from random import uniform

# ============= MATERIALS =============

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for material in bpy.data.materials:
        bpy.data.materials.remove(material)
    for mesh in bpy.data.meshes:
        bpy.data.meshes.remove(mesh)

materials_cache = {}

def get_or_create_material(name, color, roughness=0.5, metallic=0.0):
    if name in materials_cache:
        return materials_cache[name]
    
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    output = nodes.new('ShaderNodeOutputMaterial')
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = color
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
    links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    
    materials_cache[name] = mat
    return mat

# Standard materials
def wall_mat():
    return get_or_create_material('Wall', (0.95, 0.93, 0.88, 1), 0.9)

def floor_mat_wood():
    return get_or_create_material('WoodFloor', (0.55, 0.35, 0.18, 1), 0.4)

def floor_mat_tile():
    return get_or_create_material('TileFloor', (0.9, 0.9, 0.88, 1), 0.3)

def ceiling_mat():
    return get_or_create_material('Ceiling', (1, 1, 1, 1), 0.95)

# ============= ROOM CLASS =============

class Room:
    def __init__(self, data):
        self.id = data.get('id', 'room')
        self.name = data.get('name', 'Room')
        self.type = data.get('type', 'living')
        self.width = float(data.get('width', 4))
        self.length = float(data.get('length', 5))
        self.height = 2.8
        pos = data.get('position', {'x': 0, 'y': 0})
        self.x = float(pos.get('x', 0))
        self.y = float(pos.get('y', 0))
        self.doors = data.get('doors', [])
        self.windows = data.get('windows', [])
    
    @property
    def x2(self):
        return self.x + self.width
    
    @property
    def y2(self):
        return self.y + self.length
    
    @property
    def center(self):
        return (self.x + self.width/2, self.y + self.length/2)

# ============= GEOMETRY CREATION =============

def create_box(name, x, y, z, w, h, d, material):
    """Create a box at given position with given dimensions"""
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z))
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (w, d, h)
    bpy.ops.object.transform_apply(scale=True)
    obj.data.materials.append(material)
    return obj

def create_floor(room):
    """Create floor for a room"""
    mat = floor_mat_tile() if room.type in ['bathroom', 'kitchen'] else floor_mat_wood()
    cx, cy = room.center
    create_box(f"Floor_{room.id}", cx, cy, 0.01, room.width, 0.02, room.length, mat)

def create_ceiling(room):
    """Create ceiling for a room"""
    cx, cy = room.center
    create_box(f"Ceiling_{room.id}", cx, cy, room.height - 0.01, room.width, 0.02, room.length, ceiling_mat())

def create_wall_segment(name, x1, y1, x2, y2, z_bottom, z_top, thickness=0.12):
    """Create a wall segment between two points"""
    dx = x2 - x1
    dy = y2 - y1
    length = math.sqrt(dx*dx + dy*dy)
    
    if length < 0.05:
        return None
    
    angle = math.atan2(dy, dx)
    cx = (x1 + x2) / 2
    cy = (y1 + y2) / 2
    cz = (z_bottom + z_top) / 2
    height = z_top - z_bottom
    
    bpy.ops.mesh.primitive_cube_add(size=1, location=(cx, cy, cz))
    wall = bpy.context.active_object
    wall.name = name
    wall.scale = (length, thickness, height)
    wall.rotation_euler = (0, 0, angle)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    wall.data.materials.append(wall_mat())
    return wall

def create_wall_with_door(name, x1, y1, x2, y2, room_height, door_pos=0.5, door_width=0.9, door_height=2.1):
    """Create a wall with a door opening"""
    dx = x2 - x1
    dy = y2 - y1
    length = math.sqrt(dx*dx + dy*dy)
    
    if length < 0.05:
        return
    
    # Door position along wall (0 to length)
    door_center = door_pos * length
    door_start = max(0, door_center - door_width/2)
    door_end = min(length, door_center + door_width/2)
    
    # Calculate direction unit vector
    ux, uy = dx/length, dy/length
    
    # Wall segment before door
    if door_start > 0.1:
        seg_end = door_start
        seg_x2 = x1 + ux * seg_end
        seg_y2 = y1 + uy * seg_end
        create_wall_segment(f"{name}_L", x1, y1, seg_x2, seg_y2, 0, room_height)
    
    # Wall segment after door
    if door_end < length - 0.1:
        seg_start = door_end
        seg_x1 = x1 + ux * seg_start
        seg_y1 = y1 + uy * seg_start
        create_wall_segment(f"{name}_R", seg_x1, seg_y1, x2, y2, 0, room_height)
    
    # Wall above door
    if door_height < room_height - 0.1:
        above_x1 = x1 + ux * door_start
        above_y1 = y1 + uy * door_start
        above_x2 = x1 + ux * door_end
        above_y2 = y1 + uy * door_end
        create_wall_segment(f"{name}_T", above_x1, above_y1, above_x2, above_y2, door_height, room_height)

def create_wall_with_window(name, x1, y1, x2, y2, room_height, win_pos=0.5, win_width=1.2, win_bottom=0.9, win_height=1.4):
    """Create a wall with a window opening"""
    dx = x2 - x1
    dy = y2 - y1
    length = math.sqrt(dx*dx + dy*dy)
    
    if length < 0.05:
        return
    
    win_center = win_pos * length
    win_start = max(0, win_center - win_width/2)
    win_end = min(length, win_center + win_width/2)
    win_top = win_bottom + win_height
    
    ux, uy = dx/length, dy/length
    
    # Wall before window
    if win_start > 0.1:
        seg_x2 = x1 + ux * win_start
        seg_y2 = y1 + uy * win_start
        create_wall_segment(f"{name}_L", x1, y1, seg_x2, seg_y2, 0, room_height)
    
    # Wall after window
    if win_end < length - 0.1:
        seg_x1 = x1 + ux * win_end
        seg_y1 = y1 + uy * win_end
        create_wall_segment(f"{name}_R", seg_x1, seg_y1, x2, y2, 0, room_height)
    
    # Wall below window
    if win_bottom > 0.1:
        w_x1 = x1 + ux * win_start
        w_y1 = y1 + uy * win_start
        w_x2 = x1 + ux * win_end
        w_y2 = y1 + uy * win_end
        create_wall_segment(f"{name}_B", w_x1, w_y1, w_x2, w_y2, 0, win_bottom)
    
    # Wall above window
    if win_top < room_height - 0.1:
        w_x1 = x1 + ux * win_start
        w_y1 = y1 + uy * win_start
        w_x2 = x1 + ux * win_end
        w_y2 = y1 + uy * win_end
        create_wall_segment(f"{name}_T", w_x1, w_y1, w_x2, w_y2, win_top, room_height)

# ============= WALL LOGIC =============

def get_wall_coords(room, wall_name):
    """Get start and end coordinates for a wall"""
    if wall_name == 'front':
        return (room.x, room.y, room.x2, room.y)
    elif wall_name == 'back':
        return (room.x, room.y2, room.x2, room.y2)
    elif wall_name == 'left':
        return (room.x, room.y, room.x, room.y2)
    elif wall_name == 'right':
        return (room.x2, room.y, room.x2, room.y2)
    return None

def find_adjacent_room(room, wall_name, all_rooms):
    """Find if another room is adjacent on this wall"""
    tolerance = 0.3
    
    for other in all_rooms:
        if other.id == room.id:
            continue
        
        if wall_name == 'right':
            # Check if other room's left wall touches our right wall
            if abs(other.x - room.x2) < tolerance:
                # Check Y overlap
                if other.y < room.y2 and other.y2 > room.y:
                    return other
        
        elif wall_name == 'left':
            if abs(other.x2 - room.x) < tolerance:
                if other.y < room.y2 and other.y2 > room.y:
                    return other
        
        elif wall_name == 'back':
            if abs(other.y - room.y2) < tolerance:
                if other.x < room.x2 and other.x2 > room.x:
                    return other
        
        elif wall_name == 'front':
            if abs(other.y2 - room.y) < tolerance:
                if other.x < room.x2 and other.x2 > room.x:
                    return other
    
    return None

def get_door_on_wall(room, wall_name):
    """Get door info if there's a door on this wall"""
    for door in room.doors:
        if door.get('wall') == wall_name:
            return door
    return None

def get_window_on_wall(room, wall_name):
    """Get window info if there's a window on this wall"""
    for window in room.windows:
        if window.get('wall') == wall_name:
            return window
    return None

def create_room_walls(room, all_rooms, created_walls):
    """Create walls for a room, handling shared walls properly"""
    
    for wall_name in ['front', 'back', 'left', 'right']:
        coords = get_wall_coords(room, wall_name)
        if not coords:
            continue
        
        x1, y1, x2, y2 = coords
        
        # Create a unique key for this wall segment
        wall_key = tuple(sorted([(round(x1,1), round(y1,1)), (round(x2,1), round(y2,1))]))
        
        # Check if we already created this wall
        if wall_key in created_walls:
            continue
        
        adjacent = find_adjacent_room(room, wall_name, all_rooms)
        
        if adjacent:
            # Interior wall - create with door if exists
            # Mark as created so the other room doesn't create it too
            created_walls.add(wall_key)
            
            # Check for door from either room
            door = get_door_on_wall(room, wall_name)
            if not door:
                # Check opposite wall of adjacent room
                opposite = {'front': 'back', 'back': 'front', 'left': 'right', 'right': 'left'}
                door = get_door_on_wall(adjacent, opposite[wall_name])
            
            if door:
                create_wall_with_door(
                    f"Wall_{room.id}_{wall_name}",
                    x1, y1, x2, y2,
                    room.height,
                    door.get('position', 0.5),
                    door.get('width', 0.9),
                    door.get('height', 2.1)
                )
            else:
                # Shared wall without door - create solid wall
                create_wall_segment(f"Wall_{room.id}_{wall_name}", x1, y1, x2, y2, 0, room.height)
        else:
            # Exterior wall
            created_walls.add(wall_key)
            
            window = get_window_on_wall(room, wall_name)
            if window:
                create_wall_with_window(
                    f"Wall_{room.id}_{wall_name}",
                    x1, y1, x2, y2,
                    room.height,
                    window.get('position', 0.5),
                    window.get('width', 1.2),
                    window.get('bottom', 0.9),
                    window.get('height', 1.4)
                )
            else:
                create_wall_segment(f"Wall_{room.id}_{wall_name}", x1, y1, x2, y2, 0, room.height)

# ============= FURNITURE =============

def add_furniture(room):
    """Add basic furniture based on room type"""
    cx, cy = room.center
    
    if room.type == 'living':
        # Sofa
        sofa_mat = get_or_create_material('Sofa', (0.3, 0.3, 0.35, 1), 0.8)
        create_box("Sofa", cx, room.y + 1.0, 0.25, 1.8, 0.5, 0.8, sofa_mat)
        create_box("SofaBack", cx, room.y + 0.6, 0.5, 1.8, 0.4, 0.15, sofa_mat)
        
        # Coffee table
        table_mat = get_or_create_material('Table', (0.4, 0.28, 0.18, 1), 0.4)
        create_box("CoffeeTable", cx, cy, 0.35, 0.9, 0.06, 0.5, table_mat)
        
    elif room.type == 'bedroom':
        # Bed
        bed_mat = get_or_create_material('BedFrame', (0.35, 0.25, 0.15, 1), 0.5)
        mattress_mat = get_or_create_material('Mattress', (0.95, 0.95, 0.95, 1), 0.9)
        create_box("BedFrame", cx, room.y + 1.2, 0.15, 1.5, 0.2, 2.0, bed_mat)
        create_box("Mattress", cx, room.y + 1.2, 0.35, 1.4, 0.2, 1.9, mattress_mat)
        create_box("Headboard", cx, room.y + 0.15, 0.5, 1.5, 0.6, 0.08, bed_mat)
        
    elif room.type == 'kitchen':
        # Counter
        counter_mat = get_or_create_material('Counter', (0.85, 0.85, 0.83, 1), 0.3)
        base_mat = get_or_create_material('CounterBase', (0.3, 0.28, 0.25, 1), 0.5)
        counter_w = min(room.width - 0.4, 2.5)
        create_box("CounterBase", cx, room.y + 0.35, 0.45, counter_w, 0.9, 0.6, base_mat)
        create_box("CounterTop", cx, room.y + 0.35, 0.92, counter_w + 0.05, 0.04, 0.65, counter_mat)
        
    elif room.type == 'bathroom':
        # Toilet and sink
        white_mat = get_or_create_material('Porcelain', (0.98, 0.98, 0.98, 1), 0.1)
        create_box("Toilet", room.x + 0.4, room.y + 0.4, 0.2, 0.4, 0.4, 0.5, white_mat)
        create_box("Sink", room.x + room.width - 0.4, room.y + 0.35, 0.8, 0.5, 0.15, 0.4, white_mat)

# ============= LIGHTING =============

def setup_lighting(rooms):
    """Add lights to the scene"""
    if not rooms:
        return
    
    min_x = min(r.x for r in rooms)
    max_x = max(r.x2 for r in rooms)
    min_y = min(r.y for r in rooms)
    max_y = max(r.y2 for r in rooms)
    cx = (min_x + max_x) / 2
    cy = (min_y + max_y) / 2
    
    # Sun
    bpy.ops.object.light_add(type='SUN', location=(cx, min_y - 5, 5))
    sun = bpy.context.active_object
    sun.data.energy = 3
    sun.rotation_euler = (math.radians(60), 0, 0)
    
    # Area light for ambient
    bpy.ops.object.light_add(type='AREA', location=(cx, cy, 2.6))
    area = bpy.context.active_object
    area.data.energy = 150
    area.data.size = max(max_x - min_x, max_y - min_y)

def setup_world():
    """Set up world background"""
    world = bpy.data.worlds.new("World")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.6, 0.8, 1.0, 1)
    bg.inputs["Strength"].default_value = 0.3

# ============= MAIN =============

def create_house(data, output_path):
    """Main function - create the house and export"""
    clear_scene()
    
    rooms_data = data.get('rooms', [data])
    rooms = [Room(r) for r in rooms_data]
    
    print(f"\n=== Creating house with {len(rooms)} rooms ===")
    for r in rooms:
        print(f"  {r.id}: {r.name} ({r.type}) - {r.width}x{r.length}m at ({r.x}, {r.y})")
    
    # Track created walls to avoid duplicates
    created_walls = set()
    
    # Create each room
    for room in rooms:
        print(f"\nBuilding {room.id}...")
        create_floor(room)
        create_ceiling(room)
        create_room_walls(room, rooms, created_walls)
        add_furniture(room)
    
    # Lighting
    setup_lighting(rooms)
    setup_world()
    
    # Export
    print(f"\nExporting to {output_path}...")
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        export_materials='EXPORT',
        export_cameras=False,
        export_lights=False,
        export_apply=True,
    )
    print("Done!")

def main():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    
    if len(argv) < 2:
        print("Usage: blender --background --python render_house_v2.py -- input.json output.glb")
        sys.exit(1)
    
    with open(argv[0], 'r') as f:
        data = json.load(f)
    
    create_house(data, argv[1])

if __name__ == "__main__":
    main()
