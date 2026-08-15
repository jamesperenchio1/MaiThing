import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { View, Alert, Switch } from 'react-native';
import {
  Store,
  Clock,
  MapPin,
  LogOut,
  User,
  ChevronRight,
  MessageCircle,
  Star,
  Bell,
  HelpCircle,
  Users,
  Tag,
  Wallet,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Avatar } from '@/src/components/ui/Avatar';
import { Badge } from '@/src/components/ui/Badge';
import { Screen } from '@/src/components/layout/Screen';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { useAuth } from '@/src/hooks/useAuth';
import { useAuthStore } from '@/src/stores/auth';
import {
  useMerchantByOwner,
  useMerchantNotificationPreferences,
  useUpdateMerchantNotificationPreferences,
} from '@/src/hooks/useMerchants';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useConversations } from '@/src/hooks/useMessages';
import type { MerchantNotificationPreferences } from '@/src/types';

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  right?: React.ReactNode;
  testID?: string;
}

function MenuItem({ icon, label, onPress, right, testID }: MenuItemProps) {
  const colors = useThemeColor();
  return (
    <PressableScale
      testID={testID}
      onPress={onPress}
      className="flex-row items-center justify-between py-3"
      scale={0.98}
      disabled={!onPress}
    >
      <View className="flex-row items-center">
        <View className="mr-3 rounded-xl bg-muted/10 p-2">{icon}</View>
        <Text variant="body">{label}</Text>
      </View>
      {right ?? <ChevronRight size={20} color={colors.muted} />}
    </PressableScale>
  );
}

function NotificationToggle({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const colors = useThemeColor();
  return (
    <View className="flex-row items-center justify-between py-3">
      <Text variant="body">{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={colors.border}
      />
    </View>
  );
}

export default function MerchantSettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const colors = useThemeColor();
  const { logout, switchRole } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: merchant } = useMerchantByOwner(user?.id ?? '');
  const { data: conversations } = useConversations(user?.id ?? '');
  const {
    data: preferences,
    isLoading: prefsLoading,
    isError: prefsError,
    refetch: refetchPrefs,
  } = useMerchantNotificationPreferences(merchant?.id ?? '');
  const updatePrefs = useUpdateMerchantNotificationPreferences(merchant?.id ?? '');

  const unreadCount =
    conversations?.reduce((sum, c) => sum + (c.read || c.sentBy === 'merchant' ? 0 : 1), 0) ?? 0;

  const handleLogout = () => {
    Alert.alert('Log out?', 'You will be signed out of your account.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const handleSwitchRole = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switchRole('customer');
  };

  const handleTogglePreference = (key: keyof MerchantNotificationPreferences) => {
    if (!preferences) return;
    updatePrefs.mutate({ ...preferences, [key]: !preferences[key] });
  };

  return (
    <Screen testID="merchant-settings-screen" scrollable className="bg-background">
      <View className="px-6 pt-4 pb-2">
        <Text testID="merchant-settings-title" variant="h1" className="mb-6">
          {t('merchant.settings.title')}
        </Text>

        <Card testID="merchant-settings-profile-card" variant="elevated" className="mb-6">
          <View className="flex-row items-center">
            <Avatar
              uri={merchant?.logoUrl ?? user?.avatarUrl}
              name={merchant?.name ?? user?.name ?? 'Guest'}
              size="lg"
            />
            <View className="ml-4 flex-1">
              <View className="flex-row items-center">
                <Text variant="h3">{merchant?.name ?? user?.name ?? 'Guest'}</Text>
                {merchant?.isVerified && (
                  <Badge variant="success" className="ml-2">
                    {t('merchant.dashboard.verified')}
                  </Badge>
                )}
              </View>
              <View className="mt-1 flex-row items-center">
                <Star size={14} color={colors.warning} fill={colors.warning} />
                <Text variant="body-sm" className="ml-1 text-muted">
                  {merchant?.rating.toFixed(1)} · {merchant?.reviewCount}{' '}
                  {merchant?.reviewCount === 1 ? 'review' : 'reviews'}
                </Text>
              </View>
              <Text variant="body-sm" className="text-muted">
                {user?.email}
              </Text>
            </View>
          </View>
        </Card>

        <Card testID="merchant-settings-business-menu" variant="outlined" className="mb-6">
          <MenuItem
            testID="business-profile-menu-item"
            icon={<Store size={20} color={colors.muted} />}
            label={t('merchant.settings.businessProfile')}
            onPress={() => router.push('/(merchant)/business-profile' as any)}
          />
          <MenuItem
            testID="store-hours-menu-item"
            icon={<Clock size={20} color={colors.muted} />}
            label={t('merchant.settings.storeHours')}
            onPress={() => router.push('/(merchant)/store-hours' as any)}
          />
          <MenuItem
            testID="pickup-management-menu-item"
            icon={<MapPin size={20} color={colors.muted} />}
            label={t('merchant.settings.pickupManagement')}
            onPress={() => router.push('/(merchant)/pickup-management' as any)}
          />
          <MenuItem
            testID="payouts-menu-item"
            icon={<Wallet size={20} color={colors.muted} />}
            label={t('merchant.settings.payouts')}
            onPress={() => router.push('/(merchant)/payouts' as any)}
          />
          <MenuItem
            testID="staff-menu-item"
            icon={<Users size={20} color={colors.muted} />}
            label={t('merchant.settings.staff')}
            onPress={() => router.push('/(merchant)/staff' as any)}
          />
          <MenuItem
            testID="promotions-menu-item"
            icon={<Tag size={20} color={colors.muted} />}
            label={t('merchant.settings.promotions')}
            onPress={() => router.push('/(merchant)/promotions' as any)}
          />
        </Card>

        <Card testID="merchant-settings-engagement-menu" variant="outlined" className="mb-6">
          <MenuItem
            testID="messages-menu-item"
            icon={<MessageCircle size={20} color={colors.muted} />}
            label={t('merchant.settings.messages')}
            onPress={() => router.push('/(merchant)/messages' as any)}
            right={
              unreadCount > 0 ? (
                <View className="mr-2 h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5">
                  <Text className="text-[10px] font-semibold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              ) : undefined
            }
          />
          <MenuItem
            testID="reviews-menu-item"
            icon={<Star size={20} color={colors.muted} />}
            label={t('merchant.settings.reviews')}
            onPress={() => router.push('/(merchant)/reviews' as any)}
          />
          <MenuItem
            testID="notifications-menu-item"
            icon={<Bell size={20} color={colors.muted} />}
            label={t('merchant.settings.notifications')}
            onPress={() => setShowNotifications((s) => !s)}
            right={
              <ChevronRight
                size={20}
                color={colors.muted}
                style={{ transform: [{ rotate: showNotifications ? '90deg' : '0deg' }] }}
              />
            }
          />
          {showNotifications && (
            <View className="border-t border-border pt-2">
              {prefsError && (
                <ErrorState
                  title={t('common.error')}
                  message="We couldn't load notification preferences."
                  onRetry={refetchPrefs}
                  retryLabel={t('common.retry')}
                />
              )}
              {preferences && (
                <>
                  <NotificationToggle
                    label="New orders"
                    value={preferences.newOrders}
                    onValueChange={() => handleTogglePreference('newOrders')}
                  />
                  <NotificationToggle
                    label="Low stock"
                    value={preferences.lowStock}
                    onValueChange={() => handleTogglePreference('lowStock')}
                  />
                  <NotificationToggle
                    label="Payout updates"
                    value={preferences.payoutUpdates}
                    onValueChange={() => handleTogglePreference('payoutUpdates')}
                  />
                  <NotificationToggle
                    label="Customer reviews"
                    value={preferences.customerReviews}
                    onValueChange={() => handleTogglePreference('customerReviews')}
                  />
                  <NotificationToggle
                    label="Pickup reminders"
                    value={preferences.pickupReminders}
                    onValueChange={() => handleTogglePreference('pickupReminders')}
                  />
                  <NotificationToggle
                    label={t('merchant.settings.autoConfirmOrders')}
                    value={preferences.autoConfirmOrders}
                    onValueChange={() => handleTogglePreference('autoConfirmOrders')}
                  />
                </>
              )}
              {prefsLoading && !preferences && (
                <Text variant="body-sm" className="py-2 text-muted">
                  {t('common.loading')}
                </Text>
              )}
            </View>
          )}
          <MenuItem
            testID="help-menu-item"
            icon={<HelpCircle size={20} color={colors.muted} />}
            label={t('merchant.settings.help')}
          />
        </Card>

        <Card testID="merchant-settings-switch-menu" variant="outlined" className="mb-6">
          <MenuItem
            testID="switch-to-customer-button"
            icon={<User size={20} color={colors.muted} />}
            label={t('merchant.settings.switchToCustomer')}
            onPress={handleSwitchRole}
          />
        </Card>

        <Button
          testID="merchant-logout-button"
          variant="outline"
          fullWidth
          onPress={handleLogout}
          leftIcon={<LogOut size={18} color={colors.foreground} />}
        >
          {t('common.logout')}
        </Button>
      </View>
    </Screen>
  );
}
