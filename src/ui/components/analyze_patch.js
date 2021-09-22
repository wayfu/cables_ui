

export default function analyzePatch()
{
    const patch = gui.corePatch();
    const ops = patch.ops;

    let htmlWarnings = "";
    let htmlHints = "";

    const notWorkings = {};

    for (let i = 0; i < ops.length; i++)
    {
        const op = ops[i];

        if (op.uiAttribs.notWorkingMsg)
        {
            notWorkings[op.uiAttribs.notWorkingMsg] = notWorkings[op.uiAttribs.notWorkingMsg] || {};
            notWorkings[op.uiAttribs.notWorkingMsg].ops = notWorkings[op.uiAttribs.notWorkingMsg].ops || [];
            notWorkings[op.uiAttribs.notWorkingMsg].ops.push(op);
        }

        if (op.uiAttribs.warning)
            htmlWarnings += op.objName + " - " + op.uiAttribs.warning + "<br/>";

        if (op.uiAttribs.hint)
            htmlHints += op.objName + " - " + op.uiAttribs.hint + "<br/>";
    }

    let html = "";

    html += "<h3>Not properly linked</h3>";
    for (const i in notWorkings)
    {
        html += i + "<br/>";
        html += notWorkings[i].ops.length + "x ";

        let onclick = "";
        for (let j = 0; j < notWorkings[i].ops.length; j++)
            onclick += "gui.patch().addSelectedOpById('" + notWorkings[i].ops[j].id + "');";

        onclick += "gui.patch().setStatusSelectedOps();";
        onclick += "console.log(gui.patch().getSelectedOps());";

        html += "<a onclick=\"CABLES.UI.MODAL.hide(true);" + onclick + "\" class=\"greybutton\">select ops</a><br/>";
    }
    html += "<br/>";

    html += "<h3>Warnings</h3>";
    html += htmlWarnings;
    html += "<br/>";

    html += "<h3>Hints</h3>";
    html += htmlHints;

    html += "<br/><br/><a class=\"button\" onclick=\"CABLES.UI.MODAL.hide(true);\">close</a>&nbsp;&nbsp;";

    CABLES.UI.MODAL.show(html);
}