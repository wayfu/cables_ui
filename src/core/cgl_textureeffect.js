var CGL=CGL || {};

CGL.TextureEffect=function()
{
    var self=this;
    var geom=new CGL.Geometry();

    geom.vertices = [
         1.0,  1.0,  0.0,
        -1.0,  1.0,  0.0,
         1.0, -1.0,  0.0,
        -1.0, -1.0,  0.0
    ];

    geom.texCoords = [
         1.0, 1.0,
         0.0, 1.0,
         1.0, 0.0,
         0.0, 0.0
    ];

    geom.verticesIndices = [
        0, 1, 2,
        3, 1, 2
    ];

    var mesh=new CGL.Mesh(geom);

    var textureSource=null;
    var textureTarget=new CGL.Texture();

    var frameBuf = cgl.gl.createFramebuffer();
    var renderbuffer = cgl.gl.createRenderbuffer();

    var switched=false;

    this.startEffect=function()
    {
        switched=false;
    };

    this.setSourceTexture=function(tex)
    {
        if(tex===null)
        {
            textureSource=new CGL.Texture();
            textureSource.setSize(16,16);
        }
        else
        {
            textureSource=tex;
        }
        
        textureTarget.setSize(textureSource.width,textureSource.height);

        cgl.gl.bindFramebuffer(cgl.gl.FRAMEBUFFER, frameBuf);

        cgl.gl.bindRenderbuffer(cgl.gl.RENDERBUFFER, renderbuffer);
        cgl.gl.renderbufferStorage(cgl.gl.RENDERBUFFER, cgl.gl.DEPTH_COMPONENT16, textureSource.width,textureSource.height);
        cgl.gl.framebufferTexture2D(cgl.gl.FRAMEBUFFER, cgl.gl.COLOR_ATTACHMENT0, cgl.gl.TEXTURE_2D, textureTarget.tex, 0);
        cgl.gl.framebufferRenderbuffer(cgl.gl.FRAMEBUFFER, cgl.gl.DEPTH_ATTACHMENT, cgl.gl.RENDERBUFFER, renderbuffer);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, null);
        cgl.gl.bindRenderbuffer(cgl.gl.RENDERBUFFER, null);
        cgl.gl.bindFramebuffer(cgl.gl.FRAMEBUFFER, null);

        // console.log(
        //     self.getCurrentTargetTexture().width,
        //     self.getCurrentSourceTexture().height
        //     );
    };


    this.getCurrentTargetTexture=function()
    {
        if(switched)return textureSource;
            else return textureTarget;
    };

    this.getCurrentSourceTexture=function()
    {
        if(switched)return textureTarget;
            else return textureSource;
    };

    this.bind=function()
    {
        if(textureSource===null) throw 'no base texture set!';

        cgl.pushMvMatrix();

        cgl.gl.bindFramebuffer(cgl.gl.FRAMEBUFFER, frameBuf);
        cgl.gl.framebufferTexture2D(cgl.gl.FRAMEBUFFER, cgl.gl.COLOR_ATTACHMENT0, cgl.gl.TEXTURE_2D, self.getCurrentTargetTexture().tex, 0);

        cgl.pushPMatrix();
        cgl.gl.viewport(0, 0, self.getCurrentTargetTexture().width,self.getCurrentTargetTexture().height);
        mat4.perspective(cgl.pMatrix,45, self.getCurrentTargetTexture().width/self.getCurrentTargetTexture().height, 0.01, 1100.0);


        cgl.pushPMatrix();
        mat4.identity(cgl.pMatrix);

        cgl.pushMvMatrix();
        mat4.identity(cgl.mvMatrix);

        cgl.gl.clearColor(0,0,0,0);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
    };

    this.finish=function()
    {
        mesh.render(cgl.getShader());

        cgl.popPMatrix();
        cgl.popMvMatrix();

        cgl.popPMatrix();

        cgl.gl.bindFramebuffer(cgl.gl.FRAMEBUFFER, null);

        cgl.popMvMatrix();
        cgl.gl.viewport(0, 0, cgl.canvasWidth,cgl.canvasHeight);

        switched=!switched;

    };

};