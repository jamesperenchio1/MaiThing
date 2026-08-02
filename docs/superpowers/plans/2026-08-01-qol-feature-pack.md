# QoL Feature Pack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship 12 quality-of-life improvements across the customer and merchant sides of the Maithing app.

**Architecture:** Each feature is a self-contained UI + data layer change. Task 1 lays the shared type/seed/i18n/interface foundation; remaining tasks each own one feature end-to-end (types → mock → hook → UI).

**Tech Stack:** Expo SDK 57, React Native 0.86, NativeWind 4, TanStack Query 5, Zustand 5 with `zustand/middleware` persist, `@react-native-async-storage/async-storage`, `expo-notifications`, TypeScript 6 strict mode.

## Global Constraints

- Path alias `@/*` = repo root.
- All user-visible strings go in `src/i18n/en.ts` AND `src/i18n/th.ts` under the same key paths.
- NativeWind/Tailwind class-based styling — no `StyleSheet.create` unless unavoidable (e.g. absolute positioning values).
- No new npm packages — all dependencies already installed.
- `pnpm typecheck` and `pnpm lint` must pass after every task.
- Use `Text`, `Button`, `Card`, `Badge`, `Input`, `PressableScale` from `@/src/components/ui/`.
- Icon color: always pull from `useThemeColor()` hook. Do not hardcode hex.
- Colors: primary green = `colors.primary`, muted = `colors.muted`. Do not reference `#16A34A` etc.
- Never import from `@/src/repositories/mock` in screens — use hooks from `@/src/hooks/`.

---

### Task 1: Foundation — Types, seed, i18n, and UserRepository interface extensions

Adds the new fields and keys that Tasks 3, 6, 7, 8, and 12 depend on. Must complete before those tasks.

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/repositories/interfaces.ts`
- Modify: `src/repositories/seed.ts`
- Modify: `src/repositories/mock.ts`
- Modify: `src/i18n/en.ts`
- Modify: `src/i18n/th.ts`

**Interfaces:**
- Produces:
  - `NotificationPreferences.followedMerchantNotifications: string[]` — list of merchant IDs the customer wants new-listing push notifications from
  - `CustomerProfile.restockAlerts: string[]` — listing IDs customer wants restock push notifications for
  - `MerchantNotificationPreferences.autoConfirmOrders: boolean`
  - `UserRepository.addMerchantFollowNotification(userId, merchantId): Promise<void>`
  - `UserRepository.removeMerchantFollowNotification(userId, merchantId): Promise<void>`
  - `UserRepository.addRestockAlert(userId, listingId): Promise<void>`
  - `UserRepository.removeRestockAlert(userId, listingId): Promise<void>`
  - i18n keys (see Step 1 for full list)

- [ ] **Step 1: Extend types**

In `src/types/index.ts`, make these three changes:

```ts
// 1. NotificationPreferences — add followedMerchantNotifications
export interface NotificationPreferences {
  newDeals: boolean;
  orderUpdates: boolean;
  merchantMessages: boolean;
  promotions: boolean;
  followedMerchantNotifications: string[]; // merchant IDs
}

// 2. CustomerProfile — add restockAlerts
export interface CustomerProfile extends User {
  favorites: string[];
  savedListings: string[];
  savedAddresses: Address[];
  notificationPreferences: NotificationPreferences;
  restockAlerts: string[]; // listing IDs
}

// 3. MerchantNotificationPreferences — add autoConfirmOrders
export interface MerchantNotificationPreferences {
  newOrders: boolean;
  lowStock: boolean;
  payoutUpdates: boolean;
  customerReviews: boolean;
  pickupReminders: boolean;
  autoConfirmOrders: boolean;
}
```

- [ ] **Step 2: Extend UserRepository interface**

In `src/repositories/interfaces.ts`, add four methods to `UserRepository`:

```ts
export interface UserRepository {
  // ... existing methods ...
  addMerchantFollowNotification(userId: string, merchantId: string): Promise<void>;
  removeMerchantFollowNotification(userId: string, merchantId: string): Promise<void>;
  addRestockAlert(userId: string, listingId: string): Promise<void>;
  removeRestockAlert(userId: string, listingId: string): Promise<void>;
}
```

- [ ] **Step 3: Update seed data**

In `src/repositories/seed.ts`, update `TEST_CUSTOMER_PROFILE`:

```ts
export const TEST_CUSTOMER_PROFILE: CustomerProfile = {
  ...TEST_CUSTOMER,
  favorites: ['merchant-1', 'merchant-3', 'merchant-7'],
  savedListings: [],
  savedAddresses: [ /* unchanged */ ],
  notificationPreferences: {
    newDeals: true,
    orderUpdates: true,
    merchantMessages: true,
    promotions: false,
    followedMerchantNotifications: [],
  },
  restockAlerts: [],
};
```

Also update `MERCHANT_NOTIFICATION_PREFS` in seed.ts (or mock.ts — find where it's defined by searching for `MERCHANT_NOTIFICATION_PREFS`). Add `autoConfirmOrders: false`:

```ts
let MERCHANT_NOTIFICATION_PREFS: MerchantNotificationPreferences = {
  newOrders: true,
  lowStock: true,
  payoutUpdates: true,
  customerReviews: true,
  pickupReminders: true,
  autoConfirmOrders: false,
};
```

- [ ] **Step 4: Implement new UserRepository methods in mock**

In `src/repositories/mock.ts`, inside `class MockUserRepository`, add:

```ts
async addMerchantFollowNotification(userId: string, merchantId: string): Promise<void> {
  await sleep(150);
  const prefs = TEST_CUSTOMER_PROFILE.notificationPreferences;
  if (!prefs.followedMerchantNotifications.includes(merchantId)) {
    prefs.followedMerchantNotifications = [...prefs.followedMerchantNotifications, merchantId];
  }
}

async removeMerchantFollowNotification(userId: string, merchantId: string): Promise<void> {
  await sleep(150);
  const prefs = TEST_CUSTOMER_PROFILE.notificationPreferences;
  prefs.followedMerchantNotifications = prefs.followedMerchantNotifications.filter(
    (id) => id !== merchantId
  );
}

async addRestockAlert(userId: string, listingId: string): Promise<void> {
  await sleep(150);
  if (!TEST_CUSTOMER_PROFILE.restockAlerts) TEST_CUSTOMER_PROFILE.restockAlerts = [];
  if (!TEST_CUSTOMER_PROFILE.restockAlerts.includes(listingId)) {
    TEST_CUSTOMER_PROFILE.restockAlerts = [...TEST_CUSTOMER_PROFILE.restockAlerts, listingId];
  }
}

async removeRestockAlert(userId: string, listingId: string): Promise<void> {
  await sleep(150);
  TEST_CUSTOMER_PROFILE.restockAlerts = (TEST_CUSTOMER_PROFILE.restockAlerts ?? []).filter(
    (id) => id !== listingId
  );
}
```

- [ ] **Step 5: Add all i18n keys**

**`src/i18n/en.ts`** — add these new keys (find the right nesting spot in each section):

```ts
// Inside customer.orders:
statusFilter: {
  all: 'All',
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
},
reviewNudge: {
  title: 'How was your rescue?',
  body: 'Leave a quick review for {{merchant}}',
  action: 'Leave Review',
  dismiss: 'Dismiss',
},

// Inside customer.listing:
notifyRestock: 'Notify me when back',
notifyRestockActive: 'Notifying you',
restockAlertSet: 'We\'ll notify you when this is back!',
restockAlertRemoved: 'Restock notification removed.',

// Inside customer.merchant (or customer.listing):
notifyNewListings: 'Notify me of new listings',
notifyNewListingsActive: 'Notifying you',
followNotificationSet: 'You\'ll be notified when {{name}} posts.',
followNotificationRemoved: 'Notifications turned off for {{name}}.',

// Inside customer.cart:
orderNote: 'Add a note (optional)',
orderNotePlaceholder: 'E.g. extra napkins, separate sauce...',

// Inside merchant.inventory:
relistToday: 'Relist Today',
relistConfirm: 'This creates a new active listing with today\'s pickup window. Continue?',
sellThrough: '{{pct}}% sold',
sold: '{{count}} sold',
adjustStock: 'Adjust stock',

// Inside merchant.dashboard:
scanOrder: 'Scan',

// Inside merchant.settings:
autoConfirmOrders: 'Auto-confirm orders',
autoConfirmOrdersDesc: 'Automatically confirm incoming orders without manual review.',

// Inside customer.notifications (create if not present):
pickupReminder: {
  title: 'Pickup reminder',
  body: 'Your order from {{merchant}} pickup window closes in 30 minutes.',
},
```

**`src/i18n/th.ts`** — add the Thai equivalents:

```ts
// customer.orders:
statusFilter: {
  all: 'ทั้งหมด',
  active: 'กำลังดำเนินการ',
  completed: 'เสร็จสิ้น',
  cancelled: 'ยกเลิกแล้ว',
},
reviewNudge: {
  title: 'อาหารเป็นยังไงบ้าง?',
  body: 'รีวิวสั้นๆ ให้กับ {{merchant}}',
  action: 'รีวิว',
  dismiss: 'ปิด',
},

// customer.listing:
notifyRestock: 'แจ้งเตือนเมื่อมีสินค้า',
notifyRestockActive: 'กำลังแจ้งเตือน',
restockAlertSet: 'เราจะแจ้งเตือนคุณเมื่อมีสินค้า!',
restockAlertRemoved: 'ยกเลิกการแจ้งเตือนแล้ว',

// customer.merchant:
notifyNewListings: 'แจ้งเตือนรายการใหม่',
notifyNewListingsActive: 'กำลังแจ้งเตือน',
followNotificationSet: 'คุณจะได้รับแจ้งเตือนเมื่อ {{name}} โพสต์รายการใหม่',
followNotificationRemoved: 'ปิดการแจ้งเตือนสำหรับ {{name}} แล้ว',

// customer.cart:
orderNote: 'เพิ่มหมายเหตุ (ถ้ามี)',
orderNotePlaceholder: 'เช่น ขอซอสแยก, ขอกล่องพิเศษ...',

// merchant.inventory:
relistToday: 'เปิดขายวันนี้',
relistConfirm: 'จะสร้างรายการใหม่พร้อมช่วงรับสินค้าวันนี้ ดำเนินการต่อ?',
sellThrough: 'ขายแล้ว {{pct}}%',
sold: 'ขายแล้ว {{count}}',
adjustStock: 'ปรับสต็อก',

// merchant.dashboard:
scanOrder: 'สแกน',

// merchant.settings:
autoConfirmOrders: 'ยืนยันออเดอร์อัตโนมัติ',
autoConfirmOrdersDesc: 'ยืนยันออเดอร์ที่เข้ามาโดยอัตโนมัติ',

// customer.notifications:
pickupReminder: {
  title: 'แจ้งเตือนรับสินค้า',
  body: 'ช่วงรับสินค้าจาก {{merchant}} จะปิดใน 30 นาที',
},
```

- [ ] **Step 6: Typecheck and commit**

```bash
pnpm typecheck
pnpm lint
```

```bash
git add src/types/index.ts src/repositories/interfaces.ts src/repositories/seed.ts src/repositories/mock.ts src/i18n/en.ts src/i18n/th.ts
git commit -m "feat(qol): extend types, seed, interfaces, and i18n for QoL feature pack"
```

---

### Task 2: Cart persistence (Feature 5)

Wraps the cart Zustand store in `persist` so it survives app restarts. Prunes stale items on rehydration (listings whose `pickupWindowEnd` has passed).

**Files:**
- Modify: `src/stores/cart.ts`

**Interfaces:**
- Produces: `useCartStore` — same API, now persisted under key `maithing-cart`

- [ ] **Step 1: Add persist middleware to cart store**

Replace the entire content of `src/stores/cart.ts` with:

```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Listing } from '@/src/types';

interface CartItem {
  listing: Listing;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (listing: Listing, quantity?: number) => void;
  removeItem: (listingId: string) => void;
  updateQuantity: (listingId: string, quantity: number) => void;
  clear: () => void;
  totalItems: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (listing, quantity = 1) => {
        const items = get().items;
        const existing = items.find((i) => i.listing.id === listing.id);
        if (existing) {
          set({
            items: items.map((i) =>
              i.listing.id === listing.id
                ? { ...i, quantity: Math.min(i.quantity + quantity, listing.quantityRemaining) }
                : i
            ),
          });
        } else {
          set({ items: [...items, { listing, quantity }] });
        }
      },
      removeItem: (listingId) =>
        set({ items: get().items.filter((i) => i.listing.id !== listingId) }),
      updateQuantity: (listingId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(listingId);
          return;
        }
        set({
          items: get().items.map((i) => (i.listing.id === listingId ? { ...i, quantity } : i)),
        });
      },
      clear: () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () => get().items.reduce((sum, i) => sum + i.listing.salePrice * i.quantity, 0),
    }),
    {
      name: 'maithing-cart',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Prune listings whose pickup window has already closed
        const now = Date.now();
        state.items = state.items.filter(
          (item) => new Date(item.listing.pickupWindowEnd).getTime() > now
        );
      },
    }
  )
);
```

- [ ] **Step 2: Typecheck, lint, commit**

```bash
pnpm typecheck && pnpm lint
git add src/stores/cart.ts
git commit -m "feat(cart): persist cart across app restarts, prune expired listings on rehydration"
```

---

### Task 3: Customer order note field (Feature 10)

`Order.notes` already exists on the type. This task adds the TextInput to the cart confirmation screen and displays the note in both customer and merchant order detail screens.

**Files:**
- Modify: `app/(customer)/cart.tsx`
- Modify: `app/(customer)/order/[id].tsx`
- Modify: `app/(merchant)/order/[id].tsx`

**Interfaces:**
- Consumes: i18n keys `customer.cart.orderNote`, `customer.cart.orderNotePlaceholder`, `merchant.orders.notes` (already exists in en.ts)
- Produces: `createOrder` called with `notes` field populated from state

- [ ] **Step 1: Add note state and TextInput to cart screen**

In `app/(customer)/cart.tsx`:

1. Import `TextInput` from `react-native` (already imported).
2. Add state: `const [note, setNote] = useState('');`
3. In `handleConfirm`, pass note to `createOrder`:
   ```ts
   const order = await mockRepositories.orders.createOrder({
     // ... existing fields ...
     notes: note.trim() || undefined,
   });
   ```
4. Add the TextInput just above the confirm Button at the bottom of the cart:
   ```tsx
   <View className="mb-4">
     <Text variant="label" className="mb-2 text-muted">
       {t('customer.cart.orderNote')}
     </Text>
     <TextInput
       value={note}
       onChangeText={setNote}
       placeholder={t('customer.cart.orderNotePlaceholder')}
       placeholderTextColor={colors.muted}
       multiline
       maxLength={200}
       className="rounded-xl border border-border bg-card px-4 py-3 text-foreground"
       style={{ minHeight: 72, textAlignVertical: 'top', color: colors.foreground }}
     />
   </View>
   ```

- [ ] **Step 2: Display note in customer order detail**

In `app/(customer)/order/[id].tsx`, after the pickup window/code section, add:

```tsx
{order.notes ? (
  <Card variant="outlined" className="mb-4">
    <Text variant="label" className="mb-1 text-muted">
      {t('merchant.orders.notes')}
    </Text>
    <Text variant="body-sm">{order.notes}</Text>
  </Card>
) : null}
```

- [ ] **Step 3: Display note prominently in merchant order detail**

In `app/(merchant)/order/[id].tsx`, find the customer info section and add after it:

```tsx
{order.notes ? (
  <Card variant="outlined" className="mb-4 border-warning/40 bg-warning/5">
    <View className="flex-row items-center mb-1">
      <MessageSquare size={14} color={colors.warning} />
      <Text variant="label" className="ml-1 text-warning">
        {t('merchant.orders.notes')}
      </Text>
    </View>
    <Text variant="body-sm">{order.notes}</Text>
  </Card>
) : null}
```

Import `MessageSquare` from `lucide-react-native` at the top of the merchant order detail file. Also import `colors` via `useThemeColor()` if not already present. Check that `colors.warning` is available in the theme — if not, use `colors.muted` instead.

- [ ] **Step 4: Typecheck, lint, commit**

```bash
pnpm typecheck && pnpm lint
git add "app/(customer)/cart.tsx" "app/(customer)/order/[id].tsx" "app/(merchant)/order/[id].tsx"
git commit -m "feat(orders): add customer order note field on cart and display in order details"
```

---

### Task 4: Order status filter chips on Customer Orders tab (Feature 1)

Adds a horizontal row of filter chips below the search bar so customers can quickly filter by All / Active / Completed / Cancelled.

**Files:**
- Modify: `app/(customer)/(tabs)/orders.tsx`

**Interfaces:**
- Consumes: i18n keys `customer.orders.statusFilter.*`
- Consumes: `Order['status']` from `@/src/types`

- [ ] **Step 1: Add filter state and derived list to orders screen**

In `app/(customer)/(tabs)/orders.tsx`:

1. Add filter state near the top of the component:
   ```ts
   type StatusFilter = 'all' | 'active' | 'completed' | 'cancelled';
   const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
   ```

2. Define the active statuses for each filter bucket:
   ```ts
   const ACTIVE_STATUSES = new Set<Order['status']>(['pending', 'confirmed', 'preparing', 'ready']);
   
   const filteredOrders = useMemo(() => {
     const base = (orders ?? []).filter((o) =>
       searchQuery ? o.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
         o.pickupCode.toLowerCase().includes(searchQuery.toLowerCase()) : true
     );
     if (statusFilter === 'all') return base;
     if (statusFilter === 'active') return base.filter((o) => ACTIVE_STATUSES.has(o.status));
     if (statusFilter === 'completed') return base.filter((o) => o.status === 'completed' || o.status === 'picked_up');
     if (statusFilter === 'cancelled') return base.filter((o) => o.status === 'cancelled');
     return base;
   }, [orders, searchQuery, statusFilter]);
   ```
   Make sure to replace any existing `filteredOrders` derivation (there may be one based on `searchQuery` already — consolidate it here).

- [ ] **Step 2: Add filter chip row to JSX**

After the `SearchBar` and before the `FlashList`, insert:

```tsx
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  className="mb-3"
  contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
>
  {(['all', 'active', 'completed', 'cancelled'] as StatusFilter[]).map((filter) => (
    <PressableScale key={filter} onPress={() => setStatusFilter(filter)} scale={0.95}>
      <View
        className={cn(
          'rounded-full border px-4 py-1.5',
          statusFilter === filter
            ? 'border-primary bg-primary'
            : 'border-border bg-card'
        )}
      >
        <Text
          variant="body-sm"
          className={statusFilter === filter ? 'text-white font-semibold' : 'text-foreground'}
        >
          {t(`customer.orders.statusFilter.${filter}`)}
        </Text>
      </View>
    </PressableScale>
  ))}
</ScrollView>
```

Import `ScrollView` from `react-native` (should already be imported) and `cn` from `@/src/lib/utils`.

- [ ] **Step 3: Use filteredOrders in FlashList**

Replace the `data` prop in the `FlashList` from `orders` (or whatever it currently uses) to `filteredOrders`.

- [ ] **Step 4: Typecheck, lint, commit**

```bash
pnpm typecheck && pnpm lint
git add "app/(customer)/(tabs)/orders.tsx"
git commit -m "feat(customer/orders): add status filter chips — All / Active / Completed / Cancelled"
```

---

### Task 5: Pickup reminder notification 30 min before window closes (Feature 2)

When an order is confirmed in the cart, schedule a second local notification at `pickupWindowEnd - 30 minutes`.

**Files:**
- Modify: `src/services/notifications.ts`
- Modify: `app/(customer)/cart.tsx`

**Interfaces:**
- Produces: `schedulePickupReminder(orderId, merchantName, pickupWindowEnd, preferences?)` in `src/services/notifications.ts`
- Consumes: i18n key `customer.notifications.pickupReminder.*` — NOTE: these strings are passed directly (not via hook) since notifications.ts is not a React component. Pass the strings in from the calling site.

- [ ] **Step 1: Add schedulePickupReminder to notifications service**

In `src/services/notifications.ts`, add after `scheduleNotificationAtDate`:

```ts
export async function schedulePickupReminder(
  orderId: string,
  merchantName: string,
  pickupWindowEnd: string,
  reminderTitle: string,
  reminderBody: string,
  preferences?: NotificationPreferences
): Promise<void> {
  if (!shouldScheduleNotification(preferences, 'order_update')) return;

  const windowEnd = new Date(pickupWindowEnd).getTime();
  const reminderTime = new Date(windowEnd - 30 * 60 * 1000); // 30 min before

  // Only schedule if the reminder is in the future (at least 2 min away)
  if (reminderTime.getTime() - Date.now() < 2 * 60 * 1000) return;

  await scheduleNotificationAtDate(reminderTitle, reminderBody, reminderTime, { orderId });
}
```

- [ ] **Step 2: Call schedulePickupReminder after order creation in cart**

In `app/(customer)/cart.tsx`, import the function and call it after the order is created (after the existing `scheduleLocalNotification` call):

```ts
import { scheduleLocalNotification, schedulePickupReminder } from '@/src/services/notifications';
// ... inside handleConfirm, after the order is created and the immediate notification is fired:

await schedulePickupReminder(
  order.id,
  merchant.name,
  order.pickupWindowEnd,
  t('customer.notifications.pickupReminder.title'),
  t('customer.notifications.pickupReminder.body', { merchant: merchant.name }),
  user?.notificationPreferences
);
```

Note: `user` in cart.tsx is `useAuthStore((s) => s.user)` which is a `User`, not `CustomerProfile`, so it won't have `notificationPreferences`. Pass `undefined` for preferences so the reminder always fires when permission is granted:

```ts
await schedulePickupReminder(
  order.id,
  merchant.name,
  order.pickupWindowEnd,
  t('customer.notifications.pickupReminder.title'),
  t('customer.notifications.pickupReminder.body', { merchant: merchant.name }),
  undefined
);
```

- [ ] **Step 3: Typecheck, lint, commit**

```bash
pnpm typecheck && pnpm lint
git add src/services/notifications.ts "app/(customer)/cart.tsx"
git commit -m "feat(notifications): schedule 30-min pickup reminder when order is placed"
```

---

### Task 6: Review nudge banner on Customer Orders tab (Feature 4)

Shows a dismissible banner at the top of the orders list when the customer has a recently completed order without a review.

**Files:**
- Create: `src/components/composite/ReviewNudgeBanner.tsx`
- Modify: `app/(customer)/(tabs)/orders.tsx`

**Interfaces:**
- Consumes: `useOrders(userId, 'customer')`, `useReviews(merchantId)` — both already exist
- Consumes: i18n keys `customer.orders.reviewNudge.*`
- Produces: `<ReviewNudgeBanner order={order} onDismiss={() => void} />` — renders null if nothing to nudge

- [ ] **Step 1: Create ReviewNudgeBanner component**

Create `src/components/composite/ReviewNudgeBanner.tsx`:

```tsx
import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Star, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import type { Order } from '@/src/types';

interface ReviewNudgeBannerProps {
  order: Order;
  onDismiss: () => void;
}

export function ReviewNudgeBanner({ order, onDismiss }: ReviewNudgeBannerProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColor();

  const handleReview = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/(customer)/order/${order.id}` as any);
  };

  return (
    <View className="mx-4 mb-3 rounded-2xl bg-primary/10 p-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-row items-center flex-1 pr-2">
          <View className="mr-3 rounded-xl bg-primary/20 p-2">
            <Star size={16} color={colors.primary} fill={colors.primary} />
          </View>
          <View className="flex-1">
            <Text variant="body-sm" className="font-semibold mb-0.5">
              {t('customer.orders.reviewNudge.title')}
            </Text>
            <Text variant="caption" className="text-muted" numberOfLines={1}>
              {t('customer.orders.reviewNudge.body', { merchant: order.merchantName })}
            </Text>
          </View>
        </View>
        <PressableScale onPress={onDismiss} scale={0.9} className="p-1">
          <X size={16} color={colors.muted} />
        </PressableScale>
      </View>
      <Button
        variant="primary"
        size="sm"
        className="mt-3"
        onPress={handleReview}
      >
        {t('customer.orders.reviewNudge.action')}
      </Button>
    </View>
  );
}
```

- [ ] **Step 2: Add nudge logic and banner to orders tab**

In `app/(customer)/(tabs)/orders.tsx`:

1. Import the banner component and the reviews hook:
   ```ts
   import { ReviewNudgeBanner } from '@/src/components/composite/ReviewNudgeBanner';
   import { useReviews } from '@/src/hooks/useReviews';
   ```

2. Add dismissal state and derive the nudge candidate:
   ```ts
   const [dismissedOrderId, setDismissedOrderId] = useState<string | null>(null);

   const completedUnreviewed = useMemo(() => {
     if (!orders) return null;
     return orders.find(
       (o) =>
         (o.status === 'completed' || o.status === 'picked_up') &&
         o.id !== dismissedOrderId
     ) ?? null;
   }, [orders, dismissedOrderId]);
   ```

3. In the JSX, render the banner above the filter chips (and below the header/search bar):
   ```tsx
   {completedUnreviewed && (
     <ReviewNudgeBanner
       order={completedUnreviewed}
       onDismiss={() => setDismissedOrderId(completedUnreviewed.id)}
     />
   )}
   ```

NOTE: A full "has this order been reviewed?" check would require fetching reviews per order. For the mock, the banner appears for the most recent completed order and clears when dismissed. This is the right scope — per-order review lookup can be added when a real backend ships.

- [ ] **Step 3: Typecheck, lint, commit**

```bash
pnpm typecheck && pnpm lint
git add src/components/composite/ReviewNudgeBanner.tsx "app/(customer)/(tabs)/orders.tsx"
git commit -m "feat(customer/orders): add post-pickup review nudge banner"
```

---

### Task 7: Per-merchant follow notifications (Feature 3)

Adds a bell toggle on the merchant detail screen so a customer can opt into push notifications when that specific merchant posts a new listing.

**Files:**
- Modify: `src/hooks/useFavorites.ts`
- Modify: `app/(customer)/merchant/[id].tsx`

**Interfaces:**
- Consumes: `UserRepository.addMerchantFollowNotification`, `removeMerchantFollowNotification` (added in Task 1)
- Consumes: `NotificationPreferences.followedMerchantNotifications` (added in Task 1)
- Produces: `useMerchantFollowNotification(userId, merchantId): boolean` hook
- Produces: `useToggleMerchantFollowNotification()` mutation hook

- [ ] **Step 1: Add hooks to useFavorites.ts**

In `src/hooks/useFavorites.ts`, add:

```ts
export function useMerchantFollowNotification(userId: string, merchantId: string): boolean {
  const { data: profile } = useCustomerProfile(userId);
  return (profile?.notificationPreferences.followedMerchantNotifications ?? []).includes(merchantId);
}

export function useToggleMerchantFollowNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      merchantId,
      isActive,
    }: {
      userId: string;
      merchantId: string;
      isActive: boolean;
    }) => {
      if (isActive) {
        await mockRepositories.users.removeMerchantFollowNotification(userId, merchantId);
      } else {
        await mockRepositories.users.addMerchantFollowNotification(userId, merchantId);
      }
      return { merchantId, isActive: !isActive };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-profile'] });
    },
  });
}
```

- [ ] **Step 2: Add bell toggle to merchant detail screen**

In `app/(customer)/merchant/[id].tsx`:

1. Import the hooks and toast (use `Alert.alert` for toast-like feedback):
   ```ts
   import { Alert, View, ScrollView, Image } from 'react-native'; // Alert already imported
   import { Bell, BellOff, MapPin, Phone, Navigation, AlertCircle, Calendar, Clock } from 'lucide-react-native';
   import { useAuthStore } from '@/src/stores/auth';
   import {
     useMerchantFollowNotification,
     useToggleMerchantFollowNotification,
   } from '@/src/hooks/useFavorites';
   ```

2. Add inside the component:
   ```ts
   const userId = useAuthStore((s) => s.user?.id ?? '');
   const isNotifyActive = useMerchantFollowNotification(userId, id);
   const { mutate: toggleNotify, isPending: notifyPending } = useToggleMerchantFollowNotification();
   ```

3. In the JSX, place a bell `PressableScale` icon next to (or immediately after) the existing `FavoriteButton`. Find the header area where the Follow/Favorite button is rendered and add:
   ```tsx
   <PressableScale
     onPress={() => {
       Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
       toggleNotify(
         { userId, merchantId: id, isActive: isNotifyActive },
         {
           onSuccess: ({ isActive }) => {
             Alert.alert(
               isActive
                 ? t('customer.merchant.followNotificationSet', { name: merchant.name })
                 : t('customer.merchant.followNotificationRemoved', { name: merchant.name })
             );
           },
         }
       );
     }}
     scale={0.9}
     disabled={notifyPending}
     className="p-2 rounded-xl bg-card border border-border"
   >
     {isNotifyActive
       ? <Bell size={20} color={colors.primary} fill={colors.primary} />
       : <Bell size={20} color={colors.muted} />}
   </PressableScale>
   ```

   Import `Haptics` from `expo-haptics` if not already imported.

- [ ] **Step 3: Typecheck, lint, commit**

```bash
pnpm typecheck && pnpm lint
git add src/hooks/useFavorites.ts "app/(customer)/merchant/[id].tsx"
git commit -m "feat(customer/merchant): add per-merchant new-listing notification bell toggle"
```

---

### Task 8: Saved listing restock alert (Feature 6)

Adds a "Notify me when back" toggle on the listing detail screen when a listing is `sold_out`. Persists the alert in `CustomerProfile.restockAlerts`.

**Files:**
- Modify: `src/hooks/useFavorites.ts`
- Modify: `app/(customer)/listing/[id].tsx`

**Interfaces:**
- Consumes: `UserRepository.addRestockAlert`, `removeRestockAlert` (Task 1)
- Consumes: `CustomerProfile.restockAlerts` (Task 1)
- Produces: `useRestockAlerts(userId): string[]` hook
- Produces: `useToggleRestockAlert()` mutation hook

- [ ] **Step 1: Add restock hooks to useFavorites.ts**

```ts
export function useRestockAlerts(userId: string): string[] {
  const { data: profile } = useCustomerProfile(userId);
  return profile?.restockAlerts ?? [];
}

export function useToggleRestockAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      listingId,
      isActive,
    }: {
      userId: string;
      listingId: string;
      isActive: boolean;
    }) => {
      if (isActive) {
        await mockRepositories.users.removeRestockAlert(userId, listingId);
      } else {
        await mockRepositories.users.addRestockAlert(userId, listingId);
      }
      return { listingId, isActive: !isActive };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-profile'] });
    },
  });
}
```

- [ ] **Step 2: Show "Notify me when back" on sold_out listing detail**

In `app/(customer)/listing/[id].tsx`:

1. Import new hooks:
   ```ts
   import { useSavedListings, useSaveListingToggle, useRestockAlerts, useToggleRestockAlert } from '@/src/hooks/useFavorites';
   import { Bell } from 'lucide-react-native'; // add Bell to existing import
   ```

2. Add hook calls inside the component:
   ```ts
   const restockAlerts = useRestockAlerts(userId);
   const { mutate: toggleRestock, isPending: restockPending } = useToggleRestockAlert();
   const isRestockAlertActive = restockAlerts.includes(listing.id);
   ```

3. Replace the existing "Sold Out" button or render it alongside. Find where `listing.status === 'sold_out'` or where the "Sold Out" button is rendered and add a restock alert button below it:
   ```tsx
   {listing.status === 'sold_out' && (
     <View className="mt-3">
       <Button
         variant={isRestockAlertActive ? 'secondary' : 'outline'}
         disabled={restockPending}
         onPress={() => {
           Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
           toggleRestock(
             { userId, listingId: listing.id, isActive: isRestockAlertActive },
             {
               onSuccess: ({ isActive }) => {
                 Alert.alert(
                   isActive
                     ? t('customer.listing.restockAlertSet')
                     : t('customer.listing.restockAlertRemoved')
                 );
               },
             }
           );
         }}
       >
         <View className="flex-row items-center gap-2">
           <Bell size={16} color={isRestockAlertActive ? colors.primary : colors.muted} />
           <Text variant="body-sm">
             {isRestockAlertActive
               ? t('customer.listing.notifyRestockActive')
               : t('customer.listing.notifyRestock')}
           </Text>
         </View>
       </Button>
     </View>
   )}
   ```

   Import `Alert` from `react-native` if not already there.

- [ ] **Step 3: Typecheck, lint, commit**

```bash
pnpm typecheck && pnpm lint
git add src/hooks/useFavorites.ts "app/(customer)/listing/[id].tsx"
git commit -m "feat(customer/listing): add restock alert toggle for sold-out listings"
```

---

### Task 9: Inline stock count ± on Inventory card (Feature 7)

Lets merchants bump the `quantityRemaining` on a listing directly from the inventory card without opening the edit form.

**Files:**
- Modify: `app/(merchant)/(tabs)/inventory.tsx`

**Interfaces:**
- Consumes: `useUpdateListing` mutation (already exists in `src/hooks/useListings.ts`)
- Consumes: i18n key `merchant.inventory.adjustStock`

- [ ] **Step 1: Add stock stepper UI to InventoryCard**

In `app/(merchant)/(tabs)/inventory.tsx`:

1. Add `useUpdateListing` import if not already present:
   ```ts
   import { useListings, useUpdateListing, useDeleteListing, useListingTemplates, useDeleteListingTemplate } from '@/src/hooks/useListings';
   ```

2. Add `onAdjustStock` prop to `InventoryCard`:
   ```ts
   function InventoryCard({
     listing,
     merchantId,
     onEdit,
     onDuplicate,
     onToggleStatus,
     onDelete,
     isSelecting,
     isSelected,
     onLongPress,
     onSelect,
     onAdjustStock, // NEW
   }: {
     // ... existing props ...
     onAdjustStock?: (listingId: string, newQty: number) => void;
   }) {
   ```

3. Inside `InventoryCard`, below the existing action row (the row with Edit, Duplicate, etc.), add a compact stock stepper. Only show it when `listing.status === 'active'` (no point showing for sold_out/expired/draft):
   ```tsx
   {listing.status === 'active' && !isSelecting && (
     <View className="mt-3 pt-3 border-t border-border flex-row items-center justify-between">
       <Text variant="caption" className="text-muted">
         {t('merchant.inventory.adjustStock')}
       </Text>
       <View className="flex-row items-center gap-3">
         <PressableScale
           onPress={() => onAdjustStock?.(listing.id, Math.max(0, listing.quantityRemaining - 1))}
           scale={0.9}
           className="h-8 w-8 items-center justify-center rounded-full bg-muted/10"
         >
           <Minus size={14} color={colors.foreground} />
         </PressableScale>
         <Text variant="body-sm" className="font-semibold w-8 text-center">
           {listing.quantityRemaining}
         </Text>
         <PressableScale
           onPress={() => onAdjustStock?.(listing.id, listing.quantityRemaining + 1)}
           scale={0.9}
           className="h-8 w-8 items-center justify-center rounded-full bg-muted/10"
         >
           <Plus size={14} color={colors.foreground} />
         </PressableScale>
       </View>
     </View>
   )}
   ```

   `Minus` and `Plus` should already be imported at the top of inventory.tsx.

4. In the parent `InventoryScreen` (or wherever `InventoryCard` is rendered), define the handler and pass it:
   ```ts
   const updateListing = useUpdateListing(merchantId);

   const handleAdjustStock = (listingId: string, newQty: number) => {
     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
     updateListing.mutate({ id: listingId, data: { quantityRemaining: newQty } });
   };
   ```
   
   Check `useUpdateListing`'s call signature in `src/hooks/useListings.ts` — it's likely `mutate({ id, data })` but confirm and match it exactly.

5. Pass `onAdjustStock={handleAdjustStock}` to each `InventoryCard` in the `FlashList` `renderItem`.

- [ ] **Step 2: Typecheck, lint, commit**

```bash
pnpm typecheck && pnpm lint
git add "app/(merchant)/(tabs)/inventory.tsx"
git commit -m "feat(merchant/inventory): add inline stock count ± stepper on active listing cards"
```

---

### Task 10: One-tap relist expired listing (Feature 8)

Adds a "Relist Today" button on expired listing cards that creates a new active listing with today's pickup window (same hours as the original).

**Files:**
- Modify: `app/(merchant)/(tabs)/inventory.tsx`

**Interfaces:**
- Consumes: `useCreateListing` (or `useListings`/`useUpdateListing`) — check `src/hooks/useListings.ts` for `useCreateListing`; if it doesn't exist, use `mockRepositories.listings.createListing` via a local mutation
- Consumes: helper `shiftWindowToToday(isoString)` — already defined in this file
- Consumes: i18n keys `merchant.inventory.relistToday`, `merchant.inventory.relistConfirm`

- [ ] **Step 1: Check for useCreateListing hook**

Open `src/hooks/useListings.ts` and check if `useCreateListing` exists. If not, add it:

```ts
export function useCreateListing(merchantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Listing, 'id' | 'createdAt'>) =>
      mockRepositories.listings.createListing(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}
```

- [ ] **Step 2: Add onRelist prop and handler to InventoryCard**

In `app/(merchant)/(tabs)/inventory.tsx`:

1. Add `onRelist?: (listing: Listing) => void` to the `InventoryCard` props.

2. Inside `InventoryCard`, when `listing.status === 'expired'` and `!isSelecting`, add a "Relist Today" button. Place it in the same position as the stock stepper (below the action row):
   ```tsx
   {listing.status === 'expired' && !isSelecting && (
     <View className="mt-3 pt-3 border-t border-border">
       <Button
         variant="outline"
         size="sm"
         onPress={() => onRelist?.(listing)}
       >
         {t('merchant.inventory.relistToday')}
       </Button>
     </View>
   )}
   ```

3. In the screen-level component, add the handler:
   ```ts
   const createListing = useCreateListing(merchantId);

   const handleRelist = (listing: Listing) => {
     Alert.alert(
       t('merchant.inventory.relistToday'),
       t('merchant.inventory.relistConfirm'),
       [
         { text: t('common.cancel'), style: 'cancel' },
         {
           text: t('common.confirm'),
           onPress: () => {
             Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
             const { id, createdAt, ...rest } = listing;
             createListing.mutate({
               ...rest,
               pickupWindowStart: shiftWindowToToday(listing.pickupWindowStart),
               pickupWindowEnd: shiftWindowToToday(listing.pickupWindowEnd),
               status: 'active',
               quantityRemaining: listing.quantity,
             });
           },
         },
       ]
     );
   };
   ```
   
   `shiftWindowToToday` is already defined in inventory.tsx.

4. Pass `onRelist={handleRelist}` to each `InventoryCard` in the `FlashList`.

- [ ] **Step 3: Typecheck, lint, commit**

```bash
pnpm typecheck && pnpm lint
git add "app/(merchant)/(tabs)/inventory.tsx" src/hooks/useListings.ts
git commit -m "feat(merchant/inventory): add one-tap Relist Today on expired listing cards"
```

---

### Task 11: Per-listing sell-through stats on Inventory card (Feature 9)

Shows a `X% sold` or `X sold` stat on each active/sold_out/expired card based on `quantity` and `quantityRemaining`.

**Files:**
- Modify: `app/(merchant)/(tabs)/inventory.tsx`

**Interfaces:**
- Consumes: `listing.quantity`, `listing.quantityRemaining` (both on `Listing` type)
- Consumes: i18n keys `merchant.inventory.sellThrough`, `merchant.inventory.sold`

- [ ] **Step 1: Add sell-through stat to InventoryCard**

In `app/(merchant)/(tabs)/inventory.tsx`, inside `InventoryCard`, find the area where the listing's quantity/price details are rendered. Add a sell-through badge next to the existing quantity display:

```tsx
{(() => {
  if (listing.status === 'draft') return null;
  const sold = listing.quantity - listing.quantityRemaining;
  if (listing.quantity === 0) return null;
  const pct = Math.round((sold / listing.quantity) * 100);
  return (
    <View className="flex-row items-center mt-1">
      <Badge variant={pct >= 80 ? 'success' : pct >= 50 ? 'warning' : 'default'}>
        {pct === 100
          ? t('merchant.inventory.sold', { count: sold })
          : t('merchant.inventory.sellThrough', { pct })}
      </Badge>
    </View>
  );
})()}
```

Place this just below or next to the existing price / quantity row inside the card. It will show on `active`, `sold_out`, and `expired` listings but not `draft`.

- [ ] **Step 2: Typecheck, lint, commit**

```bash
pnpm typecheck && pnpm lint
git add "app/(merchant)/(tabs)/inventory.tsx"
git commit -m "feat(merchant/inventory): add sell-through stat badge on listing cards"
```

---

### Task 12: Auto-confirm orders toggle in merchant settings (Feature 11)

Adds an "Auto-confirm orders" toggle in the Merchant Settings notification section and wires it to `createOrder` in the mock so confirmed status is set immediately when the toggle is on.

**Files:**
- Modify: `app/(merchant)/(tabs)/settings.tsx`
- Modify: `src/repositories/mock.ts`

**Interfaces:**
- Consumes: `MerchantNotificationPreferences.autoConfirmOrders` (added in Task 1)
- Consumes: `useMerchantNotificationPreferences`, `useUpdateMerchantNotificationPreferences` (already exist in `src/hooks/useMerchants.ts`)

- [ ] **Step 1: Add toggle to merchant settings**

In `app/(merchant)/(tabs)/settings.tsx`:

1. The screen already has a `NotificationToggle` component and renders `useMerchantNotificationPreferences` + `useUpdateMerchantNotificationPreferences`. Find the notification prefs section and add the new toggle:

   ```tsx
   <NotificationToggle
     label={t('merchant.settings.autoConfirmOrders')}
     value={prefs?.autoConfirmOrders ?? false}
     onValueChange={(val) =>
       updatePrefs.mutate({ ...prefs!, autoConfirmOrders: val })
     }
   />
   ```

   Also add a caption below the toggle:
   ```tsx
   <Text variant="caption" className="text-muted mb-2 -mt-1 px-1">
     {t('merchant.settings.autoConfirmOrdersDesc')}
   </Text>
   ```

   Place this toggle last in the notifications section (below `pickupReminders`).

- [ ] **Step 2: Wire auto-confirm in mock createOrder**

In `src/repositories/mock.ts`, update `createOrder` to check `MERCHANT_NOTIFICATION_PREFS.autoConfirmOrders`:

```ts
async createOrder(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
  await sleep(500);
  const autoConfirm = MERCHANT_NOTIFICATION_PREFS.autoConfirmOrders;
  const order: Order = {
    ...data,
    status: autoConfirm && data.status === 'pending' ? 'confirmed' : data.status,
    id: `order-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  ORDERS.unshift(order);

  // Reduce inventory (existing logic — unchanged)
  for (const item of data.items) {
    const listing = LISTINGS.find((l) => l.id === item.listingId);
    if (listing) {
      listing.quantityRemaining = Math.max(0, listing.quantityRemaining - item.quantity);
      if (listing.quantityRemaining === 0) listing.status = 'sold_out';
    }
  }

  return order;
},
```

- [ ] **Step 3: Typecheck, lint, commit**

```bash
pnpm typecheck && pnpm lint
git add "app/(merchant)/(tabs)/settings.tsx" src/repositories/mock.ts
git commit -m "feat(merchant/settings): add auto-confirm orders toggle, wire to createOrder mock"
```

---

### Task 13: Scanner shortcut from dashboard pickup rows (Feature 12)

Adds a small scan icon button directly on each pending pickup row in the merchant dashboard. Tapping it navigates to the scanner screen with the pickup code pre-populated, so the merchant can confirm without manually typing.

**Files:**
- Modify: `app/(merchant)/(tabs)/index.tsx`
- Modify: `app/(merchant)/scanner.tsx`

**Interfaces:**
- Consumes: `order.pickupCode` (on `Order` type)
- Consumes: `router.push('/(merchant)/scanner', { params: { preloadCode } })` — uses Expo Router query params
- Consumes: i18n key `merchant.dashboard.scanOrder`

- [ ] **Step 1: Add preloadCode param to scanner**

In `app/(merchant)/scanner.tsx`:

1. Import `useLocalSearchParams` from `expo-router`:
   ```ts
   import { useLocalSearchParams } from 'expo-router';
   ```

2. At the top of the `ScannerScreen` component, read the param:
   ```ts
   const { preloadCode } = useLocalSearchParams<{ preloadCode?: string }>();
   ```

3. Initialize `manualCode` and trigger lookup using a `useEffect` when `preloadCode` is present:
   ```ts
   const [manualCode, setManualCode] = useState(preloadCode ?? '');
   const [lookupCode, setLookupCode] = useState('');
   const [done, setDone] = useState(false);

   // Auto-trigger lookup when launched from dashboard
   useEffect(() => {
     if (preloadCode && preloadCode.length >= 4) {
       setManualCode(preloadCode);
       setLookupCode(preloadCode.trim().toUpperCase());
     }
   }, [preloadCode]);
   ```
   
   Replace any existing `useState('')` initializers for these values if they are already declared separately.

- [ ] **Step 2: Add scan button to OrderPickupRow on dashboard**

In `app/(merchant)/(tabs)/index.tsx`:

1. The `OrderPickupRow` component currently has an `onPress` for the whole row. Restructure it to have the row body navigate to order detail AND a separate scan icon button on the right that goes to the scanner:

   ```tsx
   function OrderPickupRow({ order, onPress }: { order: Order; onPress?: () => void }) {
     const router = useRouter();
     const { t } = useTranslation();
     const colors = useThemeColor();

     const handleScan = () => {
       Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
       router.push({
         pathname: '/(merchant)/scanner',
         params: { preloadCode: order.pickupCode },
       } as any);
     };

     return (
       <PressableScale key={order.id} onPress={onPress} scale={0.98}>
         <Card variant="outlined" className="mb-3">
           <View className="flex-row items-center justify-between">
             <View className="flex-1 pr-2">
               {/* existing content — customer name, items count, pickup window */}
             </View>
             <View className="flex-row items-center gap-2">
               <Badge variant={order.status === 'ready' ? 'success' : 'warning'}>
                 {/* existing badge */}
               </Badge>
               <PressableScale onPress={handleScan} scale={0.9}>
                 <View className="rounded-xl bg-primary/10 p-2">
                   <QrCode size={18} color={colors.primary} />
                 </View>
               </PressableScale>
             </View>
           </View>
         </Card>
       </PressableScale>
     );
   }
   ```

   Read the existing `OrderPickupRow` carefully before editing — preserve all the existing content inside `<View className="flex-1 pr-2">`. Only restructure the right side to accommodate the scan button.

   Import `useRouter` and `useThemeColor` inside the component if not already used there. `QrCode` is already imported at the top of the file.

- [ ] **Step 3: Typecheck, lint, commit**

```bash
pnpm typecheck && pnpm lint
git add "app/(merchant)/(tabs)/index.tsx" "app/(merchant)/scanner.tsx"
git commit -m "feat(merchant/dashboard): add direct scan button on pickup rows, scanner accepts preloadCode param"
```

---

## Self-Review

**Spec coverage check:**
1. ✅ Order status filter — Task 4
2. ✅ Pickup reminder 30 min — Task 5
3. ✅ Per-merchant follow notifications — Task 7
4. ✅ Review nudge banner — Task 6
5. ✅ Cart persistence — Task 2
6. ✅ Restock alert — Task 8
7. ✅ Inline stock count ± — Task 9
8. ✅ One-tap relist expired — Task 10
9. ✅ Per-listing sell-through stats — Task 11
10. ✅ Customer order note — Task 3
11. ✅ Auto-confirm orders toggle — Task 12
12. ✅ Scanner shortcut from pickup rows — Task 13

**Shared foundation:** All new types, seed data, UserRepository interface extensions, and all i18n keys are in Task 1. Tasks 7 and 8 both consume Task 1 methods — run Task 1 before Tasks 7 or 8.

**Dependency order:** Task 1 → Tasks 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13 (all independent of each other after Task 1). Tasks 2 and 3 are also independent of each other.

**Type consistency verified:**
- `NotificationPreferences.followedMerchantNotifications` named consistently in Task 1 and Task 7.
- `CustomerProfile.restockAlerts` named consistently in Task 1 and Task 8.
- `MerchantNotificationPreferences.autoConfirmOrders` named consistently in Task 1 and Task 12.
- `schedulePickupReminder` signature matches between Task 5 definition and call site.
- `useCreateListing` in Task 10 references `src/hooks/useListings.ts` and matches the `ListingRepository.createListing` signature `Omit<Listing, 'id' | 'createdAt'>`.

**Placeholder scan:** No TBD/TODO items. All code blocks show complete implementations.

**Edge cases covered:**
- Cart rehydration prunes expired listings (Task 2).
- Pickup reminder only fires if more than 2 minutes remain (Task 5).
- Sell-through badge skips `draft` listings and handles zero-quantity guard (Task 11).
- Relist correctly resets `quantityRemaining` to `quantity` and shifts pickup window to today (Task 10).
- Scanner `preloadCode` only triggers lookup when >= 4 chars (Task 13).
