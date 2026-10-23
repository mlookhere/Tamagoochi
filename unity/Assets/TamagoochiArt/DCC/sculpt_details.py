"""Organic detail layer for Tamagoochi sculpt studies.

This is geometry with actual editable topology, not decorative 2D images.
Keep the silhouette expressive and distinct at mobile camera distance.
"""

import math

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
        fullness = max(0.035, math.sin(math.pi * t) ** 0.66)
        for column in range(sides):
            angle = math.tau * column / sides
            taper = width * (0.12 + 0.88 * fullness)
            radius = depth * (0.20 + 0.80 * fullness)
            lean = side * (0.10 * t * t + 0.025 * math.sin(math.pi * t))
            fold = -0.045 * math.sin(math.pi * t)
            if species == "sproutle":
                lean += side * 0.095 * t
            if species == "lunari":
                radius *= 0.77
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


def configure_tail_bands(material, cream, accent):
    """Smooth shader-defined ring markings that follow the modeled tail."""
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    surface = nodes.get("Principled BSDF")
    coordinates = nodes.new("ShaderNodeTexCoord")
    wave = nodes.new("ShaderNodeTexWave")
    wave.wave_type = "BANDS"
    wave.bands_direction = "X"
    wave.inputs["Scale"].default_value = 4.0
    wave.inputs["Distortion"].default_value = 1.25
    wave.inputs["Detail"].default_value = 3.0
    color = nodes.new("ShaderNodeValToRGB")
    color.color_ramp.elements[0].position = 0.40
    color.color_ramp.elements[0].color = cream
    color.color_ramp.elements[1].position = 0.62
    color.color_ramp.elements[1].color = accent
    links.new(coordinates.outputs["Generated"], wave.inputs["Vector"])
    links.new(wave.outputs["Fac"], color.inputs["Fac"])
    links.new(color.outputs["Color"], surface.inputs["Base Color"])
    configure_fur_shader(material)


def decorate_face(species, rig, sculpt_part, skin, palette):
    """Add geometry for framed eyes, cheek fur, brows and paw pads."""
    ivory, coral, pink, dark, shine, horn = palette

    def detail(name, location, scale, material, bone):
        obj = sculpt_part(name, location, scale, material, 0)
        skin(obj, rig, bone)
        return obj

    for side, suffix in ((-1, "L"), (1, "R")):
        cheek_x = side * 0.49
        for layer in range(4):
            obj = detail(
                "CheekTuft_" + suffix + "_" + str(layer),
                (
                    cheek_x + side * (0.025 + layer * 0.035),
                    -0.255 + layer * 0.035,
                    1.08 - layer * 0.11,
                ),
                (0.105 + layer * 0.009, 0.12, 0.075),
                ivory if layer % 3 else pink,
                "head",
            )
            obj.rotation_euler[1] = side * (0.26 + layer * 0.12)

        detail("LowerLid_" + suffix,
               (side * 0.24, -0.53, 1.095),
               (0.175, 0.025, 0.045), pink, "head")
        detail("Brow_" + suffix,
               (side * 0.25, -0.45, 1.40),
               (0.16, 0.034, 0.035), ivory, "head")
        detail("Iris_" + suffix,
               (side * 0.24, -0.573, 1.20),
               (0.088, 0.02, 0.11), coral, "head")
        detail("Pupil_" + suffix,
               (side * 0.24, -0.595, 1.20),
               (0.058, 0.012, 0.077), dark, "head")
        detail("CatchlightSm_" + suffix,
               (side * 0.18, -0.615, 1.14),
               (0.022, 0.008, 0.026), shine, "head")

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

    for spot in range(2):
        detail("FaceFreckle_L_" + str(spot),
               (-0.10 - spot * 0.12, -0.52 + spot * 0.055, 1.49),
               (0.022, 0.009, 0.024), coral, "head")
        detail("FaceFreckle_R_" + str(spot),
               (0.10 + spot * 0.12, -0.52 + spot * 0.055, 1.49),
               (0.022, 0.009, 0.024), coral, "head")

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
