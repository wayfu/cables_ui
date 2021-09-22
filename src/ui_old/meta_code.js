CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};


CABLES.UI.OpShowMetaCode = 0;

CABLES.UI.MetaCode = function (tabs)
{
    this._tab = new CABLES.UI.Tab("code", { "icon": "code", "infotext": "tab_code", "showTitle": false, "hideToolbar": true, "padding": true });
    tabs.addTab(this._tab);
    this._tab.addEventListener("onActivate", function ()
    {
        this.show();
    }.bind(this));

    let initialized = false;
    let op = null;
    this._lastSelectedOp = null;
    this._currentName = null;

    this.init = function ()
    {
        if (initialized) return;
        initialized = true;

        gui.opParams.addEventListener("opSelected", this.onOpSelected.bind(this));
    };

    this.onOpSelected = function (_op)
    {
        this._lastSelectedOp = _op;

        if (!this._tab.isVisible()) return;

        clearTimeout(CABLES.UI.OpShowMetaCode);
        CABLES.UI.OpShowMetaCode = setTimeout(function ()
        {
            op = this._lastSelectedOp;
            this.show();
        }.bind(this), 100);
    };

    this.show = function ()
    {
        if (this._lastSelectedOp != op) this.onOpSelected(this._lastSelectedOp);
        // this._tab.activate();
        if (!op)
        {
            this._currentName = null;
            this._tab.html("<h3>Code</h3>Select any Op");
            return;
        }

        // if (this._currentName == op.objName) return;

        this._currentName = op.objName;
        this._tab.html("<div class=\"loading\" style=\"width:40px;height:40px;\"></div>");


        if (window.process && window.process.versions.electron) return;
        if (op)
        {
            CABLES.api.get(
                "op/" + op.objName + "/info",
                function (res)
                {
                    const perf = CABLES.UI.uiProfiler.start("showOpCodeMetaPanel");
                    const doc = {};
                    let summary = "";

                    if (res.attachmentFiles)
                    {
                        const attachmentFiles = [];
                        for (let i = 0; i < res.attachmentFiles.length; i++)
                        {
                            attachmentFiles.push(
                                {
                                    "readable": res.attachmentFiles[i].substr(4),
                                    "original": res.attachmentFiles[i],
                                });
                        }
                        doc.attachmentFiles = attachmentFiles;
                    }

                    doc.libs = gui.serverOps.getOpLibs(op.objName, false);
                    doc.coreLibs = gui.serverOps.getCoreLibs(op.objName, false);
                    summary = gui.opDocs.getSummary(op.objName);

                    if (op.objName.indexOf("User.") == -1)
                        op.github = "https://github.com/pandrr/cables/tree/master/src/ops/base/" + op.objName;

                    const html = CABLES.UI.getHandleBarHtml("meta_code",
                        {
                            op,
                            doc,
                            summary,
                            "ownsOp": gui.serverOps.ownsOp(op.objName),
                            "libs": gui.opDocs.libs,
                            "coreLibs": gui.opDocs.coreLibs,
                            "user": gui.user,
                            "opserialized": op.getSerialized()
                        });
                    this._tab.html(html);

                    perf.finish();
                }.bind(this), function ()
                {
                    console.log("error api?");
                });
        }
    };
};