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

interface BottomSheetProps extends Omit<BottomSheetModalProps, 'children'> {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  enableScroll?: boolean;
  snapPoints?: string[];
}

function SheetBackdrop(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      opacity={0.5}
    />
  );
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
        backgroundColor: '#9CA3AF',
        width: 40,
        height: 4,
        borderRadius: 2,
      }}
      backgroundStyle={{
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        backgroundColor: 'transparent',
      }}
      enablePanDownToClose
      enableOverDrag
      {...rest}
    >
      <View className="flex-1 rounded-t-3xl bg-background">
        <Container className="flex-1 px-6 pt-4 pb-8">
          {children}
        </Container>
      </View>
    </BottomSheetModal>
  );
});
