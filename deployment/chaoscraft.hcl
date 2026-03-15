variable "domain" {
  type = string
}
variable "image_version" {
  type = string
}
variable "registry_auth" {
  type = object({
    username = string
    password = string
  })
}

job "chaoscraft" {
  datacenters = ["de1"]
  type        = "service"

  update {
    auto_revert  = true
    auto_promote = true
    canary       = 1
  }

  group "app" {
    network {
      mode = "bridge"
      port "http" {
        to = 3000
      }
    }
    service {
      name = "chaoscraft"
      port = "http"
      tags = [
        "traefik.enable=true",
        "traefik.http.routers.${NOMAD_JOB_NAME}-${NOMAD_GROUP_NAME}.tls=true",
        "traefik.http.routers.${NOMAD_JOB_NAME}-${NOMAD_GROUP_NAME}.tls.certresolver=letsencrypt",
        "traefik.http.routers.${NOMAD_JOB_NAME}-${NOMAD_GROUP_NAME}.rule=(Host(`app.${var.domain}`))",
      ]
    }
    task "app" {
      driver = "docker"

      config {
        image = "ghcr.io/xeroc/chaoscraft:${var.image_version}"
        auth {
          username = "${var.registry_auth.username}"
          password = "${var.registry_auth.password}"
        }
      }
      env {
        # DATABASE_URL = "not-yet-implemented"
        NEXT_PUBLIC_BASE_URL     = "https://app.${var.domain}"
        GITHUB_OWNER             = "chainsquad"
        GITHUB_REPO              = "chaoscraft"
        NEXT_PUBLIC_GITHUB_OWNER = "chainsquad"
        NEXT_PUBLIC_GITHUB_REPO  = "chaoscraft"
        DATABASE_TYPE            = "postgres"
      }

      vault {
        policies    = ["chaoscraft"]
        change_mode = "restart"
      }
      template {
        destination = "secrets/config.env"
        data        = <<-EOF
          {{ with secret "secrets/data/chaoscraft" }}
          {{ range $k, $v := .Data.data }}
          {{ $k }}={{ $v }}
          {{ end }}{{ end }}
        EOF
        env         = true
      }
      resources {
        cpu    = 521
        memory = 1024
      }
    }
  }
}
