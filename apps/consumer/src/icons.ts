import type { IconName } from './components/ui/Icon';

export const icons: Record<string, IconName> = {
  // Brand / navigation
  logo: 'leaf-outline',
  discover: 'map-outline',
  discoverFilled: 'map',
  orders: 'bag-outline',
  ordersFilled: 'bag',
  profile: 'person-outline',
  profileFilled: 'person',
  settings: 'settings-outline',
  settingsFilled: 'settings',
  dashboard: 'home-outline',
  dashboardFilled: 'home',
  today: 'calendar-outline',
  todayFilled: 'calendar',
  listings: 'restaurant-outline',
  listingsFilled: 'restaurant',
  locations: 'location-outline',
  locationsFilled: 'location',
  analytics: 'bar-chart-outline',
  analyticsFilled: 'bar-chart',

  // Actions
  search: 'search',
  filter: 'options-outline',
  close: 'close',
  back: 'chevron-back',
  next: 'chevron-forward',
  add: 'add',
  remove: 'remove',
  check: 'checkmark',
  edit: 'create-outline',
  delete: 'trash-outline',
  share: 'share-outline',
  more: 'ellipsis-horizontal',
  menu: 'menu',
  arrowForward: 'chevron-forward',
  arrowDown: 'chevron-down',
  arrowUp: 'chevron-up',

  // Status / feedback
  heart: 'heart-outline',
  heartFilled: 'heart',
  star: 'star',
  starOutline: 'star-outline',
  starHalf: 'star-half',
  bell: 'notifications-outline',
  bellFilled: 'notifications',
  bellOff: 'notifications-off-outline',
  info: 'information-circle-outline',
  warning: 'warning-outline',
  error: 'alert-circle-outline',
  success: 'checkmark-circle',
  email: 'mail-outline',
  lock: 'lock-closed-outline',
  eye: 'eye-outline',
  eyeOff: 'eye-off-outline',

  // Location / map
  mapPin: 'location-outline',
  directions: 'navigate-outline',
  myLocation: 'locate',

  // Food / merchant
  bag: 'basket-outline',
  pickup: 'time-outline',
  clock: 'time-outline',
  category: 'pricetag-outline',
  camera: 'camera-outline',
  image: 'image-outline',

  // Payment
  card: 'card-outline',
  qrCode: 'qr-code-outline',
  receipt: 'receipt-outline',

  // Chat
  chat: 'chatbubble-outline',
  chatFilled: 'chatbubble',
  send: 'send',

  // Onboarding
  welcome: 'leaf',
  discoverFood: 'search',
  reserve: 'basket',
  collect: 'walk',
  impact: 'earth',
  diet: 'leaf-outline',
  referral: 'gift-outline',
  location: 'location',
  moon: 'moon',
  sun: 'sunny',
};

export function getIcon(name: keyof typeof icons): IconName {
  return icons[name] ?? 'help-circle-outline';
}
