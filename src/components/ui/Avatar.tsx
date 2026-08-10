import { View } from 'react-native';
import { Image } from '@/src/components/ui/Image';
import { cn, getInitials } from '@/src/lib/utils';
import { Text } from './Text';

interface AvatarProps {
  uri?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-24 h-24 text-2xl',
};

export function Avatar({ uri, name, size = 'md', className }: AvatarProps) {
  const initials = getInitials(name);

  return (
    <View
      className={cn(
        'items-center justify-center overflow-hidden rounded-full bg-primary/10',
        sizeMap[size],
        className
      )}
    >
      {uri ? (
        <Image source={{ uri }} className="h-full w-full" resizeMode="cover" />
      ) : (
        <Text className="font-semibold text-primary">{initials}</Text>
      )}
    </View>
  );
}
