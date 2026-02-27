#!/usr/bin/env python3
"""
Render a high-quality image of the room for preview.
"""

import bpy
import sys
import json
import math
import os

# Import the room creation functions from the GLTF script
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, script_dir)

# We'll duplicate the essential functions here for the render
from random import uniform

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

# Copy all the room creation functions...
exec(open(os.path.join(script_dir, 'render_room_gltf.py')).read().split('def main():')[0].split('def clear_scene():')[1])

def setup_camera(width, length, height):
    """Position camera for a nice interior shot."""
    cam_x = width / 2
    cam_y = length - 0.8
    cam_z = 1.6
    
    bpy.ops.object.camera_add(location=(cam_x, cam_y, cam_z))
    camera = bpy.context.active_object
    camera.name = "Camera"
    
    # Look toward back wall with slight angle
    camera.rotation_euler = (math.radians(85), 0, math.radians(180))
    
    # Adjust field of view
    camera.data.lens = 24  # Wide angle
    
    bpy.context.scene.camera = camera
    return camera

def setup_render(output_path, resolution=(1920, 1080)):
    """Configure high-quality render settings."""
    scene = bpy.context.scene
    
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 128
    scene.cycles.use_denoising = True
    
    scene.render.resolution_x = resolution[0]
    scene.render.resolution_y = resolution[1]
    scene.render.resolution_percentage = 100
    
    scene.render.filepath = output_path
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGB'

def main():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    
    if len(argv) < 2:
        print("Usage: blender --background --python render_room_image.py -- input.json output.png")
        sys.exit(1)
    
    input_path = argv[0]
    output_path = argv[1]
    
    with open(input_path, 'r') as f:
        room_data = json.load(f)
    
    if "rooms" in room_data:
        rooms = room_data["rooms"]
        if rooms:
            room_data = max(rooms, key=lambda r: r.get("width", 0) * r.get("length", 0))
    
    width = room_data.get("width", 4)
    length = room_data.get("length", 5)
    height = room_data.get("height", 2.8)
    
    # Import and run the GLTF script's room creation
    exec(open(os.path.join(script_dir, 'render_room_gltf.py')).read())
    
    # The GLTF script already created the room, now add camera and render
    setup_camera(width, length, height)
    setup_render(output_path)
    
    bpy.ops.render.render(write_still=True)
    print(f"Rendered to: {output_path}")

if __name__ == "__main__":
    main()
