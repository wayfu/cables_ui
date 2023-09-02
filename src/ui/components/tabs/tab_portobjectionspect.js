import ele from "../../utils/ele";

export default class TabPortObjectInspect extends CABLES.EventTarget
{
    constructor(opid, portName)
    {
        super();
        this.tabs = gui.mainTabs;
        this.tab = new CABLES.UI.Tab("Object Inspect", { "icon": "op", "infotext": "tab_objectinspect", "padding": true, "singleton": "true", });
        this.tabs.addTab(this.tab, true);
        this._id = CABLES.uuid();

        this.op = gui.corePatch().getOpById(opid);
        if (!this.op)
        {
            this._log.warn("opid not found:", opid);
            return;
        }
        this.port = this.op.getPort(portName);
        if (!this.port)
        {
            this._log.warn("port not found:", portName);
            return;
        }

        this._showPortValue();

        gui.maintabPanel.show(true);
    }

    _showPortValue()
    {
        const port = this.port;
        function convertHTML(str)
        {
            const regex = /[&|<|>|"|']/g;
            const htmlString = str.replace(regex, function (match)
            {
                if (match === "&") return "&amp;";
                else if (match === "<") return "&lt;";
                else if (match === ">") return "&gt;";
                else if (match === "\"") return "&quot;";
                else return "&apos;";
            });
            return htmlString;
        }


        try
        {
            const thing = port.get();
            let serializedThing = thing;
            if (typeof thing !== "string") serializedThing = JSON.stringify(thing, null, 2);

            let html = "";
            html += "<h2><span class=\"icon icon-search\"></span>&nbsp;Inspect: " + this.op.name + ": " + this.port.name + "</h2>";
            html += "<br/><br/>";
            html += "<a class=\"button\" id=\"portvaluejsonbutton" + this._id + "\" ><span class=\"icon icon-refresh\"></span>Update</a>";
            html += "&nbsp;";
            html += "<a id=\"copybutton\" class=\"button \" ><span class=\"icon icon-copy\"></span>Copy</a>";
            html += "<br/><br/>";

            if (thing && thing.constructor)
            {
                html += "class name:" + thing.constructor.name + " \n";

                if (thing.constructor.name == "Array") html += " - length: " + thing.length + "\n";
                if (thing.constructor.name == "Float32Array") html += " - length: " + thing.length + "\n";
            }


            html += "<br/><br/>";
            html += "<div class=\"tabContentScrollContainer\" style=\"max-height:80%;\"><code><pre id=\"portvaluejson" + this._id + "\"class=\"hljs language-json\">" + convertHTML(serializedThing) + "</code></pre></div>";

            this.tab.html(html);
            const el = ele.byId("portvaluejson" + this._id);

            ele.byId("portvaluejsonbutton" + this._id).addEventListener("click",
                () =>
                {
                    this._showPortValue();
                });

            hljs.highlightElement(el);

            ele.byId("copybutton").addEventListener("click", (e) =>
            {
                this.copyPortValuePreview(e, port.name);
            });
        }
        catch (ex)
        {
            let html = "";
            html += "<h2><span class=\"icon icon-search\"></span>&nbsp;Inspect Failed</h2>";
            html += "Port: <b>" + port.name + "</b> of <b>" + port.op.name + "</b> ";
            html += "<br/><br/>";

            const thing = port.get();

            if (thing && thing.constructor)
            {
                html += "" + thing.constructor.name + " \n";

                if (thing.constructor.name === "Array") html += " - length: " + thing.length + "\n";
                if (thing.constructor.name === "Float32Array") html += " - length: " + thing.length + "\n";
            }

            html += "<br/><br/>";
            html += "<pre><code id=\"portvalue\" class=\"code hljs json\">Unable to serialize Array/Object:<br/>" + ex.message + "</code></pre>";

            this.tab.html(html);
        }
    }

    copyPortValuePreview(e, title)
    {
        navigator.clipboard
            .writeText(JSON.stringify(this.port.get()))
            .then(() =>
            {
                CABLES.UI.notify("Copied value to clipboard");
            })
            .catch((err) =>
            {
                console.warn("copy to clipboard failed", err);
            });
    }
}
