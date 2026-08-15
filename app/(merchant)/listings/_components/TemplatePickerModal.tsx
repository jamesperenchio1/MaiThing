import { View, ScrollView, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react-native';
import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { formatCurrency } from '@/src/lib/utils';
import type { ListingTemplate } from '@/src/types';

export function TemplatePickerModal({
  visible,
  onClose,
  templates,
  onSelectTemplate,
}: {
  visible: boolean;
  onClose: () => void;
  templates: ListingTemplate[] | undefined;
  onSelectTemplate: (template: ListingTemplate) => void;
}) {
  const { t } = useTranslation();
  const colors = useThemeColor();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="max-h-[70%] rounded-t-3xl bg-card px-4 pb-8 pt-4">
          <View className="mb-4 flex-row items-center justify-between">
            <Button variant="ghost" onPress={onClose}>
              {t('common.cancel')}
            </Button>
            <Text variant="h3">{t('merchant.inventory.templates')}</Text>
            <View className="w-12" />
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {templates && templates.length > 0 ? (
              templates.map((template) => (
                <PressableScale
                  key={template.id}
                  onPress={() => onSelectTemplate(template)}
                  scale={0.98}
                >
                  <Card
                    variant="outlined"
                    className="mb-3 flex-row items-center justify-between p-3"
                  >
                    <View className="flex-1">
                      <Text variant="body-sm" className="font-semibold" numberOfLines={1}>
                        {template.name || template.title}
                      </Text>
                      <Text variant="caption" className="text-muted">
                        {formatCurrency(template.salePrice)} · {template.category}
                      </Text>
                    </View>
                    <Badge variant="info">{t('merchant.inventory.useTemplate')}</Badge>
                  </Card>
                </PressableScale>
              ))
            ) : (
              <EmptyState
                icon={<FileText size={32} color={colors.muted} />}
                title={t('merchant.inventory.noListings')}
              />
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
