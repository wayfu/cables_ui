import ModalLoading from "../dialogs/modalloading";
import Logger from "../utils/logger";
import EditorTab from "../components/tabs/tab_editor";
import CoreLibLoader from "./corelibloader";
import ModalDialog from "../dialogs/modaldialog";
import text from "../text";
import userSettings from "../components/usersettings";
import { notifyError } from "../elements/notification";

// todo: merge serverops and opdocs.js and/or response from server ? ....

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
                this.edit(name, false, () =>
                {
                    gui.mainTabs.activateTabByName(lastTab);
                    userSettings.set("editortab", lastTab);
                    CABLES.editorSession.finishLoadingTab();
                    // gui.jobs().finish("open op editor" + name);
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
        this.load(next);
    }

    load(cb)
    {
        const that = this;
        CABLESUILOADER.talkerAPI.send(
            "getAllProjectOps",
            { "projectId": this._patchId },
            (err, res) =>
            {
                if (err) this._log.error(err);

                this._ops = res;
                logStartup("Ops loaded");
                if (cb) cb(this._ops);
                that.loaded = true;
                incrementStartup();
            },
        );
    }

    showOpInstancingError(name, e)
    {
        // this._log.log('show server op error message modal');

        let msg = "<h2><span class=\"fa fa-exclamation-triangle\"></span> cablefail :/</h2>";
        msg += "error creating op: " + name;
        msg += "<br/><pre>" + e + "</pre><br/>";

        if (this.isServerOp(name))
        {
            msg += "<a class=\"bluebutton\" onclick=\"gui.showEditor();gui.serverOps.edit('" + name + "')\">edit op</a>";
        }
        if (gui.user.isAdmin)
        {
            msg += " <a class=\"bluebutton\" onclick=\"gui.serverOps.pullOp('" + name + "')\">try to pull</a>";
        }
        CABLES.UI.MODAL.show(msg);
    }

    isServerOp(name)
    {
        for (let i = 0; i < this._ops.length; i++) if (this._ops[i].name == name) return true;

        return false;
    }

    create(name, cb)
    {
        const loadingModal = new ModalLoading("Creating op...");

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

                this.load(() =>
                {
                    gui.maintabPanel.show(true);
                    this.edit(name, false, null, true);
                    // edit(opname, readOnly, cb, userInteraction)

                    gui.serverOps.execute(name);
                    gui.opSelect().reload();
                    loadingModal.close();
                });
            },
        );
    }

    saveOpLayout(op)
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
            if (op.portsIn[i].type == CABLES.OP_PORT_TYPE_VALUE)
            {
                if (op.portsIn[i].uiAttribs.display == "bool") l.subType = "boolean";
                else if (op.portsIn[i].uiAttribs.type == "string") l.subType = "string";
                else if (op.portsIn[i].uiAttribs.increment == "integer") l.subType = "integer";
                else if (op.portsIn[i].uiAttribs.display == "dropdown") l.subType = "select box";
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
                if (op.portsOut[i].uiAttribs.display == "bool") l.subType = "boolean";
                else if (op.portsOut[i].uiAttribs.type == "string") l.subType = "string";
                else if (op.portsOut[i].uiAttribs.display == "dropdown") l.subType = "dropdown";
                else if (op.portsOut[i].uiAttribs.display == "file") l.subType = "url";
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

    execute(name, next)
    {
        if (gui.corePatch()._crashedOps.indexOf(name) > -1)
        {
            let html = "";
            html += "<h1>can not execute op</h1>";
            html += "this op crashed before, you should reload the page.<br/><br/>";
            html += "<a class=\"button\" onclick=\"CABLES.CMD.PATCH.reload();\"><span class=\"icon icon-refresh\"></span>Reload patch</a>&nbsp;&nbsp;";

            CABLES.UI.MODAL.show(html, { "title": "need to reload page" });
        }

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
                        if (newOps[i] && newOps[i].uiAttribs)
                            delete newOps[i].uiAttribs.uierrors;

                    if (newOps.length > 0) this.saveOpLayout(newOps[0]);
                    gui.emitEvent("opReloaded", name);
                    if (next)next();
                },
            );
        };
        document.body.appendChild(s);
    }

    clone(oldname, name)
    {
        this._log.log("clone", name, oldname);

        const loadingModal = new ModalLoading("Cloning op...");

        CABLESUILOADER.talkerAPI.send(
            "opClone",
            {
                "opname": oldname,
                name,
            },
            (err, res) =>
            {
                if (err)
                {
                    this._log.log("err res", res);
                    loadingModal.close();

                    CABLES.UI.MODAL.showError("Could not clone op", "");

                    return;
                }
                this.load(() =>
                {
                    this.edit(name);
                    gui.serverOps.execute(name);
                    gui.opSelect().reload();
                    loadingModal.close();
                });
            },
        );
    }

    addOpLib(opName, libName)
    {
        if (libName === "---") return;
        if (libName === "asset_upload")
        {
            gui.serverOps.selectLibFromAssets(opName);
            return;
        }

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
                    this._log.log("lib added!");
                    gui.reloadDocs(() =>
                    {
                        this._log.log("docs reloaded");
                        gui.metaTabs.activateTabByName("code");
                        let html = "";
                        html += "to initialize the new library, you should reload the patch.<br/><br/>";
                        html += "<a class=\"button\" onclick=\"CABLES.CMD.PATCH.reload();\"><span class=\"icon icon-refresh\"></span>Reload patch</a>&nbsp;&nbsp;";
                        new ModalDialog({ "title": "new library added", "html": html });
                    });
                }
            },
        );
    }

    selectLibFromAssets(opName)
    {
        gui.showFileManager(() =>
        {
            gui.fileManager.setFilterType([".js"]);
            gui.fileManager._manager.addEventListener("onItemsSelected", (items) =>
            {
                if (items && items.length > 0)
                {
                    const userLib = items[0];
                    if (userLib.p)
                    {
                        this.addOpLib(opName, userLib.p);
                    }
                }
            });
        }, true);
    }

    removeOpLib(opName, libName)
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
                        gui.reloadDocs(() =>
                        {
                            gui.metaTabs.activateTabByName("code");
                            let html = "";
                            html += "to re-initialize after removing the library, you should reload the patch.<br/><br/>";
                            html += "<a class=\"button\" onclick=\"CABLES.CMD.PATCH.reload();\"><span class=\"icon icon-refresh\"></span>Reload patch</a>&nbsp;&nbsp;";

                            new ModalDialog({ "title": "Library removed", "text": html });
                        });
                    }
                }
            );
        });
    }

    addCoreLib(opName, libName)
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
                    gui.reloadDocs(() =>
                    {
                        gui.metaTabs.activateTabByName("code");
                        let html = "";
                        html += "to initialize the new library, you should reload the patch.<br/><br/>";
                        html += "<a class=\"button\" onclick=\"CABLES.CMD.PATCH.reload();\"><span class=\"icon icon-refresh\"></span>Reload patch</a>&nbsp;&nbsp;";
                        new ModalDialog({ "title": "new library added", "html": html });
                    });
                }
            },
        );
    }

    removeCoreLib(opName, libName)
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
                        gui.reloadDocs(() =>
                        {
                            gui.metaTabs.activateTabByName("code");
                            let html = "";
                            html += "to re-initialize after removing the library, you should reload the patch.<br/><br/>";
                            html += "<a class=\"button\" onclick=\"CABLES.CMD.PATCH.reload();\"><span class=\"icon icon-refresh\"></span>Reload patch</a>&nbsp;&nbsp;";

                            CABLES.UI.MODAL.show(html, {
                                "title": "corelib removed",
                            });
                        });
                    }
                },
            );
        });
    }

    deleteAttachment(opName, attName)
    {
        const modal = new ModalDialog({ "title": "Delete attachment from op?", "text": "Delete " + attName + " from " + opName + "?", "choice": true });
        modal.on("onSubmit", () =>
        {
            CABLESUILOADER.talkerAPI.send(
                "opAttachmentDelete",
                {
                    "opname": opName,
                    "name": attName,
                },
                (err, res) =>
                {
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
                        opname,
                        "name": attName,
                    },
                    (err, res) =>
                    {
                        this.editAttachment(opname, "att_" + attName);
                        gui.metaTabs.activateTabByName("code");
                    },
                );
            }
        });
    }

    opNameDialog(title, name, cb)
    {
        let newName = name || "";
        if (name && name.indexOf("Ops.") === 0) newName = name.substr(4, name.length);

        const usernamespace = "Ops.User." + gui.user.usernameLowercase;


        let html = "";
        html += "Your op will be private. Only you can see and use it.<br/><br/>";
        html += "Enter a name:<br/><br/>";
        html += "<div class=\"clone\"><span>" + usernamespace + ".&nbsp;&nbsp;</span><input type=\"text\" id=\"opNameDialogInput\" value=\"" + newName + "\" placeholder=\"MyAwesomeOpName\"/></div></div>";
        html += "<br/>";
        html += "<div id=\"opcreateerrors\"></div>";
        html += "<br/><br/>";
        html += "<a id=\"opNameDialogSubmit\" class=\"bluebutton \">create</a>";
        html += "<br/><br/>";


        new CABLES.UI.ModalDialog({
            "title": title,
            "text": html
        });

        // CABLES.UI.MODAL.show(html);

        document.getElementById("opNameDialogInput").focus();
        document.getElementById("opNameDialogInput").addEventListener("input", () =>
        {
            const v = document.getElementById("opNameDialogInput").value;
            CABLES.api.get("op/checkname/" + usernamespace + "." + v, (res) =>
            {
                this._log.log(res);
                if (res.problems.length > 0)
                {
                    let htmlIssue = "<br/><br/><b>your op name has issues:</b><br/><div class=\"modallist notices\">";
                    htmlIssue += "<ul>";
                    for (let i = 0; i < res.problems.length; i++) htmlIssue += "<li>" + res.problems[i] + "</li>";
                    htmlIssue += "</ul></div>";
                    document.getElementById("opcreateerrors").innerHTML = htmlIssue;
                    document.getElementById("opNameDialogSubmit").style.display = "none";
                }
                else
                {
                    document.getElementById("opcreateerrors").innerHTML = "";
                    document.getElementById("opNameDialogSubmit").style.display = "block";
                }
            });
        });

        document.getElementById("opNameDialogSubmit").addEventListener("click", (event) =>
        {
            if (document.getElementById("opNameDialogInput").value == "")
            {
                alert("please enter a name for your op!");
                return;
            }
            cb(document.getElementById("opNameDialogInput").value);
        });
    }

    createDialog(name)
    {
        if (gui.project().isOpExample)
        {
            notifyError("Not possible in op example patch!");
            return;
        }

        this.opNameDialog("Create operator", name, (newname) =>
        {
            this.create("Ops.User." + gui.user.usernameLowercase + "." + newname, () =>
            {
                gui.closeModal();
            });
        });
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
        if (parts)
            name = parts[parts.length - 1];
        this.opNameDialog("Clone operator", name, (newname) =>
        {
            const opname = "Ops.User." + gui.user.usernameLowercase + "." + newname;
            gui.serverOps.clone(oldName, opname);
        });
    }

    editAttachment(opname, attachmentName, readOnly, cb, fromListener = false)
    {
        const parts = opname.split(".");
        const shortname = parts[parts.length - 1];
        const title = shortname + "/" + attachmentName;

        const userInteraction = !fromListener;


        let editorObj = null;
        CABLES.api.clearCache();

        gui.jobs().start({ "id": "load_attachment_" + attachmentName, "title": "loading attachment " + attachmentName });


        CABLESUILOADER.talkerAPI.send(
            "opAttachmentGet",
            {
                opname,
                "name": attachmentName,
            },
            (err, res) =>
            {
                gui.jobs().finish("load_attachment_" + attachmentName);

                editorObj = CABLES.editorSession.rememberOpenEditor("attachment", title, { opname }, true);

                if (err || !res || res.content == undefined)
                {
                    if (err) this._log.log("[opattachmentget] err", err);
                    if (editorObj) CABLES.editorSession.remove(editorObj.name, editorObj.type);
                    return;
                }
                const content = res.content || "";
                let syntax = "text";

                if (attachmentName.endsWith(".wgsl")) syntax = "glsl";
                if (attachmentName.endsWith(".glsl")) syntax = "glsl";
                if (attachmentName.endsWith(".frag")) syntax = "glsl";
                if (attachmentName.endsWith(".vert")) syntax = "glsl";
                if (attachmentName.endsWith(".json")) syntax = "json";
                if (attachmentName.endsWith(".js")) syntax = "js";
                if (attachmentName.endsWith(".css")) syntax = "css";


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
                        content,
                        syntax,
                        editorObj,
                        "allowEdit": this.canEditAttachment(gui.user, opname),
                        "inactive": inactive,
                        "onClose": (which) =>
                        {
                            // this._log.log("close!!! missing infos...");
                            if (which.editorObj && which.editorObj.name) CABLES.editorSession.remove(which.editorObj.name, which.editorObj.type);
                        },
                        "onSave": (_setStatus, _content) =>
                        {
                            const loadingModal = new ModalLoading("Save attachment...");

                            CABLESUILOADER.talkerAPI.send(
                                "opAttachmentSave",
                                {
                                    opname,
                                    "name": attachmentName,
                                    "content": _content,
                                },
                                (errr, re) =>
                                {
                                    if (!CABLES.sandbox.isDevEnv() && opname.indexOf("Ops.User") == -1) notifyError("WARNING: op editing on live environment");

                                    if (errr)
                                    {
                                        CABLES.UI.notifyError("error: op not saved");
                                        // _setStatus('ERROR: not saved - '+res.msg);
                                        this._log.warn("[opAttachmentSave]", errr);
                                        return;
                                    }

                                    _setStatus("saved");

                                    gui.serverOps.execute(opname, () =>
                                    {
                                        setTimeout(() => { gui.opParams.refresh(); }, 100);

                                        loadingModal.close();
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
    edit(opname, readOnly, cb, userInteraction)
    {
        if (gui.isGuestEditor())
        {
            CABLES.UI.MODAL.showError("Demo Editor", text.guestHint);
            return;
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
                "opname": opname,
                "projectId": this._patchId
            },
            (er, rslt) =>
            {
                const editorObj = CABLES.editorSession.rememberOpenEditor("op", opname);
                gui.jobs().finish("load_opcode_" + opname);

                // var html = '';
                // if (!readOnly) html += '<a class="button" onclick="gui.serverOps.execute(\'' + opname + '\');">execute</a>';

                let save = null;
                if (!readOnly)
                {
                    save = (setStatus, content, editor) =>
                    {
                        // CABLES.UI.MODAL.showLoading("Saving and executing op...");

                        const loadingModal = new ModalLoading("Saving and executing op...");
                        loadingModal.setTask("Saving Op");

                        CABLESUILOADER.talkerAPI.send(
                            "saveOpCode",
                            {
                                "opname": opname,
                                "code": content,
                            },
                            (err, res) =>
                            {
                                const selOps = gui.patchView.getSelectedOps();
                                let selOpTranslate = null;
                                if (selOps && selOps.length > 0) selOpTranslate = selOps[0].uiAttribs.translate;

                                if (!res || !res.success)
                                {
                                    loadingModal.close();

                                    if (res.error && res.error.line != undefined) setStatus("Error: Line " + res.error.line + " : " + res.error.message, true);
                                    else setStatus("Error: " + err.msg || "Unknown error");
                                }
                                else
                                {
                                    if (!CABLES.sandbox.isDevEnv() && opname.indexOf("Ops.User") == -1) notifyError("WARNING: op editing on live environment");

                                    if (!CABLES.Patch.getOpClass(opname))
                                        gui.opSelect().reload();

                                    loadingModal.setTask("Executing code");

                                    gui.serverOps.execute(opname, () =>
                                    {
                                        setStatus("saved " + opname);
                                        editor.focus();

                                        if (selOpTranslate)
                                            for (let i = 0; i < gui.corePatch().ops.length; i++)
                                                if (gui.corePatch().ops[i].uiAttribs && gui.corePatch().ops[i].uiAttribs.translate && gui.corePatch().ops[i].uiAttribs.translate.x == selOpTranslate.x && gui.corePatch().ops[i].uiAttribs.translate.y == selOpTranslate.y)
                                                {
                                                    gui.opParams.show(gui.corePatch().ops[i].id);
                                                    gui.patchView.setSelectedOpById(gui.corePatch().ops[i].id);
                                                }

                                        loadingModal.close();
                                    });
                                }
                            },
                            (result) =>
                            {
                                setStatus("ERROR: not saved - " + result.msg);
                                this._log.log("err result", result);

                                loadingModal.close();
                            },
                        );
                    };
                }

                const parts = opname.split(".");
                const title = "Op " + parts[parts.length - 1];

                if (editorObj)
                {
                    const t = new EditorTab({
                        title,
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


    getOpLibs(op, checkLoaded)
    {
        const opId = op.opId;
        let opName = op.objName;
        if (typeof op === "string") opName = op;
        for (let i = 0; i < this._ops.length; i++)
        {
            if ((opId && this._ops[i].id === opId) || this._ops[i].name === opName)
            {
                let found = false;
                const libs = [];
                if (this._ops[i].libs)
                {
                    for (let j = 0; j < this._ops[i].libs.length; j++)
                    {
                        const libName = this._ops[i].libs[j];
                        if (!checkLoaded)
                        {
                            libs.push(libName);
                        }
                        else if (this._loadedLibs.indexOf(libName) === -1)
                        {
                            libs.push(libName);
                        }
                    }
                    found = true;
                }

                if (found) return libs;
            }
        }
        return [];
    }

    getCoreLibs(op, checkLoaded)
    {
        const opId = op.opId;
        let opName = op.objName;
        if (typeof op === "string") opName = op;

        for (let i = 0; i < this._ops.length; i++)
        {
            if ((opId && this._ops[i].id === opId) || this._ops[i].name === opName)
            {
                if (this._ops[i].coreLibs)
                {
                    const coreLibs = [];
                    for (let j = 0; j < this._ops[i].coreLibs.length; j++)
                    {
                        const libName = this._ops[i].coreLibs[j];
                        if (!checkLoaded)
                        {
                            coreLibs.push(libName);
                        }
                        else if (this._loadedCoreLibs.indexOf(libName) === -1)
                        {
                            coreLibs.push(libName);
                        }
                    }
                    return coreLibs;
                }
            }
        }
        return [];
    }

    loadOpDependencies(opName, _next)
    {
        this.loadProjectDependencies({ "ops": [{ "objName": opName }] }, _next);
    }

    loadProjectDependencies(proj, _next)
    {
        const missingOps = [];
        const missingOpsFound = [];
        proj.ops.forEach((op) =>
        {
            let opName = op.objName;
            if (this.isExtensionOp(opName)) opName = this.getExtensionByOpName(opName);
            if (this.isTeamOp(opName)) opName = this.getTeamNamespaceByOpName(opName);

            if (!missingOpsFound.includes(opName))
            {
                const loaded = this._ops.find((loadedOp) => { return loadedOp.name === opName; });
                if (!loaded)
                {
                    missingOps.push({ "name": opName, "id": op.opId });
                    missingOpsFound.push(opName);
                }
            }
        });

        this.loadMissingOps(missingOps, (newOps) =>
        {
            if (gui && gui.opSelect())
            {
                gui.opSelect().reload();
                gui.opSelect().prepare();
            }

            let libsToLoad = [];
            let coreLibsToLoad = [];
            for (let i = 0; i < proj.ops.length; i++)
            {
                if (proj.ops[i])
                {
                    if (proj.ops[i])
                    {
                        libsToLoad = libsToLoad.concat(this.getOpLibs(proj.ops[i]));
                        coreLibsToLoad = coreLibsToLoad.concat(this.getCoreLibs(proj.ops[i]));
                    }
                }
            }

            libsToLoad = CABLES.uniqueArray(libsToLoad);
            coreLibsToLoad = CABLES.uniqueArray(coreLibsToLoad);

            new CABLES.LibLoader(libsToLoad, () =>
            {
                new CoreLibLoader(coreLibsToLoad, () =>
                {
                    if (_next)_next();
                });
            });
        });
    }

    isLibLoaded(libName)
    {
        const isloaded = this._loadedLibs.indexOf(libName) != -1;
        return isloaded;
    }

    opHasLibs(op)
    {
        return this.getOpLibs(op).length !== 0;
    }

    opLibsLoaded(op)
    {
        const libsToLoad = this.getOpLibs(op);
        for (let i = 0; i < libsToLoad.length; i++)
        {
            if (!this.isLibLoaded(libsToLoad[i])) return false;
        }
        return true;
    }

    loadOpLibs(op, finishedCb)
    {
        const libsToLoad = this.getOpLibs(op);
        const coreLibsToLoad = this.getCoreLibs(op);

        if (libsToLoad.length === 0 && coreLibsToLoad.length === 0)
        {
            finishedCb();
            return;
        }

        new CABLES.LibLoader(libsToLoad, () =>
        {
            new CoreLibLoader(coreLibsToLoad, () =>
            {
                finishedCb();
            });
        });
    }

    finished()
    {
        return this.loaded;
    }

    ownsOp(opname)
    {
        const usernamespace = "Ops.User." + gui.user.usernameLowercase + ".";
        if (opname.indexOf(usernamespace) == 0) return true;
        return false;
    }

    getUserOpOwner(opname)
    {
        if (!this.isUserOp(opname)) return null;
        const fields = opname.split(".", 3);
        return fields[2];
    }

    isUserOp(opname)
    {
        return opname && opname.indexOf("Ops.User.") === 0;
    }

    isAdminOp(opname)
    {
        return opname && opname.indexOf("Ops.Admin.") === 0;
    }

    isDeprecatedOp(opname)
    {
        return opname && opname.indexOf("Ops.Deprecated.") === 0;
    }

    isDevOp(opname)
    {
        return opname && opname.indexOf("Ops.Dev.") === 0;
    }

    isExtensionOp(opname)
    {
        return opname && opname.indexOf("Ops.Extension.") === 0;
    }

    isTeamOp(opname)
    {
        return opname && opname.indexOf("Ops.Team.") === 0;
    }

    getExtensionByOpName(opname)
    {
        return opname ? opname.split(".", 3).join(".") : null;
    }

    getTeamNamespaceByOpName(opname)
    {
        return opname ? opname.split(".", 3).join(".") : null;
    }

    canEditOp(user, opName)
    {
        const op = this._ops.find((o) => { return o.name === opName; });
        if (!op) return false;
        return op.allowEdit;
    }

    canReadOp(user, opName)
    {
        const project = gui.project();
        if (project && project.settings && project.settings.isPublic) return true;
        if (!this.isUserOp(opName)) return true;
        if (this.isUserOp(opName))
        {
            const owner = this.getUserOpOwner(opName);
            if (owner && project.userList && project.userList.includes(owner)) return true;
        }
        return false;
    }

    canEditAttachment(user, opName)
    {
        return this.canEditOp(user, opName);
    }

    loadMissingOps(ops, cb)
    {
        let count = ops.length;
        const newOps = [];
        if (count === 0)
        {
            cb(newOps);
        }
        else
        {
            ops.forEach((op) =>
            {
                incrementStartup();
                this.loadMissingOp(op, (newOp) =>
                {
                    if (newOp) newOps.push(newOp);
                    logStartup(op.name + " - Missing Op loaded");
                    count--;
                    if (count === 0) cb(newOps);
                });
            });
        }
    }

    loadMissingOp(op, cb)
    {
        if (op && this.canReadOp(gui.user, op.name))
        {
            let lid = "missingop" + op.name + CABLES.uuid();
            const missingOpUrl = [];

            let url = CABLESUILOADER.noCacheUrl(CABLES.sandbox.getCablesUrl() + "/api/op/" + op.name);
            if (this.isUserOp(op.name)) url += "&p=" + this._patchId;
            if (op.id && op.id !== "undefined") url += "&id=" + op.id;
            missingOpUrl.push(url);

            CABLESUILOADER.talkerAPI.send("getOpDocs", op, (err, res) =>
            {
                loadjs.ready(lid, () =>
                {
                    let newOp = null;
                    if (!err && res && res.opDocs)
                    {
                        res.opDocs.forEach((opDoc) =>
                        {
                            newOp = { "name": opDoc.name, "allowEdit": opDoc.allowEdit, "id": opDoc.id };
                            if (opDoc.libs) newOp.libs = opDoc.libs;
                            if (opDoc.coreLibs) newOp.coreLibs = opDoc.coreLibs;
                            this._ops.push(newOp);
                        });
                        if (gui.opDocs)
                        {
                            gui.opDocs.addOpDocs(res.opDocs);
                        }
                    }
                    incrementStartup();
                    cb(newOp);
                });
                loadjs(missingOpUrl, lid);
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
        if (name && this.isExtensionOp(name))
        {
            const extensionName = name.split(".", 3).join(".");
            const extensionOpUrl = [];
            extensionOpUrl.push(CABLESUILOADER.noCacheUrl(CABLES.sandbox.getCablesUrl() + "/api/ops/code/extension/" + extensionName));

            const lid = "extensionops" + extensionName + CABLES.uuid();
            loadjs.ready(lid, () =>
            {
                CABLESUILOADER.talkerAPI.send("getExtensionOpDocs", { "name": extensionName }, (err, res) =>
                {
                    if (!err && res && res.opDocs)
                    {
                        res.opDocs.forEach((opDoc) =>
                        {
                            const op = { "id": opDoc.id, "name": opDoc.name, "allowEdit": opDoc.allowEdit };
                            if (opDoc.libs) op.libs = opDoc.libs;
                            if (opDoc.coreLibs) op.coreLibs = opDoc.coreLibs;
                            this._ops.push(op);
                        });
                        if (gui.opDocs)
                        {
                            gui.opDocs.addOpDocs(res.opDocs);
                        }
                    }
                    incrementStartup();
                    cb();
                });
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
        if (name && this.isTeamOp(name))
        {
            const teamNamespaceName = name.split(".", 3).join(".");
            const teamOpUrl = [];
            teamOpUrl.push(CABLESUILOADER.noCacheUrl(CABLES.sandbox.getCablesUrl() + "/api/ops/code/team/" + teamNamespaceName));

            const lid = "teamops" + teamNamespaceName + CABLES.uuid();
            loadjs.ready(lid, () =>
            {
                CABLESUILOADER.talkerAPI.send("getTeamNamespaceOpDocs", { "name": teamNamespaceName }, (err, res) =>
                {
                    if (!err && res && res.opDocs)
                    {
                        res.opDocs.forEach((opDoc) =>
                        {
                            const op = { "id": opDoc.id, "name": opDoc.name, "allowEdit": opDoc.allowEdit };
                            if (opDoc.libs) op.libs = opDoc.libs;
                            if (opDoc.coreLibs) op.coreLibs = opDoc.coreLibs;
                            this._ops.push(op);
                        });
                        if (gui.opDocs)
                        {
                            gui.opDocs.addOpDocs(res.opDocs);
                        }
                    }
                    incrementStartup();
                    cb();
                });
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
