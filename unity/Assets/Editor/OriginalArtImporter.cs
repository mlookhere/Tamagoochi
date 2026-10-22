using UnityEditor;

namespace Tamagoochi.Editor
{
    // Keep authored transparent art as sprites, without memory-heavy mipmaps.
    public sealed class OriginalArtImporter : AssetPostprocessor
    {
        private void OnPreprocessTexture()
        {
            if (!assetPath.StartsWith("Assets/Resources/Art/") ||
                !assetPath.EndsWith(".png"))
                return;
            var importer = (TextureImporter)assetImporter;
            importer.textureType = TextureImporterType.Sprite;
            importer.spriteImportMode = SpriteImportMode.Single;
            importer.spritePixelsPerUnit = 100;
            importer.alphaIsTransparency = true;
            importer.mipmapEnabled = false;
            importer.isReadable = false;
        }
    }
}
