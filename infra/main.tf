provider "google" {
  project = var.project_id
  region  = var.region
}

# 1. Enable APIs
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "customsearch.googleapis.com",
    "aiplatform.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com"
  ])
  service            = each.key
  disable_on_destroy = false
}

# 2. Artifact Registry
resource "google_artifact_registry_repository" "repo" {
  location      = var.region
  repository_id = var.repository_name
  description   = "Docker repository for CardCraft"
  format        = "DOCKER"
  depends_on    = [google_project_service.apis]
}

# 3. Cloud Run Service 
# We define it here, but the image will be provided by the CI/CD pipeline
# This ensures environment variables and infrastructure settings are managed as code.
resource "google_cloud_run_v2_service" "backend" {
  name     = var.service_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    containers {
      image = "us-docker.pkg.dev/cloudrun/container/hello" # Placeholder, will be updated by GH Action
      
      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      # Environment Variables (Managed here!)
      env {
        name  = "GOOGLE_CLOUD_PROJECT"
        value = var.project_id
      }
      
      # Sensitive variables should be in Secret Manager in production, 
      # but for now we can pass them from GitHub Secrets to Cloud Run directly 
      # or managed them as 'secret' env vars if we had Secret Manager set up.
      # For simplicity in this step, we will expect the GH Action to set env vars 
      # during deployment or we can define placeholders here.
    }
    
    scaling {
      max_instance_count = 10
      min_instance_count = 0
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image, # Allow GH Action to update image without TF reverting it
    ]
  }

  depends_on = [google_project_service.apis]
}

# 4. IAM - Allow Unauthenticated Access
resource "google_cloud_run_v2_service_iam_member" "public_access" {
  location = google_cloud_run_v2_service.backend.location
  name     = google_cloud_run_v2_service.backend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
# 5. IAM - Permissions for the GitHub Actions Service Account
resource "google_project_iam_member" "github_actions_run" {
  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:github-actions@${var.project_id}.iam.gserviceaccount.com"
}

resource "google_project_iam_member" "github_actions_registry" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:github-actions@${var.project_id}.iam.gserviceaccount.com"
}

resource "google_project_iam_member" "github_actions_sa_user" {
  project = var.project_id
  role    = "roles/iam.serviceAccountUser"
  member  = "serviceAccount:github-actions@${var.project_id}.iam.gserviceaccount.com"
}
