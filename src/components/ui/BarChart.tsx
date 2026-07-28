import { View } from 'react-native';
import { Text } from './Text';
import { cn } from '@/src/lib/utils';

interface BarChartProps {
  data: number[];
  labels: string[];
  color?: string;
  height?: number;
  className?: string;
}

export function BarChart({
  data,
  labels,
  color = '#16A34A',
  height = 160,
  className,
}: BarChartProps) {
  const max = Math.max(...data, 1);

  return (
    <View className={cn('flex-col', className)}>
      <View
        className="flex-row items-end justify-between rounded-2xl bg-muted/10 px-4"
        style={{ height }}
      >
        {data.map((value, index) => {
          const barHeight = Math.max((value / max) * (height - 48), 4);
          return (
            <View key={index} className="flex-1 items-center justify-end pb-3">
              <Text variant="caption" className="mb-1 text-muted">
                {value}
              </Text>
              <View
                className="w-3/5 rounded-t-lg"
                style={{ height: barHeight, backgroundColor: color }}
              />
            </View>
          );
        })}
      </View>
      <View className="mt-2 flex-row justify-between px-2">
        {labels.map((label, index) => (
          <Text key={index} variant="caption" className="flex-1 text-center text-muted">
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}
