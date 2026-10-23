"""Organic detail layer for Tamagoochi sculpt studies.

This is geometry with actual editable topology, not decorative 2D images.
Keep the silhouette expressive and distinct at mobile camera distance.
"""

import math
from pathlib import Path

import bpy


def petal_ear(name, location, dimensions, material, side, species):
    """Create a softly swept, tapered quad-ring ear rather than a scaled sphere."""
    width, depth, height = dimensions
    rings = 18
    sides = 16
    vertices = []
    faces = []
    uvs = []

    for row in range(rings + 1):
        t = row / rings
        fullness = max(0.035, math.sin(math.pi * t) ** (0.32 if species == "bubblin" else 0.66))
        for column in range(sides):
            angle = math.tau * column / sides
            taper = width * (0.12 + 0.88 * fullness)
            radius = depth * (0.20 + 0.80 * fullness)
            lean = side * (0.10 * t * t + 0.025 * math.sin(math.pi * t))
            fold = -0.045 * math.sin(math.pi * t)
            if species == "sproutle":
                lean += side * 0.23 * t
                taper *= 1.15
            elif species == "lunari":
                lean -= side * 0.06 * math.sin(math.pi * t)
                taper *= 0.65
                radius *= 0.77
            elif species == "bubblin":
                lean += side * 0.24 * t * t
                taper *= 1.20
            vertices.append((
                taper * math.cos(angle) + lean,
                radius * math.sin(angle) + fold,
                (t - 0.5) * height,
            ))
            uvs.append((column / sides, t))

    for row in range(rings):
        for column in range(sides):
            a = row * sides + column
            b = row * sides + (column + 1) % sides
            c = a + sides
            d = b + sides
            faces.append((a, b, d, c))

    faces.append(tuple(reversed(range(sides))))
    offset = rings * sides
    faces.append(tuple(offset + i for i in range(sides)))

    mesh = bpy.data.meshes.new(name + "Topology")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    uv_layer = mesh.uv_layers.new(name="UVMap")
    for face in mesh.polygons:
        for loop in face.loop_indices:
            uv_layer.data[loop].uv = uvs[mesh.loops[loop].vertex_index]

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    obj.data.materials.append(material)
    for face in mesh.polygons:
        face.use_smooth = True
    bevel = obj.modifiers.new("SoftPetalEdges", "BEVEL")
    bevel.width = 0.012
    bevel.segments = 2
    normals = obj.modifiers.new("WeightedNormals", "WEIGHTED_NORMAL")
    return obj



def curled_puffino_tail(material, profile):
    """UV-mapped plush quad tail attached to the body."""
    from mathutils import Vector
    rings, sides = (32, 20) if profile == "sculpt" else (18, 12)
    pivot = Vector((0.53, 0.32, 0.75))
    vertices, faces, uv = [], [], []
    for i in range(rings + 1):
        t = i / rings
        phase = math.pi * t
        center = Vector((0.23 + 0.92 * t - 0.42 * t * t,
                         0.30 + 0.10 * t + 0.04 * t * t,
                         0.56 + 0.58 * math.sin(0.66 * phase) - 0.10 * t))
        tangent = Vector((0.92 - 0.84 * t, 0.10 + 0.08 * t,
                          0.58 * 0.66 * math.pi * math.cos(0.66 * phase) - 0.10)).normalized()
        across = Vector((-tangent.z, 0, tangent.x)).normalized()
        depth = tangent.cross(across).normalized()
        radius = 0.012 + 0.34 * math.sin(phase) ** 0.8
        for j in range(sides):
            angle = math.tau * j / sides
            tuft = 1 + 0.035 * math.sin(5 * angle + 7 * t)
            point = center + radius * tuft * (math.cos(angle) * across + math.sin(angle) * depth)
            vertices.append(tuple(point - pivot))
            uv.append((j / sides, t))
            if i < rings:
                nxt = i * sides + (j + 1) % sides
                faces.append((i * sides + j, nxt, nxt + sides, (i + 1) * sides + j))
    faces.extend((tuple(reversed(range(sides))), tuple(rings * sides + j for j in range(sides))))
    mesh = bpy.data.meshes.new("PuffinoTailQuads")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    layer = mesh.uv_layers.new(name="UVMap")
    for face in mesh.polygons:
        face.use_smooth = True
        for loop in face.loop_indices:
            layer.data[loop].uv = uv[mesh.loops[loop].vertex_index]
    obj = bpy.data.objects.new("Tail", mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = pivot
    obj.data.materials.append(material)
    return obj

def configure_fur_shader(material):
    """Subtle micro-roughness/bump; no heavy realtime strand simulation."""
    if not material.use_nodes:
        return
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    surface = nodes.get("Principled BSDF")
    if surface is None:
        return
    micro = nodes.new("ShaderNodeTexNoise")
    micro.name = "OrganicMicroFur"
    micro.inputs["Scale"].default_value = 185.0
    micro.inputs["Detail"].default_value = 2.0
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.07
    bump.inputs["Distance"].default_value = 0.012
    links.new(micro.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], surface.inputs["Normal"])


def configure_fur_albedo(material, base, texture_dir=None, eye=False):
    """UV-friendly handoff color map that survives Blender-to-glTF export."""
    size = 256
    image = bpy.data.images.new(
        name=material.name + "_Albedo", width=size, height=size, alpha=True)
    pixels = []
    for row in range(size):
        v = row / max(1, size - 1)
        for column in range(size):
            u = column / max(1, size - 1)
            if eye:
                x, y = 2 * u - 1, 2 * v - 1
                radius = math.hypot(x, y)
                if radius < 0.38:
                    color = (0.055, 0.040, 0.065)
                elif radius < 0.87:
                    shade = 0.65 + 0.65 * (radius - 0.38) / 0.49
                    color = tuple(min(1.0, base[c] * shade) for c in range(3))
                else:
                    color = (0.075, 0.052, 0.075)
                if (x + 0.30) ** 2 + (y - 0.34) ** 2 < 0.028:
                    color = (1.0, 0.98, 0.94)
                pixels.extend((*color, 1.0))
                continue
            texture = 0.975 + 0.018 * math.sin(61.0 * u + 71.0 * v)
            texture += 0.007 * math.sin(173.0 * u - 131.0 * v)
            light = 0.98 + 0.035 * v
            pixels.extend((min(1.0, base[c] * texture * light) for c in range(3)))
            pixels.append(1.0)

    image.pixels.foreach_set(pixels)
    image.update()
    if texture_dir is not None:
        destination = Path(texture_dir) / "Textures"
        destination.mkdir(parents=True, exist_ok=True)
        image.filepath_raw = str(destination / (image.name + ".png"))
        image.file_format = "PNG"
        image.save()
    else:
        image.pack()

    surface = material.node_tree.nodes.get("Principled BSDF")
    node = material.node_tree.nodes.new("ShaderNodeTexImage")
    node.name = "ExportableFurAlbedo"
    node.image = image
    material.node_tree.links.new(
        node.outputs["Color"], surface.inputs["Base Color"])


def configure_tail_bands(material, cream, accent, texture_dir=None, pattern="puffino"):
    """Exportable UV albedo stripes. Do not rely on Blender-only wave shaders."""
    size = 256
    name = material.name + "_Albedo"
    image = bpy.data.images.new(name=name, width=size, height=size, alpha=True)
    pixels = []
    for row in range(size):
        v = row / max(1, size - 1)
        for column in range(size):
            u = column / max(1, size - 1)
            warp = 0.055 * math.sin(math.tau * (u * 2.0 + v * 0.7))
            if pattern == "lunari":
                blend = 0.35 + 0.50 * (0.5 + 0.5 * math.sin(math.tau * (u * 1.2 + v * 0.30)))
            elif pattern == "sproutle":
                blend = 0.20 + 0.65 * max(0.0, 1.0 - abs(u - 0.5) * 1.8)
            elif pattern == "bubblin":
                blend = 0.50 + 0.30 * math.sin(math.tau * u * 2.0) * math.sin(math.tau * v * 1.5)
            else:
                wave = math.sin(math.tau * (3.5 * v + warp))
                blend = max(0.0, min(1.0, 0.5 + wave * 2.2))
            grain = 0.975 + 0.025 * math.sin(191.0 * u + 173.0 * v)
            pixels.extend((
                (cream[channel] * (1.0 - blend) + accent[channel] * blend) * grain
                for channel in range(3)
            ))
            pixels.append(1.0)

    image.pixels.foreach_set(pixels)
    image.update()
    if texture_dir is not None:
        destination = Path(texture_dir) / "Textures"
        destination.mkdir(parents=True, exist_ok=True)
        image.filepath_raw = str(destination / (name + ".png"))
        image.file_format = "PNG"
        image.save()
    else:
        # Keep a generated image in the source .blend for QA-only runs.
        image.pack()

    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    surface = nodes.get("Principled BSDF")
    texture = nodes.new("ShaderNodeTexImage")
    texture.name = "ExportableTailAlbedo"
    texture.image = image
    texture.interpolation = "Linear"
    links.new(texture.outputs["Color"], surface.inputs["Base Color"])
    configure_fur_shader(material)

def decorate_face(species, rig, sculpt_part, skin, palette):
    """Add geometry for framed eyes, cheek fur, brows and paw pads."""
    ivory, coral, pink, dark, shine, horn = palette

    def detail(name, location, scale, material, bone):
        obj = sculpt_part(name, location, scale, material, 0)
        skin(obj, rig, bone)
        return obj

    for side, suffix in ((-1, "L"), (1, "R")):
        detail("LowerLid_" + suffix,
               (side * 0.24, -0.50, 1.085),
               (0.185, 0.022, 0.035), pink, "head")
        detail("Brow_" + suffix,
               (side * 0.25, -0.45, 1.40),
               (0.16, 0.034, 0.035), ivory, "head")

        for pad in range(3):
            detail(
                "ToePad_" + suffix + "_" + str(pad),
                (
                    side * (0.29 + pad * 0.040),
                    -0.465,
                    0.105,
                ),
                (0.043, 0.020, 0.024), pink, "body")

    for tuft in range(3):
        detail("ForelockPetal_" + str(tuft),
               ((tuft - 1) * 0.18, -0.205, 1.605 + (tuft == 1) * 0.055),
               (0.115, 0.135, 0.105), ivory, "head")

    if species == "sproutle":
        for side in (-1, 1):
            detail("LeafFrill_" + str(side),
                   (side * 0.62, 0.18, 0.93),
                   (0.12, 0.11, 0.28), coral, "body")
    if species == "bubblin":
        for index in range(4):
            detail("BubbleNeck_" + str(index),
                   ((index - 1.5) * 0.24, 0.21, 0.77),
                   (0.13, 0.13, 0.13), pink, "body")
    if species == "lunari":
        detail("MoonSigil", (0.0, -0.475, 1.47),
               (0.10, 0.015, 0.10), shine, "head")
