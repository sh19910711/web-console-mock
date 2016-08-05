package util

import (
	"regexp"
)

func Ref(ref string) string {
	reg := regexp.MustCompile(`^[a-z0-9_]*$`)
	if reg.MatchString(ref) {
		return ref
	} else {
		return ""
	}
}
