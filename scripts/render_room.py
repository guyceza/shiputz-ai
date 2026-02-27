#!/usr/bin/env python3
"""
Blender script to render a HIGH-QUALITY room image.
Includes furniture, detailed materials, proper lighting.
Run with: blender --background --python render_room.py -- input.json output.png
"""

import bpy
import sys
import json
import math
import os
import mathutils
from random import uniform

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for material in bpy.data.materials:
        bpy.data.materials.remove(material)

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
    output.location = (300, 0)
    bsdf.location = (0, 0)
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
    noise.inputs['Detail'].default_value = 10
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

def create_floor(width, length):
    bpy.ops.mesh.primitive_plane_add(size=1, location=(width/2, length/2, 0))
    floor = bpy.context.active_object
    floor.name = "Floor"
    floor.scale = (width, length, 1)
    bpy.ops.object.transform_apply(scale=True)
    mat = create_wood_material("WoodFloor", (0.55, 0.35, 0.18, 1))
    floor.data.materials.append(mat)
    return floor

def create_walls(width, length, height=2.8):
    walls = []
    wall_thickness = 0.12
    wall_mat = create_pbr_material("WallPaint", (0.95, 0.93, 0.88, 1), roughness=0.9)
    
    wall_configs = [
        ("Wall_Back", (width/2, wall_thickness/2, height/2), (width, wall_thickness, height)),
        ("Wall_Left", (wall_thickness/2, length/2, height/2), (wall_thickness, length, height)),
        ("Wall_Right", (width - wall_thickness/2, length/2, height/2), (wall_thickness, length, height)),
    ]
    
    for name, loc, scale in wall_configs:
        bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
        wall = bpy.context.active_object
        wall.name = name
        wall.scale = scale
        bpy.ops.object.transform_apply(scale=True)
        wall.data.materials.append(wall_mat)
        walls.append(wall)
    return walls

def create_ceiling(width, length, height=2.8):
    bpy.ops.mesh.primitive_plane_add(size=1, location=(width/2, length/2, height))
    ceiling = bpy.context.active_object
    ceiling.name = "Ceiling"
    ceiling.scale = (width, length, 1)
    ceiling.rotation_euler = (math.radians(180), 0, 0)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    mat = create_pbr_material("CeilingPaint", (1, 1, 1, 1), roughness=0.95)
    ceiling.data.materials.append(mat)
    return ceiling

def create_baseboards(width, length):
    mat = create_pbr_material("Baseboard", (0.98, 0.98, 0.98, 1), roughness=0.4)
    h, d = 0.12, 0.015
    configs = [
        ((width/2, d/2, h/2), (width, d, h)),
        ((d/2, length/2, h/2), (d, length, h)),
        ((width - d/2, length/2, h/2), (d, length, h)),
    ]
    for loc, scale in configs:
        bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
        bb = bpy.context.active_object
        bb.name = "Baseboard"
        bb.scale = scale
        bpy.ops.object.transform_apply(scale=True)
        bb.data.materials.append(mat)

def create_window(width, length, height=2.8):
    win_w, win_h = 1.6, 1.5
    win_bottom = 0.85
    win_x = width / 2
    win_y = 0.06
    win_z = win_bottom + win_h/2
    
    frame_mat = create_pbr_material("WindowFrame", (0.15, 0.15, 0.15, 1), roughness=0.3, metallic=0.9)
    glass_mat = create_glass_material("Glass")
    sill_mat = create_pbr_material("WindowSill", (0.9, 0.88, 0.85, 1), roughness=0.5)
    
    pane_w = (win_w - 0.08) / 2
    for i, offset in enumerate([-pane_w/2 - 0.02, pane_w/2 + 0.02]):
        bpy.ops.mesh.primitive_plane_add(size=1, location=(win_x + offset, win_y, win_z))
        glass = bpy.context.active_object
        glass.name = f"Glass_{i}"
        glass.scale = (pane_w, 1, win_h - 0.08)
        glass.rotation_euler = (math.radians(90), 0, 0)
        bpy.ops.object.transform_apply(scale=True, rotation=True)
        glass.data.materials.append(glass_mat)
    
    frame_t = 0.04
    frame_parts = [
        ((win_x, win_y, win_z + win_h/2), (win_w, frame_t, frame_t)),
        ((win_x, win_y, win_z - win_h/2), (win_w, frame_t, frame_t)),
        ((win_x - win_w/2, win_y, win_z), (frame_t, frame_t, win_h)),
        ((win_x + win_w/2, win_y, win_z), (frame_t, frame_t, win_h)),
        ((win_x, win_y, win_z), (frame_t, frame_t, win_h - 0.08)),
    ]
    for loc, scale in frame_parts:
        bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
        f = bpy.context.active_object
        f.name = "WindowFrame"
        f.scale = scale
        bpy.ops.object.transform_apply(scale=True)
        f.data.materials.append(frame_mat)
    
    bpy.ops.mesh.primitive_cube_add(size=1, location=(win_x, 0.15, win_bottom - 0.03))
    sill = bpy.context.active_object
    sill.name = "WindowSill"
    sill.scale = (win_w + 0.15, 0.2, 0.04)
    bpy.ops.object.transform_apply(scale=True)
    sill.data.materials.append(sill_mat)

def create_sofa(x, y):
    sofa_mat = create_pbr_material("SofaFabric", (0.25, 0.28, 0.35, 1), roughness=0.85)
    leg_mat = create_pbr_material("SofaLeg", (0.15, 0.12, 0.1, 1), roughness=0.4, metallic=0.3)
    cushion_mat = create_pbr_material("Cushion", (0.3, 0.33, 0.4, 1), roughness=0.9)
    
    w, d, h = 2.0, 0.85, 0.4
    back_h, arm_w = 0.45, 0.15
    
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, h/2 + 0.1))
    base = bpy.context.active_object
    base.name = "SofaBase"
    base.scale = (w, d - 0.1, h)
    bpy.ops.object.transform_apply(scale=True)
    base.data.materials.append(sofa_mat)
    
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y - d/2 + 0.1, h + back_h/2 + 0.1))
    back = bpy.context.active_object
    back.name = "SofaBack"
    back.scale = (w - arm_w*2, 0.15, back_h)
    bpy.ops.object.transform_apply(scale=True)
    back.data.materials.append(sofa_mat)
    
    for side in [-1, 1]:
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x + side * (w/2 - arm_w/2), y, h/2 + 0.2))
        arm = bpy.context.active_object
        arm.name = "SofaArm"
        arm.scale = (arm_w, d - 0.1, h + 0.2)
        bpy.ops.object.transform_apply(scale=True)
        arm.data.materials.append(sofa_mat)
    
    for i in range(3):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x + (i - 1) * 0.6, y + 0.05, h + 0.15))
        cush = bpy.context.active_object
        cush.name = "SofaCushion"
        cush.scale = (0.55, 0.5, 0.12)
        bpy.ops.object.transform_apply(scale=True)
        cush.data.materials.append(cushion_mat)

def create_coffee_table(x, y):
    wood_mat = create_wood_material("TableWood", (0.4, 0.28, 0.18, 1))
    leg_mat = create_pbr_material("TableLeg", (0.1, 0.1, 0.1, 1), roughness=0.3, metallic=0.8)
    
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, 0.4))
    top = bpy.context.active_object
    top.name = "TableTop"
    top.scale = (1.0, 0.5, 0.04)
    bpy.ops.object.transform_apply(scale=True)
    top.data.materials.append(wood_mat)
    
    for lx, ly in [(x - 0.4, y - 0.2), (x + 0.4, y - 0.2), (x - 0.4, y + 0.2), (x + 0.4, y + 0.2)]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.02, depth=0.38, location=(lx, ly, 0.19))
        leg = bpy.context.active_object
        leg.name = "TableLeg"
        leg.data.materials.append(leg_mat)

def create_floor_lamp(x, y):
    base_mat = create_pbr_material("LampBase", (0.15, 0.15, 0.15, 1), roughness=0.3, metallic=0.7)
    shade_mat = create_pbr_material("LampShade", (0.95, 0.92, 0.85, 1), roughness=0.8)
    
    bpy.ops.mesh.primitive_cylinder_add(radius=0.15, depth=0.03, location=(x, y, 0.015))
    base = bpy.context.active_object
    base.data.materials.append(base_mat)
    
    bpy.ops.mesh.primitive_cylinder_add(radius=0.015, depth=1.5, location=(x, y, 0.78))
    pole = bpy.context.active_object
    pole.data.materials.append(base_mat)
    
    bpy.ops.mesh.primitive_cone_add(radius1=0.2, radius2=0.12, depth=0.25, location=(x, y, 1.65))
    shade = bpy.context.active_object
    shade.data.materials.append(shade_mat)

def create_rug(x, y, w=2.5, l=1.8):
    rug_mat = create_pbr_material("Rug", (0.4, 0.35, 0.3, 1), roughness=0.95)
    bpy.ops.mesh.primitive_plane_add(size=1, location=(x, y, 0.005))
    rug = bpy.context.active_object
    rug.name = "Rug"
    rug.scale = (w, l, 1)
    bpy.ops.object.transform_apply(scale=True)
    rug.data.materials.append(rug_mat)

def create_plant(x, y):
    pot_mat = create_pbr_material("Pot", (0.75, 0.72, 0.68, 1), roughness=0.6)
    plant_mat = create_pbr_material("Plant", (0.2, 0.45, 0.2, 1), roughness=0.8)
    
    bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.25, location=(x, y, 0.125))
    pot = bpy.context.active_object
    pot.data.materials.append(pot_mat)
    
    for i in range(5):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=uniform(0.08, 0.15), 
            location=(x + uniform(-0.08, 0.08), y + uniform(-0.08, 0.08), 0.35 + uniform(0, 0.2)))
        leaf = bpy.context.active_object
        leaf.data.materials.append(plant_mat)

def setup_camera(width, length, height):
    cam_x = width / 2
    cam_y = length - 0.5
    cam_z = 1.6
    
    bpy.ops.object.camera_add(location=(cam_x, cam_y, cam_z))
    camera = bpy.context.active_object
    camera.name = "Camera"
    camera.rotation_euler = (math.radians(82), 0, math.radians(180))
    camera.data.lens = 22
    bpy.context.scene.camera = camera

def setup_lighting(width, length, height):
    bpy.ops.object.light_add(type='AREA', location=(width/2, length/2, height - 0.15))
    main = bpy.context.active_object
    main.data.energy = 300
    main.data.size = 0.5
    main.data.color = (1.0, 0.95, 0.9)
    
    bpy.ops.object.light_add(type='SUN', location=(width/2, -2, height))
    sun = bpy.context.active_object
    sun.data.energy = 3
    sun.data.color = (1.0, 0.98, 0.95)
    sun.rotation_euler = (math.radians(55), 0, math.radians(15))
    
    bpy.ops.object.light_add(type='AREA', location=(width/2, length/2, height/2))
    fill = bpy.context.active_object
    fill.data.energy = 50
    fill.data.size = max(width, length) * 1.5

def setup_world():
    world = bpy.data.worlds.new("World")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.6, 0.8, 1.0, 1)
    bg.inputs["Strength"].default_value = 0.5

def setup_render(output_path):
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    if hasattr(scene.eevee, 'taa_render_samples'):
        scene.eevee.taa_render_samples = 128
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.resolution_percentage = 100
    scene.render.filepath = output_path
    scene.render.image_settings.file_format = 'PNG'

def render_room(room_data, output_path):
    width = room_data.get("width", 4)
    length = room_data.get("length", 5)
    height = room_data.get("height", 2.8)
    
    print(f"Creating room: {width}x{length}m, height {height}m")
    
    clear_scene()
    
    # Structure
    create_floor(width, length)
    create_walls(width, length, height)
    create_ceiling(width, length, height)
    create_baseboards(width, length)
    create_window(width, length, height)
    
    # Furniture
    center_x = width / 2
    center_y = length / 2
    
    if width >= 3:
        create_sofa(min(center_x, width - 1.2), 1.0)
    if width >= 2.5 and length >= 3:
        create_coffee_table(center_x, center_y - 0.3)
    if width >= 2.5:
        create_rug(center_x, center_y, min(2.5, width - 1), min(1.8, length - 2))
    if width >= 3:
        create_floor_lamp(width - 0.4, 0.4)
    if width >= 2.5:
        create_plant(0.3, 0.3)
    
    # Camera, lighting, render
    setup_camera(width, length, height)
    setup_lighting(width, length, height)
    setup_world()
    setup_render(output_path)
    
    bpy.ops.render.render(write_still=True)
    print(f"Rendered to: {output_path}")

def main():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    
    if len(argv) < 2:
        print("Usage: blender --background --python render_room.py -- input.json output.png")
        sys.exit(1)
    
    with open(argv[0], 'r') as f:
        room_data = json.load(f)
    
    if "rooms" in room_data:
        rooms = room_data["rooms"]
        if rooms:
            room_data = max(rooms, key=lambda r: r.get("width", 0) * r.get("length", 0))
    
    render_room(room_data, argv[1])

if __name__ == "__main__":
    main()
