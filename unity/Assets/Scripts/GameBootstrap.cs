using System;
using UnityEngine;

namespace Tamagoochi
{
    // Playable parity harness; production UI and character art are still to be migrated.
    public sealed class GameBootstrap : MonoBehaviour
    {
        private static readonly ItemId[] Recipes =
        {
            ItemId.PicnicSnack, ItemId.LeafToy, ItemId.MossCushion,
            ItemId.StarKeepsake, ItemId.FlowerCrown
        };
        private static readonly ItemId[] Decorations =
        {
            ItemId.LeafToy, ItemId.MossCushion, ItemId.StarKeepsake, ItemId.FlowerCrown
        };

        private Pet pet;
        private Inventory inventory;
        private Room room;
        private WorkshopBond bond;
        private ForestEcho echo;
        private StoneSkip skip;
        private MeadowPairs pairs;
        private ItemId? selectedDecoration;
        private int tab;
        private int gameTab;
        private Vector2 scroll;
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
            room = new Room();
            bond = new WorkshopBond();
            echo = new ForestEcho();
            skip = new StoneSkip();
            pairs = new MeadowPairs();
        }

        private void OnApplicationPause(bool paused)
        {
            if (paused) PetStore.Save(pet);
            else pet.Advance(PetStore.Now());
        }

        private void OnApplicationFocus(bool focused)
        {
            if (focused && pet != null) pet.Advance(PetStore.Now());
        }

        private void OnApplicationQuit() => PetStore.Save(pet);

        private void OnGUI()
        {
            float scale = Mathf.Clamp(Screen.width / 430f, 0.85f, 2f);
            GUI.matrix = Matrix4x4.Scale(new Vector3(scale, scale, 1));
            GUI.skin.button.fixedHeight = 42;
            GUI.skin.label.wordWrap = true;
            float width = Screen.width / scale;
            float height = Screen.height / scale;
            GUILayout.BeginArea(new Rect(12, 12, width - 24, height - 24), GUI.skin.box);
            GUILayout.Label($"TAMAGOOCHI  •  {pet.name}  •  Day {pet.AgeDays(PetStore.Now())}");
            GUILayout.Label($"Pet bond {pet.bond:0}   |   Workshop bond {bond.Bond}");
            int next = GUILayout.SelectionGrid(tab, new[] { "Care", "Workshop", "Games", "Room" }, 4);
            if (next != tab) { tab = next; scroll = Vector2.zero; }
            scroll = GUILayout.BeginScrollView(scroll);
            switch (tab)
            {
                case 0: DrawCare(); break;
                case 1: DrawWorkshop(); break;
                case 2: DrawGames(); break;
                case 3: DrawRoom(); break;
            }
            GUILayout.Space(12);
            GUILayout.Label(message);
            GUILayout.EndScrollView();
            GUILayout.EndArea();
        }

        private void DrawCare()
        {
            GUILayout.Label($"Hunger {pet.hunger:0}   Happiness {pet.happiness:0}   Energy {pet.energy:0}");
            GUILayout.Label($"Cleanliness {pet.cleanliness:0}   Mood {pet.mood:0}   Health {pet.health:0}");
            GUILayout.Label(pet.sleeping ? "Mochi is resting" : "Mochi is awake");
            if (GUILayout.Button("Feed")) { pet.Feed(); message = "Yum!"; }
            if (GUILayout.Button("Play")) { pet.Play(); message = "Let's play!"; }
            if (GUILayout.Button("Clean")) { pet.Clean(); message = "Fresh and happy"; }
            if (GUILayout.Button("Comfort")) { pet.Comfort(); message = "Feeling loved"; }
            if (GUILayout.Button(pet.sleeping ? "Wake" : "Sleep"))
            {
                pet.sleeping = !pet.sleeping;
                message = pet.sleeping ? "Sweet dreams" : "Good morning";
            }
        }

        private void DrawWorkshop()
        {
            GUILayout.Label("Craft materials into toys, snacks and room decorations.");
            foreach (var item in Recipes)
                if (GUILayout.Button($"Craft {item}  (owned {inventory.Count(item)})"))
                    message = inventory.Craft(item) ? $"Created {item}" : "Missing ingredients or basket full";
            if (GUILayout.Button($"Share picnic snack  (owned {inventory.Count(ItemId.PicnicSnack)})"))
                message = bond.ShareSnack(inventory) ? "Mochi enjoyed the snack!" : "Craft a snack first.";
            GUILayout.Label($"Berries {inventory.Count(ItemId.WildBerry)}, petals {inventory.Count(ItemId.FlowerPetal)}, " +
                            $"fiber {inventory.Count(ItemId.SoftFiber)}, stones {inventory.Count(ItemId.RiverStone)}");
        }

        private void DrawGames()
        {
            gameTab = GUILayout.SelectionGrid(gameTab, new[] { "Forest Echo", "Stone Skip", "Meadow Pairs" }, 3);
            switch (gameTab)
            {
                case 0: DrawEcho(); break;
                case 1: DrawSkip(); break;
                case 2: DrawPairs(); break;
            }
            GUILayout.Label($"Focus {bond.Focus}   Courage {bond.Courage}   Curiosity {bond.Curiosity}");
            GUILayout.Label("Every game can be replayed without penalties; bond grows on first completion only.");
        }

        private void DrawEcho()
        {
            GUILayout.Label("Repeat the pattern in order: " + string.Join(" → ", echo.Pattern));
            GUILayout.Label($"Step {echo.Progress + 1} of 3");
            GUILayout.BeginHorizontal();
            foreach (EchoSymbol symbol in Enum.GetValues(typeof(EchoSymbol)))
            {
                if (!GUILayout.Button(symbol.ToString())) continue;
                EchoResult result = echo.Choose(symbol);
                if (result == EchoResult.Complete) Reward(MiniGame.Echo, ItemId.FlowerPetal);
                else message = result == EchoResult.Miss ? "Try again. No penalty." : "Correct!";
            }
            GUILayout.EndHorizontal();
        }

        private void DrawSkip()
        {
            GUILayout.Label($"Cross exactly {skip.Target} spaces in three hops.");
            GUILayout.Label($"Progress: {skip.Distance} spaces, {skip.Hops} hops");
            GUILayout.BeginHorizontal();
            for (int hop = 1; hop <= 3; hop++)
            {
                int choice = hop;
                string label = $"{hop}: {skip.Preview(choice)}";
                if (!GUILayout.Button(label)) continue;
                SkipResult result = skip.Choose(choice);
                if (result == SkipResult.Complete) Reward(MiniGame.Skip, ItemId.RiverStone);
                else message = result == SkipResult.Miss ? "Try again. No penalty." : "Nice hop!";
            }
            GUILayout.EndHorizontal();
        }

        private void DrawPairs()
        {
            GUILayout.Label("Find three matching pairs. Mismatches stay visible until you turn them over.");
            var board = pairs.Board;
            for (int row = 0; row < 2; row++)
            {
                GUILayout.BeginHorizontal();
                for (int column = 0; column < 3; column++)
                {
                    int index = row * 3 + column;
                    bool faceUp = pairs.Matched.Contains(index) || pairs.Revealed.Contains(index);
                    if (!GUILayout.Button(faceUp ? board[index].ToString() : "?")) continue;
                    PairResult result = pairs.Choose(index);
                    if (result == PairResult.Complete) Reward(MiniGame.Pairs, ItemId.SoftFiber);
                    else message = result.ToString();
                }
                GUILayout.EndHorizontal();
            }
            if (pairs.Revealed.Count == 2 && GUILayout.Button("Turn over mismatched cards"))
            {
                pairs.CloseMismatch();
                message = "Try another pair!";
            }
        }

        private void DrawRoom()
        {
            GUILayout.Label(room.MoodDescription());
            var placement = room.CompanionPlacement();
            GUILayout.Label($"Mochi is at {placement.slot} and feels {placement.mood}.");
            GUILayout.Label("Select a crafted decoration, then tap an empty room space.");
            foreach (var item in Decorations)
            {
                if (!GUILayout.Button($"{(selectedDecoration == item ? "Selected: " : "")}{item}  ({inventory.Count(item)})"))
                    continue;
                selectedDecoration = selectedDecoration == item ? null : item;
                message = selectedDecoration.HasValue ? "Tap an empty room slot to place it." : "Selection cancelled.";
            }
            foreach (RoomSlot slot in Enum.GetValues(typeof(RoomSlot)))
            {
                var occupant = room.At(slot);
                if (!GUILayout.Button($"{slot}: {(occupant.HasValue ? occupant.Value.ToString() : "empty")}")) continue;
                if (occupant.HasValue)
                {
                    bool removed = room.PickUp(inventory, slot);
                    if (removed) selectedDecoration = null;
                    message = removed ? "Decoration returned to basket." : "Basket full. Decoration stays put.";
                }
                else if (selectedDecoration.HasValue)
                {
                    bool placed = room.Place(inventory, slot, selectedDecoration.Value);
                    if (placed) selectedDecoration = null;
                    message = placed ? room.MoodDescription() : "Craft this item before placing it.";
                }
                else message = "Select a decoration first.";
            }
        }

        private void Reward(MiniGame game, ItemId item)
        {
            bool found = inventory.Give(item);
            bool first = bond.Complete(game);
            message = found ? $"Great work! Found a {item}." : $"The {item} basket is full.";
            if (first) message += " Your bond grew!";
        }
    }
}
