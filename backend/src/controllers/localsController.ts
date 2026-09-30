import { Request, Response } from 'express';
import { MOCK_LOCAL_TRAINS, MUMBAI_LOCAL_LINES, LocalStationIndicatorTrain } from '../providers/mock/mockLocalData.js';
import { matchesCategory } from '../utils/trainCategory.js';

export class LocalsController {
  static getLines(_req: Request, res: Response) {
    res.json({ success: true, data: MUMBAI_LOCAL_LINES });
  }

  static search(req: Request, res: Response) {
    const { from, to, line, type } = req.query as { from?: string; to?: string; line?: string; type?: string };

    let results = [...MOCK_LOCAL_TRAINS];

    if (line) {
      results = results.filter((t) => t.line.toLowerCase() === line.toLowerCase());
    }

    // Single shared category rule (mirrors frontend/src/utils/trainCategory.ts).
    // Handles the 'All' sentinel and grouped pills (Local / Express / Superfast / Shatabdi).
    if (type) {
      results = results.filter((t) => matchesCategory(t.type, type));
    }

    if (from && to) {
      const fromLower = from.toLowerCase();
      const toLower = to.toLowerCase();

      results = results.filter((train) => {
        const fromIdx = train.stops.findIndex(
          (s) => s.stationCode.toLowerCase() === fromLower || s.stationName.toLowerCase().includes(fromLower)
        );
        const toIdx = train.stops.findIndex(
          (s) => s.stationCode.toLowerCase() === toLower || s.stationName.toLowerCase().includes(toLower)
        );
        return fromIdx !== -1 && toIdx !== -1 && fromIdx < toIdx;
      });
    } else if (from) {
      const fromLower = from.toLowerCase();
      results = results.filter((train) =>
        train.stops.some(
          (s) => s.stationCode.toLowerCase() === fromLower || s.stationName.toLowerCase().includes(fromLower)
        )
      );
    }

    res.json({ success: true, data: results });
  }

  static getStationIndicator(req: Request, res: Response) {
    const stationQuery = (req.query.station as string || 'BOR').toLowerCase();

    // Find all trains that stop at or pass this station
    const matched = MOCK_LOCAL_TRAINS.filter((train) =>
      train.stops.some(
        (s) => s.stationCode.toLowerCase() === stationQuery || s.stationName.toLowerCase().includes(stationQuery)
      )
    );

    const indicatorTrains: LocalStationIndicatorTrain[] = matched.map((train) => {
      const stop = train.stops.find(
        (s) => s.stationCode.toLowerCase() === stationQuery || s.stationName.toLowerCase().includes(stationQuery)
      )!;

      return {
        trainNumber: train.trainNumber,
        destination: train.destinationName,
        destinationCode: train.destinationCode,
        departureTime: stop.departureTime,
        expectedTime: stop.departureTime,
        platform: stop.platform || train.platform,
        delayMinutes: train.delayMinutes,
        speedType: train.type.includes('Fast') ? 'FAST' : 'SLOW',
        isAc: train.type.includes('AC'),
        cars: train.cars as 12 | 15,
        status: train.status,
      };
    });

    res.json({
      success: true,
      data: {
        station: req.query.station || 'Boisar',
        stationCode: stationQuery.toUpperCase(),
        timestamp: new Date().toISOString(),
        trains: indicatorTrains,
      },
    });
  }
}
