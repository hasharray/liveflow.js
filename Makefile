PATH ?= $(npm bin):$(PATH)
NODE ?= node
TEST ?= $(wildcard test/*.js)

browser : browser/thingamajig.js
browser/thingamajig.js : lib/thingamajig.js
	@mkdir -p $(@D)
	@browserify -o $@ $<

.PHONY : test %.test
