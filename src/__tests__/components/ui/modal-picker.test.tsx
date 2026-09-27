import { fireEvent, render, screen } from '@testing-library/react-native';

import { ModalPicker } from '@/components/ui/modal-picker';

describe('ModalPicker', () => {
  it('shows an accessible clear control for a selected value', () => {
    const onValueChange = jest.fn();
    render(
      <ModalPicker
        title="Select Category"
        items={[{ label: 'News', value: 'news' }]}
        selectedValue="news"
        onValueChange={onValueChange}
      />,
    );

    fireEvent.press(screen.getByTestId('modal-picker-clear'));

    expect(onValueChange).toHaveBeenCalledWith(null);
  });

  it('renders the modal close label as text and closes the picker', () => {
    render(
      <ModalPicker
        title="Select Country"
        items={[]}
        selectedValue={null}
        onValueChange={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Select Country: Select...' }));
    fireEvent.press(screen.getByText('Close'));

    expect(screen.queryByText('Select Country')).toBeNull();
  });
});
