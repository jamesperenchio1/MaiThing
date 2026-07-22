import { useTranslation } from 'react-i18next';
import { View, Switch } from 'react-native';
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
} from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Avatar } from '@/src/components/ui/Avatar';
import { Screen } from '@/src/components/layout/Screen';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useAuth } from '@/src/hooks/useAuth';
import { useAuthStore } from '@/src/stores/auth';
import { useThemeStore } from '@/src/stores/theme';
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
    <PressableScale testID={testID} onPress={onPress} className="flex-row items-center justify-between py-3" scale={0.98}>
      <View className="flex-row items-center">
        <View className="mr-3 rounded-xl bg-muted/10 p-2">{icon}</View>
        <Text variant="body">{label}</Text>
      </View>
      {right ?? <ChevronRight size={20} color={colors.muted} />}
    </PressableScale>
  );
}

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const selectedRole = useAuthStore((s) => s.selectedRole);
  const hasMerchantRole = useAuthStore((s) => s.hasRole('merchant'));
  const isDark = useThemeStore((s) => s.isDark);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const colors = useThemeColor();
  const { logout, switchRole } = useAuth();

  const handleSwitchRole = () => {
    const nextRole = selectedRole === 'customer' ? 'merchant' : 'customer';
    switchRole(nextRole);
  };

  const changeLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'th' : 'en';
    i18n.changeLanguage(nextLang);
  };

  return (
    <Screen testID="profile-screen" scrollable className="bg-background">
      <View className="px-6 pt-4 pb-2">
        <Text testID="profile-title" variant="h1" className="mb-6">
          {t('common.profile')}
        </Text>

        <Card testID="profile-card" variant="elevated" className="mb-6">
          <View className="flex-row items-center">
            <Avatar uri={user?.avatarUrl} name={user?.name ?? 'Guest'} size="lg" />
            <View className="ml-4 flex-1">
              <Text variant="h3">{user?.name ?? 'Guest'}</Text>
              <Text variant="body-sm" className="text-muted">
                {user?.email}
              </Text>
              <Text variant="caption" className="text-muted">
                {user?.phone}
              </Text>
            </View>
          </View>
        </Card>

        <Card testID="profile-account-menu" variant="outlined" className="mb-6">
          <MenuItem
            testID="edit-profile-menu-item"
            icon={<User size={20} color={colors.muted} />}
            label="Edit Profile"
          />
          <MenuItem
            testID="favorites-menu-item"
            icon={<Heart size={20} color={colors.muted} />}
            label={t('common.favorites')}
          />
          <MenuItem
            testID="saved-addresses-menu-item"
            icon={<MapPin size={20} color={colors.muted} />}
            label="Saved Addresses"
          />
        </Card>

        <Card testID="profile-preferences-menu" variant="outlined" className="mb-6">
          <MenuItem
            testID="notifications-menu-item"
            icon={<Bell size={20} color={colors.muted} />}
            label={t('common.notifications')}
          />
          <MenuItem
            testID="dark-mode-menu-item"
            icon={<Moon size={20} color={colors.muted} />}
            label={t('common.darkMode')}
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
                {i18n.language === 'en' ? 'English' : 'ไทย'}
              </Text>
            }
            onPress={changeLanguage}
          />
        </Card>

        {hasMerchantRole && (
          <Card testID="profile-role-menu" variant="outlined" className="mb-6">
            <MenuItem
              testID="switch-role-button"
              icon={<Store size={20} color={colors.muted} />}
              label={
                selectedRole === 'customer' ? 'Switch to Merchant' : 'Switch to Customer'
              }
              onPress={handleSwitchRole}
            />
          </Card>
        )}

        <Button testID="logout-button" variant="outline" fullWidth onPress={logout} leftIcon={<LogOut size={18} color={colors.foreground} />}>
          {t('common.logout')}
        </Button>
      </View>
    </Screen>
  );
}
