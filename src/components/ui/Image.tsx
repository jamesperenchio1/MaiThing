import { Image as ExpoImage } from 'expo-image';
import { View, ViewStyle, StyleProp } from 'react-native';

const DEFAULT_BLURHASH = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';

interface ImageProps {
  source: { uri?: string } | number;
  className?: string;
  style?: StyleProp<ViewStyle>;
  resizeMode?: 'cover' | 'contain';
  priority?: boolean;
  transition?: number;
  placeholderBlurhash?: string;
}

export function Image({
  source,
  className,
  style,
  resizeMode = 'cover',
  priority,
  transition = 500,
  placeholderBlurhash,
}: ImageProps) {
  const uri = typeof source === 'number' ? source : source.uri;

  return (
    <View className={className} style={style}>
      <ExpoImage
        source={uri}
        style={{ width: '100%', height: '100%' }}
        contentFit={resizeMode}
        placeholder={{ blurhash: placeholderBlurhash ?? DEFAULT_BLURHASH }}
        transition={transition}
        priority={priority ? 'high' : 'normal'}
      />
    </View>
  );
}
