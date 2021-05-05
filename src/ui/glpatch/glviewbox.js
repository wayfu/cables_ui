CABLES = CABLES || {};
CABLES.GLGUI = CABLES.GLGUI || {};

CABLES.GLGUI.ViewBox = class
{
    constructor(cgl, glPatch)
    {
        this._cgl = cgl;
        this.glPatch = glPatch;

        this.mousePatchNotPredicted = vec2.create();
        this._lastPosPixel = vec2.create();
        this._mouseSmooth = [];
        this._mouseSmoothCount = 0;
        this._subPatchViewBoxes = {};
        this._currentSubPatchId = 0;
        this._mouseX = 0;
        this._mouseY = 0;
        this._mousePatchX = this._mousePatchY = 0;
        this._scrollX = 0;
        this._scrollY = 0;
        this._oldScrollX = 0;
        this._oldScrollY = 0;
        this._viewResX = 0;
        this._viewResY = 0;
        this._boundingRect = null;
        this._mouseRightDownStartX = 0;
        this._mouseRightDownStartY = 0;
        this._zoom = CABLES.GLGUI.VISUALCONFIG.zoomDefault;
        this._spaceDown = false;

        this._defaultEasing = CABLES.EASING_EXPO_OUT;

        this._animScrollX = new CABLES.TL.Anim({ "defaultEasing": this._defaultEasing });
        this._animScrollY = new CABLES.TL.Anim({ "defaultEasing": this._defaultEasing });
        this._animZoom = new CABLES.TL.Anim({ "defaultEasing": this._defaultEasing });

        cgl.canvas.addEventListener("pointerenter", this._onCanvasMouseEnter.bind(this));
        cgl.canvas.addEventListener("pointerleave", this._onCanvasMouseLeave.bind(this));
        cgl.canvas.addEventListener("pointerdown", this._onCanvasMouseDown.bind(this));
        cgl.canvas.addEventListener("pointermove", this._onCanvasMouseMove.bind(this));
        cgl.canvas.addEventListener("pointerup", this._onCanvasMouseUp.bind(this));
        cgl.canvas.addEventListener("wheel", this._onCanvasWheel.bind(this));
        // this.glPatch.on("dblclick", this._onCanvasDblClick.bind(this));

        this.glPatch.addEventListener("spacedown", this._onCanvasSpaceDown.bind(this));
        this.glPatch.addEventListener("spaceup", this._onCanvasSpaceUp.bind(this));

        cgl.canvas.addEventListener("touchmove", this._onCanvasTouchMove.bind(this));

        this._eleTabs = document.getElementById("splitterMaintabs");
    }

    setSize(w, h)
    {
        const first = (this._viewResX === 0 && this._viewResY === 0);
        this._viewResX = w;
        this._viewResY = h;

        if (first) this.setMousePos(this._cgl.canvasWidth / 2, this._cgl.canvasHeight / 2);
    }

    setMousePos(x, y)
    {
        const dx = 0;
        const dy = 0;

        const coord = this.screenToPatchCoord(x + dx, y + dy);
        this.mousePatchNotPredicted = this.screenToPatchCoord(x, y);


        gui.socketUi.sendCursorPos(this._mousePatchX, this._mousePatchY);
        gui.patchView.emitEvent("viewBoxChange");

        this._mousePatchX = coord[0];
        this._mousePatchY = coord[1];
        this._mouseX = x;
        this._mouseY = y;
    }

    _onCanvasMouseEnter(e)
    {
        this.setMousePos(e.offsetX, e.offsetY);
    }

    _onCanvasMouseLeave(e)
    {
        this.setMousePos(e.offsetX, e.offsetY);
    }

    _onCanvasSpaceUp(e)
    {
        this._spaceDown = false;
    }

    _onCanvasSpaceDown(e)
    {
        if (this._spaceDown) return;
        this._spaceDown = true;
        this._oldScrollX = this._scrollX;
        this._oldScrollY = this._scrollY;
        this._mouseRightDownStartX = this._mouseX;
        this._mouseRightDownStartY = this._mouseY;
    }

    _onCanvasMouseDown(e)
    {
        if (this.glPatch.mouseState.buttonRight || this.glPatch.spacePressed || this.glPatch.mouseState.numFingers)
        {
            this._oldScrollX = this._scrollX;
            this._oldScrollY = this._scrollY;
            this._mouseRightDownStartX = e.offsetX;
            this._mouseRightDownStartY = e.offsetY;
        }
    }

    _onCanvasTouchMove(e)
    {
        console.log(e);
        console.log(e.touches.length);
    }

    _onCanvasMouseMove(e)
    {
        this.setMousePos(e.offsetX, e.offsetY);
        this._lastPosPixel[0] = e.offsetX;
        this._lastPosPixel[1] = e.offsetY;

        if ((this.glPatch.mouseState.buttonRight || ((this.glPatch.spacePressed || this.glPatch.mouseState.numFingers == 2) && this.glPatch.mouseState.buttonLeft)) && !this.glPatch.isDraggingPort()) // && this.glPatch.allowDragging
        {
            this.glPatch.setCursor(CABLES.GLGUI.CURSOR_HAND);

            const pixelMulX = (this._cgl.canvas.width / this._zoom) * 0.5 / this._cgl.pixelDensity;
            const pixelMulY = (this._cgl.canvas.height / this._zoom) * 0.5 / this._cgl.pixelDensity;

            this.scrollTo(
                this._oldScrollX + (this._mouseRightDownStartX - e.offsetX) / pixelMulX,
                this._oldScrollY + (this._mouseRightDownStartY - e.offsetY) / pixelMulY);
        }
    }

    _onCanvasMouseUp(e)
    {
        this._oldScrollX = this._scrollX;
        this._oldScrollY = this._scrollY;
        this.glPatch.setCursor(CABLES.GLGUI.CURSOR_NORMAL);
    }

    _onCanvasDblClick(e)
    {
        const z = CABLES.GLGUI.VISUALCONFIG.zoomDefault;
        if (Math.abs(this._zoom - CABLES.GLGUI.VISUALCONFIG.zoomDefault) < 200)
        {
            this.glPatch.unselectAll();
            this.center();
        }
        else
        {
            this.animateZoom(z);
            this.animateToCenterAtMouseCoords();
        }
    }

    animateToCenterAtMouseCoords()
    {
        this.animateScrollTo(this.mousePatchX, this.mousePatchY * (this._viewResX / this._viewResY));
    }

    _onCanvasWheel(event)
    {
        this.setMousePos(event.offsetX, event.offsetY);

        let delta = 5;
        if (event.deltaY < 0)delta *= -1;

        if (event.altKey) this._scrollY -= delta;
        else if (event.shiftKey) this.scrollTo(this._scrollX - delta, this._scrollY);

        this.wheelZoom(delta);
        this.setMousePos(this._mouseX, this._mouseY);
    }

    wheelZoom(delta)
    {
        if (delta == 0) return;

        const wheelMultiplier = CABLES.UI.userSettings.get("wheelmultiplier") || 1;

        if (delta < 0) delta = 1.0 - 0.2 * wheelMultiplier;
        else delta = 1 + 0.2 * wheelMultiplier;

        const mouse = this.screenToPatchCoord(this._mouseX, this._mouseY, true);

        const newZoom = this._zoom * delta;

        const x = this._scrollX + mouse[0];
        const y = this._scrollY + mouse[1];


        const oldZoom = this._zoom;
        this._zoom = newZoom;

        const mouseAfterZoom = this.screenToPatchCoord(this._mouseX, this._mouseY, true);

        const animate = true;
        if (animate)
        {
            this._zoom = oldZoom;
            const dur = 0.3;
            this.animateZoom(newZoom, dur);
            this.animateScrollTo(
                x - mouseAfterZoom[0],
                y - mouseAfterZoom[1], dur, true);
        }
        else
        {
            this.scrollTo(
                x - mouseAfterZoom[0],
                y - mouseAfterZoom[1], true);
        }

        gui.patchView.emitEvent("viewBoxChange");
    }

    get zoom() { return this._zoom; }

    get scrollX() { return -this._scrollX; }

    get scrollY() { return this._scrollY; }

    get scrollXZoom() { return (-this._scrollX) / this._zoom; }

    get scrollYZoom() { return this._scrollY / this._zoom; }

    get mouseX() { return this._mouseX; }

    get mouseY() { return this._mouseY; }

    get mousePatchX() { return this._mousePatchX; }

    get mousePatchY() { return this._mousePatchY; }

    update()
    {
        const time = this.glPatch.time;
        if (!this._animZoom.isFinished(time)) this._zoom = this._animZoom.getValue(time);
        // if (!this._animScrollX.isFinished(time))
        this._scrollX = this._animScrollX.getValue(time);
        // if (!this._animScrollY.isFinished(time))
        this._scrollY = this._animScrollY.getValue(time);

        if (this._zoom != this._zoom)
        {
            this._zoom = 400;
        }

        this.setMousePos(this._mouseX, this._mouseY);

        if (!this._boundingRect)
        {
            this._boundingRect = this.glPatch.rectDrawer.createRect();
            this._boundingRect.interactive = false;
            this._boundingRect.setPosition(-500, -500, 1);
            this._boundingRect.setSize(1000, 1000);
            this._boundingRect.setColor(CABLES.GLGUI.VISUALCONFIG.colors.opBoundsRect);
        }

        const bounds = this.glPatch.rectDrawer.bounds;
        this._boundingRect.visible = bounds.changed;
        this._boundingRect.setPosition(bounds.minX, bounds.minY, 0.999);
        this._boundingRect.setSize(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
    }

    animateZoom(z, dur)
    {
        dur = dur || 0.25;

        this._animZoom.clear();
        this._animZoom.setValue(this.glPatch.time, this._zoom);
        this._animZoom.setValue(this.glPatch.time + dur, z);
    }

    animateScrollTo(x, y, dur, userInteraction)
    {
        let p = this._eleTabs.getBoundingClientRect().left / this._viewResX * this._animZoom.getValue(this.glPatch.time + 10);
        if (userInteraction)p = 0;
        if (p != p)p = 0;

        dur = dur || 0.2;


        this._animScrollX.clear(this.glPatch.time);
        this._animScrollX.setValue(this.glPatch.time + dur, x - p);
        this._animScrollY.clear(this.glPatch.time);
        this._animScrollY.setValue(this.glPatch.time + dur, y);
    }

    scrollTo(x, y, userInteraction)
    {
        let p = this._eleTabs.getBoundingClientRect().left / this._viewResX * this._animZoom.getValue(this.glPatch.time + 10);
        if (userInteraction)p = 0;
        if (p != p)p = 0;


        this._animScrollX.clear();
        this._animScrollY.clear();

        this._animScrollX.setValue(this.glPatch.time, x - p);
        this._animScrollY.setValue(this.glPatch.time, y);

        // this._scrollX = x;
        // this._scrollY = y;

        gui.patchView.emitEvent("viewBoxChange");
    }

    center(noAnim)
    {
        let ops = gui.patchView.getSelectedOps();
        if (ops.length == 0) ops = gui.corePatch().ops;
        if (ops.length == 0)
        {
            this._zoom = 400;
            this.scrollTo(0, 0);
            // this._scrollX = 0;
            // this._scrollY = 0;
            return;
        }

        const bb = new CGL.BoundingBox();
        const subp = this.glPatch.getCurrentSubPatch();

        for (let i = 0; i < ops.length; i++)
        {
            if (ops[i].uiAttribs.subPatch != subp) continue;

            if (ops[i].uiAttribs.translate)
            {
                bb.applyPos(
                    ops[i].uiAttribs.translate.x,
                    ops[i].uiAttribs.translate.y,
                    0);

                bb.applyPos(
                    ops[i].uiAttribs.translate.x + this.glPatch.getGlOp(ops[i]).w,
                    ops[i].uiAttribs.translate.y + this.glPatch.getGlOp(ops[i]).h,
                    0);
            }
        }


        bb.calcCenterSize();
        const padding = 1.05;

        bb.size[0] = Math.max(bb.size[0], 250);
        bb.size[1] = Math.max(bb.size[1], 250);

        bb.size[0] *= padding;
        bb.size[1] *= padding;

        const zx = bb.size[0] / 2; // zoom on x
        const zy = (bb.size[1]) / 2 * (this._viewResX / this._viewResY);
        let z = Math.max(400, Math.max(zy, zx));
        if (z > 99999)z = 400;

        if (noAnim) this._zoom = z;
        else this.animateZoom(z);

        let cy = bb.center[1] * (this._viewResX / this._viewResY);

        if (cy != cy) cy = 0;

        this.animateScrollTo(bb.center[0], cy);
    }

    screenToPatchCoord(x, y, aspect)
    {
        if (this._scrollY != this._scrollY) this._scrollY = 0;
        const z = 1 / ((this._viewResX / 2) / this.zoom);
        let zy = z;
        if (aspect)zy = 1 / (this._viewResY / 2 / this.zoom);
        const asp = this._viewResY / this._viewResX;

        if (this._scrollX != this._scrollX) this._scrollX = 0;

        const mouseAbsX = (x - (this._viewResX / 2)) * z - (this.scrollX);
        const mouseAbsY = (y - (this._viewResY / 2)) * zy + (this.scrollY * asp);

        if (mouseAbsY != mouseAbsY) this.center(true);

        return [mouseAbsX, mouseAbsY];
    }

    serialize(dataui)
    {
        this._storeCurrentSubPatch();

        dataui.viewBoxesGl = this._subPatchViewBoxes;
    }

    deSerialize(dataui)
    {
        dataui = dataui || {};
        if (!dataui.viewBoxesGl)
        {
            this.center();
            this._storeCurrentSubPatch();
        }
        else this._subPatchViewBoxes = dataui.viewBoxesGl;
        this._restoreSubPatch(this._currentSubPatchId);
    }

    _storeCurrentSubPatch()
    {
        this._subPatchViewBoxes[this._currentSubPatchId] = { "x": this._scrollX, "y": this._scrollY, "z": this._zoom };
    }

    _restoreSubPatch(sub)
    {
        this._currentSubPatchId = sub;

        if (this._subPatchViewBoxes[sub])
        {
            this.scrollTo(this._subPatchViewBoxes[sub].x, this._subPatchViewBoxes[sub].y);
            this._zoom = this._subPatchViewBoxes[sub].z;
        }
        else
        {
            this._storeCurrentSubPatch();
            this.center(true);
        }
    }

    animSwitchSubPatch(dur, sub, timeGrey, timeVisibleAgain, next)
    {
        this._storeCurrentSubPatch();

        const zoomFactor = 0.03;
        // const _timeVisibleagain = this.glPatch.time + timeVisibleAgain + dur * 2;

        this._animZoom.clear();
        this._animZoom.defaultEasing = CABLES.EASING_LINEAR;
        this._animZoom.setValue(this.glPatch.time, this._zoom);
        this._animZoom.setValue(this.glPatch.time + timeGrey, this._zoom - (this._zoom * zoomFactor));

        // setTimeout(
        // () =>
        // {
        this._animZoom.defaultEasing = this._defaultEasing;
        this._restoreSubPatch(sub);

        this._animZoom.clear();
        this._animZoom.setValue(this.glPatch.time, this._zoom + (this._zoom * zoomFactor));
        this._animZoom.setValue(this.glPatch.time + timeVisibleAgain + dur * 5, this._zoom);

        if (next)next();
        // }, timeGrey * 1000 + 10);
    }

    zoomStep(s)
    {
        const z = this._zoom + 200 * s;
        this.animateZoom(z);
    }
};
