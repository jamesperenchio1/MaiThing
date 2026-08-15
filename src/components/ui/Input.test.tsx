import { screen, fireEvent } from '@testing-library/react-native';

import { renderWithProviders } from '@/src/test/setup';
import { Input } from './Input';

describe('Input', () => {
  it('renders its label', async () => {
    await renderWithProviders(<Input label="Email" />);
    expect(screen.getByText('Email')).toBeTruthy();
  });

  it('exposes the label as the accessible name', async () => {
    await renderWithProviders(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeTruthy();
  });

  it('shows an error message when the error prop is set', async () => {
    await renderWithProviders(<Input label="Email" error="Please enter a valid email" />);
    expect(screen.getByText('Please enter a valid email')).toBeTruthy();
  });

  it('does not render an error message when there is no error', async () => {
    await renderWithProviders(<Input label="Email" />);
    expect(screen.queryByText(/invalid/i)).toBeNull();
  });

  it('calls onChangeText when text is typed', async () => {
    const onChangeText = jest.fn();
    await renderWithProviders(<Input label="Email" onChangeText={onChangeText} />);

    fireEvent.changeText(screen.getByLabelText('Email'), 'hello@example.com');

    expect(onChangeText).toHaveBeenCalledWith('hello@example.com');
  });

  it('shows a character count when showCharacterCount and maxLength are set', async () => {
    await renderWithProviders(
      <Input label="Bio" value="hello" showCharacterCount maxLength={20} onChangeText={() => {}} />
    );

    expect(screen.getByText('5/20')).toBeTruthy();
  });
});
