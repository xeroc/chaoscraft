VERSION := $(shell date +%Y%m%d%H%M)

docker_build:
	docker build -t ghcr.io/xeroc/chaoscraft:$(VERSION) -f apps/portal/Dockerfile .

docker_push:
	docker push ghcr.io/xeroc/chaoscraft:$(VERSION)

docker: docker_build docker_push
