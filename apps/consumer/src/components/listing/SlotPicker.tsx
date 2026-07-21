import { Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme';
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
  const { t } = useTranslation();
  const { colors, spacing, radii, fontSizes, fontWeights } = useTheme();

  const styles = makeStyles(colors, spacing, radii, fontSizes, fontWeights);

  if (slots.length === 0) {
    return <Text style={styles.noSlots}>{t('listing.noSlots')}</Text>;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
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
              {t('listing.remaining', { count: spotsLeft })}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function makeStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  radii: ReturnType<typeof useTheme>['radii'],
  fontSizes: ReturnType<typeof useTheme>['fontSizes'],
  fontWeights: ReturnType<typeof useTheme>['fontWeights'],
) {
  return StyleSheet.create({
    row: { gap: spacing[2], paddingVertical: spacing[1] },
    noSlots: {
      fontSize: fontSizes.base,
      color: colors.textMuted,
      fontStyle: 'italic',
    },
    chip: {
      backgroundColor: colors.borderSubtle,
      borderRadius: radii.lg,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
      minWidth: 110,
    },
    chipSelected: {
      backgroundColor: colors.primaryMuted,
      borderColor: colors.primary,
    },
    chipDate: {
      fontSize: fontSizes.xs,
      color: colors.textMuted,
      marginBottom: spacing[0],
    },
    chipTime: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.semibold,
      color: colors.text,
    },
    chipSpots: {
      fontSize: fontSizes.xs,
      color: colors.textMuted,
      marginTop: spacing[1],
    },
    chipTextSelected: { color: colors.primaryHover },
    chipSpotsSelected: { color: colors.primary },
  });
}
