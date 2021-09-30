export default class NoPatchEditor extends CABLES.EventTarget
{
    constructor(cgl)
    {
        super();
        gui.patchView.setPatchRenderer(null, this);
    }

    get name() { return "nopatch"; }

    setSize() {}

    setProject() {}

    getCurrentSubPatch() { return 0; }
}