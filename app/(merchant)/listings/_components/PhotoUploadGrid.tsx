import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Camera, Plus, X, Image as ImageIcon } from 'lucide-react-native';
import { Image } from '@/src/components/ui/Image';
import { Text } from '@/src/components/ui/Text';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useThemeColor } from '@/src/hooks/useThemeColor';

export function PhotoUploadGrid({
  images,
  onTakePhoto,
  onPickLibrary,
  onRemoveImage,
}: {
  images: string[];
  onTakePhoto: () => void;
  onPickLibrary: () => void;
  onRemoveImage: (index: number) => void;
}) {
  const { t } = useTranslation();
  const colors = useThemeColor();

  return (
    <View className="mb-6">
      <View className="mb-3 flex-row items-center justify-between">
        <Text variant="h3">{t('merchant.createListing.photos')}</Text>
        <View className="flex-row items-center">
          <PressableScale onPress={onTakePhoto} scale={0.95} className="mr-3">
            <View className="flex-row items-center">
              <Camera size={16} color={colors.primary} />
              <Text variant="caption" className="ml-1 text-primary">
                {t('merchant.createListing.takePhoto')}
              </Text>
            </View>
          </PressableScale>
          <PressableScale onPress={onPickLibrary} scale={0.95}>
            <View className="flex-row items-center">
              <ImageIcon size={16} color={colors.primary} />
              <Text variant="caption" className="ml-1 text-primary">
                {t('merchant.createListing.chooseFromLibrary')}
              </Text>
            </View>
          </PressableScale>
        </View>
      </View>
      <View className="flex-row flex-wrap">
        {images.map((uri, index) => (
          <View key={`${uri}-${index}`} className="relative mr-2 mb-2">
            <Image source={{ uri }} className="h-24 w-24 rounded-2xl" resizeMode="cover" />
            <PressableScale
              onPress={() => onRemoveImage(index)}
              className="absolute -right-1 -top-1 rounded-full bg-danger p-1"
              scale={0.9}
            >
              <X size={12} color={colors.white} />
            </PressableScale>
          </View>
        ))}
        <PressableScale
          onPress={onPickLibrary}
          className="h-24 w-24 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/10"
          scale={0.95}
        >
          <Plus size={24} color={colors.muted} />
        </PressableScale>
      </View>
    </View>
  );
}
