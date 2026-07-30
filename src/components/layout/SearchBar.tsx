import { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { cn } from '@/src/lib/utils';
import { PressableScale } from '@/src/components/ui/PressableScale';
import { useThemeColor } from '@/src/hooks/useThemeColor';

interface SearchBarProps extends Omit<TextInputProps, 'onChangeText'> {
  value?: string;
  onChangeText?: (text: string) => void;
  onSubmit?: (text: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'Search',
  className,
  ...props
}: SearchBarProps) {
  const [text, setText] = useState(value ?? '');
  const colors = useThemeColor();

  const currentText = value ?? text;

  const handleChange = (newText: string) => {
    setText(newText);
    onChangeText?.(newText);
  };

  const handleClear = () => {
    setText('');
    onChangeText?.('');
  };

  return (
    <View className={cn('flex-row items-center rounded-2xl bg-muted/10 px-4 py-3', className)}>
      <Search size={20} color={colors.muted} className="mr-3" />
      <TextInput
        className="flex-1 text-base text-foreground"
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        value={currentText}
        onChangeText={handleChange}
        onSubmitEditing={() => onSubmit?.(currentText)}
        returnKeyType="search"
        {...props}
      />
      {currentText.length > 0 && (
        <PressableScale onPress={handleClear}>
          <View className="ml-2 rounded-full bg-muted/20 p-1">
            <X size={14} color={colors.muted} />
          </View>
        </PressableScale>
      )}
    </View>
  );
}
