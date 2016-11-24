PATH ?= $(npm bin):$(PATH)
NODE ?= node
TEST ?= $(wildcard test/*.js)

browser : browser/thingamajig.js
browser/thingamajig.js : lib/thingamajig/browser.js
	@mkdir -p $(@D)
	@browserify -o $@ lib/thingamajig/browser/scriptexecute.js $<

.PHONY : test %.test
