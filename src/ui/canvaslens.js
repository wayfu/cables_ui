CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.CanvasLens = class
{
    constructor(ele)
    {
        this._origCanvas = ele || document.getElementById("glcanvas");
        this._lensCanvas = document.createElement("canvas");
        this._lensCanvas.id = "canvaslens";
        this._lensCanvas.width = 100;
        this._lensCanvas.height = 100;
        this._lensCanvas.style["z-index"] = 999999999;
        this._lensCanvas.style.width = "100px";
        this._lensCanvas.style.height = "100px";
        this._lensCanvas.style.left = "-1111px";
        this._lensCanvas.style.top = "-1111px";
        this._lensCanvas.style.position = "absolute";
        this._lensCanvas.style["pointer-events"] = "none";
        this._lensCanvas.style.border = "2px solid white";
        this._lensCanvas.style.background = "black";

        this._scale = 5;
        this._size = 100;
        this._size2 = this._size / 2;
        this._origPixels = this._size / this._scale;
        this._origPixels2 = this._size / this._scale / 2;

        this._ctx = this._lensCanvas.getContext("2d");
        this._ctx.imageSmoothingEnabled = false;

        document.body.appendChild(this._lensCanvas);

        this._endFrameListener = this._onEndframe.bind(this);
        gui.corePatch().cgl.on("endFrame", this._endFrameListener);

        this._moveListener = this._onMouseMove.bind(this);
        this._origCanvas.addEventListener("mousemove", this._moveListener);

        this._moveLeaveListener = this._onMouseLeave.bind(this);
        this._origCanvas.addEventListener("mouseleave", this._moveLeaveListener);

        this._copyListener = this._onCopy.bind(this);
        document.addEventListener("copy", this._copyListener);
    }

    _onCopy(e)
    {
        e.clipboardData.setData("text/plain", this._hex);
        e.preventDefault();
    }

    _onMouseMove(e)
    {
        clearTimeout(this.leaveTimeout);
        const rect = e.target.getBoundingClientRect();
        this._x = e.clientX - rect.left; // x position within the element.
        this._y = e.clientY - rect.top; // y position within the element.

        this._lensCanvas.style.left = e.clientX - this._size2;
        this._lensCanvas.style.top = e.clientY + 15;
    }

    _onMouseLeave()
    {
        this.leaveTimeout = setTimeout(() =>
        {
            this.close();
        }, 500);
    }

    _onEndframe()
    {
        this._ctx.clearRect(0, 0, this._size, this._size);

        this._ctx.drawImage(this._origCanvas, this._x - this._origPixels2, this._y - this._origPixels2, this._origPixels, this._origPixels, 0, 0, this._size, this._size);

        this._ctx.strokeStyle = "white";
        this._ctx.beginPath();
        this._ctx.rect((this._origPixels2 - 1) * this._scale, (this._origPixels2 - 1) * this._scale, this._scale, this._scale);
        this._ctx.stroke();

        this._color = this._ctx.getImageData((this._origPixels2 - 1) * this._scale + 3, (this._origPixels2 - 1) * this._scale + 3, 1, 1).data;
        this._hex = this.rgbToHex(this._color[0], this._color[1], this._color[2]);

        this._ctx.font = "14px monospace";

        this._ctx.fillStyle = "#000000";
        this._ctx.fillText("#" + this._hex, 5, this._size - 10);
        this._ctx.fillStyle = "#FFFFFF";
        this._ctx.fillText("#" + this._hex, 5 + 1, this._size - 10 + 1);
    }

    close()
    {
        gui.corePatch().cgl.off("endFrame", this._endFrameListener);
        this._origCanvas.removeEventListener("mousemove", this._moveListener);
        this._origCanvas.removeEventListener("mouseleave", this._moveLeaveListener);
        this._lensCanvas.remove();
    }


    rgbToHex(R, G, B) { return toHex(R) + toHex(G) + toHex(B); }

    toHex(n)
    {
        n = parseInt(n, 10);
        if (isNaN(n)) return "00";
        n = Math.max(0, Math.min(n, 255));
        return "0123456789ABCDEF".charAt((n - (n % 16)) / 16) + "0123456789ABCDEF".charAt(n % 16);
    }
};
