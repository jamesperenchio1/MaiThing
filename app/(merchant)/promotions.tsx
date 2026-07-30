import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Alert, Modal, ScrollView } from 'react-native';
import { Tag, Percent, Banknote, Clock, Trash2, Plus } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { Header } from '@/src/components/layout/Header';
import { Screen } from '@/src/components/layout/Screen';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { DateTimePickerField } from '@/src/components/ui/DateTimePickerField';
import { useAuthStore } from '@/src/stores/auth';
import { useMerchantByOwner } from '@/src/hooks/useMerchants';
import {
  useCoupons,
  useCreateCoupon,
  useUpdateCoupon,
  useDeleteCoupon,
} from '@/src/hooks/useCoupons';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatCurrency } from '@/src/lib/utils';
import type { Coupon, CouponDiscountType, CouponStatus } from '@/src/types';

const DISCOUNT_TYPES: CouponDiscountType[] = ['percentage', 'fixed'];

function StatusBadge({
  status,
  colors,
}: {
  status: CouponStatus;
  colors: ReturnType<typeof useThemeColor>;
}) {
  const { t } = useTranslation();
  const color =
    status === 'active' ? colors.success : status === 'inactive' ? colors.warning : colors.danger;
  return (
    <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: `${color}20` }}>
      <Text className="text-xs font-semibold" style={{ color }}>
        {t(`merchant.coupons.${status}`)}
      </Text>
    </View>
  );
}

function CouponItem({
  coupon,
  onToggle,
  onDelete,
}: {
  coupon: Coupon;
  onToggle: (coupon: Coupon) => void;
  onDelete: (coupon: Coupon) => void;
}) {
  const { t } = useTranslation();
  const colors = useThemeColor();
  const discountLabel =
    coupon.discountType === 'percentage'
      ? `${coupon.discountValue}%`
      : formatCurrency(coupon.discountValue);
  const isExpired = new Date(coupon.validUntil) < new Date();

  return (
    <View className="border-b border-border py-4 last:border-b-0">
      <View className="mb-2 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Tag size={16} color={colors.primary} />
          <Text variant="body-sm" className="ml-2 font-bold">
            {coupon.code}
          </Text>
        </View>
        <StatusBadge status={isExpired ? 'expired' : coupon.status} colors={colors} />
      </View>
      <Text variant="body-sm" className="mb-2 text-muted">
        {coupon.description}
      </Text>
      <View className="mb-3 flex-row items-center">
        <View className="mr-3 flex-row items-center rounded-lg bg-primary/10 px-2 py-1">
          {coupon.discountType === 'percentage' ? (
            <Percent size={12} color={colors.primary} />
          ) : (
            <Banknote size={12} color={colors.primary} />
          )}
          <Text className="ml-1 text-xs font-semibold text-primary">{discountLabel}</Text>
        </View>
        <Text variant="caption" className="text-muted">
          {t('merchant.coupons.uses', { count: coupon.usesCount })}
        </Text>
      </View>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Clock size={12} color={colors.muted} />
          <Text variant="caption" className="ml-1 text-muted">
            {new Date(coupon.validFrom).toLocaleDateString()} –{' '}
            {new Date(coupon.validUntil).toLocaleDateString()}
          </Text>
        </View>
        <View className="flex-row items-center" style={{ gap: 8 }}>
          {!isExpired && (
            <PressableScale
              onPress={() => onToggle(coupon)}
              scale={0.97}
              className={`rounded-xl px-3 py-1.5 ${
                coupon.status === 'active' ? 'bg-success/10' : 'bg-warning/10'
              }`}
            >
              <Text
                variant="caption"
                className={`font-semibold ${
                  coupon.status === 'active' ? 'text-success' : 'text-warning'
                }`}
              >
                {coupon.status === 'active'
                  ? t('merchant.coupons.inactive')
                  : t('merchant.coupons.active')}
              </Text>
            </PressableScale>
          )}
          <PressableScale
            onPress={() => onDelete(coupon)}
            scale={0.9}
            className="rounded-full bg-danger/10 p-2"
          >
            <Trash2 size={18} color={colors.danger} />
          </PressableScale>
        </View>
      </View>
    </View>
  );
}

export default function PromotionsScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const colors = useThemeColor();
  const { data: merchant } = useMerchantByOwner(user?.id ?? '');
  const merchantId = merchant?.id ?? '';

  const { data: coupons, isLoading, isError, refetch } = useCoupons(merchantId);
  const createCoupon = useCreateCoupon(merchantId);
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();

  const [modalVisible, setModalVisible] = useState(false);
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<CouponDiscountType>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [validFrom, setValidFrom] = useState(new Date());
  const [validUntil, setValidUntil] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [status, setStatus] = useState<CouponStatus>('active');

  const resetForm = () => {
    setCode('');
    setDescription('');
    setDiscountType('percentage');
    setDiscountValue('');
    setMinOrder('');
    setMaxUses('');
    setValidFrom(new Date());
    setValidUntil(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    setStatus('active');
  };

  const handleToggle = async (coupon: Coupon) => {
    const nextStatus: CouponStatus = coupon.status === 'active' ? 'inactive' : 'active';
    try {
      await updateCoupon.mutateAsync({ id: coupon.id, data: { status: nextStatus } });
    } catch {
      Alert.alert(t('common.error'), 'Could not update coupon status.');
    }
  };

  const handleDelete = (coupon: Coupon) => {
    Alert.alert('Delete coupon?', `Are you sure you want to delete ${coupon.code}?`, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCoupon.mutateAsync(coupon.id);
          } catch {
            Alert.alert(t('common.error'), 'Could not delete coupon.');
          }
        },
      },
    ]);
  };

  const handleCreate = async () => {
    const value = Number(discountValue);
    if (
      !code.trim() ||
      !description.trim() ||
      !discountValue ||
      Number.isNaN(value) ||
      value <= 0
    ) {
      Alert.alert(t('common.error'), 'Please fill in all required fields with valid values.');
      return;
    }
    if (validUntil <= validFrom) {
      Alert.alert(t('common.error'), 'Valid until date must be after valid from date.');
      return;
    }
    try {
      await createCoupon.mutateAsync({
        code: code.trim().toUpperCase(),
        description: description.trim(),
        discountType,
        discountValue: value,
        minOrderAmount: minOrder ? Number(minOrder) : undefined,
        maxUses: maxUses ? Number(maxUses) : undefined,
        validFrom: validFrom.toISOString(),
        validUntil: validUntil.toISOString(),
        status,
      });
      resetForm();
      setModalVisible(false);
    } catch {
      Alert.alert(t('common.error'), 'Could not create coupon.');
    }
  };

  if (isError) {
    return (
      <Screen scrollable className="bg-background">
        <Header title={t('merchant.coupons.title')} />
        <View className="px-6 py-4">
          <ErrorState
            title={t('common.error')}
            message="We couldn't load your promotions."
            onRetry={refetch}
            retryLabel={t('common.retry')}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen testID="merchant-promotions-screen" scrollable className="bg-background">
      <Header title={t('merchant.coupons.title')} />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-6 py-4">
          <Button
            testID="create-coupon-button"
            fullWidth
            variant="secondary"
            onPress={() => setModalVisible(true)}
            leftIcon={<Plus size={18} color={colors.foreground} />}
            className="mb-6"
          >
            {t('merchant.coupons.create')}
          </Button>

          <Card variant="outlined">
            {isLoading ? (
              <Text variant="body-sm" className="py-6 text-center text-muted">
                {t('common.loading')}
              </Text>
            ) : coupons && coupons.length > 0 ? (
              coupons.map((coupon) => (
                <CouponItem
                  key={coupon.id}
                  coupon={coupon}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))
            ) : (
              <View className="items-center py-8">
                <Tag size={40} color={colors.muted} />
                <Text variant="body-sm" className="mt-3 text-center text-muted">
                  {t('merchant.coupons.noCoupons')}
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
          <ScrollView className="flex-1" contentContainerStyle={{ justifyContent: 'flex-end' }}>
            <View className="rounded-t-3xl bg-background px-6 pb-8 pt-6">
              <Text variant="h3" className="mb-6">
                {t('merchant.coupons.create')}
              </Text>

              <Input
                testID="coupon-code-input"
                label={t('merchant.coupons.code')}
                placeholder="SAVE20"
                value={code}
                onChangeText={setCode}
                autoCapitalize="characters"
              />
              <Input
                testID="coupon-description-input"
                label={t('merchant.coupons.description')}
                placeholder="20% off your first rescue"
                value={description}
                onChangeText={setDescription}
              />

              <Text variant="label" className="mb-2 ml-1">
                {t('merchant.coupons.discountType')}
              </Text>
              <View className="mb-4 flex-row" style={{ gap: 8 }}>
                {DISCOUNT_TYPES.map((type) => (
                  <PressableScale
                    key={type}
                    onPress={() => setDiscountType(type)}
                    scale={0.97}
                    className={`flex-1 flex-row items-center justify-center rounded-2xl border px-3 py-3 ${
                      discountType === type
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card'
                    }`}
                  >
                    {type === 'percentage' ? (
                      <Percent
                        size={16}
                        color={discountType === type ? colors.primary : colors.muted}
                      />
                    ) : (
                      <Banknote
                        size={16}
                        color={discountType === type ? colors.primary : colors.muted}
                      />
                    )}
                    <Text
                      variant="caption"
                      className={`ml-1 font-semibold ${
                        discountType === type ? 'text-primary' : 'text-muted'
                      }`}
                    >
                      {t(`merchant.coupons.${type}`)}
                    </Text>
                  </PressableScale>
                ))}
              </View>

              <Input
                testID="coupon-discount-value-input"
                label={t('merchant.coupons.discountValue')}
                placeholder={discountType === 'percentage' ? '20' : '50'}
                value={discountValue}
                onChangeText={setDiscountValue}
                keyboardType="numeric"
              />
              <Input
                testID="coupon-min-order-input"
                label={t('merchant.coupons.minOrder')}
                placeholder="0"
                value={minOrder}
                onChangeText={setMinOrder}
                keyboardType="numeric"
              />
              <Input
                testID="coupon-max-uses-input"
                label={t('merchant.coupons.maxUses')}
                placeholder="Unlimited"
                value={maxUses}
                onChangeText={setMaxUses}
                keyboardType="number-pad"
              />

              <DateTimePickerField
                label={t('merchant.coupons.validFrom')}
                value={validFrom}
                onChange={setValidFrom}
                maximumDate={validUntil}
              />
              <DateTimePickerField
                label={t('merchant.coupons.validUntil')}
                value={validUntil}
                onChange={setValidUntil}
                minimumDate={validFrom}
              />

              <PressableScale
                onPress={() => setStatus((s) => (s === 'active' ? 'inactive' : 'active'))}
                className="mb-6 flex-row items-center justify-between rounded-2xl border border-border bg-card px-4 py-3.5"
              >
                <Text variant="body-sm" className="font-medium">
                  {t('merchant.coupons.active')}
                </Text>
                <View
                  className={`h-6 w-11 rounded-full ${status === 'active' ? 'bg-primary' : 'bg-muted/30'}`}
                >
                  <View
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm ${
                      status === 'active' ? 'left-6' : 'left-0.5'
                    }`}
                  />
                </View>
              </PressableScale>

              <Button
                testID="save-coupon-button"
                fullWidth
                loading={createCoupon.isPending}
                disabled={!code.trim() || !description.trim() || !discountValue}
                onPress={handleCreate}
                className="mb-3"
              >
                {t('common.save')}
              </Button>
              <Button
                testID="cancel-coupon-button"
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
          </ScrollView>
        </View>
      </Modal>
    </Screen>
  );
}
