CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.TexturePreviewer=function()
{
    this._texturePorts=[];
    this._showing=false;
    this._lastTimeActivity=0;
};


CABLES.UI.TexturePreviewer.FRAGSHADER=''.endl()
    .endl()+'IN vec2 texCoord;'
    .endl()+'UNI sampler2D tex;'

    .endl()+'void main()'
    .endl()+'{'
    .endl()+'    vec4 col=vec4(1.0,1.0,1.0,1.0);'
    .endl()+'    col=texture2D(tex,vec2(texCoord.x,(1.0-texCoord.y)));'
    .endl()+'    outColor = col;'
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


CABLES.UI.TexturePreviewer.prototype._renderTexture=function(tp)
{
    var port=tp.port;
    const id=tp.id;

    var previewCanvasEle=document.getElementById('preview_img_'+id);
    if(!previewCanvasEle)
    {
        console.log("no previewCanvasEle");
        return;
    }
    var previewCanvas=document.getElementById('preview_img_'+id).getContext("2d");

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
        }

        cgl.pushPMatrix();
        mat4.ortho(cgl.pMatrix,-1,1,1,-1,0.001,11);
        cgl.setTexture(0,port.get().tex);
        this._mesh.render(this._shader);
        cgl.popPMatrix();
        cgl.resetViewPort();

        // const containerEle=document.getElementById("preview_img_container"+id);
        // const w=Math.min(containerEle.offsetWidth,port.get().width||256);
        // const h=w*(port.get().height/port.get().width);

        var s=this._getCanvasSize(port.get());
        previewCanvasEle.width=s[0];
        previewCanvasEle.height=s[1];

        previewCanvas.clearRect(0, 0,previewCanvasEle.width, previewCanvasEle.height);
        previewCanvas.drawImage(cgl.canvas, 0, 0,previewCanvasEle.width, previewCanvasEle.height);

        cgl.gl.clearColor(0,0,0,0.0);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
    }
    else
    {
        console.log("NOPE ");
    }
};


CABLES.UI.TexturePreviewer.prototype._getCanvasSize=function(tex)
{
    
    var maxWidth=document.getElementById("meta_preview_textures").offsetWidth-30;
    var aspect=tex.height/tex.width;

    var w=Math.min(maxWidth,tex.width);
    var h=w*aspect;
    return [w,h];
}

CABLES.UI.TexturePreviewer.prototype._htmlDataObject=function(o)
{
    return{
        title:o.port.get().name,
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
        if(!document.getElementById('preview'+this._texturePorts[i].id))
        {
            var html = CABLES.UI.getHandleBarHtml('meta_preview_texture', {tex:this._htmlDataObject(this._texturePorts[i])} );
            $('#meta_preview_textures').append(html);
            this._texturePorts[i].element=document.getElementById('preview'+this._texturePorts[i].id)
        }
    }

}

CABLES.UI.TexturePreviewer.prototype.show=function()
{
    previewCanvas=null;
    this._paused=false;

    this._updateHtml();
};

CABLES.UI.TexturePreviewer.prototype.hide=function()
{
    this._paused=true;
};

CABLES.UI.TexturePreviewer.prototype.showActivity=function()
{
    for(var i=0;i<this._texturePorts.length;i++)
    {
        var activeIndic=document.getElementById('activity'+i);
        if(activeIndic) activeIndic.innerHTML= this._texturePorts[i].activity+" FPS" ;
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

CABLES.UI.TexturePreviewer.prototype.render=function()
{
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
        if(now-this._texturePorts[i].updated<300)
        {
            if(CABLES.UI.TexturePreviewer.isScrolledIntoView( this._texturePorts[i].element ))
            {
                count++;
                this._renderTexture(this._texturePorts[i]);
            }
        }
    }
};

CABLES.UI.TexturePreviewer.prototype.selectTexturePort=function(p)
{
    for(var i=0;i<this._texturePorts.length;i++)
    {
        var ele=document.getElementById('preview'+this._texturePorts[i].id);
        if(ele)
            if(this._texturePorts[i].port!=p) ele.classList.remove('activePreview');
                else 
                {
                    this._texturePorts[i].updated=this._texturePorts[i].lastTimeClicked=CABLES.now();
                    ele.style.order=parseInt(this._texturePorts[i].lastTimeClicked,10);
                    ele.classList.add('activePreview');
                    // document.getElementById('meta_content').parentElement.scrollTop=0;
                }
    }

    document.getElementById('meta_content').scrollTop=0;

};


CABLES.UI.TexturePreviewer.prototype.updateTexturePort=function(port)
{
    var doUpdateHtml=false;
    var p=port;

    if(p && p.get() && p.get().tex && port.direction==PORT_DIR_OUT)
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
                updated:CABLES.now(),
                activity:1
            });
        }
        else
        {
            this._texturePorts[idx].updated=CABLES.now();
            this._texturePorts[idx].activity++;
        }
    }

    if(doUpdateHtml) if(!this._paused)this._updateHtml();
}