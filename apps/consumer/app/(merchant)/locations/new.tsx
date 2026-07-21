import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { supabase } from '../../../src/lib/supabase';
import { useMerchantOrg } from '../../../src/hooks/useProfile';
import { createLocationSchema } from '@maithing/shared';
import { useTheme } from '../../../src/theme';
import { Screen, Input, Button, ErrorState } from '../../../src/components/ui';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

export default function NewLocationScreen() {
  const { t } = useTranslation();
  const { colors, spacing, fontSizes, fontWeights } = useTheme();
  const { org, refetch } = useMerchantOrg();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [hours, setHours] = useState<
    Record<string, { open: string; close: string; closed?: boolean }>
  >(() =>
    Object.fromEntries(DAYS.map((d) => [d, { open: '09:00', close: '20:00', closed: false }])),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const toggleClosed = (day: string) => {
    setHours((prev) => {
      const current = prev[day] ?? { open: '09:00', close: '20:00' };
      return { ...prev, [day]: { ...current, closed: !current.closed } };
    });
  };

  const setHour = (day: string, key: 'open' | 'close', value: string) => {
    setHours((prev) => {
      const current = prev[day] ?? { open: '09:00', close: '20:00' };
      return { ...prev, [day]: { ...current, [key]: value } };
    });
  };

  const submit = async () => {
    setTouched({ name: true, address: true, lat: true, lng: true });

    if (!org) return;
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    const parsed = createLocationSchema.safeParse({
      name: name.trim(),
      address_text: address.trim(),
      lat: latNum,
      lng: lngNum,
      hours,
    });

    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? t('common.error'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from('locations').insert({
      org_id: org.id,
      name: parsed.data.name,
      address_text: parsed.data.address_text,
      location: parsed.data.location,
      hours: parsed.data.hours ?? {},
      cover_url: logoUrl.trim() || null,
      photo_urls: logoUrl.trim() ? [logoUrl.trim()] : [],
      status: 'active',
    });

    if (insertError) {
      setError(insertError.message);
      setIsSubmitting(false);
      return;
    }

    await refetch();
    setIsSubmitting(false);
    router.replace('/(merchant)/locations');
  };

  const canSubmit = name.trim() && address.trim() && lat && lng && org;

  const getDay = (day: string) => hours[day] ?? { open: '09:00', close: '20:00', closed: false };

  const styles = makeStyles(colors, spacing, fontSizes, fontWeights);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t('merchant.addLocation')}</Text>

        <View style={styles.field}>
          <Input
            label={t('merchant.locationName')}
            value={name}
            onChangeText={(v) => {
              setName(v);
              setError(null);
            }}
            placeholder={t('merchant.locationNamePlaceholder')}
            error={touched.name && !name.trim() ? t('merchant.required') : undefined}
            onBlur={() => setTouched((p) => ({ ...p, name: true }))}
          />
        </View>

        <View style={styles.field}>
          <Input
            label={t('merchant.address')}
            value={address}
            onChangeText={(v) => {
              setAddress(v);
              setError(null);
            }}
            placeholder={t('merchant.addressPlaceholder')}
            error={touched.address && !address.trim() ? t('merchant.required') : undefined}
            onBlur={() => setTouched((p) => ({ ...p, address: true }))}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('merchant.mapPin')}</Text>
          <View style={styles.row}>
            <View style={styles.half}>
              <Input
                value={lat}
                onChangeText={(v) => {
                  setLat(v);
                  setError(null);
                }}
                placeholder={t('merchant.latitude')}
                keyboardType="decimal-pad"
                error={touched.lat && !lat ? t('merchant.required') : undefined}
                onBlur={() => setTouched((p) => ({ ...p, lat: true }))}
              />
            </View>
            <View style={styles.half}>
              <Input
                value={lng}
                onChangeText={(v) => {
                  setLng(v);
                  setError(null);
                }}
                placeholder={t('merchant.longitude')}
                keyboardType="decimal-pad"
                error={touched.lng && !lng ? t('merchant.required') : undefined}
                onBlur={() => setTouched((p) => ({ ...p, lng: true }))}
              />
            </View>
          </View>
        </View>

        <View style={styles.field}>
          <Input
            label={t('merchant.logoUrl')}
            value={logoUrl}
            onChangeText={setLogoUrl}
            placeholder={t('merchant.logoUrlPlaceholder')}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('merchant.hours')}</Text>
          {DAYS.map((day) => (
            <View key={day} style={styles.dayRow}>
              <View style={styles.dayToggle}>
                <Switch
                  value={!getDay(day).closed}
                  onValueChange={() => toggleClosed(day)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.surfaceElevated}
                />
                <Text style={[styles.dayName, getDay(day).closed && styles.dayClosed]}>
                  {t(`merchant.days.${day}`)}
                </Text>
              </View>
              {!getDay(day).closed ? (
                <View style={styles.dayInputs}>
                  <Input
                    value={getDay(day).open}
                    onChangeText={(v) => setHour(day, 'open', v)}
                    style={styles.timeInput}
                    textAlign="center"
                  />
                  <Text style={styles.dash}>–</Text>
                  <Input
                    value={getDay(day).close}
                    onChangeText={(v) => setHour(day, 'close', v)}
                    style={styles.timeInput}
                    textAlign="center"
                  />
                </View>
              ) : (
                <Text style={styles.closedText}>{t('common.closed')}</Text>
              )}
            </View>
          ))}
        </View>

        {error && <ErrorState title={t('common.error')} description={error} style={styles.error} />}

        <Button
          onPress={() => void submit()}
          loading={isSubmitting}
          disabled={!canSubmit || isSubmitting}
          size="lg"
        >
          {t('common.save')}
        </Button>
      </ScrollView>
    </Screen>
  );
}

function makeStyles(
  colors: ReturnType<typeof import('../../../src/theme').useTheme>['colors'],
  spacing: ReturnType<typeof import('../../../src/theme').useTheme>['spacing'],
  fontSizes: ReturnType<typeof import('../../../src/theme').useTheme>['fontSizes'],
  fontWeights: ReturnType<typeof import('../../../src/theme').useTheme>['fontWeights'],
) {
  return StyleSheet.create({
    container: {
      padding: spacing[5],
      paddingTop: spacing[7],
      flexGrow: 1,
    },
    title: {
      fontSize: fontSizes['2xl'],
      fontWeight: fontWeights.bold,
      color: colors.text,
      marginBottom: spacing[5],
    },
    field: {
      marginBottom: spacing[4],
    },
    label: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.semibold,
      color: colors.text,
      marginBottom: spacing[2],
    },
    row: {
      flexDirection: 'row',
      gap: spacing[3],
      alignItems: 'flex-start',
    },
    half: {
      flex: 1,
    },
    dayRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing[3],
    },
    dayToggle: {
      width: 90,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
    },
    dayName: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.semibold,
      color: colors.text,
    },
    dayClosed: {
      color: colors.textMuted,
      textDecorationLine: 'line-through',
    },
    dayInputs: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
    },
    timeInput: {
      flex: 1,
      textAlign: 'center',
    },
    dash: {
      color: colors.textMuted,
    },
    closedText: {
      flex: 1,
      textAlign: 'center',
      color: colors.textMuted,
      fontStyle: 'italic',
    },
    error: {
      marginBottom: spacing[4],
    },
  });
}
