using System.IO;
using UnityEditor;
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
    }
}
