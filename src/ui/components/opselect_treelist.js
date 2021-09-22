CABLES = CABLES || {};


export default class OpTreeList
{
    constructor()
    {
        this.data = this._serializeOps(window.Ops, "Ops");
    }


    searchFor(txt)
    {
        const opSearch = document.getElementById("opsearch");
        opSearch.value = txt;

        const event = new Event("input", {
            "bubbles": true,
            "cancelable": true,
        });

        opSearch.dispatchEvent(event);
    }

    itemHtml(item, html, level)
    {
        if (!item.childs || item.childs.length == 0) return "";
        if (!item) return "";
        html = "";

        let i = 0;
        for (i = 0; i < level; i++) html += "&nbsp;&nbsp;&nbsp;";

        const style = CABLES.UI.uiConfig.getNamespaceClassName(item.fullname);

        html += "<a class=\"op_color_" + style + "\" onclick=\"gui.opSelect().tree.searchFor('" + item.fullname + ".')\">";
        html += "" + item.name;
        html += "</a>";

        // if(item.childs && item.childs.length>0)html+=' ('+item.childs.length+')';
        html += "<br/>";

        if (item.childs)
            for (i = 0; i < item.childs.length; i++)
                html += this.itemHtml(item.childs[i], html, level + 1);

        return html;
    }

    html()
    {
        let html = "";

        for (let i = 0; i < this.data.length; i++)
            html += this.itemHtml(this.data[i], html, 0);

        return html;
    }

    _serializeOps(root, prefix)
    {
        let items = [];

        for (const i in root)
        {
            if (i != "Deprecated" && i != "Admin" && i != "Dev")
                items.push(
                    {
                        "name": i,
                        "fullname": prefix + "." + i,
                        "childs": this._serializeOps(root[i], prefix + "." + i)
                    });
        }

        items = items.sort(
            function (a, b)
            {
                if (a.name < b.name) return -1;
                if (a.name > b.name) return 1;
                return 0;
            });

        return items;
    }
}