import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { AlertTriangle, FileText, Trash2 } from 'lucide-react-native';
import { FlashList } from '@shopify/flash-list';

import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { Card } from '@/src/components/ui/Card';
import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatCurrency } from '@/src/lib/utils';
import type { ListingTemplate } from '@/src/types';

export function TemplateSheet({
  isOpen,
  onClose,
  isLoadingTemplates,
  templates,
  onUseTemplate,
  onDeleteTemplate,
}: {
  isOpen: boolean;
  onClose: () => void;
  isLoadingTemplates: boolean;
  templates: ListingTemplate[] | undefined;
  onUseTemplate: (templateId: string) => void;
  onDeleteTemplate: (templateId: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const colors = useThemeColor();

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} enableScroll={true}>
      <View className="mb-4 flex-row items-center justify-between">
        <Button variant="ghost" onPress={onClose}>
          {t('common.cancel')}
        </Button>
        <Text variant="h3">{t('merchant.inventory.templates')}</Text>
        <View className="w-12" />
      </View>
      {isLoadingTemplates ? (
        <Skeleton width="100%" height={80} className="mb-3 rounded-2xl" />
      ) : templates && templates.length > 0 ? (
        <View className="flex-1">
          <FlashList
            data={templates}
            keyExtractor={(item) => item.id}
            estimatedItemSize={80}
            renderItem={({ item }) => {
              const now = Date.now();
              const expiresAt = item.expiresAt ? new Date(item.expiresAt) : null;
              const isExpired = expiresAt ? expiresAt.getTime() < now : false;
              const msUntilExpiry = expiresAt ? expiresAt.getTime() - now : null;
              const isExpiringSoon =
                !isExpired && msUntilExpiry !== null && msUntilExpiry < 7 * 86400000;

              return (
                <Card
                  variant="outlined"
                  className="mb-3 flex-row items-center justify-between p-3"
                  style={isExpired ? { opacity: 0.55 } : undefined}
                >
                  <View className="flex-1 mr-2">
                    <View className="flex-row items-center">
                      <Text variant="body-sm" className="font-semibold flex-1" numberOfLines={1}>
                        {item.name || item.title}
                      </Text>
                      {item.isFlagged && (
                        <AlertTriangle size={14} color={colors.warning} style={{ marginLeft: 4 }} />
                      )}
                    </View>
                    <Text variant="caption" className="text-muted">
                      {formatCurrency(item.salePrice)} · {item.category}
                    </Text>
                    {expiresAt && (
                      <Text
                        variant="caption"
                        style={{
                          color: isExpired
                            ? colors.danger
                            : isExpiringSoon
                              ? colors.warning
                              : colors.muted,
                        }}
                      >
                        {isExpired
                          ? t('merchant.inventory.expired')
                          : t('merchant.inventory.expiresOn', {
                              date: expiresAt.toLocaleDateString(i18n.language),
                            })}
                      </Text>
                    )}
                  </View>
                  <View className="flex-row items-center">
                    {isExpired ? (
                      <Badge variant="danger" className="mr-2">
                        {t('merchant.inventory.expired')}
                      </Badge>
                    ) : (
                      <Button size="sm" onPress={() => onUseTemplate(item.id)} className="mr-2">
                        {t('merchant.inventory.useTemplate')}
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onPress={() => onDeleteTemplate(item.id)}>
                      <Trash2 size={16} color={colors.danger} />
                    </Button>
                  </View>
                </Card>
              );
            }}
            ListEmptyComponent={
              <EmptyState
                icon={<FileText size={32} color={colors.muted} />}
                title={t('merchant.inventory.noListings')}
              />
            }
          />
        </View>
      ) : (
        <EmptyState
          icon={<FileText size={32} color={colors.muted} />}
          title={t('merchant.inventory.noListings')}
          description={t('merchant.createListing.title')}
        />
      )}
    </BottomSheet>
  );
}
