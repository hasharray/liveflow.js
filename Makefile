PATH ?= $(npm bin):$(PATH)
NODE ?= node
TEST ?= $(wildcard test/*.js)

browser : browser/thingamajig.js
browser/thingamajig.js : lib/thingamajig.js
	@mkdir -p $(@D)
	@browserify -o $@ $<

extension : \
	extension/inject.js \
	extension/manifest.json \

extension/manifest.json : package.json
	@echo "" > $@
	@echo "{" >> $@
	@echo "  \"manifest_version\": 2," >> $@
	@echo "$$(cat package.json | grep name)" >> $@
	@echo "$$(cat package.json | grep version)" >> $@
	@echo "  \"content_scripts\": [" >> $@
	@echo "    {" >> $@
	@echo "      \"matches\": [\"<all_urls>\"]," >> $@
	@echo "      \"js\": [\"inject.js\"]," >> $@
	@echo "      \"run_at\": \"document_start\"" >> $@
	@echo "    }" >> $@
	@echo "  ]," >> $@
	@echo "  \"permissions\": [" >> $@
	@echo "    \"tabs\", \"<all_urls>\"" >> $@
	@echo "  ]" >> $@
	@echo "}" >> $@

extension/inject.js : lib/thingamajig.js
	@mkdir -p $(@D)
	@browserify -o $@ $<

.PHONY : test %.test
