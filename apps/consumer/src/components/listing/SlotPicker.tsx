import { Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import type { Tables } from '@maithing/shared';

type PickupSlot = Tables<'pickup_slots'>;

interface Props {
  slots: PickupSlot[];
  selectedSlotId: string | null;
  onSelect: (slot: PickupSlot) => void;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function SlotPicker({ slots, selectedSlotId, onSelect }: Props) {
  if (slots.length === 0) {
    return <Text style={styles.noSlots}>No available pickup times</Text>;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {slots.map((slot) => {
        const isSelected = slot.id === selectedSlotId;
        const spotsLeft = slot.capacity - slot.reserved_count;
        return (
          <TouchableOpacity
            key={slot.id}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onSelect(slot)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <Text style={[styles.chipDate, isSelected && styles.chipTextSelected]}>
              {formatDate(slot.starts_at)}
            </Text>
            <Text style={[styles.chipTime, isSelected && styles.chipTextSelected]}>
              {formatTime(slot.starts_at)} – {formatTime(slot.ends_at)}
            </Text>
            <Text style={[styles.chipSpots, isSelected && styles.chipSpotsSelected]}>
              {spotsLeft} left
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 10, paddingVertical: 4 },
  noSlots: { fontSize: 14, color: '#9ca3af', fontStyle: 'italic' },
  chip: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 110,
  },
  chipSelected: {
    backgroundColor: '#dcfce7',
    borderColor: '#16a34a',
  },
  chipDate: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
  chipTime: { fontSize: 13, fontWeight: '600', color: '#111827' },
  chipSpots: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
  chipTextSelected: { color: '#15803d' },
  chipSpotsSelected: { color: '#16a34a' },
});
