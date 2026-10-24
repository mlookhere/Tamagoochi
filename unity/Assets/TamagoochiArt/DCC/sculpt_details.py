"""Editable organic meshes, sculpt UVs, and creature fur materials."""

import math
from pathlib import Path

import bpy


def petal_ear(name, location, dimensions, material, side, species, inner_material):
    """Folded petal with an inset, colored front surface in one deformable mesh."""
    width, depth, height = dimensions
    rings, sides = ((32, 24) if species == "puffino" else (20, 20))
    vertices, faces = [], []
    for row in range(rings + 1):
        t = row / rings
        fullness = max(0.035, math.sin(math.pi * t)**0.55)
        taper = width * (0.09 + 0.91 * fullness)
        radius = depth * (0.18 + 0.82 * fullness)
        lean = side * (0.13 * t*t + 0.035 * math.sin(math.pi*t))
        taper *= {"puffino": 2.12*(0.82+0.18*t), "sproutle": 1.15,
                  "lunari": 0.65, "bubblin": 1.20}.get(species, 1.0)
        radius *= {"puffino": 1.45, "lunari": 0.77}.get(species, 1.0)
        lean += side * {"puffino": 0.12*t+0.11*math.sin(math.pi*t),
                        "sproutle": 0.23*t, "lunari": -0.06*math.sin(math.pi*t),
                        "bubblin": 0.24*t*t}.get(species, 0.0)
        for column in range(sides):
            angle = math.tau * column / sides
            front = max(0.0, -math.sin(angle))
            cup = (0.075 if species == "puffino" else 0.045) * fullness * front**8
            vertices.append((taper*math.cos(angle) + lean,
                             radius*math.sin(angle) - 0.04*fullness + cup,
                             (t-0.5)*height + (0.028*fullness*math.cos(3*angle+4*t)
                                               if species == "puffino" else 0)))
            if row < rings:
                a = row*sides + column
                b = row*sides + (column+1) % sides
                faces.append((a, b, b+sides, a+sides))
    faces.extend((tuple(reversed(range(sides))), tuple(rings*sides+i for i in range(sides))))
    mesh = bpy.data.meshes.new(name + "Topology")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    layer = mesh.uv_layers.new(name="UVMap")
    mesh.materials.append(material)
    mesh.materials.append(inner_material)
    for face in mesh.polygons:
        side_index = face.index % sides
        row = face.index // sides
        if face.index < rings*sides:
            face.material_index = int(2 < row < rings-2
                and math.sin(math.tau*(side_index+0.5)/sides) < -0.45)
        face.use_smooth = face.index < rings*sides
        for loop in face.loop_indices:
            index = mesh.loops[loop].vertex_index
            if face.index < rings*sides:
                u = (side_index + int(index%sides != side_index))/sides
                layer.data[loop].uv = (u, index//sides/rings)
            else:
                angle = math.tau*(index%sides)/sides
                layer.data[loop].uv = (0.5+0.48*math.cos(angle),
                                       0.5+0.48*math.sin(angle))
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    bevel = obj.modifiers.new("SoftPetalEdges", "BEVEL")
    bevel.width = 0.012
    bevel.segments = 2
    obj.modifiers.new("WeightedNormals", "WEIGHTED_NORMAL")
    return obj


def curled_puffino_tail(material, profile):
    from mathutils import Vector
    rings, sides = (40, 24) if profile == "sculpt" else (24, 16)
    pivot = Vector((0.53, 0.32, 0.75))
    p0, p1 = Vector((0.25, 0.28, 0.61)), Vector((0.74, 0.39, 0.36))
    p2, p3 = Vector((1.45, 0.46, 0.69)), Vector((1.03, 0.41, 1.18))
    vertices, faces = [], []
    for i in range(rings + 1):
        t = i / rings
        u = 1 - t
        center = u**3 * p0 + 3 * u*u*t * p1 + 3 * u*t*t * p2 + t**3 * p3
        tangent = (3*u*u*(p1-p0) + 6*u*t*(p2-p1) + 3*t*t*(p3-p2)).normalized()
        across = Vector((-tangent.z, 0, tangent.x)).normalized()
        depth = tangent.cross(across).normalized()
        fullness = max(0.0, math.sin(math.pi * t))**0.42
        rounded_tip = 0.13 * math.exp(-((t-0.81)/0.16)**2)
        radius = 0.018 + 0.33 * fullness + rounded_tip + 0.07 * u**7
        for j in range(sides):
            angle = math.tau * j / sides
            scallop = 1 + fullness**2 * (0.125*math.sin(5*angle+10*t)
                                          + 0.050*math.sin(7*angle-6*t))
            point = center + radius * scallop * (math.cos(angle)*across + math.sin(angle)*depth)
            vertices.append(tuple(point-pivot))
            if i < rings:
                nxt = i*sides + (j+1) % sides
                faces.append((i*sides+j, nxt, nxt+sides, (i+1)*sides+j))
    faces.extend((tuple(reversed(range(sides))), tuple(rings*sides+j for j in range(sides))))
    mesh = bpy.data.meshes.new("PuffinoTailQuads")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    layer = mesh.uv_layers.new(name="UVMap")
    for face in mesh.polygons:
        face.use_smooth = True
        for loop in face.loop_indices:
            vi = mesh.loops[loop].vertex_index
            layer.data[loop].uv = ((face.index%sides + int(vi%sides != face.index%sides))/sides, vi//sides/rings)
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
    image = bpy.data.images.new(name=material.name + "_Albedo", width=size, height=size, alpha=True)
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
            fiber = abs(math.sin(math.tau * 24 * u + 0.45 * math.sin(math.tau * 4 * v)))**20
            broken = abs(math.sin(math.tau * 35 * v + 5 * u))**6
            strength = 0.10 if material.name.endswith("_Body") else 0.025
            texture = 0.96 + strength * fiber * broken + 0.027 * math.sin(math.tau * (11 * u + 17 * v))
            pixels.extend((*[min(1.0, max(0.0, base[c] * texture)) for c in range(3)], 1.0))

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
    material.node_tree.links.new(node.outputs["Color"], surface.inputs["Base Color"])


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

    lid_y, brow_y = (-0.60, -0.565) if species == "puffino" else (-0.455, -0.45)
    for side, suffix in ((-1, "L"), (1, "R")):
        detail("LowerLid_" + suffix,
               (side * 0.24, lid_y, 1.085),
               (0.155, 0.014, 0.024), pink, "head")
        detail("Brow_" + suffix,
               (side * 0.25, brow_y, 1.40),
               (0.16, 0.034, 0.035), ivory, "head")

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
