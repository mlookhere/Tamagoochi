import { useReducer } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Page } from '../components/Page';
import {
  ITEM_CATALOG,
  itemCount,
  type ItemId,
} from '../domain/items/inventory';
import { RoomSlots } from '../features/home/RoomSlots';
import { CompanionPanel } from '../features/home/CompanionPanel';
import { WorkshopGames } from '../features/home/WorkshopGames';
import { WorkshopRecipes } from '../features/home/WorkshopRecipes';
import { useReducedMotion } from '../features/home/useReducedMotion';
import { ROOM_ITEMS } from '../features/home/room';
import { newWorkshop, reduceWorkshop } from '../features/home/workshopState';
import { columnWidth, roomColumns } from '../features/home/workshopLayout';

export default function Workshop() {
  const [state, dispatch] = useReducer(reduceWorkshop, undefined, newWorkshop);
  const reduceMotion = useReducedMotion();
  const { width, fontScale } = useWindowDimensions();
  const columns = roomColumns(width, fontScale);
  const roomWidth = columnWidth(columns);
  const pickerWidth = columns === 1 ? '100%' : '48%';

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
      <Text
        accessibilityRole="summary"
        accessibilityLiveRegion="polite"
        style={styles.notice}
      >
        {state.notice}
      </Text>
      <CompanionPanel
        bond={state.bond}
        room={state.room}
        inventory={state.inventory}
        reduceMotion={reduceMotion}
        onShare={() => dispatch({ type: 'shareSnack' })}
      />
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
      <WorkshopRecipes
        inventory={state.inventory}
        onCraft={(recipeId) => dispatch({ type: 'craft', recipeId })}
      />
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
      <RoomSlots
        room={state.room}
        selectedRoomItem={state.selectedRoomItem}
        reduceMotion={reduceMotion}
        width={roomWidth}
        onPress={(slot) => dispatch({ type: 'roomSlot', slot })}
      />
      <WorkshopGames state={state} dispatch={dispatch} width={roomWidth} />
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
  ingredients: { fontSize: 12, color: '#6B7A6D' },
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
});
