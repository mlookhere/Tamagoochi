using System.Collections.Generic;
using UnityEngine;

namespace Tamagoochi
{
    // A lightweight visual stage for the original seedling art; replace with an
    // authored rig/animation graph after native device art and frame-pacing review.
    public sealed class CompanionStage : MonoBehaviour
    {
        private readonly Dictionary<string, Sprite> sprites = new();
        private SpriteRenderer companion;
        private SpriteRenderer shadow;
        private float reactionUntil;
        private string reaction;
        private string currentPose = "neutral";
        private bool reduceMotion;
        private Vector3 home;

        private void Awake()
        {
            ConfigureCamera();
            companion = CreateSprite("Mochi", "companions/seedling-neutral", 5);
            shadow = CreateSprite("Ground", "world/meadow", 0);
            shadow.transform.position = new Vector3(0, -0.6f, 0);
            shadow.transform.localScale = new Vector3(1.8f, 0.28f, 1);
            shadow.color = new Color(0.4f, 0.55f, 0.38f, 0.32f);
            CreateBackdrop("Left Grove", "world/grove", new Vector3(-2.1f, 0.45f, 0));
            CreateBackdrop("Pond", "world/pond", new Vector3(2.0f, 0.2f, 0));
            home = new Vector3(0, 1.0f, 0);
        }

        public void React(string pose)
        {
            reaction = pose;
            reactionUntil = Time.unscaledTime + 1.5f;
        }

        public void SetReducedMotion(bool enabled) => reduceMotion = enabled;

        // Explicit feedback takes priority over an otherwise low-mood expression;
        // sleeping always retains its own pose.
        public static string PoseFor(bool sleeping, float mood, string response,
            float now, float responseUntil) =>
            sleeping ? "asleep" :
            now < responseUntil && !string.IsNullOrEmpty(response) ? response :
            mood < 40 ? "sad" : "neutral";

        // A small, frame-independent breathing/reaction shape. No animation
        // objects, allocations, particle emitters or camera movement.
        public static Vector3 ScaleFor(float seconds, bool sleeping,
            bool reducedMotion, bool reacting)
        {
            if (sleeping || reducedMotion) return Vector3.one;
            float breath = Mathf.Sin(seconds * 2.2f) * 0.025f;
            float pulse = reacting ? 0.065f * Mathf.Abs(Mathf.Sin(seconds * 11f)) : 0f;
            return new Vector3(1f + breath - pulse * 0.3f,
                1f - breath + pulse, 1f);
        }

        public void Present(Pet pet, Room room)
        {
            if (companion == null || pet == null || room == null) return;
            float now = Time.unscaledTime;
            bool reacting = now < reactionUntil;
            string pose = PoseFor(pet.sleeping, pet.mood, reaction, now, reactionUntil);
            if (pose != currentPose)
            {
                string art = pose switch
                {
                    "eat" or "clean" or "play" => "companions/action-seedling-" + pose,
                    _ => "companions/seedling-" + pose
                };
                var desired = LoadSprite(art);
                if (desired != null)
                {
                    companion.sprite = desired;
                    currentPose = pose;
                }
            }
            float x = room.CompanionPlacement().slot switch
            {
                RoomSlot.Window => -0.6f,
                RoomSlot.Garden => 0.6f,
                _ => 0
            };
            companion.transform.localScale = ScaleFor(now, pet.sleeping,
                reduceMotion, reacting);
            float bounce = reduceMotion || pet.sleeping ? 0 :
                Mathf.Sin(now * 2.1f) * 0.055f;
            Vector3 destination = home + new Vector3(x, bounce, 0);
            companion.transform.position = reduceMotion ? destination :
                Vector3.Lerp(companion.transform.position, destination,
                    1f - Mathf.Exp(-6f * Time.unscaledDeltaTime));
            shadow.transform.position = new Vector3(companion.transform.position.x, -0.6f, 0);
        }

        private static void ConfigureCamera()
        {
            var camera = Camera.main ?? FindFirstObjectByType<Camera>();
            if (camera == null)
            {
                var cameraObject = new GameObject("Companion Camera");
                camera = cameraObject.AddComponent<Camera>();
                cameraObject.tag = "MainCamera";
            }
            camera.orthographic = true;
            camera.orthographicSize = 4.7f;
            camera.clearFlags = CameraClearFlags.SolidColor;
            camera.backgroundColor = new Color32(229, 240, 226, 255);
            camera.transform.position = new Vector3(0, 0, -10);
        }

        private SpriteRenderer CreateSprite(string name, string path, int order)
        {
            var child = new GameObject(name);
            child.transform.SetParent(transform);
            var renderer = child.AddComponent<SpriteRenderer>();
            renderer.sortingOrder = order;
            renderer.sprite = LoadSprite(path);
            return renderer;
        }

        private void CreateBackdrop(string name, string path, Vector3 position)
        {
            var renderer = CreateSprite(name, path, 1);
            renderer.transform.position = position;
            renderer.transform.localScale = Vector3.one * 1.25f;
            renderer.color = new Color(1, 1, 1, 0.72f);
        }

        private Sprite LoadSprite(string path)
        {
            if (sprites.TryGetValue(path, out var cached)) return cached;
            var sprite = Resources.Load<Sprite>("Art/" + path);
            sprites.Add(path, sprite);
            return sprite;
        }

        private void OnDestroy() => sprites.Clear();
    }
}
