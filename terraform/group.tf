resource "google_compute_http_health_check" "users_service_health_check" {
  name         = var.health_check_name
  request_path = var.health_check_path

  timeout_sec        = 5
  check_interval_sec = 5
}

resource "google_compute_instance_group" "users_service_group" {
  name        = var.group_name
  description = var.group_description

  instances = [
    google_compute_instance.users_sercive_instance.id,
  ]

  named_port {
    name = "http"
    port = "80"
  }

  named_port {
    name = "https"
    port = "443"
  }

  zone = var.zone
}

resource "google_compute_backend_service" "users_service_backend" {
  name      = var.backend_service_name
  port_name = "http"
  protocol  = "HTTP"

  backend {
    group = google_compute_instance_group.users_service_group.id
  }

  health_checks = [
    google_compute_http_health_check.users_service_health_check.id,
  ]
}