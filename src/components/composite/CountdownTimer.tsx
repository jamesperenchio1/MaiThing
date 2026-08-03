import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Clock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/src/components/ui/Text';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatRelativeTime } from '@/src/lib/utils';

interface CountdownTimerProps {
  targetDate: string;
  label?: string;
}

export function CountdownTimer({ targetDate, label = 'Ends' }: CountdownTimerProps) {
  const colors = useThemeColor();
  const { i18n } = useTranslation();
  const [text, setText] = useState(() => formatRelativeTime(targetDate, i18n.language));

  useEffect(() => {
    setText(formatRelativeTime(targetDate, i18n.language));
    const interval = setInterval(() => {
      setText(formatRelativeTime(targetDate, i18n.language));
    }, 60000);
    return () => clearInterval(interval);
  }, [targetDate, i18n.language]);

  return (
    <View className="flex-row items-center self-start rounded-full bg-warning/10 px-2.5 py-1">
      <Clock size={12} color={colors.warning} />
      <Text className="ml-1 text-xs font-semibold text-warning">
        {label} {text}
      </Text>
    </View>
  );
}
