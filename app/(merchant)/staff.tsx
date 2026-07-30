import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Alert, Modal, ScrollView } from 'react-native';
import { UserPlus, Mail, Phone, Shield, Trash2, Plus } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { Header } from '@/src/components/layout/Header';
import { Screen } from '@/src/components/layout/Screen';
import { Avatar } from '@/src/components/ui/Avatar';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useAuthStore } from '@/src/stores/auth';
import { useMerchantByOwner } from '@/src/hooks/useMerchants';
import { useStaff, useAddStaff, useRemoveStaff } from '@/src/hooks/useMerchants';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import type { StaffRole, StaffMember } from '@/src/types';

const ROLES: StaffRole[] = ['owner', 'manager', 'staff'];

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

function StaffItem({
  member,
  onDelete,
}: {
  member: StaffMember;
  onDelete: (member: StaffMember) => void;
}) {
  const colors = useThemeColor();

  return (
    <View className="flex-row items-center border-b border-border py-3 last:border-b-0">
      <Avatar uri={member.avatarUrl} name={member.name} size="md" />
      <View className="ml-3 flex-1">
        <View className="mb-1 flex-row items-center">
          <Text variant="body-sm" className="mr-2 font-semibold">
            {member.name}
          </Text>
          <RoleBadge role={member.role} colors={colors} />
        </View>
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
      </View>
      {member.role !== 'owner' && (
        <PressableScale
          onPress={() => onDelete(member)}
          scale={0.9}
          className="rounded-full bg-danger/10 p-2"
        >
          <Trash2 size={18} color={colors.danger} />
        </PressableScale>
      )}
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
  const removeStaff = useRemoveStaff(merchantId);

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<StaffRole>('staff');

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setRole('staff');
  };

  const handleDelete = (member: StaffMember) => {
    Alert.alert('Remove staff member?', `Are you sure you want to remove ${member.name}?`, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await removeStaff.mutateAsync(member.id);
          } catch {
            Alert.alert(t('common.error'), 'Could not remove staff member.');
          }
        },
      },
    ]);
  };

  const handleAdd = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert(t('common.error'), 'Please fill in name and email.');
      return;
    }
    try {
      await addStaff.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        role,
      });
      resetForm();
      setModalVisible(false);
    } catch {
      Alert.alert(t('common.error'), 'Could not add staff member.');
    }
  };

  if (isError) {
    return (
      <Screen scrollable className="bg-background">
        <Header title={t('merchant.staff.title')} />
        <View className="px-6 py-4">
          <ErrorState
            title={t('common.error')}
            message="We couldn't load your team."
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
                <StaffItem key={member.id} member={member} onDelete={handleDelete} />
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

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-3xl bg-background px-6 pb-8 pt-6">
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
            <View className="mb-6 flex-row" style={{ gap: 8 }}>
              {ROLES.map((r) => (
                <PressableScale
                  key={r}
                  onPress={() => setRole(r)}
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

            <Button
              testID="save-staff-button"
              fullWidth
              loading={addStaff.isPending}
              disabled={!name.trim() || !email.trim()}
              onPress={handleAdd}
              className="mb-3"
            >
              {t('common.save')}
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
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
