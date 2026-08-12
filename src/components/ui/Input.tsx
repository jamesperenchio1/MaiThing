import { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { cn } from '@/src/lib/utils';
import { Text } from './Text';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
  inputClassName?: string;
  showCharacterCount?: boolean;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  containerClassName,
  inputClassName,
  editable,
  showCharacterCount,
  maxLength,
  value,
  defaultValue,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const disabled = editable === false;

  const currentValue = value ?? defaultValue ?? '';
  const charCount = String(currentValue).length;
  const isNearLimit = maxLength ? charCount >= maxLength * 0.5 : false;
  const isAtLimit = maxLength ? charCount >= maxLength : false;

  return (
    <View className={cn('mb-4', containerClassName)}>
      {label && (
        <Text variant="label" className="mb-2 ml-1">
          {label}
        </Text>
      )}
      <View
        className={cn(
          'flex-row items-center rounded-2xl border border-border bg-card px-4 py-3.5',
          isFocused && 'border-primary',
          error && 'border-danger',
          disabled && 'opacity-50'
        )}
      >
        {leftIcon && <View className="mr-3">{leftIcon}</View>}
        <TextInput
          className={cn('flex-1 py-2 text-base leading-7 text-foreground', inputClassName)}
          placeholderTextColor="#9CA3AF"
          value={value}
          defaultValue={defaultValue}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        {rightIcon && <View className="ml-3">{rightIcon}</View>}
      </View>
      {error && (
        <Text variant="caption" className="mt-1.5 ml-1 text-danger">
          {error}
        </Text>
      )}
      {showCharacterCount && maxLength && (
        <Text
          variant="caption"
          className={cn(
            'mt-1.5 ml-1 text-right',
            isAtLimit ? 'text-danger' : isNearLimit ? 'text-amber-500' : 'text-muted'
          )}
        >
          {charCount}/{maxLength}
        </Text>
      )}
    </View>
  );
}
