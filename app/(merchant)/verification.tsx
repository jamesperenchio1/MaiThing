import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Star,
  Package,
  AlertCircle,
  Upload,
  FileCheck,
} from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Screen } from '@/src/components/layout/Screen';
import { Header } from '@/src/components/layout/Header';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { useAuthStore } from '@/src/stores/auth';
import { useMerchantByOwner } from '@/src/hooks/useMerchants';
import { useVerifyMerchant, useUploadFoodSafetyCert } from '@/src/hooks/useVerification';
import type { Merchant } from '@/src/types';

const COMPLETED_ORDERS_THRESHOLD = 10;
const MIN_RATING = 4.0;
const PLACEHOLDER_CERT_URL =
  'https://placehold.co/600x400/16A34A/FFFFFF/png?text=Food+Safety+Certificate';

function getChecklistItems(merchant: Merchant) {
  const completedOrders = merchant.completedOrders ?? 0;
  const refundDisputes = merchant.refundDisputes ?? 0;

  return [
    {
      id: 'orders',
      label: '10+ completed orders',
      detail: `${completedOrders} / ${COMPLETED_ORDERS_THRESHOLD} orders`,
      done: completedOrders >= COMPLETED_ORDERS_THRESHOLD,
      icon: Package,
    },
    {
      id: 'rating',
      label: 'Rating ≥ 4.0',
      detail: `${merchant.rating.toFixed(1)} / ${MIN_RATING.toFixed(1)} stars`,
      done: merchant.rating >= MIN_RATING,
      icon: Star,
    },
    {
      id: 'disputes',
      label: 'No refund disputes',
      detail:
        refundDisputes === 0 ? 'No disputes on record' : `${refundDisputes} dispute(s) on record`,
      done: refundDisputes === 0,
      icon: AlertCircle,
    },
  ] as const;
}

function ChecklistRow({
  icon: Icon,
  label,
  detail,
  done,
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  detail: string;
  done: boolean;
}) {
  const colors = useThemeColor();
  return (
    <View className="flex-row items-center py-4 border-b border-border last:border-b-0">
      <View
        className={`mr-3 h-10 w-10 items-center justify-center rounded-full ${
          done ? 'bg-green-500/10' : 'bg-muted/10'
        }`}
      >
        <Icon size={20} color={done ? colors.success : colors.muted} />
      </View>
      <View className="flex-1">
        <Text variant="body-sm" className="font-semibold">
          {label}
        </Text>
        <Text variant="caption" className="text-muted mt-0.5">
          {detail}
        </Text>
      </View>
      {done ? (
        <CheckCircle2 size={22} color={colors.success} />
      ) : (
        <Clock size={22} color={colors.muted} />
      )}
    </View>
  );
}

export default function VerificationScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const user = useAuthStore((s) => s.user);
  const [certUploaded, setCertUploaded] = useState(false);

  const { data: merchant, isLoading, refetch } = useMerchantByOwner(user?.id ?? '');

  const verifyMerchant = useVerifyMerchant(merchant?.id ?? '');
  const uploadCert = useUploadFoodSafetyCert(merchant?.id ?? '');

  if (isLoading) {
    return (
      <Screen scrollable className="bg-background">
        <View className="px-6 pt-4">
          <Skeleton width="100%" height={160} className="mb-4 rounded-3xl" />
          <Skeleton width="100%" height={200} className="mb-4 rounded-3xl" />
        </View>
      </Screen>
    );
  }

  if (!merchant) return null;

  const checklistItems = getChecklistItems(merchant);
  const completedCount = checklistItems.filter((item) => item.done).length;
  const totalCount = checklistItems.length;
  const allCriteriaMet = completedCount === totalCount;
  const progressPercent = Math.round((completedCount / totalCount) * 100);
  const isVerified = merchant.verificationStatus === 'verified';
  const hasCert = !!(merchant.foodSafetyCertUrl ?? certUploaded);

  const handleUploadCert = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Simulate upload with a placeholder URL
    uploadCert.mutate(PLACEHOLDER_CERT_URL, {
      onSuccess: () => {
        setCertUploaded(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
    });
  };

  const handleVerify = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    verifyMerchant.mutate(undefined, {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        refetch();
      },
    });
  };

  return (
    <Screen testID="merchant-verification-screen" scrollable className="bg-background">
      <Header title="Get Verified" showBack />
      <View className="px-6 pt-4 pb-8">
        {/* Header card */}
        <Card variant="elevated" className="mb-6">
          <View className="items-center py-2">
            <View
              className={`mb-3 h-16 w-16 items-center justify-center rounded-full ${
                isVerified ? 'bg-green-500/10' : 'bg-primary/10'
              }`}
            >
              <ShieldCheck size={32} color={isVerified ? colors.success : colors.primary} />
            </View>
            <Text variant="h3" className="mb-1 text-center">
              {isVerified ? 'Merchant Verified' : 'Get Verified'}
            </Text>
            <Text variant="body-sm" className="text-center text-muted">
              {isVerified
                ? 'Your merchant account is fully verified. Customers see your verification badge.'
                : 'Complete all steps below to earn your verified badge and build trust with customers.'}
            </Text>
          </View>

          {!isVerified && (
            <View className="mt-4">
              {/* Progress bar */}
              <View className="mb-1 flex-row items-center justify-between">
                <Text variant="caption" className="text-muted">
                  Progress
                </Text>
                <Text variant="caption" className="font-semibold text-primary">
                  {completedCount} / {totalCount} steps complete
                </Text>
              </View>
              <View className="h-2 w-full overflow-hidden rounded-full bg-muted/20">
                <View
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${progressPercent}%` }}
                />
              </View>
            </View>
          )}
        </Card>

        {/* All criteria met — auto-verify banner */}
        {allCriteriaMet && !isVerified && (
          <Card variant="elevated" className="mb-6 bg-green-500/10 border-green-500/30">
            <View className="flex-row items-start">
              <CheckCircle2 size={20} color={colors.success} />
              <View className="ml-3 flex-1">
                <Text
                  variant="body-sm"
                  className="font-semibold text-green-700 dark:text-green-400"
                >
                  You qualify for verification!
                </Text>
                <Text variant="caption" className="mt-0.5 text-green-700 dark:text-green-400">
                  All criteria are met. Tap "Submit for Verification" to complete your application.
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Checklist */}
        <Text variant="body-sm" className="mb-3 font-semibold text-muted">
          Verification Criteria
        </Text>
        <Card variant="elevated" className="mb-6">
          {checklistItems.map((item) => (
            <ChecklistRow
              key={item.id}
              icon={item.icon}
              label={item.label}
              detail={item.detail}
              done={item.done}
            />
          ))}
        </Card>

        {/* Food safety certificate */}
        <Text variant="body-sm" className="mb-3 font-semibold text-muted">
          Food Safety Certificate
        </Text>
        <Card variant="elevated" className="mb-6">
          <View className="flex-row items-center">
            <View
              className={`mr-3 h-10 w-10 items-center justify-center rounded-full ${
                hasCert ? 'bg-green-500/10' : 'bg-muted/10'
              }`}
            >
              {hasCert ? (
                <FileCheck size={20} color={colors.success} />
              ) : (
                <Upload size={20} color={colors.muted} />
              )}
            </View>
            <View className="flex-1">
              <Text variant="body-sm" className="font-semibold">
                {hasCert ? 'Certificate uploaded' : 'Upload certificate'}
              </Text>
              <Text variant="caption" className="mt-0.5 text-muted">
                {hasCert
                  ? 'Your food safety certificate is on file.'
                  : 'Optional but recommended. Increases customer trust.'}
              </Text>
            </View>
            {hasCert ? (
              <CheckCircle2 size={22} color={colors.success} />
            ) : (
              <PressableScale
                onPress={handleUploadCert}
                scale={0.95}
                disabled={uploadCert.isPending}
              >
                <View className="rounded-xl bg-primary/10 px-3 py-1.5">
                  <Text variant="caption" className="font-semibold text-primary">
                    {uploadCert.isPending ? 'Uploading…' : 'Upload'}
                  </Text>
                </View>
              </PressableScale>
            )}
          </View>
        </Card>

        {/* Submit / verified CTA */}
        {isVerified ? (
          <Button
            variant="ghost"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            Back to Dashboard
          </Button>
        ) : (
          <Button
            testID="submit-verification-button"
            variant="primary"
            onPress={handleVerify}
            disabled={!allCriteriaMet || verifyMerchant.isPending}
          >
            {verifyMerchant.isPending ? 'Submitting…' : 'Submit for Verification'}
          </Button>
        )}

        {!allCriteriaMet && (
          <Text variant="caption" className="mt-3 text-center text-muted">
            Complete all {totalCount} criteria above to unlock this button.
          </Text>
        )}
      </View>
    </Screen>
  );
}
