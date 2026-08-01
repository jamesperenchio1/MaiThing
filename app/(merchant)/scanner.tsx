import { useEffect, useState } from 'react';
import { View, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
let CameraView: React.ComponentType<{ facing?: string; barcodeScannerSettings?: { barcodeTypes: string[] }; onBarcodeScanned?: (result: { data: string }) => void; style?: object }> | null = null;
let useCameraPermissions: (() => [{ granted: boolean } | null, () => Promise<void>]) | null = null;
type BarcodeScanningResult = { data: string };
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cam = require('expo-camera');
  CameraView = cam.CameraView;
  useCameraPermissions = cam.useCameraPermissions;
} catch {
  // not available in Expo Go
}
import React from 'react';
import { QrCode, Check, Search, XCircle, X } from 'lucide-react-native';

import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Screen } from '@/src/components/layout/Screen';
import { Badge } from '@/src/components/ui/Badge';
import { useUpdateOrderStatus, useOrderByPickupCode } from '@/src/hooks/useOrders';
import { useAuthStore } from '@/src/stores/auth';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatCurrency } from '@/src/lib/utils';

const isWeb = Platform.OS === 'web';

export default function ScannerScreen() {
  const { t } = useTranslation();
  const colors = useThemeColor();
  const user = useAuthStore((s) => s.user);
  const [permission, requestPermission] = useCameraPermissions?.() ?? [null, async () => {}];
  const { preloadCode } = useLocalSearchParams<{ preloadCode?: string }>();

  const merchantId = user?.merchantId ?? user?.id ?? '';

  const [manualCode, setManualCode] = useState(preloadCode ?? '');
  const [lookupCode, setLookupCode] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (preloadCode) {
      const code = preloadCode.trim().toUpperCase();
      setManualCode(code);
      setLookupCode(code);
    }
  }, [preloadCode]);

  const { data: found, isFetching, isFetched } = useOrderByPickupCode(merchantId, lookupCode);

  const updateStatus = useUpdateOrderStatus();

  const notFound = lookupCode.length >= 4 && !isFetching && isFetched && !found;

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    const code = result.data.trim().toUpperCase();
    if (code.length < 4 || code === lookupCode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLookupCode(code);
    setManualCode(code);
    setDone(false);
  };

  const handleManualSearch = () => {
    const code = manualCode.trim().toUpperCase();
    if (code.length < 4) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLookupCode(code);
    setDone(false);
  };

  const handleClear = () => {
    setLookupCode('');
    setManualCode('');
    setDone(false);
  };

  const handleMarkPickedUp = () => {
    if (!found) return;
    updateStatus.mutate(
      { id: found.id, status: 'picked_up' },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setDone(true);
          setLookupCode('');
          setManualCode('');
          setTimeout(() => setDone(false), 3000);
        },
      }
    );
  };

  const renderCamera = () => {
    if (isWeb) {
      return (
        <View className="mb-6 items-center">
          <View className="h-56 w-56 items-center justify-center rounded-3xl border-2 border-dashed border-border bg-muted/10">
            <QrCode size={64} color={colors.muted} />
            <Text variant="caption" className="mt-3 px-6 text-center text-muted">
              {t('merchant.scanner.noCamera')}
            </Text>
          </View>
        </View>
      );
    }

    if (!permission?.granted) {
      return (
        <View className="mb-6 items-center">
          <View className="h-56 w-56 items-center justify-center rounded-3xl border-2 border-dashed border-border bg-muted/10">
            <QrCode size={64} color={colors.muted} />
            <Text variant="caption" className="mt-3 px-6 text-center text-muted">
              {t('merchant.scanner.noCamera')}
            </Text>
          </View>
          <Button onPress={requestPermission} className="mt-4">
            Allow Camera
          </Button>
        </View>
      );
    }

    if (!CameraView) {
      return (
        <View className="mb-6 items-center">
          <View className="h-72 w-full items-center justify-center rounded-3xl bg-muted/20">
            <Text variant="body-sm" className="text-muted">Camera not available</Text>
          </View>
        </View>
      );
    }

    return (
      <View className="mb-6 items-center">
        <View className="h-72 w-full overflow-hidden rounded-3xl">
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            onBarcodeScanned={found ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: [
                'qr',
                'codabar',
                'code128',
                'code39',
                'code93',
                'ean13',
                'ean8',
                'itf14',
                'upc_a',
                'upc_e',
                'pdf417',
              ],
            }}
          />
        </View>
        <Text variant="caption" className="mt-3 text-center text-muted">
          {t('merchant.scanner.scanHint')}
        </Text>
      </View>
    );
  };

  return (
    <Screen scrollable className="bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="px-6 pb-8 pt-4">
          <Text variant="h1" className="mb-2">
            {t('merchant.scanner.title')}
          </Text>
          <Text variant="body" className="mb-8 text-muted">
            {t('merchant.scanner.scanHint')}
          </Text>

          {renderCamera()}

          <Text variant="body-sm" className="mb-2 font-semibold">
            {t('merchant.scanner.manualEntry')}
          </Text>
          <View className="mb-2 flex-row space-x-3">
            <View
              className={`flex-1 rounded-2xl border bg-card px-4 py-3 ${
                notFound ? 'border-danger' : 'border-border'
              }`}
            >
              <TextInput
                value={manualCode}
                onChangeText={(v) => {
                  setManualCode(v);
                  if (lookupCode) setLookupCode('');
                  if (done) setDone(false);
                }}
                placeholder="e.g. AB1234"
                placeholderTextColor={colors.muted}
                autoCapitalize="characters"
                style={{
                  color: colors.foreground,
                  fontSize: 18,
                  fontWeight: '600',
                  letterSpacing: 2,
                }}
                returnKeyType="search"
                onSubmitEditing={handleManualSearch}
              />
            </View>
            <Button onPress={handleManualSearch} size="icon" disabled={!manualCode.trim()}>
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
              <Text variant="body-sm" className="ml-2 font-semibold text-primary">
                Order marked as picked up!
              </Text>
            </View>
          )}

          {found && (
            <Card variant="elevated" className="mb-4">
              <View className="mb-3 flex-row items-center justify-between">
                <View>
                  <Text variant="h4">{found.pickupCode}</Text>
                  <Text variant="body-sm" className="text-muted">
                    {found.customerName}
                  </Text>
                </View>
                <Badge variant="success">{t('merchant.scanner.orderFound')}</Badge>
              </View>
              <Text variant="body-sm" className="mb-1 text-muted">
                Items ordered:
              </Text>
              {found.items.map((item) => (
                <Text key={item.listingId} variant="body-sm" className="mb-0.5">
                  {item.quantity}× {item.title}
                </Text>
              ))}
              <View className="mt-3 flex-row items-center justify-between border-t border-border pt-3">
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
                {t('merchant.scanner.markPickedUp')}
              </Button>
              <Button
                variant="ghost"
                fullWidth
                className="mt-2"
                onPress={handleClear}
                leftIcon={<X size={18} color={colors.muted} />}
              >
                Scan another
              </Button>
            </Card>
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
