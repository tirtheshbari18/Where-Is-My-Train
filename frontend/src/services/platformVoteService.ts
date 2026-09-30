// Platform Vote Service for Community Platform Confirmation
//
// All counts shown to the user come from the server. When the server cannot be
// reached the service returns an explicitly empty/`available: false` summary —
// it never invents vote totals, percentages or a "verified" badge.

export type PlatformVoteChoice = 'YES' | 'NO' | 'NOT_SURE';

export type PlatformVerificationStatus =
  | 'NOT_VERIFIED'
  | 'INSUFFICIENT_VOTES'
  | 'VERIFIED'
  | 'DISPUTED';

export interface PlatformVoteResult {
  trainNumber: string;
  stationCode: string;
  platform: string;
  yesCount: number;
  noCount: number;
  notSureCount: number;
  totalVotes: number;
  approvalPercentage: number;
  isCommunityVerified: boolean;
  verificationStatus: PlatformVerificationStatus;
  lastUpdatedAt: string | null;
  /** false when the totals could not be loaded — the counts are then 0, not guesses */
  available: boolean;
  userVoted?: PlatformVoteChoice;
}

const LOCAL_VOTES_KEY = 'wimt_platform_user_votes';
const VOTER_ID_KEY = 'wimt_platform_voter_id';

function getVoterId(): string {
  try {
    let id = localStorage.getItem(VOTER_ID_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem(VOTER_ID_KEY, id);
    }
    return id;
  } catch {
    return '';
  }
}

function emptySummary(
  trainNumber: string,
  stationCode: string,
  platform: string,
  userVoted: PlatformVoteChoice | null,
  available: boolean
): PlatformVoteResult {
  return {
    trainNumber,
    stationCode: stationCode.toUpperCase(),
    platform,
    yesCount: 0,
    noCount: 0,
    notSureCount: 0,
    totalVotes: 0,
    approvalPercentage: 0,
    isCommunityVerified: false,
    verificationStatus: 'NOT_VERIFIED',
    lastUpdatedAt: null,
    available,
    userVoted: userVoted || undefined,
  };
}

function readLocalVote(trainNumber: string, stationCode: string): PlatformVoteChoice | null {
  try {
    const raw = localStorage.getItem(LOCAL_VOTES_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed[`${trainNumber}_${stationCode.toUpperCase()}`] || null;
  } catch {
    return null;
  }
}

function writeLocalVote(
  trainNumber: string,
  stationCode: string,
  vote: PlatformVoteChoice
): void {
  try {
    const raw = localStorage.getItem(LOCAL_VOTES_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[`${trainNumber}_${stationCode.toUpperCase()}`] = vote;
    localStorage.setItem(LOCAL_VOTES_KEY, JSON.stringify(parsed));
  } catch {
    // localStorage unavailable — the server copy is what matters.
  }
}

export const platformVoteService = {
  getUserVote(trainNumber: string, stationCode: string): PlatformVoteChoice | null {
    return readLocalVote(trainNumber, stationCode);
  },

  async getVotes(
    trainNumber: string,
    stationCode: string,
    platform?: string,
    serviceDate?: string
  ): Promise<PlatformVoteResult> {
    const localVote = readLocalVote(trainNumber, stationCode);

    const params = new URLSearchParams();
    if (platform) params.set('platform', platform);
    if (serviceDate) params.set('date', serviceDate);
    const qs = params.toString();

    try {
      const res = await fetch(
        `/api/platform-votes/${encodeURIComponent(trainNumber)}/${encodeURIComponent(
          stationCode
        )}${qs ? `?${qs}` : ''}`,
        { headers: { 'X-Voter-Id': getVoterId() } }
      );
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return {
            ...json.data,
            available: json.data.available !== false,
            userVoted:
              (json.data.userVoted as PlatformVoteChoice | null) || localVote || undefined,
          };
        }
      }
    } catch {
      // Network/DB failure — fall through to an honest "no data" summary.
    }

    return emptySummary(trainNumber, stationCode, platform || '', localVote, false);
  },

  async submitVote(
    trainNumber: string,
    stationCode: string,
    platform: string | undefined,
    vote: PlatformVoteChoice,
    serviceDate?: string
  ): Promise<PlatformVoteResult> {
    writeLocalVote(trainNumber, stationCode, vote);

    try {
      const res = await fetch('/api/platform-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Voter-Id': getVoterId() },
        body: JSON.stringify({
          trainNumber,
          stationCode: stationCode.toUpperCase(),
          platform: platform || '',
          vote,
          serviceDate: serviceDate || '',
        }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success && json.data) {
        return {
          ...json.data,
          available: json.data.available !== false,
          userVoted: vote,
        };
      }
      throw new Error(json?.error?.message || 'Your vote could not be saved.');
    } catch (err) {
      if (err instanceof Error && err.message) throw err;
      throw new Error('Your vote could not be saved. Please check your connection and try again.');
    }
  },
};
