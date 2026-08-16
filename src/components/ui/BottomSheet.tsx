import React, { useCallback, useRef, useEffect } from 'react';
import { View } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetModalProps,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useThemeColor } from '@/src/hooks/useThemeColor';

interface BottomSheetProps extends Omit<BottomSheetModalProps, 'children'> {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  enableScroll?: boolean;
  snapPoints?: string[];
}

function SheetBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />;
}

export const BottomSheet = React.memo(function BottomSheet({
  isOpen,
  onClose,
  children,
  enableScroll = false,
  snapPoints = ['50%', '75%'],
  ...rest
}: BottomSheetProps) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const colors = useThemeColor();

  useEffect(() => {
    if (isOpen) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [isOpen]);

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  const Container = enableScroll ? BottomSheetScrollView : BottomSheetView;

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChange}
      backdropComponent={SheetBackdrop}
      handleIndicatorStyle={{
        backgroundColor: colors.muted,
        width: 40,
        height: 4,
        borderRadius: 2,
      }}
      // eslint-disable-next-line react-native/no-color-literals -- sheet background is intentionally transparent; the themed surface color comes from the content view inside
      backgroundStyle={{
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        backgroundColor: 'transparent',
      }}
      enablePanDownToClose
      enableOverDrag
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      {...rest}
    >
      <View className="flex-1 rounded-t-3xl bg-background">
        <Container className="flex-1 px-6 pt-4 pb-8">{children}</Container>
      </View>
    </BottomSheetModal>
  );
});
