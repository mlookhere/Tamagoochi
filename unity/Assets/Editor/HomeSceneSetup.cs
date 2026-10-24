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
        private static readonly string[] RequiredSprites =
        {
            "companions/seedling-neutral", "companions/seedling-joyful",
            "companions/seedling-sad", "companions/seedling-asleep",
            "companions/seedling-surprised", "companions/action-seedling-eat",
            "companions/action-seedling-clean", "companions/action-seedling-play",
            "world/grove", "world/meadow", "world/pond"
        };

        [MenuItem("Tamagoochi/Create or Open Home Scene")]
        public static void CreateOrOpen()
        {
            PanelSettings settings = EnsurePanel();
            Scene scene = File.Exists(ProjectFile(ScenePath))
                ? EditorSceneManager.OpenScene(ScenePath, OpenSceneMode.Single)
                : EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            GameBootstrap gameplay = UnityEngine.Object.FindFirstObjectByType<GameBootstrap>();
            if (gameplay == null)
                gameplay = new GameObject("Tamagoochi").AddComponent<GameBootstrap>();
            UIDocument document = gameplay.GetComponent<UIDocument>() ??
                gameplay.gameObject.AddComponent<UIDocument>();
            if (document.panelSettings != settings) document.panelSettings = settings;

            Directory.CreateDirectory(Path.GetDirectoryName(ProjectFile(ScenePath)));
            EditorSceneManager.SaveScene(scene, ScenePath);
            EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(ScenePath, true) };
            Debug.Log("Tamagoochi Home scene and retained-mode panel are ready.");
        }

        // Editor commands can be launched from the repository root with
        // -projectPath unity. Never resolve Assets against the shell's CWD.
        private static string ProjectFile(string assetPath) =>
            Path.Combine(Application.dataPath, assetPath.Substring("Assets/".Length));

        private static PanelSettings EnsurePanel()
        {
            Directory.CreateDirectory(Path.GetDirectoryName(ProjectFile(ThemePath)));
            if (!File.Exists(ProjectFile(ThemePath)))
                File.WriteAllText(ProjectFile(ThemePath), "@import url(\"unity-theme://default\");\n");
            AssetDatabase.ImportAsset(ThemePath, ImportAssetOptions.ForceSynchronousImport);
            var theme = AssetDatabase.LoadAssetAtPath<ThemeStyleSheet>(ThemePath);
            if (theme == null)
                throw new InvalidOperationException("Unity default UI Toolkit runtime theme could not import");

            var settings = AssetDatabase.LoadAssetAtPath<PanelSettings>(PanelPath);
            if (settings == null)
            {
                if (AssetDatabase.LoadAssetAtPath<PanelSettings>(LegacyPanelPath) != null)
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
                !EditorBuildSettings.scenes[0].enabled ||
                !File.Exists(ProjectFile(ScenePath)) ||
                !File.Exists(ProjectFile(ThemePath)) ||
                document.panelSettings.themeStyleSheet == null ||
                AssetDatabase.LoadAssetAtPath<ThemeStyleSheet>(ThemePath) == null)
                throw new InvalidOperationException("Unity Home scene or UI panel verification failed");
            VerifyOriginalSprites();
            Debug.Log("Unity Home scene, UI panel and original sprite imports verified.");
        }

        // Read-only check: safe for EditMode test execution without scene edits.
        public static void VerifyOriginalSprites()
        {
            foreach (string path in RequiredSprites)
            {
                string asset = "Assets/Resources/Art/" + path + ".png";
                var importer = AssetImporter.GetAtPath(asset) as TextureImporter;
                var sprite = Resources.Load<Sprite>("Art/" + path);
                int expected = path.StartsWith("world/", StringComparison.Ordinal) ? 128 : 256;
                if (importer == null || importer.textureType != TextureImporterType.Sprite ||
                    importer.mipmapEnabled || importer.isReadable ||
                    importer.spriteImportMode != SpriteImportMode.Single || sprite == null ||
                    sprite.texture.width != expected || sprite.texture.height != expected)
                    throw new InvalidOperationException("Required original sprite missing or invalid: " + asset);
            }
        }

        public static void BuildAndroidDevelopment() =>
            BuildDevelopment(BuildTarget.Android, "Tamagoochi.apk");

        public static void BuildIOSDevelopment() =>
            BuildDevelopment(BuildTarget.iOS, "Tamagoochi-iOS");

        private static void BuildDevelopment(BuildTarget target, string outputName)
        {
            VerifyEditorSetup();
            string output = Path.Combine(
                Path.GetDirectoryName(Application.dataPath), "Builds", outputName);
            Directory.CreateDirectory(Path.GetDirectoryName(output));
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
