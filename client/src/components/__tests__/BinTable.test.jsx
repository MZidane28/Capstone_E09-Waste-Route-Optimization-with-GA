import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BinTable from '../BinTable';

// Mock API
jest.mock('@/lib/api', () => ({
  getAllBins: jest.fn(),
}));

import { getAllBins } from '@/lib/api';

describe('BinTable Component', () => {
  const mockBins = [
    {
      _id: '1',
      name: 'Bin A',
      location: { lat: -6.2088, lon: 106.8456 },
      capacity: 100,
      demand: 50,
      is_real: true,
    },
    {
      _id: '2',
      name: 'Bin B',
      location: { lat: -6.2089, lon: 106.8457 },
      capacity: 100,
      demand: 75,
      is_real: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    getAllBins.mockReturnValue(new Promise(() => {})); // Never resolves

    render(<BinTable />);

    expect(screen.getByText(/loading data/i)).toBeInTheDocument();
  });

  it('should render bins table with data', async () => {
    getAllBins.mockResolvedValue({ data: mockBins });

    render(<BinTable />);

    await waitFor(() => {
      expect(screen.getByText('Bin A')).toBeInTheDocument();
      expect(screen.getByText('Bin B')).toBeInTheDocument();
    });

    // Check demand/capacity display
    expect(screen.getByText(/50\/100/)).toBeInTheDocument();
    expect(screen.getByText(/75\/100/)).toBeInTheDocument();
  });

  it('should handle empty bins list', async () => {
    getAllBins.mockResolvedValue({ data: [] });

    render(<BinTable />);

    await waitFor(() => {
      expect(screen.getByText(/no bins found/i)).toBeInTheDocument();
    });
  });

  it('should handle API error', async () => {
    getAllBins.mockRejectedValue(new Error('API Error'));

    render(<BinTable />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('should calculate fill percentage correctly', async () => {
    getAllBins.mockResolvedValue({ data: mockBins });

    render(<BinTable />);

    await waitFor(() => {
      // Bin A: 50/100 = 50%
      expect(screen.getByText('50%')).toBeInTheDocument();
      // Bin B: 75/100 = 75%
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });

  it('should display location coordinates', async () => {
    getAllBins.mockResolvedValue({ data: mockBins });

    render(<BinTable />);

    await waitFor(() => {
      // Check if coordinates are displayed (formatted to 4 decimals)
      expect(screen.getByText(/-6.2088, 106.8456/)).toBeInTheDocument();
    });
  });

  it('should refresh data when refresh button is clicked', async () => {
    getAllBins.mockResolvedValue({ data: mockBins });

    const user = userEvent.setup();
    render(<BinTable />);

    await waitFor(() => {
      expect(screen.getByText('Bin A')).toBeInTheDocument();
    });

    expect(getAllBins).toHaveBeenCalledTimes(1);

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    await waitFor(() => {
      expect(getAllBins).toHaveBeenCalledTimes(2);
    });
  });

  it('should display total count', async () => {
    getAllBins.mockResolvedValue({ data: mockBins });

    render(<BinTable />);

    await waitFor(() => {
      expect(screen.getByText(/Total: 2 bins/)).toBeInTheDocument();
    });
  });

  it('should filter bins by search', async () => {
    getAllBins.mockResolvedValue({ data: mockBins });

    const user = userEvent.setup();
    render(<BinTable />);

    await waitFor(() => {
      expect(screen.getByText('Bin A')).toBeInTheDocument();
      expect(screen.getByText('Bin B')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/cari alamat/i);
    await user.type(searchInput, 'Bin A');

    await waitFor(() => {
      expect(screen.getByText('Bin A')).toBeInTheDocument();
      expect(screen.queryByText('Bin B')).not.toBeInTheDocument();
    });
  });
});
