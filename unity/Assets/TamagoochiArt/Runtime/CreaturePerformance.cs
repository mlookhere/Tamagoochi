using UnityEngine;

namespace Tamagoochi.Art
{
    /// <summary>One interaction entry point for the modular bone and facial controls.</summary>
    [DisallowMultipleComponent]
    public sealed class CreaturePerformance : MonoBehaviour
    {
        [SerializeField] private CreatureMotion motion;
        [SerializeField] private CreatureFacialRig face;
        [SerializeField] private bool reducedMotion;

        private float resetAt;
        private bool reacting;

        public void Configure(CreatureMotion body, CreatureFacialRig facial)
        {
            motion = body;
            face = facial;
            SetReducedMotion(reducedMotion);
        }

        public void React(CreatureMood mood, float seconds = 1.4f)
        {
            if (motion) motion.React(mood, seconds);
            if (face) face.SetExpression(mood);
            resetAt = Time.time + Mathf.Max(0.1f, seconds);
            reacting = true;
        }

        public void SetReducedMotion(bool value)
        {
            reducedMotion = value;
            if (motion) motion.ReducedMotion = value;
            if (face) face.SetReducedMotion(value);
        }

        private void Update()
        {
            if (!reacting || Time.time < resetAt) return;
            reacting = false;
            if (face) face.SetExpression(CreatureMood.Idle);
        }

        public void Pet() => React(CreatureMood.Happy);
        public void Feed() => React(CreatureMood.Eating);
        public void Play() => React(CreatureMood.Playing);
        public void Sleep() => React(CreatureMood.Sleepy, 8f);
        public void Wake() => React(CreatureMood.Idle, 0.1f);
    }
}
