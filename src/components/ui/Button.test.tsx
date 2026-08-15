import { Text } from 'react-native';
import { screen, fireEvent } from '@testing-library/react-native';

import { renderWithProviders } from '@/src/test/setup';
import { Button } from './Button';

describe('Button', () => {
  it('renders its text content', async () => {
    await renderWithProviders(<Button>Save</Button>);
    expect(screen.getByText('Save')).toBeTruthy();
  });

  it('fires onPress when tapped', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button onPress={onPress}>Save</Button>);

    fireEvent.press(screen.getByText('Save'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire onPress when disabled', async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <Button onPress={onPress} disabled>
        Save
      </Button>
    );

    fireEvent.press(screen.getByText('Save'));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not fire onPress while loading', async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <Button onPress={onPress} loading>
        Save
      </Button>
    );

    fireEvent.press(screen.getByText('Save'));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('sets accessibilityState.disabled when disabled', async () => {
    await renderWithProviders(<Button disabled>Save</Button>);

    expect(screen.getByRole('button').props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });

  it('renders a left icon alongside its text', async () => {
    await renderWithProviders(<Button leftIcon={<Text>icon</Text>}>Save</Button>);

    expect(screen.getByText('icon')).toBeTruthy();
    expect(screen.getByText('Save')).toBeTruthy();
  });
});
