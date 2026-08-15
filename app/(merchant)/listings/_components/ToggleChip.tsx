import { View } from 'react-native';
import { Text } from '@/src/components/ui/Text';
import { PressableScale } from '@/src/components/ui/PressableScale';

export function ToggleChip({
  label,
  selected,
  onPress,
  testID,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <PressableScale testID={testID} onPress={onPress} scale={0.95}>
      <View
        className={`mr-2 mb-2 rounded-full px-4 py-2 ${
          selected ? 'bg-primary' : 'bg-muted/10 border border-border'
        }`}
      >
        <Text variant="body-sm" className={selected ? 'text-white' : 'text-foreground'}>
          {label}
        </Text>
      </View>
    </PressableScale>
  );
}
