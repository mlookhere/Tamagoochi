using UnityEngine;

namespace Tamagoochi.Art
{
    /// <summary>
    /// Drives blend-shape expressions on an authored or procedurally rigged head.
    /// No dependency on gameplay, Animator controllers, or external rig packages.
    /// </summary>
    [DisallowMultipleComponent]
    public sealed class CreatureFacialRig : MonoBehaviour
    {
        [SerializeField] private SkinnedMeshRenderer face;
        [SerializeField] private Transform eyeLeft;
        [SerializeField] private Transform eyeRight;
        [SerializeField] private bool reducedMotion;

        private float blinkAt;
        private float blinkEnds;
        private float timer;
        private Vector3 leftRest;
        private Vector3 rightRest;
        private int smile = -1;
        private int pout = -1;
        private int cheeks = -1;
        private int curious = -1;
        private CreatureMood expression = CreatureMood.Idle;

        public CreatureMood Expression => expression;

        public void Configure(SkinnedMeshRenderer faceRenderer, Transform left, Transform right)
        {
            face = faceRenderer;
            eyeLeft = left;
            eyeRight = right;
            Capture();
        }

        private void Awake() => Capture();

        private void OnEnable()
        {
            timer = 0f;
            blinkAt = Random.Range(1.8f, 4.2f);
            blinkEnds = 0f;
        }

        private void Capture()
        {
            if (eyeLeft) leftRest = eyeLeft.localScale;
            if (eyeRight) rightRest = eyeRight.localScale;
            if (!face || !face.sharedMesh) return;
            Mesh mesh = face.sharedMesh;
            smile = mesh.GetBlendShapeIndex("Smile");
            pout = mesh.GetBlendShapeIndex("Pout");
            cheeks = mesh.GetBlendShapeIndex("CheekPuff");
            curious = mesh.GetBlendShapeIndex("Curious");
        }

        public void SetExpression(CreatureMood mood) => expression = mood;
        public void SetReducedMotion(bool value) => reducedMotion = value;

        private void LateUpdate()
        {
            timer += Time.deltaTime;

            // An irregular physiological blink is retained with reduced motion enabled.
            if (timer >= blinkAt)
            {
                blinkEnds = timer + 0.11f;
                blinkAt = timer + Random.Range(2.4f, 5.5f);
            }

            float lid = expression == CreatureMood.Sleepy ? 0.18f :
                timer < blinkEnds ? 0.08f : 1f;
            if (eyeLeft) eyeLeft.localScale = Vector3.Scale(leftRest, new Vector3(1f, lid, 1f));
            if (eyeRight) eyeRight.localScale = Vector3.Scale(rightRest, new Vector3(1f, lid, 1f));

            if (!face) return;
            float smileTarget = expression == CreatureMood.Happy ||
                expression == CreatureMood.Playing || expression == CreatureMood.Eating ? 100f : 0f;
            float poutTarget = expression == CreatureMood.Sad ? 100f : 0f;
            float cheeksTarget = expression == CreatureMood.Eating ||
                expression == CreatureMood.Happy ? 80f : 0f;
            float curiousTarget = expression == CreatureMood.Curious ||
                expression == CreatureMood.Startled ? 95f : 0f;
            float speed = reducedMotion ? 1000f : Time.deltaTime * 550f;

            SetWeight(smile, smileTarget, speed);
            SetWeight(pout, poutTarget, speed);
            SetWeight(cheeks, cheeksTarget, speed);
            SetWeight(curious, curiousTarget, speed);
        }

        private void SetWeight(int index, float target, float speed)
        {
            if (index < 0) return;
            face.SetBlendShapeWeight(index,
                Mathf.MoveTowards(face.GetBlendShapeWeight(index), target, speed));
        }

        private void OnDisable()
        {
            if (eyeLeft) eyeLeft.localScale = leftRest;
            if (eyeRight) eyeRight.localScale = rightRest;
            SetWeight(smile, 0f, 100f);
            SetWeight(pout, 0f, 100f);
            SetWeight(cheeks, 0f, 100f);
            SetWeight(curious, 0f, 100f);
        }
    }
}
