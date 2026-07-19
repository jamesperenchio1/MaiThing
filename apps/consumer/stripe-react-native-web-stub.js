// Web stub for @stripe/stripe-react-native. The native SDK is not available on
// web, so checkout on web falls back to the "Stripe not configured" message or a
// manual test-mode flow. This file is aliased only for metro web builds.

export const initPaymentSheet = async () => ({ error: undefined });
export const presentPaymentSheet = async () => ({ error: undefined });
export const StripeProvider = ({ children }) => children;
export const useStripe = () => ({
  initPaymentSheet,
  presentPaymentSheet,
});
