var CABLES=CABLES || {};
CABLES.UI= CABLES.UI || {};

function getPortOpacity(port)
{
    if(!port)return;
    if(port.direction==PORT_DIR_IN && (port.isAnimated() || port.isLinked() ))return 1.0;
    return 0.6;
}

function getPortDescription(thePort)
{
    var str='<b>'+thePort.getName()+'</b>';
    str+=' ['+thePort.getTypeString()+']';
    if(thePort.isLinked() )str+=' press right mouse button to unlink port';
    return str;
}


function Line(startX, startY)
{
    var start={ x:startX,y:startY};

    this.updateEnd=function(x, y)
    {
        end.x = x;
        end.y = y;
        this.redraw();
    };

    var end = { x: startX, y: startY };
    this.getPath = function()
    {
        var startX=start.x;
        var startY=start.y;
        var endX=end.x;
        var endY=end.y;

        return "M "+startX+" "+startY+" L" + endX + " " + endY;
    };
    this.thisLine = gui.patch().getPaper().path(this.getPath());
    this.thisLine.attr({ stroke: CABLES.UI.uiConfig.colorLink, "stroke-width": 2});
    this.redraw = function() { this.thisLine.attr("path", this.getPath()); };
}

function UiLink(port1, port2)
{
    var self=this;
    var middlePosX=30;
    var middlePosY=30;
    var addCircle=null;
    this.linkLine=null;
    this.p1=port1;
    this.p2=port2;

    this.hideAddButton=function()
    {
        if(addCircle)addCircle.remove();
        addCircle=null;

        if(this.linkLine)
            this.linkLine.attr(
            {
                "stroke-opacity": 1,
                "stroke-width": 1
            });
    };

    this.showAddButton=function()
    {
        if(!this.isVisible())return;

        this.linkLine.attr(
        {
            "stroke-opacity": 1.0,
            "stroke-width": 2
        });

        if(addCircle===null)
        {
            addCircle = gui.patch().getPaper().circle(middlePosX,middlePosY, CABLES.UI.uiConfig.portSize*0.5).attr(
            {
                "stroke": CABLES.UI.uiConfig.getPortColor(self.p1.thePort ),
                "stroke-width": 2,
                "fill": CABLES.UI.uiConfig.colorBackground,
            });

            addCircle.hover(function (e)
            {
                var txt='left click: insert op / right click: delete link';
                CABLES.UI.showToolTip(e,txt);
                CABLES.UI.setStatusText(txt);
            },function()
            {
                CABLES.UI.hideToolTip();
            });
            addCircle.toFront();

            addCircle.node.onmousedown = function (event)
            {
                $('#library').hide();
                $('#patch').focus();

                if(self.p1!==null)
                {
                    if(event.which==3)
                    {
                        self.p1.thePort.removeLinkTo( self.p2.thePort );
                    }
                    else
                    {
                        event=mouseEvent(event);
                        CABLES.UI.OPSELECT.showOpSelect(gui.patch().getCanvasCoordsMouse(event),null,null,self);
                    }
                }
            };
        }
        else
        {
            addCircle.attr({
                cx:middlePosX,
                cy:middlePosY
            });
            addCircle.toFront();

        }
    };

    this.getPath = function()
    {
        if(!port2.rect)return '';
        if(!port1.rect)return '';

        if(!port2.rect.attrs)return '';
        if(!port1.rect.attrs)return '';

        var fromX=port1.rect.matrix.e+port1.rect.attrs.x+CABLES.UI.uiConfig.portSize/2;
        var fromY=port1.rect.matrix.f+port1.rect.attrs.y;
        var toX=port2.rect.matrix.e+port2.rect.attrs.x+CABLES.UI.uiConfig.portSize/2;
        var toY=port2.rect.matrix.f+port2.rect.attrs.y;

        middlePosX=0.5*(fromX+toX);
        middlePosY=0.5*(fromY+toY);

        var cp1X=0;
        var cp1Y=0;

        var cp2X=0;
        var cp2Y=0;

        cp1Y=Math.min(fromY,toY)+(Math.max(fromY,toY)-Math.min(fromY,toY))/2;
        cp2Y=Math.min(fromY,toY)+(Math.max(fromY,toY)-Math.min(fromY,toY))/2;

        if(toY > fromY)fromY+=CABLES.UI.uiConfig.portHeight;
        if(fromY > toY) toY+=CABLES.UI.uiConfig.portHeight;

        cp1X=Math.min(fromX,toX)+(Math.max(fromX,toX)-Math.min(fromX,toX))/4;
        cp2X=Math.min(fromX,toX)+(Math.max(fromX,toX)-Math.min(fromX,toX))/4;


        var difx=Math.min(fromX,toX)+Math.abs(toX-fromX);

        cp1X=fromX-0;
        cp2X=toX+0;

        return "M "+fromX+" "+fromY+" C " + (cp1X) + " " + (cp1Y) +" "+ (cp2X) + " " + (cp2Y) +" "+ toX + " " + toY;
    };


    this.isVisible=function()
    {
        return self.linkLine!==null;
    };

    self.hide=function()
    {
        if(!this.isVisible())return;
        this.linkLine.remove();
        this.linkLine=null;
    };

    self.show=function()
    {
        if(this.isVisible())return;
        this.redraw();
    };

    this.remove=function()
    {
        self.hide();
    };

    this.redraw = function()
    {
        if(!this.linkLine)
        {
            this.linkLine = gui.patch().getPaper().path(this.getPath());
            this.linkLine.attr( CABLES.UI.uiConfig.linkingLine );
            this.linkLine.attr({ "stroke": CABLES.UI.uiConfig.getPortColor(port1.thePort) });

            // this.linkLine.hover(function ()
            // {
            //     this.attr({stroke:CABLES.UI.uiConfig.colorLinkHover});
            // }, function ()
            // {
            //     this.attr({stroke:CABLES.UI.uiConfig.getPortColor(self.p1.thePort)});
            // });
        }

        this.linkLine.attr("path", this.getPath());
        this.linkLine.toFront();
        this.showAddButton();
    };

    this.setEnabled=function(enabled)
    {
        if(enabled) this.linkLine.attr("opacity", 1.0);
            else this.linkLine.attr("opacity", 0.3);
    };
}








Raphael.el.setGroup = function (group) { this.group = group; };
Raphael.el.getGroup = function () { return this.group; };

var OpRect = function (_opui,_x, _y, _w, _h, _text,objName)
{
    var isSelected=true;
    var group = Raphael.fn.set();
    var background = null;
    var label=null;
    var w=_w;
    var h=_h;
    var x=_x;
    var y=_y;
    var opui=_opui;
    var title=_text;
    var backgroundResize=null;
    var backgroundComment=null;

    this.getRect=function()
    {
        return background;
    };

    this.isVisible=function()
    {
        return label!==null;
    };

    this.removeUi=function()
    {
        if(!this.isVisible())return;

        group.clear();
        background.remove();
        label.remove();
        label=null;
        background=null;
        backgroundResize=null;
    };

    this.getWidth=function()
    {
        return w;
    };

    this.setWidth=function(_w)
    {
        w=_w;
        if(this.isVisible()) background.attr({width:w});
    };

    function hover()
    {
        opui.isMouseOver=true;
    }

    function unhover()
    {
        opui.isMouseOver=false;
    }

    var dragger = function(x,y,ev)
    {
        $('#patch').focus();
        if(opui.isSelected())return;

        opui.showAddButtons();
        if(!ev.shiftKey) gui.patch().setSelectedOp(null);
        gui.patch().setSelectedOp(opui);
    };

    var move = function (dx, dy,a,b,e)
    {
        gui.patch().moveSelectedOps(dx,dy,a,b,e);
    };

    var up = function ()
    {
        gui.patch().moveSelectedOpsFinished();
        gui.patch().showOpParams(opui.op);
    };

    this.addUi=function()
    {
        if(this.isVisible())return;

        background=gui.patch().getPaper().rect(0, 0, w, h).attr(
        {
            "fill": CABLES.UI.uiConfig.colorOpBg,
            "stroke": CABLES.UI.uiConfig.colorPatchStroke,
            "stroke-width":0,
            "cursor": "move"
        });
        label = gui.patch().getPaper().text(0+w/2,0+h/2+0, title);

        $(label.node).css({'pointer-events': 'none'});

        background.drag(move, dragger, up);
        background.hover(hover,unhover);

        background.node.ondblclick = function (ev)
        {
            gui.patch().setSelectedOp(null);
            if(opui.op.objName=='Ops.Ui.Patch')
                gui.patch().setCurrentSubPatch(opui.op.patchId.val);
        };

        background.onmouseup = function (ev)
        {
            opui.isDragging=false;
        };

        if(objName=='Ops.Ui.Patch')
        {
            background.attr({
                'stroke-width':4,
                'stroke': CABLES.UI.uiConfig.colorPatchStroke
            });
        }

        if(objName=='Ops.Ui.Comment')
        {
            var sw=150;
            var sh=100;
            var resizeSize=20;

            if(opui.op.uiAttribs.size)
            {
                sw=opui.op.uiAttribs.size[0];
                sh=opui.op.uiAttribs.size[1];
            }

            label.attr({
                'x':sw/2,
                'y':45,
                'font-size':32,
                'fill':'#fff'
            });

            background.attr({
                'width':sw,
                'height':resizeSize,
                'opacity':0.2,
                "fill": '#000',
            });

            backgroundComment=gui.patch().getPaper().rect(0, 0, resizeSize, resizeSize).attr(
            {
                "x":0,
                "y":0,
                'width':sw,
                'height':sh,
                "fill": '#000',
                "stroke": CABLES.UI.uiConfig.colorPatchStroke,
                "stroke-width":0,
                'opacity':0.3,
            });


            backgroundResize=gui.patch().getPaper().rect(0, 0, resizeSize, resizeSize).attr(
            {
                "x":sw-resizeSize,
                "y":sh-resizeSize,
                "fill": '#000',
                "stroke": CABLES.UI.uiConfig.colorPatchStroke,
                "stroke-width":0,
                'opacity':0.2,
                "cursor": "se-resize"
            });

            var oldPosX,oldPosY;
            var resizeStart = function (dx, dy,a,b,e)
            {
                oldPosX=backgroundResize.attrs.x;
                oldPosY=backgroundResize.attrs.y;
                opui.isDragging=true;
            };

            var resizeEnd = function (dx, dy,a,b,e)
            {
                oldPosX=-1;
                oldPosY=-1;
                opui.isDragging=false;
            };

            var resizeMove = function (dx, dy,a,b,e)
            {
                if(oldPosX<0)return;

                var width=backgroundResize.attrs.x-background.attrs.x;
                var height=backgroundResize.attrs.y-background.attrs.y;

                if(width<50)width=50;
                if(height<50)height=50;

                label.attr({
                    x:backgroundComment.attrs.x+width/2
                });

                background.attr({
                    width:width+resizeSize
                });

                backgroundResize.attr({
                    x:oldPosX+dx,
                    y:oldPosY+dy
                });

                backgroundComment.attr({
                    x:background.attrs.x,
                    y:background.attrs.y,
                    width:width+resizeSize,
                    height:height+resizeSize
                });

                _opui.op.uiAttribs.size=[width,height];

                backgroundComment.toBack();
                gui.patch().background.toBack();
                background.toFront();
                backgroundResize.toFront();
            };

            backgroundResize.drag(resizeMove, resizeStart,resizeEnd);

            group.push(backgroundResize,backgroundComment);
            backgroundComment.toBack();
            gui.patch().background.toBack();
            backgroundResize.toFront();
            background.toFront();
        }

        group.push(background,label);
    };

    this.setEnabled=function(enabled)
    {
        if(this.isVisible())
            if(enabled) background.attr( { "fill-opacity": 1 });
                else background.attr( { "fill-opacity": 0.5 });
    };

    this.setSelected=function(sel)
    {
        isSelected=sel;

        if(this.isVisible() && !backgroundComment)
            if(sel) background.attr( { "fill": CABLES.UI.uiConfig.colorOpBgSelected });
                else background.attr( { "fill": CABLES.UI.uiConfig.colorOpBg });
    };

    this.setTitle=function(t)
    {
        title=t;
        if(label) label.attr({text:title});
    };

    this.getGroup=function()
    {
        return group;
    };

    // group.push(background);
    group.transform('t'+x+','+y);
};

var OpUi=function(paper,op,x,y,w,h,txt)
{
    var self=this;
    this.links=[];
    this.portsIn=[];
    this.portsOut=[];
    var hidden=false;
    this.op=op;
    var selected=false;
    var width=w;

    var oldUiAttribs='';
    var startMoveX=-1;
    var startMoveY=-1;
    var olsPosX=0;
    var olsPosY=0;
    var posx=0;
    var posy=0;
    this.isMouseOver=false;

    this.remove=function()
    {
        this.oprect.getGroup().remove();
        this.oprect.removeUi();
    };

    this.getSubPatch=function()
    {
        if(!op.uiAttribs.subPatch)return 0;
        else return op.uiAttribs.subPatch;
    };

    this.isSelected=function()
    {
        return selected;
    };
    this.hide=function()
    {
        hidden=true;
        this.oprect.removeUi();
        this.oprect.getGroup().hide();

        var j=0;
        for(j in self.portsIn) self.portsIn[j].removeUi();
        for(j in self.portsOut) self.portsOut[j].removeUi();

        for(j in self.links)
        {
            self.links[j].hide();
            self.links[j].hideAddButton();
        }
    };

    this.show=function()
    {
        hidden=false;
        this.oprect.addUi();
        this.oprect.getGroup().show();


        var j=0;
        if(op.objName!='Ops.Ui.Comment')
        {
            for(j in self.portsIn) self.portsIn[j].addUi(this.oprect.getGroup());
            for(j in self.portsOut) self.portsOut[j].addUi(this.oprect.getGroup());
        }

        // this.oprect.getGroup().transform('t'+posx+','+posy);

        for(j in self.links) self.links[j].show();

        self.setPos();
    };

    this.isHidden=function()
    {
        return hidden;
    };

    this.removeDeadLinks=function()
    {
        var found=true;

        while(found)
        {
            found=false;
            for(var j in self.links)
            {
                if(self.links[j].p1===null)
                {
                    self.links.splice(j,1);
                    found=true;
                }
            }
        }
    };

    this.showAddButtons=function()
    {
        if(this.isHidden())return;
        self.removeDeadLinks();
        for(var j in self.links) self.links[j].showAddButton();
    };

    this.hideAddButtons=function()
    {
        self.removeDeadLinks();
        for(var j in self.links) self.links[j].hideAddButton();
    };

    this.doMoveFinished=function()
    {
        CABLES.undo.add({
            undo: function()
            {
                try
                {
                    var u=JSON.parse(oldUiAttribs);
                    self.setPos(u.translate.x,u.translate.y);
                }catch(e){}
            },
            redo: function()
            {
            }
        });

        startMoveX=-1;
        startMoveY=-1;
        self.isDragging=false;
    };

    this.setPos=function(x,y)
    {
        if(isNumber(x))
        {
            posx=x;
            posy=y;
        }

        if(self.oprect.getGroup())
        {
            self.oprect.getGroup().transform('t'+posx+','+posy);
        }
        self.op.uiAttribs.translate={x:posx,y:posy};

        for(var j in self.links)
            self.links[j].redraw();
    };

    this.doMove = function (dx, dy,a,b,e)
    {
        if(e.which==3)return;
        if(e.which==2)return;

        e=mouseEvent(e);

        var pos=gui.patch().getCanvasCoordsMouse(e);

        if(!self.op.uiAttribs)
        {
            self.op.uiAttribs={};
            self.op.uiAttribs.translate={x:pos.x,y:pos.y};
        }

        if(startMoveX==-1 && self.op.uiAttribs.translate)
        {
            oldUiAttribs=JSON.stringify(self.op.uiAttribs);
            startMoveX=pos.x-self.op.uiAttribs.translate.x;
            startMoveY=pos.y-self.op.uiAttribs.translate.y;
        }

        pos.x=pos.x-startMoveX;
        pos.y=pos.y-startMoveY;
        var snapRange=10;
        var snap=(pos.x%65)-snapRange;
        if(snap>0 && snap<snapRange) pos.x-=snap;
        if(snap<0 && snap>-snapRange) pos.x-=snap;

        snap=(pos.y%50)-snapRange;
        if(snap>0 && snap<snapRange) pos.y-=snap;
        if(snap<0 && snap>-snapRange) pos.y-=snap;

        // if(e.shiftKey===true)
        // {
        //     pos.x=parseInt(pos.x/25,10)*25;
        //     pos.y=parseInt(pos.y/25,10)*25;
        // }

        self.setPos(pos.x,pos.y);
        self.isDragging=true;
    };

    this.oprect=new OpRect(this,x,y,w,h, txt,self.op.objName);

    this.setEnabled=function(en)
    {
        this.op.enabled=en;
        this.oprect.setEnabled(en);

        for(var i=0;i<this.links.length;i++)
        {
            this.links[i].setEnabled(en);
        }

    };

    this.setSelected=function(sel)
    {
        selected=sel;
        if(sel) self.showAddButtons();
            else self.hideAddButtons();
        self.isDragging=false;
        this.oprect.setSelected(sel);
    };


    this.addPort=function(_inout,thePort)
    {
        var inout=_inout;

        var portIndex=this.portsIn.length;
        if(inout==PORT_DIR_OUT) portIndex=this.portsOut.length;


        var w=(CABLES.UI.uiConfig.portSize+CABLES.UI.uiConfig.portPadding)*portIndex;
        if(self.oprect.getWidth()<w+CABLES.UI.uiConfig.portSize) self.oprect.setWidth(w+CABLES.UI.uiConfig.portSize);

        var port=new CABLES.UI.Port(thePort);

        port.direction=inout;
        port.op=self.op;
        port.opUi=self;
        port.portIndex=portIndex;


        if(this.oprect.getRect()) port.addUi(this.oprect.getGroup());




        if(inout==PORT_DIR_OUT) this.portsOut.push(port);
            else this.portsIn.push(port);

    };
};
