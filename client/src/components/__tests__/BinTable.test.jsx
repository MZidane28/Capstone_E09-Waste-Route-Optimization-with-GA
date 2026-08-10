import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BinTable from '../BinTable';

// BinTable fetches straight from the bins endpoint with the global fetch —
// it does not go through the axios wrapper in @/lib/api.
describe('BinTable Component', () => {
  const mockBins = [
    {
      _id: '1',
      bin_id: 'BIN_001',
      name: 'Bin A',
      location: { lat: -6.2088, lon: 106.8456 },
      capacity: 100,
      fill_rate: 10,
      current_fill_ga: 50,
      is_real: true,
    },
    {
      _id: '2',
      bin_id: 'BIN_002',
      name: 'Bin B',
      location: { lat: -6.2089, lon: 106.8457 },
      capacity: 100,
      fill_rate: 10,
      current_fill_ga: 85,
      is_real: false,
    },
  ];

  const mockFetchOnce = (data) => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => data,
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete global.fetch;
  });

  it('should render loading state initially', () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {})); // Never resolves

    render(<BinTable />);

    expect(screen.getByText(/loading data/i)).toBeInTheDocument();
  });

  it('should render bins table with data', async () => {
    mockFetchOnce(mockBins);

    render(<BinTable />);

    await waitFor(() => {
      expect(screen.getByText('Bin A')).toBeInTheDocument();
      expect(screen.getByText('Bin B')).toBeInTheDocument();
    });

    expect(screen.getByText('BIN_001')).toBeInTheDocument();
    expect(screen.getByText('BIN_002')).toBeInTheDocument();
  });

  it('should handle empty bins list', async () => {
    mockFetchOnce([]);

    render(<BinTable />);

    await waitFor(() => {
      expect(screen.getByText('Total Bins:')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /semua \(0\)/i })).toBeInTheDocument();
  });

  it('should handle API error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('API Error'));

    render(<BinTable />);

    await waitFor(() => {
      expect(screen.getByText(/gagal memuat data tong sampah/i)).toBeInTheDocument();
    });
  });

  it('should handle a non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) });

    render(<BinTable />);

    await waitFor(() => {
      expect(screen.getByText(/gagal memuat data tong sampah/i)).toBeInTheDocument();
    });
  });

  it('should calculate fill percentage from current_fill_ga over capacity', async () => {
    mockFetchOnce(mockBins);

    render(<BinTable />);

    await waitFor(() => {
      // Bin A: 50/100 = 50%
      expect(screen.getByText('50%')).toBeInTheDocument();
      // Bin B: 85/100 = 85%
      expect(screen.getByText('85%')).toBeInTheDocument();
    });
  });

  it('should count bins that need collection at 80% or above', async () => {
    mockFetchOnce(mockBins);

    render(<BinTable />);

    await waitFor(() => {
      expect(screen.getByText('Perlu Diambil:')).toBeInTheDocument();
    });

    // Only Bin B is at or above the threshold
    const needsCollection = screen.getByText('Perlu Diambil:').nextElementSibling;
    expect(needsCollection).toHaveTextContent('1');
  });

  it('should label sensor and simulation bins', async () => {
    mockFetchOnce(mockBins);

    render(<BinTable />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sensor \(1\)/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /simulasi \(1\)/i })).toBeInTheDocument();
    });
  });

  it('should display total count', async () => {
    mockFetchOnce(mockBins);

    render(<BinTable />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /semua \(2\)/i })).toBeInTheDocument();
    });

    const total = screen.getByText('Total Bins:').nextElementSibling;
    expect(total).toHaveTextContent('2');
  });

  it('should filter bins by search', async () => {
    mockFetchOnce(mockBins);

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

  it('should filter bins by ID as well as name', async () => {
    mockFetchOnce(mockBins);

    const user = userEvent.setup();
    render(<BinTable />);

    await waitFor(() => {
      expect(screen.getByText('BIN_001')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText(/cari alamat/i), 'BIN_002');

    await waitFor(() => {
      expect(screen.getByText('BIN_002')).toBeInTheDocument();
      expect(screen.queryByText('BIN_001')).not.toBeInTheDocument();
    });
  });

  it('should filter to sensor bins only', async () => {
    mockFetchOnce(mockBins);

    const user = userEvent.setup();
    render(<BinTable />);

    await waitFor(() => {
      expect(screen.getByText('Bin A')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /sensor \(1\)/i }));

    await waitFor(() => {
      expect(screen.getByText('Bin A')).toBeInTheDocument();
      expect(screen.queryByText('Bin B')).not.toBeInTheDocument();
    });
  });
});
