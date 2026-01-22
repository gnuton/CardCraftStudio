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

variable "repository_name" {
  description = "The name of the Artifact Registry repository"
  type        = string
  default     = "cardcraft"
}
