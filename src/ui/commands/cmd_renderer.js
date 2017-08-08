var CABLES = CABLES || {};
CABLES.CMD = CABLES.CMD || {};
CABLES.CMD.RENDERER = {};

CABLES.CMD.RENDERER.screenshot = function() {
    gui.saveScreenshot();
};

CABLES.CMD.RENDERER.fullscreen = function() {
    gui.cycleRendererSize();
};

CABLES.CMD.RENDERER.animRenderer = function() {
    CABLES.animRenderer.show();
};


CABLES.CMD.RENDERER.changeSize = function() {


    CABLES.UI.MODAL.prompt(
        "Change Renderersize",
        "Enter a new size",
        Math.round(gui.rendererWidth) + ' x ' + Math.round(gui.rendererHeight),
        function(r) {
            var matches = r.match(/\d+/g)
            if (matches.length > 0) {
                gui.rendererWidth = matches[0];
                gui.rendererHeight = matches[1];
                gui.setLayout();
            }
        });

};


CABLES.CMD.commands.push({
        cmd: "save screenshot",
        category: "renderer",
        func: CABLES.CMD.RENDERER.screenshot,
        icon: 'image'
    }, {
        cmd: "toggle fullscreen",
        category: "renderer",
        func: CABLES.CMD.RENDERER.fullscreen,
        icon: 'monitor'
    }, {
        cmd: "change renderer size",
        category: "renderer",
        func: CABLES.CMD.RENDERER.changeSize,
        icon: 'maximize'
    }, {
        cmd: "animation renderer",
        category: "renderer",
        func: CABLES.CMD.RENDERER.animRenderer,
        icon: 'monitor'
    }





);
