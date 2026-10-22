using System;
using UnityEngine;
using UnityEngine.UIElements;

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

        private GameSession session;
        private CompanionStage stage;
        private Pet pet => session.Pet;
        private Inventory inventory => session.Inventory;
        private Room room => session.Room;
        private WorkshopBond bond => session.Bond;
        private ForestEcho echo => session.Echo;
        private StoneSkip skip => session.Skip;
        private MeadowPairs pairs => session.Pairs;
        private Expeditions expeditions => session.Expeditions;
        private ItemId? selectedDecoration;
        private int tab;
        private int gameTab;
        private bool reducedMotion;
        private UIDocument document;
        private VisualElement header;
        private VisualElement sheet;
        private VisualElement page;
        private Label title;
        private Label notice;
        private long shownMinute = -1;
        private string message = "Welcome home";

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void Boot()
        {
            if (FindFirstObjectByType<GameBootstrap>() == null)
                new GameObject("Tamagoochi").AddComponent<GameBootstrap>();
        }

        private void Awake()
        {
            session = GameStore.Load();
            stage = GetComponent<CompanionStage>() ?? gameObject.AddComponent<CompanionStage>();
            reducedMotion = PlayerPrefs.GetInt("tamagoochi.reduceMotion", 0) == 1;
            stage.SetReducedMotion(reducedMotion);
        }

        private void OnApplicationPause(bool paused)
        {
            if (session == null) return;
            if (paused) GameStore.Save(session);
            else { pet.Advance(GameStore.Now()); Refresh(); }
        }

        private void OnApplicationFocus(bool focused)
        {
            if (session == null) return;
            if (focused) { pet.Advance(GameStore.Now()); Refresh(); }
            else GameStore.Save(session);
        }

        private void OnApplicationQuit()
        {
            if (session != null) GameStore.Save(session);
        }

        private void Update()
        {
            if (session == null) return;
            stage.Present(pet, room);
            long minute = GameStore.Now() / 60000;
            if (tab == 4 && shownMinute != minute)
            {
                shownMinute = minute;
                Refresh();
            }
        }


        private void Start()
        {
            document = GetComponent<UIDocument>() ?? gameObject.AddComponent<UIDocument>();
            if (document.panelSettings == null)
                document.panelSettings = Resources.Load<PanelSettings>("TamagoochiPanel");
            if (document.panelSettings == null || document.panelSettings.themeStyleSheet == null)
            {
                Debug.LogError("Tamagoochi UI theme/panel missing. Run Tamagoochi > Create or Open Home Scene in Unity Editor.");
                enabled = false;
                return;
            }
            VisualElement root = document.rootVisualElement;
            root.style.flexGrow = 1;
            root.pickingMode = PickingMode.Ignore;

            header = new VisualElement();
            header.style.position = Position.Absolute;
            header.style.backgroundColor = new Color(0.98f, 0.97f, 0.92f);
            header.style.paddingTop = 14;
            header.style.paddingBottom = 14;
            header.style.paddingLeft = 18;
            header.style.paddingRight = 18;
            Corners(header, 20);
            title = Text("Mochi", 20, true);
            header.Add(title);
            root.Add(header);

            sheet = new VisualElement();
            sheet.style.position = Position.Absolute;
            sheet.style.left = 0;
            sheet.style.right = 0;
            sheet.style.height = new Length(54, LengthUnit.Percent);
            sheet.style.backgroundColor = new Color(0.98f, 0.97f, 0.92f);
            sheet.style.paddingLeft = 12;
            sheet.style.paddingRight = 12;
            sheet.style.paddingTop = 14;
            Corners(sheet, 24);
            root.Add(sheet);

            var navigation = new VisualElement();
            navigation.style.flexDirection = FlexDirection.Row;
            sheet.Add(navigation);
            string[] tabs = { "Care", "Craft", "Games", "Room", "Explore" };
            for (int i = 0; i < tabs.Length; i++)
            {
                int target = i;
                navigation.Add(Button(tabs[i], () => { tab = target; Refresh(); }, true));
            }
            var scrollView = new ScrollView();
            scrollView.style.flexGrow = 1;
            sheet.Add(scrollView);
            page = scrollView.contentContainer;
            notice = Text(message, 13);
            notice.style.paddingTop = 10;
            notice.style.paddingBottom = 12;
            sheet.Add(notice);
            root.RegisterCallback<GeometryChangedEvent>(_ => ApplySafeArea());
            ApplySafeArea();
            Refresh();
        }

        private void ApplySafeArea()
        {
            if (document == null || header == null) return;
            float factor = document.rootVisualElement.resolvedStyle.width / Mathf.Max(1, Screen.width);
            if (factor <= 0) return;
            Rect safe = Screen.safeArea;
            header.style.top = 12 + (Screen.height - safe.yMax) * factor;
            header.style.left = 14 + safe.xMin * factor;
            header.style.right = 14 + (Screen.width - safe.xMax) * factor;
            sheet.style.bottom = safe.yMin * factor;
        }

        private void Refresh()
        {
            if (page == null || session == null) return;
            title.text = $"{pet.name} · Day {pet.AgeDays(GameStore.Now())}";
            page.Clear();
            switch (tab)
            {
                case 0: Care(); break;
                case 1: Craft(); break;
                case 2: Games(); break;
                case 3: Decorate(); break;
                case 4: Explore(); break;
            }
            notice.text = message;
        }

        private void Care()
        {
            Heading("Your little companion");
            Line($"Hunger {pet.hunger:0} · Joy {pet.happiness:0} · Energy {pet.energy:0}");
            Line($"Clean {pet.cleanliness:0} · Mood {pet.mood:0} · Bond {pet.bond:0}");
            Line(pet.sleeping ? "Mochi is dreaming." : "Mochi is happy to see you.");
            Act("Feed", pet.Feed, "Yum!", "eat");
            Act("Play", pet.Play, "That was fun!", "play");
            Act("Clean", pet.Clean, "Fresh and cozy.", "clean");
            Act("Comfort", pet.Comfort, "Feeling loved.", "joyful");
            Act(pet.sleeping ? "Wake" : "Sleep", () => pet.sleeping = !pet.sleeping,
                "A peaceful moment.");
            var toggle = new Toggle("Reduce motion") { value = reducedMotion };
            toggle.RegisterValueChangedCallback(evt =>
            {
                reducedMotion = evt.newValue;
                stage.SetReducedMotion(reducedMotion);
                PlayerPrefs.SetInt("tamagoochi.reduceMotion", reducedMotion ? 1 : 0);
                PlayerPrefs.Save();
            });
            page.Add(toggle);
        }

        private void Craft()
        {
            Heading("Little workshop");
            Line($"Berries {inventory.Count(ItemId.WildBerry)} · Petals {inventory.Count(ItemId.FlowerPetal)} · Fiber {inventory.Count(ItemId.SoftFiber)} · Stones {inventory.Count(ItemId.RiverStone)}");
            foreach (ItemId item in Recipes)
            {
                ItemId selected = item;
                Add($"Make {item} · {inventory.Count(item)} owned", () =>
                {
                    bool success = inventory.Craft(selected);
                    Commit(success ? $"Created {selected}!" : "Gather more materials first.");
                });
            }
            Add($"Share snack · {inventory.Count(ItemId.PicnicSnack)} owned", () =>
            {
                Commit(bond.ShareSnack(inventory) ? "A cozy picnic!" : "Make a snack first.");
            });
            Line($"Workshop bond {bond.Bond}");
        }

        private void Games()
        {
            Heading("Little games");
            Line("Replay freely; first victories deepen your friendship.");
            var nav = new VisualElement();
            nav.style.flexDirection = FlexDirection.Row;
            string[] labels = { "Echo", "Skip", "Pairs" };
            for (int i = 0; i < labels.Length; i++)
            {
                int target = i;
                nav.Add(Button(labels[i], () => { gameTab = target; Refresh(); }, true));
            }
            page.Add(nav);
            if (gameTab == 0)
            {
                Line("Repeat: " + string.Join(" → ", echo.Pattern));
                Line($"Note {echo.Progress + 1} of 3");
                foreach (EchoSymbol symbol in Enum.GetValues(typeof(EchoSymbol)))
                {
                    EchoSymbol choice = symbol;
                    Add(symbol.ToString(), () =>
                    {
                        var result = echo.Choose(choice);
                        if (result == EchoResult.Complete) Reward(MiniGame.Echo, ItemId.FlowerPetal);
                        else Commit(result == EchoResult.Miss ? "Try the melody again." : "Correct!");
                    });
                }
            }
            else if (gameTab == 1)
            {
                Line($"Cross {skip.Target} spaces in three hops · {skip.Distance} traveled");
                for (int hop = 1; hop <= 3; hop++)
                {
                    int choice = hop;
                    Add($"Hop {choice} · {skip.Preview(choice)}", () =>
                    {
                        var result = skip.Choose(choice);
                        if (result == SkipResult.Complete) Reward(MiniGame.Skip, ItemId.RiverStone);
                        else Commit(result == SkipResult.Miss ? "Try a new path." : "Nice jump!");
                    });
                }
            }
            else
            {
                Line("Find all three matching pairs.");
                var board = pairs.Board;
                for (int row = 0; row < 2; row++)
                {
                    var cells = new VisualElement();
                    cells.style.flexDirection = FlexDirection.Row;
                    for (int col = 0; col < 3; col++)
                    {
                        int index = row * 3 + col;
                        bool faceUp = pairs.Matched.Contains(index) || pairs.Revealed.Contains(index);
                        cells.Add(Button(faceUp ? board[index].ToString() : "?", () =>
                        {
                            var result = pairs.Choose(index);
                            if (result == PairResult.Complete) Reward(MiniGame.Pairs, ItemId.SoftFiber);
                            else Commit(result == PairResult.Miss ? "Turn those cards over." : result.ToString());
                        }, true));
                    }
                    page.Add(cells);
                }
                if (pairs.Revealed.Count == 2)
                    Add("Turn mismatched cards over", () => { pairs.CloseMismatch(); Commit("Try again!"); });
            }
            Line($"Focus {bond.Focus} · Courage {bond.Courage} · Curiosity {bond.Curiosity}");
        }

        private void Decorate()
        {
            Heading("Your little home");
            Line(room.MoodDescription());
            var placement = room.CompanionPlacement();
            Line($"Mochi is near the {placement.slot} · {placement.mood}");
            Heading("Choose a decoration");
            foreach (ItemId item in Decorations)
            {
                ItemId selected = item;
                Add($"{(selectedDecoration == item ? "✓ " : "")}{item} · {inventory.Count(item)}", () =>
                {
                    selectedDecoration = selectedDecoration == selected ? null : selected;
                    Refresh();
                });
            }
            Heading("Place or pick up");
            foreach (RoomSlot slot in Enum.GetValues(typeof(RoomSlot)))
            {
                RoomSlot target = slot;
                Add($"{slot} · {room.At(slot)?.ToString() ?? "empty"}", () =>
                {
                    bool success = room.At(target).HasValue ? room.PickUp(inventory, target) :
                        selectedDecoration.HasValue && room.Place(inventory, target, selectedDecoration.Value);
                    if (success) selectedDecoration = null;
                    Commit(success ? room.MoodDescription() : "Select a crafted item or make basket space.");
                });
            }
        }

        private void Explore()
        {
            Heading("A world of small wonders");
            Line("Offline adventures. No location or step permissions required.");
            Line($"Finds {expeditions.Completed} · {expeditions.LatestDiscovery()}");
            if (!expeditions.IsExploring)
            {
                foreach (Habitat habitat in Enum.GetValues(typeof(Habitat)))
                {
                    Habitat target = habitat;
                    Add($"Explore the {habitat}", () =>
                    {
                        if (expeditions.Start(target, GameStore.Now()))
                            Commit($"Mochi is exploring the {target}!");
                    });
                }
                return;
            }
            long remaining = expeditions.Remaining(GameStore.Now());
            Line($"Exploring {expeditions.ActiveHabitat}...");
            if (remaining > 0)
            {
                Line($"Ready in {(remaining + 59999) / 60000} minute(s). You can close the game.");
                return;
            }
            Add("Collect your discovery", () =>
            {
                var result = expeditions.Claim(GameStore.Now(), inventory);
                if (result == ExpeditionClaim.Claimed) stage.React("joyful");
                Commit(result switch
                {
                    ExpeditionClaim.Claimed => $"Found {expeditions.LatestDiscovery()}!",
                    ExpeditionClaim.BasketFull => "Basket full. Your discovery will wait.",
                    _ => "Still exploring."
                });
            });
        }

        private void Reward(MiniGame game, ItemId item)
        {
            bool found = inventory.Give(item);
            bool first = bond.Complete(game);
            if (first) stage.React("joyful");
            Commit((found ? $"Found a {item}!" : "Basket full.") + (first ? " Your bond grew!" : ""));
        }

        private void Act(string label, Action action, string result, string pose = null)
        {
            Add(label, () =>
            {
                action();
                if (pose != null) stage.React(pose);
                Commit(result);
            });
        }

        private void Commit(string result)
        {
            message = result;
            GameStore.Save(session);
            Refresh();
        }

        private void Heading(string text)
        {
            var label = Text(text, 19, true);
            label.style.marginTop = 10;
            label.style.marginBottom = 6;
            page.Add(label);
        }

        private void Line(string text)
        {
            var label = Text(text, 14);
            label.style.marginBottom = 9;
            page.Add(label);
        }

        private void Add(string text, Action action) => page.Add(Button(text, action));

        private static Label Text(string value, int size, bool bold = false)
        {
            var label = new Label(value);
            label.style.color = new Color(0.13f, 0.27f, 0.22f);
            label.style.fontSize = size;
            label.style.whiteSpace = WhiteSpace.Normal;
            if (bold) label.style.unityFontStyleAndWeight = FontStyle.Bold;
            return label;
        }

        private static Button Button(string caption, Action callback, bool compact = false)
        {
            var button = new Button(callback) { text = caption };
            button.style.minHeight = 46;
            button.style.flexGrow = 1;
            button.style.marginTop = 4;
            button.style.marginBottom = 4;
            button.style.marginRight = compact ? 3 : 0;
            button.style.paddingLeft = 6;
            button.style.paddingRight = 6;
            button.style.backgroundColor = new Color(0.82f, 0.91f, 0.78f);
            button.style.color = new Color(0.13f, 0.27f, 0.22f);
            button.style.fontSize = compact ? 12 : 15;
            button.style.unityFontStyleAndWeight = FontStyle.Bold;
            Corners(button, 13);
            return button;
        }

        private static void Corners(VisualElement element, int radius)
        {
            element.style.borderTopLeftRadius = radius;
            element.style.borderTopRightRadius = radius;
            element.style.borderBottomLeftRadius = radius;
            element.style.borderBottomRightRadius = radius;
        }
    }
}
