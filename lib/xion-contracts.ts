import { xionClient } from "./xion-client";

// Contract addresses (these would be set after deployment)
export const CONTRACT_ADDRESSES = {
  communityWatch: process.env.NEXT_PUBLIC_COMMUNITY_WATCH_CONTRACT || "",
  governance: process.env.NEXT_PUBLIC_GOVERNANCE_CONTRACT || "",
  identity: process.env.NEXT_PUBLIC_IDENTITY_CONTRACT || "",
};

// Report and Sighting types
export interface Report {
  id: string;
  title: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  category: string;
  severity: number;
  reporter: string;
  timestamp: number;
  status: "Open" | "InProgress" | "Resolved" | "Closed";
  attachments: string[];
  verified_count: number;
  disputed_count: number;
}

export interface Sighting {
  id: string;
  report_id: string;
  witness: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  timestamp: number;
  description: string;
  photos: string[];
  verified: boolean;
}

// Governance types
export interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  proposal_type: string;
  status: "Active" | "Passed" | "Failed" | "Executed" | "Expired";
  created_at: number;
  expires_at: number;
  votes_for: string;
  votes_against: string;
  total_voters: number;
  quorum_met: boolean;
  execution_data?: string;
}

export interface Vote {
  voter: string;
  proposal_id: string;
  vote_type: "For" | "Against" | "Abstain";
  voting_power: string;
  timestamp: number;
  reason?: string;
}

// Identity types
export interface Identity {
  address: string;
  username: string;
  email?: string;
  phone?: string;
  verification_level: "None" | "Basic" | "Verified" | "Trusted" | "Moderator";
  reputation_score: number;
  created_at: number;
  last_active: number;
  reports_created: number;
  sightings_contributed: number;
  verification_count: number;
  disputes_count: number;
  is_moderator: boolean;
  is_active: boolean;
}

// Community Watch Contract Functions
export class CommunityWatchContract {
  async createReport(
    report: Omit<Report, "reporter" | "timestamp" | "status" | "verified_count" | "disputed_count">
  ): Promise<string> {
    const msg = {
      create_report: {
        id: report.id,
        title: report.title,
        description: report.description,
        location: report.location,
        category: report.category,
        severity: report.severity,
        attachments: report.attachments,
      },
    };

    return await xionClient.sendTransaction(CONTRACT_ADDRESSES.communityWatch, msg);
  }

  async updateReportStatus(reportId: string, status: string): Promise<string> {
    const msg = {
      update_report_status: {
        report_id: reportId,
        status,
      },
    };

    return await xionClient.sendTransaction(CONTRACT_ADDRESSES.communityWatch, msg);
  }

  async addSighting(
    sighting: Omit<Sighting, "witness" | "timestamp" | "verified">
  ): Promise<string> {
    const msg = {
      add_sighting: {
        id: sighting.id,
        report_id: sighting.report_id,
        location: sighting.location,
        description: sighting.description,
        photos: sighting.photos,
      },
    };

    return await xionClient.sendTransaction(CONTRACT_ADDRESSES.communityWatch, msg);
  }

  async verifyReport(reportId: string): Promise<string> {
    const msg = {
      verify_report: {
        report_id: reportId,
      },
    };

    return await xionClient.sendTransaction(CONTRACT_ADDRESSES.communityWatch, msg);
  }

  async disputeReport(reportId: string): Promise<string> {
    const msg = {
      dispute_report: {
        report_id: reportId,
      },
    };

    return await xionClient.sendTransaction(CONTRACT_ADDRESSES.communityWatch, msg);
  }

  async verifySighting(sightingId: string): Promise<string> {
    const msg = {
      verify_sighting: {
        sighting_id: sightingId,
      },
    };

    return await xionClient.sendTransaction(CONTRACT_ADDRESSES.communityWatch, msg);
  }

  async getReport(id: string): Promise<Report> {
    const msg = { get_report: { id } };
    return await xionClient.queryContract(CONTRACT_ADDRESSES.communityWatch, msg);
  }

  async getReportsByLocation(
    latMin: number,
    latMax: number,
    lngMin: number,
    lngMax: number
  ): Promise<Report[]> {
    const msg = {
      get_reports_by_location: {
        lat_min: latMin,
        lat_max: latMax,
        lng_min: lngMin,
        lng_max: lngMax,
      },
    };
    return await xionClient.queryContract(CONTRACT_ADDRESSES.communityWatch, msg);
  }

  async getReportsByCategory(category: string): Promise<Report[]> {
    const msg = { get_reports_by_category: { category } };
    return await xionClient.queryContract(CONTRACT_ADDRESSES.communityWatch, msg);
  }

  async getReportsByReporter(reporter: string): Promise<Report[]> {
    const msg = { get_reports_by_reporter: { reporter } };
    return await xionClient.queryContract(CONTRACT_ADDRESSES.communityWatch, msg);
  }

  async getSightings(reportId: string): Promise<Sighting[]> {
    const msg = { get_sightings: { report_id: reportId } };
    return await xionClient.queryContract(CONTRACT_ADDRESSES.communityWatch, msg);
  }

  async getAllReports(limit?: number, offset?: number): Promise<Report[]> {
    const msg = {
      get_all_reports: {
        limit,
        offset,
      },
    };
    return await xionClient.queryContract(CONTRACT_ADDRESSES.communityWatch, msg);
  }
}

// Governance Contract Functions
export class GovernanceContract {
  async createProposal(
    id: string,
    title: string,
    description: string,
    proposalType: string,
    executionData?: string
  ): Promise<string> {
    const msg = {
      create_proposal: {
        id,
        title,
        description,
        proposal_type: proposalType,
        execution_data: executionData,
      },
    };

    return await xionClient.sendTransaction(CONTRACT_ADDRESSES.governance, msg);
  }

  async vote(
    proposalId: string,
    voteType: "For" | "Against" | "Abstain",
    reason?: string
  ): Promise<string> {
    const msg = {
      vote: {
        proposal_id: proposalId,
        vote_type: voteType.toLowerCase(),
        reason,
      },
    };

    return await xionClient.sendTransaction(CONTRACT_ADDRESSES.governance, msg);
  }

  async executeProposal(proposalId: string): Promise<string> {
    const msg = {
      execute_proposal: {
        proposal_id: proposalId,
      },
    };

    return await xionClient.sendTransaction(CONTRACT_ADDRESSES.governance, msg);
  }

  async getProposal(id: string): Promise<Proposal> {
    const msg = { get_proposal: { id } };
    return await xionClient.queryContract(CONTRACT_ADDRESSES.governance, msg);
  }

  async getActiveProposals(): Promise<Proposal[]> {
    const msg = { get_active_proposals: {} };
    return await xionClient.queryContract(CONTRACT_ADDRESSES.governance, msg);
  }

  async getProposalsByStatus(status: string): Promise<Proposal[]> {
    const msg = { get_proposals_by_status: { status } };
    return await xionClient.queryContract(CONTRACT_ADDRESSES.governance, msg);
  }

  async getVotes(proposalId: string): Promise<Vote[]> {
    const msg = { get_votes: { proposal_id: proposalId } };
    return await xionClient.queryContract(CONTRACT_ADDRESSES.governance, msg);
  }

  async getVote(proposalId: string, voter: string): Promise<Vote | null> {
    const msg = { get_vote: { proposal_id: proposalId, voter } };
    return await xionClient.queryContract(CONTRACT_ADDRESSES.governance, msg);
  }
}

// Identity Contract Functions
export class IdentityContract {
  async createIdentity(
    username: string,
    email?: string,
    phone?: string
  ): Promise<string> {
    const msg = {
      create_identity: {
        username,
        email,
        phone,
      },
    };

    return await xionClient.sendTransaction(CONTRACT_ADDRESSES.identity, msg);
  }

  async updateIdentity(
    username?: string,
    email?: string,
    phone?: string
  ): Promise<string> {
    const msg = {
      update_identity: {
        username,
        email,
        phone,
      },
    };

    return await xionClient.sendTransaction(CONTRACT_ADDRESSES.identity, msg);
  }

  async requestVerification(
    verificationLevel: string,
    documents: string[]
  ): Promise<string> {
    const msg = {
      request_verification: {
        verification_level: verificationLevel,
        documents,
      },
    };

    return await xionClient.sendTransaction(CONTRACT_ADDRESSES.identity, msg);
  }

  async updateReputation(
    user: string,
    eventType: string,
    amount: number,
    reason: string,
    relatedEntity?: string
  ): Promise<string> {
    const msg = {
      update_reputation: {
        user,
        event_type: eventType,
        amount,
        reason,
        related_entity: relatedEntity,
      },
    };

    return await xionClient.sendTransaction(CONTRACT_ADDRESSES.identity, msg);
  }

  async getIdentity(address: string): Promise<Identity> {
    const msg = { get_identity: { address } };
    return await xionClient.queryContract(CONTRACT_ADDRESSES.identity, msg);
  }

  async getIdentityByUsername(username: string): Promise<Identity | null> {
    const msg = { get_identity_by_username: { username } };
    return await xionClient.queryContract(CONTRACT_ADDRESSES.identity, msg);
  }

  async getReputationScore(address: string): Promise<number> {
    const msg = { get_reputation_score: { address } };
    return await xionClient.queryContract(CONTRACT_ADDRESSES.identity, msg);
  }

  async getModerators(): Promise<Identity[]> {
    const msg = { get_moderators: {} };
    return await xionClient.queryContract(CONTRACT_ADDRESSES.identity, msg);
  }
}

// Export contract instances
export const communityWatchContract = new CommunityWatchContract();
export const governanceContract = new GovernanceContract();
export const identityContract = new IdentityContract();
