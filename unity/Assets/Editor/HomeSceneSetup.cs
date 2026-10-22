using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UIElements;

namespace Tamagoochi.Editor
{
    public static class HomeSceneSetup
    {
        private const string ScenePath = "Assets/Scenes/Home.unity";
        private const string PanelPath = "Assets/TamagoochiPanel.asset";

        [MenuItem("Tamagoochi/Create or Open Home Scene")]
        public static void CreateOrOpen()
        {
            PanelSettings settings = EnsurePanel();
            Scene scene = File.Exists(ScenePath)
                ? EditorSceneManager.OpenScene(ScenePath, OpenSceneMode.Single)
                : EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            GameBootstrap gameplay = UnityEngine.Object.FindFirstObjectByType<GameBootstrap>();
            if (gameplay == null)
                gameplay = new GameObject("Tamagoochi").AddComponent<GameBootstrap>();
            UIDocument document = gameplay.GetComponent<UIDocument>() ??
                gameplay.gameObject.AddComponent<UIDocument>();
            if (document.panelSettings != settings) document.panelSettings = settings;

            Directory.CreateDirectory("Assets/Scenes");
            EditorSceneManager.SaveScene(scene, ScenePath);
            EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(ScenePath, true) };
            Debug.Log("Tamagoochi Home scene and retained-mode panel are ready.");
        }

        private static PanelSettings EnsurePanel()
        {
            var existing = AssetDatabase.LoadAssetAtPath<PanelSettings>(PanelPath);
            if (existing != null) return existing;

            var settings = ScriptableObject.CreateInstance<PanelSettings>();
            settings.scaleMode = PanelScaleMode.ScaleWithScreenSize;
            settings.referenceResolution = new Vector2Int(430, 932);
            AssetDatabase.CreateAsset(settings, PanelPath);
            var theme = ScriptableObject.CreateInstance<ThemeStyleSheet>();
            theme.name = "TamagoochiTheme";
            AssetDatabase.AddObjectToAsset(theme, settings);
            settings.themeStyleSheet = theme;
            EditorUtility.SetDirty(settings);
            AssetDatabase.SaveAssets();
            return settings;
        }

        // These methods must run with a licensed Unity Editor and platform build modules.
        public static void VerifyEditorSetup()
        {
            CreateOrOpen();
            var document = UnityEngine.Object.FindFirstObjectByType<UIDocument>();
            if (document == null || document.panelSettings == null ||
                EditorBuildSettings.scenes.Length != 1 ||
                !EditorBuildSettings.scenes[0].enabled || !File.Exists(ScenePath))
                throw new InvalidOperationException("Unity Home scene or UI panel verification failed");
            Debug.Log("Unity Home scene and UI panel verification succeeded.");
        }

        public static void BuildAndroidDevelopment() =>
            BuildDevelopment(BuildTarget.Android, "Builds/Tamagoochi.apk");

        public static void BuildIOSDevelopment() =>
            BuildDevelopment(BuildTarget.iOS, "Builds/Tamagoochi-iOS");

        private static void BuildDevelopment(BuildTarget target, string output)
        {
            VerifyEditorSetup();
            Directory.CreateDirectory("Builds");
            var report = BuildPipeline.BuildPlayer(new BuildPlayerOptions
            {
                scenes = new[] { ScenePath },
                locationPathName = output,
                target = target,
                options = BuildOptions.Development
            });
            if (report.summary.result != BuildResult.Succeeded)
                throw new InvalidOperationException(
                    $"{target} Unity player build failed: {report.summary.result}");
            Debug.Log($"{target} development player created at {output}.");
        }
    }
}
