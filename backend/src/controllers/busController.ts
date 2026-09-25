import { Request, Response } from 'express';
import { MOCK_BUS_ROUTES, BusRoute } from '../providers/mock/mockBusData.js';

export class BusController {
  static search(req: Request, res: Response) {
    const { query, from, to } = req.query as { query?: string; from?: string; to?: string };

    let results = [...MOCK_BUS_ROUTES];

    if (query) {
      const q = query.trim().toLowerCase();
      results = results.filter(
        (b) =>
          b.busNumber.toLowerCase().includes(q) ||
          b.routeName.toLowerCase().includes(q) ||
          b.fromStop.toLowerCase().includes(q) ||
          b.toStop.toLowerCase().includes(q) ||
          b.stops.some((s) => s.stopName.toLowerCase().includes(q))
      );
    }

    if (from && to) {
      const fromLower = from.trim().toLowerCase();
      const toLower = to.trim().toLowerCase();
      results = results.filter((b) => {
        const fromIdx = b.stops.findIndex((s) => s.stopName.toLowerCase().includes(fromLower));
        const toIdx = b.stops.findIndex((s) => s.stopName.toLowerCase().includes(toLower));
        return fromIdx !== -1 && toIdx !== -1 && fromIdx < toIdx;
      });
    } else if (from) {
      const fromLower = from.trim().toLowerCase();
      results = results.filter((b) => b.stops.some((s) => s.stopName.toLowerCase().includes(fromLower)));
    }

    res.json({ success: true, data: results });
  }

  static getById(req: Request, res: Response) {
    const id = String(req.params.id || '');
    const bus = MOCK_BUS_ROUTES.find(
      (b) => b.id.toLowerCase() === id.toLowerCase() || b.busNumber.toLowerCase() === id.toLowerCase()
    );

    if (!bus) {
      return res.status(404).json({ success: false, error: 'Bus route not found' });
    }

    res.json({ success: true, data: bus });
  }

  static getLiveTracking(req: Request, res: Response) {
    const id = String(req.params.id || '');
    const bus = MOCK_BUS_ROUTES.find(
      (b) => b.id.toLowerCase() === id.toLowerCase() || b.busNumber.toLowerCase() === id.toLowerCase()
    );

    if (!bus) {
      return res.status(404).json({ success: false, error: 'Bus not found' });
    }

    // Dynamic progression simulation
    const trackingInfo = {
      busId: bus.id,
      busNumber: bus.busNumber,
      operator: bus.operator,
      routeName: bus.routeName,
      busType: bus.busType,
      currentLocation: bus.currentLocation,
      nextStop: bus.nextStop,
      destination: bus.toStop,
      speedKmH: bus.currentLocation.speedKmH,
      status: bus.status,
      passengersOccupancy: 'Moderate (Sitting Available)',
      lastGpsPing: '12 seconds ago',
      stops: bus.stops,
    };

    res.json({ success: true, data: trackingInfo });
  }
}
