import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/stores/auth';
import { useReferralCode, useReferrals, useApplyReferralCode } from '../../src/hooks/useReferral';
import { shareReferralCode } from '../../src/lib/share';
import i18n from '../../src/i18n';
import type { Tables } from '@maithing/shared';
import { heroLevel } from '@maithing/shared';
import { Screen, Card, Button, Input, Avatar, LoadingState } from '../../src/components/ui';
import { useTheme } from '../../src/theme';

type Profile = Tables<'profiles'>;
type UserImpact = Tables<'user_impact'>;

type FavoriteLocation = {
  location_id: string;
  created_at: string;
  location: { name: string; address_text: string } | null;
};

function useProfile() {
  const user = useAuthStore((s) => s.user);
  return useQuery<Profile | null>({
    queryKey: ['profile'],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

function useUserImpact() {
  const user = useAuthStore((s) => s.user);
  return useQuery<UserImpact | null>({
    queryKey: ['user_impact'],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_impact')
        .select('*')
        .eq('profile_id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

function useFavoriteLocations() {
  const user = useAuthStore((s) => s.user);
  return useQuery<FavoriteLocation[]>({
    queryKey: ['favorites'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('favorites')
        .select('location_id, created_at, location:locations(name, address_text)')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors, spacing, fontSizes, fontWeights } = theme;
  const setSession = useAuthStore((s) => s.setSession);
  const qc = useQueryClient();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: impact, isLoading: impactLoading } = useUserImpact();
  const { data: favorites = [], isLoading: favoritesLoading } = useFavoriteLocations();
  const currentLng = i18n.language;
  const { data: referralCode } = useReferralCode();
  const { data: referrals = [] } = useReferrals();
  const applyReferral = useApplyReferralCode();
  const [appliedCode, setAppliedCode] = useState('');
  const [appliedMessage, setAppliedMessage] = useState('');

  const togglePushMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!profile) throw new Error('Not signed in');
      const { error } = await supabase
        .from('profiles')
        .update({ push_notifications_enabled: enabled })
        .eq('id', profile.id);
      if (error) throw error;
    },
    onMutate: async (enabled) => {
      await qc.cancelQueries({ queryKey: ['profile'] });
      const previous = qc.getQueryData<Profile>(['profile']);
      qc.setQueryData<Profile>(['profile'], (old) => {
        if (!old) return old;
        return { ...old, push_notifications_enabled: enabled };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(['profile'], context.previous);
      }
    },
  });

  const handleShareReferral = useCallback(() => {
    if (!referralCode) return;
    const message = t('profile.shareReferralMessage', { code: referralCode });
    void shareReferralCode(referralCode, message, t('profile.shareReferralCode'));
  }, [referralCode, t]);

  const handleApplyReferral = useCallback(() => {
    const code = appliedCode.trim().toUpperCase();
    if (!code) return;
    applyReferral.mutate(code, {
      onSuccess: () => {
        setAppliedCode('');
        setAppliedMessage(t('profile.referralApplied'));
      },
      onError: (err: Error) => {
        Alert.alert(t('common.error'), err.message);
      },
    });
  }, [appliedCode, applyReferral, t]);

  const handleSwitchToMerchant = useCallback(async () => {
    if (!profile) return;
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'merchant' })
      .eq('id', profile.id);
    if (error) return;
    router.replace('/(merchant)/onboarding');
  }, [profile]);

  const toggleLanguage = useCallback(() => {
    const next = currentLng === 'th' ? 'en' : 'th';
    void i18n.changeLanguage(next);
  }, [currentLng]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    router.replace('/(auth)/sign-in');
  }, [setSession]);

  const styles = makeStyles(colors, spacing, fontSizes, fontWeights);

  if (profileLoading || impactLoading || favoritesLoading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  const displayName = profile?.display_name ?? t('profile.guest');
  const heroLevelKey = impact ? heroLevel(impact.meals_saved) : 'seed';

  return (
    <Screen style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{t('profile.title')}</Text>

        {/* Profile header */}
        <Card style={styles.profileCard}>
          <Avatar name={displayName} size={64} />
          <Text style={styles.name}>{displayName}</Text>
        </Card>

        {/* Food Hero impact */}
        <Card style={styles.impactCard}>
          <Text style={styles.cardTitle}>{t('profile.foodHero')}</Text>
          <Text style={styles.level}>
            {t('profile.level', { level: t(`profile.heroLevel.${heroLevelKey}`) })}
          </Text>
          <View style={styles.impactRow}>
            <ImpactBadge
              value={impact?.meals_saved ?? 0}
              label={t('profile.impact.meals', { count: impact?.meals_saved ?? 0 })}
            />
            <ImpactBadge
              value={impact?.co2_kg_saved ?? 0}
              label={t('profile.impact.co2', { kg: impact?.co2_kg_saved ?? 0 })}
            />
            <ImpactBadge
              value={impact?.thb_saved ?? 0}
              label={t('profile.impact.saved', { amount: impact?.thb_saved ?? 0 })}
            />
          </View>
        </Card>

        {/* Referrals */}
        <Card style={styles.referralCard}>
          <Text style={styles.cardTitle}>{t('profile.referrals')}</Text>
          {referralCode ? (
            <>
              <Text style={styles.codeLabel}>{t('profile.referralCode')}</Text>
              <Text style={styles.referralCodeValue}>{referralCode}</Text>
              <Button onPress={handleShareReferral} testID="share-referral-button">
                {t('profile.shareReferralCode')}
              </Button>
            </>
          ) : (
            <Text style={styles.empty}>{t('profile.noReferralCode')}</Text>
          )}

          {referrals.length > 0 && (
            <View style={styles.referralList}>
              {referrals.map((r) => (
                <View key={r.id} style={styles.referralRow}>
                  <Text style={styles.referralName}>
                    {r.referred?.display_name ?? t('profile.guest')}
                  </Text>
                  <Text style={styles.referralStatus}>
                    {t(`profile.referralStatus.${r.reward_status}`)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {profile?.referred_by_code == null && (
            <View style={styles.applyRow}>
              <Input
                value={appliedCode}
                onChangeText={setAppliedCode}
                placeholder={t('profile.referralInputPlaceholder')}
                autoCapitalize="characters"
                maxLength={6}
                accessibilityLabel={t('profile.referralInputPlaceholder')}
                style={styles.applyInput}
              />
              <Button
                onPress={handleApplyReferral}
                disabled={!appliedCode.trim() || applyReferral.isPending}
                loading={applyReferral.isPending}
                size="sm"
              >
                {t('profile.applyReferralCode')}
              </Button>
            </View>
          )}
          {appliedMessage ? <Text style={styles.appliedMessage}>{appliedMessage}</Text> : null}
        </Card>

        {/* Order history */}
        <Button
          variant="secondary"
          onPress={() => router.push('/(buyer)/orders')}
          testID="order-history-button"
        >
          {t('profile.orderHistory')}
        </Button>

        {/* Favorites */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.favorites')}</Text>
          {favorites.length === 0 ? (
            <Text style={styles.empty}>{t('profile.noFavorites')}</Text>
          ) : (
            favorites.map((f) => (
              <Card key={f.location_id} style={styles.favoriteCard} padding="sm">
                <Text style={styles.favoriteName} numberOfLines={1}>
                  {f.location?.name ?? '—'}
                </Text>
                <Text style={styles.favoriteAddress} numberOfLines={1}>
                  {f.location?.address_text ?? ''}
                </Text>
              </Card>
            ))
          )}
        </View>

        {/* Language switcher */}
        <Button variant="secondary" onPress={toggleLanguage} testID="language-button">
          {t('profile.language')}
        </Button>

        {/* Push notifications toggle */}
        <Card style={styles.toggleCard}>
          <Text style={styles.rowButtonText}>{t('notifications.title')}</Text>
          <Switch
            value={profile?.push_notifications_enabled ?? true}
            onValueChange={(value) => togglePushMutation.mutate(value)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surfaceElevated}
            disabled={togglePushMutation.isPending || !profile}
          />
        </Card>

        {profile?.role === 'buyer' && (
          <Button
            variant="secondary"
            onPress={() => void handleSwitchToMerchant()}
            testID="switch-merchant-button"
          >
            {t('profile.switchToMerchant')}
          </Button>
        )}

        {/* Logout */}
        <Button variant="danger" onPress={() => void handleLogout()} testID="logout-button">
          {t('profile.logout')}
        </Button>
      </ScrollView>
    </Screen>
  );
}

function ImpactBadge({ value, label }: { value: number; label: string }) {
  const { colors, spacing, fontSizes, fontWeights } = useTheme();
  const styles = makeImpactBadgeStyles(colors, spacing, fontSizes, fontWeights);
  return (
    <View style={styles.impactBadge}>
      <Text style={styles.impactValue}>{value}</Text>
      <Text style={styles.impactLabel}>{label}</Text>
    </View>
  );
}

function makeStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  fontSizes: ReturnType<typeof useTheme>['fontSizes'],
  fontWeights: ReturnType<typeof useTheme>['fontWeights'],
) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    scroll: {
      padding: spacing[4],
      paddingBottom: spacing[9],
    },
    title: {
      fontSize: fontSizes['2xl'],
      fontWeight: fontWeights.bold,
      color: colors.text,
      marginBottom: spacing[4],
    },
    profileCard: {
      alignItems: 'center',
      marginBottom: spacing[3],
    },
    name: {
      fontSize: fontSizes.lg,
      fontWeight: fontWeights.bold,
      textAlign: 'center',
      color: colors.text,
      marginTop: spacing[3],
    },
    impactCard: {
      marginBottom: spacing[3],
    },
    cardTitle: {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.bold,
      color: colors.text,
      marginBottom: spacing[1],
    },
    level: {
      fontSize: fontSizes.base,
      color: colors.primary,
      fontWeight: '600',
      marginBottom: spacing[3],
    },
    impactRow: {
      flexDirection: 'row',
      gap: spacing[2],
    },
    referralCard: {
      marginBottom: spacing[3],
    },
    codeLabel: {
      fontSize: fontSizes.sm,
      color: colors.textMuted,
      marginBottom: spacing[1],
    },
    referralCodeValue: {
      fontSize: 28,
      fontWeight: fontWeights.bold,
      color: colors.primary,
      letterSpacing: 2,
      marginBottom: spacing[3],
    },
    referralList: {
      marginTop: spacing[3],
      gap: spacing[2],
    },
    referralRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    referralName: {
      fontSize: fontSizes.base,
      fontWeight: '600',
      color: colors.text,
    },
    referralStatus: {
      fontSize: fontSizes.sm,
      color: colors.textMuted,
      fontWeight: '500',
    },
    applyRow: {
      flexDirection: 'row',
      gap: spacing[2],
      marginTop: spacing[3],
      alignItems: 'flex-start',
    },
    applyInput: {
      flex: 1,
    },
    appliedMessage: {
      color: colors.primary,
      fontSize: fontSizes.sm,
      marginTop: spacing[2],
      fontWeight: '600',
    },
    section: {
      marginVertical: spacing[3],
    },
    sectionTitle: {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.bold,
      color: colors.text,
      marginBottom: spacing[2],
    },
    empty: {
      fontSize: fontSizes.base,
      color: colors.textMuted,
    },
    favoriteCard: {
      marginBottom: spacing[2],
    },
    favoriteName: {
      fontSize: fontSizes.base,
      fontWeight: '600',
      color: colors.text,
    },
    favoriteAddress: {
      fontSize: fontSizes.xs,
      color: colors.textMuted,
      marginTop: spacing[1],
    },
    toggleCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing[3],
    },
    rowButtonText: {
      fontSize: fontSizes.md,
      fontWeight: '600',
      color: colors.text,
    },
  });
}

function makeImpactBadgeStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  fontSizes: ReturnType<typeof useTheme>['fontSizes'],
  fontWeights: ReturnType<typeof useTheme>['fontWeights'],
) {
  return StyleSheet.create({
    impactBadge: {
      flex: 1,
      backgroundColor: colors.primaryMuted,
      borderRadius: 12,
      padding: spacing[3],
      alignItems: 'center',
    },
    impactValue: {
      fontSize: fontSizes.lg,
      fontWeight: fontWeights.bold,
      color: colors.primary,
    },
    impactLabel: {
      fontSize: fontSizes.xs,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: spacing[1],
    },
  });
}
