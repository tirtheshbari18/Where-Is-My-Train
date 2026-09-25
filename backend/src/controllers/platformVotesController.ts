import { Request, Response } from 'express';

interface PlatformVoteSummary {
  trainNumber: string;
  stationCode: string;
  platform: string;
  yesCount: number;
  noCount: number;
  notSureCount: number;
  totalVotes: number;
  approvalPercentage: number;
  isCommunityVerified: boolean;
}

// In-memory votes store with baseline verified data for key stations
const votesStore: Map<string, { yes: number; no: number; notSure: number; platform: string }> = new Map([
  ['19417_BOR', { yes: 4, no: 0, notSure: 0, platform: '2' }],
  ['19417_PLG', { yes: 5, no: 0, notSure: 0, platform: '1' }],
  ['19417_VGN', { yes: 3, no: 0, notSure: 0, platform: '1' }],
  ['19417_DRD', { yes: 6, no: 0, notSure: 1, platform: '1' }],
  ['93011_BOR', { yes: 8, no: 0, notSure: 0, platform: '2' }],
  ['93011_DRD', { yes: 9, no: 1, notSure: 0, platform: '1' }],
  ['20901_BVI', { yes: 12, no: 0, notSure: 0, platform: '6' }],
  ['12951_BVI', { yes: 14, no: 0, notSure: 0, platform: '6' }],
]);

export class PlatformVotesController {
  static getVotes(req: Request, res: Response) {
    const trainNumber = String(req.params.trainNumber || '');
    const stationCode = String(req.params.stationCode || '').toUpperCase();
    const key = `${trainNumber}_${stationCode}`;
    const data = votesStore.get(key) || { yes: 2, no: 0, notSure: 0, platform: '1' };

    const total = data.yes + data.no + data.notSure;
    const approval = total > 0 ? Math.round((data.yes / (data.yes + data.no || 1)) * 100) : 100;

    const result: PlatformVoteSummary = {
      trainNumber,
      stationCode,
      platform: data.platform,
      yesCount: data.yes,
      noCount: data.no,
      notSureCount: data.notSure,
      totalVotes: total,
      approvalPercentage: approval,
      isCommunityVerified: data.yes >= 3 && approval >= 80,
    };

    res.json({ success: true, data: result });
  }

  static submitVote(req: Request, res: Response) {
    const { trainNumber, stationCode, platform, vote } = req.body;
    if (!trainNumber || !stationCode || !vote) {
      return res.status(400).json({ success: false, error: 'Missing required vote parameters.' });
    }

    const key = `${trainNumber}_${stationCode.toUpperCase()}`;
    const current = votesStore.get(key) || { yes: 0, no: 0, notSure: 0, platform: platform || '1' };

    if (vote === 'YES') current.yes += 1;
    else if (vote === 'NO') current.no += 1;
    else if (vote === 'NOT_SURE') current.notSure += 1;

    if (platform) current.platform = platform;
    votesStore.set(key, current);

    const total = current.yes + current.no + current.notSure;
    const approval = total > 0 ? Math.round((current.yes / (current.yes + current.no || 1)) * 100) : 100;

    res.json({
      success: true,
      data: {
        trainNumber,
        stationCode: stationCode.toUpperCase(),
        platform: current.platform,
        yesCount: current.yes,
        noCount: current.no,
        notSureCount: current.notSure,
        totalVotes: total,
        approvalPercentage: approval,
        isCommunityVerified: current.yes >= 3 && approval >= 80,
      },
    });
  }
}
