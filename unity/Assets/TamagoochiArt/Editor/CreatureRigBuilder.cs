using System;
using System.Collections.Generic;
using UnityEditor;
using UnityEngine;

namespace Tamagoochi.Art.Editor
{
    /// <summary>
    /// Sculpt-prep mesh and bone rig study; keeps topology/assets editable for Blender or DCC.
    /// Generates a Puffino deformation-ready head/body/ears/tail without touching gameplay.
    /// </summary>
    public static class CreatureRigBuilder
    {
        private const string Root = "Assets/TamagoochiArt/Generated/SculptReady";
        private const string MeshFolder = Root + "/Meshes";
        private const string MatFolder = Root + "/Materials";
        private const string PrefabFolder = Root + "/Prefabs";
        private const int Sectors = 48;
        private const int Stacks = 32;

        [MenuItem("Tamagoochi/Art/Generate Sculpt-Ready Puffino Rig")]
        public static void Generate()
        {
            EnsureFolder(Root);
            EnsureFolder(MeshFolder);
            EnsureFolder(MatFolder);
            EnsureFolder(PrefabFolder);

            GameObject actor = new GameObject("puffino_sculpt_study");
            actor.AddComponent<CreatureIdentity>().Configure("puffino_sculpt_study", "puffino", "");
            Transform visual = Bone("VisualRoot", actor.transform, Vector3.zero);
            Transform body = Bone("BodyRoot", visual, new Vector3(0f, 0.63f, 0f));
            Transform head = Bone("Head", body, new Vector3(0f, 0.49f, 0.10f));
            Transform earL = Bone("EarRoot_L", head, new Vector3(-0.46f, 0.44f, -0.04f));
            Transform earTipL = Bone("EarTip_L", earL, new Vector3(-0.13f, 0.36f, 0f));
            Transform earR = Bone("EarRoot_R", head, new Vector3(0.46f, 0.44f, -0.04f));
            Transform earTipR = Bone("EarTip_R", earR, new Vector3(0.13f, 0.36f, 0f));
            Transform tail = Bone("TailRoot", body, new Vector3(0.51f, 0.03f, -0.34f));
            Transform tailTip = Bone("TailTip", tail, new Vector3(0.34f, 0.18f, -0.19f));
            Transform jaw = Bone("Jaw", head, new Vector3(0f, -0.33f, 0.43f));

            Material cream = Material("soft_ivory", new Color(1f, 0.90f, 0.79f));
            Material peach = Material("peach_fins", new Color(0.96f, 0.62f, 0.47f));
            Material pink = Material("inner_petals", new Color(0.99f, 0.76f, 0.72f));
            Material dark = Material("warm_eyes", new Color(0.21f, 0.10f, 0.12f));
            Material light = Material("eye_catchlight", Color.white);
            Material horn = Material("warm_horn", new Color(0.73f, 0.37f, 0.26f));

            Mesh torso = Ellipsoid("Body", new Vector3(0f, 0.60f, 0f),
                new Vector3(0.49f, 0.58f, 0.43f), false);
            Mesh facial = Ellipsoid("Face", new Vector3(0f, 1.16f, 0.11f),
                new Vector3(0.56f, 0.48f, 0.48f), true);
            Mesh earLeft = Ellipsoid("Ear_L", new Vector3(-0.57f, 1.77f, 0.09f),
                new Vector3(0.22f, 0.37f, 0.15f), false);
            Mesh earRight = Ellipsoid("Ear_R", new Vector3(0.57f, 1.77f, 0.09f),
                new Vector3(0.22f, 0.37f, 0.15f), false);
            Mesh tailMesh = Ellipsoid("Tail", new Vector3(0.75f, 0.76f, -0.50f),
                new Vector3(0.43f, 0.39f, 0.36f), false);

            if (facial.blendShapeCount != 4)
                throw new InvalidOperationException("The facial mesh must expose exactly four shapes.");

            torso = SaveMesh(torso, "puffino_body");
            facial = SaveMesh(facial, "puffino_face");
            earLeft = SaveMesh(earLeft, "puffino_ear_left");
            earRight = SaveMesh(earRight, "puffino_ear_right");
            tailMesh = SaveMesh(tailMesh, "puffino_tail");

            Skin("BodyMesh", visual, torso, cream, new[] { body, head },
                v => Mathf.SmoothStep(0f, 0.32f, Mathf.InverseLerp(0.76f, 1.16f, v.y)));
            SkinnedMeshRenderer faceRenderer = Skin("FaceMesh", visual, facial, cream,
                new[] { head }, v => 0f);
            Skin("EarMesh_L", visual, earLeft, peach, new[] { earL, earTipL },
                v => Mathf.InverseLerp(1.48f, 2.10f, v.y));
            Skin("EarMesh_R", visual, earRight, peach, new[] { earR, earTipR },
                v => Mathf.InverseLerp(1.48f, 2.10f, v.y));
            Skin("TailMesh", visual, tailMesh, peach, new[] { tail, tailTip },
                v => Mathf.InverseLerp(0.47f, 1.14f, v.x));

            Ellipse("InnerEar_L", earL, pink, new Vector3(-0.08f, 0.18f, 0.16f),
                new Vector3(0.15f, 0.27f, 0.045f));
            Ellipse("InnerEar_R", earR, pink, new Vector3(0.08f, 0.18f, 0.16f),
                new Vector3(0.15f, 0.27f, 0.045f));
            Ellipse("Horn_L", head, horn, new Vector3(-0.19f, 0.48f, 0.06f),
                new Vector3(0.11f, 0.19f, 0.11f));
            Ellipse("Horn_R", head, horn, new Vector3(0.19f, 0.48f, 0.06f),
                new Vector3(0.11f, 0.19f, 0.11f));
            Ellipse("Paw_L", body, cream, new Vector3(-0.48f, -0.04f, 0.27f),
                new Vector3(0.21f, 0.21f, 0.23f));
            Ellipse("Paw_R", body, cream, new Vector3(0.48f, -0.04f, 0.27f),
                new Vector3(0.21f, 0.21f, 0.23f));
            Ellipse("Foot_L", body, peach, new Vector3(-0.32f, -0.48f, 0.28f),
                new Vector3(0.25f, 0.13f, 0.25f));
            Ellipse("Foot_R", body, peach, new Vector3(0.32f, -0.48f, 0.28f),
                new Vector3(0.25f, 0.13f, 0.25f));

            Transform eyeL = Ellipse("Eye_L", head, dark,
                new Vector3(-0.24f, 0.02f, 0.53f), new Vector3(0.15f, 0.17f, 0.07f));
            Transform eyeR = Ellipse("Eye_R", head, dark,
                new Vector3(0.24f, 0.02f, 0.53f), new Vector3(0.15f, 0.17f, 0.07f));
            Ellipse("Glint_L", eyeL, light, new Vector3(-0.045f, 0.06f, 0.06f),
                new Vector3(0.04f, 0.04f, 0.025f));
            Ellipse("Glint_R", eyeR, light, new Vector3(-0.045f, 0.06f, 0.06f),
                new Vector3(0.04f, 0.04f, 0.025f));
            Ellipse("Nose", head, horn, new Vector3(0f, -0.17f, 0.59f),
                new Vector3(0.065f, 0.04f, 0.04f));
            Ellipse("JawMouth", jaw, dark, new Vector3(0f, 0f, 0.04f),
                new Vector3(0.12f, 0.075f, 0.05f));

            CreatureMotion motion = actor.AddComponent<CreatureMotion>();
            motion.Configure(visual, head, earL, earR, tail, null, null);
            CreatureFacialRig faceRig = actor.AddComponent<CreatureFacialRig>();
            faceRig.Configure(faceRenderer, eyeL, eyeR);
            actor.AddComponent<CreaturePerformance>().Configure(motion, faceRig);
            SphereCollider collider = actor.AddComponent<SphereCollider>();
            collider.center = new Vector3(0f, 0.86f, 0f);
            collider.radius = 0.88f;

            PrefabUtility.SaveAsPrefabAsset(actor, PrefabFolder + "/puffino_sculpt_study.prefab");
            UnityEngine.Object.DestroyImmediate(actor);
            AssetDatabase.SaveAssets();
            Debug.Log("Puffino sculpt study: 5 authored UV-mesh components, 9+1 bones, " +
                "four head blend shapes and synchronized gesture/expression controls created.");
        }

        [MenuItem("Tamagoochi/Art/Audit Sculpt-Ready Puffino")]
        public static void Audit()
        {
            GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(
                PrefabFolder + "/puffino_sculpt_study.prefab");
            if (!prefab || !prefab.GetComponent<CreaturePerformance>())
                throw new InvalidOperationException("Missing sculpt-ready Puffino prefab. Run generator first.");

            SkinnedMeshRenderer[] renderers =
                prefab.GetComponentsInChildren<SkinnedMeshRenderer>(true);
            if (renderers.Length != 5)
                throw new InvalidOperationException("Expected five skinned mesh components.");

            int blends = 0;
            foreach (SkinnedMeshRenderer renderer in renderers)
            {
                if (!renderer.sharedMesh || renderer.bones.Length == 0)
                    throw new InvalidOperationException("Mesh or skinning bones missing: " + renderer.name);
                if (renderer.sharedMesh.vertexCount < 1000)
                    throw new InvalidOperationException("Unexpectedly low topology: " + renderer.name);
                blends += renderer.sharedMesh.blendShapeCount;
            }
            if (blends != 4)
                throw new InvalidOperationException("Expected 4 facial blend shapes; found " + blends);
            Debug.Log("Sculpt study audit passed: 5 UV meshes, bones, skin weights, 4 blend shapes.");
        }

        private static Transform Bone(string name, Transform parent, Vector3 position)
        {
            Transform joint = new GameObject(name).transform;
            joint.SetParent(parent, false);
            joint.localPosition = position;
            return joint;
        }

        private static void EnsureFolder(string path)
        {
            if (AssetDatabase.IsValidFolder(path)) return;
            int slash = path.LastIndexOf('/');
            EnsureFolder(path.Substring(0, slash));
            AssetDatabase.CreateFolder(path.Substring(0, slash), path.Substring(slash + 1));
        }

        private static Material Material(string name, Color color)
        {
            string path = MatFolder + "/" + name + ".mat";
            Material mat = AssetDatabase.LoadAssetAtPath<Material>(path);
            if (!mat)
            {
                Shader shader = Shader.Find("Universal Render Pipeline/Lit");
                if (!shader) shader = Shader.Find("Standard");
                if (!shader) throw new InvalidOperationException("No supported lit shader found.");
                mat = new Material(shader);
                AssetDatabase.CreateAsset(mat, path);
            }
            if (mat.HasProperty("_BaseColor")) mat.SetColor("_BaseColor", color);
            if (mat.HasProperty("_Color")) mat.SetColor("_Color", color);
            EditorUtility.SetDirty(mat);
            return mat;
        }

        private static Transform Ellipse(string name, Transform parent, Material material,
            Vector3 position, Vector3 scale)
        {
            GameObject obj = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            obj.name = name;
            obj.transform.SetParent(parent, false);
            obj.transform.localPosition = position;
            obj.transform.localScale = scale;
            obj.GetComponent<Renderer>().sharedMaterial = material;
            Collider collider = obj.GetComponent<Collider>();
            if (collider) UnityEngine.Object.DestroyImmediate(collider);
            return obj.transform;
        }

        private static Mesh Ellipsoid(string name, Vector3 center, Vector3 radii, bool face)
        {
            List<Vector3> positions = new List<Vector3>();
            List<Vector2> uvs = new List<Vector2>();
            List<int> triangles = new List<int>();
            for (int latitude = 0; latitude <= Stacks; latitude++)
            {
                float theta = Mathf.PI * latitude / Stacks;
                float y = Mathf.Cos(theta);
                float ring = Mathf.Sin(theta);
                for (int longitude = 0; longitude <= Sectors; longitude++)
                {
                    float phi = 2f * Mathf.PI * longitude / Sectors;
                    float x = Mathf.Cos(phi) * ring;
                    float z = Mathf.Sin(phi) * ring;
                    Vector3 vertex = center + Vector3.Scale(new Vector3(x, y, z), radii);

                    // Tiny coherent cheek sculpt, not noisy random surface displacement.
                    if (face && z > 0.42f && Mathf.Abs(x) > 0.3f && y < 0.15f)
                        vertex.x += Mathf.Sign(x) * 0.018f;
                    positions.Add(vertex);
                    uvs.Add(new Vector2(longitude / (float)Sectors, latitude / (float)Stacks));
                }
            }
            for (int latitude = 0; latitude < Stacks; latitude++)
            {
                for (int longitude = 0; longitude < Sectors; longitude++)
                {
                    int a = latitude * (Sectors + 1) + longitude;
                    int b = a + 1;
                    int c = a + Sectors + 1;
                    triangles.Add(a);
                    triangles.Add(b);
                    triangles.Add(c);
                    triangles.Add(b);
                    triangles.Add(c + 1);
                    triangles.Add(c);
                }
            }

            Mesh mesh = new Mesh { name = name };
            mesh.SetVertices(positions);
            mesh.SetTriangles(triangles, 0);
            mesh.SetUVs(0, uvs);
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();
            if (face) AddFacialShapes(mesh, positions);
            return mesh;
        }

        private static void AddFacialShapes(Mesh mesh, List<Vector3> positions)
        {
            foreach (string name in new[] { "Smile", "Pout", "CheekPuff", "Curious" })
            {
                Vector3[] delta = new Vector3[positions.Count];
                Vector3[] zero = new Vector3[positions.Count];
                for (int i = 0; i < delta.Length; i++)
                {
                    Vector3 v = positions[i];
                    float front = Mathf.SmoothStep(0f, 1f, Mathf.InverseLerp(0.33f, 0.63f, v.z));
                    float mouth = 1f - Mathf.Clamp01(Mathf.Abs(v.x) / 0.42f);
                    float lower = 1f - Mathf.Clamp01(Mathf.Abs(v.y - 0.94f) / 0.32f);
                    float cheek = 1f - Mathf.Clamp01(Mathf.Abs(Mathf.Abs(v.x) - 0.34f) / 0.27f);
                    if (name == "Smile")
                        delta[i] = new Vector3(0f, 0.064f * front * lower * mouth,
                            0.035f * front * lower);
                    if (name == "Pout")
                        delta[i] = new Vector3(0f, -0.065f * front * lower * mouth,
                            0.038f * front * lower);
                    if (name == "CheekPuff")
                        delta[i] = new Vector3(Mathf.Sign(v.x) * 0.065f * cheek * front,
                            0f, 0.03f * cheek * front);
                    if (name == "Curious" && v.x > 0f && v.y > 1.23f)
                        delta[i] = new Vector3(0f, 0.05f * front, 0f);
                }
                mesh.AddBlendShapeFrame(name, 100f, delta, zero, zero);
            }
        }

        private static Mesh SaveMesh(Mesh mesh, string filename)
        {
            string path = MeshFolder + "/" + filename + ".asset";
            Mesh existing = AssetDatabase.LoadAssetAtPath<Mesh>(path);
            if (existing)
            {
                // Preserve Unity GUIDs and prefab references during regeneration.
                EditorUtility.CopySerialized(mesh, existing);
                UnityEngine.Object.DestroyImmediate(mesh);
                EditorUtility.SetDirty(existing);
                return existing;
            }
            AssetDatabase.CreateAsset(mesh, path);
            return mesh;
        }

        private static SkinnedMeshRenderer Skin(string name, Transform parent, Mesh mesh,
            Material material, Transform[] bones, Func<Vector3, float> tipWeight)
        {
            GameObject obj = new GameObject(name);
            obj.transform.SetParent(parent, false);
            SkinnedMeshRenderer renderer = obj.AddComponent<SkinnedMeshRenderer>();
            renderer.sharedMaterial = material;

            Vector3[] vertices = mesh.vertices;
            BoneWeight[] weights = new BoneWeight[vertices.Length];
            for (int i = 0; i < vertices.Length; i++)
            {
                float t = bones.Length == 1 ? 0f : Mathf.Clamp01(tipWeight(vertices[i]));
                weights[i] = new BoneWeight
                {
                    boneIndex0 = 0, weight0 = 1f - t,
                    boneIndex1 = bones.Length == 1 ? 0 : 1, weight1 = t
                };
            }
            Matrix4x4[] binds = new Matrix4x4[bones.Length];
            for (int i = 0; i < bones.Length; i++)
                binds[i] = bones[i].worldToLocalMatrix * renderer.transform.localToWorldMatrix;
            mesh.boneWeights = weights;
            mesh.bindposes = binds;
            EditorUtility.SetDirty(mesh);
            renderer.sharedMesh = mesh;
            renderer.bones = bones;
            renderer.rootBone = bones[0];
            renderer.localBounds = new Bounds(new Vector3(0f, 1f, 0f), new Vector3(3f, 3.5f, 2.5f));
            return renderer;
        }
    }
}
