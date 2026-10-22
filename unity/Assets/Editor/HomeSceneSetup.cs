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
        private const string PanelPath = "Assets/Resources/TamagoochiPanel.asset";
        private const string LegacyPanelPath = "Assets/TamagoochiPanel.asset";
        private const string ThemePath = "Assets/Resources/TamagoochiTheme.tss";

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
            Directory.CreateDirectory("Assets/Resources");
            if (!File.Exists(ThemePath))
                File.WriteAllText(ThemePath, "@import url(\"unity-theme://default\");\n");
            AssetDatabase.ImportAsset(ThemePath, ImportAssetOptions.ForceSynchronousImport);
            var theme = AssetDatabase.LoadAssetAtPath<ThemeStyleSheet>(ThemePath);
            if (theme == null)
                throw new InvalidOperationException("Unity default UI Toolkit runtime theme could not import");

            var settings = AssetDatabase.LoadAssetAtPath<PanelSettings>(PanelPath);
            if (settings == null)
            {
                if (File.Exists(LegacyPanelPath))
                {
                    string error = AssetDatabase.MoveAsset(LegacyPanelPath, PanelPath);
                    if (!string.IsNullOrEmpty(error))
                        throw new InvalidOperationException("Unable to migrate old UI panel: " + error);
                    settings = AssetDatabase.LoadAssetAtPath<PanelSettings>(PanelPath);
                }
                if (settings == null)
                {
                    settings = ScriptableObject.CreateInstance<PanelSettings>();
                    AssetDatabase.CreateAsset(settings, PanelPath);
                }
            }

            settings.scaleMode = PanelScaleMode.ScaleWithScreenSize;
            settings.referenceResolution = new Vector2Int(430, 932);
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
                !EditorBuildSettings.scenes[0].enabled || !File.Exists(ScenePath) ||
                document.panelSettings.themeStyleSheet == null ||
                AssetDatabase.LoadAssetAtPath<ThemeStyleSheet>(ThemePath) == null)
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
