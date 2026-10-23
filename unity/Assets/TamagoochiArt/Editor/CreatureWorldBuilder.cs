using UnityEditor;
using UnityEngine;

namespace Tamagoochi.Art.Editor
{
    /// <summary>Self-contained starter room and lightweight particle placeholder prefabs.</summary>
    public static class CreatureWorldBuilder
    {
        private const string Root = "Assets/TamagoochiArt/Generated";
        private const string Prefabs = Root + "/Prefabs";
        private const string Materials = Root + "/Materials";

        public static void GenerateWorld()
        {
            CreateRoom();
            CreateEffect("happy", new Color(1f, 0.62f, 0.68f, 1f), 8, 0.45f);
            CreateEffect("sleepy", new Color(0.65f, 0.78f, 1f, 1f), 5, 0.7f);
            CreateEffect("evolution", new Color(1f, 0.84f, 0.40f, 1f), 36, 1.3f);
        }

        private static Material MakeMaterial(string id, Color color)
        {
            string path = Materials + "/" + id + ".mat";
            Material material = AssetDatabase.LoadAssetAtPath<Material>(path);
            if (!material)
            {
                Shader shader = Shader.Find("Universal Render Pipeline/Lit");
                if (!shader) shader = Shader.Find("Standard");
                if (!shader) throw new System.InvalidOperationException("No lit shader found.");
                material = new Material(shader);
                AssetDatabase.CreateAsset(material, path);
            }
            if (material.HasProperty("_BaseColor")) material.SetColor("_BaseColor", color);
            if (material.HasProperty("_Color")) material.SetColor("_Color", color);
            EditorUtility.SetDirty(material);
            return material;
        }

        private static void Block(string id, Transform parent, Material material,
            Vector3 position, Vector3 scale, PrimitiveType primitive = PrimitiveType.Cube)
        {
            GameObject obj = GameObject.CreatePrimitive(primitive);
            obj.name = id;
            obj.transform.SetParent(parent, false);
            obj.transform.localPosition = position;
            obj.transform.localScale = scale;
            obj.GetComponent<Renderer>().sharedMaterial = material;
            Collider collider = obj.GetComponent<Collider>();
            if (collider) Object.DestroyImmediate(collider);
        }

        private static void PlaceProp(string id, Transform parent, Vector3 pos)
        {
            GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(
                Prefabs + "/prop_" + id + ".prefab");
            if (!prefab) throw new System.InvalidOperationException("Generate props before room.");
            GameObject obj = (GameObject)PrefabUtility.InstantiatePrefab(prefab);
            obj.transform.SetParent(parent, false);
            obj.transform.localPosition = pos;
        }

        private static void CreateRoom()
        {
            Material floor = MakeMaterial("room_floor", new Color(0.94f, 0.81f, 0.68f));
            Material wall = MakeMaterial("room_wall", new Color(1f, 0.93f, 0.86f));
            Material trim = MakeMaterial("room_trim", new Color(0.79f, 0.62f, 0.56f));

            GameObject room = new GameObject("env_starter_nursery");
            Block("Floor", room.transform, floor, new Vector3(0f, -0.12f, 0f),
                new Vector3(5.8f, 0.22f, 4.6f));
            Block("BackWall", room.transform, wall, new Vector3(0f, 1.55f, 2.20f),
                new Vector3(5.8f, 3.1f, 0.15f));
            Block("LeftWall", room.transform, wall, new Vector3(-2.82f, 1.55f, 0f),
                new Vector3(0.15f, 3.1f, 4.6f));
            Block("BaseboardBack", room.transform, trim, new Vector3(0f, 0.14f, 2.1f),
                new Vector3(5.5f, 0.18f, 0.14f));
            Block("BaseboardLeft", room.transform, trim, new Vector3(-2.7f, 0.14f, 0f),
                new Vector3(0.14f, 0.18f, 4.3f));

            PlaceProp("sleep_cushion", room.transform, new Vector3(-1.05f, 0f, 0.85f));
            PlaceProp("food_bowl", room.transform, new Vector3(1.25f, 0f, -0.45f));
            PlaceProp("play_ball", room.transform, new Vector3(0.35f, 0f, -1.18f));
            PlaceProp("flower_pot", room.transform, new Vector3(2.1f, 0f, 1.55f));
            PrefabUtility.SaveAsPrefabAsset(room, Prefabs + "/env_starter_nursery.prefab");
            Object.DestroyImmediate(room);
        }

        private static void CreateEffect(string id, Color color, short count, float duration)
        {
            GameObject go = new GameObject("fx_" + id);
            ParticleSystem particles = go.AddComponent<ParticleSystem>();
            var main = particles.main;
            main.loop = false;
            main.duration = duration;
            main.startLifetime = new ParticleSystem.MinMaxCurve(0.65f, 1.25f);
            main.startSpeed = new ParticleSystem.MinMaxCurve(0.18f, 1f);
            main.startSize = new ParticleSystem.MinMaxCurve(0.07f, 0.19f);
            main.startColor = color;
            main.playOnAwake = false;
            main.maxParticles = 90;
            var emission = particles.emission;
            emission.rateOverTime = 0f;
            emission.SetBursts(new[] { new ParticleSystem.Burst(0f, count) });
            var shape = particles.shape;
            shape.shapeType = ParticleSystemShapeType.Sphere;
            shape.radius = 0.65f;
            var velocity = particles.velocityOverLifetime;
            velocity.enabled = true;
            velocity.y = 0.45f;

            // Use Unity's default particle material; game art may replace the particle texture later.
            PrefabUtility.SaveAsPrefabAsset(go, Prefabs + "/fx_" + id + ".prefab");
            Object.DestroyImmediate(go);
        }
    }
}
