CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.TexturePreviewer=function()
{
    this._texturePorts=[];
    this._showing=false;
    this._lastTimeActivity=0;
    this._mode=1;
    this._paused=false;
    this._shader=null;
    this._shaderTexUniform=null;
    this._tempTexturePort=null;
    this._hoveringTexPort=false;

    var ele=document.getElementById('bgpreview');

    ele.addEventListener("click",function()
    {
        gui.patch().focusOp(this._lastClicked.opid,true);
    }.bind(this));

};

CABLES.UI.TexturePreviewer.MODE_CLICKED=0;
CABLES.UI.TexturePreviewer.MODE_ACTIVE=1;

CABLES.UI.TexturePreviewer.FRAGSHADER=''.endl()
    .endl()+'IN vec2 texCoord;'
    .endl()+'UNI sampler2D tex;'
    .endl()+'UNI float width;'
    .endl()+'UNI float height;'

    .endl()+'float checkerboard()'
    .endl()+'{'
    .endl()+'    float num=40.0;'
    .endl()+'    float h=(height/width)*num;'
    .endl()+'    float total = floor(texCoord.x*num) +floor(texCoord.y*h);'
    .endl()+'    return mod(total,2.0)*0.1+0.05;'
    .endl()+'}'

    .endl()+'void main()'
    .endl()+'{'
    .endl()+'    vec4 col=vec4(vec3(checkerboard()),1.0);'
    .endl()+'    vec4 colTex=texture2D(tex,vec2(texCoord.x,(1.0-texCoord.y)));'
    .endl()+'    outColor = mix(col,colTex,colTex.a);'
    .endl()+'}';

CABLES.UI.TexturePreviewer.VERTSHADER=''.endl()
    .endl()+'IN vec3 vPosition;'
    .endl()+'IN vec2 attrTexCoord;'
    .endl()+'OUT vec2 texCoord;'
    .endl()+'UNI mat4 projMatrix;'
    .endl()+'UNI mat4 modelMatrix;'
    .endl()+'UNI mat4 viewMatrix;'

    .endl()+'void main()'
    .endl()+'{'
    .endl()+'    texCoord=attrTexCoord;'
    .endl()+'    vec4 pos = vec4( vPosition, 1. );'
    .endl()+'    mat4 mvMatrix=viewMatrix * modelMatrix;'
    .endl()+'    gl_Position = projMatrix * mvMatrix * pos;'
    .endl()+'}';

CABLES.UI.TexturePreviewer.prototype._renderTexture=function(tp,ele)
{
    var port=tp.port;
    const id=tp.id;
    const texSlot=5;

    var meta=true;
    if(ele)meta=false;

    var previewCanvasEle=ele||document.getElementById('preview_img_'+id);

    // var previewCanvasEle=document.getElementById('bgpreview');
    if(!previewCanvasEle)
    {
        // console.log("no previewCanvasEle");
        return;
    }
    var previewCanvas=previewCanvasEle.getContext("2d");

    if(previewCanvas && port && port.get())
    {
        const cgl=port.parent.patch.cgl;

        if(!this._mesh)
        {
            var geom=new CGL.Geometry("preview op rect");
            geom.vertices = [1.0,  1.0,  0.0,-1.0,  1.0,  0.0,1.0, -1.0,  0.0,-1.0, -1.0,  0.0];
            geom.texCoords = [1.0, 0.0,0.0, 0.0,1.0, 1.0,0.0, 1.0 ];
            geom.verticesIndices = [ 0, 1, 2, 3, 1, 2 ];
            this._mesh=new CGL.Mesh(cgl,geom);
        }
        if(!this._shader)
        {
            this._shader=new CGL.Shader(cgl,'MinimalMaterial');
            this._shader.setModules(['MODULE_VERTEX_POSITION','MODULE_COLOR','MODULE_BEGIN_FRAG']);
            this._shader.setSource(CABLES.UI.TexturePreviewer.VERTSHADER,CABLES.UI.TexturePreviewer.FRAGSHADER);
            this._shader.add
            this._shaderTexUniform=new CGL.Uniform(this._shader,'t','tex',texSlot);
            this._shaderTexUniformW=new CGL.Uniform(this._shader,'f','width',port.get().width);
            this._shaderTexUniformH=new CGL.Uniform(this._shader,'f','height',port.get().height);
        }

        cgl.pushPMatrix();
        mat4.ortho(cgl.pMatrix,-1,1,1,-1,0.001,11);
        var oldTex=cgl.getTexture(texSlot);
        cgl.setTexture(texSlot,port.get().tex);
        this._mesh.render(this._shader);
        cgl.setTexture(texSlot,oldTex);
        
        cgl.popPMatrix();
        cgl.resetViewPort();

        // const containerEle=document.getElementById("preview_img_container"+id);
        // const w=Math.min(containerEle.offsetWidth,port.get().width||256);
        // const h=w*(port.get().height/port.get().width);

        var s=this._getCanvasSize(port,port.get(),meta);

        previewCanvasEle.width=s[0];
        previewCanvasEle.height=s[1];


        previewCanvas.clearRect(0, 0,previewCanvasEle.width, previewCanvasEle.height);
        previewCanvas.drawImage(cgl.canvas, 0, 0,previewCanvasEle.width, previewCanvasEle.height);

        cgl.gl.clearColor(0,0,0,0);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
    }
    else
    {
        console.log("NOPE ");
    }
};


CABLES.UI.TexturePreviewer.prototype._getCanvasSize=function(port,tex,meta)
{
    var maxWidth=300;
    var maxHeight=200;

    if(!meta)
    {
        maxWidth=Math.min($('#patch').width(), port.parent.patch.cgl.canvas.width);
        maxHeight=Math.min($('#patch').height(), port.parent.patch.cgl.canvas.height);
    }
    else
    {
        document.getElementById("meta_preview_textures").offsetWidth-30;
    }

    var aspect=tex.height/tex.width;
    var w=tex.width;
    
    if(w>maxWidth)w=maxWidth;
    var h=w*aspect;

    if(h>maxHeight)
    {
        w=maxHeight/aspect;
        h=maxHeight;
    }

    return [w,h];
}

CABLES.UI.TexturePreviewer.prototype._htmlDataObject=function(o)
{
    return{
        title:o.port.parent.getName()+' - '+o.port.name,
        id:o.id,
        opid:o.opid,
        order:parseInt(o.lastTimeClicked,10),
        size:o.port.get().width+' x '+o.port.get().height
    };
}

CABLES.UI.TexturePreviewer.prototype._updateHtml=function()
{
    var containerEle=document.getElementById("meta_preview_textures");
    
    if(!containerEle)
    {
        var html = CABLES.UI.getHandleBarHtml('meta_preview', {} );
        $('#meta_content_preview').html(html);

        containerEle=document.getElementById("meta_preview_textures");
    }

    for(var i=0;i<this._texturePorts.length;i++)
    {
        if(this._texturePorts[i].doShow && !document.getElementById('preview'+this._texturePorts[i].id))
        {
            var html = CABLES.UI.getHandleBarHtml('meta_preview_texture', {tex:this._htmlDataObject(this._texturePorts[i])} );
            $('#meta_preview_textures').append(html);
            this._texturePorts[i].element=document.getElementById('preview'+this._texturePorts[i].id)
        }
        this._texturePorts[i].updated=CABLES.now();
    }
}

CABLES.UI.TexturePreviewer.prototype.show=function()
{
    this._paused=false;
    this._updateHtml();
    this.clear();
};

CABLES.UI.TexturePreviewer.prototype.hide=function()
{
    this._paused=true;
};

CABLES.UI.TexturePreviewer.prototype.showActivity=function()
{
    for(var i=0;i<this._texturePorts.length;i++)
    {
        var activeIndic=document.getElementById('activity'+this._texturePorts[i].id);
        if(activeIndic) 
        {
            if(this._texturePorts[i].activity>0) activeIndic.innerHTML=this._texturePorts[i].activity+" FPS";
            else activeIndic.innerHTML="";
        }
        this._texturePorts[i].activity=0;
    }
}

CABLES.UI.TexturePreviewer.isScrolledIntoView=function(elem)
{

    var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height();

    var elemTop = $(elem).offset().top;
    var elemBottom = elemTop + $(elem).height();

    return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
}


CABLES.UI.TexturePreviewer.prototype.enableBgPreview=function(enabled)
{
    if(!enabled)
    {
        this.pressedEscape();
    }
    else
    {
        if(this._lastClicked)this.selectTexturePort(this._lastClickedP);

    }
}

CABLES.UI.TexturePreviewer.prototype.pressedEscape=function()
{
    this._lastClicked=null;
    var ele=document.getElementById('bgpreview');
    if(ele)ele.style.display="none";
}



CABLES.UI.TexturePreviewer.prototype.render=function()
{
    if(this._lastClicked && CABLES.UI.userSettings.get("bgpreview"))
    {
        var ele=document.getElementById('bgpreview');
        ele.style.display="block";
        this._renderTexture(this._lastClicked,ele);

        if(ele.width+'px'!=ele.style.width || ele.height+'px'!=ele.style.height)
        {
            ele.style.width=ele.width+'px';
            ele.style.height=ele.height+'px';

            var iconbarWidth=80;
        }
    }

    if(this._paused)return;

    var now=CABLES.now();
    if(now-this._lastTimeActivity>=1000)
    {
        this.showActivity();
        this._lastTimeActivity=CABLES.now();
    }

    if(now-this._lastTime<30)return;
    this._lastTime=now;

    var count=0;

    for(var i=0;i<this._texturePorts.length;i++)
    {
        if ( this._texturePorts[i].port.get() )
        if ( now-this._texturePorts[i].updated<300 || this._texturePorts[i].renderedWidth!=this._texturePorts[i].port.get().width  || this._texturePorts[i].renderedHeight!=this._texturePorts[i].port.get().height )
        {

            if(this._texturePorts[i].element)
            if(this._texturePorts[i].doShow && CABLES.UI.TexturePreviewer.isScrolledIntoView( this._texturePorts[i].element ))
            {
                count++;
                this._renderTexture(this._texturePorts[i]);
                this._texturePorts[i].renderedWidth=this._texturePorts[i].port.get().width;
                this._texturePorts[i].renderedHeight=this._texturePorts[i].port.get().height;
                this._texturePorts[i].element.classList.remove("paused");
            }
            else this._texturePorts[i].element.classList.add("paused");
        }
    }

};

CABLES.UI.TexturePreviewer.prototype.selectTexturePortId=function(opid,portid)
{
    const op=gui.patch().scene.getOpById(opid);
    if(!op)return;

    const p=op.getPortById(portid);

    if(!p || p.links.length<1)return;
    
    const thePort=p.links[0].getOtherPort(p);
    this.selectTexturePort(thePort);
}

CABLES.UI.TexturePreviewer.prototype.hover=function(p)
{
    var thePort=p;
    if(p.direction==CABLES.PORT_DIR_IN && p.links && p.links.length>0)
        thePort=p.links[0].getOtherPort(p);

    if(this._lastClickedP!=thePort)
    {
        this._hoveringTexPort=true;
        this._tempOldTexPort=this._lastClickedP;
        this.selectTexturePort(thePort);
    }
}

CABLES.UI.TexturePreviewer.prototype.hoverEnd=function()
{
    if(this._hoveringTexPort)
    {
        if(!this._tempOldTexPort) this.enableBgPreview(false);
            else this.selectTexturePort(this._tempOldTexPort);
        this._hoveringTexPort=false;
        this._tempOldTexPort=null;
        this._lastClickedP=null;
    }
}

CABLES.UI.TexturePreviewer.prototype.selectTexturePort=function(p)
{
    this._lastClickedP=p;
    this._lastClicked=this.updateTexturePort(p);

    var tp=this.updateTexturePort(p);

    if(!tp)
    {
        console.log("no tp!");
        return;
    }

    for(var i=0;i<this._texturePorts.length;i++)
    {
        var ele=document.getElementById('preview'+this._texturePorts[i].id);
        if(ele)
            if(this._texturePorts[i].port.parent!=p.parent) ele.classList.remove('activePreview');
                else ele.classList.add('activePreview');
    }

};

CABLES.UI.TexturePreviewer.prototype.clear=function(tp)
{
    $('#meta_preview_textures').html('');
    this._texturePorts.length=0;
    this._updateHtml();
}

CABLES.UI.TexturePreviewer.prototype.setMode=function(m)
{
    this.clear();
    this._mode=m;
}

CABLES.UI.TexturePreviewer.prototype.updateTexturePort=function(port)
{
    // if(this._paused || port!=this._lastClicked)return;
    // console.log(port);
    var doUpdateHtml=false;
    var p=port;


    if(p && p.get() && p.get().tex && port.direction==CABLES.PORT_DIR_OUT )
    {
        var id=port.parent.id+port.name;

        var idx=-1;
        for(var i=0;i<this._texturePorts.length;i++)
        {
            if(this._texturePorts[i].id==id)
            {
                idx=i;
            }
        }

        if(idx==-1)
        {
            doUpdateHtml=true;
            this._texturePorts.push({
                id:id,
                opid:port.parent.id,
                port:p,
                lastTimeClicked:-1,
                doShow:false,
                activity:0
            });
            idx=this._texturePorts.length-1;
        }

        this._texturePorts[idx].updated=CABLES.now();
        this._texturePorts[idx].activity++;

        if(this._mode==CABLES.UI.TexturePreviewer.MODE_ACTIVE) this._texturePorts[idx].doShow=true;
    }


    if(doUpdateHtml) if(!this._paused)this._updateHtml();
    return this._texturePorts[idx];
}