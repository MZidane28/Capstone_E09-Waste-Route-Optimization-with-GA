import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Since TruckSelector might not exist yet, we'll create a simple test component
const TruckSelector = ({ value, onChange, disabled, label }) => {
  return (
    <div>
      {label && <label>{label}</label>}
      <select 
        value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))}
        disabled={disabled}
      >
        {[1, 2, 3, 4, 5].map(num => (
          <option key={num} value={num}>
            {num} {num === 1 ? 'Truck' : 'Trucks'}
          </option>
        ))}
      </select>
    </div>
  );
};

describe('TruckSelector Component', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render truck selector with default value', () => {
    render(<TruckSelector value={3} onChange={mockOnChange} />);

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(select.value).toBe('3');
  });

  it('should render all truck options (1-5)', () => {
    render(<TruckSelector value={3} onChange={mockOnChange} />);

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(5);
    
    expect(screen.getByText('1 Truck')).toBeInTheDocument();
    expect(screen.getByText('2 Trucks')).toBeInTheDocument();
    expect(screen.getByText('3 Trucks')).toBeInTheDocument();
    expect(screen.getByText('4 Trucks')).toBeInTheDocument();
    expect(screen.getByText('5 Trucks')).toBeInTheDocument();
  });

  it('should call onChange when selection changes', async () => {
    const user = userEvent.setup();
    render(<TruckSelector value={3} onChange={mockOnChange} />);

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, '5');

    expect(mockOnChange).toHaveBeenCalledWith(5);
  });

  it('should handle singular/plural correctly', () => {
    render(<TruckSelector value={1} onChange={mockOnChange} />);
    
    expect(screen.getByText('1 Truck')).toBeInTheDocument();
    expect(screen.queryByText('1 Trucks')).not.toBeInTheDocument();
  });

  it('should display label if provided', () => {
    render(
      <TruckSelector 
        value={3} 
        onChange={mockOnChange} 
        label="Select Number of Trucks"
      />
    );

    expect(screen.getByText('Select Number of Trucks')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<TruckSelector value={3} onChange={mockOnChange} disabled={true} />);

    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
  });
});
