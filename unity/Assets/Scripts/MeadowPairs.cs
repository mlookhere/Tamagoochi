using System;
using System.Collections.Generic;

namespace Tamagoochi
{
    public enum PairResult { Reveal, Match, Miss, Complete, Ignored }

    // Every board contains three pairs; unresolved mismatches stay visible.
    public sealed class MeadowPairs
    {
        private static readonly EchoSymbol[][] Boards =
        {
            new[] { EchoSymbol.Leaf, EchoSymbol.Sun, EchoSymbol.Stone, EchoSymbol.Stone, EchoSymbol.Sun, EchoSymbol.Leaf },
            new[] { EchoSymbol.Stone, EchoSymbol.Leaf, EchoSymbol.Sun, EchoSymbol.Leaf, EchoSymbol.Stone, EchoSymbol.Sun },
            new[] { EchoSymbol.Sun, EchoSymbol.Stone, EchoSymbol.Leaf, EchoSymbol.Sun, EchoSymbol.Leaf, EchoSymbol.Stone },
            new[] { EchoSymbol.Leaf, EchoSymbol.Stone, EchoSymbol.Sun, EchoSymbol.Leaf, EchoSymbol.Sun, EchoSymbol.Stone }
        };

        private readonly List<int> matched = new();
        private readonly List<int> revealed = new();
        public int Round { get; private set; }
        public IReadOnlyList<int> Matched => matched.AsReadOnly();
        public IReadOnlyList<int> Revealed => revealed.AsReadOnly();
        public EchoSymbol[] Board => (EchoSymbol[])Boards[Round % Boards.Length].Clone();

        public PairResult Choose(int card)
        {
            if (card < 0 || card >= 6) throw new ArgumentOutOfRangeException(nameof(card));
            Validate();
            if (matched.Contains(card) || revealed.Contains(card) || revealed.Count == 2)
                return PairResult.Ignored;
            if (revealed.Count == 0)
            {
                revealed.Add(card);
                return PairResult.Reveal;
            }
            int first = revealed[0];
            if (Boards[Round % Boards.Length][first] != Boards[Round % Boards.Length][card])
            {
                revealed.Add(card);
                return PairResult.Miss;
            }
            matched.Add(first);
            matched.Add(card);
            revealed.Clear();
            if (matched.Count < 6) return PairResult.Match;
            Round++;
            matched.Clear();
            return PairResult.Complete;
        }

        public void CloseMismatch()
        {
            Validate();
            if (revealed.Count == 2) revealed.Clear();
        }

        private void Validate()
        {
            if (matched.Count % 2 != 0 || matched.Count > 4 || revealed.Count > 2)
                throw new InvalidOperationException("Invalid pair progress");
            var used = new HashSet<int>();
            foreach (int card in matched)
                if (card < 0 || card >= 6 || !used.Add(card))
                    throw new InvalidOperationException("Invalid matched card");
            foreach (int card in revealed)
                if (card < 0 || card >= 6 || !used.Add(card))
                    throw new InvalidOperationException("Invalid revealed card");
            var board = Boards[Round % Boards.Length];
            for (int i = 0; i < matched.Count; i += 2)
                if (board[matched[i]] != board[matched[i + 1]])
                    throw new InvalidOperationException("Mismatched completed pair");
            if (revealed.Count == 2 && board[revealed[0]] == board[revealed[1]])
                throw new InvalidOperationException("Unresolved matching pair");
        }
    }
}
