#!/usr/bin/env python3
"""
Blender script to create a HIGH-QUALITY room and export as GLTF.
Includes: furniture, detailed materials, architectural details.
Run with: blender --background --python render_room_gltf.py -- input.json output.glb
"""

import bpy
import sys
import json
import math
import os
import mathutils
from random import uniform, choice

def clear_scene():
    """Remove all objects from the scene."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    
    for material in bpy.data.materials:
        bpy.data.materials.remove(material)
    for mesh in bpy.data.meshes:
        bpy.data.meshes.remove(mesh)

def create_pbr_material(name, color, roughness=0.5, metallic=0.0):
    """Create a PBR material."""
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
    """Create realistic wood material with grain variation."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    output = nodes.new('ShaderNodeOutputMaterial')
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    
    # Add noise for wood grain
    noise = nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 50
    noise.inputs['Detail'].default_value = 10
    
    color_ramp = nodes.new('ShaderNodeValToRGB')
    color_ramp.color_ramp.elements[0].color = color_base
    color_ramp.color_ramp.elements[1].color = (
        color_base[0] * 1.2,
        color_base[1] * 1.2,
        color_base[2] * 1.1,
        1
    )
    
    links.new(noise.outputs['Fac'], color_ramp.inputs['Fac'])
    links.new(color_ramp.outputs['Color'], bsdf.inputs['Base Color'])
    
    bsdf.inputs['Roughness'].default_value = 0.35
    bsdf.inputs['Metallic'].default_value = 0.0
    
    links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    
    return mat

def create_glass_material(name):
    """Create glass material."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    output = nodes.new('ShaderNodeOutputMaterial')
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    
    bsdf.inputs['Base Color'].default_value = (0.9, 0.95, 1.0, 1)
    bsdf.inputs['Roughness'].default_value = 0.0
    bsdf.inputs['Metallic'].default_value = 0.0
    if 'Transmission Weight' in bsdf.inputs:
        bsdf.inputs['Transmission Weight'].default_value = 0.95
    elif 'Transmission' in bsdf.inputs:
        bsdf.inputs['Transmission'].default_value = 0.95
    bsdf.inputs['IOR'].default_value = 1.45
    
    links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    
    return mat

def create_floor(width, length):
    """Create wood parquet floor."""
    bpy.ops.mesh.primitive_plane_add(size=1, location=(width/2, length/2, 0))
    floor = bpy.context.active_object
    floor.name = "Floor"
    floor.scale = (width, length, 1)
    bpy.ops.object.transform_apply(scale=True)
    
    mat = create_wood_material("WoodFloor", (0.55, 0.35, 0.18, 1))
    floor.data.materials.append(mat)
    
    return floor

def create_walls(width, length, height=2.8):
    """Create textured walls."""
    walls = []
    wall_thickness = 0.12
    
    # Slightly textured wall paint
    wall_mat = create_pbr_material(
        "WallPaint",
        (0.95, 0.93, 0.88, 1),
        roughness=0.9,
        metallic=0.0
    )
    
    wall_configs = [
        ("Wall_Back", (width/2, wall_thickness/2, height/2), (width + 0.01, wall_thickness, height)),
        ("Wall_Left", (wall_thickness/2, length/2, height/2), (wall_thickness, length + 0.01, height)),
        ("Wall_Right", (width - wall_thickness/2, length/2, height/2), (wall_thickness, length + 0.01, height)),
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
    """Create ceiling with crown molding."""
    # Main ceiling
    bpy.ops.mesh.primitive_plane_add(size=1, location=(width/2, length/2, height))
    ceiling = bpy.context.active_object
    ceiling.name = "Ceiling"
    ceiling.scale = (width, length, 1)
    ceiling.rotation_euler = (math.radians(180), 0, 0)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    
    mat = create_pbr_material("CeilingPaint", (1, 1, 1, 1), roughness=0.95)
    ceiling.data.materials.append(mat)
    
    # Crown molding
    molding_mat = create_pbr_material("Molding", (0.98, 0.98, 0.98, 1), roughness=0.4)
    molding_size = 0.08
    
    moldings = [
        ((width/2, 0.01, height - molding_size/2), (width, molding_size, molding_size)),
        ((0.01, length/2, height - molding_size/2), (molding_size, length, molding_size)),
        ((width - 0.01, length/2, height - molding_size/2), (molding_size, length, molding_size)),
    ]
    
    for loc, scale in moldings:
        bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
        m = bpy.context.active_object
        m.name = "CrownMolding"
        m.scale = scale
        bpy.ops.object.transform_apply(scale=True)
        m.data.materials.append(molding_mat)
    
    return ceiling

def create_baseboards(width, length):
    """Create baseboards along walls."""
    mat = create_pbr_material("Baseboard", (0.98, 0.98, 0.98, 1), roughness=0.4)
    h = 0.12
    d = 0.015
    
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
    """Create detailed window."""
    win_w, win_h = 1.6, 1.5
    win_bottom = 0.85
    win_x = width / 2
    win_y = 0.06
    win_z = win_bottom + win_h/2
    
    frame_mat = create_pbr_material("WindowFrame", (0.15, 0.15, 0.15, 1), roughness=0.3, metallic=0.9)
    glass_mat = create_glass_material("Glass")
    sill_mat = create_pbr_material("WindowSill", (0.9, 0.88, 0.85, 1), roughness=0.5)
    
    # Glass panes (2 panes)
    pane_w = (win_w - 0.08) / 2
    for i, offset in enumerate([-pane_w/2 - 0.02, pane_w/2 + 0.02]):
        bpy.ops.mesh.primitive_plane_add(size=1, location=(win_x + offset, win_y, win_z))
        glass = bpy.context.active_object
        glass.name = f"Glass_{i}"
        glass.scale = (pane_w, 1, win_h - 0.08)
        glass.rotation_euler = (math.radians(90), 0, 0)
        bpy.ops.object.transform_apply(scale=True, rotation=True)
        glass.data.materials.append(glass_mat)
    
    # Frame
    frame_t = 0.04
    frame_parts = [
        # Outer frame
        ((win_x, win_y, win_z + win_h/2), (win_w, frame_t, frame_t)),  # Top
        ((win_x, win_y, win_z - win_h/2), (win_w, frame_t, frame_t)),  # Bottom
        ((win_x - win_w/2, win_y, win_z), (frame_t, frame_t, win_h)),  # Left
        ((win_x + win_w/2, win_y, win_z), (frame_t, frame_t, win_h)),  # Right
        # Center divider
        ((win_x, win_y, win_z), (frame_t, frame_t, win_h - 0.08)),
    ]
    
    for loc, scale in frame_parts:
        bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
        f = bpy.context.active_object
        f.name = "WindowFrame"
        f.scale = scale
        bpy.ops.object.transform_apply(scale=True)
        f.data.materials.append(frame_mat)
    
    # Window sill
    bpy.ops.mesh.primitive_cube_add(size=1, location=(win_x, 0.15, win_bottom - 0.03))
    sill = bpy.context.active_object
    sill.name = "WindowSill"
    sill.scale = (win_w + 0.15, 0.2, 0.04)
    bpy.ops.object.transform_apply(scale=True)
    sill.data.materials.append(sill_mat)

def create_door(width, length, height=2.8):
    """Create a door on the right wall."""
    door_w, door_h = 0.9, 2.1
    door_x = width - 0.06
    door_y = length * 0.7
    door_z = door_h / 2
    
    frame_mat = create_pbr_material("DoorFrame", (0.3, 0.25, 0.2, 1), roughness=0.4)
    door_mat = create_wood_material("DoorWood", (0.35, 0.25, 0.15, 1))
    handle_mat = create_pbr_material("Handle", (0.7, 0.65, 0.5, 1), roughness=0.2, metallic=0.9)
    
    # Door frame
    frame_t = 0.06
    frame_parts = [
        ((door_x, door_y, door_h + frame_t/2), (frame_t, door_w + frame_t*2, frame_t)),  # Top
        ((door_x, door_y - door_w/2 - frame_t/2, door_h/2), (frame_t, frame_t, door_h)),  # Left
        ((door_x, door_y + door_w/2 + frame_t/2, door_h/2), (frame_t, frame_t, door_h)),  # Right
    ]
    
    for loc, scale in frame_parts:
        bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
        f = bpy.context.active_object
        f.name = "DoorFrame"
        f.scale = scale
        bpy.ops.object.transform_apply(scale=True)
        f.data.materials.append(frame_mat)
    
    # Door panel
    bpy.ops.mesh.primitive_cube_add(size=1, location=(door_x - 0.02, door_y, door_z))
    door = bpy.context.active_object
    door.name = "Door"
    door.scale = (0.04, door_w - 0.02, door_h - 0.02)
    bpy.ops.object.transform_apply(scale=True)
    door.data.materials.append(door_mat)
    
    # Door handle
    bpy.ops.mesh.primitive_cylinder_add(radius=0.015, depth=0.1, location=(door_x - 0.07, door_y - 0.35, 1.0))
    handle = bpy.context.active_object
    handle.name = "DoorHandle"
    handle.rotation_euler = (math.radians(90), 0, 0)
    bpy.ops.object.transform_apply(rotation=True)
    handle.data.materials.append(handle_mat)

def create_sofa(x, y, facing='back'):
    """Create a modern sofa."""
    sofa_mat = create_pbr_material("SofaFabric", (0.25, 0.28, 0.35, 1), roughness=0.85)
    leg_mat = create_pbr_material("SofaLeg", (0.15, 0.12, 0.1, 1), roughness=0.4, metallic=0.3)
    cushion_mat = create_pbr_material("Cushion", (0.3, 0.33, 0.4, 1), roughness=0.9)
    
    w, d, h = 2.0, 0.85, 0.4
    back_h = 0.45
    arm_w = 0.15
    
    rot = 0 if facing == 'back' else math.radians(180)
    
    # Base
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, h/2 + 0.1))
    base = bpy.context.active_object
    base.name = "SofaBase"
    base.scale = (w, d - 0.1, h)
    base.rotation_euler = (0, 0, rot)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    base.data.materials.append(sofa_mat)
    
    # Back rest
    back_y = y - d/2 + 0.1 if facing == 'back' else y + d/2 - 0.1
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, back_y, h + back_h/2 + 0.1))
    back = bpy.context.active_object
    back.name = "SofaBack"
    back.scale = (w - arm_w*2, 0.15, back_h)
    bpy.ops.object.transform_apply(scale=True)
    back.data.materials.append(sofa_mat)
    
    # Arms
    for side in [-1, 1]:
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x + side * (w/2 - arm_w/2), y, h/2 + 0.2))
        arm = bpy.context.active_object
        arm.name = "SofaArm"
        arm.scale = (arm_w, d - 0.1, h + 0.2)
        bpy.ops.object.transform_apply(scale=True)
        arm.data.materials.append(sofa_mat)
    
    # Cushions
    for i in range(3):
        cx = x + (i - 1) * 0.6
        bpy.ops.mesh.primitive_cube_add(size=1, location=(cx, y + 0.05, h + 0.15))
        cush = bpy.context.active_object
        cush.name = "SofaCushion"
        cush.scale = (0.55, 0.5, 0.12)
        bpy.ops.object.transform_apply(scale=True)
        cush.data.materials.append(cushion_mat)
    
    # Legs
    for lx, ly in [(x - w/2 + 0.1, y - d/2 + 0.1), (x + w/2 - 0.1, y - d/2 + 0.1),
                   (x - w/2 + 0.1, y + d/2 - 0.1), (x + w/2 - 0.1, y + d/2 - 0.1)]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.025, depth=0.1, location=(lx, ly, 0.05))
        leg = bpy.context.active_object
        leg.name = "SofaLeg"
        leg.data.materials.append(leg_mat)

def create_coffee_table(x, y):
    """Create a modern coffee table."""
    wood_mat = create_wood_material("TableWood", (0.4, 0.28, 0.18, 1))
    leg_mat = create_pbr_material("TableLeg", (0.1, 0.1, 0.1, 1), roughness=0.3, metallic=0.8)
    
    # Top
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, 0.4))
    top = bpy.context.active_object
    top.name = "TableTop"
    top.scale = (1.0, 0.5, 0.04)
    bpy.ops.object.transform_apply(scale=True)
    top.data.materials.append(wood_mat)
    
    # Legs
    for lx, ly in [(x - 0.4, y - 0.2), (x + 0.4, y - 0.2),
                   (x - 0.4, y + 0.2), (x + 0.4, y + 0.2)]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.02, depth=0.38, location=(lx, ly, 0.19))
        leg = bpy.context.active_object
        leg.name = "TableLeg"
        leg.data.materials.append(leg_mat)

def create_floor_lamp(x, y):
    """Create a modern floor lamp."""
    base_mat = create_pbr_material("LampBase", (0.15, 0.15, 0.15, 1), roughness=0.3, metallic=0.7)
    shade_mat = create_pbr_material("LampShade", (0.95, 0.92, 0.85, 1), roughness=0.8)
    
    # Base
    bpy.ops.mesh.primitive_cylinder_add(radius=0.15, depth=0.03, location=(x, y, 0.015))
    base = bpy.context.active_object
    base.name = "LampBase"
    base.data.materials.append(base_mat)
    
    # Pole
    bpy.ops.mesh.primitive_cylinder_add(radius=0.015, depth=1.5, location=(x, y, 0.78))
    pole = bpy.context.active_object
    pole.name = "LampPole"
    pole.data.materials.append(base_mat)
    
    # Shade
    bpy.ops.mesh.primitive_cone_add(radius1=0.2, radius2=0.12, depth=0.25, location=(x, y, 1.65))
    shade = bpy.context.active_object
    shade.name = "LampShade"
    shade.data.materials.append(shade_mat)

def create_rug(x, y, w=2.5, l=1.8):
    """Create a decorative rug."""
    rug_mat = create_pbr_material("Rug", (0.4, 0.35, 0.3, 1), roughness=0.95)
    
    bpy.ops.mesh.primitive_plane_add(size=1, location=(x, y, 0.005))
    rug = bpy.context.active_object
    rug.name = "Rug"
    rug.scale = (w, l, 1)
    bpy.ops.object.transform_apply(scale=True)
    rug.data.materials.append(rug_mat)

def create_plant(x, y):
    """Create a potted plant."""
    pot_mat = create_pbr_material("Pot", (0.75, 0.72, 0.68, 1), roughness=0.6)
    plant_mat = create_pbr_material("Plant", (0.2, 0.45, 0.2, 1), roughness=0.8)
    soil_mat = create_pbr_material("Soil", (0.25, 0.18, 0.12, 1), roughness=0.95)
    
    # Pot
    bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.25, location=(x, y, 0.125))
    pot = bpy.context.active_object
    pot.name = "Pot"
    pot.data.materials.append(pot_mat)
    
    # Soil
    bpy.ops.mesh.primitive_cylinder_add(radius=0.1, depth=0.02, location=(x, y, 0.24))
    soil = bpy.context.active_object
    soil.name = "Soil"
    soil.data.materials.append(soil_mat)
    
    # Plant (simple sphere cluster)
    for i in range(5):
        px = x + uniform(-0.08, 0.08)
        py = y + uniform(-0.08, 0.08)
        pz = 0.35 + uniform(0, 0.2)
        size = uniform(0.08, 0.15)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=size, location=(px, py, pz))
        leaf = bpy.context.active_object
        leaf.name = "PlantLeaf"
        leaf.data.materials.append(plant_mat)

def create_ceiling_light(x, y, height=2.8):
    """Create a ceiling light fixture."""
    fixture_mat = create_pbr_material("LightFixture", (0.9, 0.88, 0.85, 1), roughness=0.3)
    
    # Fixture base
    bpy.ops.mesh.primitive_cylinder_add(radius=0.15, depth=0.05, location=(x, y, height - 0.025))
    base = bpy.context.active_object
    base.name = "LightFixture"
    base.data.materials.append(fixture_mat)
    
    # Shade/diffuser
    bpy.ops.mesh.primitive_cylinder_add(radius=0.2, depth=0.08, location=(x, y, height - 0.09))
    shade = bpy.context.active_object
    shade.name = "LightShade"
    shade.data.materials.append(fixture_mat)

def create_picture_frame(x, z, wall='back'):
    """Create a picture frame on wall."""
    frame_mat = create_pbr_material("PictureFrame", (0.2, 0.18, 0.15, 1), roughness=0.4)
    art_mat = create_pbr_material("Art", (0.6, 0.55, 0.5, 1), roughness=0.9)
    
    y = 0.08 if wall == 'back' else None
    
    # Frame
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z))
    frame = bpy.context.active_object
    frame.name = "PictureFrame"
    frame.scale = (0.6, 0.03, 0.45)
    bpy.ops.object.transform_apply(scale=True)
    frame.data.materials.append(frame_mat)
    
    # Art/canvas
    bpy.ops.mesh.primitive_plane_add(size=1, location=(x, y + 0.02, z))
    art = bpy.context.active_object
    art.name = "Art"
    art.scale = (0.5, 1, 0.35)
    art.rotation_euler = (math.radians(90), 0, 0)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    art.data.materials.append(art_mat)

def setup_lighting(width, length, height=2.8):
    """Set up realistic interior lighting."""
    # Ceiling light
    bpy.ops.object.light_add(type='AREA', location=(width/2, length/2, height - 0.15))
    main = bpy.context.active_object
    main.name = "CeilingLight"
    main.data.energy = 200
    main.data.size = 0.4
    main.data.color = (1.0, 0.95, 0.9)
    
    # Window light (daylight)
    bpy.ops.object.light_add(type='SUN', location=(width/2, -2, height))
    sun = bpy.context.active_object
    sun.name = "Sunlight"
    sun.data.energy = 2.5
    sun.data.color = (1.0, 0.98, 0.95)
    sun.rotation_euler = (math.radians(55), 0, math.radians(15))
    
    # Ambient fill
    bpy.ops.object.light_add(type='AREA', location=(width/2, length/2, height/2))
    fill = bpy.context.active_object
    fill.name = "FillLight"
    fill.data.energy = 30
    fill.data.size = max(width, length) * 1.5

def setup_world():
    """Set up sky/environment."""
    world = bpy.data.worlds.new("World")
    bpy.context.scene.world = world
    world.use_nodes = True
    
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.6, 0.8, 1.0, 1)
    bg.inputs["Strength"].default_value = 0.3

def create_room(room_data, output_path):
    """Main function to create complete room."""
    width = room_data.get("width", 4)
    length = room_data.get("length", 5)
    height = room_data.get("height", 2.8)
    room_type = room_data.get("name", "").lower()
    
    print(f"Creating room: {width}x{length}m, height {height}m, type: {room_type}")
    
    clear_scene()
    
    # Structure
    create_floor(width, length)
    create_walls(width, length, height)
    create_ceiling(width, length, height)
    create_baseboards(width, length)
    create_window(width, length, height)
    create_door(width, length, height)
    
    # Furniture (adjust positions based on room size)
    center_x = width / 2
    center_y = length / 2
    
    # Sofa against back wall
    if width >= 3:
        sofa_x = min(center_x, width - 1.2)
        create_sofa(sofa_x, 1.0, facing='back')
    
    # Coffee table in front of sofa
    if width >= 2.5 and length >= 3:
        create_coffee_table(center_x, center_y - 0.3)
    
    # Rug under coffee table
    if width >= 2.5:
        create_rug(center_x, center_y, min(2.5, width - 1), min(1.8, length - 2))
    
    # Floor lamp in corner
    if width >= 3:
        create_floor_lamp(width - 0.4, 0.4)
    
    # Plant in opposite corner
    if width >= 2.5:
        create_plant(0.3, 0.3)
    
    # Ceiling light
    create_ceiling_light(center_x, center_y, height)
    
    # Picture frames
    if width >= 2.5:
        create_picture_frame(center_x - 0.5, height * 0.6, 'back')
        if width >= 3.5:
            create_picture_frame(center_x + 0.5, height * 0.55, 'back')
    
    # Lighting & environment
    setup_lighting(width, length, height)
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
