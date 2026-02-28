#!/usr/bin/env python3
"""
Blender script v3 - High Quality House Rendering
Features: Real doors, windows, detailed furniture, deck with pergola, bathroom fixtures, plants
"""

import bpy
import sys
import json
import math
from random import uniform, seed

seed(42)  # Reproducible randomness

# ============= CLEAR SCENE =============

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for material in bpy.data.materials:
        bpy.data.materials.remove(material)
    for mesh in bpy.data.meshes:
        bpy.data.meshes.remove(mesh)

# ============= MATERIALS =============

materials_cache = {}

def get_or_create_material(name, color, roughness=0.5, metallic=0.0, alpha=1.0):
    cache_key = f"{name}_{color}_{roughness}_{metallic}_{alpha}"
    if cache_key in materials_cache:
        return materials_cache[cache_key]
    
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    output = nodes.new('ShaderNodeOutputMaterial')
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (*color[:3], 1)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
    
    if alpha < 1.0:
        bsdf.inputs['Alpha'].default_value = alpha
        mat.blend_method = 'BLEND'
        mat.shadow_method = 'HASHED'
    
    links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    
    materials_cache[cache_key] = mat
    return mat

# Material library
def mat_wall():
    return get_or_create_material('Wall', (0.95, 0.93, 0.88), 0.9)

def mat_wall_exterior():
    return get_or_create_material('WallExterior', (0.92, 0.90, 0.85), 0.85)

def mat_wood_floor():
    return get_or_create_material('WoodFloor', (0.6, 0.4, 0.22), 0.4)

def mat_wood_dark():
    return get_or_create_material('WoodDark', (0.35, 0.22, 0.12), 0.4)

def mat_wood_light():
    return get_or_create_material('WoodLight', (0.7, 0.55, 0.35), 0.35)

def mat_deck_wood():
    return get_or_create_material('DeckWood', (0.5, 0.35, 0.2), 0.5)

def mat_tile_white():
    return get_or_create_material('TileWhite', (0.95, 0.95, 0.93), 0.15)

def mat_tile_beige():
    return get_or_create_material('TileBeige', (0.9, 0.85, 0.75), 0.2)

def mat_ceiling():
    return get_or_create_material('Ceiling', (1, 1, 1), 0.95)

def mat_glass():
    return get_or_create_material('Glass', (0.8, 0.9, 1.0), 0.05, 0.0, 0.3)

def mat_metal_chrome():
    return get_or_create_material('Chrome', (0.9, 0.9, 0.9), 0.1, 1.0)

def mat_metal_brass():
    return get_or_create_material('Brass', (0.85, 0.7, 0.3), 0.3, 0.9)

def mat_porcelain():
    return get_or_create_material('Porcelain', (0.98, 0.98, 0.98), 0.1)

def mat_fabric_white():
    return get_or_create_material('FabricWhite', (0.98, 0.96, 0.94), 0.9)

def mat_fabric_gray():
    return get_or_create_material('FabricGray', (0.45, 0.45, 0.48), 0.85)

def mat_fabric_blue():
    return get_or_create_material('FabricBlue', (0.4, 0.55, 0.7), 0.8)

def mat_fabric_beige():
    return get_or_create_material('FabricBeige', (0.85, 0.78, 0.65), 0.8)

def mat_leather_brown():
    return get_or_create_material('LeatherBrown', (0.4, 0.25, 0.15), 0.6)

def mat_plant_green():
    return get_or_create_material('PlantGreen', (0.2, 0.45, 0.15), 0.7)

def mat_pot_terracotta():
    return get_or_create_material('Terracotta', (0.75, 0.4, 0.25), 0.7)

def mat_rug_round():
    return get_or_create_material('RugBlue', (0.5, 0.65, 0.75), 0.95)

def mat_counter_marble():
    return get_or_create_material('Marble', (0.92, 0.9, 0.88), 0.2)

def mat_cabinet_wood():
    return get_or_create_material('CabinetWood', (0.4, 0.3, 0.2), 0.4)

def mat_umbrella():
    return get_or_create_material('Umbrella', (0.95, 0.95, 0.92), 0.8)

# ============= GEOMETRY HELPERS =============

def create_box(name, x, y, z, w, h, d, material):
    """Create a box at given center position"""
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z))
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (w, d, h)
    bpy.ops.object.transform_apply(scale=True)
    if material:
        obj.data.materials.append(material)
    return obj

def create_cylinder(name, x, y, z, radius, height, material=None, segments=32):
    """Create a cylinder"""
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=height, vertices=segments, location=(x, y, z))
    obj = bpy.context.active_object
    obj.name = name
    if material:
        obj.data.materials.append(material)
    return obj

def create_uv_sphere(name, x, y, z, radius, material, segments=16, rings=8):
    """Create a UV sphere (for plants, etc)"""
    bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, segments=segments, ring_count=rings, location=(x, y, z))
    obj = bpy.context.active_object
    obj.name = name
    if material:
        obj.data.materials.append(material)
    return obj

# ============= ROOM CLASS =============

class Room:
    def __init__(self, data):
        self.id = data.get('id', 'room')
        self.name = data.get('name', 'Room')
        self.type = data.get('type', 'living')
        self.width = float(data.get('width', 4))
        self.length = float(data.get('length', 5))
        self.height = float(data.get('height', 2.8)) if data.get('height', 2.8) > 0 else 2.8
        self.outdoor = data.get('outdoor', False)
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

# ============= FLOORS =============

def create_floor(room):
    """Create detailed floor for a room"""
    cx, cy = room.center
    
    if room.type in ['deck', 'balcony']:
        create_deck_floor(room)
        return
    
    if room.type in ['bathroom']:
        mat = mat_tile_white()
    elif room.type in ['kitchen']:
        mat = mat_tile_beige()
    else:
        mat = mat_wood_floor()
    
    # Main floor
    create_box(f"Floor_{room.id}", cx, cy, 0.01, room.width, 0.02, room.length, mat)
    
    # Add floor trim/baseboards
    if not room.outdoor:
        trim_h = 0.08
        trim_d = 0.015
        trim_mat = mat_wood_light()
        
        # Front and back
        create_box(f"Trim_{room.id}_F", cx, room.y + trim_d/2, trim_h/2, room.width, trim_h, trim_d, trim_mat)
        create_box(f"Trim_{room.id}_B", cx, room.y2 - trim_d/2, trim_h/2, room.width, trim_h, trim_d, trim_mat)
        # Left and right
        create_box(f"Trim_{room.id}_L", room.x + trim_d/2, cy, trim_h/2, trim_d, trim_h, room.length, trim_mat)
        create_box(f"Trim_{room.id}_R", room.x2 - trim_d/2, cy, trim_h/2, trim_d, trim_h, room.length, trim_mat)

def create_deck_floor(room):
    """Create wooden deck floor with planks"""
    plank_width = 0.15
    plank_gap = 0.01
    mat = mat_deck_wood()
    
    num_planks = int(room.length / (plank_width + plank_gap))
    
    for i in range(num_planks):
        y = room.y + 0.08 + i * (plank_width + plank_gap)
        create_box(
            f"DeckPlank_{room.id}_{i}",
            room.x + room.width/2, y, 0.02,
            room.width - 0.1, 0.025, plank_width,
            mat
        )

def create_ceiling(room, skip_ceilings=False):
    """Create ceiling for a room"""
    if room.outdoor or room.type in ['deck', 'balcony'] or skip_ceilings:
        return
    cx, cy = room.center
    create_box(f"Ceiling_{room.id}", cx, cy, room.height - 0.01, room.width, 0.02, room.length, mat_ceiling())

# ============= WALLS =============

def create_wall_segment(name, x1, y1, x2, y2, z_bottom, z_top, thickness=0.12, exterior=False, z_offset=0):
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
    
    mat = mat_wall_exterior() if exterior else mat_wall()
    wall.data.materials.append(mat)
    return wall

def create_wall_with_opening_bmesh(name, x1, y1, x2, y2, wall_height, opening_start, opening_end, opening_bottom, opening_top, thickness=0.12, exterior=False):
    """
    Create a single wall mesh with an opening (door or window) using BMesh.
    This prevents Z-fighting by creating ONE continuous mesh instead of multiple cubes.
    
    Parameters:
    - opening_start/end: distance along wall (0 to length)
    - opening_bottom/top: Z coordinates of opening
    """
    import bmesh
    
    dx = x2 - x1
    dy = y2 - y1
    length = math.sqrt(dx*dx + dy*dy)
    
    if length < 0.05:
        return None
    
    # Normalized direction and perpendicular
    ux, uy = dx/length, dy/length
    px, py = -uy * thickness/2, ux * thickness/2
    
    # Create BMesh
    bm = bmesh.new()
    
    # Wall vertices (in local 2D space, we'll transform later)
    # The wall is a flat rectangle with a rectangular hole
    # We need 8 outer vertices + 4 inner vertices for the opening
    
    # Outer rectangle corners (on the XZ plane, we'll rotate to world space)
    # Using length along X, height along Z
    h = wall_height
    
    # Outer vertices (front face) - counter-clockwise from bottom-left
    # 0: bottom-left, 1: bottom-right, 2: top-right, 3: top-left
    # Plus vertices at opening boundaries
    
    # For a wall with opening, we create vertices at:
    # Bottom edge: 0, opening_start, opening_end, length
    # At opening_bottom: opening_start, opening_end
    # At opening_top: opening_start, opening_end  
    # Top edge: 0, length (we can skip intermediate if opening doesn't touch)
    
    # Simplify: create the wall profile as a 2D shape with hole, then extrude
    
    # Front face vertices (x=length coord, z=height coord)
    verts_front = []
    verts_back = []
    
    # Create outer boundary vertices (CCW)
    outer_coords = [
        (0, 0),  # 0
        (length, 0),  # 1
        (length, h),  # 2
        (0, h),  # 3
    ]
    
    # Create opening boundary vertices (CW for hole)
    inner_coords = [
        (opening_start, opening_bottom),  # 4
        (opening_end, opening_bottom),  # 5
        (opening_end, opening_top),  # 6
        (opening_start, opening_top),  # 7
    ]
    
    # Transform to world coordinates
    def local_to_world(lx, lz, back=False):
        """Convert local (length, height) to world (x, y, z)"""
        # Position along the wall
        wx = x1 + ux * lx
        wy = y1 + uy * lx
        # Offset perpendicular for thickness
        if back:
            wx -= px * 2
            wy -= py * 2
        else:
            wx += px * 2
            wy += py * 2
        return (wx, wy, lz)
    
    # Create vertices
    for lx, lz in outer_coords:
        verts_front.append(bm.verts.new(local_to_world(lx, lz, False)))
    for lx, lz in inner_coords:
        verts_front.append(bm.verts.new(local_to_world(lx, lz, False)))
    
    for lx, lz in outer_coords:
        verts_back.append(bm.verts.new(local_to_world(lx, lz, True)))
    for lx, lz in inner_coords:
        verts_back.append(bm.verts.new(local_to_world(lx, lz, True)))
    
    bm.verts.ensure_lookup_table()
    
    # Front face indices: 0-3 outer, 4-7 inner (hole)
    # We need to create faces around the hole
    # Split into regions: bottom, right, top, left of opening
    
    # Create faces for front side (with hole)
    # Bottom region: from y=0 to y=opening_bottom, full width
    # But we need proper triangulation. Let's use a simpler approach:
    # Create the 4 regions around the opening as quads
    
    # Actually, for clean geometry, let's add more vertices to make proper quads
    # Let's restart with a cleaner approach: 12 vertices per side
    
    bm.free()
    bm = bmesh.new()
    
    # Vertices layout (front face, looking at -Y):
    #  11----10-----9-----8
    #  |                  |
    #  0     7-----6      |
    #  |     |     |      |
    #  |     4-----5      |
    #  |                  |
    #  1-----2-----3------4... wait this is confusing
    
    # Simpler: create 16 vertices (8 for outer+inner connections, 4 for opening)
    # Let me use a cleaner grid approach
    
    # X positions: 0, opening_start, opening_end, length
    # Z positions: 0, opening_bottom, opening_top, wall_height
    
    x_coords = [0, opening_start, opening_end, length]
    z_coords = [0, opening_bottom, opening_top, h]
    
    # Create grid of vertices (4x4 = 16 per side)
    front_grid = {}
    back_grid = {}
    
    for i, lx in enumerate(x_coords):
        for j, lz in enumerate(z_coords):
            # Front
            wx = x1 + ux * lx + px
            wy = y1 + uy * lx + py
            front_grid[(i, j)] = bm.verts.new((wx, wy, lz))
            
            # Back
            wx = x1 + ux * lx - px
            wy = y1 + uy * lx - py
            back_grid[(i, j)] = bm.verts.new((wx, wy, lz))
    
    bm.verts.ensure_lookup_table()
    
    # Create faces
    # Front face - 9 quads minus the center one (opening)
    for i in range(3):
        for j in range(3):
            # Skip the opening (i=1, j=1)
            if i == 1 and j == 1:
                continue
            
            v1 = front_grid[(i, j)]
            v2 = front_grid[(i+1, j)]
            v3 = front_grid[(i+1, j+1)]
            v4 = front_grid[(i, j+1)]
            bm.faces.new([v1, v2, v3, v4])
    
    # Back face - same but reversed winding
    for i in range(3):
        for j in range(3):
            if i == 1 and j == 1:
                continue
            
            v1 = back_grid[(i, j)]
            v2 = back_grid[(i+1, j)]
            v3 = back_grid[(i+1, j+1)]
            v4 = back_grid[(i, j+1)]
            bm.faces.new([v4, v3, v2, v1])  # Reversed
    
    # Side faces (left and right edges of wall)
    # Left edge (i=0)
    for j in range(3):
        v1 = front_grid[(0, j)]
        v2 = front_grid[(0, j+1)]
        v3 = back_grid[(0, j+1)]
        v4 = back_grid[(0, j)]
        bm.faces.new([v1, v4, v3, v2])
    
    # Right edge (i=3)
    for j in range(3):
        v1 = front_grid[(3, j)]
        v2 = front_grid[(3, j+1)]
        v3 = back_grid[(3, j+1)]
        v4 = back_grid[(3, j)]
        bm.faces.new([v2, v3, v4, v1])
    
    # Top edge (j=3)
    for i in range(3):
        v1 = front_grid[(i, 3)]
        v2 = front_grid[(i+1, 3)]
        v3 = back_grid[(i+1, 3)]
        v4 = back_grid[(i, 3)]
        bm.faces.new([v1, v2, v3, v4])
    
    # Bottom edge (j=0)
    for i in range(3):
        v1 = front_grid[(i, 0)]
        v2 = front_grid[(i+1, 0)]
        v3 = back_grid[(i+1, 0)]
        v4 = back_grid[(i, 0)]
        bm.faces.new([v2, v1, v4, v3])
    
    # Opening interior faces (the "tunnel" through the wall)
    # Bottom of opening (j=1)
    v1 = front_grid[(1, 1)]
    v2 = front_grid[(2, 1)]
    v3 = back_grid[(2, 1)]
    v4 = back_grid[(1, 1)]
    bm.faces.new([v2, v1, v4, v3])
    
    # Top of opening (j=2)
    v1 = front_grid[(1, 2)]
    v2 = front_grid[(2, 2)]
    v3 = back_grid[(2, 2)]
    v4 = back_grid[(1, 2)]
    bm.faces.new([v1, v2, v3, v4])
    
    # Left of opening (i=1)
    v1 = front_grid[(1, 1)]
    v2 = front_grid[(1, 2)]
    v3 = back_grid[(1, 2)]
    v4 = back_grid[(1, 1)]
    bm.faces.new([v1, v2, v3, v4])
    
    # Right of opening (i=2)
    v1 = front_grid[(2, 1)]
    v2 = front_grid[(2, 2)]
    v3 = back_grid[(2, 2)]
    v4 = back_grid[(2, 1)]
    bm.faces.new([v2, v1, v4, v3])
    
    # Create mesh and object
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    
    # Apply material
    mat = mat_wall_exterior() if exterior else mat_wall()
    obj.data.materials.append(mat)
    
    # Recalculate normals
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode='OBJECT')
    
    return obj

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
            if abs(other.x - room.x2) < tolerance:
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
    for door in room.doors:
        if door.get('wall') == wall_name:
            return door
    return None

def get_window_on_wall(room, wall_name):
    for window in room.windows:
        if window.get('wall') == wall_name:
            return window
    return None

def create_wall_with_door(name, x1, y1, x2, y2, room_height, door_pos=0.5, door_width=0.9, door_height=2.1, door_type='standard'):
    """Create a wall with a door opening using single BMesh (no Z-fighting)"""
    dx = x2 - x1
    dy = y2 - y1
    length = math.sqrt(dx*dx + dy*dy)
    
    if length < 0.05:
        return
    
    door_center = door_pos * length
    door_start = max(0.05, door_center - door_width/2)
    door_end = min(length - 0.05, door_center + door_width/2)
    actual_door_width = door_end - door_start
    
    # Create single wall mesh with door opening
    create_wall_with_opening_bmesh(
        name, x1, y1, x2, y2, room_height,
        opening_start=door_start,
        opening_end=door_end,
        opening_bottom=0,
        opening_top=min(door_height, room_height - 0.1),
        exterior=False
    )
    
    # Create actual door
    ux, uy = dx/length, dy/length
    door_cx = x1 + ux * door_center
    door_cy = y1 + uy * door_center
    angle = math.atan2(dy, dx)
    
    if door_type == 'sliding_glass':
        create_sliding_glass_door(f"Door_{name}", door_cx, door_cy, actual_door_width, door_height, angle)
    else:
        create_hinged_door(f"Door_{name}", door_cx, door_cy, actual_door_width, door_height, angle)

def create_hinged_door(name, cx, cy, width, height, angle):
    """Create a hinged door with frame"""
    frame_w = 0.06
    frame_d = 0.1
    mat_frame = mat_wood_dark()
    mat_door = mat_wood_light()
    
    # Direction vectors
    cos_a = math.cos(angle)
    sin_a = math.sin(angle)
    
    # Frame left (perpendicular offset from center)
    left_offset = -width/2 + frame_w/2
    frame_lx = cx + cos_a * left_offset
    frame_ly = cy + sin_a * left_offset
    
    bpy.ops.mesh.primitive_cube_add(size=1, location=(frame_lx, frame_ly, height/2))
    fl = bpy.context.active_object
    fl.name = f"{name}_FrameL"
    fl.scale = (frame_w, frame_d, height)
    fl.rotation_euler = (0, 0, angle)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    fl.data.materials.append(mat_frame)
    
    # Frame right
    right_offset = width/2 - frame_w/2
    frame_rx = cx + cos_a * right_offset
    frame_ry = cy + sin_a * right_offset
    
    bpy.ops.mesh.primitive_cube_add(size=1, location=(frame_rx, frame_ry, height/2))
    fr = bpy.context.active_object
    fr.name = f"{name}_FrameR"
    fr.scale = (frame_w, frame_d, height)
    fr.rotation_euler = (0, 0, angle)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    fr.data.materials.append(mat_frame)
    
    # Frame top
    bpy.ops.mesh.primitive_cube_add(size=1, location=(cx, cy, height - frame_w/2))
    ft = bpy.context.active_object
    ft.name = f"{name}_FrameT"
    ft.scale = (width, frame_d, frame_w)
    ft.rotation_euler = (0, 0, angle)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    ft.data.materials.append(mat_frame)
    
    # Door panel (slightly open - 15 degrees)
    door_panel_width = width - 2*frame_w - 0.02
    door_open_angle = angle + math.radians(15)
    
    # Door pivot is at left frame
    pivot_offset = -width/2 + frame_w + door_panel_width/2
    # When door opens, it rotates around left edge
    door_cx = cx + cos_a * (-width/2 + frame_w) + math.cos(door_open_angle) * door_panel_width/2
    door_cy = cy + sin_a * (-width/2 + frame_w) + math.sin(door_open_angle) * door_panel_width/2
    
    bpy.ops.mesh.primitive_cube_add(size=1, location=(door_cx, door_cy, height/2 - 0.02))
    door = bpy.context.active_object
    door.name = f"{name}_Panel"
    door.scale = (door_panel_width, 0.04, height - frame_w - 0.02)
    door.rotation_euler = (0, 0, door_open_angle)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    door.data.materials.append(mat_door)
    
    # Door handle
    handle_offset = door_panel_width/2 - 0.08
    handle_x = door_cx + math.cos(door_open_angle) * handle_offset
    handle_y = door_cy + math.sin(door_open_angle) * handle_offset
    
    create_cylinder(f"{name}_Handle", handle_x, handle_y, 1.0, 0.015, 0.1, mat_metal_brass())

def create_sliding_glass_door(name, cx, cy, width, height, angle):
    """Create a sliding glass door"""
    frame_thickness = 0.04
    mat_frame = mat_metal_chrome()
    mat_g = mat_glass()
    
    # Frame
    # Left
    bpy.ops.mesh.primitive_cube_add(size=1, location=(cx - width/2 + 0.02, cy, height/2))
    frame_l = bpy.context.active_object
    frame_l.scale = (0.04, frame_thickness, height)
    frame_l.rotation_euler = (0, 0, angle)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    frame_l.data.materials.append(mat_frame)
    
    # Right
    bpy.ops.mesh.primitive_cube_add(size=1, location=(cx + width/2 - 0.02, cy, height/2))
    frame_r = bpy.context.active_object
    frame_r.scale = (0.04, frame_thickness, height)
    frame_r.rotation_euler = (0, 0, angle)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    frame_r.data.materials.append(mat_frame)
    
    # Top
    bpy.ops.mesh.primitive_cube_add(size=1, location=(cx, cy, height - 0.02))
    frame_t = bpy.context.active_object
    frame_t.scale = (width, frame_thickness, 0.04)
    frame_t.rotation_euler = (0, 0, angle)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    frame_t.data.materials.append(mat_frame)
    
    # Glass panels (2 panels)
    panel_width = (width - 0.08) / 2
    for i, offset in enumerate([-panel_width/2 - 0.01, panel_width/2 + 0.01]):
        glass_x = cx + math.cos(angle) * offset
        glass_y = cy + math.sin(angle) * offset
        bpy.ops.mesh.primitive_cube_add(size=1, location=(glass_x, glass_y, height/2))
        glass = bpy.context.active_object
        glass.name = f"{name}_Glass{i}"
        glass.scale = (panel_width, 0.01, height - 0.06)
        glass.rotation_euler = (0, 0, angle)
        bpy.ops.object.transform_apply(scale=True, rotation=True)
        glass.data.materials.append(mat_g)

def create_wall_with_window(name, x1, y1, x2, y2, room_height, win_pos=0.5, win_width=1.2, win_bottom=0.9, win_height=1.4):
    """Create a wall with a window opening using single BMesh (no Z-fighting)"""
    dx = x2 - x1
    dy = y2 - y1
    length = math.sqrt(dx*dx + dy*dy)
    
    if length < 0.05:
        return
    
    win_center = win_pos * length
    win_start = max(0.05, win_center - win_width/2)
    win_end = min(length - 0.05, win_center + win_width/2)
    win_top = min(win_bottom + win_height, room_height - 0.05)
    actual_win_width = win_end - win_start
    
    # Create single wall mesh with window opening
    create_wall_with_opening_bmesh(
        name, x1, y1, x2, y2, room_height,
        opening_start=win_start,
        opening_end=win_end,
        opening_bottom=max(0.05, win_bottom),
        opening_top=win_top,
        exterior=True
    )
    
    # Create actual window
    ux, uy = dx/length, dy/length
    win_cx = x1 + ux * win_center
    win_cy = y1 + uy * win_center
    angle = math.atan2(dy, dx)
    create_window(f"Win_{name}", win_cx, win_cy, actual_win_width, win_height, win_bottom, angle)

def create_window(name, cx, cy, width, height, bottom, angle):
    """Create window with frame using correct rotation"""
    mat_frame = mat_wood_light()
    mat_g = mat_glass()
    frame_w = 0.05
    frame_d = 0.08
    
    cz = bottom + height/2
    
    # Direction vectors
    cos_a = math.cos(angle)
    sin_a = math.sin(angle)
    
    # Frame - Left
    left_offset = -width/2 + frame_w/2
    frame_lx = cx + cos_a * left_offset
    frame_ly = cy + sin_a * left_offset
    
    bpy.ops.mesh.primitive_cube_add(size=1, location=(frame_lx, frame_ly, cz))
    fl = bpy.context.active_object
    fl.name = f"{name}_FrameL"
    fl.scale = (frame_w, frame_d, height)
    fl.rotation_euler = (0, 0, angle)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    fl.data.materials.append(mat_frame)
    
    # Frame - Right
    right_offset = width/2 - frame_w/2
    frame_rx = cx + cos_a * right_offset
    frame_ry = cy + sin_a * right_offset
    
    bpy.ops.mesh.primitive_cube_add(size=1, location=(frame_rx, frame_ry, cz))
    fr = bpy.context.active_object
    fr.name = f"{name}_FrameR"
    fr.scale = (frame_w, frame_d, height)
    fr.rotation_euler = (0, 0, angle)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    fr.data.materials.append(mat_frame)
    
    # Frame - Top
    bpy.ops.mesh.primitive_cube_add(size=1, location=(cx, cy, bottom + height - frame_w/2))
    ft = bpy.context.active_object
    ft.name = f"{name}_FrameT"
    ft.scale = (width - 2*frame_w, frame_d, frame_w)
    ft.rotation_euler = (0, 0, angle)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    ft.data.materials.append(mat_frame)
    
    # Frame - Bottom (sill - wider)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(cx, cy, bottom + frame_w/2))
    fb = bpy.context.active_object
    fb.name = f"{name}_Sill"
    fb.scale = (width + 0.04, 0.12, frame_w)
    fb.rotation_euler = (0, 0, angle)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    fb.data.materials.append(mat_frame)
    
    # Glass pane (single, simpler)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(cx, cy, cz))
    g = bpy.context.active_object
    g.name = f"{name}_Glass"
    g.scale = (width - 2*frame_w - 0.02, 0.01, height - 2*frame_w - 0.02)
    g.rotation_euler = (0, 0, angle)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    g.data.materials.append(mat_g)

def create_room_walls(room, all_rooms, created_walls):
    """Create walls for a room, handling shared walls properly"""
    if room.outdoor or room.type in ['deck', 'balcony']:
        return
    
    for wall_name in ['front', 'back', 'left', 'right']:
        coords = get_wall_coords(room, wall_name)
        if not coords:
            continue
        
        x1, y1, x2, y2 = coords
        wall_key = tuple(sorted([(round(x1,1), round(y1,1)), (round(x2,1), round(y2,1))]))
        
        if wall_key in created_walls:
            continue
        
        adjacent = find_adjacent_room(room, wall_name, all_rooms)
        
        if adjacent and not adjacent.outdoor:
            created_walls.add(wall_key)
            
            door = get_door_on_wall(room, wall_name)
            if not door:
                opposite = {'front': 'back', 'back': 'front', 'left': 'right', 'right': 'left'}
                door = get_door_on_wall(adjacent, opposite[wall_name])
            
            if door:
                create_wall_with_door(
                    f"Wall_{room.id}_{wall_name}",
                    x1, y1, x2, y2,
                    room.height,
                    door.get('position', 0.5),
                    door.get('width', 0.9),
                    door.get('height', 2.1),
                    door.get('type', 'standard')
                )
            else:
                create_wall_segment(f"Wall_{room.id}_{wall_name}", x1, y1, x2, y2, 0, room.height)
        else:
            created_walls.add(wall_key)
            
            window = get_window_on_wall(room, wall_name)
            door = get_door_on_wall(room, wall_name)
            
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
            elif door:
                create_wall_with_door(
                    f"Wall_{room.id}_{wall_name}",
                    x1, y1, x2, y2,
                    room.height,
                    door.get('position', 0.5),
                    door.get('width', 0.9),
                    door.get('height', 2.1),
                    door.get('type', 'standard')
                )
            else:
                create_wall_segment(f"Wall_{room.id}_{wall_name}", x1, y1, x2, y2, 0, room.height, exterior=True)

# ============= FURNITURE =============

def add_furniture(room):
    """Add detailed furniture based on room type"""
    cx, cy = room.center
    
    if room.type == 'living':
        add_living_room_furniture(room)
    elif room.type == 'bedroom':
        add_bedroom_furniture(room)
    elif room.type == 'bathroom':
        add_bathroom_fixtures(room)
    elif room.type == 'kitchen':
        add_kitchen_furniture(room)
    elif room.type in ['deck', 'balcony']:
        add_deck_furniture(room)
    elif room.type == 'hallway':
        pass  # Usually empty
    elif room.type == 'stairs':
        add_stairs(room)

def add_living_room_furniture(room):
    """Add living room furniture: sofa, coffee table, rug, plant"""
    cx, cy = room.center
    
    # L-shaped sofa
    create_sofa(cx - 0.3, room.y + 1.2, 2.2, 0.9)
    
    # Coffee table
    table_mat = mat_wood_light()
    create_box("CoffeeTable", cx, cy, 0.35, 0.9, 0.06, 0.5, table_mat)
    # Table legs
    for dx, dy in [(-0.35, -0.2), (0.35, -0.2), (-0.35, 0.2), (0.35, 0.2)]:
        create_box(f"TableLeg", cx + dx, cy + dy, 0.16, 0.04, 0.32, 0.04, table_mat)
    
    # Round rug
    create_cylinder("Rug", cx, cy, 0.01, 1.2, 0.02, mat_rug_round(), 48)
    
    # Plant in corner
    create_potted_plant(room.x + 0.5, room.y2 - 0.5, 0.8)

def create_sofa(x, y, width, depth):
    """Create a detailed sofa"""
    mat_seat = mat_fabric_gray()
    mat_cushion = mat_fabric_blue()
    
    # Base/seat
    create_box("SofaBase", x, y, 0.2, width, 0.4, depth, mat_seat)
    
    # Back
    create_box("SofaBack", x, y - depth/2 + 0.1, 0.5, width, 0.5, 0.2, mat_seat)
    
    # Arms
    create_box("SofaArmL", x - width/2 + 0.1, y, 0.35, 0.2, 0.35, depth, mat_seat)
    create_box("SofaArmR", x + width/2 - 0.1, y, 0.35, 0.2, 0.35, depth, mat_seat)
    
    # Seat cushions
    cushion_w = (width - 0.4) / 3
    for i in range(3):
        cx = x - width/2 + 0.2 + cushion_w/2 + i * cushion_w
        create_box(f"SofaCushion{i}", cx, y + 0.05, 0.45, cushion_w - 0.02, 0.1, depth - 0.25, mat_cushion)
    
    # Back cushions
    for i in range(3):
        cx = x - width/2 + 0.2 + cushion_w/2 + i * cushion_w
        create_box(f"SofaBackCushion{i}", cx, y - depth/2 + 0.2, 0.6, cushion_w - 0.05, 0.3, 0.15, mat_cushion)

def add_bedroom_furniture(room):
    """Add bedroom furniture: bed with pillows, nightstands"""
    cx, cy = room.center
    
    # Bed
    create_bed(cx, room.y + room.length * 0.4, 1.6, 2.0)
    
    # Nightstands
    ns_mat = mat_wood_dark()
    for side in [-1, 1]:
        ns_x = cx + side * 1.0
        ns_y = room.y + 0.6
        create_box(f"Nightstand", ns_x, ns_y, 0.25, 0.4, 0.5, 0.4, ns_mat)
        # Drawer handle
        create_box(f"NSHandle", ns_x, ns_y + 0.21, 0.3, 0.1, 0.02, 0.02, mat_metal_brass())

def create_bed(x, y, width, length):
    """Create a detailed bed with mattress, pillows, and blanket"""
    mat_frame = mat_wood_dark()
    mat_mattress = mat_fabric_white()
    mat_pillow = mat_fabric_white()
    mat_blanket = mat_fabric_beige()
    
    # Frame
    create_box("BedFrame", x, y, 0.15, width + 0.1, 0.3, length + 0.1, mat_frame)
    
    # Headboard
    create_box("Headboard", x, y - length/2 + 0.05, 0.7, width + 0.1, 0.9, 0.08, mat_frame)
    
    # Footboard
    create_box("Footboard", x, y + length/2 - 0.05, 0.35, width + 0.1, 0.3, 0.06, mat_frame)
    
    # Mattress
    create_box("Mattress", x, y, 0.4, width - 0.05, 0.2, length - 0.15, mat_mattress)
    
    # Pillows
    for side in [-1, 1]:
        px = x + side * 0.35
        # Pillow shape (flattened)
        bpy.ops.mesh.primitive_cube_add(size=1, location=(px, y - length/2 + 0.4, 0.55))
        pillow = bpy.context.active_object
        pillow.scale = (0.5, 0.08, 0.35)
        bpy.ops.object.transform_apply(scale=True)
        pillow.data.materials.append(mat_pillow)
    
    # Blanket/duvet (covering lower 2/3)
    create_box("Blanket", x, y + 0.25, 0.55, width - 0.1, 0.12, length * 0.55, mat_blanket)

def add_bathroom_fixtures(room):
    """Add bathroom fixtures: toilet, sink, bathtub/shower"""
    mat_p = mat_porcelain()
    mat_chrome = mat_metal_chrome()
    
    # Position based on room size
    # Toilet
    toilet_x = room.x + 0.4
    toilet_y = room.y + 0.5
    
    # Bowl
    create_cylinder("ToiletBowl", toilet_x, toilet_y, 0.2, 0.2, 0.4, mat_p, 24)
    # Tank
    create_box("ToiletTank", toilet_x, toilet_y - 0.25, 0.35, 0.35, 0.35, 0.15, mat_p)
    # Seat
    create_cylinder("ToiletSeat", toilet_x, toilet_y + 0.05, 0.42, 0.18, 0.04, mat_p, 24)
    
    # Sink
    sink_x = room.x + room.width - 0.4
    sink_y = room.y + 0.4
    
    # Sink basin
    create_box("SinkBasin", sink_x, sink_y, 0.85, 0.5, 0.15, 0.4, mat_p)
    # Pedestal
    create_box("SinkPedestal", sink_x, sink_y, 0.4, 0.2, 0.7, 0.2, mat_p)
    # Faucet
    create_cylinder("Faucet", sink_x, sink_y - 0.1, 0.95, 0.02, 0.15, mat_chrome)
    
    # Bathtub (if room is large enough)
    if room.length >= 2.0 and room.width >= 1.5:
        tub_x = room.x + room.width/2
        tub_y = room.y2 - 0.5
        
        # Tub body
        create_box("Bathtub", tub_x, tub_y, 0.3, min(room.width - 0.3, 1.5), 0.5, 0.7, mat_p)
        # Tub interior (darker)
        create_box("TubInterior", tub_x, tub_y, 0.35, min(room.width - 0.4, 1.4), 0.4, 0.6, mat_glass())

def add_kitchen_furniture(room):
    """Add kitchen furniture: counters, cabinets, appliances"""
    mat_counter = mat_counter_marble()
    mat_cabinet = mat_cabinet_wood()
    mat_chrome = mat_metal_chrome()
    
    cx, cy = room.center
    
    # L-shaped counter along two walls
    counter_depth = 0.6
    counter_height = 0.9
    
    # Back wall counter
    back_w = min(room.width - 0.4, 3.0)
    create_box("CounterBack", cx, room.y + counter_depth/2 + 0.1, counter_height/2, back_w, counter_height, counter_depth, mat_cabinet)
    create_box("CounterTopBack", cx, room.y + counter_depth/2 + 0.1, counter_height + 0.02, back_w + 0.02, 0.04, counter_depth + 0.02, mat_counter)
    
    # Sink
    create_box("KitchenSink", cx, room.y + 0.4, counter_height + 0.01, 0.5, 0.1, 0.4, mat_chrome)
    
    # Upper cabinets
    upper_h = 0.7
    upper_z = 1.6 + upper_h/2
    create_box("UpperCabinets", cx, room.y + 0.25, upper_z, back_w - 0.5, upper_h, 0.35, mat_cabinet)

def add_deck_furniture(room):
    """Add outdoor deck furniture: loungers, umbrella, plants"""
    cx, cy = room.center
    
    # Outdoor loungers
    mat_frame = mat_wood_dark()
    mat_cushion = mat_fabric_blue()
    
    # Lounger 1
    l1_x = room.x + 1.5
    l1_y = room.y + room.length * 0.6
    create_box("Lounger1Frame", l1_x, l1_y, 0.2, 0.7, 0.25, 1.8, mat_frame)
    create_box("Lounger1Cushion", l1_x, l1_y, 0.3, 0.6, 0.1, 1.7, mat_cushion)
    
    # Lounger 2
    l2_x = room.x + 3.0
    l2_y = room.y + room.length * 0.6
    create_box("Lounger2Frame", l2_x, l2_y, 0.2, 0.7, 0.25, 1.8, mat_frame)
    create_box("Lounger2Cushion", l2_x, l2_y, 0.3, 0.6, 0.1, 1.7, mat_cushion)
    
    # Umbrella between loungers
    umb_x = (l1_x + l2_x) / 2
    umb_y = l1_y
    create_cylinder("UmbrellaPole", umb_x, umb_y, 1.2, 0.03, 2.4, mat_wood_dark())
    # Umbrella canopy (cone-like)
    bpy.ops.mesh.primitive_cone_add(radius1=1.5, radius2=0.1, depth=0.5, vertices=8, location=(umb_x, umb_y, 2.5))
    canopy = bpy.context.active_object
    canopy.name = "UmbrellaCanopy"
    canopy.rotation_euler = (math.pi, 0, 0)
    canopy.data.materials.append(mat_umbrella())
    
    # Potted plants on deck
    create_potted_plant(room.x + 0.4, room.y2 - 0.4, 0.5)
    create_potted_plant(room.x2 - 0.4, room.y2 - 0.4, 0.6)
    create_potted_plant(room.x + 0.4, room.y + 0.4, 0.4)
    
    # Create pergola
    create_pergola(room)

def create_pergola(room):
    """Create a pergola structure over the deck"""
    mat_wood = mat_wood_dark()
    
    # Posts at corners
    post_inset = 0.3
    post_positions = [
        (room.x + post_inset, room.y + post_inset),
        (room.x2 - post_inset, room.y + post_inset),
        (room.x + post_inset, room.y2 - post_inset),
        (room.x2 - post_inset, room.y2 - post_inset),
    ]
    
    post_height = 2.8
    for i, (px, py) in enumerate(post_positions):
        create_box(f"PergPost{i}", px, py, post_height/2, 0.12, post_height, 0.12, mat_wood)
    
    # Main beams (lengthwise)
    beam_z = post_height + 0.06
    for side in [room.x + post_inset, room.x2 - post_inset]:
        create_box(f"PergBeam", side, room.y + room.length/2, beam_z, 0.1, 0.12, room.length - 2*post_inset, mat_wood)
    
    # Cross beams (widthwise) - rafters
    num_rafters = 6
    for i in range(num_rafters):
        rafter_y = room.y + post_inset + i * (room.length - 2*post_inset) / (num_rafters - 1)
        create_box(f"PergRafter{i}", room.x + room.width/2, rafter_y, beam_z + 0.08, room.width - 2*post_inset, 0.08, 0.06, mat_wood)

def create_potted_plant(x, y, height):
    """Create a potted plant"""
    pot_h = height * 0.3
    pot_r = height * 0.2
    
    # Pot
    create_cylinder(f"Pot_{x:.1f}_{y:.1f}", x, y, pot_h/2, pot_r, pot_h, mat_pot_terracotta())
    
    # Plant foliage (cluster of spheres)
    plant_z = pot_h + height * 0.3
    create_uv_sphere(f"Plant_{x:.1f}_{y:.1f}", x, y, plant_z, height * 0.35, mat_plant_green(), 12, 8)
    create_uv_sphere(f"Plant2_{x:.1f}_{y:.1f}", x + 0.05, y - 0.03, plant_z + 0.1, height * 0.25, mat_plant_green(), 10, 6)

def add_stairs(room):
    """Create a staircase"""
    mat_wood = mat_wood_dark()
    mat_rail = mat_metal_chrome()
    
    # Calculate stair dimensions
    num_steps = 14
    step_height = room.height / num_steps
    step_depth = room.length / num_steps
    step_width = room.width - 0.4
    
    # Create steps
    for i in range(num_steps):
        step_z = step_height * (i + 0.5)
        step_y = room.y + step_depth * i + step_depth/2
        
        # Tread
        create_box(f"Step{i}", room.x + room.width/2, step_y, step_z, step_width, step_height * 0.8, step_depth * 0.95, mat_wood)
    
    # Railing (simplified)
    rail_height = 0.9
    # Posts
    for i in [0, num_steps//2, num_steps-1]:
        post_y = room.y + step_depth * i + step_depth/2
        post_z = step_height * i + rail_height/2 + step_height
        create_cylinder(f"RailPost{i}", room.x + 0.15, post_y, post_z, 0.025, rail_height, mat_rail)
    
    # Handrail (angled)
    start_z = step_height + rail_height
    end_z = room.height + rail_height
    mid_z = (start_z + end_z) / 2
    mid_y = room.y + room.length/2
    
    # Create angled handrail as stretched cylinder
    rail_len = math.sqrt(room.length**2 + (room.height - step_height)**2)
    angle = math.atan2(room.height - step_height, room.length)
    
    bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=rail_len, location=(room.x + 0.15, mid_y, mid_z))
    rail = bpy.context.active_object
    rail.rotation_euler = (math.pi/2 - angle, 0, 0)
    rail.data.materials.append(mat_rail)

# ============= LIGHTING =============

def setup_lighting(rooms):
    """Add realistic lighting"""
    if not rooms:
        return
    
    min_x = min(r.x for r in rooms)
    max_x = max(r.x2 for r in rooms)
    min_y = min(r.y for r in rooms)
    max_y = max(r.y2 for r in rooms)
    cx = (min_x + max_x) / 2
    cy = (min_y + max_y) / 2
    
    # Sun light (main light source)
    bpy.ops.object.light_add(type='SUN', location=(cx + 5, min_y - 5, 8))
    sun = bpy.context.active_object
    sun.name = "Sun"
    sun.data.energy = 4
    sun.data.angle = math.radians(1)  # Sharp shadows
    sun.rotation_euler = (math.radians(55), math.radians(15), math.radians(30))
    
    # Fill light (softer, from opposite side)
    bpy.ops.object.light_add(type='SUN', location=(cx - 5, max_y + 5, 6))
    fill = bpy.context.active_object
    fill.name = "FillLight"
    fill.data.energy = 1
    fill.rotation_euler = (math.radians(65), math.radians(-10), math.radians(-30))
    
    # Area light for interior fill
    bpy.ops.object.light_add(type='AREA', location=(cx, cy, 2.5))
    area = bpy.context.active_object
    area.name = "AreaLight"
    area.data.energy = 100
    area.data.size = max(max_x - min_x, max_y - min_y) * 0.8

def setup_world():
    """Set up world/sky"""
    world = bpy.data.worlds.new("World")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.5, 0.7, 1.0, 1)  # Light blue sky
    bg.inputs["Strength"].default_value = 0.5

# ============= MAIN =============

def create_house(data, output_path, skip_ceilings=False):
    """Main function - create the house and export"""
    clear_scene()
    
    rooms_data = data.get('rooms', [data])
    rooms = [Room(r) for r in rooms_data]
    
    print(f"\n=== Creating HIGH QUALITY house with {len(rooms)} rooms ===")
    for r in rooms:
        print(f"  {r.id}: {r.name} ({r.type}) - {r.width}x{r.length}m at ({r.x}, {r.y})")
    
    created_walls = set()
    
    for room in rooms:
        print(f"\nBuilding {room.id}...")
        create_floor(room)
        create_ceiling(room, skip_ceilings)
        create_room_walls(room, rooms, created_walls)
        add_furniture(room)
    
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
    print("✅ Done! High-quality house exported.")

def main():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    
    if len(argv) < 2:
        print("Usage: blender --background --python render_house_v3.py -- input.json output.glb [--no-ceilings]")
        sys.exit(1)
    
    skip_ceilings = '--no-ceilings' in argv
    
    with open(argv[0], 'r') as f:
        data = json.load(f)
    
    create_house(data, argv[1], skip_ceilings)

if __name__ == "__main__":
    main()
