import qrcode from 'qrcode-generator';
import { View } from 'react-native';
import { useThemeColor } from '@/src/hooks/useThemeColor';

interface QRCodeProps {
  value: string;
  size?: number;
}

export function QRCode({ value, size = 160 }: QRCodeProps) {
  const colors = useThemeColor();

  const qr = qrcode(0, 'M');
  qr.addData(value);
  qr.make();

  const moduleCount = qr.getModuleCount();
  const cellSize = size / moduleCount;

  const rows: boolean[][] = [];
  for (let r = 0; r < moduleCount; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < moduleCount; c++) {
      row.push(qr.isDark(r, c));
    }
    rows.push(row);
  }

  return (
    <View style={{ width: size, height: size }}>
      {rows.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row' }}>
          {row.map((dark, c) => (
            <View
              key={c}
              style={{
                width: cellSize,
                height: cellSize,
                backgroundColor: dark ? colors.foreground : 'transparent',
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
