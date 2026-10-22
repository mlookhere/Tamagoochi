using NUnit.Framework;
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
        public void OriginalSpriteLoadsAndHasExpectedDimensions(string path, int size)
        {
            var texture = Resources.Load<Texture2D>("Art/" + path);
            Assert.IsNotNull(texture, $"Missing original Tamagoochi art: {path}");
            Assert.AreEqual(size, texture.width);
            Assert.AreEqual(size, texture.height);
        }
    }
}
