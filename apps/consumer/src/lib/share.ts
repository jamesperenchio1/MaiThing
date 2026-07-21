import { Alert } from 'react-native';

type ExpoSharing = {
  isAvailableAsync?: () => Promise<boolean>;
  shareAsync?: (url: string, options?: { dialogTitle?: string }) => Promise<void>;
};

/**
 * Share a referral message.
 * Falls back through: expo-sharing → Web Share API → Alert dialog.
 */
export async function shareReferralCode(
  code: string,
  message: string,
  dialogTitle: string,
): Promise<void> {
  try {
    const mod = (await import('expo-sharing')) as unknown as ExpoSharing;
    if (mod.isAvailableAsync && (await mod.isAvailableAsync()) && mod.shareAsync) {
      await mod.shareAsync(`maithing://referral?code=${encodeURIComponent(code)}`, {
        dialogTitle,
      });
      return;
    }
  } catch {
    // expo-sharing not installed or share failed — fall through.
  }

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    await navigator.share({ text: message });
    return;
  }

  Alert.alert(dialogTitle, message);
}
