package main

import (
	"encoding/json"
	"fmt"
	log "github.com/Sirupsen/logrus"
	"github.com/sh19910711/web-console-mock/util"
	"github.com/zenazn/goji/web"
	"io"
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

func getOrOpen(w http.ResponseWriter, ref string) error {
	if ref != "" {
		log.Debug("http.Get: ", ref)
		if res, err := http.Get(fmt.Sprintf("https://raw.githubusercontent.com/sh19910711/web-console-mock/%s/public/response.json", ref)); err != nil {
			return err
		} else {
			io.Copy(w, res.Body)
			res.Body.Close()
		}
	} else {
		log.Debug("os.Open")
		if res, err := os.Open("./public/response.json"); err != nil {
			return err
		} else {
			io.Copy(w, res)
		}
	}
	return nil
}

func updateSession(c web.C, w http.ResponseWriter, r *http.Request) {
	log.Debug("update session")

	var output interface{}
	if r.FormValue("input") == "nil" {
		log.Debug("with input")
		if err := getOrOpen(w, util.Ref(c.URLParams["ref"])); err != nil {
			http.Error(w, err.Error(), 500)
		}
	} else {
		log.Debug("without input")
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
