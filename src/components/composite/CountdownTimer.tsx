import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Clock } from 'lucide-react-native';
import { Text } from '@/src/components/ui/Text';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatRelativeTime } from '@/src/lib/utils';

interface CountdownTimerProps {
  targetDate: string;
  label?: string;
}

export function CountdownTimer({ targetDate, label = 'Ends' }: CountdownTimerProps) {
  const colors = useThemeColor();
  const [text, setText] = useState(() => formatRelativeTime(targetDate));

  useEffect(() => {
    setText(formatRelativeTime(targetDate));
    const interval = setInterval(() => {
      setText(formatRelativeTime(targetDate));
    }, 60000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <View className="flex-row items-center self-start rounded-full bg-warning/10 px-2.5 py-1">
      <Clock size={12} color={colors.warning} />
      <Text className="ml-1 text-xs font-semibold text-warning">
        {label} {text}
      </Text>
    </View>
  );
}
