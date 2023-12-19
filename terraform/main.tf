terraform {
  cloud {
    organization = "FIS-G4"

    workspaces {
      name = "fis-g4"
    }
  }
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "4.51.0"
    }
  }
}

provider "google" {
  credentials = file("${var.json_credentials}")

  project = var.project_id
  region  = var.region
  zone    = var.zone
}