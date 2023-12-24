resource "google_compute_instance" "users_service_instance" {
  name         = var.instance_name
  machine_type = var.instance_machine_type
  zone         = var.zone

  tags = ["fis-g4-instance", "http-server", "https-server", "lb-health-check"]

  boot_disk {
    initialize_params {
      image = var.instance_image
    }
  }

  network_interface {
    network = "fis-g4-network-cd"
  }

  metadata = {
    ssh-keys = "${var.user}:${file(var.publickeypath)}"
  }

  metadata_startup_script = file("./scripts/startup.sh")

  provisioner "file" {

    source = ".env.prod"
    destination = "/tmp/.env.prod"
    connection {
      host = self.network_interface[0].network_ip
      type = "ssh"
      user    = var.user
      timeout = "500s"
      private_key = file(var.privatekeypath)
    }
  }

  provisioner "file" {

    source = "GoogleCloudKey.json"
    destination = "/tmp/GoogleCloudKey.json"
    connection {
      host = self.network_interface[0].network_ip
      type = "ssh"
      user    = var.user
      timeout = "500s"
      private_key = file(var.privatekeypath)
    }
  }

  depends_on = [google_compute_firewall.fis_g4_firewall_cd, google_compute_firewall.fis_g4_allow_health_check, google_compute_firewall.fis_g4_allow_health_check_https, google_compute_firewall.fis_g4_iap]
}