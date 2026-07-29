import { useState } from 'react';
import { View, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { QrCode, Check, Search, XCircle } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Screen } from '@/src/components/layout/Screen';
import { Badge } from '@/src/components/ui/Badge';
import { useOrders, useUpdateOrderStatus } from '@/src/hooks/useOrders';
import { useAuthStore } from '@/src/stores/auth';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatCurrency } from '@/src/lib/utils';
import type { Order } from '@/src/types';

export default function ScannerScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColor();
  const user = useAuthStore((s) => s.user);
  const [code, setCode] = useState('');
  const [found, setFound] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [done, setDone] = useState(false);
  const updateStatus = useUpdateOrderStatus();

  const { data: orders } = useOrders(user?.id ?? '', 'merchant');

  const handleSearch = () => {
    const trimmed = code.trim().toUpperCase();
    const match = orders?.find(
      (o) =>
        o.pickupCode.toUpperCase() === trimmed &&
        (o.status === 'confirmed' || o.status === 'preparing' || o.status === 'ready')
    );
    if (match) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFound(match);
      setNotFound(false);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setNotFound(true);
      setFound(null);
    }
  };

  const handleMarkPickedUp = () => {
    if (!found) return;
    updateStatus.mutate(
      { id: found.id, status: 'picked_up' },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setDone(true);
          setFound(null);
          setCode('');
          setTimeout(() => setDone(false), 3000);
        },
      }
    );
  };

  return (
    <Screen scrollable className="bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="px-6 pt-4 pb-8">
          <Text variant="h1" className="mb-2">
            Pickup Scanner
          </Text>
          <Text variant="body" className="mb-8 text-muted">
            Enter a customer's pickup code to verify and complete their order.
          </Text>

          {/* Mock scanner viewfinder */}
          <View className="mb-6 items-center">
            <View className="w-56 h-56 rounded-3xl bg-muted/10 items-center justify-center border-2 border-dashed border-border">
              <QrCode size={64} color={colors.muted} />
              <Text variant="caption" className="mt-3 text-muted">
                Camera scan coming soon
              </Text>
            </View>
          </View>

          <Text variant="body-sm" className="mb-2 font-semibold">
            Or enter code manually
          </Text>
          <View className="flex-row space-x-3 mb-2">
            <View
              className={`flex-1 rounded-2xl border bg-card px-4 py-3 ${notFound ? 'border-danger' : 'border-border'}`}
            >
              <TextInput
                value={code}
                onChangeText={(v) => {
                  setCode(v);
                  setFound(null);
                  setNotFound(false);
                }}
                placeholder="e.g. AB1234"
                placeholderTextColor={colors.muted}
                autoCapitalize="characters"
                style={{ color: colors.foreground, fontSize: 18, fontWeight: '600', letterSpacing: 2 }}
                returnKeyType="search"
                onSubmitEditing={handleSearch}
              />
            </View>
            <Button onPress={handleSearch} size="icon" disabled={!code.trim()}>
              <Search size={20} color={colors.white} />
            </Button>
          </View>

          {notFound && (
            <View className="mb-4 flex-row items-center rounded-2xl bg-danger/10 px-4 py-3">
              <XCircle size={16} color={colors.danger} />
              <Text variant="body-sm" className="ml-2 text-danger">
                No active order found with that code.
              </Text>
            </View>
          )}

          {done && (
            <View className="mb-4 flex-row items-center rounded-2xl bg-primary/10 px-4 py-3">
              <Check size={16} color={colors.primary} />
              <Text variant="body-sm" className="ml-2 text-primary font-semibold">
                Order marked as picked up!
              </Text>
            </View>
          )}

          {!notFound && !done && <View className="mb-4" />}

          {found && (
            <Card variant="elevated" className="mb-4">
              <View className="mb-3 flex-row items-center justify-between">
                <Text variant="h4">{found.pickupCode}</Text>
                <Badge variant="success">Active</Badge>
              </View>
              <Text variant="body-sm" className="mb-1 text-muted">
                Items ordered:
              </Text>
              {found.items.map((item) => (
                <Text key={item.listingId} variant="body-sm" className="mb-0.5">
                  {item.quantity}× {item.title}
                </Text>
              ))}
              <View className="mt-3 border-t border-border pt-3 flex-row items-center justify-between">
                <Text variant="body" className="font-semibold">
                  {formatCurrency(found.total)}
                </Text>
                <Text variant="caption" className="text-muted">
                  Pickup by{' '}
                  {new Date(found.pickupWindowEnd).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <Button
                className="mt-4"
                fullWidth
                leftIcon={<Check size={18} color={colors.white} />}
                onPress={handleMarkPickedUp}
                loading={updateStatus.isPending}
              >
                Mark as Picked Up
              </Button>
            </Card>
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
