use cosmwasm_std::entry_point;
use cosmwasm_std::{
    to_binary, Addr, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult, Uint128,
};
use cosmwasm_storage::{bucket, bucket_read, Bucket, ReadonlyBucket};
use cw_storage_plus::Item;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct Proposal {
    pub id: String,
    pub title: String,
    pub description: String,
    pub proposer: String,
    pub proposal_type: ProposalType,
    pub status: ProposalStatus,
    pub created_at: u64,
    pub expires_at: u64,
    pub votes_for: Uint128,
    pub votes_against: Uint128,
    pub total_voters: u32,
    pub quorum_met: bool,
    pub execution_data: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum ProposalType {
    ReportVerification,
    ResourceAllocation,
    RuleChange,
    CommunityGuidelines,
    ModeratorAppointment,
    TreasurySpend,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum ProposalStatus {
    Active,
    Passed,
    Failed,
    Executed,
    Expired,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct Vote {
    pub voter: String,
    pub proposal_id: String,
    pub vote_type: VoteType,
    pub voting_power: Uint128,
    pub timestamp: u64,
    pub reason: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum VoteType {
    For,
    Against,
    Abstain,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct GovernanceConfig {
    pub admin: String,
    pub quorum_percentage: u8,
    pub voting_period_seconds: u64,
    pub proposal_threshold: Uint128,
    pub min_voting_power: Uint128,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct InstantiateMsg {
    pub admin: String,
    pub quorum_percentage: Option<u8>,
    pub voting_period_seconds: Option<u64>,
    pub proposal_threshold: Option<Uint128>,
    pub min_voting_power: Option<Uint128>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    CreateProposal {
        id: String,
        title: String,
        description: String,
        proposal_type: ProposalType,
        execution_data: Option<String>,
    },
    Vote {
        proposal_id: String,
        vote_type: VoteType,
        reason: Option<String>,
    },
    ExecuteProposal {
        proposal_id: String,
    },
    UpdateConfig {
        quorum_percentage: Option<u8>,
        voting_period_seconds: Option<u64>,
        proposal_threshold: Option<Uint128>,
        min_voting_power: Option<Uint128>,
    },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    GetProposal { id: String },
    GetActiveProposals {},
    GetProposalsByStatus { status: ProposalStatus },
    GetVotes { proposal_id: String },
    GetVote { proposal_id: String, voter: String },
    GetConfig {},
    GetVotingPower { address: String },
}

pub const CONFIG: Item<GovernanceConfig> = Item::new("config");
pub const PROPOSALS: Bucket<Proposal> = bucket("proposals");
pub const PROPOSALS_READ: ReadonlyBucket<Proposal> = bucket_read("proposals");
pub const VOTES: Bucket<Vote> = bucket("votes");
pub const VOTES_READ: ReadonlyBucket<Vote> = bucket_read("votes");

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> StdResult<Response> {
    let config = GovernanceConfig {
        admin: msg.admin,
        quorum_percentage: msg.quorum_percentage.unwrap_or(51),
        voting_period_seconds: msg.voting_period_seconds.unwrap_or(604800), // 7 days
        proposal_threshold: msg.proposal_threshold.unwrap_or(Uint128::new(1000)),
        min_voting_power: msg.min_voting_power.unwrap_or(Uint128::new(1)),
    };
    
    CONFIG.save(deps.storage, &config)?;
    
    Ok(Response::new()
        .add_attribute("method", "instantiate")
        .add_attribute("admin", config.admin))
}

#[entry_point]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> StdResult<Response> {
    match msg {
        ExecuteMsg::CreateProposal {
            id,
            title,
            description,
            proposal_type,
            execution_data,
        } => execute_create_proposal(deps, env, info, id, title, description, proposal_type, execution_data),
        ExecuteMsg::Vote {
            proposal_id,
            vote_type,
            reason,
        } => execute_vote(deps, env, info, proposal_id, vote_type, reason),
        ExecuteMsg::ExecuteProposal { proposal_id } => execute_proposal(deps, env, info, proposal_id),
        ExecuteMsg::UpdateConfig {
            quorum_percentage,
            voting_period_seconds,
            proposal_threshold,
            min_voting_power,
        } => execute_update_config(deps, env, info, quorum_percentage, voting_period_seconds, proposal_threshold, min_voting_power),
    }
}

fn execute_create_proposal(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    id: String,
    title: String,
    description: String,
    proposal_type: ProposalType,
    execution_data: Option<String>,
) -> StdResult<Response> {
    let config = CONFIG.load(deps.storage)?;
    
    // Check if proposer meets threshold
    let voting_power = get_voting_power(deps.as_ref(), &info.sender.to_string())?;
    if voting_power < config.proposal_threshold {
        return Err(cosmwasm_std::StdError::generic_err("Insufficient voting power to create proposal"));
    }
    
    let proposal = Proposal {
        id: id.clone(),
        title,
        description,
        proposer: info.sender.to_string(),
        proposal_type,
        status: ProposalStatus::Active,
        created_at: env.block.time.seconds(),
        expires_at: env.block.time.seconds() + config.voting_period_seconds,
        votes_for: Uint128::zero(),
        votes_against: Uint128::zero(),
        total_voters: 0,
        quorum_met: false,
        execution_data,
    };
    
    PROPOSALS.save(deps.storage, &id, &proposal)?;
    
    Ok(Response::new()
        .add_attribute("method", "create_proposal")
        .add_attribute("proposal_id", id)
        .add_attribute("proposer", info.sender))
}

fn execute_vote(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    proposal_id: String,
    vote_type: VoteType,
    reason: Option<String>,
) -> StdResult<Response> {
    let config = CONFIG.load(deps.storage)?;
    let voting_power = get_voting_power(deps.as_ref(), &info.sender.to_string())?;
    
    if voting_power < config.min_voting_power {
        return Err(cosmwasm_std::StdError::generic_err("Insufficient voting power"));
    }
    
    let mut proposal = PROPOSALS.load(deps.storage, &proposal_id)?;
    
    if proposal.status != ProposalStatus::Active {
        return Err(cosmwasm_std::StdError::generic_err("Proposal is not active"));
    }
    
    if env.block.time.seconds() > proposal.expires_at {
        proposal.status = ProposalStatus::Expired;
        PROPOSALS.save(deps.storage, &proposal_id, &proposal)?;
        return Err(cosmwasm_std::StdError::generic_err("Proposal has expired"));
    }
    
    // Check if already voted
    let vote_key = format!("{}-{}", proposal_id, info.sender);
    if VOTES_READ.may_load(deps.storage, &vote_key)?.is_some() {
        return Err(cosmwasm_std::StdError::generic_err("Already voted"));
    }
    
    let vote = Vote {
        voter: info.sender.to_string(),
        proposal_id: proposal_id.clone(),
        vote_type: vote_type.clone(),
        voting_power,
        timestamp: env.block.time.seconds(),
        reason,
    };
    
    // Update proposal vote counts
    match vote_type {
        VoteType::For => {
            proposal.votes_for += voting_power;
        },
        VoteType::Against => {
            proposal.votes_against += voting_power;
        },
        VoteType::Abstain => {
            // Abstain doesn't affect vote totals
        },
    }
    
    proposal.total_voters += 1;
    
    // Check if quorum is met (simplified - using total voters)
    let total_supply = Uint128::new(1000000); // This should be fetched from token contract
    let quorum_threshold = total_supply.multiply_ratio(config.quorum_percentage as u128, 100u128);
    let total_votes_cast = proposal.votes_for + proposal.votes_against;
    proposal.quorum_met = total_votes_cast >= quorum_threshold;
    
    // Check if proposal passed
    if proposal.quorum_met && proposal.votes_for > proposal.votes_against {
        proposal.status = ProposalStatus::Passed;
    }
    
    PROPOSALS.save(deps.storage, &proposal_id, &proposal)?;
    VOTES.save(deps.storage, &vote_key, &vote)?;
    
    Ok(Response::new()
        .add_attribute("method", "vote")
        .add_attribute("proposal_id", proposal_id)
        .add_attribute("voter", info.sender)
        .add_attribute("vote_type", format!("{:?}", vote_type)))
}

fn execute_proposal(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    proposal_id: String,
) -> StdResult<Response> {
    let config = CONFIG.load(deps.storage)?;
    
    if info.sender != config.admin {
        return Err(cosmwasm_std::StdError::generic_err("Unauthorized"));
    }
    
    let mut proposal = PROPOSALS.load(deps.storage, &proposal_id)?;
    
    if proposal.status != ProposalStatus::Passed {
        return Err(cosmwasm_std::StdError::generic_err("Proposal has not passed"));
    }
    
    proposal.status = ProposalStatus::Executed;
    PROPOSALS.save(deps.storage, &proposal_id, &proposal)?;
    
    // Here you would execute the proposal based on its type and execution_data
    // For now, we'll just return a response
    
    Ok(Response::new()
        .add_attribute("method", "execute_proposal")
        .add_attribute("proposal_id", proposal_id))
}

fn execute_update_config(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    quorum_percentage: Option<u8>,
    voting_period_seconds: Option<u64>,
    proposal_threshold: Option<Uint128>,
    min_voting_power: Option<Uint128>,
) -> StdResult<Response> {
    let mut config = CONFIG.load(deps.storage)?;
    
    if info.sender != config.admin {
        return Err(cosmwasm_std::StdError::generic_err("Unauthorized"));
    }
    
    if let Some(quorum) = quorum_percentage {
        config.quorum_percentage = quorum;
    }
    if let Some(period) = voting_period_seconds {
        config.voting_period_seconds = period;
    }
    if let Some(threshold) = proposal_threshold {
        config.proposal_threshold = threshold;
    }
    if let Some(min_power) = min_voting_power {
        config.min_voting_power = min_power;
    }
    
    CONFIG.save(deps.storage, &config)?;
    
    Ok(Response::new()
        .add_attribute("method", "update_config")
        .add_attribute("admin", info.sender))
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetProposal { id } => to_binary(&query_proposal(deps, id)?),
        QueryMsg::GetActiveProposals {} => to_binary(&query_active_proposals(deps)?),
        QueryMsg::GetProposalsByStatus { status } => to_binary(&query_proposals_by_status(deps, status)?),
        QueryMsg::GetVotes { proposal_id } => to_binary(&query_votes(deps, proposal_id)?),
        QueryMsg::GetVote { proposal_id, voter } => to_binary(&query_vote(deps, proposal_id, voter)?),
        QueryMsg::GetConfig {} => to_binary(&query_config(deps)?),
        QueryMsg::GetVotingPower { address } => to_binary(&query_voting_power(deps, address)?),
    }
}

fn query_proposal(deps: Deps, id: String) -> StdResult<Proposal> {
    PROPOSALS_READ.load(deps.storage, &id)
}

fn query_active_proposals(deps: Deps) -> StdResult<Vec<Proposal>> {
    let proposals: StdResult<Vec<_>> = PROPOSALS_READ
        .range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
        .filter(|(_, proposal)| {
            if let Ok(proposal) = proposal {
                proposal.status == ProposalStatus::Active
            } else {
                false
            }
        })
        .map(|(_, proposal)| proposal)
        .collect();
    
    proposals
}

fn query_proposals_by_status(deps: Deps, status: ProposalStatus) -> StdResult<Vec<Proposal>> {
    let proposals: StdResult<Vec<_>> = PROPOSALS_READ
        .range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
        .filter(|(_, proposal)| {
            if let Ok(proposal) = proposal {
                proposal.status == status
            } else {
                false
            }
        })
        .map(|(_, proposal)| proposal)
        .collect();
    
    proposals
}

fn query_votes(deps: Deps, proposal_id: String) -> StdResult<Vec<Vote>> {
    let votes: StdResult<Vec<_>> = VOTES_READ
        .range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
        .filter(|(_, vote)| {
            if let Ok(vote) = vote {
                vote.proposal_id == proposal_id
            } else {
                false
            }
        })
        .map(|(_, vote)| vote)
        .collect();
    
    votes
}

fn query_vote(deps: Deps, proposal_id: String, voter: String) -> StdResult<Option<Vote>> {
    let vote_key = format!("{}-{}", proposal_id, voter);
    VOTES_READ.may_load(deps.storage, &vote_key)
}

fn query_config(deps: Deps) -> StdResult<GovernanceConfig> {
    CONFIG.load(deps.storage)
}

fn query_voting_power(deps: Deps, address: String) -> StdResult<Uint128> {
    get_voting_power(deps, &address)
}

fn get_voting_power(deps: Deps, address: &str) -> StdResult<Uint128> {
    // This is a simplified implementation
    // In a real implementation, you would query the token contract for the user's balance
    // For now, we'll return a fixed amount for demonstration
    Ok(Uint128::new(100))
}
