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
        private bool showAllDiscoveries;
        private bool confirmExpeditionReturn;
        private UIDocument document;
        private VisualElement header;
        private VisualElement sheet;
        private VisualElement page;
        private ScrollView contentScroll;
        private Button[] navigationButtons;
        private Label title;
        private Label notice;
        private long shownMinute = -1;
        private int contentRefreshVersion;
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
            title = Text(pet.name, 20, true);
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
            navigation.style.flexShrink = 0;
            navigation.style.marginBottom = 4;
            sheet.Add(navigation);
            string[] tabs = { "Care", "Craft", "Games", "Room", "Explore", "Book" };
            navigationButtons = new Button[tabs.Length];
            for (int i = 0; i < tabs.Length; i += 3)
            {
                var row = new VisualElement();
                row.style.flexDirection = FlexDirection.Row;
                navigation.Add(row);
                for (int j = i; j < Math.Min(i + 3, tabs.Length); j++)
                {
                    int target = j;
                    var button = Button(tabs[j], () => SelectTab(target), true);
                    button.style.flexBasis = 0;
                    navigationButtons[j] = button;
                    row.Add(button);
                }
            }
            contentScroll = new ScrollView();
            contentScroll.style.flexGrow = 1;
            sheet.Add(contentScroll);
            page = contentScroll.contentContainer;
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

        private void SelectTab(int next)
        {
            if (tab == next) return;
            tab = next;
            contentScroll.scrollOffset = Vector2.zero;
            Refresh();
        }

        private void Refresh()
        {
            if (page == null || session == null) return;
            var previousScroll = contentScroll.scrollOffset;
            int refreshVersion = ++contentRefreshVersion;
            title.text = $"{pet.name} · Day {pet.AgeDays(GameStore.Now())}";
            for (int i = 0; i < navigationButtons.Length; i++)
                navigationButtons[i].style.backgroundColor = i == tab
                    ? new Color(0.52f, 0.76f, 0.49f)
                    : new Color(0.82f, 0.91f, 0.78f);
            page.Clear();
            switch (tab)
            {
                case 0: Care(); break;
                case 1: Craft(); break;
                case 2: Games(); break;
                case 3: Decorate(); break;
                case 4: Explore(); break;
                case 5: ShowMemories(); break;
            }
            notice.text = message;
            // Rebuilding cards should not jump the player's reading position.
            contentScroll.schedule.Execute(() =>
            {
                if (refreshVersion == contentRefreshVersion)
                    contentScroll.scrollOffset = previousScroll;
            });
        }

        private void Care()
        {
            Heading("Your little companion");
            StatRow(("Hunger", pet.hunger), ("Joy", pet.happiness),
                ("Energy", pet.energy));
            StatRow(("Clean", pet.cleanliness), ("Mood", pet.mood),
                ("Bond", pet.bond));
            Line(pet.sleeping ? $"{pet.name} is dreaming." : $"{pet.name} is happy to see you.");
            Heading($"Growing Soulprint · {session.Nature}");
            Line(session.NatureDescription);
            Act("Feed", pet.Feed, "Yum!", "eat", MemoryKind.FirstFeed);
            Act("Play", pet.Play, "That was fun!", "play", MemoryKind.FirstPlay);
            Act("Clean", pet.Clean, "Fresh and cozy.", "clean", MemoryKind.FirstClean);
            Act("Comfort", pet.Comfort, "Feeling loved.", "joyful", MemoryKind.FirstComfort);
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
            Heading("Make your companion your own");
            var nameField = new TextField("Companion name")
            {
                value = pet.name,
                maxLength = 24
            };
            nameField.style.marginBottom = 6;
            page.Add(nameField);
            Add("Save name", () =>
            {
                if (pet.TryRename(nameField.value))
                    Commit("A name worth remembering.");
                else
                {
                    message = "Please enter a name of 1–24 letters without line breaks.";
                    Refresh();
                }
            });
            // Care remains immediately reachable in short mobile sessions.
            var future = session.FutureForm;
            Heading("A possible future · " + future.Name);
            Line(future.Description);
            Line($"Shaped by {future.Habitat} discoveries and a {future.Nature} spirit.");
            Line("A glimpse, not an unlocked evolution. Forms and animations are still in development.");
        }

        private void Craft()
        {
            Heading("Little workshop");
            Line($"Berries {inventory.Count(ItemId.WildBerry)} · Petals {inventory.Count(ItemId.FlowerPetal)} · Fiber {inventory.Count(ItemId.SoftFiber)} · Stones {inventory.Count(ItemId.RiverStone)}");
            foreach (ItemId item in Recipes)
            {
                ItemId selected = item;
                var recipe = Inventory.RecipeFor(selected);
                Line(string.Join(" + ", Array.ConvertAll(recipe, ingredient =>
                    $"{inventory.Count(ingredient.item)}/{ingredient.quantity} {ingredient.item}")));
                string status = inventory.CanCraft(selected) ? "Ready" :
                    inventory.RemainingCapacity(selected) == 0 ? "Storage full" : "Need materials";
                Add($"Make {selected} · {inventory.Count(selected)} owned · {status}", () =>
                {
                    bool success = inventory.Craft(selected);
                    if (success) Remember(MemoryKind.FirstCraft);
                    Commit(success ? $"Created {selected}!" : "Check materials and storage space.");
                });
            }
            Add($"Share snack · {inventory.Count(ItemId.PicnicSnack)} owned", () =>
            {
                bool shared = bond.ShareSnack(inventory);
                if (shared) Remember(MemoryKind.FirstSnack);
                Commit(shared ? "A cozy picnic!" : "Make a snack first.");
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
            Line(room.MoodDescription(pet.name));
            var placement = room.CompanionPlacement();
            Line($"{pet.name} is near the {placement.slot} · {placement.mood}");
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
                    bool placing = !room.At(target).HasValue;
                    bool success = !placing ? room.PickUp(inventory, target) :
                        selectedDecoration.HasValue && room.Place(inventory, target, selectedDecoration.Value);
                    if (success && placing) Remember(MemoryKind.FirstRoom);
                    if (success) selectedDecoration = null;
                    Commit(success ? room.MoodDescription(pet.name) : "Select a crafted item or make basket space.");
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
                Heading("Choose a habitat");
                foreach (Habitat habitat in Enum.GetValues(typeof(Habitat)))
                {
                    Habitat target = habitat;
                    HabitatAction(habitat, () =>
                    {
                        if (expeditions.Start(target, GameStore.Now()))
                        {
                            confirmExpeditionReturn = false;
                            Commit($"{pet.name} is exploring the {target}!");
                        }
                    });
                }
            }
            else
            {
                long remaining = expeditions.Remaining(GameStore.Now());
                Heading($"Exploring {expeditions.ActiveHabitat}");
                if (remaining > 0)
                {
                    Line($"Ready in {(remaining + 59999) / 60000} minute(s). You can close the game.");
                }
                else
                {
                    var reward = Expeditions.RewardFor(expeditions.ActiveHabitat.Value);
                    if (inventory.RemainingCapacity(reward) == 0)
                        Line($"Your {reward} basket is full. Use it in Craft, then come back to claim.");
                    Add("Collect your discovery", () =>
                    {
                        var habitat = expeditions.ActiveHabitat;
                        var result = expeditions.Claim(GameStore.Now(), inventory);
                        if (result == ExpeditionClaim.Claimed)
                        {
                            confirmExpeditionReturn = false;
                            stage.React("joyful");
                            Remember(habitat switch
                            {
                                Habitat.Grove => MemoryKind.FirstGrove,
                                Habitat.Meadow => MemoryKind.FirstMeadow,
                                _ => MemoryKind.FirstPond
                            });
                        }
                        Commit(result switch
                        {
                            ExpeditionClaim.Claimed => $"Found {expeditions.LatestDiscovery()}!",
                            ExpeditionClaim.BasketFull => "Basket full. Your discovery will wait.",
                            _ => "Still exploring."
                        });
                    });
                }
                if (remaining == 0) confirmExpeditionReturn = false;
                if (remaining > 0 && confirmExpeditionReturn)
                {
                    Line("Returning early ends this trip without a discovery. Your earlier finds are safe.");
                    Add("Keep exploring", () =>
                    {
                        confirmExpeditionReturn = false;
                        Refresh();
                    });
                    Add("Confirm return without reward", () =>
                    {
                        confirmExpeditionReturn = false;
                        if (expeditions.Cancel(GameStore.Now()))
                            Commit($"{pet.name} is home again. You can explore anytime.");
                        else
                        {
                            message = "Your discovery is ready. Collect it instead.";
                            Refresh();
                        }
                    });
                }
                else if (remaining > 0)
                {
                    Add("Return home early", () =>
                    {
                        confirmExpeditionReturn = true;
                        Refresh();
                    });
                }
            }
            ShowFieldJournal();
        }

        private void HabitatAction(Habitat habitat, Action action)
        {
            var row = new VisualElement();
            row.style.flexDirection = FlexDirection.Row;
            row.style.alignItems = Align.Center;
            row.style.marginBottom = 7;

            var art = new Image
            {
                sprite = Resources.Load<Sprite>("Art/world/" + habitat.ToString().ToLowerInvariant()),
                scaleMode = ScaleMode.ScaleToFit,
                pickingMode = PickingMode.Ignore
            };
            art.style.width = 56;
            art.style.height = 56;
            art.style.marginRight = 10;
            row.Add(art);
            var details = new VisualElement();
            details.style.flexGrow = 1;
            details.style.flexBasis = 0;
            details.Add(Button($"Explore the {habitat}", action));
            var reward = Expeditions.RewardFor(habitat);
            details.Add(Text($"+1 {reward} · {inventory.RemainingCapacity(reward)} spaces free", 12));
            row.Add(details);
            page.Add(row);
        }

        private void ShowFieldJournal()
        {
            var entries = expeditions.Journal;
            if (entries.Count == 0) return;
            Heading("Field journal");
            // Most recent finds first. Keep this view short during exploration.
            int firstVisible = showAllDiscoveries ? 0 : Mathf.Max(0, entries.Count - 5);
            for (int i = entries.Count - 1; i >= firstVisible; i--)
            {
                var record = entries[i];
                var habitat = (Habitat)record.habitat;
                var row = new VisualElement();
                row.style.flexDirection = FlexDirection.Row;
                row.style.alignItems = Align.Center;
                row.style.marginBottom = 6;
                row.style.paddingTop = 5;
                row.style.paddingBottom = 5;
                row.style.backgroundColor = new Color(0.92f, 0.95f, 0.87f);
                Corners(row, 12);

                var image = new Image
                {
                    sprite = Resources.Load<Sprite>("Art/world/" + habitat.ToString().ToLowerInvariant()),
                    scaleMode = ScaleMode.ScaleToFit,
                    pickingMode = PickingMode.Ignore
                };
                image.style.width = 56;
                image.style.height = 56;
                image.style.marginLeft = 8;
                image.style.marginRight = 12;
                row.Add(image);

                var label = Text(habitat + " · " + Expeditions.DiscoveryName(record), 14, true);
                label.style.flexGrow = 1;
                row.Add(label);
                page.Add(row);
            }
            if (entries.Count > 5)
                Add(showAllDiscoveries ? "Show recent finds" : "View full journal", () =>
                {
                    showAllDiscoveries = !showAllDiscoveries;
                    Refresh();
                });
        }

        private void Reward(MiniGame game, ItemId item)
        {
            bool found = inventory.Give(item);
            bool first = bond.Complete(game);
            if (first)
            {
                stage.React("joyful");
                Remember(game switch
                {
                    MiniGame.Echo => MemoryKind.FirstEcho,
                    MiniGame.Skip => MemoryKind.FirstSkip,
                    _ => MemoryKind.FirstPairs
                });
            }
            Commit((found ? $"Found a {item}!" : "Basket full.") + (first ? " Your bond grew!" : ""));
        }

        private void ShowMemories()
        {
            Heading("Our little book of firsts");
            Line("The memories you make together stay here, even when days go by.");
            var entries = session.Memories.Entries;
            Line($"{entries.Count} of {MemoryBook.Limit} first moments collected");
            if (entries.Count == 0)
            {
                Line("Feed, play, create, and explore to write your first page.");
                return;
            }
            for (int i = entries.Count - 1; i >= 0; i--)
            {
                var entry = entries[i];
                var kind = (MemoryKind)entry.kind;
                var card = new VisualElement();
                card.style.backgroundColor = new Color(0.92f, 0.95f, 0.87f);
                card.style.marginBottom = 8;
                card.style.paddingLeft = 14;
                card.style.paddingTop = 10;
                card.style.paddingBottom = 10;
                Corners(card, 14);
                card.Add(Text(MemoryBook.Title(kind), 16, true));
                card.Add(Text(DateTimeOffset.FromUnixTimeMilliseconds(
                    entry.occurredAt).ToString("MMM d, yyyy"), 12));
                page.Add(card);
            }
        }

        private void Remember(MemoryKind kind) =>
            session.Memories.Record(kind, GameStore.Now());

        private void Act(string label, Action action, string result,
            string pose = null, MemoryKind? memory = null)
        {
            Add(label, () =>
            {
                action();
                if (memory.HasValue) Remember(memory.Value);
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

        // Three compact columns keep essential care actions reachable on phones.
        // Every meter includes its numeric value; color alone never conveys state.
        private void StatRow(params (string label, float value)[] stats)
        {
            var row = new VisualElement();
            row.style.flexDirection = FlexDirection.Row;
            row.style.marginBottom = 6;
            foreach (var (label, value) in stats)
            {
                var column = new VisualElement();
                column.style.flexGrow = 1;
                column.style.flexBasis = 0;
                column.style.marginRight = 5;
                column.Add(Text($"{label} {value:0}/100", 12, true));

                var track = new VisualElement();
                track.style.height = 7;
                track.style.marginTop = 4;
                track.style.backgroundColor = new Color(0.82f, 0.87f, 0.79f);
                Corners(track, 4);

                var fill = new VisualElement();
                fill.style.width = new Length(Mathf.Clamp(value, 0, 100),
                    LengthUnit.Percent);
                fill.style.height = 7;
                fill.style.backgroundColor = new Color(0.38f, 0.66f, 0.42f);
                Corners(fill, 4);
                track.Add(fill);
                column.Add(track);
                row.Add(column);
            }
            page.Add(row);
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
