variable "project_id" {
  description = "The GCP Project ID"
  type        = string
}

variable "region" {
  description = "The region to deploy to"
  type        = string
  default     = "us-central1"
}

variable "service_name" {
  description = "The name of the Cloud Run service"
  type        = string
  default     = "cardcraft-backend"
}

variable "google_api_key" {
  description = "Google API Key for Custom Search"
  type        = string
  sensitive   = true
}

variable "google_custom_search_cx" {
  description = "Google Custom Search Engine ID"
  type        = string
  sensitive   = true
}

variable "repository_name" {
  description = "The name of the Artifact Registry repository"
  type        = string
  default     = "cardcraft"
}
