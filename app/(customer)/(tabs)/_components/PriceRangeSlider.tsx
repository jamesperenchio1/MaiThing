import { useRef } from 'react';
import { View, PanResponder } from 'react-native';
import { Text } from '@/src/components/ui/Text';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { PRICE_MIN, PRICE_MAX, PRICE_STEP } from './constants';

export function PriceRangeSlider({
  values,
  onChange,
}: {
  values: [number, number];
  onChange: (range: [number, number]) => void;
}) {
  const colors = useThemeColor();
  const sliderWidthRef = useRef(0);
  const valuesRef = useRef(values);
  valuesRef.current = values;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const minStartRef = useRef(0);
  const maxStartRef = useRef(0);

  const minPR = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        minStartRef.current = valuesRef.current[0];
      },
      onPanResponderMove: (_, gs) => {
        const sw = sliderWidthRef.current;
        if (sw <= 0) return;
        const raw = minStartRef.current + (gs.dx / sw) * (PRICE_MAX - PRICE_MIN);
        const v =
          Math.round(
            Math.max(PRICE_MIN, Math.min(valuesRef.current[1] - PRICE_STEP, raw)) / PRICE_STEP
          ) * PRICE_STEP;
        if (v !== valuesRef.current[0]) onChangeRef.current([v, valuesRef.current[1]]);
      },
    })
  ).current;

  const maxPR = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        maxStartRef.current = valuesRef.current[1];
      },
      onPanResponderMove: (_, gs) => {
        const sw = sliderWidthRef.current;
        if (sw <= 0) return;
        const raw = maxStartRef.current + (gs.dx / sw) * (PRICE_MAX - PRICE_MIN);
        const v =
          Math.round(
            Math.max(valuesRef.current[0] + PRICE_STEP, Math.min(PRICE_MAX, raw)) / PRICE_STEP
          ) * PRICE_STEP;
        if (v !== valuesRef.current[1]) onChangeRef.current([valuesRef.current[0], v]);
      },
    })
  ).current;

  const minPct = (values[0] - PRICE_MIN) / (PRICE_MAX - PRICE_MIN);
  const maxPct = (values[1] - PRICE_MIN) / (PRICE_MAX - PRICE_MIN);

  return (
    <View className="mb-2">
      <View className="flex-row justify-between mb-3">
        <View className="rounded-xl bg-primary/10 px-3 py-1.5">
          <Text variant="body-sm" className="text-primary font-semibold">
            ฿{values[0]}
          </Text>
        </View>
        <View className="rounded-xl bg-primary/10 px-3 py-1.5">
          <Text variant="body-sm" className="text-primary font-semibold">
            ฿{values[1]}
            {values[1] >= PRICE_MAX ? '+' : ''}
          </Text>
        </View>
      </View>

      <View
        style={{ paddingHorizontal: 12, paddingVertical: 12 }}
        onLayout={(e) => {
          sliderWidthRef.current = e.nativeEvent.layout.width - 24;
        }}
      >
        <View style={{ height: 4, backgroundColor: colors.border, borderRadius: 2 }}>
          {/* Active track */}
          <View
            style={{
              position: 'absolute',
              height: 4,
              left: `${minPct * 100}%`,
              right: `${(1 - maxPct) * 100}%`,
              backgroundColor: colors.primary,
              borderRadius: 2,
            }}
          />
          {/* Min thumb */}
          <View
            {...minPR.panHandlers}
            // eslint-disable-next-line react-native/no-color-literals -- shadow is deliberately black in both themes
            style={{
              position: 'absolute',
              left: `${minPct * 100}%`,
              transform: [{ translateX: -12 }, { translateY: -10 }],
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: colors.card,
              borderWidth: 2.5,
              borderColor: colors.primary,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.18,
              shadowRadius: 4,
              elevation: 4,
            }}
          />
          {/* Max thumb */}
          <View
            {...maxPR.panHandlers}
            // eslint-disable-next-line react-native/no-color-literals -- shadow is deliberately black in both themes
            style={{
              position: 'absolute',
              left: `${maxPct * 100}%`,
              transform: [{ translateX: -12 }, { translateY: -10 }],
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: colors.card,
              borderWidth: 2.5,
              borderColor: colors.primary,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.18,
              shadowRadius: 4,
              elevation: 4,
            }}
          />
        </View>
      </View>

      <View className="flex-row justify-between px-1">
        <Text variant="caption" className="text-muted">
          ฿{PRICE_MIN}
        </Text>
        <Text variant="caption" className="text-muted">
          ฿{PRICE_MAX}+
        </Text>
      </View>
    </View>
  );
}
