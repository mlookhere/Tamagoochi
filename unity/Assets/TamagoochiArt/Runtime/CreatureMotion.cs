using UnityEngine;

namespace Tamagoochi.Art
{
    public enum CreatureMood { Idle, Happy, Sleepy, Curious, Sad, Eating, Playing, Startled }

    /// <summary>Lightweight, reusable secondary motion. No Animator or gameplay dependencies.</summary>
    public sealed class CreatureMotion : MonoBehaviour
    {
        [SerializeField] private Transform visualRoot;
        [SerializeField] private Transform head;
        [SerializeField] private Transform leftEar;
        [SerializeField] private Transform rightEar;
        [SerializeField] private Transform tail;
        [SerializeField] private Transform leftEye;
        [SerializeField] private Transform rightEye;
        [SerializeField] private bool reducedMotion;

        private Vector3 bodyStart, bodyScaleStart;
        private Quaternion headStart, leftEarStart, rightEarStart, tailStart;
        private Vector3 leftEyeStart, rightEyeStart;
        private float elapsed, nextBlink, blinkUntil, reactionUntil;
        private CreatureMood mood = CreatureMood.Idle;

        public CreatureMood Mood => mood;
        public bool ReducedMotion { get => reducedMotion; set => reducedMotion = value; }

        public void Configure(Transform body, Transform face, Transform earL, Transform earR,
            Transform tailPart, Transform eyeL, Transform eyeR)
        {
            visualRoot = body;
            head = face;
            leftEar = earL;
            rightEar = earR;
            tail = tailPart;
            leftEye = eyeL;
            rightEye = eyeR;
            CaptureRestPose();
        }

        private void Awake() => CaptureRestPose();

        private void CaptureRestPose()
        {
            if (!visualRoot || !head) return;
            bodyStart = visualRoot.localPosition;
            bodyScaleStart = visualRoot.localScale;
            headStart = head.localRotation;
            if (leftEar) leftEarStart = leftEar.localRotation;
            if (rightEar) rightEarStart = rightEar.localRotation;
            if (tail) tailStart = tail.localRotation;
            if (leftEye) leftEyeStart = leftEye.localScale;
            if (rightEye) rightEyeStart = rightEye.localScale;
        }

        public void React(CreatureMood next, float seconds = 1.6f)
        {
            mood = next;
            reactionUntil = elapsed + Mathf.Max(0.1f, seconds);
        }

        public void Pet() => React(CreatureMood.Happy);
        public void Feed() => React(CreatureMood.Eating);
        public void Play() => React(CreatureMood.Playing);
        public void Startle() => React(CreatureMood.Startled, 0.7f);
        public void Sleep() => React(CreatureMood.Sleepy, 6f);
        public void Wake() => React(CreatureMood.Idle, 0.1f);

        private void OnEnable()
        {
            elapsed = 0f;
            nextBlink = Random.Range(2f, 5f);
        }

        private void Update()
        {
            if (!visualRoot || !head) return;
            elapsed += Time.deltaTime;
            if (mood != CreatureMood.Idle && elapsed >= reactionUntil) mood = CreatureMood.Idle;

            float strength = reducedMotion ? 0f : 1f;
            float speed = mood == CreatureMood.Sleepy ? 0.65f : mood == CreatureMood.Happy ? 3.6f : 1.75f;
            float pulse = Mathf.Sin(elapsed * speed * Mathf.PI * 2f);
            float happy = mood == CreatureMood.Happy || mood == CreatureMood.Playing ? 1.7f : 1f;
            visualRoot.localPosition = bodyStart + Vector3.up * (0.028f * strength * happy * pulse);
            visualRoot.localScale = Vector3.Scale(bodyScaleStart,
                new Vector3(1f + 0.025f * strength * pulse,
                    1f - 0.018f * strength * pulse, 1f + 0.025f * strength * pulse));
            head.localRotation = headStart * Quaternion.Euler(0f, 0f,
                3.5f * strength * Mathf.Sin(elapsed * 2.0f));
            if (leftEar) leftEar.localRotation = leftEarStart *
                Quaternion.Euler(0f, 0f, 7f * strength * Mathf.Sin(elapsed * 2.7f + 0.2f));
            if (rightEar) rightEar.localRotation = rightEarStart *
                Quaternion.Euler(0f, 0f, -7f * strength * Mathf.Sin(elapsed * 2.6f + 0.9f));
            if (tail) tail.localRotation = tailStart *
                Quaternion.Euler(0f, 12f * strength * Mathf.Sin(elapsed * 3.0f), 0f);

            if (elapsed >= nextBlink)
            {
                blinkUntil = elapsed + 0.13f;
                nextBlink = elapsed + Random.Range(2.5f, 6.5f);
            }
            float eyeScale = mood == CreatureMood.Sleepy ? 0.13f : elapsed < blinkUntil ? 0.08f : 1f;
            if (leftEye) leftEye.localScale = Vector3.Scale(leftEyeStart, new Vector3(1f, eyeScale, 1f));
            if (rightEye) rightEye.localScale = Vector3.Scale(rightEyeStart, new Vector3(1f, eyeScale, 1f));
        }

        private void OnDisable()
        {
            if (visualRoot)
            {
                visualRoot.localPosition = bodyStart;
                visualRoot.localScale = bodyScaleStart;
            }
            if (head) head.localRotation = headStart;
            if (leftEar) leftEar.localRotation = leftEarStart;
            if (rightEar) rightEar.localRotation = rightEarStart;
            if (tail) tail.localRotation = tailStart;
            if (leftEye) leftEye.localScale = leftEyeStart;
            if (rightEye) rightEye.localScale = rightEyeStart;
        }
    }
}
