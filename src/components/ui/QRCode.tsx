import qrcode from 'qrcode-generator';
import { View } from 'react-native';

interface QRCodeProps {
  value: string;
  size?: number;
}

export function QRCode({ value, size = 160 }: QRCodeProps) {
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
              // eslint-disable-next-line react-native/no-color-literals -- QR modules must stay fixed black/transparent regardless of theme or scanners can't read them
              style={{
                width: cellSize,
                height: cellSize,
                backgroundColor: dark ? '#000000' : 'transparent',
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
