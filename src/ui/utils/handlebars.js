/**
 * Handlebars template helper functions
 *
 */

const handleBarsPrecompiled = {};

export function getHandleBarHtml(name, obj)
{
    const perf = CABLES.UI.uiProfiler.start("getHandleBarHtml");

    let template = handleBarsPrecompiled[name];
    if (!template && document.getElementById(name))
    {
        const source = document.getElementById(name).innerHTML;
        if (!source)
        {
            console.warn("template not found", "template " + name + " not found...");
            return;
        }
        template = handleBarsPrecompiled[name] = Handlebars.compile(source);
    }

    obj = obj || {};

    obj.frontendOptions = CABLES.platform.frontendOptions;
    obj.cablesUrl = CABLES.platform.getCablesUrl();
    obj.cablesDocsUrl = obj.cablesUrl;
    if (CABLES.platform.getCablesDocsUrl)obj.cablesDocsUrl = CABLES.platform.getCablesDocsUrl();

    const html = template(obj);
    perf.finish();

    return html;
}

export function initHandleBarsHelper()
{
    Handlebars.registerHelper("json", function (context)
    {
        let str = "";
        try
        {
            str = JSON.stringify(context, true, 4);
        }
        catch (e)
        {
            console.error(e);
        }

        return str;
    });

    Handlebars.registerHelper("console", function (context)
    {
        return console.log(context);
    });

    Handlebars.registerHelper("compare", function (left_value, operator, right_value, options)
    {
        if (arguments.length < 4)
        {
            throw new Error("Handlerbars Helper 'compare' needs 3 parameters, left value, operator and right value");
        }

        const operators = {
            "==": function (l, r) { return l == r; },
            "===": function (l, r) { return l === r; },
            "!=": function (l, r) { return l != r; },
            "<": function (l, r) { return l < r; },
            ">": function (l, r) { return l > r; },
            "<=": function (l, r) { return l <= r; },
            ">=": function (l, r) { return l >= r; },
            "typeof": function (l, r) { return typeof l == r; }
        };

        if (!operators[operator])
        {
            throw new Error("Handlerbars Helper 'compare' doesn't know the operator " + operator);
        }

        const result = operators[operator](left_value, right_value);

        if (result === true)
        {
            return options.fn(this);
        }
        else
        {
            return options.inverse(this);
        }
    });

    Handlebars.registerHelper("toUpperCase", function (str)
    {
        if (str && typeof str === "string")
        {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }
        return "";
    });


    Handlebars.registerHelper("logdate", (str) =>
    {
        if (CABLES.UTILS.isNumeric(str) && String(str).length < 11) str *= 1000;
        let date = str;
        if (moment) date = moment(str).format("YYYY-MM-DD HH:mm");
        return new Handlebars.SafeString("<span title=\"" + date + "\">" + date + "</span>");
    });

    Handlebars.registerHelper("md", (str) =>
    {
        return new Handlebars.SafeString(marked.parse(str));
    });

    Handlebars.registerHelper("round", (str) =>
    {
        if (CABLES.UTILS.isNumeric(str))
        {
            str = String(Math.round(parseFloat(str)));
        }
        return str;
    });

    Handlebars.registerHelper("displaydate", (str) =>
    {
        if (CABLES.UTILS.isNumeric(str) && String(str).length < 11) str *= 1000;
        let date = str;
        let displayDate = str;
        if (moment)
        {
            const m = moment(str);
            date = m.format("YYYY-MM-DD HH:mm");
            displayDate = m.format("MMM D, YYYY [at] HH:mm");
        }
        return new Handlebars.SafeString("<span title=\"" + date + "\">" + displayDate + "</span>");
    });


    Handlebars.registerHelper("displaydateNoTime", (str) =>
    {
        if (CABLES.UTILS.isNumeric(str) && String(str).length < 11) str *= 1000;
        let date = str;
        let displayDate = str;
        if (moment)
        {
            const m = moment(str);
            date = m.format("YYYY-MM-DD");
            displayDate = m.format("MMM D, YYYY");
        }
        return new Handlebars.SafeString("<span title=\"" + date + "\">" + displayDate + "</span>");
    });


    Handlebars.registerHelper("relativedate", (str) =>
    {
        if (CABLES.UTILS.isNumeric(str) && String(str).length < 11) str *= 1000;
        let date = str;
        let displayDate = str;
        if (moment)
        {
            const m = moment(str);
            displayDate = m.fromNow();
            if (m.isBefore(moment().subtract(7, "days"))) displayDate = moment(date).format("MMM D, YYYY [at] HH:mm");
            date = m.format("MMM D, YYYY [at] HH:mm");
        }
        return new Handlebars.SafeString("<span title=\"" + date + "\">" + displayDate + "</span>");
    });
}
