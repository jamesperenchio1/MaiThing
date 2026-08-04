import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Modal,
  View,
  Pressable,
  useWindowDimensions,
  Animated,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  ArrowRight,
  X,
  Hand,
  Utensils,
  Search,
  Map,
  Package,
  User,
  ShoppingCart,
  Leaf,
  type LucideIcon,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { useTutorialStore, TUTORIAL_TOTAL_STEPS } from '@/src/stores/tutorial';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useLanguageStore } from '@/src/stores/language';

const TAB_COUNT = 6;
const TAB_BAR_HEIGHT = 64;
const SPOTLIGHT_PADDING = 8;

interface Hotspot {
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius: number;
}

interface StepConfig {
  icon: LucideIcon;
  title: string;
  description: string;
  hotspot?: Hotspot;
  tooltipSide: 'top' | 'bottom' | 'center';
  requireTap: boolean;
  tapHint?: string;
  navigateTo?: string;
}

function useSteps(t: TFunction): StepConfig[] {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const tabBarTop = height - TAB_BAR_HEIGHT - insets.bottom;
    const tabWidth = width / TAB_COUNT;
    const contentTop = insets.top;

    const tabHotspot = (index: number): Hotspot => ({
      x: tabWidth * index + SPOTLIGHT_PADDING,
      y: tabBarTop + SPOTLIGHT_PADDING,
      width: tabWidth - SPOTLIGHT_PADDING * 2,
      height: TAB_BAR_HEIGHT + insets.bottom - SPOTLIGHT_PADDING * 2,
      borderRadius: 16,
    });

    const contentHotspot: Hotspot = {
      x: 16,
      y: contentTop + 8,
      width: width - 32,
      height: tabBarTop - contentTop - 16,
      borderRadius: 24,
    };

    return [
      {
        icon: Hand,
        title: t('tutorial.welcome.title'),
        description: t('tutorial.welcome.description'),
        tooltipSide: 'center',
        requireTap: false,
      },
      {
        icon: Utensils,
        title: t('tutorial.feed.title'),
        description: t('tutorial.feed.description'),
        tooltipSide: 'center',
        requireTap: false,
      },
      {
        icon: Search,
        title: t('tutorial.discover.title'),
        description: t('tutorial.discover.description'),
        hotspot: tabHotspot(1),
        tooltipSide: 'top',
        requireTap: true,
        tapHint: t('tutorial.tapHint.discover'),
        navigateTo: '/(customer)/(tabs)/discover',
      },
      {
        icon: Map,
        title: t('tutorial.map.title'),
        description: t('tutorial.map.description'),
        hotspot: tabHotspot(2),
        tooltipSide: 'top',
        requireTap: true,
        tapHint: t('tutorial.tapHint.map'),
        navigateTo: '/(customer)/(tabs)/map',
      },
      {
        icon: Package,
        title: t('tutorial.orders.title'),
        description: t('tutorial.orders.description'),
        hotspot: tabHotspot(3),
        tooltipSide: 'top',
        requireTap: true,
        tapHint: t('tutorial.tapHint.orders'),
        navigateTo: '/(customer)/(tabs)/orders',
      },
      {
        icon: User,
        title: t('tutorial.profile.title'),
        description: t('tutorial.profile.description'),
        hotspot: tabHotspot(5),
        tooltipSide: 'top',
        requireTap: true,
        tapHint: t('tutorial.tapHint.profile'),
        navigateTo: '/(customer)/(tabs)/profile',
      },
      {
        icon: ShoppingCart,
        title: t('tutorial.howToOrder.title'),
        description: t('tutorial.howToOrder.description'),
        tooltipSide: 'center',
        requireTap: false,
      },
      {
        icon: Leaf,
        title: t('tutorial.finish.title'),
        description: t('tutorial.finish.description'),
        tooltipSide: 'center',
        requireTap: false,
      },
    ];
  }, [t, width, height, insets.top, insets.bottom]);
}

export function TutorialOverlay() {
  const { t } = useTranslation();
  const { isActive, currentStep, nextStep, skipTutorial } = useTutorialStore();
  const steps = useSteps(t);
  const router = useRouter();
  const colors = useThemeColor();
  const { language, toggle: toggleLanguage } = useLanguageStore();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const pulseAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const step = steps[currentStep];

  useEffect(() => {
    if (!isActive) return;
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
    return () => {
      fadeAnim.setValue(0);
    };
  }, [currentStep, isActive]);

  useEffect(() => {
    if (!isActive || !step?.hotspot || !step.requireTap) {
      pulseAnim.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [currentStep, isActive]);

  const handleAdvance = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    nextStep();
    if (step?.navigateTo) {
      setTimeout(() => router.push(step.navigateTo as any), 80);
    }
  }, [step, nextStep, router]);

  if (!isActive || !step) return null;

  const { hotspot } = step;

  const borderOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });
  const borderScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.03],
  });

  const progress = currentStep / (TUTORIAL_TOTAL_STEPS - 1);

  const renderSpotlight = () => {
    if (!hotspot) return null;
    const { x, y, width: hw, height: hh, borderRadius } = hotspot;
    return (
      <>
        {/* top */}
        <View
          style={[styles.dimRect, { top: 0, left: 0, right: 0, height: y }]}
          pointerEvents="none"
        />
        {/* bottom */}
        <View
          style={[styles.dimRect, { top: y + hh, left: 0, right: 0, bottom: 0 }]}
          pointerEvents="none"
        />
        {/* left */}
        <View
          style={[styles.dimRect, { top: y, left: 0, width: x, height: hh }]}
          pointerEvents="none"
        />
        {/* right */}
        <View
          style={[styles.dimRect, { top: y, left: x + hw, right: 0, height: hh }]}
          pointerEvents="none"
        />

        {/* Pulsing border ring */}
        {step.requireTap && (
          <Animated.View
            style={[
              styles.spotlightBorder,
              {
                top: y - 3,
                left: x - 3,
                width: hw + 6,
                height: hh + 6,
                borderRadius: borderRadius + 3,
                borderColor: colors.primary,
                opacity: borderOpacity,
                transform: [{ scale: borderScale }],
              },
            ]}
            pointerEvents="none"
          />
        )}

        {/* Tap interceptor for requireTap steps */}
        {step.requireTap && (
          <Pressable
            style={[styles.tapZone, { top: y, left: x, width: hw, height: hh, borderRadius }]}
            onPress={handleAdvance}
          />
        )}
      </>
    );
  };

  const renderTooltip = () => {
    if (step.tooltipSide === 'center') {
      return (
        <View style={styles.centeredCardWrapper} pointerEvents="box-none">
        <View style={[styles.centeredCard, { backgroundColor: colors.card }]}>
          {/* Language toggle top-right of card */}
          <Pressable
            onPress={toggleLanguage}
            style={styles.langToggle}
            hitSlop={8}
          >
            <View style={[styles.langPill, { backgroundColor: colors.primary + '18' }]}>
              <Text variant="caption" style={{ color: colors.primary, fontWeight: '700' }}>
                {language === 'en' ? 'TH' : 'EN'}
              </Text>
            </View>
          </Pressable>

          <View style={styles.centeredContent}>
            {React.createElement(step.icon, { size: 44, color: colors.primary, style: styles.icon })}
            <Text variant="h3" className="text-center mb-2">
              {step.title}
            </Text>
            <Text variant="body-sm" className="text-muted text-center mb-6" style={styles.desc}>
              {step.description}
            </Text>

            {/* Progress dots */}
            <View style={styles.dots}>
              {steps.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        i === currentStep ? colors.primary : colors.muted + '40',
                      width: i === currentStep ? 16 : 6,
                    },
                  ]}
                />
              ))}
            </View>

            <View style={styles.buttonRow}>
              {currentStep === 0 ? (
                <>
                  <Button variant="primary" onPress={handleAdvance} style={{ flex: 1 }}>
                    {t('tutorial.letsGo')}
                  </Button>
                  <Button
                    variant="ghost"
                    onPress={skipTutorial}
                    textClassName="text-muted"
                    style={{ marginLeft: 8 }}
                  >
                    {t('tutorial.skip')}
                  </Button>
                </>
              ) : currentStep === TUTORIAL_TOTAL_STEPS - 1 ? (
                <Button variant="primary" onPress={handleAdvance} style={{ flex: 1 }}>
                  {t('tutorial.startRescuing')}
                </Button>
              ) : (
                <>
                  <Button variant="primary" onPress={handleAdvance} style={{ flex: 1 }}>
                    {t('tutorial.next')}
                  </Button>
                  <Button
                    variant="ghost"
                    onPress={skipTutorial}
                    textClassName="text-muted"
                    style={{ marginLeft: 8 }}
                  >
                    {t('tutorial.skip')}
                  </Button>
                </>
              )}
            </View>
          </View>
        </View>
        </View>
      );
    }

    if (!hotspot) return null;

    const { x, y, width: hw, height: hh } = hotspot;
    const CARD_WIDTH = Math.min(width - 48, 340);
    const cardLeft = Math.max(16, Math.min(x + hw / 2 - CARD_WIDTH / 2, width - CARD_WIDTH - 16));

    const isTop = step.tooltipSide === 'top';
    const cardStyle = isTop
      ? { top: y - 160, left: cardLeft, width: CARD_WIDTH }
      : { top: y + hh + 12, left: cardLeft, width: CARD_WIDTH };

    const arrowLeft = Math.max(
      16,
      Math.min(x + hw / 2 - cardLeft - 8, CARD_WIDTH - 32)
    );

    return (
      <View style={[styles.tooltipCard, cardStyle, { backgroundColor: colors.card }]}>
        {!isTop && (
          <View style={[styles.arrowUp, { left: arrowLeft, borderBottomColor: colors.card }]} />
        )}
        <View style={styles.tooltipContent}>
          {React.createElement(step.icon, { size: 36, color: colors.primary, style: styles.icon })}
          <Text variant="body-sm" className="font-bold mb-1">
            {step.title}
          </Text>
          <Text variant="caption" className="text-muted mb-3" style={styles.desc}>
            {step.description}
          </Text>

          {step.requireTap ? (
            <View style={styles.tapHintRow}>
              <Text variant="caption" style={{ color: colors.primary, fontWeight: '600' }}>
                {step.tapHint ?? t('tutorial.tapHint.fallback')}
              </Text>
              <ArrowRight size={14} color={colors.primary} />
            </View>
          ) : (
            <View style={styles.buttonRow}>
              <Button variant="primary" size="sm" onPress={handleAdvance} style={{ flex: 1 }}>
                {t('tutorial.next')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onPress={skipTutorial}
                textClassName="text-muted"
                style={{ marginLeft: 8 }}
              >
                {t('tutorial.skip')}
              </Button>
            </View>
          )}
        </View>
        {isTop && (
          <View style={[styles.arrowDown, { left: arrowLeft, borderTopColor: colors.card }]} />
        )}
      </View>
    );
  };

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]} pointerEvents="box-none">
        {/* Full dark overlay when no hotspot (center steps) */}
        {!hotspot && (
          <View style={[StyleSheet.absoluteFill, styles.dimRect]} pointerEvents="none" />
        )}

        {renderSpotlight()}
        {renderTooltip()}

        {/* Skip button + language toggle always visible at top-right (except center cards which have inline skip) */}
        {hotspot && (
          <View style={[styles.topRight, { top: insets.top + 12 }]}>
            <Pressable onPress={toggleLanguage} hitSlop={8} style={{ marginRight: 8 }}>
              <View style={[styles.skipPill, { backgroundColor: colors.card }]}>
                <Text variant="caption" style={{ color: colors.primary, fontWeight: '700' }}>
                  {language === 'en' ? 'TH' : 'EN'}
                </Text>
              </View>
            </Pressable>
            <Pressable onPress={skipTutorial} hitSlop={12}>
              <View style={[styles.skipPill, { backgroundColor: colors.card }]}>
                <X size={14} color={colors.muted} />
                <Text variant="caption" className="text-muted ml-1">
                  {t('tutorial.skip')}
                </Text>
              </View>
            </Pressable>
          </View>
        )}

        {/* Step counter at top-left */}
        {hotspot && (
          <View style={[styles.stepCounter, { top: insets.top + 12 }]}>
            <Text variant="caption" style={{ color: 'rgba(255,255,255,0.8)', fontWeight: '600' }}>
              {t('tutorial.stepCounter', {
                current: currentStep,
                total: TUTORIAL_TOTAL_STEPS - 1,
              })}
            </Text>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dimRect: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  spotlightBorder: {
    position: 'absolute',
    borderWidth: 2.5,
  },
  tapZone: {
    position: 'absolute',
  },
  centeredCardWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  centeredCard: {
    width: '100%',
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
  tooltipCard: {
    position: 'absolute',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  tooltipContent: {
    padding: 16,
    alignItems: 'center',
  },
  centeredContent: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  icon: {
    marginBottom: 8,
  },
  langToggle: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
  },
  langPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  desc: {
    lineHeight: 20,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 5,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  tapHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  arrowUp: {
    position: 'absolute',
    top: -10,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  arrowDown: {
    position: 'absolute',
    bottom: -10,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  topRight: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  skipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  stepCounter: {
    position: 'absolute',
    left: 16,
  },
});
