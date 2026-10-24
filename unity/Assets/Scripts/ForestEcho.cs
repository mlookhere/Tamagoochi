using System;

namespace Tamagoochi
{
    public enum EchoSymbol { Leaf, Sun, Stone }
    public enum EchoResult { Correct, Miss, Complete }

    public sealed class ForestEcho
    {
        private static readonly EchoSymbol[][] Patterns =
        {
            new[] { EchoSymbol.Leaf, EchoSymbol.Sun, EchoSymbol.Stone },
            new[] { EchoSymbol.Stone, EchoSymbol.Leaf, EchoSymbol.Sun },
            new[] { EchoSymbol.Sun, EchoSymbol.Stone, EchoSymbol.Leaf },
            new[] { EchoSymbol.Leaf, EchoSymbol.Stone, EchoSymbol.Sun }
        };

        public int Round { get; private set; }
        public int Progress { get; private set; }
        public EchoSymbol[] Pattern => (EchoSymbol[])Patterns[Round % Patterns.Length].Clone();

        public static ForestEcho Restore(int round, int progress)
        {
            if (round < 0 || round > 1000000 || progress < 0 || progress >= 3)
                throw new ArgumentException("Invalid Forest Echo progress");
            return new ForestEcho { Round = round, Progress = progress };
        }

        public EchoResult Choose(EchoSymbol symbol)
        {
            if (!Enum.IsDefined(typeof(EchoSymbol), symbol))
                throw new ArgumentOutOfRangeException(nameof(symbol));
            if (Patterns[Round % Patterns.Length][Progress] != symbol)
            {
                Progress = 0;
                return EchoResult.Miss;
            }
            Progress++;
            if (Progress < 3) return EchoResult.Correct;
            Progress = 0;
            Round++;
            return EchoResult.Complete;
        }
    }
}
