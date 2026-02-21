use aws_config::Region;
use aws_credential_types::Credentials;
use aws_sdk_s3::{config::Builder as S3ConfigBuilder, Client};
use bytes::Bytes;

const MAX_INPUT_SIZE: usize = 10 * 1024 * 1024; // 10MB

#[derive(Debug, thiserror::Error)]
pub enum StorageError {
    #[error("object not found: {0}")]
    NotFound(String),
    #[error("object too large: {size} bytes (max {MAX_INPUT_SIZE})")]
    TooLarge { size: usize },
    #[error("storage error: {0}")]
    Internal(String),
}

#[derive(Clone)]
pub struct R2Client {
    client: Client,
    bucket: String,
}

impl R2Client {
    pub fn from_env() -> Self {
        let endpoint = std::env::var("R2_ENDPOINT").expect("R2_ENDPOINT is required");
        let access_key = std::env::var("R2_ACCESS_KEY_ID").expect("R2_ACCESS_KEY_ID is required");
        let secret_key =
            std::env::var("R2_SECRET_ACCESS_KEY").expect("R2_SECRET_ACCESS_KEY is required");
        let bucket = std::env::var("R2_BUCKET_NAME").expect("R2_BUCKET_NAME is required");

        let credentials = Credentials::new(access_key, secret_key, None, None, "r2");

        let config = S3ConfigBuilder::new()
            .endpoint_url(endpoint)
            .region(Region::new("auto"))
            .credentials_provider(credentials)
            .force_path_style(true)
            .build();

        let client = Client::from_conf(config);

        Self { client, bucket }
    }

    pub async fn get_object(&self, key: &str) -> Result<Bytes, StorageError> {
        let resp = self
            .client
            .get_object()
            .bucket(&self.bucket)
            .key(key)
            .send()
            .await
            .map_err(|e| {
                let service_err = e.into_service_error();
                if service_err.is_no_such_key() {
                    StorageError::NotFound(key.to_string())
                } else {
                    StorageError::Internal(service_err.to_string())
                }
            })?;

        if let Some(len) = resp.content_length() {
            let len = len as usize;
            if len > MAX_INPUT_SIZE {
                return Err(StorageError::TooLarge { size: len });
            }
        }

        let body = resp
            .body
            .collect()
            .await
            .map_err(|e| StorageError::Internal(e.to_string()))?
            .into_bytes();

        if body.len() > MAX_INPUT_SIZE {
            return Err(StorageError::TooLarge { size: body.len() });
        }

        Ok(body)
    }
}
