import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useProfile } from '../../src/hooks/useProfile';
import { capture } from '../../src/lib/posthog';
import { FOOD_CATEGORIES, subscriptionTierSchema } from '@maithing/shared';
import type { z } from 'zod';
import { useTheme } from '../../src/theme';
import { Screen, Input, Button, Card, ErrorState } from '../../src/components/ui';

type SubscriptionTier = z.infer<typeof subscriptionTierSchema>;

const TOTAL_STEPS = 2;

export default function MerchantOnboardingScreen() {
  const { t } = useTranslation();
  const { colors, spacing, fontSizes, fontWeights } = useTheme();
  const { data: profile, refetch } = useProfile();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const nameError = touched.name && !name.trim() ? t('merchant.required') : undefined;
  const categoryError = touched.category && !category ? t('merchant.required') : undefined;

  const goToNext = () => {
    setTouched({ name: true, category: true });
    if (!name.trim() || !category) return;
    setStep(2);
  };

  const goBack = () => {
    setStep(1);
  };

  const submit = async () => {
    if (!name.trim() || !category) return;
    setIsSubmitting(true);
    setError(null);

    const userId = profile?.id;
    if (!userId) {
      setError(t('common.error'));
      setIsSubmitting(false);
      return;
    }

    const { error: orgError } = await supabase.from('merchant_orgs').insert({
      owner_id: userId,
      name: name.trim(),
      description: description.trim() || null,
      category,
      subscription_tier: tier,
      subscription_status: 'active',
    });

    if (orgError) {
      setError(orgError.message);
      setIsSubmitting(false);
      return;
    }

    if (profile?.role !== 'merchant') {
      const { error: roleError } = await supabase
        .from('profiles')
        .update({ role: 'merchant' })
        .eq('id', userId);
      if (roleError) {
        setError(roleError.message);
        setIsSubmitting(false);
        return;
      }
    }

    await refetch();
    capture('merchant_onboarding_complete', { org_name: name.trim(), category, tier });
    setIsSubmitting(false);
    router.replace('/(merchant)/dashboard');
  };

  const styles = makeStyles(colors, spacing, fontSizes, fontWeights);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.stepIndicator}>
          {t('merchant.step', { current: step, total: TOTAL_STEPS })}
        </Text>
        <Text style={styles.title}>{t('merchant.onboardingTitle')}</Text>
        <Text style={styles.subtitle}>{t('merchant.onboardingSubtitle')}</Text>

        {step === 1 && (
          <Card style={styles.stepCard}>
            <Text style={styles.stepTitle}>{t('merchant.businessDetails')}</Text>
            <Text style={styles.stepDescription}>{t('merchant.descriptionPlaceholder')}</Text>

            <View style={styles.field}>
              <Input
                label={t('merchant.orgName')}
                value={name}
                onChangeText={(v) => {
                  setName(v);
                  setError(null);
                }}
                placeholder={t('merchant.orgNamePlaceholder')}
                error={nameError}
                onBlur={() => setTouched((p) => ({ ...p, name: true }))}
                accessibilityLabel={t('merchant.orgName')}
              />
            </View>

            <View style={styles.field}>
              <Input
                label={t('merchant.description')}
                value={description}
                onChangeText={setDescription}
                placeholder={t('merchant.descriptionPlaceholder')}
                multiline
                numberOfLines={4}
                style={styles.textArea}
                accessibilityLabel={t('merchant.description')}
              />
            </View>

            <Text style={styles.label}>{t('merchant.category')}</Text>
            <View style={styles.chipRow}>
              {FOOD_CATEGORIES.map((cat) => (
                <Chip
                  key={cat}
                  selected={category === cat}
                  onPress={() => setCategory(cat)}
                  label={t(`categories.${cat}`)}
                />
              ))}
            </View>
            {categoryError ? <Text style={styles.inlineError}>{categoryError}</Text> : null}
          </Card>
        )}

        {step === 2 && (
          <Card style={styles.stepCard}>
            <Text style={styles.stepTitle}>{t('merchant.choosePlan')}</Text>
            <Text style={styles.stepDescription}>{t('merchant.tier.freePrice')}</Text>

            <View style={styles.tierRow}>
              {(['free', 'pro'] as SubscriptionTier[]).map((tierOption) => (
                <Pressable
                  key={tierOption}
                  onPress={() => setTier(tierOption)}
                  style={[styles.tierCard, tier === tierOption && styles.tierCardSelected]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: tier === tierOption }}
                >
                  <Text style={[styles.tierTitle, tier === tierOption && styles.tierTextSelected]}>
                    {t(`merchant.tier.${tierOption}`)}
                  </Text>
                  <Text style={styles.tierPrice}>
                    {tierOption === 'free'
                      ? t('merchant.tier.freePrice')
                      : t('merchant.tier.proPrice')}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>
        )}

        {error && <ErrorState title={t('common.error')} description={error} style={styles.error} />}

        <View style={styles.actions}>
          {step === 1 ? (
            <Button onPress={goToNext} size="lg">
              {t('common.next')}
            </Button>
          ) : (
            <View style={styles.buttonRow}>
              <Button variant="secondary" onPress={goBack} size="lg">
                {t('common.back')}
              </Button>
              <Button
                onPress={() => void submit()}
                loading={isSubmitting}
                disabled={isSubmitting}
                size="lg"
              >
                {t('common.save')}
              </Button>
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function Chip({
  selected,
  onPress,
  label,
}: {
  selected: boolean;
  onPress: () => void;
  label: string;
}) {
  const { colors, spacing, radii, fontSizes, fontWeights } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          borderRadius: radii.full,
          paddingHorizontal: spacing[3],
          paddingVertical: spacing[2],
          borderWidth: 1,
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.primaryMuted : colors.surfaceElevated,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text
        style={{
          fontSize: fontSizes.sm,
          fontWeight: selected ? fontWeights.semibold : fontWeights.normal,
          color: selected ? colors.primaryHover : colors.text,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function makeStyles(
  colors: ReturnType<typeof import('../../src/theme').useTheme>['colors'],
  spacing: ReturnType<typeof import('../../src/theme').useTheme>['spacing'],
  fontSizes: ReturnType<typeof import('../../src/theme').useTheme>['fontSizes'],
  fontWeights: ReturnType<typeof import('../../src/theme').useTheme>['fontWeights'],
) {
  return StyleSheet.create({
    container: {
      padding: spacing[5],
      paddingTop: spacing[7],
      flexGrow: 1,
    },
    stepIndicator: {
      fontSize: fontSizes.sm,
      color: colors.primary,
      fontWeight: fontWeights.semibold,
      marginBottom: spacing[2],
    },
    title: {
      fontSize: fontSizes['2xl'],
      fontWeight: fontWeights.bold,
      color: colors.text,
      marginBottom: spacing[2],
    },
    subtitle: {
      fontSize: fontSizes.base,
      color: colors.textMuted,
      marginBottom: spacing[5],
    },
    stepCard: {
      marginBottom: spacing[5],
    },
    stepTitle: {
      fontSize: fontSizes.lg,
      fontWeight: fontWeights.bold,
      color: colors.text,
      marginBottom: spacing[1],
    },
    stepDescription: {
      fontSize: fontSizes.base,
      color: colors.textMuted,
      marginBottom: spacing[4],
    },
    field: {
      marginBottom: spacing[4],
    },
    label: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.semibold,
      color: colors.text,
      marginBottom: spacing[2],
    },
    textArea: {
      height: 90,
      textAlignVertical: 'top',
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing[2],
      marginBottom: spacing[2],
    },
    inlineError: {
      fontSize: fontSizes.sm,
      color: colors.danger,
    },
    tierRow: {
      flexDirection: 'row',
      gap: spacing[3],
    },
    tierCard: {
      flex: 1,
      borderRadius: 12,
      padding: spacing[4],
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
    },
    tierCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryMuted,
    },
    tierTitle: {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.bold,
      color: colors.text,
      marginBottom: spacing[1],
    },
    tierPrice: {
      fontSize: fontSizes.sm,
      color: colors.textMuted,
    },
    tierTextSelected: {
      color: colors.primaryHover,
    },
    error: {
      marginBottom: spacing[4],
    },
    actions: {
      marginTop: 'auto',
      paddingBottom: spacing[5],
    },
    buttonRow: {
      flexDirection: 'row',
      gap: spacing[3],
    },
  });
}
