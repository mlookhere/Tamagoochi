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

        public static StoneSkip Restore(int round, int distance, int hops)
        {
            if (round < 0 || round > 1000000 || hops < 0 || hops > 2)
                throw new ArgumentException("Invalid Stone Skip progress");
            int target = Targets[round % Targets.Length];
            int remainingHops = 3 - hops;
            if ((hops == 0 && distance != 0) ||
                (hops > 0 && (distance < hops || distance > hops * 3 ||
                 target - distance < remainingHops ||
                 target - distance > remainingHops * 3)))
                throw new ArgumentException("Unreachable Stone Skip progress");
            return new StoneSkip { Round = round, Distance = distance, Hops = hops };
        }

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
