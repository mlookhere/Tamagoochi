import { useReducer } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Page } from '../components/Page';
import {
  ITEM_CATALOG,
  RECIPES,
  itemCount,
  type ItemId,
  type RecipeId,
} from '../domain/items/inventory';
import { RoomSpot } from '../features/home/RoomSpot';
import { RoomCompanion } from '../features/home/RoomCompanion';
import { useReducedMotion } from '../features/home/useReducedMotion';
import {
  companionPlacement,
  roomMood,
} from '../features/home/companionResponse';
import { ROOM_ITEMS, ROOM_SLOTS, type RoomSlot } from '../features/home/room';
import { ECHO_SYMBOLS, echoPattern } from '../features/minigames/echo';
import { pairBoard } from '../features/minigames/pairs';
import { HOPS, skipTarget } from '../features/minigames/skips';
import { newWorkshop, reduceWorkshop } from '../features/home/workshopState';
import { roomColumns } from '../features/home/workshopLayout';

export default function Workshop() {
  const [state, dispatch] = useReducer(reduceWorkshop, undefined, newWorkshop);
  const reduceMotion = useReducedMotion();
  const { width, fontScale } = useWindowDimensions();
  const columns = roomColumns(width, fontScale);
  const roomWidth = columns === 1 ? '100%' : columns === 2 ? '48%' : '31%';
  const pickerWidth = columns === 1 ? '100%' : '48%';
  const board = pairBoard(state.pairs.round);
  const reviewing = state.pairs.revealed.length === 2;

  return (
    <Page
      eyebrow="Your tiny workshop"
      title="Make a little something."
      description="Combine simple discoveries into treats, toys, keepsakes, and room decor."
    >
      <Text style={styles.preview}>
        Preview inventory. Saving your crafted items will be added after native
        persistence approval.
      </Text>
      <Text accessibilityRole="summary" accessibilityLiveRegion="polite" style={styles.notice}>
        {state.notice}
      </Text>
      <View style={styles.companionPanel}>
        <Text style={styles.itemName}>Mochi&apos;s corner</Text>
        <Text style={styles.companionProgress}>
          Bond {state.bond.bond}/100 · Curiosity{' '}
          {state.bond.personality.curiosity}
          {' · '}Courage {state.bond.personality.courage}
          {' · '}Focus {state.bond.personality.focus}
        </Text>
        <RoomCompanion
          placement={companionPlacement(state.room)}
          reduceMotion={reduceMotion}
        />
        <Text style={styles.companionMood}>{roomMood(state.room)}</Text>
        <Text style={styles.ingredients}>
          Craft a picnic snack to share with Mochi. The first one adds bond.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Share picnic snack with Mochi"
          accessibilityHint="Spends one crafted picnic snack"
          accessibilityState={{
            disabled: itemCount(state.inventory, 'picnicSnack') === 0,
          }}
          disabled={itemCount(state.inventory, 'picnicSnack') === 0}
          onPress={() => dispatch({ type: 'shareSnack' })}
          style={[
            styles.makeButton,
            styles.snackButton,
            itemCount(state.inventory, 'picnicSnack') === 0 &&
              styles.roomChoiceUnavailable,
          ]}
        >
          <Text style={styles.makeText}>
            Share snack ({itemCount(state.inventory, 'picnicSnack')})
          </Text>
        </Pressable>
        <Text style={styles.ingredients}>
          Each minigame strengthens your bond once. Replays have no penalty.
        </Text>
      </View>
      <Text style={styles.heading}>Your basket</Text>
      <View style={styles.inventory}>
        {(Object.keys(ITEM_CATALOG) as ItemId[]).map((item) => (
          <View key={item} style={styles.inventoryRow}>
            <View>
              <Text style={styles.itemName}>{ITEM_CATALOG[item].name}</Text>
              <Text style={styles.category}>{ITEM_CATALOG[item].category}</Text>
            </View>
            <Text style={styles.quantity}>
              {itemCount(state.inventory, item)}
            </Text>
          </View>
        ))}
      </View>
      <Text style={styles.heading}>Make something</Text>
      {(Object.keys(RECIPES) as RecipeId[]).map((recipeId) => {
        const recipe = RECIPES[recipeId];
        const requirements = Object.entries(recipe.ingredients)
          .map(
            ([id, amount]) =>
              `${amount} ${ITEM_CATALOG[id as ItemId].name.toLowerCase()}`,
          )
          .join(' + ');
        return (
          <View key={recipeId} style={styles.recipe}>
            <View style={styles.recipeInfo}>
              <Text style={styles.itemName}>{recipe.name}</Text>
              <Text style={styles.ingredients}>{requirements}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Make ${recipe.name}`}
              onPress={() => dispatch({ type: 'craft', recipeId })}
              style={styles.makeButton}
            >
              <Text style={styles.makeText}>Make</Text>
            </Pressable>
          </View>
        );
      })}
      <Text style={styles.heading}>Decorate the room</Text>
      <Text style={styles.ingredients}>
        Select a crafted object, then tap an empty space to place it. Tap an
        occupied space to pick the object up. Items return to your basket.
      </Text>
      <View style={styles.roomPicker}>
        {ROOM_ITEMS.map((item) => {
          const selected = state.selectedRoomItem === item;
          const available = itemCount(state.inventory, item) > 0;
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityLabel={
                'Choose ' + ITEM_CATALOG[item].name + ' for the room'
              }
              accessibilityState={{ selected, disabled: !available }}
              disabled={!available}
              onPress={() => dispatch({ type: 'roomItem', item })}
              style={[
                styles.roomChoice,
                { width: pickerWidth },
                selected && styles.roomChoiceSelected,
                !available && styles.roomChoiceUnavailable,
              ]}
            >
              <Text style={styles.roomChoiceText}>
                {ITEM_CATALOG[item].name} ({itemCount(state.inventory, item)})
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.roomSlots}>
        {(Object.keys(ROOM_SLOTS) as RoomSlot[]).map((slot) => (
          <RoomSpot
            key={slot}
            label={ROOM_SLOTS[slot]}
            reduceMotion={reduceMotion}
            width={roomWidth}
            selectedItemName={
              state.selectedRoomItem
                ? ITEM_CATALOG[state.selectedRoomItem].name
                : null
            }
            itemName={
              state.room[slot] ? ITEM_CATALOG[state.room[slot]].name : null
            }
            onPress={() => dispatch({ type: 'roomSlot', slot })}
          />
        ))}
      </View>
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
    </Page>
  );
}

const styles = StyleSheet.create({
  preview: { color: '#755F42', fontSize: 13, lineHeight: 19 },
  notice: {
    marginTop: 14,
    borderRadius: 14,
    padding: 14,
    color: '#355944',
    backgroundColor: '#E3EDD9',
    fontWeight: '600',
  },
  companionPanel: {
    marginTop: 14,
    padding: 14,
    gap: 6,
    backgroundColor: '#EFF2E7',
    borderRadius: 14,
  },
  snackButton: { alignSelf: 'flex-start', marginTop: 6 },
  companionProgress: {
    color: '#365742',
    fontWeight: '700',
    fontSize: 12,
  },
  companionMood: { color: '#526E58', fontSize: 13, lineHeight: 19 },
  heading: {
    marginTop: 26,
    marginBottom: 12,
    fontSize: 19,
    fontWeight: '800',
    color: '#2D4A38',
  },
  inventory: { gap: 8 },
  inventoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#EFF2E7',
  },
  itemName: { fontSize: 14, fontWeight: '700', color: '#324B38' },
  category: { marginTop: 3, fontSize: 11, color: '#6B7A6D' },
  quantity: { fontSize: 15, fontWeight: '800', color: '#3E694A' },
  recipe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#EFF2E7',
  },
  recipeInfo: { flex: 1, gap: 5 },
  ingredients: { fontSize: 12, color: '#6B7A6D' },
  makeButton: {
    minWidth: 72,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#345E46',
  },
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
  roomPicker: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roomChoice: {
    minHeight: 48,
    borderRadius: 12,
    padding: 9,
    backgroundColor: '#345E46',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomChoiceSelected: { backgroundColor: '#507D5A' },
  roomChoiceUnavailable: { opacity: 0.45 },
  roomChoiceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  roomSlots: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
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
