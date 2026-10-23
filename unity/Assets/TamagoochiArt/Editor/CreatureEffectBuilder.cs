using System;
using UnityEditor;
using UnityEngine;

namespace Tamagoochi.Art.Editor
{
    /// <summary>
    /// Low-overdraw, non-flashing effect studies. Author final VFX textures and shaders later.
    /// Generated presets use particle settings only; no renderer package dependency.
    /// </summary>
    public static class CreatureEffectBuilder
    {
        private const string Base = "Assets/TamagoochiArt/Generated/FXStudies";

        private readonly struct Preset
        {
            internal readonly string Id;
            internal readonly Color Start;
            internal readonly Color End;
            internal readonly float Life;
            internal readonly float Speed;
            internal readonly int Count;

            internal Preset(string id, string start, string end, float life, float speed, int count)
            {
                Id = id;
                if (!ColorUtility.TryParseHtmlString(start, out Start) ||
                    !ColorUtility.TryParseHtmlString(end, out End))
                    throw new ArgumentException("Invalid particle color");
                Life = life;
                Speed = speed;
                Count = count;
            }
        }

        private static readonly Preset[] Effects =
        {
            new Preset("heart_burst", "#F7A3B5", "#FFE1A9", 0.85f, 0.7f, 12),
            new Preset("dream_drift", "#B3BEFA", "#F3E9FF", 2.1f, 0.22f, 8),
            new Preset("forest_growth", "#9BCB83", "#E6EFC2", 1.35f, 0.5f, 22),
            new Preset("lunar_evolve", "#9B96E8", "#FFF2B5", 1.65f, 0.75f, 28),
            new Preset("ember_evolve", "#F08F6B", "#FFD69A", 1.10f, 0.88f, 26)
        };

        [MenuItem("Tamagoochi/Art/Generate Evolution VFX Studies")]
        public static void Generate()
        {
            if (!AssetDatabase.IsValidFolder(Base))
            {
                if (!AssetDatabase.IsValidFolder("Assets/TamagoochiArt/Generated"))
                    AssetDatabase.CreateFolder("Assets/TamagoochiArt", "Generated");
                AssetDatabase.CreateFolder("Assets/TamagoochiArt/Generated", "FXStudies");
            }
            foreach (Preset preset in Effects)
                CreatePrefab(preset);
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Debug.Log("Created five evolution/interaction particle effect studies.");
        }

        [MenuItem("Tamagoochi/Art/Audit Evolution VFX Studies")]
        public static void Audit()
        {
            foreach (Preset preset in Effects)
            {
                string path = Base + "/fx_" + preset.Id + ".prefab";
                GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(path);
                if (!prefab || !prefab.GetComponent<ParticleSystem>())
                    throw new InvalidOperationException("Missing evolution effect: " + path);

                ParticleSystem particles = prefab.GetComponent<ParticleSystem>();
                if (particles.main.maxParticles > 64 || particles.main.loop)
                    throw new InvalidOperationException("Particle budget violation: " + path);
            }
            Debug.Log("Effect-study audit passed: 5 finite-burst prefabs, <= 64 particles.");
        }

        private static void CreatePrefab(Preset preset)
        {
            GameObject actor = new GameObject("fx_" + preset.Id);
            ParticleSystem particles = actor.AddComponent<ParticleSystem>();

            var main = particles.main;
            main.playOnAwake = false;
            main.loop = false;
            main.duration = Mathf.Max(0.4f, preset.Life);
            main.startLifetime = new ParticleSystem.MinMaxCurve(preset.Life * 0.72f, preset.Life);
            main.startSpeed = new ParticleSystem.MinMaxCurve(preset.Speed * 0.50f, preset.Speed);
            main.startSize = new ParticleSystem.MinMaxCurve(0.045f, 0.13f);
            main.simulationSpace = ParticleSystemSimulationSpace.Local;
            main.maxParticles = 64;
            main.stopAction = ParticleSystemStopAction.None;

            var emission = particles.emission;
            emission.rateOverTime = 0f;
            emission.SetBursts(new[] { new ParticleSystem.Burst(0f, (short)preset.Count) });

            var shape = particles.shape;
            shape.shapeType = ParticleSystemShapeType.Sphere;
            shape.radius = 0.38f;

            var size = particles.sizeOverLifetime;
            size.enabled = true;
            size.size = new ParticleSystem.MinMaxCurve(1f,
                new AnimationCurve(new Keyframe(0f, 0.4f), new Keyframe(0.25f, 1f),
                    new Keyframe(1f, 0.05f)));

            var color = particles.colorOverLifetime;
            color.enabled = true;
            Gradient fade = new Gradient();
            fade.SetKeys(
                new[]
                {
                    new GradientColorKey(preset.Start, 0f),
                    new GradientColorKey(preset.End, 1f)
                },
                new[]
                {
                    new GradientAlphaKey(0f, 0f),
                    new GradientAlphaKey(0.90f, 0.18f),
                    new GradientAlphaKey(0.60f, 0.78f),
                    new GradientAlphaKey(0f, 1f)
                });
            color.color = new ParticleSystem.MinMaxGradient(fade);

            var velocity = particles.velocityOverLifetime;
            velocity.enabled = true;
            velocity.y = preset.Id == "dream_drift" ? 0.15f : 0.50f;

            // Modest drift without strobing, GPU collisions or excessive fill-rate.
            var noise = particles.noise;
            noise.enabled = true;
            noise.strength = 0.045f;
            noise.frequency = 0.4f;

            PrefabUtility.SaveAsPrefabAsset(actor, Base + "/fx_" + preset.Id + ".prefab");
            UnityEngine.Object.DestroyImmediate(actor);
        }
    }
}
