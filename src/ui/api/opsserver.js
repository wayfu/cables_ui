import ModalLoading from "../dialogs/modalloading";
import Logger from "../utils/logger";
import EditorTab from "../components/tabs/tab_editor";
import CoreLibLoader from "./corelibloader";
import ModalDialog from "../dialogs/modaldialog";
import text from "../text";
import userSettings from "../components/usersettings";
import { notifyError } from "../elements/notification";
import defaultops from "../defaultops";
import ele from "../utils/ele";
import blueprintUtil from "../blueprint_util";



// todo: merge serverops and opdocs.js and/or response from server ? ....

function capitalize(str)
{
    if (!str) return "";
    const s = (str[0].toUpperCase() + str.slice(1));
    return s;
}

export default class ServerOps
{
    constructor(gui, patchId, next)
    {
        this._log = new Logger("opsserver");
        this._patchId = patchId;
        this._ops = [];
        this._loadedLibs = [];
        this._loadedCoreLibs = [];

        CABLES.editorSession.addListener("op",
            (name, data) =>
            {
                // gui.jobs().start("open op editor" + name);
                CABLES.editorSession.startLoadingTab();
                const lastTab = userSettings.get("editortab");

                if (data && data.opId)
                {
                    name = { "opId": data.opId, "objName": name };
                }

                this.edit(name, false, () =>
                {
                    gui.mainTabs.activateTabByName(lastTab);
                    userSettings.set("editortab", lastTab);
                    CABLES.editorSession.finishLoadingTab();
                });
            }
        );

        CABLES.editorSession.addListener(
            "attachment",
            (name, data) =>
            {
                CABLES.editorSession.startLoadingTab();

                // usersettings stores editortab as basename/att_example.inc
                // editAttachment demands att_example.inc plus the opname to then store
                // stuff in session
                const opBasename = data.opname.substr(data.opname.lastIndexOf(".") + 1);
                const attName = name.replace(opBasename + "/", "");

                // gui.jobs().start("open att editor" + attName);

                if (name.includes("att_") && data && data.opname)
                {
                    const lastTab = userSettings.get("editortab");
                    this.editAttachment(data.opname, attName, false, () =>
                    {
                        gui.mainTabs.activateTabByName(lastTab);
                        userSettings.set("editortab", lastTab);
                        CABLES.editorSession.finishLoadingTab();
                        // gui.jobs().finish("open att editor" + attName);
                    }, true);
                }
            },
        );

        this.loaded = false;
        CABLESUILOADER.preload.opDocsAll.opDocs.forEach((newOp) =>
        {
            this._ops.push(newOp);
        });
        gui.opDocs.addCoreOpDocs();
        this.load(next);
    }

    load(cb)
    {
        CABLESUILOADER.talkerAPI.send(
            "getAllProjectOps",
            { "projectId": this._patchId },
            (err, res) =>
            {
                if (err) this._log.error(err);

                res.forEach((newOp) =>
                {
                    this._ops.push(newOp);
                });
                if (gui.opDocs)
                {
                    gui.opDocs.addOpDocs(res);
                }

                // ops added to opdocs so they are available in opsearch
                // make sure all libraries are loaded for ops that are actually used in project (or in blueprints)
                const usedOps = res.filter((op) => { return op.usedInProject; });
                this.loadOpsLibs(usedOps, () =>
                {
                    if (window.logStartup) logStartup("Ops loaded");
                    if (cb) cb(this._ops);
                    this.loaded = true;
                    incrementStartup();
                });
            },
        );
    }

    isServerOp(name)
    {
        for (let i = 0; i < this._ops.length; i++) if (this._ops[i].name === name) return true;
        return false;
    }


    create(name, cb, openEditor)
    {
        const loadingModal = gui.startModalLoading("Creating op...23");

        loadingModal.setTask("Creating Op");

        CABLESUILOADER.talkerAPI.send(
            "opCreate",
            {
                "opname": name,
            },
            (err, res) =>
            {
                if (err) this._log.error(err);

                loadingModal.setTask("Loading Op");
                this.loadOp(res, () =>
                {
                    if (openEditor)
                    {
                        gui.maintabPanel.show(true);
                        this.edit(name, false, null, true);
                    }
                    gui.serverOps.execute(name);
                    gui.opSelect().reload();
                    gui.endModalLoading();
                    if (cb)cb();
                });
            }
        );
    }

    saveOpLayout(op)
    {
        this.timeoutsLayouts = this.timeoutsLayouts || {};

        clearTimeout(this.timeoutsLayouts[op.objName]);
        this.timeoutsLayouts[op.objName] = setTimeout(
            () =>
            {
                this._saveOpLayout(op);
            }, 1000);
    }

    _saveOpLayout(op)
    {
        if (!op)
        {
            this._log.error("saveoplayout: no op!");
            return;
        }
        let i = 0;
        const opObj = {
            "portsIn": [],
            "portsOut": [],
            "name": op.objName,
        };

        for (i = 0; i < op.portsIn.length; i++)
        {
            if (op.portsIn[i].uiAttribs && op.portsIn[i].uiAttribs.hideParams === true)
            {
                this._log.log("no hidden params in layout and doc");
                // no hidden ports in layout and documentation
                continue;
            }
            const l =
                {
                    "type": op.portsIn[i].type,
                    "name": op.portsIn[i].name
                };

            if (op.portsIn[i].uiAttribs.title) l.uititle = op.portsIn[i].uiAttribs.title;

            if (op.portsIn[i].uiAttribs.group) l.group = op.portsIn[i].uiAttribs.group;
            if (op.portsIn[i].uiAttribs.hidePort) continue;
            if (op.portsIn[i].type === CABLES.OP_PORT_TYPE_VALUE)
            {
                if (op.portsIn[i].uiAttribs.display === "bool") l.subType = "boolean";
                else if (op.portsIn[i].uiAttribs.display === "boolnum") l.subType = "boolean";
                else if (op.portsIn[i].uiAttribs.type === "string") l.subType = "string";
                else if (op.portsIn[i].uiAttribs.increment === "integer") l.subType = "integer";
                else if (op.portsIn[i].uiAttribs.display === "dropdown") l.subType = "select box";
                else l.subType = "number";
            }

            if (op.portsIn[i].uiAttribs.objType) l.objType = op.portsIn[i].uiAttribs.objType;

            opObj.portsIn.push(l);
        }

        for (i = 0; i < op.portsOut.length; i++)
        {
            const l = {
                "type": op.portsOut[i].type,
                "name": op.portsOut[i].name,
            };

            if (op.portsOut[i].uiAttribs.title)l.uititle = op.portsOut[i].uiAttribs.title;

            if (op.portsOut[i].uiAttribs.hidePort) continue;
            if (op.portsOut[i].type == CABLES.OP_PORT_TYPE_VALUE)
            {
                if (op.portsOut[i].uiAttribs.display === "bool") l.subType = "boolean";
                else if (op.portsOut[i].uiAttribs.display === "boolnum") l.subType = "boolean";
                else if (op.portsOut[i].uiAttribs.type === "string") l.subType = "string";
                else if (op.portsOut[i].uiAttribs.display === "dropdown") l.subType = "dropdown";
                else if (op.portsOut[i].uiAttribs.display === "file") l.subType = "url";
                else l.subType = "number";
            }

            if (op.portsOut[i].uiAttribs.objType) l.objType = op.portsOut[i].uiAttribs.objType;
            opObj.portsOut.push(l);
        }

        CABLESUILOADER.talkerAPI.send(
            "opSaveLayout",
            {
                "opname": op.objName,
                "layout": opObj,
            },
            (err, res) =>
            {
                if (err) this._log.error(err);
            },
        );
    }

    execute(name, next, refOldOp)
    {
        if (gui.corePatch()._crashedOps.indexOf(name) > -1)
        {
            let html = "";
            html += "<h1>can not execute op</h1>";
            html += "this op crashed before, you should reload the page.<br/><br/>";
            html += "<a class=\"button\" onclick=\"CABLES.CMD.PATCH.reload();\"><span class=\"icon icon-refresh\"></span>Reload patch</a>&nbsp;&nbsp;";

            CABLES.UI.MODAL.show(html, { "title": "need to reload page" });
        }

        let oldOps = null;
        if (name.indexOf(".") > 0) oldOps = gui.corePatch().getOpsByObjName(name);
        else oldOps = gui.corePatch().getOpsByOpId(name);

        if (oldOps.length > 0) name = oldOps[0].objName;

        for (let i = 0; i < oldOps.length; i++)
            if (oldOps[i].uiAttribs)
                delete oldOps[i].uiAttribs.uierrors;

        const s = document.createElement("script");
        s.setAttribute("src", CABLESUILOADER.noCacheUrl(CABLES.sandbox.getCablesUrl() + "/api/op/" + name));
        s.onload = () =>
        {
            gui.corePatch().reloadOp(
                name,
                (num, newOps) =>
                {
                    CABLES.UI.notify(num + " ops reloaded");

                    for (let i = 0; i < newOps.length; i++)
                    {
                        newOps[i].checkLinkTimeWarnings();
                    }

                    if (newOps.length > 0) this.saveOpLayout(newOps[0]);
                    gui.emitEvent("opReloaded", name, newOps[0]);
                    if (next)next(newOps, refOldOp);
                },
                refOldOp
            );
        };
        document.body.appendChild(s);
    }

    clone(oldname, name, cb)
    {
        this._log.log("clone", name, oldname);

        const loadingModal = gui.startModalLoading("Cloning op...");

        CABLESUILOADER.talkerAPI.send(
            "opClone",
            {
                "opname": oldname,
                "name": name,
            },
            (err, res) =>
            {
                if (err)
                {
                    this._log.log("err res", res);
                    gui.endModalLoading();

                    CABLES.UI.MODAL.showError("Could not clone op", "");

                    return;
                }
                this.loadOp(res, () =>
                {
                    this.edit(name);
                    gui.serverOps.execute(name);
                    gui.opSelect().reload();
                    gui.endModalLoading();
                    if (cb)cb();
                });
            },
        );
    }

    addOpLib(opName, libName, next)
    {
        if (libName === "---") return;
        CABLESUILOADER.talkerAPI.send(
            "opAddLib",
            {
                "opname": opName,
                "name": libName,
            },
            (err, res) =>
            {
                if (err)
                {
                    if (err.msg === "NO_OP_RIGHTS")
                    {
                        let html = "";
                        html += "you are not allowed to add libraries to this op.<br/><br/>";
                        html += "to modify this op, try cloning it";
                        new ModalDialog({ "title": "error adding library", "showOkButton": true, "html": html });
                    }
                    else
                    {
                        let html = "";
                        html += err.msg + "<br/><br/>";
                        new ModalDialog({ "title": "error adding library", "showOkButton": true, "html": html });
                    }
                }
                else
                {
                    gui.serverOps.loadOpDependencies(opName, () =>
                    {
                        this._log.log("lib added!", opName, libName);
                        gui.emitEvent("refreshManageOp", opName);
                        if (next) next();
                    }, true);
                }
            },
        );
    }

    removeOpLib(opName, libName, next)
    {
        const modal = new ModalDialog({ "title": "Really remove library from op?", "text": "Delete " + libName + " from " + opName + "?", "choice": true });
        modal.on("onSubmit", () =>
        {
            CABLESUILOADER.talkerAPI.send(
                "opRemoveLib",
                {
                    "opname": opName,
                    "name": libName,
                },
                (err, res) =>
                {
                    if (err)
                    {
                        CABLES.UI.MODAL.showError("ERROR", "unable to remove library: " + err.msg);
                    }
                    else
                    {
                        gui.serverOps.loadOpDependencies(opName, () =>
                        {
                            this._log.log("lib removed!", opName, libName);
                            gui.emitEvent("refreshManageOp", opName);

                            gui.metaTabs.activateTabByName("code");
                            if (next) next();
                        }, true);
                    }
                }
            );
        });
    }

    addCoreLib(opName, libName, next, options = {})
    {
        if (libName === "---") return;

        CABLESUILOADER.talkerAPI.send(
            "opAddCoreLib",
            {
                "opname": opName,
                "name": libName,
            },
            (err, res) =>
            {
                if (err)
                {
                    if (err.msg === "NO_OP_RIGHTS")
                    {
                        let html = "";
                        html += "you are not allowed to add libraries to this op.<br/><br/>";
                        html += "to modify this op, try cloning it";
                        new ModalDialog({ "title": "error adding core-lib", "showOkButton": true, "html": html });
                    }
                    else
                    {
                        let html = "";
                        html += err.msg + "<br/><br/>";
                        new ModalDialog({ "title": "error adding core-lib", "showOkButton": true, "html": html });
                    }
                }
                else
                {
                    gui.serverOps.loadOpDependencies(opName, () =>
                    {
                        this._log.log("corelib added!", opName, libName);

                        gui.emitEvent("refreshManageOp", opName);
                        // gui.metaTabs.activateTabByName("code");
                        if (next)next();
                    }, true);
                }
            },
        );
    }

    removeCoreLib(opName, libName, next)
    {
        const modal = new ModalDialog({ "title": "Really remove corelib from op?", "text": "Delete " + libName + " from " + opName + "?", "choice": true });
        modal.on("onSubmit", () =>
        {
            CABLESUILOADER.talkerAPI.send(
                "opRemoveCoreLib",
                {
                    "opname": opName,
                    "name": libName,
                },
                (err, res) =>
                {
                    if (err)
                    {
                        CABLES.UI.MODAL.showError("ERROR", "unable to remove corelib: " + err.msg);
                    }
                    else
                    {
                        gui.serverOps.loadOpDependencies(opName, () =>
                        {
                            this._log.log("corelib removed!", opName, libName);
                            gui.emitEvent("refreshManageOp", opName);

                            gui.metaTabs.activateTabByName("code");
                            if (next) next();
                        }, true);
                    }
                },
            );
        });
    }

    deleteAttachment(opName, opId, attName)
    {
        const modal = new ModalDialog({ "title": "Delete attachment from op?", "text": "Delete " + attName + " from " + opName + "?", "choice": true });
        modal.on("onSubmit", () =>
        {
            CABLESUILOADER.talkerAPI.send(
                "opAttachmentDelete",
                {
                    "opname": opId,
                    "name": attName,
                },
                (err, res) =>
                {
                    gui.emitEvent("refreshManageOp", opName);

                    if (err)
                    {
                        CABLES.UI.MODAL.showError("ERROR", "unable to remove attachment: " + err.msg);
                    }
                    else
                    {
                        gui.metaTabs.activateTabByName("code");
                    }
                },
            );
        });
    }

    addAttachmentDialog(opname)
    {
        let html = "Use this attachment in " + opname + " by accessing <code>attachments[\"my_attachment\"]</code>.";
        // html += "<br/><br/>Attachments starting with <code>inc_</code> will be automatically added to your opcode";
        new CABLES.UI.ModalDialog({
            "title": "Create attachment",
            "text": html,
            "prompt": true,
            "promptOk": (attName) =>
            {
                CABLESUILOADER.talkerAPI.send(
                    "opAttachmentAdd",
                    {
                        "opname": opname,
                        "name": attName,
                    },
                    (err, res) =>
                    {
                        this.editAttachment(opname, "att_" + attName);
                        gui.metaTabs.activateTabByName("code");
                        gui.emitEvent("refreshManageOp", opname);
                    },
                );
            }
        });
    }

    opNameDialog(title, name, type, suggestedNamespace, cb, showReplace)
    {
        let newName = name || "";
        if (name && name.indexOf("Ops.") === 0) newName = name.substr(4, name.length);

        let html = "";
        html += "New op name:<br/><br/>";
        html += "<div class=\"clone\"><select class=\"left\" id=\"opNameDialogNamespace\"></select><br/><input type=\"text\" id=\"opNameDialogInput\" value=\"" + newName + "\" placeholder=\"MyAwesomeOpName\" autocomplete=\"off\" autocorrect=\"off\" autocapitalize=\"off\" spellcheck=\"false\"/></div></div>";

        html += "<br/><br/>";
        html += "<div id=\"opcreateerrors\" class=\"hidden issues\" ></div>";
        html += "<div id=\"opNameDialogConsequences\" class=\"consequences\"></div>";
        html += "<br/><br/>";
        html += "<a id=\"opNameDialogSubmit\" class=\"bluebutton hidden\">Create Op</a>";
        html += "<a id=\"opNameDialogSubmitReplace\" class=\"button hidden\">Create and replace existing</a>";


        html += "<br/><br/>";

        const _nameChangeListener = () =>
        {
            const newNamespace = ele.byId("opNameDialogNamespace").value;
            let v = capitalize(ele.byId("opNameDialogInput").value);

            if (v)
            {
                CABLESUILOADER.talkerAPI.send("checkOpName", {
                    "namespace": newNamespace,
                    "v": v
                }, (err, res) =>
                {
                    _updateFormFromApi(res, v, newNamespace);
                });
            }
            else
            {
                ele.hide(ele.byId("opNameDialogSubmit"));
                ele.hide(ele.byId("opNameDialogSubmitReplace"));
            }
        };

        const _updateFormFromApi = (res, newOpName, newNamespace) =>
        {
            let consequencesHtml = "";
            if (res.consequences.length > 0) consequencesHtml += "<ul>";
            res.consequences.forEach((consequence) =>
            {
                consequencesHtml += "<li>" + consequence + "</li>";
            });
            if (consequencesHtml) consequencesHtml += "</ul>";
            ele.byId("opNameDialogConsequences").innerHTML = "<h3>Consequences</h3>" + consequencesHtml;

            if (newOpName)
            {
                if (res.problems.length > 0)
                {
                    let htmlIssue = "<h3>Issues</h3>";
                    htmlIssue += "<ul>";
                    for (let i = 0; i < res.problems.length; i++) htmlIssue += "<li>" + res.problems[i] + "</li>";
                    htmlIssue += "</ul>";
                    const errorsEle = ele.byId("opcreateerrors");
                    errorsEle.innerHTML = htmlIssue;
                    ele.hide(ele.byId("opNameDialogSubmit"));
                    ele.hide(ele.byId("opNameDialogSubmitReplace"));
                    errorsEle.classList.remove("hidden");

                    const versionSuggestions = errorsEle.querySelectorAll(".versionSuggestion");
                    versionSuggestions.forEach((suggest) =>
                    {
                        if (suggest.dataset.shortName)
                        {
                            suggest.addEventListener("pointerdown", (e) =>
                            {
                                ele.byId("opNameDialogInput").value = capitalize(suggest.dataset.shortName);
                                _nameChangeListener();
                            });
                        }
                    });
                }
                else
                {
                    ele.byId("opcreateerrors").innerHTML = "";
                    ele.byId("opcreateerrors").classList.add("hidden");
                    ele.show(ele.byId("opNameDialogSubmit"));
                    if (showReplace) ele.show(ele.byId("opNameDialogSubmitReplace"));
                }
            }

            const namespaceEle = ele.byId("opNameDialogNamespace");
            namespaceEle.innerHTML = "";
            const patchOpsNamespace = defaultops.getPatchOpsNamespace();
            if (!res.namespaces.includes(patchOpsNamespace)) res.namespaces.unshift(patchOpsNamespace);
            res.namespaces.forEach((ns) =>
            {
                const option = document.createElement("option");
                option.value = ns;
                option.text = ns;
                if (newNamespace && ns === newNamespace) option.selected = true;
                namespaceEle.add(option);
            });

            ele.byId("opNameDialogInput").focus();
        };

        CABLESUILOADER.talkerAPI.send("checkOpName", {
            "namespace": suggestedNamespace,
            "v": newName
        }, (initialErr, initialRes) =>
        {
            new CABLES.UI.ModalDialog({
                "title": title,
                "text": html
            });

            _updateFormFromApi(initialRes, newName, suggestedNamespace);

            ele.byId("opNameDialogInput").addEventListener("input", _nameChangeListener);
            ele.byId("opNameDialogNamespace").addEventListener("input", _nameChangeListener);

            ele.byId("opNameDialogSubmit").addEventListener("click", (event) =>
            {
                cb(ele.byId("opNameDialogNamespace").value, capitalize(ele.byId("opNameDialogInput").value));
            });

            if (showReplace) ele.byId("opNameDialogSubmitReplace").addEventListener("click",
                (event) =>
                {
                    cb(ele.byId("opNameDialogNamespace").value, capitalize(ele.byId("opNameDialogInput").value), true);
                });
        });
    }

    createDialog(name, options)
    {
        options = options || {};
        if (!options.hasOwnProperty("showEditor"))options.showEditor = true;

        if (gui.project().isOpExample)
        {
            notifyError("Not possible in op example patch!");
            return;
        }

        let suggestedNamespace = defaultops.getPatchOpsNamespace();
        this.opNameDialog("Create operator", name, "patch", suggestedNamespace, (newNamespace, newName) =>
        {
            const opname = newNamespace + newName;

            this.create(opname, () =>
            {
                gui.closeModal();

                gui.serverOps.loadOpDependencies(opname, function ()
                {
                    // add new op
                    gui.patchView.addOp(opname,
                        {
                            "onOpAdd": (op) =>
                            {
                                op.setUiAttrib({
                                    "translate": {
                                        "x": gui.patchView.patchRenderer.viewBox.mousePatchX,
                                        "y": gui.patchView.patchRenderer.viewBox.mousePatchY },
                                });

                                if (op) gui.patchView.focusOp(op.id);
                                if (op) gui.patchView.patchRenderer.viewBox.animateScrollTo(gui.patchView.patchRenderer.viewBox.mousePatchX, gui.patchView.patchRenderer.viewBox.mousePatchY);
                                if (options.cb) options.cb(op);
                            }
                        });
                });
            }, options.showEditor);
        }, false);
    }

    cloneDialog(oldName)
    {
        if (gui.showGuestWarning()) return;

        if (gui.project().isOpExample)
        {
            notifyError("Not possible in op example patch!");
            return;
        }

        let name = "";
        let parts = oldName.split(".");
        if (parts) name = parts[parts.length - 1];
        let suggestedNamespace = defaultops.getPatchOpsNamespace();
        if (defaultops.isTeamOp(oldName)) suggestedNamespace = defaultops.getNamespace(oldName);

        this.opNameDialog("Clone operator", name, "patch", suggestedNamespace, (newNamespace, newName, replace) =>
        {
            const opname = newNamespace + newName;
            gui.serverOps.clone(oldName, opname, () =>
            {
                gui.serverOps.loadOpDependencies(opname, function ()
                {
                    if (replace)
                    {
                        // replace existing ops
                        const ops = gui.corePatch().getOpsByObjName(oldName);
                        for (let i = 0; i < ops.length; i++)
                        {
                            gui.patchView.replaceOp(ops[i].id, opname);
                        }
                    }
                    else
                    {
                        // add new op
                        gui.patchView.addOp(opname, { "onOpAdd": (op) =>
                        {
                            op.setUiAttrib({
                                "translate": {
                                    "x": gui.patchView.patchRenderer.viewBox.mousePatchX,
                                    "y": gui.patchView.patchRenderer.viewBox.mousePatchY },
                            });

                            if (op)
                            {
                                gui.patchView.focusOp(op.id);
                                gui.patchView.patchRenderer.viewBox.animateScrollTo(gui.patchView.patchRenderer.viewBox.mousePatchX, gui.patchView.patchRenderer.viewBox.mousePatchY);
                            }
                        } });
                    }
                });
            });
        }, true);
    }


    editAttachment(op, attachmentName, readOnly, cb, fromListener = false)
    {
        let opname = op;
        let opId = opname;

        if (typeof opname == "object")
        {
            opname = op.objName;
            opId = op.opId;
        }

        const parts = opname.split(".");
        const shortname = parts[parts.length - 1];
        const title = shortname + "/" + attachmentName;
        const userInteraction = !fromListener;

        let editorObj = null;
        gui.jobs().start({ "id": "load_attachment_" + attachmentName, "title": "loading attachment " + attachmentName });

        const apiParams = {
            "opname": opId,
            "name": attachmentName,
        };
        if (defaultops.isUserOp(opname) && gui.project()) apiParams.projectId = gui.project().shortId;

        CABLESUILOADER.talkerAPI.send(
            "opAttachmentGet",
            apiParams,
            (err, res) =>
            {
                gui.jobs().finish("load_attachment_" + attachmentName);

                if (err || !res || res.content === undefined)
                {
                    if (err) this._log.log("[editAttachment] err", err);
                    if (editorObj) CABLES.editorSession.remove(editorObj.name, editorObj.type);
                    return;
                }

                editorObj = CABLES.editorSession.rememberOpenEditor("attachment", title, { opname }, true);

                if (err || !res || res.content == undefined)
                {
                    if (err) this._log.log("[editAttachment] err", err);
                    if (editorObj) CABLES.editorSession.remove(editorObj.name, editorObj.type);
                    return;
                }
                const content = res.content || "";
                let syntax = "text";

                if (attachmentName.endsWith(".wgsl") || attachmentName.endsWith("_wgsl")) syntax = "glsl";
                if (attachmentName.endsWith(".glsl") || attachmentName.endsWith("_glsl")) syntax = "glsl";
                if (attachmentName.endsWith(".frag") || attachmentName.endsWith("_frag")) syntax = "glsl";
                if (attachmentName.endsWith(".vert") || attachmentName.endsWith("_vert")) syntax = "glsl";
                if (attachmentName.endsWith(".json") || attachmentName.endsWith("_json")) syntax = "json";
                if (attachmentName.endsWith(".js") || attachmentName.endsWith("_js")) syntax = "js";
                if (attachmentName.endsWith(".css") || attachmentName.endsWith("_css")) syntax = "css";

                if (editorObj)
                {
                    const lastTab = userSettings.get("editortab");
                    let inactive = false;
                    if (fromListener)
                    {
                        if (lastTab !== title)
                        {
                            inactive = true;
                        }
                    }

                    new EditorTab({
                        "title": title,
                        "name": editorObj.name,
                        "content": content,
                        "syntax": syntax,
                        "editorObj": editorObj,
                        "allowEdit": this.canEditAttachment(gui.user, opname),
                        "inactive": inactive,
                        "onClose": (which) =>
                        {
                            // this._log.log("close!!! missing infos...");
                            if (which.editorObj && which.editorObj.name) CABLES.editorSession.remove(which.editorObj.name, which.editorObj.type);
                        },
                        "onSave": (_setStatus, _content) =>
                        {
                            const loadingModal = gui.startModalLoading("Save attachment...");
                            CABLESUILOADER.talkerAPI.send(
                                "opAttachmentSave",
                                {
                                    "opname": opname,
                                    "name": attachmentName,
                                    "content": _content,
                                },
                                (errr, re) =>
                                {
                                    if (!CABLES.sandbox.isDevEnv() && defaultops.isCoreOp(opname)) notifyError("WARNING: op editing on live environment");


                                    if (errr)
                                    {
                                        CABLES.UI.notifyError("error: op not saved");
                                        // _setStatus('ERROR: not saved - '+res.msg);
                                        this._log.warn("[opAttachmentSave]", errr);
                                        return;
                                    }

                                    _setStatus("saved");

                                    if (attachmentName == blueprintUtil.blueprintPortJsonAttachmentFilename)
                                    {
                                        let ports = null;
                                        try
                                        {
                                            ports = JSON.parse(_content);
                                        }
                                        catch (e)
                                        {
                                            ports = { "ports": [] };
                                        }
                                        // const src = blueprintUtil.generatePortsAttachmentJsSrc(ports);

                                        blueprintUtil.savePortJsonBlueprintAttachment(ports, opname, () =>
                                        {
                                            blueprintUtil.executeBlueprintIfMultiple(opname, () =>
                                            {
                                                gui.opParams.refresh();
                                                gui.endModalLoading();
                                            });
                                        });
                                    }
                                    else
                                        blueprintUtil.executeBlueprintIfMultiple(opname, () =>
                                        {
                                            gui.opParams.refresh();
                                            gui.endModalLoading();
                                        });
                                },
                            );
                        },
                    });
                }


                if (cb) cb();
                else gui.maintabPanel.show(userInteraction);
            },
            (err) =>
            {
                gui.jobs().finish("load_attachment_" + attachmentName);
                this._log.error("error opening attachment " + attachmentName);
                this._log.log(err);
                if (editorObj) CABLES.editorSession.remove(editorObj.name, editorObj.type);
            }
        );

        if (!editorObj)
        {
            gui.mainTabs.activateTabByName(title);
            gui.maintabPanel.show(userInteraction);
        }
    }

    // Shows the editor and displays the code of an op in it
    edit(op, readOnly, cb, userInteraction)
    {
        if (gui.isGuestEditor())
        {
            CABLES.UI.MODAL.showError("Demo Editor", text.guestHint);
            return;
        }

        let opid = op;
        let opname = opid;

        if (typeof op == "object")
        {
            opid = op.opId;
            opname = op.objName;
        }
        else
        {
            const docs = gui.opDocs.getOpDocByName(op);
            if (!docs) return console.log("could not find docs", op, opid);
            opid = docs.id;

            if (!opid)
                console.log("deprecated: use serverOps.edit with op not just opname!");
        }

        if (!opname || opname == "")
        {
            this._log.log("UNKNOWN OPNAME ", opname);
            return;
        }

        gui.jobs().start({ "id": "load_opcode_" + opname, "title": "loading op code " + opname });


        CABLESUILOADER.talkerAPI.send(
            "getOpCode",
            {
                "opname": opid,
                "projectId": this._patchId
            },
            (er, rslt) =>
            {
                gui.jobs().finish("load_opcode_" + opname);

                if (er)
                {
                    notifyError("Error receiving op code!");
                    CABLES.editorSession.remove(opname, "op");
                    return;
                }

                const editorObj = CABLES.editorSession.rememberOpenEditor("op", opname);

                // var html = '';
                // if (!readOnly) html += '<a class="button" onclick="gui.serverOps.execute(\'' + opname + '\');">execute</a>';

                let save = null;
                if (!readOnly)
                {
                    save = (setStatus, content, editor) =>
                    {
                        // CABLES.UI.MODAL.showLoading("Saving and executing op...");

                        const loadingModal = gui.startModalLoading("Saving and executing op...");
                        loadingModal.setTask("Saving Op");

                        CABLESUILOADER.talkerAPI.send(
                            "saveOpCode",
                            {
                                "opname": opid,
                                "code": content,
                                "format": userSettings.get("formatcode") || false
                            },
                            (err, res) =>
                            {
                                const selOps = gui.patchView.getSelectedOps();
                                let selOpTranslate = null;
                                if (selOps && selOps.length > 0) selOpTranslate = selOps[0].uiAttribs.translate;

                                if (!res || !res.success)
                                {
                                    gui.endModalLoading();

                                    if (res.error && res.error.line != undefined) setStatus("Error: Line " + res.error.line + " : " + res.error.message, true);
                                    else setStatus("Error: " + err.msg || "Unknown error");
                                }
                                else
                                {
                                    if (!CABLES.sandbox.isDevEnv() && defaultops.isCoreOp(opname)) notifyError("WARNING: op editing on live environment");

                                    if (!CABLES.Patch.getOpClass(opname))gui.opSelect().reload();

                                    loadingModal.setTask("Executing code");

                                    gui.serverOps.execute(opname, () =>
                                    {
                                        setStatus("Saved " + opname);
                                        editor.focus();

                                        if (selOpTranslate)
                                            for (let i = 0; i < gui.corePatch().ops.length; i++)
                                                if (gui.corePatch().ops[i].uiAttribs && gui.corePatch().ops[i].uiAttribs.translate && gui.corePatch().ops[i].uiAttribs.translate.x == selOpTranslate.x && gui.corePatch().ops[i].uiAttribs.translate.y == selOpTranslate.y)
                                                {
                                                    gui.opParams.show(gui.corePatch().ops[i].id);
                                                    gui.patchView.setSelectedOpById(gui.corePatch().ops[i].id);
                                                }

                                        gui.endModalLoading();
                                    });
                                }
                            },
                            (result) =>
                            {
                                setStatus("ERROR: not saved - " + result.msg);
                                this._log.log("err result", result);

                                gui.endModalLoading();
                            },
                        );
                    };
                }

                const parts = opname.split(".");
                const title = "Op " + parts[parts.length - 1];

                if (editorObj)
                {
                    const t = new EditorTab({
                        "title": title,
                        "name": editorObj.name,
                        "content": rslt.code,
                        "singleton": true,
                        "syntax": "js",
                        "allowEdit": this.canEditOp(gui.user, editorObj.name),
                        "onSave": save,
                        "editorObj": editorObj,
                        "onClose": (which) =>
                        {
                            if (which.editorObj) CABLES.editorSession.remove(which.editorObj.name, which.editorObj.type);
                        },
                    });
                }
                else
                {
                    gui.mainTabs.activateTabByName(opname);
                    gui.maintabPanel.show(userInteraction);
                }


                if (cb) cb();
                else gui.maintabPanel.show(userInteraction);
            },
        );
    }


    getOpLibs(opname, checkLoaded)
    {
        const perf = CABLES.UI.uiProfiler.start("[opsserver] getOpLibs");
        let opDoc = null;
        if (typeof opname === "string") opDoc = gui.opDocs.getOpDocByName(opname);
        else
        {
            opDoc = gui.opDocs.getOpDocByName(opname.objName);
            if (!opDoc) opDoc = gui.opDocs.getOpDocById(opname.opId || opname.id);
        }
        const libs = [];
        if (opDoc && opDoc.libs)
        {
            for (let j = 0; j < opDoc.libs.length; j++)
            {
                const libName = opDoc.libs[j];
                if (!checkLoaded)
                {
                    libs.push(libName);
                }
                else if (this._loadedLibs.indexOf(libName) === -1)
                {
                    libs.push(libName);
                }
            }
        }

        perf.finish();
        return libs;
    }

    getCoreLibs(opname, checkLoaded)
    {
        const perf = CABLES.UI.uiProfiler.start("[opsserver] getCoreLibs");

        let opDoc = null;
        if (typeof opname === "string") opDoc = gui.opDocs.getOpDocByName(opname);
        else
        {
            opDoc = gui.opDocs.getOpDocByName(opname.objName);
            if (!opDoc) opDoc = gui.opDocs.getOpDocById(opname.opId || opname.id);
        }

        const coreLibs = [];
        if (opDoc && opDoc.coreLibs)
        {
            for (let j = 0; j < opDoc.coreLibs.length; j++)
            {
                const libName = opDoc.coreLibs[j];
                if (!checkLoaded)
                {
                    coreLibs.push(libName);
                }
                else if (this._loadedCoreLibs.indexOf(libName) === -1)
                {
                    coreLibs.push(libName);
                }
            }
        }
        perf.finish();

        return coreLibs;
    }

    loadOpDependencies(opName, _next, reload = false)
    {
        this.loadProjectDependencies({ "ops": [{ "objName": opName }] }, _next, reload);
    }

    loadProjectDependencies(proj, _next, loadAll = false)
    {
        let missingOps = [];
        if (loadAll)
        {
            missingOps = proj.ops;
        }
        else
        {
            missingOps = this.getMissingOps(proj);
        }

        this.loadOps(missingOps, (newOps, newIds) =>
        {
            const perf2 = CABLES.UI.uiProfiler.start("[opsserver] loadProjectDependencies");

            if (gui && gui.opSelect() && newOps.length > 0)
            {
                gui.opSelect().reload();
                gui.opSelect().prepare();
            }

            // let libsToLoad = [];
            // let coreLibsToLoad = [];
            // newOps.forEach((newOp) =>
            // {
            //     if (newOp)
            //     {
            //         if (newIds.hasOwnProperty(newOp.opId))
            //         {
            //             newOp.opId = newIds[newOp.opId];
            //         }
            //         libsToLoad = libsToLoad.concat(this.getOpLibs(newOp, true));
            //         coreLibsToLoad = coreLibsToLoad.concat(this.getCoreLibs(newOp, true));
            //     }
            // });

            for (let i = 0; i < proj.ops.length; i++)
            {
                if (proj.ops[i])
                {
                    if (newIds.hasOwnProperty(proj.ops[i].opId))
                    {
                        proj.ops[i].opId = newIds[proj.ops[i].opId];
                    }
                }
            }

            perf2.finish();
            this.loadOpsLibs(proj.ops, () =>
            {
                if (_next) _next(proj);
            });
        });
    }

    isLibLoaded(libName)
    {
        return this._loadedLibs.some((lib) => { return lib === libName; });
    }

    isCoreLibLoaded(coreLibName)
    {
        return this._loadedCoreLibs.some((lib) => { return lib === coreLibName; });
    }

    allLibsLoaded(op)
    {
        const coreLibsToLoad = this.getCoreLibs(op, true);
        const libsToLoad = this.getOpLibs(op, true);
        for (let i = 0; i < coreLibsToLoad.length; i++)
        {
            if (!this.isCoreLibLoaded(coreLibsToLoad[i])) return false;
        }
        for (let i = 0; i < libsToLoad.length; i++)
        {
            if (!this.isLibLoaded(libsToLoad[i])) return false;
        }
        return true;
    }

    opCodeLoaded(op)
    {
        return CABLES && CABLES.OPS && (CABLES.OPS.hasOwnProperty(op.opId) || CABLES.OPS.hasOwnProperty(op.id));
    }

    loadOpLibs(op, finishedCb)
    {
        const libsToLoad = this.getOpLibs(op, true);
        const coreLibsToLoad = this.getCoreLibs(op, true);

        if (libsToLoad.length === 0 && coreLibsToLoad.length === 0)
        {
            finishedCb();
            return;
        }

        this._runLibsLoader(libsToLoad, coreLibsToLoad, finishedCb);
    }

    loadOpsLibs(ops, finishedCb)
    {
        if (!ops || ops.length === 0)
        {
            finishedCb();
            return;
        }

        let libsToLoad = [];
        let coreLibsToLoad = [];

        ops.forEach((op) =>
        {
            libsToLoad = libsToLoad.concat(this.getOpLibs(op, true));
            coreLibsToLoad = coreLibsToLoad.concat(this.getCoreLibs(op, true));
            libsToLoad = CABLES.uniqueArray(libsToLoad);
            coreLibsToLoad = CABLES.uniqueArray(coreLibsToLoad);
        });
        this._runLibsLoader(libsToLoad, coreLibsToLoad, finishedCb);
    }

    _runLibsLoader(libsToLoad, coreLibsToLoad, finishedCb)
    {
        new CABLES.LibLoader(libsToLoad, () =>
        {
            this._loadedLibs = this._loadedLibs.concat(libsToLoad);
            new CoreLibLoader(coreLibsToLoad, () =>
            {
                this._loadedCoreLibs = this._loadedCoreLibs.concat(coreLibsToLoad);
                finishedCb();
            });
        });
    }

    finished()
    {
        return this.loaded;
    }

    canEditOp(user, opName)
    {
        if (!user) return false;
        if (user.isAdmin) return true;
        const op = this._ops.find((o) => { return o.name === opName; });
        if (!op) return false;
        return op.allowEdit || false;
    }

    canEditAttachment(user, opName)
    {
        return this.canEditOp(user, opName);
    }

    getMissingOps(proj)
    {
        const perf = CABLES.UI.uiProfiler.start("[opsserver] gerMissingOps");

        let missingOps = [];
        const missingOpsFound = [];
        proj.ops.forEach((op) =>
        {
            const opIdentifier = op.opId || op.objName;
            if (!missingOpsFound.includes(opIdentifier))
            {
                const opInfo = { "opId": op.opId, "objName": op.objName };
                if (!this.isLoaded(op))
                {
                    missingOps.push(opInfo);
                    missingOpsFound.push(opIdentifier);
                }
                else
                {
                    if (op.storage && op.storage.blueprintVer > 1)
                    {
                        const isInProject = gui.project().ops.some((projectOp) => { return projectOp.opId === op.opId; });
                        if (!isInProject)
                        {
                            missingOps.push(opInfo);
                            missingOpsFound.push(opIdentifier);
                        }
                    }
                }
            }
        });
        missingOps = missingOps.filter((obj, index) => { return missingOps.findIndex((item) => { return item.opId === obj.opId; }) === index; });

        perf.finish();
        return missingOps;
    }

    isLoaded(op)
    {
        const opDocs = gui.opDocs.getOpDocs();
        const opIdentifier = op.opId || op.objName;
        // FIXME: this is very convoluted since opdocs have .id and .name but projectops have .opId and .objName and the likes...unify some day :/
        let foundOp = opDocs.find((loadedOp) => { return loadedOp.id === opIdentifier; });
        if (!foundOp) foundOp = opDocs.find((loadedOp) => { return loadedOp.objName === opIdentifier; });
        if (!foundOp) foundOp = opDocs.find((loadedOp) => { return loadedOp.name === opIdentifier; });
        if (!foundOp) foundOp = this._ops.find((loadedOp) => { return loadedOp.id === opIdentifier; });
        if (!foundOp) foundOp = this._ops.find((loadedOp) => { return op.objName && loadedOp.objName === opIdentifier; });
        if (!foundOp) foundOp = this._ops.find((loadedOp) => { return op.name && loadedOp.name === opIdentifier; });
        let loaded = false;
        if (foundOp)
        {
            // we found an op in opdocs, check if we also have the code and needed libraries
            loaded = this.opCodeLoaded(foundOp);
            if (loaded) loaded = this.allLibsLoaded(foundOp);
        }
        return loaded;
    }

    loadOps(ops, cb)
    {
        let count = ops.length;
        const newOps = [];
        const newIds = {};
        if (count === 0)
        {
            cb(newOps, newIds);
        }
        else
        {
            ops.forEach((op) =>
            {
                incrementStartup();
                this.loadOp(op, (newOp, newId) =>
                {
                    if (newId) newIds[op.opId] = newId;
                    newOps.push(newOp);
                    count--;
                    if (count === 0) cb(newOps, newIds);
                });
            });
        }
    }

    loadOp(op, cb)
    {
        if (op)
        {
            const options = {
                "op": op,
                "projectId": op.parentProject || gui.project().shortId
            };
            CABLESUILOADER.talkerAPI.send("getOpDocs", options, (err, res) =>
            {
                if (err)
                {
                    const title = err.msg.title || "Failed to load op";
                    let html = err.msg.reasons ? err.msg.reasons.join("<br/>") : err.msg;
                    html += "<br/><br/>";
                    new ModalDialog({ "title": title, "showOkButton": false, "html": html });
                }
                else
                {
                    let identifier = res.newOpId || op.opId || op.id || op.objName;

                    let lid = "missingop" + identifier + CABLES.uuid();
                    const missingOpUrl = [];

                    let url = CABLESUILOADER.noCacheUrl(CABLES.sandbox.getCablesUrl() + "/api/op/" + identifier) + "&p=" + gui.project().shortId;
                    missingOpUrl.push(url);

                    loadjs.ready(lid, () =>
                    {
                        let newOp = null;
                        if (!err && res && res.opDocs)
                        {
                            res.opDocs.forEach((opDoc) =>
                            {
                                newOp = opDoc;
                                this._ops.push(opDoc);
                            });
                            if (gui.opDocs)
                            {
                                gui.opDocs.addOpDocs(res.opDocs);
                            }
                        }
                        incrementStartup();
                        cb(newOp, res.newOpId);
                    });
                    loadjs(missingOpUrl, lid);
                }
            });
        }
        else
        {
            incrementStartup();
            cb();
        }
    }

    loadExtensionOps(name, cb)
    {
        if (name && defaultops.isExtensionOp(name))
        {
            const extensionName = name.split(".", 3).join(".");
            const extensionOpUrl = [];
            extensionOpUrl.push(CABLESUILOADER.noCacheUrl(CABLES.sandbox.getCablesUrl() + "/api/ops/code/extension/" + extensionName));

            const lid = "extensionops" + extensionName + CABLES.uuid();

            CABLESUILOADER.talkerAPI.send("getCollectionOpDocs", { "name": extensionName }, (err, res) =>
            {
                if (!err && res && res.opDocs)
                {
                    loadjs.ready(lid, () =>
                    {
                        res.opDocs.forEach((newOp) =>
                        {
                            this._ops.push(newOp);
                        });
                        if (gui.opDocs)
                        {
                            gui.opDocs.addOpDocs(res.opDocs);
                        }
                        incrementStartup();
                        cb();
                    });
                }
                else
                {
                    incrementStartup();
                    cb();
                }
            });
            loadjs(extensionOpUrl, lid);
        }
        else
        {
            incrementStartup();
            cb();
        }
    }

    loadTeamNamespaceOps(name, cb)
    {
        if (name && defaultops.isTeamOp(name))
        {
            const teamNamespaceName = name.split(".", 3).join(".");
            const teamOpUrl = [];
            teamOpUrl.push(CABLESUILOADER.noCacheUrl(CABLES.sandbox.getCablesUrl() + "/api/ops/code/team/" + teamNamespaceName));

            const lid = "teamops" + teamNamespaceName + CABLES.uuid();

            CABLESUILOADER.talkerAPI.send("getCollectionOpDocs", { "name": teamNamespaceName, "projectId": gui.project().shortId }, (err, res) =>
            {
                if (!err && res && res.opDocs)
                {
                    loadjs.ready(lid, () =>
                    {
                        res.opDocs.forEach((newOp) =>
                        {
                            this._ops.push(newOp);
                        });
                        if (gui.opDocs)
                        {
                            gui.opDocs.addOpDocs(res.opDocs);
                        }
                        incrementStartup();
                        cb();
                    });
                }
                else
                {
                    incrementStartup();
                    cb();
                }
            });
            loadjs(teamOpUrl, lid);
        }
        else
        {
            incrementStartup();
            cb();
        }
    }
}
