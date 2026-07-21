import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '../../src/components/ui/Button';
import { Icon, type IconName } from '../../src/components/ui/Icon';
import { Screen } from '../../src/components/ui/Screen';
import { useTheme } from '../../src/theme';
import { markOnboardingComplete } from '../../src/lib/onboarding';

const { width: screenWidth } = Dimensions.get('window');

const ONBOARDING_STEPS = [
  {
    icon: 'restaurant-outline' as IconName,
    key: 'rescue' as const,
  },
  {
    icon: 'map-outline' as IconName,
    key: 'browse' as const,
  },
  {
    icon: 'bag-outline' as IconName,
    key: 'buy' as const,
  },
  {
    icon: 'walk-outline' as IconName,
    key: 'pickup' as const,
  },
] as const;

type StepKey = (typeof ONBOARDING_STEPS)[number]['key'];

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, spacing, radii, fontSizes, fontWeights, lineHeights } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    flatListRef.current?.scrollToIndex({ animated: true, index: activeIndex });
  }, [activeIndex]);

  const completeOnboarding = async () => {
    await markOnboardingComplete();
    router.replace('/(buyer)/discover');
  };

  const styles = makeStyles({
    colors,
    spacing,
    radii,
    fontSizes,
    fontWeights,
    lineHeights,
  });

  const renderItem = ({
    item,
    index,
  }: {
    item: { icon: IconName; key: StepKey };
    index: number;
  }) => {
    const inputRange = [(index - 1) * screenWidth, index * screenWidth, (index + 1) * screenWidth];

    const scale = scrollX.interpolate({
      extrapolate: 'clamp',
      inputRange,
      outputRange: [0.85, 1, 0.85],
    });

    const opacity = scrollX.interpolate({
      extrapolate: 'clamp',
      inputRange,
      outputRange: [0.5, 1, 0.5],
    });

    return (
      <Animated.View
        style={[
          styles.slide,
          {
            backgroundColor: colors.background,
            opacity,
            transform: [{ scaleX: scale }, { scaleY: scale }],
            width: screenWidth,
          },
        ]}
      >
        <View style={styles.visual}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.primaryMuted, borderColor: colors.borderSubtle },
            ]}
          >
            <Icon name={item.icon} size={64} color={colors.primary} />
          </View>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>{t(`onboarding.${item.key}.title`)}</Text>
          <Text style={styles.subtitle}>{t(`onboarding.${item.key}.subtitle`)}</Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Screen safeArea={false}>
        <View style={styles.header}>
          <Pressable
            hitSlop={{ bottom: 16, left: 16, right: 16, top: 16 }}
            onPress={() => void completeOnboarding()}
            style={styles.skip}
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.skip')}
          >
            <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
          </Pressable>
        </View>

        <FlatList
          ref={flatListRef}
          data={ONBOARDING_STEPS}
          horizontal
          keyExtractor={(item) => item.key}
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
            setActiveIndex(newIndex);
          }}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: false,
          })}
          pagingEnabled
          renderItem={renderItem}
          showsHorizontalScrollIndicator={false}
        />

        <View style={styles.footer}>
          <View style={styles.dots}>
            {ONBOARDING_STEPS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: index === activeIndex ? colors.primary : colors.textMuted,
                    width: index === activeIndex ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>

          {activeIndex === ONBOARDING_STEPS.length - 1 ? (
            <Button onPress={() => void completeOnboarding()}>{t('onboarding.getStarted')}</Button>
          ) : (
            <Button onPress={() => setActiveIndex((prev) => prev + 1)}>
              {t('onboarding.next')}
            </Button>
          )}
        </View>
      </Screen>
    </SafeAreaView>
  );
}

function makeStyles({
  colors,
  spacing,
  radii,
  fontSizes,
  fontWeights,
  lineHeights,
}: {
  colors: ReturnType<typeof import('../../src/theme').useTheme>['colors'];
  spacing: ReturnType<typeof import('../../src/theme').useTheme>['spacing'];
  radii: ReturnType<typeof import('../../src/theme').useTheme>['radii'];
  fontSizes: ReturnType<typeof import('../../src/theme').useTheme>['fontSizes'];
  fontWeights: ReturnType<typeof import('../../src/theme').useTheme>['fontWeights'];
  lineHeights: ReturnType<typeof import('../../src/theme').useTheme>['lineHeights'];
}) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    dots: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing[2],
      justifyContent: 'center',
      marginBottom: spacing[8],
    },
    dot: {
      borderRadius: 4,
      height: 8,
    },
    footer: {
      paddingBottom: spacing[6],
      paddingHorizontal: spacing[6],
    },
    header: {
      alignItems: 'flex-end',
      paddingHorizontal: spacing[4],
      paddingTop: spacing[4],
    },
    iconCircle: {
      alignItems: 'center',
      borderRadius: radii.full,
      borderWidth: 1,
      height: 160,
      justifyContent: 'center',
      width: 160,
    },
    skip: {
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[2],
    },
    skipText: {
      color: colors.textMuted,
      fontSize: fontSizes.base,
    },
    slide: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing[6],
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: fontSizes.lg,
      lineHeight: fontSizes.lg * lineHeights.relaxed,
      textAlign: 'center',
    },
    textContainer: {
      alignItems: 'center',
      gap: spacing[3],
      maxWidth: 320,
    },
    title: {
      color: colors.text,
      fontSize: fontSizes['3xl'],
      fontWeight: fontWeights.bold,
      textAlign: 'center',
    },
    visual: {
      alignItems: 'center',
      marginBottom: spacing[10],
    },
  });
}
