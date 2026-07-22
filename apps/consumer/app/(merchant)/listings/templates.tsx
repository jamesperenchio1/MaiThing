import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useMerchantOrg } from '../../../src/hooks/useProfile';
import {
  useSlotTemplates,
  useCreateSlotTemplate,
  useDeleteSlotTemplate,
} from '../../../src/hooks/useSlotTemplates';
import type { SlotTemplate } from '../../../src/hooks/useSlotTemplates';

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const ALL_WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];

function timeToday(time: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return `${today}T${time}`;
}

export default function SlotTemplatesScreen() {
  const { t } = useTranslation();
  const { locations } = useMerchantOrg();
  const [locationId, setLocationId] = useState(locations[0]?.id ?? '');

  const { data: templates = [], isLoading } = useSlotTemplates(locationId);
  const createTemplate = useCreateSlotTemplate();
  const deleteTemplate = useDeleteSlotTemplate();

  const [label, setLabel] = useState('');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('20:00');
  const [weekdays, setWeekdays] = useState<number[]>(ALL_WEEKDAYS);
  const [showForm, setShowForm] = useState(false);

  const toggleWeekday = (day: number) => {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    );
  };

  const handleCreate = () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    if (!locationId) {
      Alert.alert(t('common.error'), t('merchant.selectLocation'));
      return;
    }
    createTemplate.mutate(
      {
        location_id: locationId,
        label: trimmed,
        start_time: startTime,
        end_time: endTime,
        weekdays,
      },
      {
        onSuccess: () => {
          setLabel('');
          setStartTime('18:00');
          setEndTime('20:00');
          setWeekdays(ALL_WEEKDAYS);
          setShowForm(false);
        },
        onError: (err: Error) => Alert.alert(t('common.error'), err.message),
      },
    );
  };

  const handleDelete = (template: SlotTemplate) => {
    Alert.alert(t('merchant.slotTemplateDelete'), template.label, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('merchant.slotTemplateDelete'),
        style: 'destructive',
        onPress: () =>
          deleteTemplate.mutate(
            { id: template.id, locationId: template.location_id },
            { onError: (err: Error) => Alert.alert(t('common.error'), err.message) },
          ),
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.back}>{'←'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('merchant.slotTemplates')}</Text>
      </View>

      {/* Location picker */}
      {locations.length > 1 && (
        <View style={styles.chipRow}>
          {locations.map((loc) => (
            <TouchableOpacity
              key={loc.id}
              style={[styles.chip, locationId === loc.id && styles.chipSelected]}
              onPress={() => setLocationId(loc.id)}
            >
              <Text style={[styles.chipText, locationId === loc.id && styles.chipTextSelected]}>
                {loc.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator color="#16a34a" style={styles.loader} />
      ) : templates.length === 0 ? (
        <Text style={styles.empty}>{t('merchant.noSlotTemplates')}</Text>
      ) : (
        templates.map((tmpl) => (
          <View key={tmpl.id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.cardLabel}>{tmpl.label}</Text>
              <TouchableOpacity
                onPress={() => handleDelete(tmpl)}
                disabled={deleteTemplate.isPending}
                accessibilityRole="button"
              >
                <Text style={styles.deleteText}>{t('merchant.slotTemplateDelete')}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.cardTime}>
              {timeToday(tmpl.start_time).slice(11, 16)} – {timeToday(tmpl.end_time).slice(11, 16)}
            </Text>
            <View style={styles.weekRow}>
              {WEEKDAY_LABELS.map((label, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dayBubble,
                    tmpl.weekdays.includes(idx + 1) && styles.dayBubbleActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      tmpl.weekdays.includes(idx + 1) && styles.dayTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))
      )}

      {showForm ? (
        <View style={styles.form}>
          <Text style={styles.formTitle}>{t('merchant.addSlotTemplate')}</Text>
          <Text style={styles.fieldLabel}>{t('merchant.slotTemplateLabel')}</Text>
          <TextInput
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            placeholder={t('merchant.slotTemplateLabelPlaceholder')}
          />
          <View style={styles.timeRow}>
            <View style={styles.half}>
              <Text style={styles.fieldLabel}>{t('merchant.slotTemplateStart')}</Text>
              <TextInput style={styles.input} value={startTime} onChangeText={setStartTime} />
            </View>
            <View style={styles.half}>
              <Text style={styles.fieldLabel}>{t('merchant.slotTemplateEnd')}</Text>
              <TextInput style={styles.input} value={endTime} onChangeText={setEndTime} />
            </View>
          </View>
          <Text style={styles.fieldLabel}>{t('merchant.slotTemplateWeekdays')}</Text>
          <View style={styles.weekRow}>
            {WEEKDAY_LABELS.map((lbl, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.dayBubble, weekdays.includes(idx + 1) && styles.dayBubbleActive]}
                onPress={() => toggleWeekday(idx + 1)}
                accessibilityRole="checkbox"
              >
                <Text style={[styles.dayText, weekdays.includes(idx + 1) && styles.dayTextActive]}>
                  {lbl}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.formActions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowForm(false)}
              accessibilityRole="button"
            >
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveBtn,
                (!label.trim() || createTemplate.isPending) && styles.saveBtnDisabled,
              ]}
              onPress={handleCreate}
              disabled={!label.trim() || createTemplate.isPending}
              accessibilityRole="button"
            >
              {createTemplate.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveText}>{t('common.save')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowForm(true)}
          accessibilityRole="button"
        >
          <Text style={styles.addBtnText}>+ {t('merchant.addSlotTemplate')}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, paddingBottom: 48, backgroundColor: '#f9fafb' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  back: { fontSize: 22, color: '#374151' },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  loader: { marginTop: 40 },
  empty: { color: '#9ca3af', fontSize: 15, textAlign: 'center', marginTop: 32 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chipSelected: { backgroundColor: '#dcfce7', borderColor: '#16a34a' },
  chipText: { fontSize: 13, color: '#374151' },
  chipTextSelected: { color: '#15803d', fontWeight: '600' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
  deleteText: { fontSize: 13, color: '#dc2626', fontWeight: '600' },
  cardTime: { fontSize: 14, color: '#6b7280', marginBottom: 10 },
  weekRow: { flexDirection: 'row', gap: 6 },
  dayBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBubbleActive: { backgroundColor: '#16a34a' },
  dayText: { fontSize: 12, fontWeight: '600', color: '#9ca3af' },
  dayTextActive: { color: '#fff' },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    marginBottom: 12,
  },
  timeRow: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  formActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: { color: '#6b7280', fontWeight: '600' },
  saveBtn: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnDisabled: { backgroundColor: '#d1d5db' },
  saveText: { color: '#fff', fontWeight: '700' },
  addBtn: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    paddingVertical: 14,
    alignItems: 'center',
  },
  addBtnText: { color: '#6b7280', fontSize: 15, fontWeight: '600' },
});
