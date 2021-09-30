
import Logger from "../utils/logger";

let idleTime = 180;
let idling = false;
let idleTimeout = null;
let idleModeStart = 0;
let idleFocus = false;

const logger = new Logger("idlemode");

function startIdleMode()
{
    if (!CABLES.UI.loaded || !window.gui) return;
    if (idling) return;
    if (CABLES.UI.userSettings.get("noidlemode")) return;

    CABLES.UI.MODAL.show("<center><b>cables is paused!</b><br/><br/>Click to resume<br/></center>");

    gui.corePatch().pause();
    gui.emitEvent("uiIdleStart");
    idling = true;
    clearTimeout(idleTimeout);
    idleModeStart = Date.now();
}

function idleInteractivity()
{
    idleFocus = true;

    if (idling) stopIdleMode();
    if (!document.hidden)
    {
        clearTimeout(idleTimeout);
        idleTimeout = setTimeout(startIdleMode, idleTime * 1000);
    }
}

function stopIdleMode()
{
    if (!CABLES.UI.loaded || !window.gui) return;
    if (!idling) return;

    logger.log("idled for ", Math.round((Date.now() - idleModeStart) / 1000) + " seconds");


    gui.corePatch().resume();
    CABLES.UI.MODAL.hide();
    idling = false;
    clearTimeout(idleTimeout);
    gui.emitEvent("uiIdleEnd");
}

function visibilityChanged(e)
{
    idleTimeout = clearTimeout(idleTimeout);
    if (document.hidden) idleTimeout = setTimeout(startIdleMode, 1000);
    else stopIdleMode();
}

export default function startIdleListeners()
{
    if (gui.isRemoteClient) return;
    // logger.log("idle listeners started!");

    window.addEventListener("focus", (event) =>
    {
        idleFocus = true;
        clearTimeout(idleTimeout);
        stopIdleMode();
    });

    window.addEventListener("blur", (event) =>
    {
        idleFocus = false;
        clearTimeout(idleTimeout);
        idleTimeout = setTimeout(startIdleMode, idleTime * 1000);
    });

    document.addEventListener("keydown", idleInteractivity, false);
    document.addEventListener("mousemove", idleInteractivity);
    document.addEventListener("visibilitychange", visibilityChanged);

    idleTimeout = setTimeout(startIdleMode, idleTime * 1000);
}