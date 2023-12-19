resource "google_compute_instance" "compute_instance" {
  name         = var.instance_name
  machine_type = var.instance_machine_type
  zone         = var.zone

  tags = ["fis-g4-instance"]

  boot_disk {
    initialize_params {
      image = var.instance_image
    }
  }

  network_interface {
    network = "fis-g4-network-cd"

    access_config {
      nat_ip = google_compute_address.static.address
    }
  }

  metadata = {
    ssh-keys = "${var.user}:${file(var.publickeypath)}"
  }

  provisioner "file" {

    source = "scripts/run-docker.sh"
    destination = "/tmp/run-docker.sh"
    connection {
      host = google_compute_address.static.address
      type = "ssh"
      user    = var.user
      timeout = "500s"
      private_key = file(var.privatekeypath)
    }
  }

  provisioner "file" {

    source = "scripts/startup.sh"
    destination = "/tmp/startup.sh"
    connection {
      host = google_compute_address.static.address
      type = "ssh"
      user    = var.user
      timeout = "500s"
      private_key = file(var.privatekeypath)
    }
  }

  provisioner "file" {

    source = ".env.prod"
    destination = "/tmp/.env.prod"
    connection {
      host = google_compute_address.static.address
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
      host = google_compute_address.static.address
      type = "ssh"
      user    = var.user
      timeout = "500s"
      private_key = file(var.privatekeypath)
    }
  }
  
  provisioner "remote-exec" {
    connection {
      host = google_compute_address.static.address
      type = "ssh"
      user    = var.user
      timeout = "500s"
      private_key = file(var.privatekeypath)
    }

    inline = [
      "chmod a+x /tmp/startup.sh",
      "sed -i -e 's/\r$//' /tmp/startup.sh",
      "sudo /tmp/startup.sh",
      "chmod a+x /tmp/run-docker.sh",
      "sed -i -e 's/\r$//' /tmp/run-docker.sh",
      "sudo /tmp/run-docker.sh",

    ]
  }

  depends_on = [google_compute_firewall.fis_g4_firewall_cd]
}


resource "google_compute_address" "static" {
  name       = "${var.instance_name}-public-address"
  depends_on = [google_compute_firewall.fis_g4_firewall_cd]
}