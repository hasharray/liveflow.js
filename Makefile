PATH ?= $(npm bin):$(PATH)
NODE ?= node
TEST ?= $(wildcard test/*.js)

browser : browser/liveflow.js
browser/liveflow.js : lib/liveflow/browser.js
	@mkdir -p $(@D)
	@browserify -o $@ lib/liveflow/browser/scriptexecute.js $<

.PHONY : test %.test
