import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Alert, ScrollView, Switch } from 'react-native';
import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { UserPlus, Mail, Phone, Shield, Trash2, Plus, Clock } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { Header } from '@/src/components/layout/Header';
import { Screen } from '@/src/components/layout/Screen';
import { Avatar } from '@/src/components/ui/Avatar';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useAuthStore } from '@/src/stores/auth';
import { useMerchantByOwner, useStaff, useAddStaff, useUpdateStaff, useRemoveStaff } from '@/src/hooks/useMerchants';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatRelativeTime } from '@/src/lib/utils';
import type { StaffRole, StaffMember } from '@/src/types';

const ROLES: StaffRole[] = ['owner', 'manager', 'staff'];

const ALL_PERMISSIONS = [
  'manage_orders',
  'manage_inventory',
  'manage_staff',
  'manage_payouts',
  'manage_promotions',
  'view_analytics',
  'manage_messages',
];

const DEFAULT_PERMISSIONS_BY_ROLE: Record<StaffRole, string[]> = {
  owner: ['all'],
  manager: ['manage_orders', 'manage_inventory', 'manage_staff', 'view_analytics'],
  staff: ['manage_orders'],
};

function RoleBadge({
  role,
  colors,
}: {
  role: StaffRole;
  colors: ReturnType<typeof useThemeColor>;
}) {
  const { t } = useTranslation();
  const color =
    role === 'owner' ? colors.warning : role === 'manager' ? colors.info : colors.success;
  return (
    <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: `${color}20` }}>
      <Text className="text-xs font-semibold" style={{ color }}>
        {t(`merchant.staff.${role}`)}
      </Text>
    </View>
  );
}

function PermissionChip({
  id,
  selected,
  onToggle,
}: {
  id: string;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <PressableScale
      onPress={() => onToggle(id)}
      scale={0.97}
      className={`mb-2 mr-2 rounded-full border px-3 py-1.5 ${
        selected ? 'border-primary bg-primary/10' : 'border-border bg-card'
      }`}
    >
      <Text variant="caption" className={`font-medium ${selected ? 'text-primary' : 'text-muted'}`}>
        {t(`merchant.staff.permission.${id}`)}
      </Text>
    </PressableScale>
  );
}

function StaffItem({
  member,
  onDelete,
  onToggleActive,
}: {
  member: StaffMember;
  onDelete: (member: StaffMember) => void;
  onToggleActive: (member: StaffMember) => void;
}) {
  const { t, i18n } = useTranslation();
  const colors = useThemeColor();
  const locale = i18n.language === 'th' ? 'th' : 'en';

  return (
    <View className="border-b border-border py-4 last:border-b-0">
      <View className="flex-row items-start">
        <Avatar uri={member.avatarUrl} name={member.name} size="md" />
        <View className="ml-3 flex-1">
          <View className="mb-1 flex-row flex-wrap items-center">
            <Text variant="body-sm" className="mr-2 font-semibold">
              {member.name}
            </Text>
            <RoleBadge role={member.role} colors={colors} />
          </View>

          <View className="mb-2 flex-row flex-wrap items-center">
            {member.isActive ? (
              <Badge variant="success" className="mr-2">
                {t('merchant.staff.active')}
              </Badge>
            ) : (
              <Badge variant="warning" className="mr-2">
                {t('merchant.staff.invited')}
              </Badge>
            )}
            {member.lastActiveAt && member.isActive && (
              <View className="flex-row items-center">
                <Clock size={10} color={colors.muted} />
                <Text variant="caption" className="ml-1 text-muted">
                  {formatRelativeTime(member.lastActiveAt, locale)}
                </Text>
              </View>
            )}
          </View>

          <Text variant="caption" className="mb-2 text-muted">
            {t(`merchant.staff.roleDescription.${member.role}`)}
          </Text>

          <View className="flex-row items-center">
            <Mail size={12} color={colors.muted} />
            <Text variant="caption" className="ml-1 text-muted">
              {member.email}
            </Text>
          </View>
          {member.phone && (
            <View className="flex-row items-center">
              <Phone size={12} color={colors.muted} />
              <Text variant="caption" className="ml-1 text-muted">
                {member.phone}
              </Text>
            </View>
          )}

          {member.permissions.length > 0 && member.permissions[0] !== 'all' && (
            <View className="mt-2 flex-row flex-wrap">
              {member.permissions.map((permission) => (
                <View
                  key={permission}
                  className="mb-1 mr-1.5 rounded-md bg-muted/10 px-2 py-1"
                >
                  <Text variant="caption" className="text-muted">
                    {t(`merchant.staff.permission.${permission}`)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {member.role !== 'owner' && (
          <View className="ml-2 items-end">
            <Switch
              testID={`staff-active-switch-${member.id}`}
              value={member.isActive}
              onValueChange={() => onToggleActive(member)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
            <PressableScale
              onPress={() => onDelete(member)}
              scale={0.9}
              className="mt-3 rounded-full bg-danger/10 p-2"
            >
              <Trash2 size={18} color={colors.danger} />
            </PressableScale>
          </View>
        )}
      </View>
    </View>
  );
}

export default function StaffScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const colors = useThemeColor();
  const { data: merchant } = useMerchantByOwner(user?.id ?? '');
  const merchantId = merchant?.id ?? '';

  const { data: staff, isLoading, isError, refetch } = useStaff(merchantId);
  const addStaff = useAddStaff(merchantId);
  const updateStaff = useUpdateStaff(merchantId);
  const removeStaff = useRemoveStaff(merchantId);

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<StaffRole>('staff');
  const [permissions, setPermissions] = useState<string[]>(DEFAULT_PERMISSIONS_BY_ROLE.staff);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setRole('staff');
    setPermissions(DEFAULT_PERMISSIONS_BY_ROLE.staff);
  };

  const handleDelete = (member: StaffMember) => {
    Alert.alert(t('merchant.staff.removeTitle'), t('merchant.staff.removeConfirm', { name: member.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await removeStaff.mutateAsync(member.id);
          } catch {
            Alert.alert(t('common.error'), t('merchant.staff.removeError'));
          }
        },
      },
    ]);
  };

  const handleToggleActive = (member: StaffMember) => {
    updateStaff.mutate({
      staffId: member.id,
      data: {
        isActive: !member.isActive,
        lastActiveAt: !member.isActive ? new Date().toISOString() : undefined,
      },
    });
  };

  const togglePermission = (permission: string) => {
    setPermissions((prev) =>
      prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission]
    );
  };

  const handleAdd = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert(t('common.error'), t('merchant.staff.nameEmailRequired'));
      return;
    }
    try {
      await addStaff.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        role,
        isActive: role === 'owner',
        permissions: role === 'owner' ? ['all'] : permissions,
      });
      resetForm();
      setModalVisible(false);
    } catch {
      Alert.alert(t('common.error'), t('merchant.staff.addError'));
    }
  };

  if (isError) {
    return (
      <Screen scrollable className="bg-background">
        <Header title={t('merchant.staff.title')} />
        <View className="px-6 py-4">
          <ErrorState
            title={t('common.error')}
            message={t('merchant.staff.loadError')}
            onRetry={refetch}
            retryLabel={t('common.retry')}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen testID="merchant-staff-screen" scrollable className="bg-background">
      <Header title={t('merchant.staff.title')} />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-6 py-4">
          <Button
            testID="add-staff-button"
            fullWidth
            variant="secondary"
            onPress={() => setModalVisible(true)}
            leftIcon={<Plus size={18} color={colors.foreground} />}
            className="mb-6"
          >
            {t('merchant.staff.addStaff')}
          </Button>

          <Card variant="outlined">
            {isLoading ? (
              <Text variant="body-sm" className="py-6 text-center text-muted">
                {t('common.loading')}
              </Text>
            ) : staff && staff.length > 0 ? (
              staff.map((member) => (
                <StaffItem
                  key={member.id}
                  member={member}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                />
              ))
            ) : (
              <View className="items-center py-8">
                <UserPlus size={40} color={colors.muted} />
                <Text variant="body-sm" className="mt-3 text-center text-muted">
                  {t('merchant.staff.noStaff')}
                </Text>
              </View>
            )}
          </Card>
        </View>
      </ScrollView>

      <BottomSheet
        isOpen={modalVisible}
        onClose={() => setModalVisible(false)}
        snapPoints={['55%']}
      >
            <Text variant="h3" className="mb-6">
              {t('merchant.staff.addStaff')}
            </Text>

            <Input
              testID="staff-name-input"
              label={t('auth.name')}
              placeholder="Somchai Jaidee"
              value={name}
              onChangeText={setName}
            />
            <Input
              testID="staff-email-input"
              label={t('merchant.staff.email')}
              placeholder="staff@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              testID="staff-phone-input"
              label={t('merchant.staff.phone')}
              placeholder="081-234-5678"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <Text variant="label" className="mb-2 ml-1">
              {t('merchant.staff.role')}
            </Text>
            <View className="mb-4 flex-row" style={{ gap: 8 }}>
              {ROLES.map((r) => (
                <PressableScale
                  key={r}
                  onPress={() => {
                    setRole(r);
                    setPermissions(DEFAULT_PERMISSIONS_BY_ROLE[r]);
                  }}
                  scale={0.97}
                  className={`flex-1 items-center rounded-2xl border px-3 py-3 ${
                    role === r ? 'border-primary bg-primary/10' : 'border-border bg-card'
                  }`}
                >
                  <Shield size={18} color={role === r ? colors.primary : colors.muted} />
                  <Text
                    variant="caption"
                    className={`mt-1 font-semibold ${role === r ? 'text-primary' : 'text-muted'}`}
                  >
                    {t(`merchant.staff.${r}`)}
                  </Text>
                </PressableScale>
              ))}
            </View>

            <Text variant="label" className="mb-2 ml-1">
              {t('merchant.staff.permissions')}
            </Text>
            <Text variant="caption" className="mb-2 ml-1 text-muted">
              {t('merchant.staff.permissionsHint')}
            </Text>
            <View className="mb-6 flex-row flex-wrap">
              {ALL_PERMISSIONS.map((permission) => (
                <PermissionChip
                  key={permission}
                  id={permission}
                  selected={permissions.includes(permission)}
                  onToggle={togglePermission}
                />
              ))}
            </View>

            <Button
              testID="save-staff-button"
              fullWidth
              loading={addStaff.isPending}
              disabled={!name.trim() || !email.trim()}
              onPress={handleAdd}
              className="mb-3"
            >
              {t('merchant.staff.sendInvite')}
            </Button>
            <Button
              testID="cancel-staff-button"
              fullWidth
              variant="ghost"
              onPress={() => {
                resetForm();
                setModalVisible(false);
              }}
            >
              {t('common.cancel')}
            </Button>
      </BottomSheet>
    </Screen>
  );
}
