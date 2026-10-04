use axum::{
    Json, Router,
    extract::State,
    http::{HeaderValue, Method},
    routing::get,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;
use tower_http::cors::{AllowOrigin, CorsLayer};

#[derive(Serialize)]
struct HealthResponse {
    status: &'static str,
}

async fn health() -> Json<HealthResponse> {
    Json(HealthResponse { status: "ok" })
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
}

async fn get_questions(State(state): State<AppState>) -> Json<Vec<AwsQuestion>> {
    Json(state.questions.read().await.clone())
}

async fn save_questions(
    State(state): State<AppState>,
    Json(incoming): Json<Vec<AwsQuestion>>,
) -> Json<Vec<AwsQuestion>> {
    let mut questions = state.questions.write().await;
    for question in incoming {
        if !questions
            .iter()
            .any(|saved| saved.question == question.question)
        {
            questions.push(question);
        }
    }
    Json(questions.clone())
}

pub fn app() -> Router {
    app_with_state(AppState::default())
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
