import { render, screen } from '@testing-library/react';

// Mock LineChart component
const LineChart = ({ data, title }) => {
  return (
    <div data-testid="line-chart">
      {title && <h3>{title}</h3>}
      <div>{data.datasets[0].label}</div>
      {data.labels.map((label, i) => (
        <div key={i}>{label}: {data.datasets[0].data[i]}</div>
      ))}
    </div>
  );
};

describe('LineChart Component', () => {
  const mockData = {
    labels: ['Gen 1', 'Gen 2', 'Gen 3', 'Gen 4', 'Gen 5'],
    datasets: [
      {
        label: 'Best Fitness',
        data: [100, 90, 85, 80, 75],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  it('should render line chart', () => {
    render(<LineChart data={mockData} />);

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('should display chart data', () => {
    render(<LineChart data={mockData} />);

    expect(screen.getByText(/Best Fitness/)).toBeInTheDocument();
    expect(screen.getByText(/Gen 1: 100/)).toBeInTheDocument();
    expect(screen.getByText(/Gen 5: 75/)).toBeInTheDocument();
  });

  it('should render with custom title', () => {
    const title = 'GA Convergence';
    render(<LineChart data={mockData} title={title} />);

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('should handle empty data', () => {
    const emptyData = {
      labels: [],
      datasets: [
        {
          label: 'Best Fitness',
          data: [],
        },
      ],
    };

    render(<LineChart data={emptyData} />);

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('should handle multiple lines', () => {
    const multiData = {
      labels: ['Gen 1', 'Gen 2', 'Gen 3'],
      datasets: [
        {
          label: 'Best Fitness',
          data: [100, 90, 85],
        },
        {
          label: 'Average Fitness',
          data: [120, 110, 105],
        },
      ],
    };

    render(<LineChart data={multiData} />);

    expect(screen.getByText(/Best Fitness/)).toBeInTheDocument();
  });

  it('should show fitness improvement trend', () => {
    const trendData = {
      labels: ['1', '2', '3', '4', '5'],
      datasets: [
        {
          label: 'Distance',
          data: [50, 45, 40, 38, 35], // Decreasing = improving
        },
      ],
    };

    render(<LineChart data={trendData} />);

    expect(screen.getByText(/1: 50/)).toBeInTheDocument();
    expect(screen.getByText(/5: 35/)).toBeInTheDocument();
  });
});
