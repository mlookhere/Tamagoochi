using System;
using System.Collections.Generic;
using UnityEditor;
using UnityEngine;

namespace Tamagoochi.Art.Editor
{
    /// <summary>
    /// Procedural prototype kit: seven original creatures, five props, and reusable clip blockouts.
    /// Run from the Unity Editor; do not mistake these generated primitives for final sculpted art.
    /// </summary>
    public static class CreatureKitBuilder
    {
        private const string Root = "Assets/TamagoochiArt/Generated";
        private const string Materials = Root + "/Materials";
        private const string Prefabs = Root + "/Prefabs";
        private const string Clips = Root + "/Animations";
        private static readonly Dictionary<string, Material> Cache = new Dictionary<string, Material>();

        private readonly struct Species
        {
            internal readonly string Id, Base, Affinity, Main, Accent, Detail, Eye, Highlight;
            internal readonly int Shape;

            internal Species(string id, string main, string accent, string detail, string eye,
                string highlight, int shape = 0, string origin = null, string affinity = "")
            {
                Id = id;
                Base = origin ?? id;
                Affinity = affinity;
                Main = main;
                Accent = accent;
                Detail = detail;
                Eye = eye;
                Highlight = highlight;
                Shape = shape;
            }
        }

        // Shape: 0 petal-ear + ringtail, 1 astral fins, 2 leaf ears,
        // 3 bubbles; 4 forest evolved, 5 lunar evolved, 6 ember evolved.
        private static readonly Species[] Starters =
        {
            new Species("puffino", "#FFF0DA", "#F2A17E", "#C96849", "#452D30", "#FFFFFF"),
            new Species("lunari", "#F8F3F1", "#A1B8EF", "#7975CA", "#393F76", "#FFFFFF", 1),
            new Species("sproutle", "#FFF3D9", "#A7CA7C", "#688F50", "#394832", "#FFFFFF", 2),
            new Species("bubblin", "#FFF0F3", "#F4A2C6", "#AC80C9", "#563757", "#FFFFFF", 3),
            new Species("puffino_forest", "#FFF0DA", "#98B975", "#517A4D", "#452D30", "#FFFFFF",
                4, "puffino", "forest"),
            new Species("puffino_lunar", "#FFF0DA", "#A99CE8", "#6658A5", "#452D50", "#FFFFFF",
                5, "puffino", "lunar"),
            new Species("puffino_ember", "#FFF0DA", "#F58F5B", "#BC403D", "#513037", "#FFFFFF",
                6, "puffino", "ember")
        };

        private static readonly string[] Actions =
        {
            "Idle", "Wiggle", "Walk", "Run", "Hop", "Eat", "Sleep", "Play",
            "Happy", "Sad", "Curious", "Startled", "Pickup", "Return",
            "Nuzzle", "Evolution"
        };

        [MenuItem("Tamagoochi/Art/Generate Stylized 3D Starter Kit")]
        public static void Generate()
        {
            EnsureFolder(Root);
            EnsureFolder(Materials);
            EnsureFolder(Prefabs);
            EnsureFolder(Clips);
            Cache.Clear();

            foreach (Species species in Starters)
                CreateCreature(species);

            CreateProps();
            CreateCatalog();
            foreach (string action in Actions)
                CreateClip(action);

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Debug.Log("Tamagoochi: generated prototype assets under " + Root +
                ". Validate with Tamagoochi > Art > Audit Starter Kit.");
        }

        [MenuItem("Tamagoochi/Art/Audit Starter Kit")]
        public static void Audit()
        {
            List<string> missing = new List<string>();
            foreach (Species species in Starters)
            {
                string path = Prefabs + "/" + species.Id + ".prefab";
                GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(path);
                if (!prefab || !prefab.GetComponent<CreatureMotion>() ||
                    !prefab.GetComponent<CreatureIdentity>())
                    missing.Add(path);
            }

            string[] props = { "berry", "play_ball", "sleep_cushion", "flower_pot", "food_bowl" };
            foreach (string item in props)
            {
                string path = Prefabs + "/prop_" + item + ".prefab";
                if (!AssetDatabase.LoadAssetAtPath<GameObject>(path)) missing.Add(path);
            }

            foreach (string action in Actions)
            {
                string path = Clips + "/" + action + ".anim";
                if (!AssetDatabase.LoadAssetAtPath<AnimationClip>(path)) missing.Add(path);
            }

            CreatureCatalog catalog = AssetDatabase.LoadAssetAtPath<CreatureCatalog>(
                Root + "/CreatureCatalog.asset");
            if (!catalog || catalog.CreatureCount != Starters.Length || catalog.PropCount != 5)
                missing.Add(Root + "/CreatureCatalog.asset");

            if (missing.Count > 0)
                throw new InvalidOperationException("Missing/invalid generated assets:\n" +
                    string.Join("\n", missing));
            Debug.Log("Tamagoochi art audit: 7 creature prefabs, 5 prop prefabs, 16 prototype clips present.");
        }

        private static void EnsureFolder(string path)
        {
            if (AssetDatabase.IsValidFolder(path)) return;
            int split = path.LastIndexOf('/');
            string parent = path.Substring(0, split);
            EnsureFolder(parent);
            AssetDatabase.CreateFolder(parent, path.Substring(split + 1));
        }

        private static Color Parse(string value)
        {
            if (!ColorUtility.TryParseHtmlString(value, out Color color))
                throw new ArgumentException("Invalid hex material color: " + value);
            return color;
        }

        private static Material GetMaterial(string key, string color)
        {
            if (Cache.TryGetValue(key, out Material cached)) return cached;

            string path = Materials + "/" + key + ".mat";
            Material material = AssetDatabase.LoadAssetAtPath<Material>(path);
            if (!material)
            {
                Shader shader = Shader.Find("Universal Render Pipeline/Lit");
                if (!shader) shader = Shader.Find("Standard");
                if (!shader) throw new InvalidOperationException("No supported lit shader is installed.");
                material = new Material(shader);
                AssetDatabase.CreateAsset(material, path);
            }

            Color tint = Parse(color);
            if (material.HasProperty("_BaseColor")) material.SetColor("_BaseColor", tint);
            if (material.HasProperty("_Color")) material.SetColor("_Color", tint);
            EditorUtility.SetDirty(material);
            Cache[key] = material;
            return material;
        }

        private static Transform Shape(string name, Transform parent, Material material,
            Vector3 localPosition, Vector3 scale, Vector3 rotation, PrimitiveType primitive = PrimitiveType.Sphere)
        {
            GameObject obj = GameObject.CreatePrimitive(primitive);
            obj.name = name;
            obj.transform.SetParent(parent, false);
            obj.transform.localPosition = localPosition;
            obj.transform.localScale = scale;
            obj.transform.localEulerAngles = rotation;
            obj.GetComponent<Renderer>().sharedMaterial = material;
            Collider collider = obj.GetComponent<Collider>();
            if (collider) UnityEngine.Object.DestroyImmediate(collider);
            return obj.transform;
        }

        private static Transform Sphere(string name, Transform parent, Material material,
            float x, float y, float z, float sx, float sy, float sz, float tilt = 0f)
        {
            return Shape(name, parent, material, new Vector3(x, y, z),
                new Vector3(sx, sy, sz), new Vector3(0f, 0f, tilt));
        }

        private static void CreateCreature(Species species)
        {
            Material main = GetMaterial(species.Id + "_body", species.Main);
            Material accent = GetMaterial(species.Id + "_accent", species.Accent);
            Material detail = GetMaterial(species.Id + "_detail", species.Detail);
            Material eyes = GetMaterial(species.Id + "_eyes", species.Eye);
            Material light = GetMaterial(species.Id + "_light", species.Highlight);

            GameObject root = new GameObject(species.Id);
            root.AddComponent<CreatureIdentity>().Configure(species.Id, species.Base, species.Affinity);
            Transform visual = new GameObject("VisualRoot").transform;
            visual.SetParent(root.transform, false);

            Sphere("Body", visual, main, 0f, 0.57f, 0f, 0.75f, 0.66f, 0.65f);
            Sphere("Belly", visual, light, 0f, 0.43f, 0.49f, 0.47f, 0.42f, 0.16f);
            Transform head = Sphere("Head", visual, main, 0f, 1.07f, 0.12f, 0.64f, 0.58f, 0.58f);
            Sphere("CheekL", head, main, -0.45f, -0.20f, 0.28f, 0.25f, 0.23f, 0.22f);
            Sphere("CheekR", head, main, 0.45f, -0.20f, 0.28f, 0.25f, 0.23f, 0.22f);
            Transform earL = Sphere("EarL", head, accent, -0.48f, 0.43f, 0f,
                0.24f, species.Shape == 1 ? 0.46f : 0.37f, 0.12f, 30f);
            Transform earR = Sphere("EarR", head, accent, 0.48f, 0.43f, 0f,
                0.24f, species.Shape == 1 ? 0.46f : 0.37f, 0.12f, -30f);
            Sphere("InnerEarL", earL, light, 0f, 0.01f, 0.64f, 0.67f, 0.67f, 0.20f);
            Sphere("InnerEarR", earR, light, 0f, 0.01f, 0.64f, 0.67f, 0.67f, 0.20f);

            Transform eyeL = Sphere("EyeL", head, eyes, -0.25f, 0.03f, 0.50f,
                0.18f, 0.21f, 0.095f);
            Transform eyeR = Sphere("EyeR", head, eyes, 0.25f, 0.03f, 0.50f,
                0.18f, 0.21f, 0.095f);
            Sphere("GlintL", eyeL, light, -0.34f, 0.34f, 0.8f, 0.29f, 0.29f, 0.19f);
            Sphere("GlintR", eyeR, light, -0.34f, 0.34f, 0.8f, 0.29f, 0.29f, 0.19f);
            Sphere("Nose", head, detail, 0f, -0.19f, 0.58f, 0.085f, 0.065f, 0.055f);
            Sphere("Smile", head, eyes, 0f, -0.34f, 0.52f, 0.12f, 0.075f, 0.06f);

            Sphere("PawL", visual, main, -0.54f, 0.60f, 0.37f, 0.21f, 0.22f, 0.24f, -20f);
            Sphere("PawR", visual, main, 0.54f, 0.60f, 0.37f, 0.21f, 0.22f, 0.24f, 20f);
            Sphere("FootL", visual, accent, -0.38f, 0.13f, 0.30f, 0.23f, 0.17f, 0.29f);
            Sphere("FootR", visual, accent, 0.38f, 0.13f, 0.30f, 0.23f, 0.17f, 0.29f);

            Transform tail = Sphere("Tail", visual, main, 0.52f, 0.64f, -0.48f,
                0.38f, 0.43f, 0.40f, -25f);
            Sphere("TailBandA", tail, accent, 0f, 0.42f, 0.15f, 1.02f, 0.20f, 1.02f);
            Sphere("TailBandB", tail, accent, 0f, -0.35f, 0.15f, 1.02f, 0.18f, 1.02f);

            if (species.Shape == 0 || species.Shape >= 4)
            {
                Sphere("HornL", head, detail, -0.20f, 0.53f, 0.13f,
                    0.12f, 0.22f, 0.12f);
                Sphere("HornR", head, detail, 0.20f, 0.53f, 0.13f,
                    0.12f, 0.22f, 0.12f);
            }

            AddSpecials(species.Shape, head, visual, accent, detail, light);
            root.AddComponent<SphereCollider>().radius = 0.90f;
            root.GetComponent<SphereCollider>().center = new Vector3(0f, 0.7f, 0f);
            root.AddComponent<CreatureMotion>().Configure(visual, head, earL, earR,
                tail, eyeL, eyeR);

            string path = Prefabs + "/" + species.Id + ".prefab";
            PrefabUtility.SaveAsPrefabAsset(root, path);
            UnityEngine.Object.DestroyImmediate(root);
        }

        private static void AddSpecials(int style, Transform head, Transform visual,
            Material accent, Material detail, Material light)
        {
            if (style == 1 || style == 5)
            {
                for (int s = -1; s <= 1; s += 2)
                {
                    Sphere("Antenna" + s, head, accent, s * 0.19f, 0.69f, 0f,
                        0.045f, 0.26f, 0.045f, -s * 22f);
                    Sphere("AntennaOrb" + s, head, detail, s * 0.28f, 0.89f, 0f,
                        0.11f, 0.11f, 0.11f);
                }
            }

            if (style == 2 || style == 4)
            {
                Sphere("CrownLeafL", head, accent, -0.16f, 0.76f, 0f,
                    0.17f, 0.30f, 0.075f, 42f);
                Sphere("CrownLeafR", head, detail, 0.16f, 0.77f, 0f,
                    0.17f, 0.30f, 0.075f, -42f);
                Sphere("Sprout", head, accent, 0f, 0.93f, 0f, 0.08f, 0.17f, 0.08f);
            }

            if (style == 3)
            {
                for (int i = 0; i < 5; i++)
                {
                    float angle = i * 1.256f;
                    Sphere("Bubble" + i, visual, i % 2 == 0 ? accent : detail,
                        Mathf.Cos(angle) * 0.57f, 1.30f + Mathf.Sin(angle) * 0.15f,
                        -0.15f, 0.14f, 0.14f, 0.14f);
                }
            }

            if (style == 4)
            {
                for (int i = 0; i < 7; i++)
                {
                    float angle = i * Mathf.PI * 2f / 7f;
                    Sphere("ForestPetal" + i, visual, i % 2 == 0 ? detail : accent,
                        Mathf.Cos(angle) * 0.64f, 0.69f,
                        Mathf.Sin(angle) * 0.46f,
                        0.17f, 0.29f, 0.13f, -angle * Mathf.Rad2Deg);
                }
            }

            if (style == 5)
            {
                Sphere("MoonCrest", head, light, 0f, 0.63f, 0.27f,
                    0.20f, 0.21f, 0.055f);
                for (int i = 0; i < 4; i++)
                    Sphere("StarOrb" + i, visual, detail,
                        (i - 1.5f) * 0.43f, 0.35f + i * 0.27f, -0.50f,
                        0.10f, 0.10f, 0.10f);
            }

            if (style == 6)
            {
                for (int i = -2; i <= 2; i++)
                    Shape("EmberCrystal" + i, head, detail,
                        new Vector3(i * 0.21f, 0.64f - Mathf.Abs(i) * 0.06f, 0f),
                        new Vector3(0.12f, 0.27f, 0.13f),
                        new Vector3(0f, 0f, i * -20f), PrimitiveType.Cube);
                Sphere("ChestGem", visual, detail, 0f, 0.65f, 0.64f,
                    0.20f, 0.23f, 0.09f);
            }
        }

        private static void CreateCatalog()
        {
            string path = Root + "/CreatureCatalog.asset";
            CreatureCatalog catalog = AssetDatabase.LoadAssetAtPath<CreatureCatalog>(path);
            if (!catalog)
            {
                catalog = ScriptableObject.CreateInstance<CreatureCatalog>();
                AssetDatabase.CreateAsset(catalog, path);
            }

            CreatureCatalog.Entry[] entries = new CreatureCatalog.Entry[Starters.Length];
            for (int i = 0; i < Starters.Length; i++)
            {
                entries[i] = new CreatureCatalog.Entry
                {
                    speciesId = Starters[i].Id,
                    prefab = AssetDatabase.LoadAssetAtPath<GameObject>(
                        Prefabs + "/" + Starters[i].Id + ".prefab")
                };
            }

            string[] names = { "berry", "play_ball", "sleep_cushion", "flower_pot", "food_bowl" };
            GameObject[] props = new GameObject[names.Length];
            for (int i = 0; i < names.Length; i++)
                props[i] = AssetDatabase.LoadAssetAtPath<GameObject>(
                    Prefabs + "/prop_" + names[i] + ".prefab");
            catalog.Configure(entries, props);
            EditorUtility.SetDirty(catalog);
        }

        private static void SaveProp(GameObject gameObject, string id)
        {
            PrefabUtility.SaveAsPrefabAsset(gameObject, Prefabs + "/prop_" + id + ".prefab");
            UnityEngine.Object.DestroyImmediate(gameObject);
        }

        private static void CreateProps()
        {
            Material soft = GetMaterial("prop_soft", "#FFE4CE");
            Material warm = GetMaterial("prop_warm", "#F29D7B");
            Material green = GetMaterial("prop_green", "#83B58B");
            Material deep = GetMaterial("prop_deep", "#AC6F62");

            GameObject berry = new GameObject("prop_berry");
            Sphere("Fruit", berry.transform, warm, 0f, 0.18f, 0f, 0.22f, 0.23f, 0.22f);
            Sphere("Leaf", berry.transform, green, 0f, 0.38f, 0f, 0.13f, 0.06f, 0.17f);
            SaveProp(berry, "berry");

            GameObject ball = new GameObject("prop_play_ball");
            Sphere("Ball", ball.transform, warm, 0f, 0.26f, 0f, 0.27f, 0.27f, 0.27f);
            Sphere("Patch", ball.transform, soft, 0f, 0.29f, 0.23f, 0.15f, 0.15f, 0.045f);
            SaveProp(ball, "play_ball");

            GameObject cushion = new GameObject("prop_sleep_cushion");
            Sphere("Pillow", cushion.transform, soft, 0f, 0.16f, 0f, 0.66f, 0.18f, 0.52f);
            Sphere("Inset", cushion.transform, warm, 0f, 0.24f, 0f, 0.50f, 0.055f, 0.37f);
            SaveProp(cushion, "sleep_cushion");

            GameObject plant = new GameObject("prop_flower_pot");
            Shape("Pot", plant.transform, deep, new Vector3(0f, 0.18f, 0f),
                new Vector3(0.36f, 0.29f, 0.36f), Vector3.zero, PrimitiveType.Cylinder);
            Sphere("LeafL", plant.transform, green, -0.14f, 0.52f, 0f,
                0.14f, 0.24f, 0.09f, 35f);
            Sphere("LeafR", plant.transform, green, 0.14f, 0.52f, 0f,
                0.14f, 0.24f, 0.09f, -35f);
            Sphere("Bud", plant.transform, warm, 0f, 0.68f, 0f, 0.12f, 0.12f, 0.12f);
            SaveProp(plant, "flower_pot");

            GameObject bowl = new GameObject("prop_food_bowl");
            Shape("Dish", bowl.transform, soft, new Vector3(0f, 0.12f, 0f),
                new Vector3(0.48f, 0.11f, 0.48f), Vector3.zero, PrimitiveType.Cylinder);
            Shape("Rim", bowl.transform, warm, new Vector3(0f, 0.21f, 0f),
                new Vector3(0.51f, 0.035f, 0.51f), Vector3.zero, PrimitiveType.Cylinder);
            SaveProp(bowl, "food_bowl");
        }

        private static AnimationCurve Curve(float baseValue, float amplitude, float duration,
            bool bounce = false)
        {
            float mid = baseValue + amplitude;
            return new AnimationCurve(
                new Keyframe(0f, baseValue),
                new Keyframe(duration * 0.25f, bounce ? mid : baseValue + amplitude * 0.4f),
                new Keyframe(duration * 0.5f, mid),
                new Keyframe(duration * 0.75f, baseValue + amplitude * 0.4f),
                new Keyframe(duration, baseValue));
        }

        private static void CreateClip(string name)
        {
            string path = Clips + "/" + name + ".anim";
            AnimationClip clip = AssetDatabase.LoadAssetAtPath<AnimationClip>(path);
            if (!clip)
            {
                clip = new AnimationClip { frameRate = 30f };
                AssetDatabase.CreateAsset(clip, path);
            }
            float duration = name == "Sleep" ? 2f : name == "Evolution" ? 2.4f : 0.8f;
            float movement = name == "Hop" || name == "Happy" ? 0.32f :
                name == "Run" ? 0.15f : name == "Idle" || name == "Sleep" ? 0.02f : 0.09f;
            AnimationUtility.SetEditorCurve(clip,
                EditorCurveBinding.FloatCurve("VisualRoot", typeof(Transform), "m_LocalPosition.y"),
                Curve(0f, movement, duration, name == "Hop"));
            AnimationUtility.SetEditorCurve(clip,
                EditorCurveBinding.FloatCurve("VisualRoot", typeof(Transform), "m_LocalScale.y"),
                Curve(1f, name == "Sleep" ? -0.09f : 0.04f, duration));
            AnimationUtility.SetEditorCurve(clip,
                EditorCurveBinding.FloatCurve("VisualRoot", typeof(Transform), "m_LocalScale.x"),
                Curve(1f, name == "Sleep" ? 0.08f : -0.03f, duration));
            AnimationUtility.SetEditorCurve(clip,
                EditorCurveBinding.FloatCurve("VisualRoot", typeof(Transform), "m_LocalScale.z"),
                Curve(1f, name == "Sleep" ? 0.08f : -0.03f, duration));
            clip.wrapMode = WrapMode.Loop;
            EditorUtility.SetDirty(clip);
        }
    }
}
