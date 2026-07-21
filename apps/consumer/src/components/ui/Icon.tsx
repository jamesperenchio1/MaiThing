import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

export type IconName = Exclude<IoniconsName, undefined>;

type IconProps = {
  name?: IconName | undefined;
  size?: number;
  color?: string;
  style?: React.ComponentProps<typeof Ionicons>['style'];
};

export function Icon({ name = 'help-circle-outline', size = 24, color, style }: IconProps) {
  const { colors } = useTheme();
  return <Ionicons name={name} size={size} color={color ?? colors.textMuted} style={style} />;
}
