import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme';
import { Icon } from '../ui';
import { getIcon } from '../../icons';

interface Props {
  viewMode: 'map' | 'list';
  onToggleView: (mode: 'map' | 'list') => void;
  isLoading: boolean;
  hasUnread?: boolean;
}

export default function DiscoverHeader({
  viewMode,
  onToggleView,
  isLoading,
  hasUnread = false,
}: Props) {
  const { t } = useTranslation();
  const { colors, spacing, radii, fontSizes, fontWeights } = useTheme();
  const styles = makeStyles(colors, spacing, radii, fontSizes, fontWeights);

  return (
    <View style={styles.header}>
      <Text style={styles.title}>{t('discover.title')}</Text>
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'map' && styles.toggleActive]}
          onPress={() => onToggleView('map')}
          accessibilityRole="button"
          accessibilityLabel={t('discover.mapView')}
          accessibilityState={{ selected: viewMode === 'map' }}
        >
          <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>
            {t('discover.mapView')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'list' && styles.toggleActive]}
          onPress={() => onToggleView('list')}
          accessibilityRole="button"
          accessibilityLabel={t('discover.listView')}
          accessibilityState={{ selected: viewMode === 'list' }}
        >
          <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>
            {t('discover.listView')}
          </Text>
        </TouchableOpacity>
      </View>
      {isLoading && (
        <ActivityIndicator size="small" color={colors.primary} style={styles.spinner} />
      )}
      <TouchableOpacity
        style={styles.bellBtn}
        onPress={() => router.push('/(buyer)/chat')}
        accessibilityRole="button"
        accessibilityLabel={t('chat.title')}
      >
        <Icon name={getIcon('bell')} size={20} color={colors.text} />
        {hasUnread && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  spacing: ReturnType<typeof useTheme>['spacing'],
  radii: ReturnType<typeof useTheme>['radii'],
  fontSizes: ReturnType<typeof useTheme>['fontSizes'],
  fontWeights: ReturnType<typeof useTheme>['fontWeights'],
) {
  return StyleSheet.create({
    header: {
      backgroundColor: colors.surfaceElevated,
      paddingTop: Platform.OS === 'ios' ? 56 : spacing[4],
      paddingHorizontal: spacing[4],
      paddingBottom: spacing[3],
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 1,
      shadowRadius: 2,
      elevation: 2,
    },
    title: {
      flex: 1,
      fontSize: fontSizes.lg,
      fontWeight: fontWeights.bold,
      color: colors.text,
    },
    toggle: {
      flexDirection: 'row',
      backgroundColor: colors.borderSubtle,
      borderRadius: radii.md,
      padding: 2,
    },
    toggleBtn: {
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[1],
      borderRadius: radii.sm,
      minHeight: 32,
      justifyContent: 'center',
    },
    toggleActive: {
      backgroundColor: colors.surfaceElevated,
      shadowColor: colors.shadow,
      shadowOpacity: 1,
      shadowRadius: 2,
      elevation: 1,
    },
    toggleText: {
      fontSize: fontSizes.sm,
      color: colors.textMuted,
      fontWeight: fontWeights.medium,
    },
    toggleTextActive: {
      color: colors.text,
      fontWeight: fontWeights.semibold,
    },
    spinner: { marginLeft: spacing[2] },
    bellBtn: { marginLeft: spacing[2], padding: spacing[1], position: 'relative' },
    unreadDot: {
      position: 'absolute',
      top: spacing[0],
      right: spacing[0],
      width: spacing[2],
      height: spacing[2],
      borderRadius: spacing[1],
      backgroundColor: colors.danger,
    },
  });
}
