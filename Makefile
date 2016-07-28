.PHONY: build
build:
	govendor sync
	go build -i

run: build
	go run main.go

fmt:
	go fmt ./...

init:
	go get -u github.com/kardianos/govendor
	govendor init
