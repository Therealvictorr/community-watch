use cosmwasm_std::entry_point;
use cosmwasm_std::{
    to_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult, Uint128,
};
use cosmwasm_storage::{bucket, bucket_read, Bucket, ReadonlyBucket};
use cw_storage_plus::Item;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct Report {
    pub id: String,
    pub title: String,
    pub description: String,
    pub location: Location,
    pub category: String,
    pub severity: u8,
    pub reporter: String,
    pub timestamp: u64,
    pub status: ReportStatus,
    pub attachments: Vec<String>,
    pub verified_count: u32,
    pub disputed_count: u32,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct Location {
    pub latitude: f64,
    pub longitude: f64,
    pub address: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct Sighting {
    pub id: String,
    pub report_id: String,
    pub witness: String,
    pub location: Location,
    pub timestamp: u64,
    pub description: String,
    pub photos: Vec<String>,
    pub verified: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum ReportStatus {
    Open,
    InProgress,
    Resolved,
    Closed,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct InstantiateMsg {
    pub admin: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    CreateReport {
        id: String,
        title: String,
        description: String,
        location: Location,
        category: String,
        severity: u8,
        attachments: Vec<String>,
    },
    UpdateReportStatus {
        report_id: String,
        status: ReportStatus,
    },
    AddSighting {
        id: String,
        report_id: String,
        location: Location,
        description: String,
        photos: Vec<String>,
    },
    VerifyReport {
        report_id: String,
    },
    DisputeReport {
        report_id: String,
    },
    VerifySighting {
        sighting_id: String,
    },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    GetReport { id: String },
    GetReportsByLocation { 
        lat_min: f64, 
        lat_max: f64, 
        lng_min: f64, 
        lng_max: f64 
    },
    GetReportsByCategory { category: String },
    GetReportsByReporter { reporter: String },
    GetSightings { report_id: String },
    GetAllReports { limit: Option<u32>, offset: Option<u32> },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct Config {
    pub admin: String,
}

pub const CONFIG: Item<Config> = Item::new("config");
pub const REPORTS: Bucket<Report> = bucket("reports");
pub const REPORTS_READ: ReadonlyBucket<Report> = bucket_read("reports");
pub const SIGHTINGS: Bucket<Sighting> = bucket("sightings");
pub const SIGHTINGS_READ: ReadonlyBucket<Sighting> = bucket_read("sightings");

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> StdResult<Response> {
    let config = Config {
        admin: msg.admin,
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
        ExecuteMsg::CreateReport {
            id,
            title,
            description,
            location,
            category,
            severity,
            attachments,
        } => execute_create_report(deps, env, info, id, title, description, location, category, severity, attachments),
        ExecuteMsg::UpdateReportStatus { report_id, status } => {
            execute_update_report_status(deps, env, info, report_id, status)
        },
        ExecuteMsg::AddSighting {
            id,
            report_id,
            location,
            description,
            photos,
        } => execute_add_sighting(deps, env, info, id, report_id, location, description, photos),
        ExecuteMsg::VerifyReport { report_id } => execute_verify_report(deps, env, info, report_id),
        ExecuteMsg::DisputeReport { report_id } => execute_dispute_report(deps, env, info, report_id),
        ExecuteMsg::VerifySighting { sighting_id } => execute_verify_sighting(deps, env, info, sighting_id),
    }
}

fn execute_create_report(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    id: String,
    title: String,
    description: String,
    location: Location,
    category: String,
    severity: u8,
    attachments: Vec<String>,
) -> StdResult<Response> {
    let report = Report {
        id: id.clone(),
        title,
        description,
        location,
        category,
        severity,
        reporter: info.sender.to_string(),
        timestamp: env.block.time.seconds(),
        status: ReportStatus::Open,
        attachments,
        verified_count: 0,
        disputed_count: 0,
    };
    
    REPORTS.save(deps.storage, &id, &report)?;
    
    Ok(Response::new()
        .add_attribute("method", "create_report")
        .add_attribute("report_id", id)
        .add_attribute("reporter", info.sender))
}

fn execute_update_report_status(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    report_id: String,
    status: ReportStatus,
) -> StdResult<Response> {
    let config = CONFIG.load(deps.storage)?;
    
    if info.sender != config.admin {
        return Err(cosmwasm_std::StdError::generic_err("Unauthorized"));
    }
    
    let mut report = REPORTS.load(deps.storage, &report_id)?;
    report.status = status;
    REPORTS.save(deps.storage, &report_id, &report)?;
    
    Ok(Response::new()
        .add_attribute("method", "update_report_status")
        .add_attribute("report_id", report_id))
}

fn execute_add_sighting(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    id: String,
    report_id: String,
    location: Location,
    description: String,
    photos: Vec<String>,
) -> StdResult<Response> {
    let sighting = Sighting {
        id: id.clone(),
        report_id: report_id.clone(),
        witness: info.sender.to_string(),
        location,
        timestamp: env.block.time.seconds(),
        description,
        photos,
        verified: false,
    };
    
    SIGHTINGS.save(deps.storage, &id, &sighting)?;
    
    Ok(Response::new()
        .add_attribute("method", "add_sighting")
        .add_attribute("sighting_id", id)
        .add_attribute("report_id", report_id))
}

fn execute_verify_report(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    report_id: String,
) -> StdResult<Response> {
    let mut report = REPORTS.load(deps.storage, &report_id)?;
    report.verified_count += 1;
    REPORTS.save(deps.storage, &report_id, &report)?;
    
    Ok(Response::new()
        .add_attribute("method", "verify_report")
        .add_attribute("report_id", report_id)
        .add_attribute("verifier", info.sender))
}

fn execute_dispute_report(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    report_id: String,
) -> StdResult<Response> {
    let mut report = REPORTS.load(deps.storage, &report_id)?;
    report.disputed_count += 1;
    REPORTS.save(deps.storage, &report_id, &report)?;
    
    Ok(Response::new()
        .add_attribute("method", "dispute_report")
        .add_attribute("report_id", report_id)
        .add_attribute("disputer", info.sender))
}

fn execute_verify_sighting(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    sighting_id: String,
) -> StdResult<Response> {
    let config = CONFIG.load(deps.storage)?;
    
    if info.sender != config.admin {
        return Err(cosmwasm_std::StdError::generic_err("Unauthorized"));
    }
    
    let mut sighting = SIGHTINGS.load(deps.storage, &sighting_id)?;
    sighting.verified = true;
    SIGHTINGS.save(deps.storage, &sighting_id, &sighting)?;
    
    Ok(Response::new()
        .add_attribute("method", "verify_sighting")
        .add_attribute("sighting_id", sighting_id))
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetReport { id } => to_binary(&query_report(deps, id)?),
        QueryMsg::GetReportsByLocation { lat_min, lat_max, lng_min, lng_max } => {
            to_binary(&query_reports_by_location(deps, lat_min, lat_max, lng_min, lng_max)?)
        },
        QueryMsg::GetReportsByCategory { category } => {
            to_binary(&query_reports_by_category(deps, category)?)
        },
        QueryMsg::GetReportsByReporter { reporter } => {
            to_binary(&query_reports_by_reporter(deps, reporter)?)
        },
        QueryMsg::GetSightings { report_id } => to_binary(&query_sightings(deps, report_id)?),
        QueryMsg::GetAllReports { limit, offset } => {
            to_binary(&query_all_reports(deps, limit, offset)?)
        },
    }
}

fn query_report(deps: Deps, id: String) -> StdResult<Report> {
    REPORTS_READ.load(deps.storage, &id)
}

fn query_reports_by_location(
    deps: Deps,
    lat_min: f64,
    lat_max: f64,
    lng_min: f64,
    lng_max: f64,
) -> StdResult<Vec<Report>> {
    let reports: StdResult<Vec<_>> = REPORTS_READ
        .range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
        .filter(|(_, report)| {
            if let Ok(report) = report {
                report.location.latitude >= lat_min
                    && report.location.latitude <= lat_max
                    && report.location.longitude >= lng_min
                    && report.location.longitude <= lng_max
            } else {
                false
            }
        })
        .map(|(_, report)| report)
        .collect();
    
    reports
}

fn query_reports_by_category(deps: Deps, category: String) -> StdResult<Vec<Report>> {
    let reports: StdResult<Vec<_>> = REPORTS_READ
        .range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
        .filter(|(_, report)| {
            if let Ok(report) = report {
                report.category == category
            } else {
                false
            }
        })
        .map(|(_, report)| report)
        .collect();
    
    reports
}

fn query_reports_by_reporter(deps: Deps, reporter: String) -> StdResult<Vec<Report>> {
    let reports: StdResult<Vec<_>> = REPORTS_READ
        .range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
        .filter(|(_, report)| {
            if let Ok(report) = report {
                report.reporter == reporter
            } else {
                false
            }
        })
        .map(|(_, report)| report)
        .collect();
    
    reports
}

fn query_sightings(deps: Deps, report_id: String) -> StdResult<Vec<Sighting>> {
    let sightings: StdResult<Vec<_>> = SIGHTINGS_READ
        .range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
        .filter(|(_, sighting)| {
            if let Ok(sighting) = sighting {
                sighting.report_id == report_id
            } else {
                false
            }
        })
        .map(|(_, sighting)| sighting)
        .collect();
    
    sightings
}

fn query_all_reports(
    deps: Deps,
    limit: Option<u32>,
    offset: Option<u32>,
) -> StdResult<Vec<Report>> {
    let limit = limit.unwrap_or(50) as usize;
    let offset = offset.unwrap_or(0) as usize;
    
    let reports: StdResult<Vec<_>> = REPORTS_READ
        .range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
        .skip(offset)
        .take(limit)
        .map(|(_, report)| report)
        .collect();
    
    reports
}
