import { Request, Response } from 'express';
import { prisma } from '../db/prismaClient.js';
import crypto from 'crypto';

export type PlatformVoteChoice = 'YES' | 'NO' | 'NOT_SURE';
export type VerificationStatus =
  | 'NOT_VERIFIED' // no votes at all
  | 'INSUFFICIENT_VOTES' // some votes, but not enough to call it verified
  | 'VERIFIED' // enough agreeing votes
  | 'DISPUTED'; // enough votes but they disagree

export interface PlatformVoteSummary {
  trainNumber: string;
  stationCode: string;
  platform: string;
  serviceDate: string;
  yesCount: number;
  noCount: number;
  notSureCount: number;
  totalVotes: number;
  /** 0 when there are no votes — never a fabricated percentage */
  approvalPercentage: number;
  isCommunityVerified: boolean;
  verificationStatus: VerificationStatus;
  lastUpdatedAt: string | null;
  userVoted: PlatformVoteChoice | null;
  /** false when the database could not be reached (counts are then reported as 0, not guessed) */
  available: boolean;
}

/** Minimum real data required before any "Verified" badge may be shown. */
const MIN_VOTES_TO_VERIFY = 3;
const MIN_APPROVAL_PERCENT = 80;

const EMPTY_SUMMARY_BASE = {
  yesCount: 0,
  noCount: 0,
  notSureCount: 0,
  totalVotes: 0,
  approvalPercentage: 0,
  isCommunityVerified: false,
  verificationStatus: 'NOT_VERIFIED' as VerificationStatus,
  lastUpdatedAt: null as string | null,
};

/**
 * Stable, anonymous per-browser voter identifier.
 * The client supplies a random id (localStorage) so a voter keeps a stable identity across IP changes;
 * the ip/user-agent salt keeps the identifier unguessable and prevents raw PII being stored.
 */
function buildVoterToken(req: Request): string {
  const clientId = String(req.headers['x-voter-id'] || '')
    .trim()
    .slice(0, 64);
  const ip = String(req.ip || req.headers['x-forwarded-for'] || 'unknown');
  const ua = String(req.headers['user-agent'] || '');
  return crypto
    .createHash('sha256')
    .update(`${clientId}|${ip}|${ua}`)
    .digest('hex')
    .slice(0, 40);
}

function normaliseDate(value: unknown): string {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : '';
}

/** Build a summary from a set of raw vote rows (already scoped to the requested platform/date). */
function summarise(
  trainNumber: string,
  stationCode: string,
  platform: string,
  serviceDate: string,
  rows: { vote: string; updatedAt: Date }[],
  userVote: PlatformVoteChoice | null,
  available: boolean
): PlatformVoteSummary {
  let yes = 0;
  let no = 0;
  let notSure = 0;
  let last: Date | null = null;

  for (const row of rows) {
    if (row.vote === 'YES') yes++;
    else if (row.vote === 'NO') no++;
    else if (row.vote === 'NOT_SURE') notSure++;
    if (!last || row.updatedAt > last) last = row.updatedAt;
  }

  const total = yes + no + notSure;
  const decided = yes + no;
  const approval = decided > 0 ? Math.round((yes / decided) * 100) : 0;

  let verificationStatus: VerificationStatus = 'NOT_VERIFIED';
  if (total > 0 && total < MIN_VOTES_TO_VERIFY) verificationStatus = 'INSUFFICIENT_VOTES';
  else if (total >= MIN_VOTES_TO_VERIFY)
    verificationStatus = approval >= MIN_APPROVAL_PERCENT ? 'VERIFIED' : 'DISPUTED';

  return {
    trainNumber,
    stationCode,
    platform,
    serviceDate,
    yesCount: yes,
    noCount: no,
    notSureCount: notSure,
    totalVotes: total,
    approvalPercentage: approval,
    isCommunityVerified: verificationStatus === 'VERIFIED',
    verificationStatus,
    lastUpdatedAt: last ? last.toISOString() : null,
    userVoted: userVote,
    available,
  };
}

/**
 * Aggregate votes in the database (grouped by vote value) so counts are always derived
 * from persisted rows rather than in-memory state.
 */
async function loadVotes(params: {
  trainNumber: string;
  stationCode: string;
  platform?: string;
  serviceDate?: string;
}) {
  const where: Record<string, unknown> = {
    trainNumber: params.trainNumber,
    stationCode: params.stationCode,
  };
  if (params.platform) where.platformNumber = params.platform;
  if (params.serviceDate) where.serviceDate = params.serviceDate;

  const rows = await prisma.platformVote.findMany({
    where,
    select: { vote: true, updatedAt: true },
  });
  return rows;
}

export class PlatformVotesController {
  /** GET /api/platform-votes/:trainNumber/:stationCode?platform=3&date=YYYY-MM-DD */
  static async getVotes(req: Request, res: Response) {
    const trainNumber = String(req.params.trainNumber || '').trim();
    const stationCode = String(req.params.stationCode || '')
      .toUpperCase()
      .trim();
    const platform = String(req.query.platform || '').trim();
    const serviceDate = normaliseDate(req.query.date);

    if (!trainNumber || !stationCode) {
      return res
        .status(400)
        .json({ success: false, error: 'Train number and station code are required.' });
    }

    const voterToken = buildVoterToken(req);

    try {
      const rows = await loadVotes({
        trainNumber,
        stationCode,
        platform,
        serviceDate,
      });

      const userRow = await prisma.platformVote.findFirst({
        where: {
          trainNumber,
          stationCode,
          ipHash: voterToken,
          ...(platform ? { platformNumber: platform } : {}),
          ...(serviceDate ? { serviceDate } : {}),
        },
        select: { vote: true, platformNumber: true },
        orderBy: { updatedAt: 'desc' },
      });

      // Only report a platform when one was actually requested or actually voted on.
      const resolvedPlatform = platform || userRow?.platformNumber || '';

      return res.json({
        success: true,
        data: summarise(
          trainNumber,
          stationCode,
          resolvedPlatform,
          serviceDate,
          rows,
          (userRow?.vote as PlatformVoteChoice | undefined) ?? null,
          true
        ),
      });
    } catch (dbErr) {
      // Log the real error server-side; never surface DB internals to the client.
      console.error('[PlatformVotes] DB read failed:', (dbErr as Error).message);
      return res.json({
        success: true,
        data: summarise(trainNumber, stationCode, platform, serviceDate, [], null, false),
        warning: 'Vote totals are temporarily unavailable.',
      });
    }
  }

  /** POST /api/platform-votes { trainNumber, stationCode, platform, vote, serviceDate? } */
  static async submitVote(req: Request, res: Response) {
    const { trainNumber, stationCode, vote } = req.body || {};
    const platform = String(req.body?.platform ?? '').trim();
    const serviceDate = normaliseDate(req.body?.serviceDate);

    if (!trainNumber || !stationCode || !vote) {
      return res.status(400).json({ success: false, error: 'Missing required vote parameters.' });
    }
    if (!['YES', 'NO', 'NOT_SURE'].includes(vote)) {
      return res.status(400).json({ success: false, error: 'vote must be YES, NO or NOT_SURE.' });
    }

    const code = String(stationCode).toUpperCase().trim();
    const platformNum = platform || '';
    const voterToken = buildVoterToken(req);

    try {
      // Atomic upsert on the unique (train, station, platform, serviceDate, voter) constraint.
      // Concurrent votes from the same voter update the existing row instead of adding a new one,
      // so refreshing / rapid clicking can never inflate a count.
      await prisma.platformVote.upsert({
        where: {
          trainNumber_stationCode_platformNumber_serviceDate_ipHash: {
            trainNumber: String(trainNumber),
            stationCode: code,
            platformNumber: platformNum,
            serviceDate,
            ipHash: voterToken,
          },
        },
        update: { vote, source: 'COMMUNITY' },
        create: {
          trainNumber: String(trainNumber),
          stationCode: code,
          platformNumber: platformNum,
          serviceDate,
          vote,
          source: 'COMMUNITY',
          ipHash: voterToken,
        },
      });

      const rows = await loadVotes({
        trainNumber: String(trainNumber),
        stationCode: code,
        platform: platformNum,
        serviceDate,
      });

      return res.json({
        success: true,
        data: summarise(
          String(trainNumber),
          code,
          platformNum,
          serviceDate,
          rows,
          vote as PlatformVoteChoice,
          true
        ),
      });
    } catch (dbErr) {
      console.error('[PlatformVotes] DB write failed:', (dbErr as Error).message);
      return res.status(503).json({
        success: false,
        error: {
          message: 'Platform vote could not be saved. Please try again later.',
          code: 'DB_UNAVAILABLE',
        },
      });
    }
  }
}
