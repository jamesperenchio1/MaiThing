import { View, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { Text } from '@/src/components/ui/Text';

const PROVIDERS = [
  { id: 'google' as const, label: 'Google', icon: 'G', bg: '#4285F4', iconColor: '#ffffff' },
  { id: 'apple' as const, label: 'Apple', icon: 'A', bg: '#000000', iconColor: '#ffffff' },
];

interface Props {
  onPress: (provider: 'google' | 'apple') => void;
}

export function SocialAuthButtons({ onPress }: Props) {
  const { t } = useTranslation();

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
          accessibilityLabel={t('auth.continueWith', { provider: p.label })}
          accessibilityHint={t('auth.continueWithHint', { provider: p.label })}
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
            {t('auth.continueWith', { provider: p.label })}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
