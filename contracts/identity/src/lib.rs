use cosmwasm_std::entry_point;
use cosmwasm_std::{
    to_binary, Addr, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult, Uint128,
};
use cosmwasm_storage::{bucket, bucket_read, Bucket, ReadonlyBucket};
use cw_storage_plus::Item;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct Identity {
    pub address: String,
    pub username: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub verification_level: VerificationLevel,
    pub reputation_score: u32,
    pub created_at: u64,
    pub last_active: u64,
    pub reports_created: u32,
    pub sightings_contributed: u32,
    pub verification_count: u32,
    pub disputes_count: u32,
    pub is_moderator: bool,
    pub is_active: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum VerificationLevel {
    None,
    Basic,
    Verified,
    Trusted,
    Moderator,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct VerificationRequest {
    pub id: String,
    pub applicant: String,
    pub verification_level: VerificationLevel,
    pub documents: Vec<String>,
    pub status: VerificationStatus,
    pub submitted_at: u64,
    pub reviewed_at: Option<u64>,
    pub reviewer: Option<String>,
    pub reason: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum VerificationStatus {
    Pending,
    Approved,
    Rejected,
    Expired,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct ReputationEvent {
    pub id: String,
    pub user: String,
    pub event_type: ReputationEventType,
    pub amount: i32,
    pub reason: String,
    pub timestamp: u64,
    pub related_entity: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum ReputationEventType {
    ReportCreated,
    SightingContributed,
    VerificationProvided,
    ReportVerified,
    ReportDisputed,
    ModerationAction,
    CommunityService,
    SpamReport,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct IdentityConfig {
    pub admin: String,
    pub basic_verification_threshold: u32,
    pub verified_verification_threshold: u32,
    pub trusted_verification_threshold: u32,
    pub reputation_decay_rate: u32,
    pub max_reputation: u32,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct InstantiateMsg {
    pub admin: String,
    pub basic_verification_threshold: Option<u32>,
    pub verified_verification_threshold: Option<u32>,
    pub trusted_verification_threshold: Option<u32>,
    pub reputation_decay_rate: Option<u32>,
    pub max_reputation: Option<u32>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    CreateIdentity {
        username: String,
        email: Option<String>,
        phone: Option<String>,
    },
    UpdateIdentity {
        username: Option<String>,
        email: Option<String>,
        phone: Option<String>,
    },
    RequestVerification {
        verification_level: VerificationLevel,
        documents: Vec<String>,
    },
    ProcessVerificationRequest {
        request_id: String,
        status: VerificationStatus,
        reason: Option<String>,
    },
    UpdateReputation {
        user: String,
        event_type: ReputationEventType,
        amount: i32,
        reason: String,
        related_entity: Option<String>,
    },
    SetModerator {
        user: String,
        is_moderator: bool,
    },
    DeactivateIdentity {
        user: String,
    },
    UpdateConfig {
        basic_verification_threshold: Option<u32>,
        verified_verification_threshold: Option<u32>,
        trusted_verification_threshold: Option<u32>,
        reputation_decay_rate: Option<u32>,
        max_reputation: Option<u32>,
    },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    GetIdentity { address: String },
    GetIdentityByUsername { username: String },
    GetVerificationRequests { status: Option<VerificationStatus> },
    GetVerificationRequest { id: String },
    GetReputationHistory { address: String },
    GetModerators {},
    GetConfig {},
    GetReputationScore { address: String },
}

pub const CONFIG: Item<IdentityConfig> = Item::new("config");
pub const IDENTITIES: Bucket<Identity> = bucket("identities");
pub const IDENTITIES_READ: ReadonlyBucket<Identity> = bucket_read("identities");
pub const VERIFICATION_REQUESTS: Bucket<VerificationRequest> = bucket("verification_requests");
pub const VERIFICATION_REQUESTS_READ: ReadonlyBucket<VerificationRequest> = bucket_read("verification_requests");
pub const REPUTATION_EVENTS: Bucket<ReputationEvent> = bucket("reputation_events");
pub const REPUTATION_EVENTS_READ: ReadonlyBucket<ReputationEvent> = bucket_read("reputation_events");

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> StdResult<Response> {
    let config = IdentityConfig {
        admin: msg.admin,
        basic_verification_threshold: msg.basic_verification_threshold.unwrap_or(10),
        verified_verification_threshold: msg.verified_verification_threshold.unwrap_or(50),
        trusted_verification_threshold: msg.trusted_verification_threshold.unwrap_or(100),
        reputation_decay_rate: msg.reputation_decay_rate.unwrap_or(1),
        max_reputation: msg.max_reputation.unwrap_or(1000),
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
        ExecuteMsg::CreateIdentity {
            username,
            email,
            phone,
        } => execute_create_identity(deps, env, info, username, email, phone),
        ExecuteMsg::UpdateIdentity {
            username,
            email,
            phone,
        } => execute_update_identity(deps, env, info, username, email, phone),
        ExecuteMsg::RequestVerification {
            verification_level,
            documents,
        } => execute_request_verification(deps, env, info, verification_level, documents),
        ExecuteMsg::ProcessVerificationRequest {
            request_id,
            status,
            reason,
        } => execute_process_verification_request(deps, env, info, request_id, status, reason),
        ExecuteMsg::UpdateReputation {
            user,
            event_type,
            amount,
            reason,
            related_entity,
        } => execute_update_reputation(deps, env, info, user, event_type, amount, reason, related_entity),
        ExecuteMsg::SetModerator {
            user,
            is_moderator,
        } => execute_set_moderator(deps, env, info, user, is_moderator),
        ExecuteMsg::DeactivateIdentity {
            user,
        } => execute_deactivate_identity(deps, env, info, user),
        ExecuteMsg::UpdateConfig {
            basic_verification_threshold,
            verified_verification_threshold,
            trusted_verification_threshold,
            reputation_decay_rate,
            max_reputation,
        } => execute_update_config(deps, env, info, basic_verification_threshold, verified_verification_threshold, trusted_verification_threshold, reputation_decay_rate, max_reputation),
    }
}

fn execute_create_identity(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    username: String,
    email: Option<String>,
    phone: Option<String>,
) -> StdResult<Response> {
    let address = info.sender.to_string();
    
    // Check if identity already exists
    if IDENTITIES_READ.may_load(deps.storage, &address)?.is_some() {
        return Err(cosmwasm_std::StdError::generic_err("Identity already exists"));
    }
    
    // Check if username is already taken
    let username_taken = IDENTITIES_READ
        .range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
        .any(|(_, identity)| {
            if let Ok(identity) = identity {
                identity.username == username
            } else {
                false
            }
        });
    
    if username_taken {
        return Err(cosmwasm_std::StdError::generic_err("Username already taken"));
    }
    
    let identity = Identity {
        address: address.clone(),
        username,
        email,
        phone,
        verification_level: VerificationLevel::None,
        reputation_score: 0,
        created_at: env.block.time.seconds(),
        last_active: env.block.time.seconds(),
        reports_created: 0,
        sightings_contributed: 0,
        verification_count: 0,
        disputes_count: 0,
        is_moderator: false,
        is_active: true,
    };
    
    IDENTITIES.save(deps.storage, &address, &identity)?;
    
    Ok(Response::new()
        .add_attribute("method", "create_identity")
        .add_attribute("address", address))
}

fn execute_update_identity(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    username: Option<String>,
    email: Option<String>,
    phone: Option<String>,
) -> StdResult<Response> {
    let address = info.sender.to_string();
    let mut identity = IDENTITIES.load(deps.storage, &address)?;
    
    if let Some(new_username) = username {
        // Check if username is already taken
        let username_taken = IDENTITIES_READ
            .range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
            .any(|(_, existing_identity)| {
                if let Ok(existing_identity) = existing_identity {
                    existing_identity.username == new_username && existing_identity.address != address
                } else {
                    false
                }
            });
        
        if username_taken {
            return Err(cosmwasm_std::StdError::generic_err("Username already taken"));
        }
        
        identity.username = new_username;
    }
    
    if let Some(new_email) = email {
        identity.email = Some(new_email);
    }
    
    if let Some(new_phone) = phone {
        identity.phone = Some(new_phone);
    }
    
    identity.last_active = env.block.time.seconds();
    
    IDENTITIES.save(deps.storage, &address, &identity)?;
    
    Ok(Response::new()
        .add_attribute("method", "update_identity")
        .add_attribute("address", address))
}

fn execute_request_verification(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    verification_level: VerificationLevel,
    documents: Vec<String>,
) -> StdResult<Response> {
    let address = info.sender.to_string();
    let identity = IDENTITIES.load(deps.storage, &address)?;
    
    // Check if user can request this verification level
    let config = CONFIG.load(deps.storage)?;
    let required_reputation = match verification_level {
        VerificationLevel::Basic => config.basic_verification_threshold,
        VerificationLevel::Verified => config.verified_verification_threshold,
        VerificationLevel::Trusted => config.trusted_verification_threshold,
        _ => return Err(cosmwasm_std::StdError::generic_err("Invalid verification level")),
    };
    
    if identity.reputation_score < required_reputation {
        return Err(cosmwasm_std::StdError::generic_err("Insufficient reputation for this verification level"));
    }
    
    let request_id = format!("{}-{}", address, env.block.time.seconds());
    let verification_request = VerificationRequest {
        id: request_id.clone(),
        applicant: address.clone(),
        verification_level,
        documents,
        status: VerificationStatus::Pending,
        submitted_at: env.block.time.seconds(),
        reviewed_at: None,
        reviewer: None,
        reason: None,
    };
    
    VERIFICATION_REQUESTS.save(deps.storage, &request_id, &verification_request)?;
    
    Ok(Response::new()
        .add_attribute("method", "request_verification")
        .add_attribute("request_id", request_id)
        .add_attribute("applicant", address))
}

fn execute_process_verification_request(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    request_id: String,
    status: VerificationStatus,
    reason: Option<String>,
) -> StdResult<Response> {
    let config = CONFIG.load(deps.storage)?;
    
    if info.sender != config.admin {
        return Err(cosmwasm_std::StdError::generic_err("Unauthorized"));
    }
    
    let mut verification_request = VERIFICATION_REQUESTS.load(deps.storage, &request_id)?;
    verification_request.status = status.clone();
    verification_request.reviewed_at = Some(env.block.time.seconds());
    verification_request.reviewer = Some(info.sender.to_string());
    verification_request.reason = reason.clone();
    
    // Update identity if approved
    if status == VerificationStatus::Approved {
        let mut identity = IDENTITIES.load(deps.storage, &verification_request.applicant)?;
        identity.verification_level = verification_request.verification_level.clone();
        identity.verification_count += 1;
        IDENTITIES.save(deps.storage, &verification_request.applicant, &identity)?;
    }
    
    VERIFICATION_REQUESTS.save(deps.storage, &request_id, &verification_request)?;
    
    Ok(Response::new()
        .add_attribute("method", "process_verification_request")
        .add_attribute("request_id", request_id)
        .add_attribute("status", format!("{:?}", status)))
}

fn execute_update_reputation(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    user: String,
    event_type: ReputationEventType,
    amount: i32,
    reason: String,
    related_entity: Option<String>,
) -> StdResult<Response> {
    let config = CONFIG.load(deps.storage)?;
    
    if info.sender != config.admin {
        return Err(cosmwasm_std::StdError::generic_err("Unauthorized"));
    }
    
    let mut identity = IDENTITIES.load(deps.storage, &user)?;
    
    // Update reputation score
    let new_score = (identity.reputation_score as i32 + amount).max(0).min(config.max_reputation as i32) as u32;
    identity.reputation_score = new_score;
    
    // Update counters based on event type
    match event_type {
        ReputationEventType::ReportCreated => {
            identity.reports_created += 1;
        },
        ReputationEventType::SightingContributed => {
            identity.sightings_contributed += 1;
        },
        ReputationEventType::ReportVerified => {
            identity.verification_count += 1;
        },
        ReputationEventType::ReportDisputed => {
            identity.disputes_count += 1;
        },
        _ => {}
    }
    
    identity.last_active = env.block.time.seconds();
    
    // Create reputation event
    let event_id = format!("{}-{}", user, env.block.time.seconds());
    let reputation_event = ReputationEvent {
        id: event_id,
        user: user.clone(),
        event_type,
        amount,
        reason,
        timestamp: env.block.time.seconds(),
        related_entity,
    };
    
    IDENTITIES.save(deps.storage, &user, &identity)?;
    REPUTATION_EVENTS.save(deps.storage, &event_id, &reputation_event)?;
    
    Ok(Response::new()
        .add_attribute("method", "update_reputation")
        .add_attribute("user", user)
        .add_attribute("amount", amount.to_string())
        .add_attribute("new_score", new_score.to_string()))
}

fn execute_set_moderator(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    user: String,
    is_moderator: bool,
) -> StdResult<Response> {
    let config = CONFIG.load(deps.storage)?;
    
    if info.sender != config.admin {
        return Err(cosmwasm_std::StdError::generic_err("Unauthorized"));
    }
    
    let mut identity = IDENTITIES.load(deps.storage, &user)?;
    identity.is_moderator = is_moderator;
    
    if is_moderator {
        identity.verification_level = VerificationLevel::Moderator;
    }
    
    IDENTITIES.save(deps.storage, &user, &identity)?;
    
    Ok(Response::new()
        .add_attribute("method", "set_moderator")
        .add_attribute("user", user)
        .add_attribute("is_moderator", is_moderator.to_string()))
}

fn execute_deactivate_identity(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    user: String,
) -> StdResult<Response> {
    let config = CONFIG.load(deps.storage)?;
    
    if info.sender != config.admin && info.sender != user {
        return Err(cosmwasm_std::StdError::generic_err("Unauthorized"));
    }
    
    let mut identity = IDENTITIES.load(deps.storage, &user)?;
    identity.is_active = false;
    
    IDENTITIES.save(deps.storage, &user, &identity)?;
    
    Ok(Response::new()
        .add_attribute("method", "deactivate_identity")
        .add_attribute("user", user))
}

fn execute_update_config(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    basic_verification_threshold: Option<u32>,
    verified_verification_threshold: Option<u32>,
    trusted_verification_threshold: Option<u32>,
    reputation_decay_rate: Option<u32>,
    max_reputation: Option<u32>,
) -> StdResult<Response> {
    let mut config = CONFIG.load(deps.storage)?;
    
    if info.sender != config.admin {
        return Err(cosmwasm_std::StdError::generic_err("Unauthorized"));
    }
    
    if let Some(threshold) = basic_verification_threshold {
        config.basic_verification_threshold = threshold;
    }
    if let Some(threshold) = verified_verification_threshold {
        config.verified_verification_threshold = threshold;
    }
    if let Some(threshold) = trusted_verification_threshold {
        config.trusted_verification_threshold = threshold;
    }
    if let Some(rate) = reputation_decay_rate {
        config.reputation_decay_rate = rate;
    }
    if let Some(max) = max_reputation {
        config.max_reputation = max;
    }
    
    CONFIG.save(deps.storage, &config)?;
    
    Ok(Response::new()
        .add_attribute("method", "update_config")
        .add_attribute("admin", info.sender))
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetIdentity { address } => to_binary(&query_identity(deps, address)?),
        QueryMsg::GetIdentityByUsername { username } => to_binary(&query_identity_by_username(deps, username)?),
        QueryMsg::GetVerificationRequests { status } => to_binary(&query_verification_requests(deps, status)?),
        QueryMsg::GetVerificationRequest { id } => to_binary(&query_verification_request(deps, id)?),
        QueryMsg::GetReputationHistory { address } => to_binary(&query_reputation_history(deps, address)?),
        QueryMsg::GetModerators {} => to_binary(&query_moderators(deps)?),
        QueryMsg::GetConfig {} => to_binary(&query_config(deps)?),
        QueryMsg::GetReputationScore { address } => to_binary(&query_reputation_score(deps, address)?),
    }
}

fn query_identity(deps: Deps, address: String) -> StdResult<Identity> {
    IDENTITIES_READ.load(deps.storage, &address)
}

fn query_identity_by_username(deps: Deps, username: String) -> StdResult<Option<Identity>> {
    let identities: StdResult<Vec<_>> = IDENTITIES_READ
        .range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
        .filter(|(_, identity)| {
            if let Ok(identity) = identity {
                identity.username == username
            } else {
                false
            }
        })
        .map(|(_, identity)| identity)
        .collect();
    
    match identities {
        Ok(identities) => Ok(identities.into_iter().next()),
        Err(e) => Err(e),
    }
}

fn query_verification_requests(
    deps: Deps,
    status: Option<VerificationStatus>,
) -> StdResult<Vec<VerificationRequest>> {
    let requests: StdResult<Vec<_>> = VERIFICATION_REQUESTS_READ
        .range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
        .filter(|(_, request)| {
            if let Ok(request) = request {
                status.is_none() || request.status == status.unwrap()
            } else {
                false
            }
        })
        .map(|(_, request)| request)
        .collect();
    
    requests
}

fn query_verification_request(deps: Deps, id: String) -> StdResult<VerificationRequest> {
    VERIFICATION_REQUESTS_READ.load(deps.storage, &id)
}

fn query_reputation_history(deps: Deps, address: String) -> StdResult<Vec<ReputationEvent>> {
    let events: StdResult<Vec<_>> = REPUTATION_EVENTS_READ
        .range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
        .filter(|(_, event)| {
            if let Ok(event) = event {
                event.user == address
            } else {
                false
            }
        })
        .map(|(_, event)| event)
        .collect();
    
    events
}

fn query_moderators(deps: Deps) -> StdResult<Vec<Identity>> {
    let moderators: StdResult<Vec<_>> = IDENTITIES_READ
        .range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
        .filter(|(_, identity)| {
            if let Ok(identity) = identity {
                identity.is_moderator
            } else {
                false
            }
        })
        .map(|(_, identity)| identity)
        .collect();
    
    moderators
}

fn query_config(deps: Deps) -> StdResult<IdentityConfig> {
    CONFIG.load(deps.storage)
}

fn query_reputation_score(deps: Deps, address: String) -> StdResult<u32> {
    let identity = IDENTITIES_READ.load(deps.storage, &address)?;
    Ok(identity.reputation_score)
}
