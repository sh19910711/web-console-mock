package main

import (
	"fmt"
	log "github.com/Sirupsen/logrus"
	"github.com/zenazn/goji"
	"github.com/zenazn/goji/web"
	"io"
	"net/http"
	"os"
)

func github(c web.C, w http.ResponseWriter, r *http.Request) {
	ref := c.URLParams["ref"]
	path := c.URLParams["*"]

	if res, err := http.Get(fmt.Sprintf("https://raw.githubusercontent.com/sh19910711/web-console-mock/%s/%s", ref, path)); err != nil {
		http.Error(w, err.Error(), 500)
		log.Warn(err)
	} else {
		io.Copy(w, res.Body)
		res.Body.Close()
	}
}

func main() {
	log.SetOutput(os.Stderr)
	log.SetLevel(log.DebugLevel)

	public := web.New()
	public.Get("/public/*", http.StripPrefix("/public/", http.FileServer(http.Dir("public"))))
	http.Handle("/public/", public)

	goji.Get("/", index)
	goji.Get("/r/:ref", index)
	goji.Put("/repl_sessions/fake", updateSession)
	goji.Put("/repl_sessions/fake/:ref", updateSession)
	goji.Get("/github/:ref/*", github)
	goji.Serve()
}
