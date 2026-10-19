import { StyleSheet, View } from 'react-native';
import { ITEM_CATALOG } from '../../domain/items/inventory';
import { RoomSpot } from './RoomSpot';
import { ROOM_SLOTS, type Room, type RoomItem, type RoomSlot } from './room';

type Props = Readonly<{
  room: Room;
  selectedRoomItem: RoomItem | null;
  reduceMotion: boolean;
  width: '100%' | '48%' | '31%';
  onPress: (slot: RoomSlot) => void;
}>;

export function RoomSlots({
  room,
  selectedRoomItem,
  reduceMotion,
  width,
  onPress,
}: Props) {
  const selectedItemName = selectedRoomItem
    ? ITEM_CATALOG[selectedRoomItem].name
    : null;

  return (
    <View style={styles.slots}>
      {(Object.keys(ROOM_SLOTS) as RoomSlot[]).map((slot) => {
        const item = room[slot];
        return (
          <RoomSpot
            key={slot}
            label={ROOM_SLOTS[slot]}
            reduceMotion={reduceMotion}
            width={width}
            selectedItemName={selectedItemName}
            itemName={item ? ITEM_CATALOG[item].name : null}
            onPress={() => onPress(slot)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
});
