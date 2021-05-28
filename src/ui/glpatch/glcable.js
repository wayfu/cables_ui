CABLES = CABLES || {};
CABLES.GLGUI = CABLES.GLGUI || {};

CABLES.GLGUI.GlCable = class
{
    constructor(glPatch, splineDrawer, buttonRect, type, link)
    {
        this._buttonSize = 12;

        this._glPatch = glPatch;
        this._buttonRect = buttonRect;
        this._type = type;
        this._disposed = false;
        this._visible = true;
        if (link) this._visible = link.visible;

        this._link = link;

        this._splineDrawer = splineDrawer;
        this._splineIdx = this._splineDrawer.getSplineIndex();

        this._buttonRect.setDecoration(1);
        this._buttonRect.visible = false;

        this._x = 0;
        this._y = 0;
        this._x2 = 0;
        this._y2 = 0;

        this._oldx = 0;
        this._oldy = 0;
        this._oldx2 = 0;
        this._oldy2 = 0;

        this._distFromPort = 0;
        this._updateDistFromPort();

        this._listenerMousemove = this._glPatch.on("mousemove", this._checkCollide.bind(this));
    }

    set visible(v)
    {
        if (this._visible != v) this._oldx = null;
        this._visible = v;
        this._updateLinePos();
    }

    _checkCollide(e)
    {
        if (!this._visible) return false;

        if (this._glPatch.getNumSelectedOps() > 1) return false;
        // const selOps = gui.patchView.getSelectedOps();

        // if (selOps.length > 1) return false;


        // if (selOps[0] && r)
        // console.log(selOps[0].portsIn[0].type, selOps[0].portsOut[0].type, this._type);

        // console.log(this._glPatch.getOnlySelectedOp());

        if (this._glPatch.getOnlySelectedOp() &&
            this._glPatch.getOnlySelectedOp().portsIn.length > 0 &&
            this._glPatch.getOnlySelectedOp().portsOut.length > 0)
        {
            // if (r)console.log(this._glPatch.getOnlySelectedOp().portsIn[0].type == this._type && this._glPatch.getOnlySelectedOp().portsOut[0].type == this._type, this._glPatch.getOnlySelectedOp().portsIn[0].type, this._glPatch.getOnlySelectedOp().portsOut[0].type, this._type);
            if (!(
                this._glPatch.getOnlySelectedOp().portsIn[0].type == this._type &&
                this._glPatch.getOnlySelectedOp().portsOut[0].type == this._type))
                return false;
        }

        const r = this.collideMouse(this._x, this._y - this._distFromPort, this._x2, this._y2 + this._distFromPort, this._glPatch.viewBox.mousePatchX, this._glPatch.viewBox.mousePatchY, 10);
    }

    dispose()
    {
        this._disposed = true;
        this.setColor(0, 0, 0, 0);
        this._splineDrawer.deleteSpline(this._splineIdx);
        this._glPatch.removeEventListener(this._listenerMousemove);
        // this._glPatch._hoverCable.visible = false;
    }

    _updateDistFromPort()
    {
        if (Math.abs(this._y - this._y2) < CABLES.GLGUI.VISUALCONFIG.portHeight * 2) this._distFromPort = CABLES.GLGUI.VISUALCONFIG.portHeight * 0.5;
        else this._distFromPort = CABLES.GLGUI.VISUALCONFIG.portHeight * 2.9; // magic number...?!
    }

    _subdivivde(inPoints)
    {
        const arr = [];
        const subd = 4;
        let newLen = (inPoints.length - 4) * (subd - 1);

        if (newLen != arr.length) arr.length = Math.floor(Math.abs(newLen));
        let count = 0;

        function ip(x0, x1, x2, t)// Bezier
        {
            const r = (x0 * (1 - t) * (1 - t) + 2 * x1 * (1 - t) * t + x2 * t * t);
            return r;
        }

        for (let i = 3; i < inPoints.length - 3; i += 3)
        {
            for (let j = 0; j < subd; j++)
            {
                for (let k = 0; k < 3; k++)
                {
                    const p = ip(
                        (inPoints[i + k - 3] + inPoints[i + k]) / 2,
                        inPoints[i + k + 0],
                        (inPoints[i + k + 3] + inPoints[i + k + 0]) / 2,
                        j / subd
                    );
                    arr[count] = p;
                    count++;
                }
            }
        }

        return arr;
    }

    _updateLinePos()
    {
        this._updateDistFromPort();


        // "hanging" cables
        // this._splineDrawer.setSpline(this._splineIdx,
        //     this._subdivivde(
        //         [
        //             this._x, this._y, 0,
        //             this._x, this._y, 0,
        //             this._x, this._y - this._distFromPort * 2.0, 0,
        //             this._x2, this._y2 + Math.abs((this._y2 - this._y)) * 1.7, 0,
        //             this._x2, this._y2, 0,
        //             this._x2, this._y2, 0,
        //         ]));


        if (this._oldx != this._x || this._oldy != this._y || this._oldx2 != this._x2 || this._oldy2 != this._y2)
        {
            this._oldx = this._x;
            this._oldy = this._y;
            this._oldx2 = this._x2;
            this._oldy2 = this._y2;

            if (!CABLES.UI.userSettings.get("straightLines"))
            {
                if (this._x == this._x2 || Math.abs(this._x - this._x2) < 50)
                {
                    // this._splineDrawer.setSpline(this._splineIdx,
                    //     [
                    //         this._x, this._y, 0,
                    //         this._x, this._y, 0,
                    //         this._x2, this._y2, 0,
                    //         this._x2, this._y2, 0
                    //     ]);

                    this._splineDrawer.setSpline(this._splineIdx,
                        this._subdivivde(
                            [
                                this._x, this._y, 0,
                                this._x, this._y, 0,
                                this._x, this._y, 0,

                                this._x2, this._y2, 0,
                                this._x2, this._y2, 0,
                                this._x2, this._y2, 0,
                                this._x2, this._y2, 0
                            ]));
                }
                else
                {
                    const distY = Math.abs(this._y - this._y2);
                    this._splineDrawer.setSpline(
                        this._splineIdx,
                        this._subdivivde(
                            [
                                this._x, this._y, 0,
                                this._x, this._y, 0,
                                this._x, this._y - (distY * 0.002) - 17, 0,

                                (this._x + this._x2) * 0.5, (this._y + this._y2) * 0.5, 0, // * 0.5 - (0.001 * distY), 0,

                                this._x2, this._y2 + (distY * 0.002) + 17, 0,
                                this._x2, this._y2, 0,
                                this._x2, this._y2, 0,
                            ]));
                }
            }
            else
            {
                // straight lines...
                this._splineDrawer.setSpline(this._splineIdx,
                    [
                        this._x, this._y, 0,
                        this._x, this._y - this._distFromPort, 0,
                        this._x2, this._y2 + this._distFromPort, 0,
                        this._x2, this._y2, 0
                    ]);
            }
        }
        if (this._visible)
        {
            // this._lineDrawer.setLine(this._lineIdx0, this._x, this._y, this._x, this._y - this._distFromPort);
            // this._lineDrawer.setLine(this._lineIdx1, this._x, this._y - this._distFromPort, this._x2, this._y2 + this._distFromPort);
            // this._lineDrawer.setLine(this._lineIdx2, this._x2, this._y2 + this._distFromPort, this._x2, this._y2);
        }
        else
        {
            this._splineDrawer.hideSpline(this._splineIdx);

            // this._splineDrawer.setSpline(this._splineIdx,
            //     [
            //         0, 0, 0,
            //         0, 0, 0,
            //         0, 0, 0,
            //         0, 0, 0
            //     ]);


            // this._lineDrawer.setLine(this._lineIdx0, 0, 0, 0, 0);
            // this._lineDrawer.setLine(this._lineIdx1, 0, 0, 0, 0);
            // this._lineDrawer.setLine(this._lineIdx2, 0, 0, 0, 0);
        }
    }

    setPosition(x, y, x2, y2)
    {
        this._x = x;
        this._y = y;
        this._x2 = x2;
        this._y2 = y2;

        this._updateLinePos();

        // circle button
        this._buttonRect.setDecoration(1);
        this._buttonRect.setSize(this._buttonSize, this._buttonSize);
        this._buttonRect.setPosition(
            x + ((x2 - x) / 2) - this._buttonSize / 2,
            (y + this._buttonSize) + (((y2 - this._buttonSize) - (y + this._buttonSize)) / 2) - this._buttonSize / 2,
            CABLES.GLGUI.VISUALCONFIG.zPosCableButtonRect
        );
    }


    setColor(r, g, b, a)
    {
        if (r === undefined)
        {
            r = this._r * 1.1;
            g = this._g * 1.1;
            b = this._b * 1.1;
            a = this._a;
        }
        else
        {
            this._r = r;
            this._g = g;
            this._b = b;
            this._a = a;
        }

        this._splineDrawer.setSplineColor(this._splineIdx, [r, g, b, a]);
        this._buttonRect.setColor(r, g, b, a);
    }

    isHoveredButtonRect()
    {
        return this.collideMouse(this._x, this._y - this._distFromPort, this._x2, this._y2 + this._distFromPort, this._glPatch.viewBox.mousePatchX, this._glPatch.viewBox.mousePatchY, 10);
    }

    setSpeed(speed)
    {
        this._splineDrawer.setSplineSpeed(this._splineIdx, speed);
    }

    collideMouse(x1, y1, x2, y2, cx, cy, r)
    {
        // if (gui.patchView.getSelectedOps().length > 1) return false;

        // canlink ???

        if (this._disposed)
        {
            console.log("disposed already!!!?!");
        }

        const perf = CABLES.uiperf.start("glcable collideMouse");

        // is either end INSIDE the circle?
        // if so, return true immediately
        const inside1 = this._collidePointCircle(x1, y1, cx, cy, r);
        const inside2 = this._collidePointCircle(x2, y2, cx, cy, r);
        if (inside1 || inside2)
        {
            perf.finish();
            return true;
        }

        // get length of the line
        let distX = x1 - x2;
        let distY = y1 - y2;
        const len = Math.sqrt((distX * distX) + (distY * distY));

        // get dot product of the line and circle
        const dot = (((cx - x1) * (x2 - x1)) + ((cy - y1) * (y2 - y1))) / Math.pow(len, 2);

        // find the closest point on the line
        const closestX = x1 + (dot * (x2 - x1));
        const closestY = y1 + (dot * (y2 - y1));

        // is this point actually on the line segment?
        // if so keep going, but if not, return false
        const onSegment = this._collideLinePoint(x1, y1, x2, y2, closestX, closestY);
        if (!onSegment)
        {
            perf.finish();
            return false;
        }

        // get distance to closest point
        distX = closestX - cx;
        distY = closestY - cy;
        const distance = Math.sqrt((distX * distX) + (distY * distY));


        if (distance <= r)// && !this._glPatch.isMouseOverOp()
        {
            // this._glPatch._hoverCable.visible = true;
            // this._glPatch._hoverCable.setPosition(this._x, this._y, this._x2, this._y2);
            // this._glPatch._hoverCable.setColor(this._r * 1.1, this._g * 1.1, this._b * 1.1, 0.15);
            this.setColor();
            // this._glPatch._hoverCable.visible = true;

            this._buttonRect.setPosition(closestX - this._buttonSize / 2, closestY - this._buttonSize / 2, CABLES.GLGUI.VISUALCONFIG.zPosCableButtonRect);
            this._buttonRect.visible = true;
            this._buttonRect.interactive = true;
            this._buttonRect._hovering = true;

            this._glPatch.hoverLink = this._link;
            this._glPatch._dropInCircleRect = this._buttonRect;

            if (this._glPatch.cablesHoverText)
                this._glPatch.cablesHoverText.setPosition(closestX + 10, closestY - 10);

            perf.finish();
            return true;
        }
        else
        {
            this._buttonRect.interactive = false;
            this._buttonRect.visible = false;
            this._buttonRect._hovering = false;
            perf.finish();
            return false;
        }
    }

    setText(t)
    {
        if (this._buttonRect._hovering && this._glPatch.cablesHoverText)
        {
            this._glPatch.cablesHoverText.text = t || "";
        }
    }

    _dist(x, y, x2, y2)
    {
        const distX = x - x2;
        const distY = y - y2;
        return Math.sqrt((distX * distX) + (distY * distY));
    }

    // POINT/CIRCLE
    _collidePointCircle(px, py, cx, cy, r)
    {
        // get distance between the point and circle's center
        // using the Pythagorean Theorem
        // const distX = px - cx;
        // const distY = py - cy;
        // const distance = Math.sqrt((distX * distX) + (distY * distY));
        const distance = this._dist(px, py, cx, cy);

        // if the distance is less than the circle's
        // radius the point is inside!
        if (distance <= r)
        {
            return true;
        }
        return false;
    }


    // LINE/POINT
    _collideLinePoint(x1, y1, x2, y2, px, py)
    {
        // get distance from the point to the two ends of the line
        const d1 = this._dist(px, py, x1, y1);
        const d2 = this._dist(px, py, x2, y2);

        // get the length of the line
        const lineLen = this._dist(x1, y1, x2, y2);

        // since  are so minutely accurate, add
        // a little buffer zone that will give collision
        const buffer = 0.1; // higher # = less accurate

        // if the two distances are equal to the line's
        // length, the point is on the line!
        // note we use the buffer here to give a range,
        // rather than one #
        if (d1 + d2 >= lineLen - buffer && d1 + d2 <= lineLen + buffer)
        {
            return true;
        }
        return false;
    }
};
