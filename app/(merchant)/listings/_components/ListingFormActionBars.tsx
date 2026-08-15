import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, FileText } from 'lucide-react-native';
import { Button } from '@/src/components/ui/Button';
import { useThemeColor } from '@/src/hooks/useThemeColor';

export function TemplateActionsBar({
  onSaveAsTemplate,
  isSavingTemplate,
  onShowTemplatePicker,
}: {
  onSaveAsTemplate: () => void;
  isSavingTemplate: boolean;
  onShowTemplatePicker: () => void;
}) {
  const { t } = useTranslation();
  const colors = useThemeColor();

  return (
    <View className="mb-4 flex-row space-x-3">
      <Button
        testID="save-template-button"
        variant="secondary"
        className="flex-1"
        onPress={onSaveAsTemplate}
        loading={isSavingTemplate}
        leftIcon={<FileText size={18} color={colors.foreground} />}
      >
        {t('merchant.inventory.saveAsTemplate')}
      </Button>
      <Button
        testID="load-template-button"
        variant="outline"
        className="flex-1"
        onPress={onShowTemplatePicker}
        leftIcon={<ChevronDown size={18} color={colors.foreground} />}
      >
        {t('merchant.inventory.useTemplate')}
      </Button>
    </View>
  );
}

export function SubmitActionsBar({
  onSaveDraft,
  onPublish,
  isPending,
  isEditMode,
}: {
  onSaveDraft: () => void;
  onPublish: () => void;
  isPending: boolean;
  isEditMode: boolean;
}) {
  const { t } = useTranslation();
  const colors = useThemeColor();

  return (
    <View className="flex-row space-x-3">
      <Button
        testID="save-draft-button"
        variant="outline"
        className="flex-1"
        onPress={onSaveDraft}
        disabled={isPending}
      >
        {t('merchant.createListing.saveDraft')}
      </Button>
      <Button
        testID="publish-button"
        className="flex-1"
        loading={isPending}
        onPress={onPublish}
        leftIcon={<Check size={18} color={colors.white} />}
      >
        {isEditMode ? t('common.save') : t('merchant.createListing.publish')}
      </Button>
    </View>
  );
}
