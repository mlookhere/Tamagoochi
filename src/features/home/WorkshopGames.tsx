import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ECHO_SYMBOLS, echoPattern } from '../minigames/echo';
import { pairBoard } from '../minigames/pairs';
import { HOPS, skipTarget } from '../minigames/skips';
import type { WorkshopAction, WorkshopState } from './workshopState';

type Props = Readonly<{
  state: WorkshopState;
  dispatch: (action: WorkshopAction) => void;
}>;

function ForestEchoGame({ state, dispatch }: Props) {
  return (
    <>
      <Text style={styles.heading}>Forest Echo</Text>
      <Text style={styles.ingredients}>
        Mini game 1 of 3. Repeat the three nature symbols in order. There is no
        timer or penalty.
      </Text>
      <Text style={styles.echoPattern}>
        {echoPattern(state.echoRound).join(' → ')}
      </Text>
      <Text style={styles.ingredients}>Step {state.echoProgress + 1} of 3</Text>
      <View style={styles.echoChoices}>
        {ECHO_SYMBOLS.map((symbol) => (
          <Pressable
            key={symbol}
            accessibilityRole="button"
            accessibilityLabel={`Choose ${symbol} in Forest Echo`}
            style={styles.echoButton}
            onPress={() => dispatch({ type: 'echo', symbol })}
          >
            <Text style={styles.makeText}>{symbol}</Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}

function StoneSkipGame({ state, dispatch }: Props) {
  return (
    <>
      <Text style={styles.heading}>Stone Skip</Text>
      <Text style={styles.ingredients}>
        Mini game 2 of 3. Cross the river in exactly three hops. Choose 1, 2, or
        3 spaces per hop. An impossible route restarts without penalty.
      </Text>
      <Text style={styles.echoPattern}>
        {state.skipDistance} / {skipTarget(state.skipRound)} spaces
      </Text>
      <Text style={styles.ingredients}>Hop {state.skipHops + 1} of 3</Text>
      <View style={styles.echoChoices}>
        {HOPS.map((hop) => (
          <Pressable
            key={hop}
            accessibilityRole="button"
            accessibilityLabel={`Hop ${hop} spaces in Stone Skip`}
            style={styles.echoButton}
            onPress={() => dispatch({ type: 'skip', hop })}
          >
            <Text style={styles.makeText}>{hop} spaces</Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}

function MeadowPairsGame({ state, dispatch }: Props) {
  const board = pairBoard(state.pairs.round);
  const reviewing = state.pairs.revealed.length === 2;

  return (
    <>
      <Text style={styles.heading}>Meadow Pairs</Text>
      <Text style={styles.ingredients}>
        Mini game 3 of 3. Find the three matching symbol pairs. Unmatched cards
        stay visible until you turn them over. No timer or penalty.
      </Text>
      <Text style={styles.echoPattern}>
        {state.pairs.matched.length / 2} of 3 pairs found
      </Text>
      <View style={styles.pairGrid}>
        {board.map((symbol, card) => {
          const matched = state.pairs.matched.includes(card);
          const visible = matched || state.pairs.revealed.includes(card);
          const cardState = visible ? symbol : 'hidden';
          return (
            <Pressable
              key={card}
              accessibilityRole="button"
              accessibilityLabel={`Card ${card + 1}, ${cardState}`}
              accessibilityState={{ disabled: matched || reviewing }}
              disabled={matched || reviewing}
              style={[styles.pairCard, matched && styles.matchedCard]}
              onPress={() => dispatch({ type: 'pair', card })}
            >
              <Text style={styles.makeText}>{visible ? symbol : '?'}</Text>
            </Pressable>
          );
        })}
      </View>
      {reviewing && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Turn over unmatched cards and try again"
          style={styles.closeButton}
          onPress={() => dispatch({ type: 'closePair' })}
        >
          <Text style={styles.makeText}>Try another pair</Text>
        </Pressable>
      )}
    </>
  );
}

export function WorkshopGames({ state, dispatch }: Props) {
  return (
    <View>
      <ForestEchoGame state={state} dispatch={dispatch} />
      <StoneSkipGame state={state} dispatch={dispatch} />
      <MeadowPairsGame state={state} dispatch={dispatch} />
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    marginTop: 26,
    marginBottom: 12,
    fontSize: 19,
    fontWeight: '800',
    color: '#2D4A38',
  },
  ingredients: { fontSize: 12, color: '#6B7A6D' },
  makeText: { color: '#FFFFFF', fontWeight: '800' },
  echoPattern: {
    marginVertical: 12,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    color: '#345E46',
  },
  echoChoices: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 28,
  },
  echoButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#345E46',
  },
  pairGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  pairCard: {
    width: '31%',
    minHeight: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#345E46',
  },
  matchedCard: { backgroundColor: '#627F5D' },
  closeButton: {
    minHeight: 48,
    marginTop: 12,
    marginBottom: 28,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#345E46',
  },
});
