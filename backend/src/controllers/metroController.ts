import { Request, Response } from 'express';
import { MOCK_METRO_LINES, MetroRouteResult } from '../providers/mock/mockMetroData.js';

export class MetroController {
  static getLines(_req: Request, res: Response) {
    res.json({ success: true, data: MOCK_METRO_LINES });
  }

  static getMapData(_req: Request, res: Response) {
    res.json({
      success: true,
      data: {
        city: 'Mumbai',
        networkName: 'Maha Mumbai Metro',
        lines: MOCK_METRO_LINES,
      },
    });
  }

  static searchRoute(req: Request, res: Response) {
    const { from, to } = req.query as { from?: string; to?: string };
    if (!from || !to) {
      return res.status(400).json({ success: false, error: 'From and To station parameters are required.' });
    }

    const fromLower = from.toLowerCase();
    const toLower = to.toLowerCase();

    // Check if both stations are on the same line
    for (const line of MOCK_METRO_LINES) {
      const fromStation = line.stations.find(
        (s) => s.code.toLowerCase() === fromLower || s.name.toLowerCase().includes(fromLower)
      );
      const toStation = line.stations.find(
        (s) => s.code.toLowerCase() === toLower || s.name.toLowerCase().includes(toLower)
      );

      if (fromStation && toStation) {
        const minSeq = Math.min(fromStation.sequence, toStation.sequence);
        const maxSeq = Math.max(fromStation.sequence, toStation.sequence);
        const stopsCount = maxSeq - minSeq;
        const estMinutes = stopsCount * 2 + 1;

        const pathSlice = line.stations
          .filter((s) => s.sequence >= minSeq && s.sequence <= maxSeq)
          .map((s) => s.name);

        if (fromStation.sequence > toStation.sequence) {
          pathSlice.reverse();
        }

        const result: MetroRouteResult = {
          fromStation: fromStation.name,
          toStation: toStation.name,
          sameLine: true,
          linesUsed: [line.name],
          interchangeStations: [],
          stopsCount,
          estimatedMinutes: estMinutes,
          fareToken: Math.min(60, Math.max(10, stopsCount * 5)),
          fareCard: Math.min(54, Math.max(9, stopsCount * 4.5)),
          firstTrain: line.firstTrainTime,
          lastTrain: line.lastTrainTime,
          frequency: `Every ${line.frequencyMinutes} minutes`,
          path: pathSlice,
        };

        return res.json({ success: true, data: result });
      }
    }

    // Default connecting route (e.g. Versova to BKC or Dahisar to Ghatkopar)
    const result: MetroRouteResult = {
      fromStation: from,
      toStation: to,
      sameLine: false,
      linesUsed: ['Blue Line 1', 'Yellow Line 2A / Aqua Line 3'],
      interchangeStations: ['D.N. Nagar / Andheri West'],
      stopsCount: 8,
      estimatedMinutes: 22,
      fareToken: 30,
      fareCard: 27,
      firstTrain: '05:30 AM',
      lastTrain: '11:15 PM',
      frequency: 'Every 4-5 minutes',
      path: [from, 'Interchange at D.N. Nagar', to],
    };

    return res.json({ success: true, data: result });
  }

  static getStationIndicator(req: Request, res: Response) {
    const stationQuery = (req.query.station as string || 'GHK').toLowerCase();

    // Find stations matching query
    const matchedStations: any[] = [];
    for (const line of MOCK_METRO_LINES) {
      const match = line.stations.find(
        (s) => s.code.toLowerCase() === stationQuery || s.name.toLowerCase().includes(stationQuery)
      );
      if (match) {
        matchedStations.push({ station: match, line });
      }
    }

    const nextTrains = [
      {
        lineName: matchedStations[0]?.line.name || 'Blue Line 1',
        destination: matchedStations[0]?.line.terminalTo || 'Ghatkopar',
        platform: '1',
        etaMinutes: 2,
        status: 'Approaching',
      },
      {
        lineName: matchedStations[0]?.line.name || 'Blue Line 1',
        destination: matchedStations[0]?.line.terminalFrom || 'Versova',
        platform: '2',
        etaMinutes: 5,
        status: 'On Time',
      },
      {
        lineName: matchedStations[0]?.line.name || 'Blue Line 1',
        destination: matchedStations[0]?.line.terminalTo || 'Ghatkopar',
        platform: '1',
        etaMinutes: 9,
        status: 'Scheduled',
      },
    ];

    res.json({
      success: true,
      data: {
        station: matchedStations[0]?.station.name || req.query.station || 'Ghatkopar',
        line: matchedStations[0]?.line.name || 'Blue Line 1',
        color: matchedStations[0]?.line.color || '#0284C7',
        nextTrains,
      },
    });
  }
}
