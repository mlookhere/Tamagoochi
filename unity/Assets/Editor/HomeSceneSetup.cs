using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Tamagoochi.Editor
{
    public static class HomeSceneSetup
    {
        private const string ScenePath = "Assets/Scenes/Home.unity";

        [MenuItem("Tamagoochi/Create or Open Home Scene")]
        public static void CreateOrOpen()
        {
            if (!File.Exists(ScenePath))
            {
                var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
                new GameObject("Tamagoochi").AddComponent<GameBootstrap>();
                Directory.CreateDirectory("Assets/Scenes");
                EditorSceneManager.SaveScene(scene, ScenePath);
            }
            else
            {
                EditorSceneManager.OpenScene(ScenePath, OpenSceneMode.Single);
            }
            EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(ScenePath, true) };
            Debug.Log("Tamagoochi Home scene is enabled for builds.");
        }

        // Unity batchmode entrypoint; a successful Expo CI run cannot substitute for this.
        public static void VerifyEditorSetup()
        {
            CreateOrOpen();
            if (EditorBuildSettings.scenes.Length != 1 ||
                !EditorBuildSettings.scenes[0].enabled ||
                !File.Exists(ScenePath))
                throw new InvalidOperationException("Home scene generation or registration failed");
            Debug.Log("Unity Home scene creation and registration succeeded.");
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
