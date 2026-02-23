use axum::extract::{Path, Query, State};
use axum::http::{StatusCode, header};
use axum::response::IntoResponse;
use serde::Deserialize;

use crate::storage::{R2Client, StorageError};
use crate::transform::{self, TransformError, TransformParams};

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("bad request: {0}")]
    BadRequest(String),
    #[error("not found: {0}")]
    NotFound(String),
    #[error("transform failed: {0}")]
    TransformFailed(String),
    #[error("internal error: {0}")]
    Internal(String),
}

impl From<StorageError> for AppError {
    fn from(e: StorageError) -> Self {
        match e {
            StorageError::NotFound(key) => AppError::NotFound(key),
            StorageError::TooLarge { size } => {
                AppError::BadRequest(format!("object too large: {size} bytes"))
            }
            StorageError::Internal(msg) => AppError::Internal(msg),
        }
    }
}

impl From<TransformError> for AppError {
    fn from(e: TransformError) -> Self {
        match e {
            TransformError::InvalidParams(msg) => AppError::BadRequest(msg),
            TransformError::SourceTooLarge { .. } => AppError::BadRequest(e.to_string()),
            TransformError::Decode(msg)
            | TransformError::Encode(msg)
            | TransformError::Resize(msg) => AppError::TransformFailed(msg),
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        let (status, message) = match &self {
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg.as_str()),
            AppError::NotFound(_) => (StatusCode::NOT_FOUND, "not found"),
            AppError::TransformFailed(_) => {
                tracing::error!("transform failed: {self}");
                (StatusCode::UNPROCESSABLE_ENTITY, "transform failed")
            }
            AppError::Internal(_) => {
                tracing::error!("internal error: {self}");
                (StatusCode::INTERNAL_SERVER_ERROR, "internal error")
            }
        };

        (
            status,
            [(header::CONTENT_TYPE, "application/json")],
            format!(r#"{{"error":"{message}"}}"#),
        )
            .into_response()
    }
}

const MAX_KEY_LENGTH: usize = 1024;

fn is_allowed_key_char(c: char) -> bool {
    matches!(c, 'a'..='z' | 'A'..='Z' | '0'..='9' | '/' | '-' | '_' | '.')
}

fn validate_key(key: &str) -> Result<(), AppError> {
    if key.is_empty() {
        return Err(AppError::BadRequest("key is empty".into()));
    }
    if key.len() > MAX_KEY_LENGTH {
        return Err(AppError::BadRequest(format!(
            "key too long: {} (max {MAX_KEY_LENGTH})",
            key.len()
        )));
    }
    if key.starts_with('/') {
        return Err(AppError::BadRequest("key must not start with /".into()));
    }
    if key.contains("..") {
        return Err(AppError::BadRequest("key must not contain ..".into()));
    }
    if key.contains("//") {
        return Err(AppError::BadRequest("key must not contain //".into()));
    }
    if key.contains('\\') {
        return Err(AppError::BadRequest(
            "key must not contain backslash".into(),
        ));
    }
    if !key.chars().all(is_allowed_key_char) {
        return Err(AppError::BadRequest(
            "key contains invalid characters".into(),
        ));
    }
    Ok(())
}

#[derive(Debug, Deserialize)]
pub struct TransformQuery {
    pub w: Option<u32>,
    pub h: Option<u32>,
}

pub async fn transform(
    State(r2): State<R2Client>,
    Path(key): Path<String>,
    Query(query): Query<TransformQuery>,
) -> Result<impl IntoResponse, AppError> {
    validate_key(&key)?;

    let data = r2.get_object(&key).await?;

    let params = TransformParams {
        width: query.w,
        height: query.h,
    };

    let output = tokio::task::spawn_blocking(move || transform::transform(&data, &params))
        .await
        .map_err(|e| AppError::Internal(e.to_string()))??;

    Ok((
        StatusCode::OK,
        [
            (header::CONTENT_TYPE, "image/webp"),
            (header::CACHE_CONTROL, "public, max-age=31536000, immutable"),
        ],
        output,
    ))
}

pub async fn health() -> impl IntoResponse {
    (StatusCode::OK, "ok")
}
