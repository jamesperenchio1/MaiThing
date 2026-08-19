import { useTranslation } from 'react-i18next';

import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { BottomSheet } from '@/src/components/ui/BottomSheet';

export function ReopenConfirmSheet({
  isOpen,
  onClose,
  closedUntilFormatted,
  onReopen,
  isPending,
}: {
  isOpen: boolean;
  onClose: () => void;
  closedUntilFormatted: string;
  onReopen: () => void;
  isPending: boolean;
}) {
  const { t } = useTranslation();

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} snapPoints={['35%']}>
      <Text variant="h3" className="mb-2 text-center">
        {t('merchant.dashboard.reopenTitle')}
      </Text>
      <Text variant="body-sm" className="mb-2 text-center text-muted">
        {t('merchant.dashboard.reopenCurrentlyClosed', { date: closedUntilFormatted })}
      </Text>
      <Text variant="body-sm" className="mb-6 text-center text-muted">
        {t('merchant.dashboard.reopenDesc')}
      </Text>
      <Button variant="primary" onPress={onReopen} disabled={isPending} className="mb-2">
        {t('merchant.dashboard.reopenNow')}
      </Button>
      <Button variant="ghost" onPress={onClose}>
        {t('merchant.dashboard.keepClosed')}
      </Button>
    </BottomSheet>
  );
}
