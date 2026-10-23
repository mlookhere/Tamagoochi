using System;
using UnityEditor;
using UnityEngine;

namespace Tamagoochi.Art.Editor
{
    /// <summary>
    /// Authored facial animation curve studies for the skinned Puffino head.
    /// Keep these separate from live CreatureFacialRig to avoid competing writers.
    /// </summary>
    public static class CreatureExpressionClipBuilder
    {
        private const string Folder = "Assets/TamagoochiArt/Generated/SculptReady/Animations";
        private const string FacePath = "VisualRoot/FaceMesh";
        private const string EyeL = "VisualRoot/BodyRoot/Head/Eye_L";
        private const string EyeR = "VisualRoot/BodyRoot/Head/Eye_R";

        private readonly struct Pose
        {
            internal readonly string Name;
            internal readonly float Smile, Pout, Cheeks, Curious, Blink;

            internal Pose(string name, float smile, float pout, float cheeks,
                float curious, float blink = 1f)
            {
                Name = name;
                Smile = smile;
                Pout = pout;
                Cheeks = cheeks;
                Curious = curious;
                Blink = blink;
            }
        }

        private static readonly Pose[] Poses =
        {
            new Pose("happy", 100f, 0f, 70f, 0f),
            new Pose("pouty", 0f, 100f, 55f, 0f),
            new Pose("curious", 0f, 0f, 0f, 100f),
            new Pose("eating", 35f, 0f, 100f, 0f),
            new Pose("sleepy", 0f, 0f, 0f, 0f, 0.12f),
            new Pose("blink", 0f, 0f, 0f, 0f, 0.06f)
        };

        [MenuItem("Tamagoochi/Art/Generate Facial Animation Clips")]
        public static void GenerateClips()
        {
            const string parent = "Assets/TamagoochiArt/Generated/SculptReady";
            if (!AssetDatabase.IsValidFolder(parent))
                throw new InvalidOperationException(
                    "Generate the Puffino sculpt-ready rig before its facial clips.");
            if (!AssetDatabase.IsValidFolder(Folder))
                AssetDatabase.CreateFolder(parent, "Animations");

            foreach (Pose pose in Poses)
                SavePose(pose);
            AssetDatabase.SaveAssets();
            Debug.Log("Six sculpt-rig expression clips authored under " + Folder);
        }

        [MenuItem("Tamagoochi/Art/Audit Facial Animation Clips")]
        public static void Audit()
        {
            foreach (Pose pose in Poses)
            {
                string path = Folder + "/face_" + pose.Name + ".anim";
                AnimationClip clip = AssetDatabase.LoadAssetAtPath<AnimationClip>(path);
                if (!clip)
                    throw new InvalidOperationException("Missing facial animation: " + path);

                EditorCurveBinding[] bindings = AnimationUtility.GetCurveBindings(clip);
                if (bindings.Length != 6)
                    throw new InvalidOperationException("Expected six curve bindings in " + path);
            }
            Debug.Log("Facial clip study audit passed: six clips, six curves each.");
        }

        private static void SavePose(Pose pose)
        {
            string path = Folder + "/face_" + pose.Name + ".anim";
            AnimationClip clip = AssetDatabase.LoadAssetAtPath<AnimationClip>(path);
            if (!clip)
            {
                clip = new AnimationClip { name = "face_" + pose.Name, frameRate = 30f };
                AssetDatabase.CreateAsset(clip, path);
            }

            float duration = pose.Name == "blink" ? 0.18f : 0.65f;
            float sustain = duration * 0.68f;
            AnimateBlend(clip, "Smile", pose.Smile, duration, sustain);
            AnimateBlend(clip, "Pout", pose.Pout, duration, sustain);
            AnimateBlend(clip, "CheekPuff", pose.Cheeks, duration, sustain);
            AnimateBlend(clip, "Curious", pose.Curious, duration, sustain);
            AnimateEye(clip, EyeL, pose.Blink, duration, sustain);
            AnimateEye(clip, EyeR, pose.Blink, duration, sustain);
            clip.wrapMode = WrapMode.Once;
            EditorUtility.SetDirty(clip);
        }

        private static void AnimateBlend(AnimationClip clip, string property,
            float target, float duration, float sustain)
        {
            AnimationCurve curve = new AnimationCurve(
                new Keyframe(0f, 0f),
                new Keyframe(duration * 0.28f, target),
                new Keyframe(sustain, target),
                new Keyframe(duration, 0f));
            AnimationUtility.SetEditorCurve(clip,
                EditorCurveBinding.FloatCurve(FacePath, typeof(SkinnedMeshRenderer),
                    "blendShape." + property), curve);
        }

        private static void AnimateEye(AnimationClip clip, string path,
            float target, float duration, float sustain)
        {
            AnimationCurve curve = new AnimationCurve(
                new Keyframe(0f, 1f),
                new Keyframe(duration * 0.28f, target),
                new Keyframe(sustain, target),
                new Keyframe(duration, 1f));
            AnimationUtility.SetEditorCurve(clip,
                EditorCurveBinding.FloatCurve(path, typeof(Transform), "m_LocalScale.y"), curve);
        }
    }
}
