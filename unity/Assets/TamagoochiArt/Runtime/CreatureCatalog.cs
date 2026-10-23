using System;
using UnityEngine;

namespace Tamagoochi.Art
{
    /// <summary>Self-contained references; connect to gameplay only when the Unity migration is ready.</summary>
    [CreateAssetMenu(fileName = "CreatureCatalog", menuName = "Tamagoochi/Art/Creature Catalog")]
    public sealed class CreatureCatalog : ScriptableObject
    {
        [Serializable]
        public struct Entry
        {
            public string speciesId;
            public GameObject prefab;
        }

        [SerializeField] private Entry[] creatures = Array.Empty<Entry>();
        [SerializeField] private GameObject[] props = Array.Empty<GameObject>();

        public int CreatureCount => creatures.Length;
        public int PropCount => props.Length;

        public GameObject GetCreature(string speciesId)
        {
            foreach (Entry entry in creatures)
                if (string.Equals(entry.speciesId, speciesId, StringComparison.Ordinal))
                    return entry.prefab;
            return null;
        }

        public GameObject GetProp(string propName)
        {
            foreach (GameObject prop in props)
                if (prop && string.Equals(prop.name, "prop_" + propName, StringComparison.Ordinal))
                    return prop;
            return null;
        }

        public void Configure(Entry[] entries, GameObject[] items)
        {
            creatures = entries ?? Array.Empty<Entry>();
            props = items ?? Array.Empty<GameObject>();
        }
    }
}
