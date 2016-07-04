package main

import(
  "fmt"
  "net/http"
  "io/ioutil"
  "encoding/json"
  "github.com/zenazn/goji"
  "github.com/zenazn/goji/web"
)

func index(c web.C, w http.ResponseWriter, r *http.Request) {
  buf, err := ioutil.ReadFile("index.html")
  if err != nil {
    http.Error(w, http.StatusText(500), 500)
    return
  }
  w.Write(buf)
}

type CompleteResponse struct {
  Output string `json:"output"`
  Context []string `json:"context"`
}

type OutputResponse struct {
  Output string `json:"output"`
  Context []string `json:"context"`
}

func update_session(c web.C, w http.ResponseWriter, r *http.Request) {
  var output interface {}
  if r.FormValue("input") == "nil" {
    output = &CompleteResponse {
      Output: "nil",
      Context: []string{"something", "somewhat", "somewhere", "another", "one_more_thing"},
    }
  } else {
    output = &OutputResponse {
      Output: "fake output",
    }
  }
  buf, err := json.Marshal(output)
  if err != nil {
    http.Error(w, http.StatusText(500), 500)
    return
  }
  fmt.Fprintln(w, string(buf))
}

func main() {
  public := web.New()
  public.Get("/public/*", http.StripPrefix("/public/", http.FileServer(http.Dir("public"))))
  http.Handle("/public/", public)

  goji.Get("/", index)
  goji.Put("/repl_sessions/fake", update_session)
  goji.Serve()
}
