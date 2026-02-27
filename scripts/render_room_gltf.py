#!/usr/bin/env python3
"""
Blender script to create a high-quality room and export as GLTF.
Run with: blender --background --python render_room_gltf.py -- input.json output.glb
"""

import bpy
import sys
import json
import math
import os
import mathutils

def clear_scene():
    """Remove all objects from the scene."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    
    # Clear all materials
    for material in bpy.data.materials:
        bpy.data.materials.remove(material)

def create_pbr_material(name, color, roughness=0.5, metallic=0.0, normal_strength=0.5):
    """Create a PBR material with proper settings for GLTF export."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    
    # Clear default nodes
    nodes.clear()
    
    # Create nodes
    output = nodes.new('ShaderNodeOutputMaterial')
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    
    # Set values
    bsdf.inputs['Base Color'].default_value = color
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
    
    # Connect
    links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    
    output.location = (300, 0)
    bsdf.location = (0, 0)
    
    return mat

def create_floor(width, length):
    """Create floor with wood-like material."""
    bpy.ops.mesh.primitive_plane_add(size=1, location=(width/2, length/2, 0))
    floor = bpy.context.active_object
    floor.name = "Floor"
    floor.scale = (width, length, 1)
    
    # Apply scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    
    # Wood floor material - warm oak color
    mat = create_pbr_material(
        "WoodFloor",
        (0.45, 0.32, 0.18, 1),  # Warm wood color
        roughness=0.35,
        metallic=0.0
    )
    floor.data.materials.append(mat)
    
    # Add UV mapping for potential textures
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.uv.smart_project()
    bpy.ops.object.mode_set(mode='OBJECT')
    
    return floor

def create_walls(width, length, height=2.8):
    """Create walls with proper materials."""
    walls = []
    wall_thickness = 0.15
    
    # Wall material - slightly warm white
    wall_mat = create_pbr_material(
        "WallPaint",
        (0.92, 0.90, 0.85, 1),  # Warm off-white
        roughness=0.85,
        metallic=0.0
    )
    
    wall_configs = [
        # (name, location, scale)
        ("Wall_Back", (width/2, wall_thickness/2, height/2), (width, wall_thickness, height)),
        ("Wall_Left", (wall_thickness/2, length/2, height/2), (wall_thickness, length, height)),
        ("Wall_Right", (width - wall_thickness/2, length/2, height/2), (wall_thickness, length, height)),
    ]
    
    for name, loc, scale in wall_configs:
        bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
        wall = bpy.context.active_object
        wall.name = name
        wall.scale = scale
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        wall.data.materials.append(wall_mat)
        walls.append(wall)
    
    return walls

def create_ceiling(width, length, height=2.8):
    """Create ceiling."""
    bpy.ops.mesh.primitive_plane_add(size=1, location=(width/2, length/2, height))
    ceiling = bpy.context.active_object
    ceiling.name = "Ceiling"
    ceiling.scale = (width, length, 1)
    ceiling.rotation_euler = (math.radians(180), 0, 0)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    
    # White ceiling
    mat = create_pbr_material(
        "CeilingPaint",
        (1, 1, 1, 1),
        roughness=0.9,
        metallic=0.0
    )
    ceiling.data.materials.append(mat)
    return ceiling

def create_baseboard(width, length, height=0.1):
    """Create baseboards along walls."""
    baseboard_height = 0.1
    baseboard_depth = 0.02
    
    mat = create_pbr_material(
        "Baseboard",
        (0.95, 0.95, 0.95, 1),  # White
        roughness=0.4,
        metallic=0.0
    )
    
    baseboards = []
    configs = [
        # Back wall
        ((width/2, baseboard_depth/2, baseboard_height/2), (width, baseboard_depth, baseboard_height)),
        # Left wall
        ((baseboard_depth/2, length/2, baseboard_height/2), (baseboard_depth, length, baseboard_height)),
        # Right wall
        ((width - baseboard_depth/2, length/2, baseboard_height/2), (baseboard_depth, length, baseboard_height)),
    ]
    
    for loc, scale in configs:
        bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
        bb = bpy.context.active_object
        bb.name = "Baseboard"
        bb.scale = scale
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        bb.data.materials.append(mat)
        baseboards.append(bb)
    
    return baseboards

def create_window(width, length, height=2.8):
    """Create a window on the back wall."""
    window_width = 1.5
    window_height = 1.4
    window_bottom = 0.9
    window_depth = 0.15
    
    # Window frame
    frame_mat = create_pbr_material(
        "WindowFrame",
        (0.2, 0.2, 0.2, 1),  # Dark gray
        roughness=0.3,
        metallic=0.8
    )
    
    # Window glass - semi-transparent
    glass_mat = bpy.data.materials.new(name="Glass")
    glass_mat.use_nodes = True
    nodes = glass_mat.node_tree.nodes
    links = glass_mat.node_tree.links
    nodes.clear()
    
    output = nodes.new('ShaderNodeOutputMaterial')
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.8, 0.9, 1.0, 1)
    bsdf.inputs['Roughness'].default_value = 0.0
    bsdf.inputs['Metallic'].default_value = 0.0
    # Blender 4.0 uses 'Transmission Weight' instead of 'Transmission'
    if 'Transmission Weight' in bsdf.inputs:
        bsdf.inputs['Transmission Weight'].default_value = 0.9
    elif 'Transmission' in bsdf.inputs:
        bsdf.inputs['Transmission'].default_value = 0.9
    bsdf.inputs['IOR'].default_value = 1.45
    links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    
    # Create glass pane
    glass_x = width / 2
    glass_y = 0.08
    glass_z = window_bottom + window_height/2
    
    bpy.ops.mesh.primitive_plane_add(size=1, location=(glass_x, glass_y, glass_z))
    glass = bpy.context.active_object
    glass.name = "WindowGlass"
    glass.scale = (window_width - 0.1, 1, window_height - 0.1)
    glass.rotation_euler = (math.radians(90), 0, 0)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    glass.data.materials.append(glass_mat)
    
    # Window frame (simplified - just a border)
    frame_thickness = 0.05
    
    # Create frame as 4 boxes
    frame_parts = []
    # Top
    bpy.ops.mesh.primitive_cube_add(size=1, location=(glass_x, glass_y, glass_z + window_height/2))
    top = bpy.context.active_object
    top.scale = (window_width, frame_thickness, frame_thickness)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    top.data.materials.append(frame_mat)
    frame_parts.append(top)
    
    # Bottom
    bpy.ops.mesh.primitive_cube_add(size=1, location=(glass_x, glass_y, glass_z - window_height/2))
    bottom = bpy.context.active_object
    bottom.scale = (window_width, frame_thickness, frame_thickness)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bottom.data.materials.append(frame_mat)
    frame_parts.append(bottom)
    
    # Left
    bpy.ops.mesh.primitive_cube_add(size=1, location=(glass_x - window_width/2, glass_y, glass_z))
    left = bpy.context.active_object
    left.scale = (frame_thickness, frame_thickness, window_height)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    left.data.materials.append(frame_mat)
    frame_parts.append(left)
    
    # Right
    bpy.ops.mesh.primitive_cube_add(size=1, location=(glass_x + window_width/2, glass_y, glass_z))
    right = bpy.context.active_object
    right.scale = (frame_thickness, frame_thickness, window_height)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    right.data.materials.append(frame_mat)
    frame_parts.append(right)
    
    return [glass] + frame_parts

def setup_lighting(width, length, height=2.8):
    """Set up realistic interior lighting."""
    lights = []
    
    # Main ceiling light (area light for soft shadows)
    bpy.ops.object.light_add(type='AREA', location=(width/2, length/2, height - 0.05))
    main_light = bpy.context.active_object
    main_light.name = "CeilingLight"
    main_light.data.energy = 300
    main_light.data.size = 0.5
    main_light.data.color = (1.0, 0.95, 0.9)  # Warm white
    lights.append(main_light)
    
    # Window light (sun coming through)
    bpy.ops.object.light_add(type='SUN', location=(width/2, -2, height))
    sun = bpy.context.active_object
    sun.name = "Sunlight"
    sun.data.energy = 3
    sun.data.color = (1.0, 0.98, 0.95)
    sun.rotation_euler = (math.radians(60), 0, math.radians(10))
    lights.append(sun)
    
    # Ambient fill (very soft)
    bpy.ops.object.light_add(type='AREA', location=(width/2, length/2, height/2))
    fill = bpy.context.active_object
    fill.name = "FillLight"
    fill.data.energy = 50
    fill.data.size = max(width, length)
    lights.append(fill)
    
    return lights

def setup_world():
    """Set up world/environment."""
    world = bpy.data.worlds.new("World")
    bpy.context.scene.world = world
    world.use_nodes = True
    
    nodes = world.node_tree.nodes
    links = world.node_tree.links
    
    # Set background to light blue sky
    bg = nodes["Background"]
    bg.inputs["Color"].default_value = (0.7, 0.85, 1.0, 1)
    bg.inputs["Strength"].default_value = 0.5

def create_room(room_data, output_path):
    """Main function to create room and export as GLTF."""
    width = room_data.get("width", 4)
    length = room_data.get("length", 5)
    height = room_data.get("height", 2.8)
    
    print(f"Creating room: {width}x{length}m, height {height}m")
    
    # Clear and build scene
    clear_scene()
    
    # Create room elements
    create_floor(width, length)
    create_walls(width, length, height)
    create_ceiling(width, length, height)
    create_baseboard(width, length)
    create_window(width, length, height)
    
    # Setup lighting and environment
    setup_lighting(width, length, height)
    setup_world()
    
    # Export as GLTF
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        export_materials='EXPORT',
        export_cameras=False,
        export_lights=False,  # Three.js will handle lighting
        export_apply=True,
    )
    
    print(f"Exported to: {output_path}")
    return True

def main():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []
    
    if len(argv) < 2:
        print("Usage: blender --background --python render_room_gltf.py -- input.json output.glb")
        sys.exit(1)
    
    input_path = argv[0]
    output_path = argv[1]
    
    with open(input_path, 'r') as f:
        room_data = json.load(f)
    
    if "rooms" in room_data:
        rooms = room_data["rooms"]
        if rooms:
            room_data = max(rooms, key=lambda r: r.get("width", 0) * r.get("length", 0))
    
    create_room(room_data, output_path)

if __name__ == "__main__":
    main()
