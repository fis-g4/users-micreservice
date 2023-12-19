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