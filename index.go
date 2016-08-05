package main

import (
	log "github.com/Sirupsen/logrus"
	"github.com/sh19910711/web-console-mock/util"
	"github.com/zenazn/goji/web"
	"html/template"
	"io/ioutil"
	"net/http"
)

type IndexHTML struct {
	Ref string
}

func renderIndex(c web.C, w http.ResponseWriter) error {
	buf, err := ioutil.ReadFile("index.html")
	if err != nil {
		return err
	}

	t := template.Must(template.New("html").Parse(string(buf)))

	if err := t.Execute(w, IndexHTML{Ref: util.Ref(c.URLParams["ref"])}); err != nil {
		return err
	}

	return nil
}

func index(c web.C, w http.ResponseWriter, r *http.Request) {
	if err := renderIndex(c, w); err != nil {
		http.Error(w, err.Error(), 500)
		log.Warn(err)
	}
}
