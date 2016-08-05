.PHONY: all
all: init build

.PHONY: build
build:
	govendor sync
	go build -i

run: build
	go run ./*.go

fmt:
	go fmt ./...

init:
	go get -u github.com/kardianos/govendor
	govendor init
