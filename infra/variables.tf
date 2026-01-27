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

variable "google_client_id" {
  description = "Google OAuth Client ID"
  type        = string
  sensitive   = true
}

variable "google_client_secret" {
  description = "Google OAuth Client Secret"
  type        = string
  sensitive   = true
}

variable "repository_name" {
  description = "The name of the Artifact Registry repository"
  type        = string
  default     = "cardcraft"
}

variable "token_encryption_key" {
  description = "Key for encrypting refresh tokens"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "Secret for JWT signing"
  type        = string
  sensitive   = true
}

variable "stripe_secret_key" {
  description = "Stripe Secret Key"
  type        = string
  sensitive   = true
}

variable "stripe_webhook_secret" {
  description = "Stripe Webhook Secret"
  type        = string
  sensitive   = true
}

variable "google_redirect_uri" {
  description = "Google OAuth Redirect URI"
  type        = string
}

variable "allowed_origins" {
  description = "Comma-separated list of allowed CORS origins"
  type        = string
}
