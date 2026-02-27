#!/usr/bin/env python3
"""
Blender script to create a FULL HOUSE with multiple connected rooms.
Exports as GLTF for web-based 3D walkthrough.
"""

import bpy
import sys
import json
import math
import os
from random import uniform, choice

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for material in bpy.data.materials:
        bpy.data.materials.remove(material)
    for mesh in bpy.data.meshes:
        bpy.data.meshes.remove(mesh)

def create_pbr_material(name, color, roughness=0.5, metallic=0.0):
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
    return mat

def create_wood_material(name, color_base=(0.45, 0.28, 0.14, 1)):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    output = nodes.new('ShaderNodeOutputMaterial')
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    noise = nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 50
    color_ramp = nodes.new('ShaderNodeValToRGB')
    color_ramp.color_ramp.elements[0].color = color_base
    color_ramp.color_ramp.elements[1].color = (color_base[0]*1.2, color_base[1]*1.2, color_base[2]*1.1, 1)
    links.new(noise.outputs['Fac'], color_ramp.inputs['Fac'])
    links.new(color_ramp.outputs['Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = 0.35
    links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    return mat

def create_tile_material(name):
    return create_pbr_material(name, (0.9, 0.9, 0.88, 1), roughness=0.3)

def create_glass_material(name):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    output = nodes.new('ShaderNodeOutputMaterial')
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.9, 0.95, 1.0, 1)
    bsdf.inputs['Roughness'].default_value = 0.0
    if 'Transmission Weight' in bsdf.inputs:
        bsdf.inputs['Transmission Weight'].default_value = 0.95
    bsdf.inputs['IOR'].default_value = 1.45
    links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    return mat

# Material cache
materials = {}

def get_material(name, create_func, *args):
    if name not in materials:
        materials[name] = create_func(name, *args)
    return materials[name]

def get_floor_material(room_type):
    if room_type in ['bathroom', 'kitchen']:
        return get_material('TileFloor', create_tile_material)
    return get_material('WoodFloor', create_wood_material, (0.55, 0.35, 0.18, 1))

def get_wall_material():
    return get_material('WallPaint', create_pbr_material, (0.95, 0.93, 0.88, 1), 0.9)

class Room:
    def __init__(self, data, height=2.8):
        self.id = data.get('id', 'room')
        self.name = data.get('name', 'חדר')
        self.type = data.get('type', 'living')
        self.width = data.get('width', 4)
        self.length = data.get('length', 5)
        self.height = height
        self.pos = data.get('position', {'x': 0, 'y': 0})
        self.x = self.pos.get('x', 0)
        self.y = self.pos.get('y', 0)
        self.doors = data.get('doors', [])
        self.windows = data.get('windows', [])
        self.features = data.get('features', [])
    
    def world_pos(self, local_x, local_y, local_z=0):
        return (self.x + local_x, self.y + local_y, local_z)

def create_room_floor(room):
    bpy.ops.mesh.primitive_plane_add(size=1, location=room.world_pos(room.width/2, room.length/2, 0))
    floor = bpy.context.active_object
    floor.name = f"Floor_{room.id}"
    floor.scale = (room.width, room.length, 1)
    bpy.ops.object.transform_apply(scale=True)
    floor.data.materials.append(get_floor_material(room.type))
    return floor

def create_room_ceiling(room):
    bpy.ops.mesh.primitive_plane_add(size=1, location=room.world_pos(room.width/2, room.length/2, room.height))
    ceiling = bpy.context.active_object
    ceiling.name = f"Ceiling_{room.id}"
    ceiling.scale = (room.width, room.length, 1)
    ceiling.rotation_euler = (math.radians(180), 0, 0)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    ceiling.data.materials.append(get_material('CeilingPaint', create_pbr_material, (1, 1, 1, 1), 0.95))
    return ceiling

def get_door_openings(room, wall):
    """Get list of door openings on a wall"""
    openings = []
    for door in room.doors:
        if door.get('wall') == wall:
            pos = door.get('position', 0.5)
            openings.append({'pos': pos, 'width': 0.9, 'height': 2.1, 'type': 'door'})
    return openings

def get_window_openings(room, wall):
    """Get list of window openings on a wall"""
    openings = []
    for window in room.windows:
        if window.get('wall') == wall:
            pos = window.get('position', 0.5)
            width = window.get('width', 1.2)
            openings.append({'pos': pos, 'width': width, 'height': 1.4, 'bottom': 0.9, 'type': 'window'})
    return openings

def create_wall_with_openings(room, wall_name, start, end, openings, wall_mat):
    """Create a wall with door/window openings"""
    wall_thickness = 0.12
    height = room.height
    
    # Calculate wall direction and length
    dx = end[0] - start[0]
    dy = end[1] - start[1]
    wall_length = math.sqrt(dx*dx + dy*dy)
    
    if wall_length < 0.1:
        return []
    
    angle = math.atan2(dy, dx)
    center_x = (start[0] + end[0]) / 2
    center_y = (start[1] + end[1]) / 2
    
    objects = []
    
    if not openings:
        # Simple solid wall
        bpy.ops.mesh.primitive_cube_add(size=1, location=(center_x, center_y, height/2))
        wall = bpy.context.active_object
        wall.name = f"Wall_{room.id}_{wall_name}"
        wall.scale = (wall_length, wall_thickness, height)
        wall.rotation_euler = (0, 0, angle)
        bpy.ops.object.transform_apply(scale=True, rotation=True)
        wall.data.materials.append(wall_mat)
        objects.append(wall)
    else:
        # Wall with openings - create segments
        openings_sorted = sorted(openings, key=lambda o: o['pos'])
        
        segments = []
        last_end = 0
        
        for opening in openings_sorted:
            op_center = opening['pos'] * wall_length
            op_width = opening['width']
            op_start = max(0, op_center - op_width/2)
            op_end = min(wall_length, op_center + op_width/2)
            
            # Segment before opening
            if op_start > last_end + 0.1:
                segments.append({'start': last_end, 'end': op_start, 'full': True})
            
            # Above opening (for doors) or sides (simplified)
            if opening['type'] == 'door':
                # Wall above door
                door_top = opening.get('height', 2.1)
                if door_top < height:
                    segments.append({
                        'start': op_start, 'end': op_end, 
                        'z_start': door_top, 'z_end': height,
                        'full': False
                    })
            elif opening['type'] == 'window':
                # Wall below window
                win_bottom = opening.get('bottom', 0.9)
                win_top = win_bottom + opening.get('height', 1.4)
                if win_bottom > 0.1:
                    segments.append({
                        'start': op_start, 'end': op_end,
                        'z_start': 0, 'z_end': win_bottom,
                        'full': False
                    })
                if win_top < height - 0.1:
                    segments.append({
                        'start': op_start, 'end': op_end,
                        'z_start': win_top, 'z_end': height,
                        'full': False
                    })
            
            last_end = op_end
        
        # Final segment
        if last_end < wall_length - 0.1:
            segments.append({'start': last_end, 'end': wall_length, 'full': True})
        
        # Create wall segments
        for i, seg in enumerate(segments):
            seg_length = seg['end'] - seg['start']
            if seg_length < 0.05:
                continue
            
            seg_center = (seg['start'] + seg['end']) / 2
            
            # Convert to world coordinates
            t = seg_center / wall_length
            wx = start[0] + t * dx
            wy = start[1] + t * dy
            
            if seg.get('full', True):
                z_center = height / 2
                z_height = height
            else:
                z_start = seg.get('z_start', 0)
                z_end = seg.get('z_end', height)
                z_center = (z_start + z_end) / 2
                z_height = z_end - z_start
            
            bpy.ops.mesh.primitive_cube_add(size=1, location=(wx, wy, z_center))
            wall = bpy.context.active_object
            wall.name = f"Wall_{room.id}_{wall_name}_{i}"
            wall.scale = (seg_length, wall_thickness, z_height)
            wall.rotation_euler = (0, 0, angle)
            bpy.ops.object.transform_apply(scale=True, rotation=True)
            wall.data.materials.append(wall_mat)
            objects.append(wall)
    
    return objects

def create_room_walls(room, all_rooms):
    """Create walls for a room, with openings for doors and windows"""
    wall_mat = get_wall_material()
    objects = []
    
    # Calculate wall positions
    walls = {
        'front': (room.world_pos(0, 0), room.world_pos(room.width, 0)),
        'back': (room.world_pos(0, room.length), room.world_pos(room.width, room.length)),
        'left': (room.world_pos(0, 0), room.world_pos(0, room.length)),
        'right': (room.world_pos(room.width, 0), room.world_pos(room.width, room.length)),
    }
    
    for wall_name, (start, end) in walls.items():
        # Check if this wall is shared with another room (skip it)
        is_shared = False
        for other in all_rooms:
            if other.id == room.id:
                continue
            # Simple check: if rooms are adjacent, skip the shared wall
            if wall_name == 'right' and abs(other.x - (room.x + room.width)) < 0.2:
                if other.y < room.y + room.length and other.y + other.length > room.y:
                    is_shared = True
                    break
            elif wall_name == 'left' and abs((other.x + other.width) - room.x) < 0.2:
                if other.y < room.y + room.length and other.y + other.length > room.y:
                    is_shared = True
                    break
            elif wall_name == 'back' and abs(other.y - (room.y + room.length)) < 0.2:
                if other.x < room.x + room.width and other.x + other.width > room.x:
                    is_shared = True
                    break
            elif wall_name == 'front' and abs((other.y + other.length) - room.y) < 0.2:
                if other.x < room.x + room.width and other.x + other.width > room.x:
                    is_shared = True
                    break
        
        if is_shared:
            continue
        
        # Get openings for this wall
        openings = get_door_openings(room, wall_name) + get_window_openings(room, wall_name)
        
        wall_objs = create_wall_with_openings(room, wall_name, start, end, openings, wall_mat)
        objects.extend(wall_objs)
    
    return objects

def create_window(room, window_data, wall_name):
    """Create a window on a wall"""
    pos = window_data.get('position', 0.5)
    width = window_data.get('width', 1.2)
    height = window_data.get('height', 1.4)
    bottom = window_data.get('bottom', 0.9)
    
    frame_mat = get_material('WindowFrame', create_pbr_material, (0.15, 0.15, 0.15, 1), 0.3, 0.9)
    glass_mat = get_material('Glass', create_glass_material)
    
    # Calculate window position based on wall
    if wall_name == 'front':
        wx = room.x + pos * room.width
        wy = room.y + 0.06
        rotation = 0
    elif wall_name == 'back':
        wx = room.x + pos * room.width
        wy = room.y + room.length - 0.06
        rotation = math.radians(180)
    elif wall_name == 'left':
        wx = room.x + 0.06
        wy = room.y + pos * room.length
        rotation = math.radians(90)
    else:  # right
        wx = room.x + room.width - 0.06
        wy = room.y + pos * room.length
        rotation = math.radians(-90)
    
    wz = bottom + height/2
    
    # Glass
    bpy.ops.mesh.primitive_plane_add(size=1, location=(wx, wy, wz))
    glass = bpy.context.active_object
    glass.name = f"Glass_{room.id}_{wall_name}"
    glass.scale = (width - 0.1, 1, height - 0.1)
    glass.rotation_euler = (math.radians(90), 0, rotation)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    glass.data.materials.append(glass_mat)
    
    # Frame (simplified)
    frame_t = 0.04
    for offset, size in [(height/2, (width, frame_t)), (-height/2, (width, frame_t)),
                         (0, (frame_t, height))]:
        if isinstance(offset, tuple):
            continue
        # Top/bottom
        bpy.ops.mesh.primitive_cube_add(size=1, location=(wx, wy, wz + offset))
        f = bpy.context.active_object
        f.name = f"WindowFrame_{room.id}"
        f.scale = (size[0], frame_t, frame_t) if offset != 0 else (frame_t, frame_t, size[1])
        f.rotation_euler = (0, 0, rotation)
        bpy.ops.object.transform_apply(scale=True, rotation=True)
        f.data.materials.append(frame_mat)

def add_room_furniture(room):
    """Add appropriate furniture based on room type"""
    cx = room.x + room.width / 2
    cy = room.y + room.length / 2
    
    if room.type == 'living':
        add_sofa(room.x + room.width/2, room.y + 1.0)
        add_coffee_table(cx, cy - 0.3)
        add_rug(cx, cy, min(2.5, room.width - 1), min(1.8, room.length - 2))
        if room.width >= 3:
            add_floor_lamp(room.x + room.width - 0.4, room.y + 0.4)
        add_plant(room.x + 0.3, room.y + 0.3)
    
    elif room.type == 'bedroom':
        add_bed(cx, room.y + 1.2)
        add_nightstand(room.x + room.width - 0.5, room.y + 1.0)
        add_rug(cx, room.y + 1.5, min(2.0, room.width - 0.8), 1.2)
    
    elif room.type == 'kitchen':
        add_kitchen_counter(room)
    
    elif room.type == 'bathroom':
        add_bathroom_fixtures(room)

def add_sofa(x, y):
    mat = get_material('SofaFabric', create_pbr_material, (0.25, 0.28, 0.35, 1), 0.85)
    w, d, h = 2.0, 0.85, 0.4
    
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, h/2 + 0.1))
    base = bpy.context.active_object
    base.name = "SofaBase"
    base.scale = (w, d, h)
    bpy.ops.object.transform_apply(scale=True)
    base.data.materials.append(mat)
    
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y - d/2 + 0.1, h + 0.25))
    back = bpy.context.active_object
    back.name = "SofaBack"
    back.scale = (w - 0.3, 0.15, 0.45)
    bpy.ops.object.transform_apply(scale=True)
    back.data.materials.append(mat)

def add_coffee_table(x, y):
    mat = get_material('TableWood', create_wood_material, (0.4, 0.28, 0.18, 1))
    leg_mat = get_material('TableLeg', create_pbr_material, (0.1, 0.1, 0.1, 1), 0.3, 0.8)
    
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, 0.4))
    top = bpy.context.active_object
    top.name = "TableTop"
    top.scale = (1.0, 0.5, 0.04)
    bpy.ops.object.transform_apply(scale=True)
    top.data.materials.append(mat)
    
    for lx, ly in [(x-0.4, y-0.2), (x+0.4, y-0.2), (x-0.4, y+0.2), (x+0.4, y+0.2)]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.02, depth=0.38, location=(lx, ly, 0.19))
        leg = bpy.context.active_object
        leg.data.materials.append(leg_mat)

def add_floor_lamp(x, y):
    mat = get_material('LampBase', create_pbr_material, (0.15, 0.15, 0.15, 1), 0.3, 0.7)
    shade_mat = get_material('LampShade', create_pbr_material, (0.95, 0.92, 0.85, 1), 0.8)
    
    bpy.ops.mesh.primitive_cylinder_add(radius=0.15, depth=0.03, location=(x, y, 0.015))
    bpy.context.active_object.data.materials.append(mat)
    
    bpy.ops.mesh.primitive_cylinder_add(radius=0.015, depth=1.5, location=(x, y, 0.78))
    bpy.context.active_object.data.materials.append(mat)
    
    bpy.ops.mesh.primitive_cone_add(radius1=0.2, radius2=0.12, depth=0.25, location=(x, y, 1.65))
    bpy.context.active_object.data.materials.append(shade_mat)

def add_rug(x, y, w, l):
    mat = get_material('Rug', create_pbr_material, (0.4, 0.35, 0.3, 1), 0.95)
    bpy.ops.mesh.primitive_plane_add(size=1, location=(x, y, 0.005))
    rug = bpy.context.active_object
    rug.scale = (w, l, 1)
    bpy.ops.object.transform_apply(scale=True)
    rug.data.materials.append(mat)

def add_plant(x, y):
    pot_mat = get_material('Pot', create_pbr_material, (0.75, 0.72, 0.68, 1), 0.6)
    plant_mat = get_material('Plant', create_pbr_material, (0.2, 0.45, 0.2, 1), 0.8)
    
    bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.25, location=(x, y, 0.125))
    bpy.context.active_object.data.materials.append(pot_mat)
    
    for i in range(4):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=uniform(0.08, 0.12),
            location=(x + uniform(-0.06, 0.06), y + uniform(-0.06, 0.06), 0.35 + uniform(0, 0.15)))
        bpy.context.active_object.data.materials.append(plant_mat)

def add_bed(x, y):
    mat = get_material('BedFrame', create_wood_material, (0.35, 0.25, 0.15, 1))
    mattress_mat = get_material('Mattress', create_pbr_material, (0.95, 0.95, 0.95, 1), 0.9)
    
    # Frame
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, 0.2))
    frame = bpy.context.active_object
    frame.scale = (1.6, 2.0, 0.15)
    bpy.ops.object.transform_apply(scale=True)
    frame.data.materials.append(mat)
    
    # Mattress
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, 0.4))
    mattress = bpy.context.active_object
    mattress.scale = (1.5, 1.9, 0.25)
    bpy.ops.object.transform_apply(scale=True)
    mattress.data.materials.append(mattress_mat)
    
    # Headboard
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y - 0.95, 0.6))
    headboard = bpy.context.active_object
    headboard.scale = (1.6, 0.08, 0.7)
    bpy.ops.object.transform_apply(scale=True)
    headboard.data.materials.append(mat)

def add_nightstand(x, y):
    mat = get_material('NightstandWood', create_wood_material, (0.4, 0.3, 0.2, 1))
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, 0.3))
    ns = bpy.context.active_object
    ns.scale = (0.5, 0.4, 0.6)
    bpy.ops.object.transform_apply(scale=True)
    ns.data.materials.append(mat)

def add_kitchen_counter(room):
    mat = get_material('Counter', create_pbr_material, (0.85, 0.85, 0.83, 1), 0.3)
    base_mat = get_material('CounterBase', create_pbr_material, (0.3, 0.28, 0.25, 1), 0.5)
    
    # Counter along back wall
    cx = room.x + room.width / 2
    cy = room.y + 0.35
    
    bpy.ops.mesh.primitive_cube_add(size=1, location=(cx, cy, 0.45))
    base = bpy.context.active_object
    base.scale = (min(room.width - 0.4, 2.5), 0.6, 0.9)
    bpy.ops.object.transform_apply(scale=True)
    base.data.materials.append(base_mat)
    
    bpy.ops.mesh.primitive_cube_add(size=1, location=(cx, cy, 0.92))
    top = bpy.context.active_object
    top.scale = (min(room.width - 0.3, 2.6), 0.65, 0.04)
    bpy.ops.object.transform_apply(scale=True)
    top.data.materials.append(mat)

def add_bathroom_fixtures(room):
    white_mat = get_material('Porcelain', create_pbr_material, (0.98, 0.98, 0.98, 1), 0.1)
    
    # Toilet
    tx = room.x + 0.4
    ty = room.y + 0.4
    bpy.ops.mesh.primitive_cube_add(size=1, location=(tx, ty, 0.2))
    bpy.context.active_object.scale = (0.4, 0.5, 0.4)
    bpy.ops.object.transform_apply(scale=True)
    bpy.context.active_object.data.materials.append(white_mat)
    
    # Sink
    sx = room.x + room.width - 0.4
    sy = room.y + 0.35
    bpy.ops.mesh.primitive_cube_add(size=1, location=(sx, sy, 0.8))
    bpy.context.active_object.scale = (0.5, 0.4, 0.15)
    bpy.ops.object.transform_apply(scale=True)
    bpy.context.active_object.data.materials.append(white_mat)

def setup_lighting(rooms):
    # Calculate house bounds
    min_x = min(r.x for r in rooms)
    max_x = max(r.x + r.width for r in rooms)
    min_y = min(r.y for r in rooms)
    max_y = max(r.y + r.length for r in rooms)
    center_x = (min_x + max_x) / 2
    center_y = (min_y + max_y) / 2
    
    # Sun light
    bpy.ops.object.light_add(type='SUN', location=(center_x, min_y - 5, 5))
    sun = bpy.context.active_object
    sun.data.energy = 2.5
    sun.rotation_euler = (math.radians(55), 0, 0)
    
    # Ambient light
    bpy.ops.object.light_add(type='AREA', location=(center_x, center_y, 2.5))
    ambient = bpy.context.active_object
    ambient.data.energy = 100
    ambient.data.size = max(max_x - min_x, max_y - min_y)

def setup_world():
    world = bpy.data.worlds.new("World")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.6, 0.8, 1.0, 1)
    bg.inputs["Strength"].default_value = 0.3

def create_house(data, output_path):
    """Main function to create entire house"""
    clear_scene()
    
    rooms_data = data.get('rooms', [])
    if not rooms_data:
        # Fallback to single room
        rooms_data = [data]
    
    rooms = [Room(r) for r in rooms_data]
    
    print(f"Creating house with {len(rooms)} rooms:")
    for r in rooms:
        print(f"  - {r.name} ({r.type}): {r.width}x{r.length}m at ({r.x}, {r.y})")
    
    # Create each room
    for room in rooms:
        create_room_floor(room)
        create_room_ceiling(room)
        create_room_walls(room, rooms)
        
        # Windows
        for window in room.windows:
            wall = window.get('wall', 'front')
            create_window(room, window, wall)
        
        # Furniture
        add_room_furniture(room)
    
    # Lighting
    setup_lighting(rooms)
    setup_world()
    
    # Export
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        export_materials='EXPORT',
        export_cameras=False,
        export_lights=False,
        export_apply=True,
    )
    
    print(f"Exported to: {output_path}")

def main():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    
    if len(argv) < 2:
        print("Usage: blender --background --python render_house_gltf.py -- input.json output.glb")
        sys.exit(1)
    
    with open(argv[0], 'r') as f:
        data = json.load(f)
    
    create_house(data, argv[1])

if __name__ == "__main__":
    main()
