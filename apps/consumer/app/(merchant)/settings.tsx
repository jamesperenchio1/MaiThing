import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth';
import { supabase } from '../../src/lib/supabase';
import { useTheme } from '../../src/theme';
import { Screen, Card, Button, Icon } from '../../src/components/ui';

export default function MerchantSettingsScreen() {
  const { t } = useTranslation();
  const { colors, spacing, fontSizes, fontWeights } = useTheme();
  const setSession = useAuthStore((s) => s.setSession);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    router.replace('/(auth)/sign-in');
  };

  const styles = makeStyles(colors, spacing, fontSizes, fontWeights);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t('merchant.settings')}</Text>

        <Card style={styles.rowCard}>
          <Pressable
            onPress={() => router.push('/(merchant)/analytics')}
            style={styles.row}
            accessibilityRole="button"
          >
            <Icon name="bar-chart-outline" size={22} color={colors.text} />
            <Text style={styles.rowText}>{t('merchant.analytics')}</Text>
            <Icon name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
        </Card>

        <Card style={styles.rowCard}>
          <Pressable
            onPress={() => router.push('/(merchant)/collect')}
            style={styles.row}
            accessibilityRole="button"
          >
            <Icon name="qr-code-outline" size={22} color={colors.text} />
            <Text style={styles.rowText}>{t('merchant.confirmPickup')}</Text>
            <Icon name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
        </Card>

        <View style={styles.signOutSection}>
          <Button variant="danger" onPress={() => void signOut()} size="lg">
            {t('auth.signOut')}
          </Button>
        </View>
      </ScrollView>
    </Screen>
  );
}

function makeStyles(
  colors: ReturnType<typeof import('../../src/theme').useTheme>['colors'],
  spacing: ReturnType<typeof import('../../src/theme').useTheme>['spacing'],
  fontSizes: ReturnType<typeof import('../../src/theme').useTheme>['fontSizes'],
  fontWeights: ReturnType<typeof import('../../src/theme').useTheme>['fontWeights'],
) {
  return StyleSheet.create({
    container: {
      padding: spacing[5],
      paddingTop: spacing[7],
      flexGrow: 1,
    },
    title: {
      fontSize: fontSizes['2xl'],
      fontWeight: fontWeights.bold,
      color: colors.text,
      marginBottom: spacing[5],
    },
    rowCard: {
      marginBottom: spacing[3],
      padding: 0,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
    },
    rowText: {
      flex: 1,
      fontSize: fontSizes.base,
      color: colors.text,
    },
    signOutSection: {
      marginTop: spacing[5],
    },
  });
}
