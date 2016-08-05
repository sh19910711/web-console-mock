package main

import (
	"encoding/json"
	"fmt"
	log "github.com/Sirupsen/logrus"
	"github.com/zenazn/goji"
	"github.com/zenazn/goji/web"
	"io"
	"io/ioutil"
	"net/http"
	"os"
)

type CompleteResponse struct {
	Output  string   `json:"output"`
	Context []string `json:"context"`
}

type OutputResponse struct {
	Output  string   `json:"output"`
	Context []string `json:"context"`
}

func index(c web.C, w http.ResponseWriter, r *http.Request) {
	if buf, err := ioutil.ReadFile("index.html"); err == nil {
		w.Write(buf)
	} else {
		http.Error(w, err.Error(), 500)
	}
}

func updateSession(c web.C, w http.ResponseWriter, r *http.Request) {
	var output interface{}
	if r.FormValue("input") == "nil" {
		if f, err := os.Open("./public/response.json"); err == nil {
			io.Copy(w, f)
		} else {
			http.Error(w, err.Error(), 500)
		}
	} else {
		output = &OutputResponse{
			Output: "fake output",
		}
		if buf, err := json.Marshal(output); err == nil {
			fmt.Fprintln(w, string(buf))
		} else {
			http.Error(w, err.Error(), 500)
		}
	}
}

func github(c web.C, w http.ResponseWriter, r *http.Request) {
	user := c.URLParams["user"]
	repo := c.URLParams["repo"]
	ref := c.URLParams["ref"]
	path := c.URLParams["*"]

	if res, err := http.Get(fmt.Sprintf(
		"https://raw.githubusercontent.com/%s/%s/%s/%s",
		user,
		repo,
		ref,
		path,
	)); err != nil {
		http.Error(w, err.Error(), 500)
		log.Fatal(err)
	} else {
		io.Copy(w, res.Body)
		res.Body.Close()
	}
}

func main() {
	public := web.New()
	public.Get("/public/*", http.StripPrefix("/public/", http.FileServer(http.Dir("public"))))
	http.Handle("/public/", public)

	goji.Get("/", index)
	goji.Put("/repl_sessions/fake", updateSession)
	goji.Get("/github/:user/:repo/:ref/*", github)
	goji.Serve()
}
