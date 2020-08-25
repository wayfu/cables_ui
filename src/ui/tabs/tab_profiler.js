CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.Profiler = function (tabs)
{
    this._tab = new CABLES.UI.Tab("profiler", { "icon": "pie-chart", "singleton": true, "infotext": "tab_profiler", "padding": true });
    tabs.addTab(this._tab, true);
    this.show();

    this.colors = ["#7AC4E0", "#D183BF", "#9091D6", "#FFC395", "#F0D165", "#63A8E8", "#CF5D9D", "#66C984", "#D66AA6", "#515151"];
    this.intervalId = null;
    this.lastPortTriggers = 0;
};

CABLES.UI.Profiler.prototype.show = function ()
{
    const html = CABLES.UI.getHandleBarHtml("meta_profiler", {});
    this._tab.html(html);

    document.getElementById("profilerstartbutton").addEventListener("click", function ()
    {
        this.start();
    }.bind(this));
};

CABLES.UI.Profiler.prototype.update = function ()
{
    const profiler = gui.corePatch().profiler;
    const items = profiler.getItems();
    let html = "";
    let htmlBar = "";
    let allTimes = 0;
    let i = 0;
    const sortedItems = [];
    let htmlData = "";

    for (i in items)
    {
        allTimes += items[i].timeUsed;
        sortedItems.push(items[i]);
    }

    let allPortTriggers = 0;
    for (i in items)
    {
        items[i].percent = Math.floor(items[i].timeUsed / allTimes * 100);
        allPortTriggers += items[i].numTriggers;
    }
    let colorCounter = 0;

    if (allPortTriggers - this.lastPortTriggers > 0) htmlData = "Port triggers/s: " + (allPortTriggers - this.lastPortTriggers) + "<br/>";
    this.lastPortTriggers = allPortTriggers;

    sortedItems.sort(function (a, b) { return b.percent - a.percent; });

    if (!document.getElementById("profilerdata"))
    {
        clearInterval(this.intervalId);
        this.intervalId = null;
        console.log("stopping interval...");
        return;
    }
    document.getElementById("profilerdata").innerHTML = htmlData;

    let item = null;
    let pad = "";

    html += "<table>";

    for (i in sortedItems)
    {
        item = sortedItems[i];
        pad = "";

        html += "<tr><td>";
        if (sortedItems.length > 0)
            for (i = 0; i < 2 - (item.percent + "").length; i++)
                pad += "&nbsp;";

        html += pad + item.percent + "% </td><td>" + item.title + "</td><td> " + item.numTriggers + " </td><td> " + Math.round(item.timeUsed) + "ms </td></tr>";

        if (item.percent > 0)
        {
            htmlBar += "<div class=\"tt\" data-tt=\"" + item.title + "\" style=\"height:20px;background-color:" + this.colors[colorCounter] + ";float:left;padding:0px;overflow:hidden;min-width:0px;width:" + item.percent + "%\"></div>";
            colorCounter++;
            if (colorCounter > this.colors.length - 1)colorCounter = 0;
        }
    }

    html += "</table>";

    // peak list
    let htmlPeaks = "";
    sortedItems.sort(function (a, b) { return b.peak - a.peak; });

    for (i in sortedItems)
    {
        item = sortedItems[i];
        pad = "";
        if (sortedItems.length > 0) for (i = 0; i < 2 - (item.peak + "").length; i++)pad += "&nbsp;";
        htmlPeaks += pad + (Math.round(96 * item.peak) / 100) + "ms " + item.title + "<br/>";
    }

    document.getElementById("profilerui").style.display = "block";
    document.getElementById("profilerlistPeaks").innerHTML = htmlPeaks;
    document.getElementById("profilerbar").innerHTML = htmlBar;
    document.getElementById("profilerlist").innerHTML = html;
    document.getElementById("profilerstartbutton").style.display = "none";
};

CABLES.UI.Profiler.prototype.start = function ()
{
    gui.corePatch().profile(true);
    if (!this.intervalId) this.intervalId = setInterval(this.update.bind(this), 1000);
};
