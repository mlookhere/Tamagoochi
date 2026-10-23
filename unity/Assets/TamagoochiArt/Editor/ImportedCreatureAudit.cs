using System;
using System.Collections.Generic;
using UnityEditor;
using UnityEngine;

namespace Tamagoochi.Art.Editor
{
    // This audits actual Unity ModelImporter output, never Blender reports or synthetic meshes.
    public static class ImportedCreatureAudit
    {
        private const string Source = "Assets/TamagoochiArt/Imported";
        private static readonly string[] Species = { "puffino", "lunari", "sproutle", "bubblin" };
        private static readonly string[] Morphs = { "Smile", "Pout", "CheekPuff", "Curious" };

        [MenuItem("Tamagoochi/Art/Audit Imported FBX Creatures")]
        public static void Audit()
        {
            foreach (string species in Species)
                foreach (string profile in new[] { "sculpt", "mobile" })
                    AuditModel(species, profile);
            Debug.Log("All eight Unity-imported FBX creatures have valid skinning, UVs and facial morphs. Visual/device approval still required.");
        }

        private static void AuditModel(string species, string profile)
        {
            string path = Source + "/" + species + "_" + profile + ".fbx";
            ModelImporter importer = AssetImporter.GetAtPath(path) as ModelImporter;
            GameObject model = AssetDatabase.LoadAssetAtPath<GameObject>(path);
            if (importer == null || model == null || !importer.importBlendShapes)
                throw new InvalidOperationException("Missing model or blend-shape import: " + path);

            SkinnedMeshRenderer[] renderers = model.GetComponentsInChildren<SkinnedMeshRenderer>(true);
            if (renderers.Length < 5)
                throw new InvalidOperationException("Expected at least five skinned parts: " + path);

            int heads = 0;
            long triangles = 0;
            foreach (SkinnedMeshRenderer renderer in renderers)
            {
                Mesh mesh = renderer.sharedMesh;
                Transform[] bones = renderer.bones;
                if (mesh == null || mesh.vertexCount == 0 || bones.Length == 0
                    || mesh.bindposes.Length != bones.Length
                    || mesh.uv.Length != mesh.vertexCount)
                    throw new InvalidOperationException("Invalid skinned mesh, bind poses or UVs: " + path);
                foreach (Transform bone in bones)
                    if (bone == null)
                        throw new InvalidOperationException("Missing imported bone: " + path);

                for (int submesh = 0; submesh < mesh.subMeshCount; submesh++)
                {
                    uint indices = mesh.GetIndexCount(submesh);
                    if (mesh.GetTopology(submesh) != MeshTopology.Triangles || indices == 0 || indices % 3 != 0)
                        throw new InvalidOperationException("Invalid triangular mesh topology: " + path);
                    triangles += indices / 3;
                }
                if (renderer.name != "Head") continue;

                heads++;
                var names = new HashSet<string>(StringComparer.Ordinal);
                for (int i = 0; i < mesh.blendShapeCount; i++)
                    names.Add(mesh.GetBlendShapeName(i));
                foreach (string morph in Morphs)
                {
                    bool found = names.Contains(morph);
                    foreach (string candidate in names)
                        found |= candidate.EndsWith("." + morph, StringComparison.Ordinal);
                    if (!found)
                        throw new InvalidOperationException("Missing Unity face morph " + morph + ": " + path);
                }
            }
            if (heads != 1 || triangles == 0 || (profile == "mobile" && triangles > 30000))
                throw new InvalidOperationException("Invalid imported head or mobile mesh budget: " + path);
        }
    }
}
