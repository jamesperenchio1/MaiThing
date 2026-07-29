import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Plus, TrendingUp, Package, DollarSign, QrCode } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Card } from '@/src/components/ui/Card';
import { Screen } from '@/src/components/layout/Screen';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useAuthStore } from '@/src/stores/auth';
import { useAnalytics } from '@/src/hooks/useAnalytics';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatCurrency } from '@/src/lib/utils';

type MetricKey = 'todayRevenue' | 'todayOrders' | 'totalItemsSaved' | 'totalRevenue';

function StatCard({
  label,
  value,
  icon,
  iconBg = 'bg-primary/10',
  onPress,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg?: string;
  onPress?: () => void;
}) {
  return (
    <PressableScale onPress={onPress} className="flex-1" scale={0.98} disabled={!onPress}>
      <Card variant="elevated" className="min-h-[120px] justify-between">
        <View className={`mb-2 rounded-xl p-2 self-start ${iconBg}`}>{icon}</View>
        <View>
          <Text variant="caption" className="mb-1 text-muted">
            {label}
          </Text>
          <Text variant="h3">{value}</Text>
        </View>
      </Card>
    </PressableScale>
  );
}

export default function MerchantDashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const colors = useThemeColor();
  const { data: analytics, isRefetching, isError, refetch } = useAnalytics(user?.id ?? '');

  const hour = new Date().getHours();

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refetch();
  };

  return (
    <Screen
      testID="merchant-dashboard-screen"
      scrollable
      className="bg-background"
      refreshing={isRefetching}
      onRefresh={handleRefresh}
    >
      <View className="px-6 pt-4 pb-2">
        {/* Today's Summary Banner */}
        <View className="mb-6 rounded-3xl bg-primary p-5 overflow-hidden">
          <View className="absolute right-4 top-4 bg-white/10 rounded-2xl px-3 py-1.5">
            <Text variant="caption" className="text-white/80 font-medium">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
          <Text variant="caption" className="text-white/70 mb-1">
            Good {hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'},{' '}
            {user?.name?.split(' ')[0]}
          </Text>
          <Text variant="h2" className="text-white mb-4">
            {formatCurrency(analytics?.todayRevenue ?? 0)}
          </Text>
          <View className="flex-row space-x-4">
            <View>
              <Text variant="caption" className="text-white/60">
                Orders today
              </Text>
              <Text variant="h4" className="text-white">
                {analytics?.todayOrders ?? 0}
              </Text>
            </View>
            <View className="w-px bg-white/20" />
            <View>
              <Text variant="caption" className="text-white/60">
                Items saved
              </Text>
              <Text variant="h4" className="text-white">
                {analytics?.totalItemsSaved ?? 0}
              </Text>
            </View>
            <View className="w-px bg-white/20" />
            <View>
              <Text variant="caption" className="text-white/60">
                All time
              </Text>
              <Text variant="h4" className="text-white">
                {formatCurrency(analytics?.totalRevenue ?? 0)}
              </Text>
            </View>
          </View>
        </View>

        {isError && (
          <ErrorState
            title={t('common.error')}
            message="We couldn't load your dashboard."
            onRetry={refetch}
            retryLabel={t('common.retry')}
          />
        )}

        <View testID="merchant-stats-row-1" className="mb-6 flex-row space-x-3">
          <StatCard
            label={t('merchant.dashboard.todayRevenue')}
            value={formatCurrency(analytics?.todayRevenue ?? 0)}
            icon={<DollarSign size={20} color="#16A34A" />}
            iconBg="bg-primary/10"
            onPress={() =>
              router.push({
                pathname: '/(merchant)/analytics',
                params: { metric: 'todayRevenue' },
              } as any)
            }
          />
          <StatCard
            label={t('merchant.dashboard.todayOrders')}
            value={String(analytics?.todayOrders ?? 0)}
            icon={<TrendingUp size={20} color="#3B82F6" />}
            iconBg="bg-blue-500/10"
            onPress={() =>
              router.push({
                pathname: '/(merchant)/analytics',
                params: { metric: 'todayOrders' },
              } as any)
            }
          />
        </View>

        <View testID="merchant-stats-row-2" className="mb-6 flex-row space-x-3">
          <StatCard
            label={t('merchant.dashboard.itemsSaved')}
            value={String(analytics?.totalItemsSaved ?? 0)}
            icon={<Package size={20} color="#F97316" />}
            iconBg="bg-orange-500/10"
            onPress={() =>
              router.push({
                pathname: '/(merchant)/analytics',
                params: { metric: 'totalItemsSaved' },
              } as any)
            }
          />
          <StatCard
            label={t('merchant.dashboard.totalRevenue')}
            value={formatCurrency(analytics?.totalRevenue ?? 0)}
            icon={<DollarSign size={20} color="#8B5CF6" />}
            iconBg="bg-violet-500/10"
            onPress={() =>
              router.push({
                pathname: '/(merchant)/analytics',
                params: { metric: 'totalRevenue' },
              } as any)
            }
          />
        </View>

        {/* Quick Actions Grid */}
        <View className="mb-6">
          <Text variant="body-sm" className="mb-3 font-semibold text-muted">
            Quick Actions
          </Text>
          <View className="flex-row flex-wrap" style={{ gap: 12 }}>
            {[
              {
                icon: Plus,
                label: 'New Listing',
                color: colors.primary,
                bg: 'bg-primary/10',
                route: '/(merchant)/listings/new',
              },
              {
                icon: QrCode,
                label: 'Scan Pickup',
                color: colors.foreground,
                bg: 'bg-muted/10',
                route: '/(merchant)/scanner',
              },
              {
                icon: Package,
                label: 'Inventory',
                color: colors.foreground,
                bg: 'bg-muted/10',
                route: '/(merchant)/(tabs)/inventory',
              },
              {
                icon: TrendingUp,
                label: 'Analytics',
                color: colors.foreground,
                bg: 'bg-muted/10',
                route: '/(merchant)/analytics',
              },
            ].map(({ icon: Icon, label, color, bg, route }) => (
              <PressableScale
                key={label}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(route as any);
                }}
                scale={0.95}
                style={{ width: '47%' }}
              >
                <Card variant="elevated" className="items-center py-5">
                  <View className={`rounded-2xl p-3 mb-2 ${bg}`}>
                    <Icon size={22} color={color} />
                  </View>
                  <Text variant="body-sm" className="font-medium text-center">
                    {label}
                  </Text>
                </Card>
              </PressableScale>
            ))}
          </View>
        </View>
      </View>
    </Screen>
  );
}
