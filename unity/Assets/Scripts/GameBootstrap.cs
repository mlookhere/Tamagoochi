using UnityEngine;

namespace Tamagoochi
{
    // First playable conversion slice; replace IMGUI with authored mobile UI Toolkit views.
    public sealed class GameBootstrap : MonoBehaviour
    {
        private Pet pet;
        private Inventory inventory;
        private ForestEcho echo;
        private string message = "Welcome home";

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void Boot()
        {
            if (FindFirstObjectByType<GameBootstrap>() == null)
                new GameObject("Tamagoochi").AddComponent<GameBootstrap>();
        }

        private void Awake()
        {
            pet = PetStore.Load();
            inventory = Inventory.Starter();
            echo = new ForestEcho();
        }

        private void OnApplicationPause(bool paused)
        {
            if (paused) PetStore.Save(pet);
            else pet.Advance(PetStore.Now());
        }

        private void OnApplicationQuit() => PetStore.Save(pet);

        private void OnGUI()
        {
            float width = Mathf.Min(Screen.width - 24, 420);
            GUILayout.BeginArea(new Rect((Screen.width - width) / 2, 12, width, Screen.height - 24), GUI.skin.box);
            GUILayout.Label($"TAMAGOOCHI  |  {pet.name}  |  Day {pet.AgeDays(PetStore.Now())}");
            GUILayout.Label($"Hunger {pet.hunger:0}   Happiness {pet.happiness:0}   Energy {pet.energy:0}");
            GUILayout.Label($"Clean {pet.cleanliness:0}   Mood {pet.mood:0}   Bond {pet.bond:0}");
            GUILayout.Label(pet.sleeping ? "Your companion is sleeping" : "Your companion is awake");
            GUILayout.BeginHorizontal();
            if (GUILayout.Button("Feed")) { pet.Feed(); message = "Yum!"; }
            if (GUILayout.Button("Play")) { pet.Play(); message = "Let's play!"; }
            if (GUILayout.Button("Clean")) { pet.Clean(); message = "Fresh and happy"; }
            GUILayout.EndHorizontal();
            GUILayout.BeginHorizontal();
            if (GUILayout.Button("Comfort")) { pet.Comfort(); message = "Feeling loved"; }
            if (GUILayout.Button(pet.sleeping ? "Wake" : "Sleep"))
            {
                pet.sleeping = !pet.sleeping;
                message = pet.sleeping ? "Sweet dreams" : "Good morning";
            }
            if (GUILayout.Button("Move item")) { pet.MoveRoomItem(); message = $"Room: {pet.roomItemSlot}"; }
            GUILayout.EndHorizontal();
            GUILayout.Label("Workshop");
            foreach (ItemId item in new[] { ItemId.PicnicSnack, ItemId.LeafToy, ItemId.MossCushion, ItemId.StarKeepsake, ItemId.FlowerCrown })
                if (GUILayout.Button($"Craft {item}  |  Owned: {inventory.Count(item)}"))
                    message = inventory.Craft(item) ? $"Created {item}" : "Missing ingredients or basket full";
            GUILayout.Label("Forest Echo (repeat the pattern)");
            GUILayout.Label(string.Join(" → ", echo.Pattern));
            GUILayout.BeginHorizontal();
            foreach (EchoSymbol symbol in System.Enum.GetValues(typeof(EchoSymbol)))
                if (GUILayout.Button(symbol.ToString()))
                {
                    var result = echo.Choose(symbol);
                    if (result == EchoResult.Complete)
                    {
                        inventory.Give(ItemId.FlowerPetal);
                        pet.Comfort();
                    }
                    message = result.ToString();
                }
            GUILayout.EndHorizontal();
            GUILayout.Label(message);
            GUILayout.EndArea();
        }
    }
}
