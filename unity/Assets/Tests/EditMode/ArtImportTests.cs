using System.IO;
using NUnit.Framework;
using UnityEditor;
using UnityEngine;
using UnityEngine.UIElements;

namespace Tamagoochi.Tests
{
    public sealed class ArtImportTests
    {
        [Test]
        public void GeneratedUiFilesLiveInsideTheSelectedUnityProject()
        {
            string assets = Application.dataPath;
            Assert.IsTrue(File.Exists(Path.Combine(assets, "Scenes/Home.unity")));
            Assert.IsTrue(File.Exists(Path.Combine(assets, "Resources/TamagoochiTheme.tss")));
            Assert.IsTrue(File.Exists(Path.Combine(assets, "Resources/TamagoochiPanel.asset")));
        }

        [Test]
        public void RuntimePanelHasImportedDefaultTheme()
        {
            // Native validation runs HomeSceneSetup.VerifyEditorSetup before EditMode tests.
            var panel = AssetDatabase.LoadAssetAtPath<PanelSettings>(
                "Assets/Resources/TamagoochiPanel.asset");
            var theme = AssetDatabase.LoadAssetAtPath<ThemeStyleSheet>(
                "Assets/Resources/TamagoochiTheme.tss");
            Assert.IsNotNull(panel, "Run the Unity scene setup batchmode gate first");
            Assert.IsNotNull(theme, "Default runtime theme must import correctly");
            Assert.AreSame(theme, panel.themeStyleSheet);
            Assert.AreSame(panel, Resources.Load<PanelSettings>("TamagoochiPanel"));
        }

        [Test]
        public void CompanionCareReactionOverridesSadMoodButNeverSleep()
        {
            Assert.AreEqual("sad", CompanionStage.PoseFor(false, 25f, null, 10f, 0f));
            Assert.AreEqual("play", CompanionStage.PoseFor(false, 25f, "play", 10f, 11f));
            Assert.AreEqual("sad", CompanionStage.PoseFor(false, 25f, "play", 11f, 11f));
            Assert.AreEqual("asleep", CompanionStage.PoseFor(true, 25f, "play", 10f, 11f));
        }

        [Test]
        public void CompanionMotionHonorsReducedMotionAndStaysWithinSmallBounds()
        {
            for (int i = 0; i < 100; i++)
            {
                float now = i * 0.13f;
                Assert.AreEqual(Vector3.one, CompanionStage.ScaleFor(now, false, true, true));
                Assert.AreEqual(Vector3.one, CompanionStage.ScaleFor(now, true, false, true));
                var scale = CompanionStage.ScaleFor(now, false, false, true);
                Assert.That(scale.x, Is.InRange(0.95f, 1.03f));
                Assert.That(scale.y, Is.InRange(0.97f, 1.10f));
                Assert.AreEqual(1f, scale.z);
            }
        }

        [Test]
        public void NativePreflightRejectsMissingOrInvalidOriginalSprites()
        {
            Assert.DoesNotThrow(() => Tamagoochi.Editor.HomeSceneSetup.VerifyOriginalSprites());
        }

        [TestCase("companions/seedling-neutral", 256)]
        [TestCase("companions/seedling-joyful", 256)]
        [TestCase("companions/seedling-sad", 256)]
        [TestCase("companions/seedling-asleep", 256)]
        [TestCase("companions/seedling-surprised", 256)]
        [TestCase("companions/action-seedling-eat", 256)]
        [TestCase("companions/action-seedling-clean", 256)]
        [TestCase("companions/action-seedling-play", 256)]
        [TestCase("world/grove", 128)]
        [TestCase("world/meadow", 128)]
        [TestCase("world/pond", 128)]
        public void OriginalSpritesImportCorrectly(string path, int size)
        {
            var importer = AssetImporter.GetAtPath("Assets/Resources/Art/" + path + ".png")
                as TextureImporter;
            Assert.IsNotNull(importer, $"Missing art importer: {path}");
            Assert.AreEqual(TextureImporterType.Sprite, importer.textureType);
            Assert.IsFalse(importer.mipmapEnabled);
            var sprite = Resources.Load<Sprite>("Art/" + path);
            Assert.IsNotNull(sprite, $"Missing original Tamagoochi sprite: {path}");
            Assert.AreEqual(size, sprite.texture.width);
            Assert.AreEqual(size, sprite.texture.height);
        }
    }
}
