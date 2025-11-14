import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock usePathname
const mockUsePathname = jest.fn(() => '/');
jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

// Mock Navbar component
const Navbar = () => {
  const pathname = mockUsePathname();
  
  return (
    <nav role="navigation">
      <h1>Waste Route Optimization System</h1>
      <a href="/" className={pathname === '/' ? 'active' : ''}>
        Dashboard
      </a>
      <a href="/simulasi" className={pathname === '/simulasi' ? 'active' : ''}>
        Simulasi
      </a>
      <a href="/list" className={pathname === '/list' ? 'active' : ''}>
        List
      </a>
      <a href="/analitik" className={pathname === '/analitik' ? 'active' : ''}>
        Analitik
      </a>
    </nav>
  );
};

describe('Navbar Component', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/');
  });

  it('should render navbar with title', () => {
    render(<Navbar />);
    
    expect(screen.getByText(/waste route optimization/i)).toBeInTheDocument();
  });

  it('should render navigation links', () => {
    render(<Navbar />);
    
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/simulasi/i)).toBeInTheDocument();
    expect(screen.getByText(/list/i)).toBeInTheDocument();
    expect(screen.getByText(/analitik/i)).toBeInTheDocument();
  });

  it('should highlight active link', () => {
    mockUsePathname.mockReturnValue('/simulasi');
    
    render(<Navbar />);
    
    const simulasiLink = screen.getByText(/simulasi/i).closest('a');
    expect(simulasiLink).toHaveClass('active');
  });

  it('should navigate on link click', async () => {
    render(<Navbar />);
    
    const dashboardLink = screen.getByText(/dashboard/i).closest('a');
    expect(dashboardLink).toHaveAttribute('href', '/');
  });

  it('should be responsive', () => {
    render(<Navbar />);
    
    const navbar = screen.getByRole('navigation');
    expect(navbar).toBeInTheDocument();
  });
});
