
CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.OPSELECT = {};
CABLES.UI.OPSELECT.linkNewLink = null;
CABLES.UI.OPSELECT.linkNewOpToPort = null;
CABLES.UI.OPSELECT.newOpPos = { "x": 0, "y": 0 };
CABLES.UI.OPSELECT.maxPop = 0;

CABLES.UI.OpSelect = class
{
    constructor()
    {
        this._list = null;
        this.displayBoxIndex = 0;
        this.itemHeight = 0;
        this.firstTime = true;
        this.tree = new CABLES.UI.OpTreeList();
        this._sortTimeout = 0;
        this._backspaceDelay = -1;
        this._wordsDb = null;
        this._eleSearchinfo = null;
        this._forceShowOldOps = CABLES.UI.userSettings.get("showOldOps") || false;
        this._newOpOptions = {};
        this._searchInputEle = null;
        this._enterPressedEarly = false;
        this._searching = false;
    }

    close()
    {
        // if (this.keyDown)
        // ele.byId("opsearch").removeEventListener("keydown", this.keyDown);

        gui.patchView.focus();
    }

    _getQuery()
    {
        return document.getElementById("opsearch").value;
    }

    updateOptions(opname)
    {
        const perf = CABLES.UI.uiProfiler.start("opselect.udpateOptions");
        const num = $(".searchbrowser .searchable:visible").length;
        const query = this._getQuery();

        const eleTypeStart = ele.byId("search_startType");
        const eleTypeMore = ele.byId("search_startTypeMore");
        const eleNoResults = ele.byId("search_noresults");

        if (query.length === 0)
        {
            ele.show(eleTypeStart);// .classList.remove("hidden");

            for (let i = 0; i < this._list.length; i++)
                if (this._list[i].element)
                    this._list[i].element[0].style.display = "none";
        }
        else ele.hide(eleTypeStart);// .classList.add("hidden");

        if (query.length == 1) ele.show(eleTypeMore);// .classList.remove("hidden");
        else ele.hide(eleTypeMore);// .classList.add("hidden");

        if (num == 0 && query.length > 1)
        {
            ele.show(eleNoResults);// .classList.remove("hidden");
            ele.byId("searchinfo").innerHMTL = "";
            // const userOpName = "Ops.User." + gui.user.usernameLowercase + "." + this._getQuery();
            // document.getElementById("userCreateOpName").innerHTML = userOpName;
            // document.getElementById("createuserop").addEventListener("click", () => { gui.serverOps.create(userOpName); });
        }
        else
        {
            ele.hide(eleNoResults);// .classList.add("hidden");
        }

        let optionsHtml = "";

        if (num == 0 && gui.project().users.indexOf(gui.user.id) == -1)
        {
            optionsHtml += "<span class=\"warning\">your user ops are hidden, you are not a collaborator of patch </span><br/>";
        }

        optionsHtml += `&nbsp;found ${num} ops.`;// in '+(Math.round(this._timeUsed)||0)+'ms ';

        if (gui.user.isAdmin && this._getQuery() && (this._getQuery().startsWith("Ops.") || this._getQuery().startsWith("Op.")))
        {
            optionsHtml += `&nbsp;&nbsp;<i class="fa fa-lock"/> <a onclick="gui.serverOps.create('${this._getQuery()}');">create op</a>`;
        }

        if (opname && (gui.user.isAdmin || opname.startsWith(`Ops.User.${gui.user.username}`)) && gui.serverOps.isServerOp(opname))
        {
            optionsHtml += `&nbsp;&nbsp;|&nbsp;&nbsp;<i class="fa fa-lock"/> <a onclick="gui.serverOps.edit('${opname}');">edit op</a>`;
        }

        let score = 0;
        const selected = document.getElementsByClassName("selected");// .data('scoreDebug')

        if (selected.length > 0)score = Math.round(100 * selected[0].dataset.score) / 100;

        if (score && score == score)
        {
            let scoredebug = "";

            if (selected.length > 0) scoredebug = selected[0].dataset.scoreDebug;

            optionsHtml += `&nbsp;&nbsp;|&nbsp;&nbsp;<span class="tt" data-tt="${scoredebug}">`;
            optionsHtml += `score: ${score}`;
            optionsHtml += "</span>";
        }

        document.getElementById("opOptions").innerHTML = optionsHtml;
        perf.finish();
    }

    _searchWord(wordIndex, orig, list, query, options)
    {
        if (!query || query == " " || query == "") return;

        const perf = CABLES.UI.uiProfiler.start("opselect._searchWord");

        for (let i = 0; i < list.length; i++)
        {
            if (wordIndex > 0 && list[i].score == 0) continue; // when second word was found, but first was not

            let scoreDebug = `<b>Query: ${query} </b><br/>`;
            let found = false;
            let points = 0;

            if (list[i]._summary.indexOf(query) > -1)
            {
                found = true;
                points += 1;
                scoreDebug += `+1 found in summary (${query})<br/>`;
            }

            if (list[i]._nameSpace.indexOf(query) > -1)
            {
                found = true;
                points += 1;
                scoreDebug += `+1 found in namespace (${query})<br/>`;
            }

            if (list[i]._shortName.indexOf(query) > -1)
            {
                found = true;
                points += 4;
                scoreDebug += `+4 found in shortname (${query})<br/>`;
            }

            if (list[i]._shortName == query)
            {
                found = true;
                points += 5;
                scoreDebug += "+5 query quals shortname<br/>";
            }

            if (orig.length > 1 && list[i]._lowerCaseName.indexOf(orig) > -1)
            {
                found = true;
                points += 2;
                scoreDebug += `+2 found full namespace (${query})<br/>`;
            }

            if (points == 0)
            {
                if (list[i]._lowerCaseName.indexOf(query) > -1)
                {
                    found = true;
                    points += 2;
                    scoreDebug += `+2 found full namespace (${query})<br/>`;
                }
            }

            if (found)
            {
                if (list[i]._shortName.indexOf(query) === 0)
                {
                    points += 2.5;
                    scoreDebug += `+2.5 found in shortname at beginning (${query})<br/>`;

                    if (list[i]._shortName == query)
                    {
                        points += 2;
                        scoreDebug += `+2 exact name (${query})<br/>`;
                    }
                }

                if (list[i]._summary.length > 0)
                {
                    points += 0.5;
                    scoreDebug += `+0.5 has summary (${query})<br/>`;
                }

                if (list[i]._nameSpace.indexOf("ops.math") > -1)
                {
                    points += 1;
                    scoreDebug += `+1 is math (${query})<br/>`;
                }

                const shortnessPoints = Math.round((1.0 - Math.min(1, (list[i]._nameSpace + list[i]._shortName).length / 100)) * 100) / 100;
                points += shortnessPoints;
                scoreDebug += `+${shortnessPoints} shortness namespace<br/>`;
            }

            if (found && this._list[i].old)
            {
                points -= 1;
                scoreDebug += "-1 outdated<br/>";
            }


            if (found && list[i].pop > 0)
            {
                points += (list[i].pop || 2) / CABLES.UI.OPSELECT.maxPop || 1;
            }

            if (!found) points = 0;
            // if(points && wordIndex>0 && list[i].score==0) points=0; // e.g. when second word was found, but first was not

            if (points === 0 && list[i].score > 0) list[i].score = 0;
            else list[i].score += points;

            list[i].scoreDebug = `${(list[i].scoreDebug || "") + scoreDebug}(${Math.round(points * 100) / 100} points)<br/><br/>`;
        }

        perf.finish();
    }

    _search(sq)
    {
        if (!this._list || !this._html) this.prepare();

        this.firstTime = false;
        sq = sq || "";
        let query = sq.toLowerCase();

        const options = {
            "linkNamespaceIsTextureEffects": false,
        };

        if (this._newOpOptions.linkNewOpToOp && this._newOpOptions.linkNewOpToOp.objName.toLowerCase().indexOf(".textureeffects") > -1) options.linkNamespaceIsTextureEffects = true;

        const origQuery = query;

        if (this._wordsDb == null && this._list) // build word database by splitting up camelcase
        {
            const buildWordDB = {};
            for (let i = 0; i < this._list.length; i++)
            {
                const res = this._list[i].name.split(/(?=[A-Z,0-9,/.])/);
                for (let j = 0; j < res.length; j++)
                {
                    if (res[j][res[j].length - 2] == "_")res[j] = res[j].substr(0, res[j].length - 2);
                    if (res[j][0] == ".") res[j] = res[j].substr(1);
                    if (res[j].length > 2) buildWordDB[res[j].toLowerCase()] = 1;
                }
            }

            this._wordsDb = Object.keys(buildWordDB);
            this._wordsDb.sort((a, b) => b.length - a.length);
        }

        if (this._wordsDb) // search through word db
        {
            let q = query;
            const queryParts = [];
            let found = false;
            do
            {
                found = false;
                for (let i = 0; i < this._wordsDb.length; i++)
                {
                    const idx = q.indexOf(this._wordsDb[i]);
                    if (idx > -1) // && queryParts.indexOf(this._wordsDb[i])==-1
                    {
                        found = true;
                        queryParts.push(this._wordsDb[i]);
                        q = `${q.substr(0, idx)} ${q.substr(idx + this._wordsDb[i].length, q.length - idx)}`;
                        break;
                    }
                }
            }
            while (found);

            if (queryParts.length > 0)
            {
                let nquery = queryParts.join(" ");
                nquery += ` ${q}`;

                if (nquery != query) document.getElementById("realsearch").innerHTML = "Searching for: <b>" + nquery + "</b>";

                query = nquery;
            }
            else document.getElementById("realsearch").innerHTML = "";
        }

        if (query.length > 1)
        {
            for (let i = 0; i < this._list.length; i++)
            {
                this._list[i].score = 0;
                this._list[i].scoreDebug = "";
            }

            if (query.indexOf(" ") > -1)
            {
                const words = query.split(" ");
                for (let i = 0; i < words.length; i++) { this._searchWord(i, origQuery, this._list, words[i], options); }
            }
            else
            {
                this._searchWord(0, query, this._list, query, options);
            }
        }
    }

    updateInfo()
    {
        const opname = $(".selected").data("opname");
        const htmlFoot = "";

        this._eleSearchinfo = this._eleSearchinfo || document.getElementById("searchinfo");

        this.updateOptions(opname);

        if (opname && this._currentSearchInfo != opname)
        {
            const perf = CABLES.UI.uiProfiler.start("opselect.updateInfo");


            this._eleSearchinfo.innerHTML = "";
            const opDoc = gui.opDocs.get2(opname);

            let html = "<div id=\"opselect-layout\">";

            html += "</div>";
            html += `<a target="_blank" href="${CABLES.sandbox.getCablesUrl()}/op/${opname || ""}" class="button-small">View Documentation</a>`;

            html += opDoc;

            html += htmlFoot;

            this._eleSearchinfo.innerHTML = html;
            setTimeout(() =>
            {
                gui.opDocs.opLayoutSVG(opname, "opselect-layout"); /* create op-svg image inside #opselect-layout */
            }, 50);

            perf.finish();
        }
        if (this._getQuery() == "")
        {
            this._eleSearchinfo.innerHTML = this.tree.html();
        }
        this._currentSearchInfo = opname;
    }

    search()
    {
        const q = this._getQuery();
        // if(q==this.lastQuery)return;
        this.lastQuery = q;
        this._search(q);
        let i = 0;

        const perf = CABLES.UI.uiProfiler.start("opselect.searchLoop");

        for (i = 0; i < this._list.length; i++)
        {
            this._list[i].element = this._list[i].element || $(`#result_${this._list[i].id}`);

            if (this._list[i].score > 0)
            {
                this._list[i].element[0].style.display = "block";
                this._list[i].element[0].dataset.score = this._list[i].score;
                this._list[i].element[0].dataset.scoreDebug = this._list[i].scoreDebug;
            }
            else
            {
                this._list[i].element[0].dataset.score = 0.0;
                this._list[i].element[0].dataset.scoreDebug = "???";
                this._list[i].element[0].style.display = "none";
            }
        }

        tinysort.defaults.order = "desc";

        tinysort(".searchresult", { "data": "score" });
        this.Navigate(0);
        this.updateOptions();
        perf.finish();
    }

    Navigate(diff)
    {
        this.displayBoxIndex += diff;

        if (this.displayBoxIndex < 0) this.displayBoxIndex = 0;
        const oBoxCollection = $(".searchresult:visible");
        const oBoxCollectionAll = $(".searchresult");
        if (this.displayBoxIndex >= oBoxCollection.length) this.displayBoxIndex = oBoxCollection.length - 1;
        if (this.displayBoxIndex < 0) this.displayBoxIndex = oBoxCollection.length - 1;

        const cssClass = "selected";

        oBoxCollectionAll.removeClass(cssClass);
        oBoxCollection.removeClass(cssClass).eq(this.displayBoxIndex).addClass(cssClass);

        if (this.displayBoxIndex > 5) $(".searchbrowser").scrollTop((this.displayBoxIndex - 5) * (this.itemHeight + 1));
        else $(".searchbrowser").scrollTop(1);

        this.updateInfo();
    }

    reload()
    {
        this._list = null;
        this._html = null;
    }

    prepare()
    {
        if (!this._list)
        {
            this._list = this.getOpList();

            let maxPop = 0;

            for (let i = 0; i < this._list.length; i++)
            {
                if (!this._list[i].shortName) this._list[i].shortName = this._list[i].name;

                maxPop = Math.max(this._list[i].pop || 0, maxPop);
                this._list[i].id = i;
                this._list[i].summary = this._list[i].summary || "";
                this._list[i]._summary = this._list[i].summary.toLowerCase();
                this._list[i]._shortName = this._list[i].shortName.toLowerCase();
                this._list[i]._lowerCaseName = this._list[i].name.toLowerCase();
                this._list[i]._nameSpace = `${this._list[i].nameSpace.toLowerCase()}.`;
                this._list[i]._nameSpaceFull = `${this._list[i].nameSpace.toLowerCase()}.${this._list[i].shortName.toLowerCase()}`;

                const opdoc = gui.opDocs.getOpDocByName(this._list[i].name);
                if (this._list[i]._lowerCaseName.indexOf("deprecated") > -1 || (opdoc && opdoc.oldVersion)) this._list[i].old = true;
            }

            CABLES.UI.OPSELECT.maxPop = maxPop;
        }

        if (!this._html)
        {
            const head = CABLES.UI.getHandleBarHtml("op_select");

            $("#opsearchmodal").html(head);

            this._html = CABLES.UI.getHandleBarHtml("op_select_ops", { "ops": this._list });
            $("#searchbrowserContainer").html(this._html);

            document.getElementById("opsearch").addEventListener("input", this.onInput.bind(this));
        }
    }

    show(options, linkOp, linkPort, link)
    {
        this._enterPressedEarly = false;
        CABLES.UI.OPSELECT.linkNewLink = link;
        CABLES.UI.OPSELECT.linkNewOpToPort = linkPort;
        CABLES.UI.OPSELECT.newOpPos = options;

        this._newOpOptions =
        {
            "subPatch": options.subPatch,
            "onOpAdd": options.onOpAdd,
            "linkNewOpToPort": linkPort,
            "linkNewOpToOp": linkOp,
            "linkNewLink": link
        };

        this._forceShowOldOps = CABLES.UI.userSettings.get("showOldOps") || false;
        this._searchInputEle = document.getElementById("opsearch");

        if (options.search)
        {
            this._searchInputEle.value = options.search;
            this.search();
        }

        if (this.firstTime) this.search();
        if (!this._list || !this._html) this.prepare();

        ele.hide(ele.byId("search_noresults"));

        CABLES.UI.MODAL.show(null,
            {
                "title": null,
                "element": "#opsearchmodal",
                "transparent": true,
                "onClose": this.close,
                "nopadding": true
            });

        if (CABLES.UI.userSettings.get("miniopselect") == true) document.getElementsByClassName("opsearch")[0].classList.add("minimal");
        else document.getElementsByClassName("opsearch")[0].classList.remove("minimal");

        if (CABLES.UI.OPSELECT.linkNewOpToPort && (CABLES.UI.OPSELECT.linkNewOpToPort.type == CABLES.OP_PORT_TYPE_VALUE || CABLES.UI.OPSELECT.linkNewOpToPort.type == CABLES.OP_PORT_TYPE_STRING)) $("#opselect_createVar").show();
        else $("#opselect_createVar").hide();

        if (link && link.p1 && (link.p1.thePort.type == CABLES.OP_PORT_TYPE_VALUE || link.p1.thePort.type == CABLES.OP_PORT_TYPE_STRING)) $("#opselect_replaceVar").show();
        else $("#opselect_replaceVar").hide();

        const eleOpsearch = ele.byId("opsearch");
        eleOpsearch.select();
        eleOpsearch.focus();

        eleOpsearch.removeEventListener("keydown", this._boundKeydown);
        this._boundKeydown = this.keyDown.bind(this);
        eleOpsearch.addEventListener("keydown", this._boundKeydown);

        if (this.itemHeight === 0) this.itemHeight = $(".searchresult:first").outerHeight();

        this.clear = function ()
        {
            let v = this._getQuery();

            if (v.indexOf(".") > 0)
            {
                const arr = v.split(".");
                arr.length -= 1;
                v = arr.join(".");

                if (v == "Ops") v = "";

                eleOpsearch.value = v;
                this.search();
            }
            else
            {
                eleOpsearch.value = "";
                this.search();
            }
        };

        this.selectOp = function (name)
        {
            const oBoxCollectionAll = $(".searchresult");
            oBoxCollectionAll.removeClass("selected");
            $(`.searchresult[data-opname="${name}"]`).addClass("selected");
            this.updateInfo();
        };


        this.updateOptions();

        setTimeout(() => { eleOpsearch.focus(); }, 50);
    }

    searchFor(what)
    {
        ele.byId("opsearch").value = what;
        this.onInput();
    }

    onInput(e)
    {
        clearTimeout(this._keyTimeout);

        document.querySelector("#searchbrowserContainer .searchbrowser").style.opacity = 0.6;
        this._searching = true;

        this._keyTimeout = setTimeout(() =>
        {
            this._keyTimeout = null;
            this.displayBoxIndex = 0;
            this.updateInfo();
            this.search();
            document.querySelector("#searchbrowserContainer .searchbrowser").style.opacity = 1.0;
            this._searching = false;
            if (this._enterPressedEarly) this.addSelectedOp();
        }, 250);
    }

    addOp(opname)
    {
        if (opname && opname.length > 2)
        {
            gui.log.userInteraction("adds op " + opname);

            this._newOpOptions.createdLocally = true;

            CABLES.UI.MODAL.hide();
            gui.patchView.addOp(opname, this._newOpOptions);
        }
    }

    addSelectedOp()
    {
        const opname = $(".selected").data("opname");
        this.addOp(opname);
    }

    keyDown(e)
    {
        switch (e.which)
        {
        case 27:
            this.close();
            e.preventDefault();
            break;

        case 13:

            if (e.shiftKey)
            {
                this.addSelectedOp();

                setTimeout(() =>
                {
                    gui.opSelect().show({
                        "subPatch": gui.patchView.getCurrentSubPatch(),
                        "x": 0,
                        "y": 0
                    });
                }, 50);

                return;
            }

            if (this._searching)
            {
                this._enterPressedEarly = true;
                return;
            }
            else this.addSelectedOp();

            e.preventDefault();
            break;

        case 8:
            // if (this._backspaceDelay)
            // {
            //     clearTimeout(this._backspaceDelay);
            // }

            // this._backspaceDelay = setTimeout(() =>
            // {
            // this._backspaceDelay = null;
            this.onInput();
            // }, 300);

            return true;
        case 38: // up
            $(".selected").removeClass("selected");
            e.preventDefault();
            this.Navigate(-1);
            break;

        case 40: // down
            $(".selected").removeClass("selected");
            e.preventDefault();
            this.Navigate(1);
            break;

        default: return true; // exit this handler for other keys
        }
        // prevent the default action (scroll / move caret)
    }

    _getop(ops, ns, val, parentname)
    {
        if (Object.prototype.toString.call(val) === "[object Object]")
        {
            for (const propertyName in val)
            {
                if (val.hasOwnProperty(propertyName))
                {
                    const opname = `${ns}.${parentname}${propertyName}`;
                    const isOp = false;
                    let isFunction = false;

                    if (typeof (CABLES.Patch.getOpClass(opname)) === "function") isFunction = true;

                    const parts = opname.split(".");
                    const lowercasename = `${opname.toLowerCase()}_${parts.join("").toLowerCase()}`;
                    const opdoc = gui.opDocs.getOpDocByName(opname);
                    let shortName = parts[parts.length - 1];
                    let hidden = false;
                    let opdocHidden = false;

                    if (opdoc)
                    {
                        opdocHidden = opdoc.hidden;
                        hidden = opdoc.hidden;
                        if (!this._forceShowOldOps) shortName = opdoc.shortNameDisplay;
                    }

                    if (hidden)
                    {
                        if (this._forceShowOldOps) hidden = false;
                        if (opname.indexOf("Ops.Admin") == 0 && !gui.user.isAdmin) hidden = true;
                    }

                    if (opname.indexOf("Ops.Dev.") == 0 && !CABLES.sandbox.isDevEnv()) hidden = true;

                    parts.length -= 1;
                    const nameSpace = parts.join(".");

                    if (isFunction && !hidden)
                    {
                        let oldState = "";
                        if (hidden)oldState = "OLD";
                        if (opdocHidden)oldState = "OLD";
                        if (opname.indexOf("Deprecated") > -1)oldState = "DEPREC";
                        if (opname.indexOf("Ops.Admin") > -1)oldState = "ADMIN";

                        const op = {
                            "nscolor": CABLES.UI.uiConfig.getNamespaceClassName(opname),
                            "isOp": isOp,
                            "name": opname,
                            "userOp": opname.startsWith("Ops.User"),
                            "devOp": opname.startsWith("Ops.Dev."),
                            "shortName": shortName,
                            "nameSpace": nameSpace,
                            "oldState": oldState,
                            "lowercasename": lowercasename,
                        };
                        op.pop = gui.opDocs.getPopularity(opname);
                        op.summary = gui.opDocs.getSummary(opname);
                        ops.push(op);
                    }

                    ops = this._getop(ops, ns, val[propertyName], `${parentname + propertyName}.`);
                }
            }
        }
        return ops;
    }

    getOpList()
    {
        const ops = this._getop([], "Ops", Ops, "");
        // getop('Op',CABLES.Op,'');

        ops.sort((a, b) => b.pop - a.pop,
            // return a.name.length - b.name.length; // ASC -> a - b; DESC -> b - a
        );


        return ops;
    }
};