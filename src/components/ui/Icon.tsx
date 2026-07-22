import { LucideIcon } from 'lucide-react-native';
import { cn } from '@/src/lib/utils';
import { useThemeColor } from '@/src/hooks/useThemeColor';

interface IconProps {
  icon: LucideIcon;
  size?: number;
  className?: string;
  color?: string;
}

export function Icon({ icon: LucideIcon, size = 24, className, color }: IconProps) {
  const colors = useThemeColor();
  return <LucideIcon size={size} color={color ?? colors.foreground} className={cn('text-foreground', className)} />;
}
