using System;
using System.IO;
using UnityEditor;
using UnityEngine;

namespace Tamagoochi.Art.Editor
{
    /// <summary>Original deterministic placeholder SFX; no third-party recordings or dependencies.</summary>
    public static class CreatureAudioBuilder
    {
        private const int SampleRate = 22050;
        private static readonly (string id, float startHz, float endHz, float seconds)[] Sounds =
        {
            ("pet_chirp", 610f, 940f, 0.23f),
            ("pet_purr", 125f, 165f, 0.46f),
            ("happy_hop", 350f, 720f, 0.19f),
            ("food_munch", 185f, 115f, 0.17f),
            ("sleepy_sigh", 410f, 220f, 0.42f),
            ("evolution_chime", 520f, 1040f, 0.75f)
        };

        public static void GenerateAudio(string generatedRoot)
        {
            string path = generatedRoot + "/Audio";
            if (!AssetDatabase.IsValidFolder(path))
                AssetDatabase.CreateFolder(generatedRoot, "Audio");

            foreach (var sound in Sounds)
            {
                string assetPath = path + "/" + sound.id + ".wav";
                File.WriteAllBytes(assetPath,
                    BuildWav(sound.startHz, sound.endHz, sound.seconds));
                AssetDatabase.ImportAsset(assetPath, ImportAssetOptions.ForceUpdate);
            }
        }

        private static byte[] BuildWav(float from, float to, float duration)
        {
            int samples = Mathf.CeilToInt(SampleRate * duration);
            using (MemoryStream stream = new MemoryStream(44 + samples * 2))
            using (BinaryWriter writer = new BinaryWriter(stream))
            {
                writer.Write(new[] { 'R', 'I', 'F', 'F' });
                writer.Write(36 + samples * 2);
                writer.Write(new[] { 'W', 'A', 'V', 'E' });
                writer.Write(new[] { 'f', 'm', 't', ' ' });
                writer.Write(16);
                writer.Write((short)1); // PCM
                writer.Write((short)1); // mono
                writer.Write(SampleRate);
                writer.Write(SampleRate * 2);
                writer.Write((short)2);
                writer.Write((short)16);
                writer.Write(new[] { 'd', 'a', 't', 'a' });
                writer.Write(samples * 2);

                double phase = 0;
                for (int i = 0; i < samples; i++)
                {
                    float t = i / (float)Math.Max(1, samples - 1);
                    float envelope = Mathf.Min(1f, t * 35f) * Mathf.Pow(1f - t, 1.4f);
                    float frequency = Mathf.Lerp(from, to, t) * (1f + 0.015f * Mathf.Sin(i * 0.026f));
                    phase += 2.0 * Math.PI * frequency / SampleRate;
                    double harmonic = Math.Sin(phase) * 0.82 + Math.Sin(phase * 2.0) * 0.18;
                    writer.Write((short)Math.Round(Mathf.Clamp((float)harmonic * envelope * 0.35f,
                        -1f, 1f) * short.MaxValue));
                }

                writer.Flush();
                return stream.ToArray();
            }
        }
    }
}
