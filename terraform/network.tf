resource "google_compute_network" "fis_g4_network_cd" {
  name                    = "fis-g4-network-cd"
  auto_create_subnetworks = true
  mtu                     = 1460
}

resource "google_compute_firewall" "fis_g4_firewall_cd" {
  name    = "fis-g4-firewall-cd"
  network = google_compute_network.fis_g4_network_cd.name

  allow {
    protocol = "icmp"
  }

  allow {
    protocol = "tcp"
    ports    = ["22", "80", "443"]
  }

  source_ranges = ["0.0.0.0/0"]
  source_tags   = ["fis-g4-instance"]
}

resource "google_compute_firewall" "fis_g4_allow_health_check" {
  name    = "fis-g4-allow-health-check"
  network = google_compute_network.fis_g4_network_cd.name

  allow {
    protocol = "tcp"
    ports    = ["80"]
  }

  source_ranges = ["35.191.0.0/16", "130.211.0.0/22"]
  source_tags   = ["fis-g4-instance", "lb-health-check", "http-server", "https-server"]
}

resource "google_compute_firewall" "fis_g4_allow_health_check_https" {
  name    = "fis-g4-allow-health-check-https"
  network = google_compute_network.fis_g4_network_cd.name

  allow {
    protocol = "tcp"
    ports    = ["443"]
  }

  source_ranges = ["35.191.0.0/16", "130.211.0.0/22"]
  source_tags   = ["fis-g4-instance", "lb-health-check", "http-server", "https-server"]
}

resource "google_compute_firewall" "fis_g4_iap" {
  name    = "fis-g4-iap"
  network = google_compute_network.fis_g4_network_cd.name

  allow {
    protocol = "tcp"
  }

  source_ranges = ["35.235.240.0/20"]
  source_tags   = ["fis-g4-instance", "lb-health-check", "http-server", "https-server"]
}