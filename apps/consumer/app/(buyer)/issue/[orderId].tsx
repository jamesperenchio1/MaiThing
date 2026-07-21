import { useState, useCallback } from 'react';
import { Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../src/lib/supabase';
import type { Tables } from '@maithing/shared';
import { issueReasonSchema } from '@maithing/shared';
import {
  Screen,
  Card,
  Button,
  Input,
  LoadingState,
  ErrorState,
  EmptyState,
  Icon,
} from '../../../src/components/ui';
import { useTheme } from '../../../src/theme';
import { icons } from '../../../src/icons';

type OrderWithLocation = Tables<'orders'> & {
  listing: { title: string } | null;
  location: { name: string } | null;
};

const ISSUE_REASONS = issueReasonSchema.options;

function useOrderForIssue(orderId: string) {
  return useQuery<OrderWithLocation>({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(
          'id, buyer_id, listing_id, location_id, status, listing:listings(title), location:locations(name)',
        )
        .eq('id', orderId)
        .single();
      if (error) throw error;
      return data as unknown as OrderWithLocation;
    },
  });
}

export default function IssueReportScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors, spacing, fontSizes, fontWeights } = theme;
  const qc = useQueryClient();
  const { data: order, isLoading, error, refetch } = useOrderForIssue(orderId);
  const [reason, setReason] = useState<string>(ISSUE_REASONS[0]);
  const [detail, setDetail] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!order) throw new Error('Order not found');
      if (reason === 'other' && !detail.trim()) {
        throw new Error(t('issue.detailRequired'));
      }
      const { error } = await supabase.from('issue_reports').insert({
        order_id: orderId,
        reason,
        detail: detail.trim() || null,
        photo_urls: photoUrl.trim() ? [photoUrl.trim()] : [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['order', orderId] });
      setSubmitted(true);
    },
    onError: (err: Error) => {
      Alert.alert(t('common.error'), err.message);
    },
  });

  const handleSubmit = useCallback(() => {
    if (reason === 'other' && !detail.trim()) {
      setDetailError(t('issue.detailRequired'));
      return;
    }
    setDetailError(null);
    submitMutation.mutate();
  }, [reason, detail, submitMutation, t]);

  const styles = makeStyles(colors, spacing, fontSizes, fontWeights);

  if (isLoading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (error || !order) {
    return (
      <Screen>
        <ErrorState
          title={t('common.error')}
          description={error?.message}
          onRetry={() => void refetch()}
          retryLabel={t('common.retry')}
        />
      </Screen>
    );
  }

  if (submitted) {
    return (
      <Screen>
        <EmptyState
          title={t('issue.submit')}
          icon={icons.success}
          action={{
            label: t('common.back'),
            onPress: () => router.back(),
          }}
        />
      </Screen>
    );
  }

  const isValid = reason !== 'other' || detail.trim().length > 0;

  return (
    <Screen style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity
          style={styles.backRow}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Icon name={icons.back} size={24} />
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{t('issue.title')}</Text>

        <Card>
          <Text style={styles.orderLabel}>{order?.listing?.title ?? '—'}</Text>
          <Text style={styles.orderSub}>{order?.location?.name ?? '—'}</Text>
        </Card>

        <Card>
          <Text style={styles.label}>{t('issue.reason')}</Text>
          {ISSUE_REASONS.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.reasonRow, reason === r && styles.reasonRowSelected]}
              onPress={() => setReason(r)}
              accessibilityRole="radio"
              accessibilityState={{ selected: reason === r }}
            >
              <Text style={[styles.reasonText, reason === r && styles.reasonTextSelected]}>
                {t(`issue.reasons.${r}`)}
              </Text>
              {reason === r && <Icon name={icons.check} size={16} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </Card>

        <Card>
          <Input
            label={t('issue.detail')}
            value={detail}
            onChangeText={(text) => {
              setDetail(text);
              if (detailError) setDetailError(null);
            }}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            accessibilityLabel={t('issue.detail')}
            error={detailError ?? undefined}
            style={styles.detailInput}
          />
        </Card>

        <Card>
          <Input
            label={t('issue.photo')}
            value={photoUrl}
            onChangeText={setPhotoUrl}
            placeholder="https://..."
            accessibilityLabel={t('issue.photo')}
          />
        </Card>

        <Button
          size="lg"
          onPress={handleSubmit}
          loading={submitMutation.isPending}
          disabled={!isValid || submitMutation.isPending}
        >
          {t('issue.submit')}
        </Button>
      </ScrollView>
    </Screen>
  );
}

function makeStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  fontSizes: ReturnType<typeof useTheme>['fontSizes'],
  fontWeights: ReturnType<typeof useTheme>['fontWeights'],
) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    scroll: {
      padding: spacing[4],
      paddingBottom: spacing[9],
    },
    backRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
      marginBottom: spacing[4],
    },
    backText: {
      fontSize: fontSizes.md,
      color: colors.text,
    },
    title: {
      fontSize: fontSizes['2xl'],
      fontWeight: fontWeights.bold,
      color: colors.text,
      marginBottom: spacing[4],
    },
    orderLabel: {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.semibold,
      color: colors.text,
    },
    orderSub: {
      fontSize: fontSizes.base,
      color: colors.textMuted,
      marginTop: spacing[1],
    },
    label: {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.semibold,
      color: colors.text,
      marginBottom: spacing[3],
    },
    reasonRow: {
      borderRadius: 12,
      padding: spacing[3],
      marginBottom: spacing[2],
      backgroundColor: colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    reasonRowSelected: {
      backgroundColor: colors.primaryMuted,
    },
    reasonText: {
      fontSize: fontSizes.base,
      color: colors.text,
    },
    reasonTextSelected: {
      color: colors.primaryHover,
      fontWeight: fontWeights.semibold,
    },
    detailInput: {
      minHeight: 100,
    },
  });
}
