import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { View, Alert } from 'react-native';
import { Store, Clock, MapPin, LogOut, User, ChevronRight } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Avatar } from '@/src/components/ui/Avatar';
import { Screen } from '@/src/components/layout/Screen';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useAuth } from '@/src/hooks/useAuth';
import { useAuthStore } from '@/src/stores/auth';
import { useThemeColor } from '@/src/hooks/useThemeColor';

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
    >
      <View className="flex-row items-center">
        <View className="mr-3 rounded-xl bg-muted/10 p-2">{icon}</View>
        <Text variant="body">{label}</Text>
      </View>
      {right ?? <ChevronRight size={20} color={colors.muted} />}
    </PressableScale>
  );
}

export default function MerchantSettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const colors = useThemeColor();
  const { logout, continueAsTest } = useAuth();

  const handleLogout = () => {
    Alert.alert('Log out?', 'You will be signed out of your account.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const handleSwitchRole = () => {
    continueAsTest('customer');
  };

  return (
    <Screen testID="merchant-settings-screen" scrollable className="bg-background">
      <View className="px-6 pt-4 pb-2">
        <Text testID="merchant-settings-title" variant="h1" className="mb-6">
          {t('common.settings')}
        </Text>

        <Card testID="merchant-settings-profile-card" variant="elevated" className="mb-6">
          <View className="flex-row items-center">
            <Avatar uri={user?.avatarUrl} name={user?.name ?? 'Guest'} size="lg" />
            <View className="ml-4 flex-1">
              <Text variant="h3">{user?.name ?? 'Guest'}</Text>
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
            label={t('merchant.businessProfile.title')}
            onPress={() => router.push('/(merchant)/business-profile' as any)}
          />
          <MenuItem
            testID="store-hours-menu-item"
            icon={<Clock size={20} color={colors.muted} />}
            label={t('merchant.businessProfile.storeHours')}
            onPress={() => router.push('/(merchant)/store-hours' as any)}
          />
          <MenuItem
            testID="pickup-management-menu-item"
            icon={<MapPin size={20} color={colors.muted} />}
            label={t('merchant.businessProfile.pickupManagement')}
            onPress={() => router.push('/(merchant)/pickup-management' as any)}
          />
        </Card>

        <Card testID="merchant-settings-switch-menu" variant="outlined" className="mb-6">
          <MenuItem
            testID="switch-to-customer-button"
            icon={<User size={20} color={colors.muted} />}
            label="Switch to Customer"
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
