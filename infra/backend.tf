terraform {
  backend "gcs" {
    bucket = "cardcraft-studio-tfstate"
    prefix = "terraform/state"
  }
}
