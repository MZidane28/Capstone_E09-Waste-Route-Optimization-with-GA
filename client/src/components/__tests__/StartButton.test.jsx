import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock StartButton component
const StartButton = ({ onClick, disabled, loading, text, className }) => {
  return (
    <button 
      onClick={onClick}
      disabled={disabled || loading}
      className={className}
    >
      {loading ? 'Loading...' : (text || 'Start Optimization')}
    </button>
  );
};

describe('StartButton Component', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render button with default text', () => {
    render(<StartButton onClick={mockOnClick} />);

    const button = screen.getByRole('button', { name: /start optimization/i });
    expect(button).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const user = userEvent.setup();
    render(<StartButton onClick={mockOnClick} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<StartButton onClick={mockOnClick} disabled={true} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should show loading state', () => {
    render(<StartButton onClick={mockOnClick} loading={true} />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should not call onClick when disabled', async () => {
    const user = userEvent.setup();
    render(<StartButton onClick={mockOnClick} disabled={true} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('should render custom text when provided', () => {
    render(<StartButton onClick={mockOnClick} text="Run GA Algorithm" />);

    expect(screen.getByText('Run GA Algorithm')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<StartButton onClick={mockOnClick} className="custom-class" />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });
});
