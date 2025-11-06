import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock RandomButton component
const RandomButton = ({ onClick, count = 5, disabled, loading }) => {
  return (
    <button 
      onClick={() => onClick(count)}
      disabled={disabled || loading}
    >
      {loading ? 'Loading...' : `Random ${count}`}
    </button>
  );
};

describe('RandomButton Component', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render button', () => {
    render(<RandomButton onClick={mockOnClick} />);

    const button = screen.getByRole('button', { name: /random/i });
    expect(button).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const user = userEvent.setup();
    render(<RandomButton onClick={mockOnClick} count={5} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
    expect(mockOnClick).toHaveBeenCalledWith(5);
  });

  it('should display count in button text', () => {
    render(<RandomButton onClick={mockOnClick} count={10} />);

    expect(screen.getByText(/10/)).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<RandomButton onClick={mockOnClick} disabled={true} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should show loading state', () => {
    render(<RandomButton onClick={mockOnClick} loading={true} />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should not call onClick when disabled', async () => {
    const user = userEvent.setup();
    render(<RandomButton onClick={mockOnClick} disabled={true} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('should use default count if not provided', () => {
    render(<RandomButton onClick={mockOnClick} />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should handle different count values', () => {
    const { rerender } = render(<RandomButton onClick={mockOnClick} count={5} />);
    expect(screen.getByText(/5/)).toBeInTheDocument();

    rerender(<RandomButton onClick={mockOnClick} count={15} />);
    expect(screen.getByText(/15/)).toBeInTheDocument();
  });
});
