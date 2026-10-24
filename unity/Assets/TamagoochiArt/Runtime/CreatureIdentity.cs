using UnityEngine;

namespace Tamagoochi.Art
{
    /// <summary>Stable identity for swapping prototype art with production rigs later.</summary>
    public sealed class CreatureIdentity : MonoBehaviour
    {
        [SerializeField] private string speciesId;
        [SerializeField] private string baseSpeciesId;
        [SerializeField] private string evolutionAffinity;

        public string SpeciesId => speciesId;
        public string BaseSpeciesId => baseSpeciesId;
        public string EvolutionAffinity => evolutionAffinity;

        public void Configure(string id, string baseId, string affinity)
        {
            speciesId = id;
            baseSpeciesId = baseId;
            evolutionAffinity = affinity;
        }
    }
}
