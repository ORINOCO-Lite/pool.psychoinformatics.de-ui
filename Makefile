# Important directories
VUE_APP_DIR = shacl-vue
DIST_DIR_UI = dist/ui
DIST_DIR_STARTER = dist/kickstarter
PLUGIN_DIR = plugins
RUNTIME_PLUGIN_DIR = $(VUE_APP_DIR)/src/runtime-plugins

all: install build-ui build-starter

# Install vite and shacl-vue dependencies
install:
	npm install vite
	cd $(VUE_APP_DIR) && npm install

# Copy runtime plugins before build
# Build shacl-vue using top-level Vite-config
# Copy shacl-vue config to dist directory
build-ui: clean-ui
	cp -r $(PLUGIN_DIR) $(RUNTIME_PLUGIN_DIR)
	cd $(VUE_APP_DIR) && npm run build:app
	mkdir -p ./$(DIST_DIR_UI)
	mv $(VUE_APP_DIR)/dist/app/* ./$(DIST_DIR_UI)
	cp config.* $(DIST_DIR_UI)/
	cp favicon.ico $(DIST_DIR_UI)/favicon.ico
	cp *logo* $(DIST_DIR_UI)/
	cp -r templates $(DIST_DIR_UI)/

build-starter: clean-starter
	cp -r $(PLUGIN_DIR) $(RUNTIME_PLUGIN_DIR)
	cd $(VUE_APP_DIR) && VITE_SHACLVUE_VARIANT=starter npm run build:app
	mkdir -p ./$(DIST_DIR_STARTER)
	mv $(VUE_APP_DIR)/dist/app/* ./$(DIST_DIR_STARTER)
	cp config.* $(DIST_DIR_STARTER)/
	cp favicon.ico $(DIST_DIR_STARTER)/favicon.ico
	cp *logo* $(DIST_DIR_STARTER)/
	cp -r templates $(DIST_DIR_STARTER)/

# Clean output
clean:
	rm -rf dist

clean-ui:
	rm -rf $(DIST_DIR_UI)

clean-starter:
	rm -rf $(DIST_DIR_STARTER)

test-ui: install build-ui
	npx serve $(DIST_DIR_UI) -l 3000

test-starter: install build-starter
	npx serve $(DIST_DIR_STARTER) -l 3000

.PHONY: install build-ui build-starter clean-ui clean-starter deploy test-ui
