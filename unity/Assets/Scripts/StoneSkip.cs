using System;

namespace Tamagoochi
{
    public enum SkipResult { Progress, Miss, Complete }

    // Three hops must land exactly on the far bank. Retrying is free.
    public sealed class StoneSkip
    {
        private static readonly int[] Targets = { 6, 7, 8, 9 };
        public int Round { get; private set; }
        public int Distance { get; private set; }
        public int Hops { get; private set; }
        public int Target => Targets[Round % Targets.Length];

        public SkipResult Preview(int hop) => Evaluate(hop, false);

        public SkipResult Choose(int hop) => Evaluate(hop, true);

        private SkipResult Evaluate(int hop, bool apply)
        {
            if (hop < 1 || hop > 3) throw new ArgumentOutOfRangeException(nameof(hop));
            int landed = Distance + hop;
            int left = 3 - Hops - 1;
            int remaining = Target - landed;
            var result = left == 0 && remaining == 0 ? SkipResult.Complete :
                remaining < left || remaining > left * 3 ? SkipResult.Miss : SkipResult.Progress;
            if (!apply) return result;
            if (result == SkipResult.Complete) Round++;
            if (result == SkipResult.Progress) { Distance = landed; Hops++; }
            else { Distance = 0; Hops = 0; }
            return result;
        }
    }
}
