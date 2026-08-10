import { jest } from '@jest/globals';
import { optimizeRoutes } from '../../controllers/optimizeController.js';

const DEPOT = { lat: -7.7391893, lng: 110.4026205 };

// Bins are passed in the request body, not read from the database — the
// controller runs the GA in-process rather than calling an external service.
const makeBins = (count, fillLevel = 90) =>
  Array.from({ length: count }, (_, i) => ({
    id: `bin-${i + 1}`,
    name: `Bin ${i + 1}`,
    lat: DEPOT.lat + (i + 1) * 0.002,
    lng: DEPOT.lng + (i + 1) * 0.0015,
    fillLevel,
  }));

describe('Optimize Controller Tests', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('optimizeRoutes', () => {
    it('should optimize routes for bins that need collection', async () => {
      req.body = { bins: makeBins(9), numTrucks: 3, depot: DEPOT };

      await optimizeRoutes(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.routes).toHaveLength(3);
      expect(response.data.totalBins).toBe(9);
      expect(response.data.totalDistance).toBeGreaterThan(0);
    });

    it('should visit every bin exactly once across all routes', async () => {
      req.body = { bins: makeBins(9), numTrucks: 3, depot: DEPOT };

      await optimizeRoutes(req, res);

      const { routes } = res.json.mock.calls[0][0].data;
      const visited = routes.flatMap((route) => route.bins.map((bin) => bin.id));

      expect(visited).toHaveLength(9);
      expect(new Set(visited).size).toBe(9);
    });

    it('should start and end every route at the depot', async () => {
      req.body = { bins: makeBins(6), numTrucks: 2, depot: DEPOT };

      await optimizeRoutes(req, res);

      const { routes } = res.json.mock.calls[0][0].data;
      routes.forEach((route) => {
        expect(route.points[0]).toEqual([DEPOT.lat, DEPOT.lng]);
        expect(route.points[route.points.length - 1]).toEqual([DEPOT.lat, DEPOT.lng]);
      });
    });

    it('should default to 3 trucks when numTrucks is not provided', async () => {
      req.body = { bins: makeBins(6), depot: DEPOT };

      await optimizeRoutes(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.data.routes).toHaveLength(3);
    });

    it('should skip bins below the 80% fill threshold', async () => {
      req.body = {
        bins: [...makeBins(4, 90), ...makeBins(4, 30)],
        numTrucks: 2,
        depot: DEPOT,
      };

      await optimizeRoutes(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.data.totalBins).toBe(4);
    });

    it('should return empty routes when no bin needs collection', async () => {
      req.body = { bins: makeBins(5, 20), numTrucks: 2, depot: DEPOT };

      await optimizeRoutes(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.totalBins).toBe(0);
      expect(response.data.totalDistance).toBe(0);
      expect(response.data.routes).toHaveLength(2);
      response.data.routes.forEach((route) => expect(route.bins).toEqual([]));
    });

    it('should return 400 if no bins are provided', async () => {
      req.body = { bins: [], numTrucks: 3, depot: DEPOT };

      await optimizeRoutes(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Bins data is required',
      });
    });

    it('should return 400 if depot is missing', async () => {
      req.body = { bins: makeBins(3), numTrucks: 3 };

      await optimizeRoutes(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Depot location is required',
      });
    });

    it('should not produce a route worse than the greedy nearest neighbor order', async () => {
      // The GA seeds its population with a nearest neighbor tour, so its result
      // can never be worse than that baseline.
      const bins = makeBins(12);
      req.body = { bins, numTrucks: 1, depot: DEPOT };

      await optimizeRoutes(req, res);

      const { routes } = res.json.mock.calls[0][0].data;

      // Nearest neighbor baseline over the same bins
      const remaining = [...bins];
      let current = { lat: DEPOT.lat, lng: DEPOT.lng };
      let baseline = 0;
      const haversine = (a, b) => {
        const R = 6371;
        const toRad = (d) => (d * Math.PI) / 180;
        const dLat = toRad(b.lat - a.lat);
        const dLon = toRad(b.lng - a.lng);
        const x =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
      };

      while (remaining.length) {
        let k = 0;
        let min = haversine(current, remaining[0]);
        for (let i = 1; i < remaining.length; i++) {
          const d = haversine(current, remaining[i]);
          if (d < min) {
            min = d;
            k = i;
          }
        }
        baseline += min;
        current = remaining[k];
        remaining.splice(k, 1);
      }
      baseline += haversine(current, { lat: DEPOT.lat, lng: DEPOT.lng });

      expect(routes[0].totalDistance).toBeLessThanOrEqual(baseline + 1e-6);
    });

    it('should return 400 if the depot is missing a coordinate', async () => {
      req.body = { bins: makeBins(3), numTrucks: 1, depot: { lat: DEPOT.lat } };

      await optimizeRoutes(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Depot location is required',
      });
    });
  });
});
