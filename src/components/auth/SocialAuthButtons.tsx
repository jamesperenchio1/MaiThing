import { View, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from '@/src/components/ui/Text';

const PROVIDERS = [
  { id: 'apple', label: 'Apple', icon: '', bg: '#000000', iconColor: '#ffffff' },
  { id: 'google', label: 'Google', icon: 'G', bg: '#4285F4', iconColor: '#ffffff' },
  { id: 'line', label: 'LINE', icon: 'L', bg: '#06C755', iconColor: '#ffffff' },
  { id: 'facebook', label: 'Facebook', icon: 'f', bg: '#1877F2', iconColor: '#ffffff' },
] as const;

interface Props {
  onPress: (provider: string) => void;
}

export function SocialAuthButtons({ onPress }: Props) {
  return (
    <View className="gap-3">
      {PROVIDERS.map((p) => (
        <Pressable
          key={p.id}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress(p.id);
          }}
          className="flex-row items-center rounded-2xl border border-border bg-card px-4 py-3 active:opacity-60"
          accessibilityRole="button"
          accessibilityLabel={`Continue with ${p.label}`}
        >
          <View
            className="mr-3 items-center justify-center rounded-lg"
            style={{ width: 30, height: 30, backgroundColor: p.bg }}
          >
            <Text style={{ color: p.iconColor, fontWeight: '700', fontSize: 15, lineHeight: 18 }}>
              {p.icon}
            </Text>
          </View>
          <Text variant="body-sm" className="font-semibold">
            Continue with {p.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
