#!/usr/bin/env python3
"""
Blender script to render a room from JSON data.
Run with: blender --background --python render_room.py -- input.json output.png
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

def create_floor(width, length):
    """Create floor plane."""
    bpy.ops.mesh.primitive_plane_add(size=1, location=(width/2, length/2, 0))
    floor = bpy.context.active_object
    floor.name = "Floor"
    floor.scale = (width, length, 1)
    
    # Create floor material
    mat = bpy.data.materials.new(name="FloorMaterial")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.8, 0.75, 0.65, 1)  # Wood-ish color
    bsdf.inputs["Roughness"].default_value = 0.4
    floor.data.materials.append(mat)
    return floor

def create_walls(width, length, height=2.8):
    """Create four walls."""
    walls = []
    wall_thickness = 0.1
    
    # Wall material
    wall_mat = bpy.data.materials.new(name="WallMaterial")
    wall_mat.use_nodes = True
    bsdf = wall_mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.95, 0.95, 0.92, 1)  # Off-white
    bsdf.inputs["Roughness"].default_value = 0.8
    
    # Back wall (Y=0)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(width/2, wall_thickness/2, height/2))
    wall = bpy.context.active_object
    wall.name = "Wall_Back"
    wall.scale = (width, wall_thickness, height)
    wall.data.materials.append(wall_mat)
    walls.append(wall)
    
    # Front wall (Y=length) - with opening for camera view
    bpy.ops.mesh.primitive_cube_add(size=1, location=(width/2, length - wall_thickness/2, height/2))
    wall = bpy.context.active_object
    wall.name = "Wall_Front"
    wall.scale = (width, wall_thickness, height)
    wall.data.materials.append(wall_mat)
    wall.hide_render = True  # Hide front wall for camera view
    walls.append(wall)
    
    # Left wall (X=0)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(wall_thickness/2, length/2, height/2))
    wall = bpy.context.active_object
    wall.name = "Wall_Left"
    wall.scale = (wall_thickness, length, height)
    wall.data.materials.append(wall_mat)
    walls.append(wall)
    
    # Right wall (X=width)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(width - wall_thickness/2, length/2, height/2))
    wall = bpy.context.active_object
    wall.name = "Wall_Right"
    wall.scale = (wall_thickness, length, height)
    wall.data.materials.append(wall_mat)
    walls.append(wall)
    
    return walls

def create_ceiling(width, length, height=2.8):
    """Create ceiling."""
    bpy.ops.mesh.primitive_plane_add(size=1, location=(width/2, length/2, height))
    ceiling = bpy.context.active_object
    ceiling.name = "Ceiling"
    ceiling.scale = (width, length, 1)
    
    # Ceiling material
    mat = bpy.data.materials.new(name="CeilingMaterial")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (1, 1, 1, 1)  # White
    bsdf.inputs["Roughness"].default_value = 0.9
    ceiling.data.materials.append(mat)
    return ceiling

def create_window(wall_name, position, size=(1.2, 1.5)):
    """Add a window to a wall (simplified - just a darker rectangle)."""
    # For MVP, we'll skip complex boolean operations
    pass

def setup_camera(width, length, height=2.8):
    """Set up camera for a nice interior shot."""
    # Position camera at front of room looking in
    cam_x = width / 2
    cam_y = length + 2  # Outside the room looking in
    cam_z = height * 0.6  # Slightly below eye level
    
    bpy.ops.object.camera_add(location=(cam_x, cam_y, cam_z))
    camera = bpy.context.active_object
    camera.name = "Camera"
    
    # Point camera at center of room
    target_x = width / 2
    target_y = length / 2
    target_z = height / 2
    
    direction = (target_x - cam_x, target_y - cam_y, target_z - cam_z)
    rot_quat = mathutils.Vector(direction).to_track_quat('-Z', 'Y')
    camera.rotation_euler = rot_quat.to_euler()
    
    # Alternative: use simple rotation
    camera.rotation_euler = (math.radians(75), 0, math.radians(180))
    
    bpy.context.scene.camera = camera
    return camera

def setup_lighting(width, length, height=2.8):
    """Set up interior lighting."""
    # Main area light from above
    bpy.ops.object.light_add(type='AREA', location=(width/2, length/2, height - 0.1))
    main_light = bpy.context.active_object
    main_light.name = "MainLight"
    main_light.data.energy = 500
    main_light.data.size = min(width, length) * 0.8
    
    # Window light simulation
    bpy.ops.object.light_add(type='AREA', location=(width/2, 0.1, height * 0.6))
    window_light = bpy.context.active_object
    window_light.name = "WindowLight"
    window_light.data.energy = 200
    window_light.data.size = 2
    window_light.rotation_euler = (math.radians(90), 0, 0)
    
    return [main_light, window_light]

def setup_render_settings(output_path, resolution=(1024, 1024)):
    """Configure render settings."""
    scene = bpy.context.scene
    
    # Use Cycles for better quality (or EEVEE for speed)
    scene.render.engine = 'BLENDER_EEVEE'  # Faster for MVP
    
    # Resolution
    scene.render.resolution_x = resolution[0]
    scene.render.resolution_y = resolution[1]
    scene.render.resolution_percentage = 100
    
    # Output
    scene.render.filepath = output_path
    scene.render.image_settings.file_format = 'PNG'
    
    # EEVEE settings for better quality
    if hasattr(scene.eevee, 'taa_render_samples'):
        scene.eevee.taa_render_samples = 64
    
    # Background color
    scene.world = bpy.data.worlds.new("World")
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.8, 0.9, 1.0, 1)  # Light blue sky

def render_room(room_data, output_path):
    """Main function to render a room from data."""
    import mathutils
    
    # Get room dimensions
    width = room_data.get("width", 4)
    length = room_data.get("length", 5)
    height = room_data.get("height", 2.8)
    
    # Clear and build scene
    clear_scene()
    create_floor(width, length)
    create_walls(width, length, height)
    create_ceiling(width, length, height)
    
    setup_camera(width, length, height)
    setup_lighting(width, length, height)
    
    # Render settings
    setup_render_settings(output_path)
    
    # Render
    bpy.ops.render.render(write_still=True)
    
    return True

def main():
    # Get command line arguments after "--"
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []
    
    if len(argv) < 2:
        print("Usage: blender --background --python render_room.py -- input.json output.png")
        sys.exit(1)
    
    input_path = argv[0]
    output_path = argv[1]
    
    # Load room data
    with open(input_path, 'r') as f:
        room_data = json.load(f)
    
    # If it's a full blueprint analysis, take the first/largest room
    if "rooms" in room_data:
        rooms = room_data["rooms"]
        if rooms:
            # Find largest room by area
            room_data = max(rooms, key=lambda r: r.get("width", 0) * r.get("length", 0))
    
    print(f"Rendering room: {room_data.get('name', 'Unknown')}")
    print(f"Dimensions: {room_data.get('width')}x{room_data.get('length')}m")
    
    render_room(room_data, output_path)
    print(f"Render saved to: {output_path}")

if __name__ == "__main__":
    main()
