using NUnit.Framework;
using UnityEditor;
using UnityEngine;

namespace Tamagoochi.Tests
{
    public sealed class ArtImportTests
    {
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
