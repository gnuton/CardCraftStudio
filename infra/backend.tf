terraform {
  backend "gcs" {
    bucket = "cardcraft-studio-tfstate-485208"
    prefix = "terraform/state"
  }
}
