import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Pressable } from 'react-native';
import { BottomSheet } from '@/src/components/ui/BottomSheet';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { CalendarClock } from 'lucide-react-native';

import { Text } from './Text';
import { Button } from './Button';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { cn } from '@/src/lib/utils';

interface DateTimePickerFieldProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  testID?: string;
  error?: string;
}

function formatDateTime(date: Date, locale: string) {
  return date.toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DateTimePickerField({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
  testID,
  error,
}: DateTimePickerFieldProps) {
  const colors = useThemeColor();
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  const handleChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (date) setDraft(date);
  };

  const handleConfirm = () => {
    onChange(draft);
    setOpen(false);
  };

  const handleCancel = () => {
    setDraft(value);
    setOpen(false);
  };

  return (
    <>
      <Pressable testID={testID} onPress={() => setOpen(true)}>
        <View className={cn('mb-4', error && 'mb-2')}>
          {label && (
            <Text variant="label" className="mb-2 ml-1">
              {label}
            </Text>
          )}
          <View
            className={cn(
              'flex-row items-center rounded-2xl border border-border bg-card px-4 py-3.5',
              error && 'border-danger'
            )}
          >
            <CalendarClock size={18} color={colors.muted} />
            <Text className="ml-3 flex-1 text-base text-foreground">
              {formatDateTime(value, i18n.language)}
            </Text>
          </View>
          {error && (
            <Text variant="caption" className="mt-1.5 ml-1 text-danger">
              {error}
            </Text>
          )}
        </View>
      </Pressable>

      <BottomSheet isOpen={open} onClose={handleCancel} snapPoints={['40%']}>
        <View className="mb-4 flex-row items-center justify-between">
          <Button variant="ghost" onPress={handleCancel}>
            Cancel
          </Button>
          <Text variant="h3">{label}</Text>
          <Button variant="ghost" onPress={handleConfirm}>
            Done
          </Button>
        </View>
        <DateTimePicker
          value={draft}
          mode="datetime"
          display="spinner"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={handleChange}
          themeVariant="light"
        />
      </BottomSheet>
    </>
  );
}
