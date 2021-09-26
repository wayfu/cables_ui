
export default class MainTabPanel extends CABLES.EventTarget
{
    constructor(tabs)
    {
        super();
        this._tabs = tabs;
        this._tabs.showTabListButton = true;
        this._visible = false;
        this._ele = document.getElementById("maintabs");
        this._ele.style.display = "none";

        this._tabs.addEventListener("onTabAdded", (tab, existedBefore) =>
        {
            const wasVisible = this._visible;
            if (!existedBefore) this.show();

            document.getElementById("editorminimized").classList.add("editorminimized_changed");
            setTimeout(() => { document.getElementById("editorminimized").classList.remove("editorminimized_changed"); }, 200);

            tabs.activateTab("");
            tabs.activateTab(tab.id);

            if (!wasVisible && window.gui) gui.setLayout();
        });

        this._tabs.addEventListener("onTabRemoved", (tab) =>
        {
            if (this._tabs.getNumTabs() == 0)
            {
                this.hide();
                gui.setLayout();
            }
        });
    }

    init()
    {
    }

    isVisible()
    {
        return this._visible;
    }

    show(force)
    {
        if (!force && this._tabs.getNumTabs() == 0)
        {
            this.hide(true);
            return;
        }

        this._visible = true;
        this._ele.style.display = "block";
        document.getElementById("editorminimized").style.display = "none";
        if (CABLES.UI.loaded) CABLES.UI.userSettings.set("maintabsVisible", true);
        gui.setLayout();

        this._tabs.updateSize();
    }

    hide(donotsave)
    {
        this._visible = false;
        document.getElementById("editorminimized").style.display = "block";
        this._ele.style.display = "none";
        if (window.gui)gui.setLayout();
        if (!donotsave && CABLES.UI.loaded) CABLES.UI.userSettings.set("maintabsVisible", false);
    }

    toggle()
    {
        if (!CABLES.UI.loaded) return;
        if (this._visible) this.hide();
        else this.show();
    }
}
