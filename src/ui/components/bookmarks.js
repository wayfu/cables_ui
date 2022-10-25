import defaultops from "../defaultops";
import text from "../text";
import { getHandleBarHtml } from "../utils/handlebars";

export default class Bookmarks
{
    constructor()
    {
        this._bookmarks = [];
        this._dynCmds = [];
    }

    hasBookmarkWithId(id)
    {
        for (let i = 0; i < this._bookmarks.length; i++)
        {
            const bm = this._bookmarks[i];
            if (bm === id)
            {
                return true;
            }
        }
        return false;
    }

    cleanUp()
    {
        for (let i in this._bookmarks)
        {
            const op = gui.corePatch().getOpById(this._bookmarks[i]);
            if (!op) this._bookmarks[i] = null;
        }
    }

    getHtml()
    {
        const subs = gui.patchView.getSubPatches(false);

        for (let i = 0; i < subs.length; i++)
        {
            subs[i].path = gui.patchView.getSubpatchPathArray(subs[i].id);
            let sortname = "";

            for (let j = 0; j < subs[i].path.length; j++)
                sortname = subs[i].path[j].id + "+" + sortname;

            subs[i].sortname = sortname;
        }

        subs.sort(function (a, b) { return a.sortname.localeCompare(b.sortname); });

        for (let i = 0; i < subs.length; i++)
        {
            subs[i].indent = "";
            for (let j = 0; j < subs[i].path.length; j++)
            {
                subs[i].indent += "&nbsp;&nbsp;&nbsp;&nbsp;";
            }
        }

        const bm = [];
        for (const i in this._bookmarks)
        {
            const op = gui.corePatch().getOpById(this._bookmarks[i]);

            if (op)
            {
                bm.push(
                    {
                        "id": this._bookmarks[i],
                        "name": op.name,
                        "objName": op.objName,
                        "class": defaultops.getNamespaceClassName(op.objName),
                    });
            }
            else
            {
            }
        }

        const html = getHandleBarHtml("bookmarks", { "bookmarks": bm, "subPatches": subs, "currentSubPatch": gui.patchView.getCurrentSubPatch() });
        this.updateDynamicCommands();
        return html;
    }

    set(arr)
    {
        if (arr) this._bookmarks = arr;
        this.updateDynamicCommands();
    }

    remove(id)
    {
        if (id)
        {
            for (const i in this._bookmarks)
            {
                if (this._bookmarks[i] == id) this._bookmarks[i] = null;
            }
        }

        while (this._bookmarks.indexOf(null) >= 0) this._bookmarks.splice(this._bookmarks.indexOf(null), 1);
    }

    add(id)
    {
        if (id)
        {
            for (const i in this._bookmarks)
            {
                if (this._bookmarks[i] == id)
                {
                    this.remove(id);

                    const elements = document.getElementsByClassName("toggle-bookmark-button");
                    for (let eli = 0; eli < elements.length; eli++)
                    {
                        elements[eli].classList.remove("icon-bookmark-filled");
                        elements[eli].classList.add("icon-bookmark");
                    }
                    CABLES.UI.notify(text.bookmark_removed);
                    return;
                }
            }

            this._bookmarks.push(id);

            const elements = document.getElementsByClassName("toggle-bookmark-button");
            for (let eli = 0; eli < elements.length; eli++)
            {
                elements[eli].classList.add("icon-bookmark-filled");
                elements[eli].classList.remove("icon-bookmark");
            }

            gui.patchView.centerSelectOp(id);
            CABLES.UI.notify(text.bookmark_added);
        }

        this.updateDynamicCommands();
    }

    goto(id)
    {
        if (gui.keys.shiftKey)
        {
            const op = gui.corePatch().getOpById(id);
            gui.opParams.show(op);
        }
        else
        {
            gui.patchView.centerSelectOp(id);
        }
    }

    getBookmarks()
    {
        const bm = [];
        for (let i = 0; i < this._bookmarks.length; i++)
        {
            if (this._bookmarks[i] != null) bm.push(this._bookmarks[i]);
        }

        return bm;
    }

    updateDynamicCommands()
    {
        for (let i = 0; i < this._dynCmds.length; i++)
            gui.cmdPallet.removeDynamic(this._dynCmds[i]);

        for (let i = 0; i < this._bookmarks.length; i++)
        {
            const op = gui.corePatch().getOpById(this._bookmarks[i]);

            if (!op) continue;
            const cmd = gui.cmdPallet.addDynamic("bookmark", "" + op.name, () =>
            {
                gui.patchView.centerSelectOp(op.id);
            }, "bookmark");

            this._dynCmds.push(cmd);
        }


        const subs = gui.patchView.getSubPatches(false);
        for (let i = 0; i < subs.length; i++)
        {
            const sub = subs[i];

            const cmd = gui.cmdPallet.addDynamic("subpatch", "" + sub.name, () =>
            {
                gui.patchView.setCurrentSubPatch(sub.id);
                CABLES.CMD.UI.centerPatchOps();
            }, "subpatch");

            this._dynCmds.push(cmd);
        }
    }
}
