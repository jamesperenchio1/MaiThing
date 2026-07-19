import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
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
    void shareReferralCode(message, t('profile.shareReferralCode'));
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

  if (profileLoading || impactLoading || favoritesLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  const displayName = profile?.display_name ?? t('profile.guest');
  const heroLevelKey = impact ? heroLevel(impact.meals_saved) : 'seed';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>{t('profile.title')}</Text>

      {/* Profile header */}
      <View style={styles.card}>
        <Text style={styles.avatar}>👤</Text>
        <Text style={styles.name}>{displayName}</Text>
      </View>

      {/* Food Hero impact */}
      <View style={styles.card}>
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
      </View>

      {/* Referrals */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('profile.referrals')}</Text>
        {referralCode ? (
          <>
            <Text style={styles.codeLabel}>{t('profile.referralCode')}</Text>
            <Text style={styles.referralCodeValue}>{referralCode}</Text>
            <TouchableOpacity
              style={styles.rowButton}
              onPress={handleShareReferral}
              accessibilityRole="button"
            >
              <Text style={styles.rowButtonText}>{t('profile.shareReferralCode')}</Text>
              <Text style={styles.rowButtonArrow}>→</Text>
            </TouchableOpacity>
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
            <TextInput
              style={styles.applyInput}
              placeholder={t('profile.referralInputPlaceholder')}
              value={appliedCode}
              onChangeText={setAppliedCode}
              autoCapitalize="characters"
              maxLength={6}
            />
            <TouchableOpacity
              style={[
                styles.applyBtn,
                (!appliedCode.trim() || applyReferral.isPending) && styles.btnDisabled,
              ]}
              onPress={() => void handleApplyReferral()}
              disabled={!appliedCode.trim() || applyReferral.isPending}
              accessibilityRole="button"
            >
              <Text style={styles.applyBtnText}>{t('profile.applyReferralCode')}</Text>
            </TouchableOpacity>
          </View>
        )}
        {appliedMessage ? <Text style={styles.appliedMessage}>{appliedMessage}</Text> : null}
      </View>

      {/* Order history */}
      <TouchableOpacity
        style={styles.rowButton}
        onPress={() => router.push('/(buyer)/orders')}
        accessibilityRole="button"
      >
        <Text style={styles.rowButtonText}>{t('profile.orderHistory')}</Text>
        <Text style={styles.rowButtonArrow}>→</Text>
      </TouchableOpacity>

      {/* Favorites */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profile.favorites')}</Text>
        {favorites.length === 0 ? (
          <Text style={styles.empty}>{t('profile.noFavorites')}</Text>
        ) : (
          favorites.map((f) => (
            <View key={f.location_id} style={styles.favoriteCard}>
              <Text style={styles.favoriteName} numberOfLines={1}>
                {f.location?.name ?? '—'}
              </Text>
              <Text style={styles.favoriteAddress} numberOfLines={1}>
                {f.location?.address_text ?? ''}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Language switcher */}
      <TouchableOpacity
        style={styles.rowButton}
        onPress={toggleLanguage}
        accessibilityRole="button"
      >
        <Text style={styles.rowButtonText}>{t('profile.language')}</Text>
        <Text style={styles.rowButtonValue}>{currentLng === 'th' ? 'ไทย' : 'English'}</Text>
      </TouchableOpacity>

      {/* Push notifications toggle */}
      <View style={styles.rowButton}>
        <Text style={styles.rowButtonText}>{t('notifications.title')}</Text>
        <Switch
          value={profile?.push_notifications_enabled ?? true}
          onValueChange={(value) => togglePushMutation.mutate(value)}
          trackColor={{ false: '#d1d5db', true: '#16a34a' }}
          thumbColor="#fff"
          disabled={togglePushMutation.isPending || !profile}
        />
      </View>

      {profile?.role === 'buyer' && (
        <TouchableOpacity
          style={styles.rowButton}
          onPress={() => void handleSwitchToMerchant()}
          accessibilityRole="button"
        >
          <Text style={styles.rowButtonText}>{t('profile.switchToMerchant')}</Text>
          <Text style={styles.rowButtonArrow}>→</Text>
        </TouchableOpacity>
      )}

      {/* Logout */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={() => void handleLogout()}
        accessibilityRole="button"
      >
        <Text style={styles.logoutBtnText}>{t('profile.logout')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function ImpactBadge({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.impactBadge}>
      <Text style={styles.impactValue}>{value}</Text>
      <Text style={styles.impactLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scroll: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  name: { fontSize: 18, fontWeight: '700', textAlign: 'center', color: '#111827' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  level: { fontSize: 14, color: '#16a34a', fontWeight: '600', marginBottom: 12 },
  impactRow: { flexDirection: 'row', gap: 8 },
  impactBadge: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  impactValue: { fontSize: 18, fontWeight: '700', color: '#16a34a' },
  impactLabel: { fontSize: 11, color: '#6b7280', textAlign: 'center', marginTop: 4 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 },
  empty: { fontSize: 14, color: '#9ca3af' },
  favoriteCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  favoriteName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  favoriteAddress: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  rowButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowButtonText: { fontSize: 15, fontWeight: '600', color: '#111827' },
  rowButtonArrow: { fontSize: 18, color: '#9ca3af' },
  rowButtonValue: { fontSize: 14, color: '#16a34a', fontWeight: '600' },
  codeLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  referralCodeValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#16a34a',
    letterSpacing: 2,
    marginBottom: 12,
  },
  referralList: { marginTop: 12, gap: 8 },
  referralRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  referralName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  referralStatus: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  applyRow: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' },
  applyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
  },
  applyBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  btnDisabled: { backgroundColor: '#9ca3af' },
  applyBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  appliedMessage: { color: '#16a34a', fontSize: 13, marginTop: 8, fontWeight: '600' },
  logoutBtn: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#dc2626',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutBtnText: { color: '#dc2626', fontSize: 15, fontWeight: '600' },
});
