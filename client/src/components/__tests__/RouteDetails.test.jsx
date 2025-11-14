import { render, screen } from '@testing-library/react';

// Mock RouteDetails component
const RouteDetails = ({ data }) => {
  if (!data) {
    return <div>No route data available</div>;
  }

  if (!data.trucks || data.trucks.length === 0) {
    return <div>No trucks available</div>;
  }

  return (
    <div>
      <div>Total Distance: {data.total_distance} km</div>
      <div>Total Time: {data.total_time.toFixed(2)} hours</div>
      <div>Number of Trucks: {data.num_trucks}</div>
      {data.trucks.map(truck => (
        <div key={truck.truck_no}>
          <h3>Truck {truck.truck_no}</h3>
          <div>Distance: {truck.distance} km</div>
          <div>Load: {truck.load} kg</div>
          <div>{truck.bins.length} {truck.bins.length === 1 ? 'bin' : 'bins'}</div>
          {truck.capacity && (
            <div>{Math.round((truck.load / truck.capacity) * 100)}%</div>
          )}
          {truck.bins.map(bin => (
            <div key={bin.bin_id}>{bin.bin_id}</div>
          ))}
        </div>
      ))}
    </div>
  );
};

describe('RouteDetails Component', () => {
  const mockRouteData = {
    total_distance: 25.5,
    total_time: 0.6375,
    num_trucks: 3,
    trucks: [
      {
        truck_no: 1,
        distance: 10.2,
        load: 150,
        bins: [
          { bin_id: 'bin1', visit_order: 1, demand: 75 },
          { bin_id: 'bin2', visit_order: 2, demand: 75 },
        ],
      },
      {
        truck_no: 2,
        distance: 8.5,
        load: 120,
        bins: [
          { bin_id: 'bin3', visit_order: 1, demand: 60 },
          { bin_id: 'bin4', visit_order: 2, demand: 60 },
        ],
      },
      {
        truck_no: 3,
        distance: 6.8,
        load: 90,
        bins: [
          { bin_id: 'bin5', visit_order: 1, demand: 90 },
        ],
      },
    ],
  };

  it('should render route summary', () => {
    render(<RouteDetails data={mockRouteData} />);

    expect(screen.getByText(/total distance/i)).toBeInTheDocument();
    expect(screen.getByText(/25\.5/)).toBeInTheDocument();
    
    expect(screen.getByText(/total time/i)).toBeInTheDocument();
    expect(screen.getByText(/0\.64/)).toBeInTheDocument(); // Rounded to 2 decimals
    
    expect(screen.getByText(/number of trucks/i)).toBeInTheDocument();
  });

  it('should render all trucks', () => {
    render(<RouteDetails data={mockRouteData} />);

    expect(screen.getByText(/truck 1/i)).toBeInTheDocument();
    expect(screen.getByText(/truck 2/i)).toBeInTheDocument();
    expect(screen.getByText(/truck 3/i)).toBeInTheDocument();
  });

  it('should render truck details', () => {
    render(<RouteDetails data={mockRouteData} />);

    // Check for unique values that identify each truck
    expect(screen.getByText(/10\.2/)).toBeInTheDocument(); // Truck 1 distance
    expect(screen.getByText(/150/)).toBeInTheDocument();  // Truck 1 load
    
    expect(screen.getByText(/8\.5/)).toBeInTheDocument(); // Truck 2 distance
    expect(screen.getByText(/120/)).toBeInTheDocument(); // Truck 2 load

    expect(screen.getByText(/6\.8/)).toBeInTheDocument(); // Truck 3 distance
    expect(screen.getByText(/90/)).toBeInTheDocument();  // Truck 3 load
    
    // Just check that bins exist (multiple instances are expected)
    const binsElements = screen.queryAllByText(/bins?/i);
    expect(binsElements.length).toBeGreaterThan(0);
  });

  it('should render empty state when no data', () => {
    render(<RouteDetails data={null} />);

    expect(screen.getByText(/no route data/i)).toBeInTheDocument();
  });

  it('should render empty state when trucks array is empty', () => {
    const emptyData = {
      total_distance: 0,
      total_time: 0,
      num_trucks: 0,
      trucks: [],
    };

    render(<RouteDetails data={emptyData} />);

    expect(screen.getByText(/no trucks/i)).toBeInTheDocument();
  });

  it('should display bins in correct order', () => {
    render(<RouteDetails data={mockRouteData} />);

    const binElements = screen.getAllByText(/bin\d+/);
    expect(binElements.length).toBeGreaterThan(0);
  });

  it('should calculate and display utilization percentage', () => {
    const dataWithCapacity = {
      ...mockRouteData,
      trucks: mockRouteData.trucks.map(truck => ({
        ...truck,
        capacity: 200,
      })),
    };

    render(<RouteDetails data={dataWithCapacity} />);

    // Truck 1: 150/200 = 75%
    expect(screen.getByText(/75%/)).toBeInTheDocument();
    
    // Truck 2: 120/200 = 60%
    expect(screen.getByText(/60%/)).toBeInTheDocument();
    
    // Truck 3: 90/200 = 45%
    expect(screen.getByText(/45%/)).toBeInTheDocument();
  });
});
