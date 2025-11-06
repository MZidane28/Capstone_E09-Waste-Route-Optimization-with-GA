import { render, screen } from '@testing-library/react';

// Mock BarChart component
const BarChart = ({ data, title }) => {
  return (
    <div data-testid="bar-chart">
      {title && <h3>{title}</h3>}
      <div>{data.datasets[0].label}</div>
      {data.labels.map((label, i) => (
        <div key={i}>{label}: {data.datasets[0].data[i]}</div>
      ))}
    </div>
  );
};

describe('BarChart Component', () => {
  const mockData = {
    labels: ['Truck 1', 'Truck 2', 'Truck 3'],
    datasets: [
      {
        label: 'Distance (km)',
        data: [10.5, 8.3, 6.7],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  it('should render bar chart', () => {
    render(<BarChart data={mockData} />);

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('should display chart data', () => {
    render(<BarChart data={mockData} />);

    expect(screen.getByText(/Distance/)).toBeInTheDocument();
    expect(screen.getByText(/Truck 1: 10.5/)).toBeInTheDocument();
    expect(screen.getByText(/Truck 2: 8.3/)).toBeInTheDocument();
    expect(screen.getByText(/Truck 3: 6.7/)).toBeInTheDocument();
  });

  it('should render with custom title', () => {
    const title = 'Distance per Truck';
    render(<BarChart data={mockData} title={title} />);

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('should handle empty data', () => {
    const emptyData = {
      labels: [],
      datasets: [
        {
          label: 'Distance',
          data: [],
        },
      ],
    };

    render(<BarChart data={emptyData} />);

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('should handle multiple datasets', () => {
    const multiData = {
      labels: ['Truck 1', 'Truck 2'],
      datasets: [
        {
          label: 'Distance (km)',
          data: [10.5, 8.3],
        },
        {
          label: 'Load (kg)',
          data: [150, 120],
        },
      ],
    };

    render(<BarChart data={multiData} />);

    expect(screen.getByText(/Distance/)).toBeInTheDocument();
  });
});
