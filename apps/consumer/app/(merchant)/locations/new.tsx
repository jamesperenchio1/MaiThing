import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { supabase } from '../../../src/lib/supabase';
import { useMerchantOrg } from '../../../src/hooks/useProfile';
import { createLocationSchema } from '@maithing/shared';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

export default function NewLocationScreen() {
  const { t } = useTranslation();
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t('merchant.addLocation')}</Text>

      <View style={styles.field}>
        <Text style={styles.label}>{t('merchant.locationName')}</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder={t('merchant.locationNamePlaceholder')}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('merchant.address')}</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder={t('merchant.addressPlaceholder')}
        />
      </View>

      <Text style={styles.label}>{t('merchant.mapPin')}</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.half]}
          value={lat}
          onChangeText={setLat}
          placeholder={t('merchant.latitude')}
          keyboardType="decimal-pad"
        />
        <TextInput
          style={[styles.input, styles.half]}
          value={lng}
          onChangeText={setLng}
          placeholder={t('merchant.longitude')}
          keyboardType="decimal-pad"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('merchant.logoUrl')}</Text>
        <TextInput
          style={styles.input}
          value={logoUrl}
          onChangeText={setLogoUrl}
          placeholder={t('merchant.logoUrlPlaceholder')}
          autoCapitalize="none"
          keyboardType="url"
        />
      </View>

      <Text style={styles.label}>{t('merchant.hours')}</Text>
      {DAYS.map((day) => (
        <View key={day} style={styles.dayRow}>
          <TouchableOpacity style={styles.dayToggle} onPress={() => toggleClosed(day)}>
            <Text style={[styles.dayName, getDay(day).closed && styles.dayClosed]}>
              {t(`merchant.days.${day}`)}
            </Text>
          </TouchableOpacity>
          {!getDay(day).closed ? (
            <View style={styles.dayInputs}>
              <TextInput
                style={[styles.input, styles.timeInput]}
                value={getDay(day).open}
                onChangeText={(v) => setHour(day, 'open', v)}
              />
              <Text style={styles.dash}>–</Text>
              <TextInput
                style={[styles.input, styles.timeInput]}
                value={getDay(day).close}
                onChangeText={(v) => setHour(day, 'close', v)}
              />
            </View>
          ) : (
            <Text style={styles.closedText}>{t('common.closed')}</Text>
          )}
        </View>
      ))}

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.btn, (!canSubmit || isSubmitting) && styles.btnDisabled]}
        onPress={() => void submit()}
        disabled={!canSubmit || isSubmitting}
        accessibilityRole="button"
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>{t('common.save')}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, backgroundColor: '#f9fafb', flexGrow: 1 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 20 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  half: { flex: 1 },
  dayRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  dayToggle: { width: 70 },
  dayName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  dayClosed: { color: '#9ca3af', textDecorationLine: 'line-through' },
  dayInputs: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeInput: { flex: 1, paddingVertical: 8, textAlign: 'center' },
  dash: { color: '#6b7280' },
  closedText: { flex: 1, textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' },
  error: { color: '#dc2626', marginBottom: 16 },
  btn: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: { backgroundColor: '#9ca3af' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
