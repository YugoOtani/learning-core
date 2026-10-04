use axum::{
    Json, Router,
    extract::State,
    http::{HeaderMap, HeaderValue, Method},
    routing::get,
};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;
use tower_http::cors::{AllowOrigin, CorsLayer};

#[derive(Serialize)]
struct HealthResponse {
    status: &'static str,
}

async fn health() -> (HeaderMap, Json<HealthResponse>) {
    let mut headers = HeaderMap::new();
    headers.insert("x-question-store", HeaderValue::from_static("file-v1"));
    (headers, Json(HealthResponse { status: "ok" }))
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AwsQuestion {
    question: String,
    choices: Vec<AwsQuestionChoice>,
    correct_answers: Vec<String>,
}

#[derive(Clone, Deserialize, Serialize)]
pub struct AwsQuestionChoice {
    label: String,
    text: String,
}

#[derive(Clone, Default)]
struct AppState {
    questions: Arc<RwLock<Vec<AwsQuestion>>>,
    persistence_path: Option<PathBuf>,
}

async fn get_questions(State(state): State<AppState>) -> Json<Vec<AwsQuestion>> {
    Json(state.questions.read().await.clone())
}

async fn save_questions(
    State(state): State<AppState>,
    Json(incoming): Json<Vec<AwsQuestion>>,
) -> Result<Json<Vec<AwsQuestion>>, axum::http::StatusCode> {
    let mut questions = state.questions.write().await;
    let mut updated_questions = questions.clone();
    for question in incoming {
        if !updated_questions
            .iter()
            .any(|saved| saved.question == question.question)
        {
            updated_questions.push(question);
        }
    }

    if let Some(path) = &state.persistence_path {
        persist_questions(path, &updated_questions)
            .await
            .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;
    }

    *questions = updated_questions.clone();
    Ok(Json(updated_questions))
}

async fn persist_questions(path: &PathBuf, questions: &[AwsQuestion]) -> std::io::Result<()> {
    let parent = path
        .parent()
        .expect("question data path must have a parent directory");
    tokio::fs::create_dir_all(parent).await?;
    let temporary_path = path.with_extension("json.tmp");
    let json = serde_json::to_vec(questions).map_err(std::io::Error::other)?;
    tokio::fs::write(&temporary_path, json).await?;
    tokio::fs::rename(temporary_path, path).await
}

pub fn app() -> Router {
    let persistence_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("data")
        .join("aws-question-review.json");
    let questions = match std::fs::read(&persistence_path) {
        Ok(data) => serde_json::from_slice(&data)
            .expect("saved AWS question data is invalid JSON; file was left unchanged"),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Vec::new(),
        Err(error) => panic!("failed to read saved AWS question data: {error}"),
    };
    app_with_state(AppState {
        questions: Arc::new(RwLock::new(questions)),
        persistence_path: Some(persistence_path),
    })
}

fn app_with_state(state: AppState) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(AllowOrigin::list([
            HeaderValue::from_static("http://localhost:5173"),
            HeaderValue::from_static("http://127.0.0.1:5173"),
        ]))
        .allow_methods([Method::GET, Method::PUT])
        .allow_headers([axum::http::header::CONTENT_TYPE]);

    Router::new()
        .route("/health", get(health))
        .route(
            "/aws-question-review/questions",
            get(get_questions).put(save_questions),
        )
        .with_state(state)
        .layer(cors)
}

#[cfg(test)]
mod tests {
    use axum::{body::Body, http::Request};
    use tower::ServiceExt;

    use super::app;

    #[tokio::test]
    async fn health_returns_ok_status() {
        let response = app()
            .oneshot(
                Request::builder()
                    .uri("/health")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), axum::http::StatusCode::OK);
        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        assert_eq!(body.as_ref(), br#"{"status":"ok"}"#);
    }

    #[tokio::test]
    async fn health_allows_both_local_frontend_origins() {
        for origin in ["http://localhost:5173", "http://127.0.0.1:5173"] {
            let response = app()
                .oneshot(
                    Request::builder()
                        .uri("/health")
                        .header(axum::http::header::ORIGIN, origin)
                        .body(Body::empty())
                        .unwrap(),
                )
                .await
                .unwrap();

            assert_eq!(
                response
                    .headers()
                    .get(axum::http::header::ACCESS_CONTROL_ALLOW_ORIGIN)
                    .unwrap(),
                origin
            );
        }
    }
}
