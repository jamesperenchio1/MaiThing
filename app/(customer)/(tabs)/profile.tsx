import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Switch,
  Alert,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import {
  User,
  Heart,
  Bell,
  MapPin,
  Moon,
  Globe,
  ChevronRight,
  LogOut,
  Store,
  ShoppingBag,
  BookOpen,
  Sparkles,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';

import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Avatar } from '@/src/components/ui/Avatar';
import { Screen } from '@/src/components/layout/Screen';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useAuth } from '@/src/hooks/useAuth';
import { useAuthStore } from '@/src/stores/auth';
import { useCustomerImpact } from '@/src/hooks/useImpact';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/src/hooks/useNotifications';
import { useThemeStore } from '@/src/stores/theme';
import { useLanguageStore } from '@/src/stores/language';
import { useTutorialStore } from '@/src/stores/tutorial';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { repositories } from '@/src/repositories';
import { getFontScale } from '@/src/lib/responsive';
import type { NotificationPreferences } from '@/src/types';

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
    <TouchableOpacity
      testID={testID}
      onPress={() => {
        onPress?.();
      }}
      className="flex-row items-center justify-between py-3 active:opacity-70"
      activeOpacity={0.7}
    >
      <View className="flex-row items-center">
        <View className="mr-3 rounded-xl bg-muted/10 p-2">{icon}</View>
        <Text variant="body">{label}</Text>
      </View>
      {right ?? <ChevronRight size={20} color={colors.muted} />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { width, fontScale } = useWindowDimensions();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const selectedRole = useAuthStore((s) => s.selectedRole);
  const hasMerchantRole = user?.roles.includes('merchant') ?? false;
  const isDark = useThemeStore((s) => s.isDark);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const { language, toggle: toggleLanguage } = useLanguageStore();
  const colors = useThemeColor();
  const { logout, switchRole } = useAuth();
  const { resetTutorial, startTutorial } = useTutorialStore();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name ?? '');

  const { data: impact } = useCustomerImpact(user?.id);
  const { data: preferences } = useNotificationPreferences(user?.id ?? '');
  const updatePreferences = useUpdateNotificationPreferences();
  const [localPrefs, setLocalPrefs] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    if (preferences) setLocalPrefs(preferences);
  }, [preferences]);

  const togglePreference = (key: keyof NotificationPreferences) => {
    if (!user || !localPrefs) return;
    const next = { ...localPrefs, [key]: !localPrefs[key] };
    setLocalPrefs(next);
    updatePreferences.mutate({ userId: user.id, preferences: next });
  };

  const handleSwitchRole = () => {
    const nextRole = selectedRole === 'customer' ? 'merchant' : 'customer';
    switchRole(nextRole);
  };

  const handleLogout = () => {
    Alert.alert(t('common.logoutConfirmTitle'), t('common.logoutConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.logout'), style: 'destructive', onPress: logout },
    ]);
  };

  const handleLanguagePress = () => {
    Alert.alert(t('common.language'), t('common.chooseLanguage'), [
      {
        text: t('common.english'),
        onPress: () => useLanguageStore.getState().setLanguage('en'),
      },
      {
        text: t('common.thai'),
        onPress: () => useLanguageStore.getState().setLanguage('th'),
      },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const handleEditProfile = () => {
    setEditName(user?.name ?? '');
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    const trimmed = editName.trim();
    if (!trimmed || !user) {
      setEditModalVisible(false);
      return;
    }
    await repositories.users.updateCustomerProfile(user.id, { name: trimmed });
    useAuthStore.getState().setUser({ ...user, name: trimmed });
    setEditModalVisible(false);
  };

  return (
    <Screen testID="profile-screen" scrollable className="bg-background">
      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setEditModalVisible(false)}>
          <View
            className="flex-1 items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <TouchableWithoutFeedback>
              <View className="mx-6 w-full max-w-sm rounded-3xl bg-card p-6">
                <Text variant="h3" className="mb-4">
                  {t('customer.profile.editProfile')}
                </Text>
                <Text variant="label" className="mb-2 ml-1">
                  {t('customer.profile.name')}
                </Text>
                <View className="mb-6 rounded-2xl border border-border bg-background px-4 py-3">
                  <TextInput
                    value={editName}
                    onChangeText={setEditName}
                    placeholder={t('customer.profile.yourName')}
                    placeholderTextColor={colors.muted}
                    style={{
                      color: colors.foreground,
                      fontSize: Math.round(16 * getFontScale(width, fontScale)),
                    }}
                    autoFocus
                  />
                </View>
                <View className="flex-row space-x-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onPress={() => setEditModalVisible(false)}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button className="flex-1" onPress={handleSaveProfile}>
                    {t('common.save')}
                  </Button>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <View className="px-6 pt-4 pb-2">
        <Text testID="profile-title" variant="h1" className="mb-6">
          {t('common.profile')}
        </Text>

        {impact && impact.mealsSaved > 0 && (
          <Card variant="elevated" className="mb-4 flex-row items-center justify-between">
            <View>
              <Text variant="caption" className="text-muted">
                {t('customer.profile.mealsSaved')}
              </Text>
              <Text variant="h2" className="text-primary">
                {impact.mealsSaved}
              </Text>
            </View>
            <View className="items-end">
              <Text variant="caption" className="text-muted">
                {t('customer.profile.co2Saved')}
              </Text>
              <Text variant="h3" className="text-success">
                {impact.co2SavedKg.toFixed(1)} kg
              </Text>
            </View>
            <View className="items-end">
              <Text variant="caption" className="text-muted">
                {t('customer.profile.moneySaved')}
              </Text>
              <Text variant="h3" className="text-foreground">
                ฿{impact.moneySaved.toLocaleString()}
              </Text>
            </View>
          </Card>
        )}

        <Card testID="profile-card" variant="elevated" className="mb-6">
          <View className="flex-row items-center">
            <Avatar uri={user?.avatarUrl} name={user?.name ?? t('customer.profile.guest')} size="lg" />
            <View className="ml-4 flex-1">
              <Text variant="h3">{user?.name ?? t('customer.profile.guest')}</Text>
              <Text variant="body-sm" className="text-muted">
                {user?.email}
              </Text>
              <Text variant="caption" className="text-primary">
                {selectedRole === 'customer'
                  ? t('customer.profile.buyer')
                  : t('customer.profile.merchant')}
              </Text>
            </View>
          </View>
        </Card>

        <Card testID="profile-account-menu" variant="outlined" className="mb-6">
          <MenuItem
            testID="edit-profile-menu-item"
            icon={<User size={20} color={colors.muted} />}
            label={t('customer.profile.editProfile')}
            onPress={handleEditProfile}
          />
          <MenuItem
            testID="favorites-menu-item"
            icon={<Heart size={20} color={colors.muted} />}
            label={t('common.favorites')}
            onPress={() => router.push('/(customer)/favorites' as any)}
          />
          <MenuItem
            testID="saved-addresses-menu-item"
            icon={<MapPin size={20} color={colors.muted} />}
            label={t('common.savedAddresses')}
            onPress={() => router.push('/(customer)/saved-addresses' as any)}
          />
          <MenuItem
            testID="orders-menu-item"
            icon={<ShoppingBag size={20} color={colors.muted} />}
            label={t('customer.profile.myOrders')}
            onPress={() => router.navigate('/(customer)/(tabs)/orders' as any)}
          />
          <MenuItem
            testID="edit-preferences-menu-item"
            icon={<Sparkles size={20} color={colors.muted} />}
            label={t('customer.profile.editPreferences')}
            onPress={() => router.push('/(customer)/personality-onboarding' as any)}
          />
        </Card>

        <Card testID="profile-preferences-menu" variant="outlined" className="mb-6">
          <MenuItem
            testID="notifications-menu-item"
            icon={<Bell size={20} color={colors.muted} />}
            label={t('common.notifications')}
            onPress={() => router.push('/(customer)/notifications' as any)}
          />
          <MenuItem
            testID="new-deals-pref-item"
            icon={<Bell size={20} color={colors.muted} />}
            label={t('customer.profile.newDeals')}
            onPress={() => togglePreference('newDeals')}
            right={
              <Switch
                value={localPrefs?.newDeals ?? true}
                onValueChange={() => togglePreference('newDeals')}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            }
          />
          <MenuItem
            testID="order-updates-pref-item"
            icon={<Bell size={20} color={colors.muted} />}
            label={t('customer.profile.orderUpdates')}
            onPress={() => togglePreference('orderUpdates')}
            right={
              <Switch
                value={localPrefs?.orderUpdates ?? true}
                onValueChange={() => togglePreference('orderUpdates')}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            }
          />
          <MenuItem
            testID="merchant-messages-pref-item"
            icon={<Bell size={20} color={colors.muted} />}
            label={t('customer.profile.merchantMessages')}
            onPress={() => togglePreference('merchantMessages')}
            right={
              <Switch
                value={localPrefs?.merchantMessages ?? true}
                onValueChange={() => togglePreference('merchantMessages')}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            }
          />
          <MenuItem
            testID="promotions-pref-item"
            icon={<Bell size={20} color={colors.muted} />}
            label={t('customer.profile.promotions')}
            onPress={() => togglePreference('promotions')}
            right={
              <Switch
                value={localPrefs?.promotions ?? false}
                onValueChange={() => togglePreference('promotions')}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            }
          />
          <MenuItem
            testID="replay-tutorial-menu-item"
            icon={<BookOpen size={20} color={colors.muted} />}
            label={t('customer.profile.appTour')}
            onPress={() => {
              resetTutorial();
              setTimeout(() => startTutorial(), 150);
            }}
          />
          <MenuItem
            testID="dark-mode-menu-item"
            icon={<Moon size={20} color={colors.muted} />}
            label={t('common.darkMode')}
            onPress={toggleTheme}
            right={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            }
          />
          <MenuItem
            testID="language-menu-item"
            icon={<Globe size={20} color={colors.muted} />}
            label={t('common.language')}
            right={
              <Text variant="body-sm" className="text-primary">
                {language === 'en' ? t('common.english') : t('common.thai')}
              </Text>
            }
            onPress={handleLanguagePress}
          />
        </Card>

        {hasMerchantRole && (
          <Button
            testID="switch-role-button"
            variant="secondary"
            fullWidth
            className="mb-6"
            onPress={() => {
              handleSwitchRole();
            }}
            leftIcon={<Store size={20} color={colors.primary} />}
          >
            {t('customer.profile.switchToMerchant')}
          </Button>
        )}

        <Button
          testID="logout-button"
          variant="outline"
          fullWidth
          onPress={handleLogout}
          leftIcon={<LogOut size={18} color={colors.foreground} />}
        >
          {t('common.logout')}
        </Button>

        <View className="mt-8 items-center">
          <Text variant="caption" className="text-muted">
            {Constants.expoConfig?.name} v{Constants.expoConfig?.version}
            {Constants.expoConfig?.ios?.buildNumber
              ? ` (${Constants.expoConfig.ios.buildNumber})`
              : ''}
          </Text>
        </View>
      </View>
    </Screen>
  );
}
