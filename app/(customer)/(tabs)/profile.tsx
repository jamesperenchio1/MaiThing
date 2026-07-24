import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Switch, Alert, Modal, TextInput, TouchableWithoutFeedback } from 'react-native';
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
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Avatar } from '@/src/components/ui/Avatar';
import { Screen } from '@/src/components/layout/Screen';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useAuth } from '@/src/hooks/useAuth';
import { useAuthStore } from '@/src/stores/auth';
import { useThemeStore } from '@/src/stores/theme';
import { useLanguageStore } from '@/src/stores/language';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { mockRepositories } from '@/src/repositories/mock';

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
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const selectedRole = useAuthStore((s) => s.selectedRole);
  const hasMerchantRole = useAuthStore((s) => s.hasRole('merchant'));
  const isDark = useThemeStore((s) => s.isDark);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const { language, toggle: toggleLanguage } = useLanguageStore();
  const colors = useThemeColor();
  const { logout, switchRole } = useAuth();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name ?? '');

  const handleSwitchRole = () => {
    const nextRole = selectedRole === 'customer' ? 'merchant' : 'customer';
    switchRole(nextRole);
  };

  const handleLanguagePress = () => {
    Alert.alert(
      t('common.language'),
      'Choose your language / เลือกภาษา',
      [
        {
          text: 'English',
          onPress: () => useLanguageStore.getState().setLanguage('en'),
        },
        {
          text: 'ภาษาไทย',
          onPress: () => useLanguageStore.getState().setLanguage('th'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
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
    await mockRepositories.customerProfile.updateCustomerProfile(user.id, { name: trimmed });
    useAuthStore.getState().setUser({ ...user, name: trimmed });
    setEditModalVisible(false);
  };

  return (
    <Screen testID="profile-screen" scrollable className="bg-background">
      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setEditModalVisible(false)}>
          <View className="flex-1 items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <TouchableWithoutFeedback>
              <View className="mx-6 w-full max-w-sm rounded-3xl bg-card p-6">
                <Text variant="h3" className="mb-4">Edit Profile</Text>
                <Text variant="label" className="mb-2 ml-1">Name</Text>
                <View className="mb-6 rounded-2xl border border-border bg-background px-4 py-3">
                  <TextInput
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Your name"
                    placeholderTextColor={colors.muted}
                    style={{ color: colors.foreground, fontSize: 16 }}
                    autoFocus
                  />
                </View>
                <View className="flex-row space-x-3">
                  <Button variant="outline" className="flex-1" onPress={() => setEditModalVisible(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onPress={handleSaveProfile}>
                    Save
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

        <Card testID="profile-card" variant="elevated" className="mb-6">
          <View className="flex-row items-center">
            <Avatar uri={user?.avatarUrl} name={user?.name ?? 'Guest'} size="lg" />
            <View className="ml-4 flex-1">
              <Text variant="h3">{user?.name ?? 'Guest'}</Text>
              <Text variant="body-sm" className="text-muted">
                {user?.email}
              </Text>
              <Text variant="caption" className="text-primary">
                {selectedRole === 'customer' ? 'Buyer' : 'Merchant'}
              </Text>
            </View>
          </View>
        </Card>

        <Card testID="profile-account-menu" variant="outlined" className="mb-6">
          <MenuItem
            testID="edit-profile-menu-item"
            icon={<User size={20} color={colors.muted} />}
            label="Edit Profile"
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
            label="Saved Addresses"
            onPress={() => Alert.alert('Saved Addresses', 'Address management coming soon!')}
          />
          <MenuItem
            testID="orders-menu-item"
            icon={<ShoppingBag size={20} color={colors.muted} />}
            label="My Orders"
            onPress={() => router.navigate('/(customer)/(tabs)/orders' as any)}
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
                {language === 'en' ? 'English' : 'ภาษาไทย'}
              </Text>
            }
            onPress={handleLanguagePress}
          />
        </Card>

        {hasMerchantRole && (
          <Card testID="profile-role-menu" variant="outlined" className="mb-6">
            <MenuItem
              testID="switch-role-button"
              icon={<Store size={20} color={colors.primary} />}
              label={selectedRole === 'customer' ? 'Switch to Merchant mode' : 'Switch to Buyer mode'}
              onPress={handleSwitchRole}
              right={
                <Text variant="caption" className="text-primary font-semibold">
                  {selectedRole === 'customer' ? 'Buyer' : 'Merchant'}
                </Text>
              }
            />
          </Card>
        )}

        <Button
          testID="logout-button"
          variant="outline"
          fullWidth
          onPress={logout}
          leftIcon={<LogOut size={18} color={colors.foreground} />}
        >
          {t('common.logout')}
        </Button>
      </View>
    </Screen>
  );
}
