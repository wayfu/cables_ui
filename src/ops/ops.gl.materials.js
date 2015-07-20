
Ops.Gl.Shader= Ops.Gl.Shader || {};

// --------------------------------------------------------------------------


Ops.Gl.Shader.ShowNormalsMaterial = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='ShowNormalsMaterial';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.doRender=function()
    {
        cgl.setShader(shader);
        self.trigger.call();
        cgl.setPreviousShader();
    };

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'varying vec3 norm;'
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(norm.x,norm.y,norm.z,1.0);'
        .endl()+'   gl_FragColor = col;'
        .endl()+'}';


    var shader=new CGL.Shader();
    shader.setSource(shader.getDefaultVertexShader(),srcFrag);

    this.render.onTriggered=this.doRender;
    this.doRender();
};

Ops.Gl.Shader.ShowNormalsMaterial.prototype = new Op();

// --------------------------------------------------------------------------




Ops.Gl.Shader.BasicMaterial = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='BasicMaterial';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION) );
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.doRender=function()
    {
        cgl.setShader(shader);

        if(self.texture.val)
        {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, self.texture.val.tex);
        }

        if(self.textureOpacity.val)
        {
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, self.textureOpacity.val.tex);
        }

        self.trigger.call();


        cgl.setPreviousShader();
    };

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'   varying vec2 texCoord;'
        .endl()+'   #ifdef HAS_TEXTURE_DIFFUSE'
        .endl()+'       uniform sampler2D tex;'
        .endl()+'   #endif'
        .endl()+'   #ifdef HAS_TEXTURE_OPACITY'
        .endl()+'       uniform sampler2D texOpacity;'
        .endl()+'   #endif'
        .endl()+'#endif'
        .endl()+'uniform float r;'
        .endl()+'uniform float g;'
        .endl()+'uniform float b;'
        .endl()+'uniform float a;'
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(r,g,b,a);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'      #ifdef HAS_TEXTURE_DIFFUSE'
        .endl()+'          col=texture2D(tex,texCoord);'
        .endl()+'           #ifdef COLORIZE_TEXTURE'
        .endl()+'               col.r*=r;'
        .endl()+'               col.g*=g;'
        .endl()+'               col.b*=b;'
        .endl()+'           #endif'
        .endl()+'      #endif'
        .endl()+'      #ifdef HAS_TEXTURE_OPACITY'
        .endl()+'           col.a*=texture2D(texOpacity,texCoord).g;'
        .endl()+'       #endif'
        .endl()+'       col.a*=a;'
        .endl()+'   #endif'
        .endl()+'gl_FragColor = col;'
        .endl()+'}';


    var shader=new CGL.Shader();
    shader.setSource(shader.getDefaultVertexShader(),srcFrag);

    this.r=this.addInPort(new Port(this,"r",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.r.onValueChanged=function()
    {
        if(!self.r.uniform) self.r.uniform=new CGL.Uniform(shader,'f','r',self.r.val);
        else self.r.uniform.setValue(self.r.val);
    };

    this.g=this.addInPort(new Port(this,"g",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.g.onValueChanged=function()
    {
        if(!self.g.uniform) self.g.uniform=new CGL.Uniform(shader,'f','g',self.g.val);
        else self.g.uniform.setValue(self.g.val);
    };

    this.b=this.addInPort(new Port(this,"b",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.b.onValueChanged=function()
    {
        if(!self.b.uniform) self.b.uniform=new CGL.Uniform(shader,'f','b',self.b.val);
        else self.b.uniform.setValue(self.b.val);
    };

    this.a=this.addInPort(new Port(this,"a",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.a.onValueChanged=function()
    {
        if(!self.a.uniform) self.a.uniform=new CGL.Uniform(shader,'f','a',self.a.val);
        else self.a.uniform.setValue(self.a.val);
    };

    this.r.val=Math.random();
    this.g.val=Math.random();
    this.b.val=Math.random();
    this.a.val=1.0;

    this.render.onTriggered=this.doRender;
    this.texture=this.addInPort(new Port(this,"texture",OP_PORT_TYPE_TEXTURE));
    this.textureUniform=null;

    this.texture.onValueChanged=function()
    {

        if(self.texture.val)
        {
            if(self.textureUniform!==null)return;
            console.log('TEXTURE ADDED');
            shader.removeUniform('tex');
            shader.define('HAS_TEXTURE_DIFFUSE');
            self.textureUniform=new CGL.Uniform(shader,'t','tex',0);
        }
        else
        {
            console.log('TEXTURE REMOVED');
            shader.removeUniform('tex');
            shader.removeDefine('HAS_TEXTURE_DIFFUSE');
            self.textureUniform=null;
        }
    };

    this.textureOpacity=this.addInPort(new Port(this,"textureOpacity",OP_PORT_TYPE_TEXTURE));
    this.textureOpacityUniform=null;

    this.textureOpacity.onValueChanged=function()
    {
        if(self.textureOpacity.val)
        {
            if(self.textureOpacityUniform!==null)return;
            console.log('TEXTURE OPACITY ADDED');
            shader.removeUniform('texOpacity');
            shader.define('HAS_TEXTURE_OPACITY');
            self.textureOpacityUniform=new CGL.Uniform(shader,'t','texOpacity',1);
        }
        else
        {
            console.log('TEXTURE OPACITY REMOVED');
            shader.removeUniform('texOpacity');
            shader.removeDefine('HAS_TEXTURE_OPACITY');
            self.textureOpacityUniform=null;
        }
    };

    this.colorizeTexture=this.addInPort(new Port(this,"colorizeTexture",OP_PORT_TYPE_VALUE,{ display:'bool' }));
    this.colorizeTexture.val=false;
    this.colorizeTexture.onValueChanged=function()
    {
        console.log('change'+self.colorizeTexture.val);

        if(self.colorizeTexture.val=='true')
            shader.define('COLORIZE_TEXTURE');
        else
            shader.removeDefine('COLORIZE_TEXTURE');
    };

    this.doRender();
};

Ops.Gl.Shader.BasicMaterial.prototype = new Op();





// --------------------------------------------------------------------------





Ops.Gl.Shader.TextureSinusWobble = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='texture sinus wobble';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION) );
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.doRender=function()
    {
        cgl.setShader(shader);

        if(self.texture.val)
        {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, self.texture.val.tex);
        }

        self.trigger.call();


        cgl.setPreviousShader();
    };

    var srcFrag=''
        .endl()+'precision highp float;'
        .endl()+'#ifdef HAS_TEXTURES'
        .endl()+'   varying vec2 texCoord;'
        .endl()+'   #ifdef HAS_TEXTURE_DIFFUSE'
        .endl()+'       uniform sampler2D tex;'
        .endl()+'   #endif'
        .endl()+'#endif'
        .endl()+'uniform float a;'
        .endl()+'uniform float time;'
        .endl()+''
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   vec4 col=vec4(1,1,1,a);'
        .endl()+'   #ifdef HAS_TEXTURES'
        .endl()+'      #ifdef HAS_TEXTURE_DIFFUSE'

        // float smoothstep(float edge0, float edge1, float x)  

        // .endl()+'          col=texture2D(tex,texCoord);'
        // .endl()+'           float x=smoothstep(-1.0,1.0,texCoord.x*sin(time+texCoord.y*(col.r-0.5)) );'
        .endl()+'           float x=texCoord.x+sin(time+texCoord.y*(3.0))*0.15 ;'
        .endl()+'           float y=texCoord.y+sin(time+texCoord.x*(3.0))*0.15 ;'
        // .endl()+'           float y=smoothstep(-1.0,1.0,texCoord.x*sin(time+texCoord.x*3.0)*cos(texCoord.x) );'
        // .endl()+'           float y=texCoord.y;'

        .endl()+'           vec2 tc=vec2(x,y );'
        .endl()+'          col=texture2D(tex,tc);'
        
        .endl()+'      #endif'
        .endl()+'       col.a*=a;'
        .endl()+'   #endif'
        .endl()+'gl_FragColor = col;'
        .endl()+'}';


    var shader=new CGL.Shader();
    shader.setSource(shader.getDefaultVertexShader(),srcFrag);

    this.a=this.addInPort(new Port(this,"a",OP_PORT_TYPE_VALUE,{ display:'range' }));
    this.a.onValueChanged=function()
    {
        if(!self.a.uniform) self.a.uniform=new CGL.Uniform(shader,'f','a',self.a.val);
        else self.a.uniform.setValue(self.a.val);
    };

    this.a.val=1.0;

    this.time=this.addInPort(new Port(this,"time",OP_PORT_TYPE_VALUE,{  }));
    this.time.onValueChanged=function()
    {
        if(!self.time.uniform) self.time.uniform=new CGL.Uniform(shader,'f','time',self.a.val);
        else self.time.uniform.setValue(self.time.val);
    };

    this.time.val=1.0;


    this.render.onTriggered=this.doRender;
    this.texture=this.addInPort(new Port(this,"texture",OP_PORT_TYPE_TEXTURE));
    this.textureUniform=null;

    this.texture.onValueChanged=function()
    {

        if(self.texture.val)
        {
            if(self.textureUniform!==null)return;
            console.log('TEXTURE ADDED');
            shader.removeUniform('tex');
            shader.define('HAS_TEXTURE_DIFFUSE');
            self.textureUniform=new CGL.Uniform(shader,'t','tex',0);
        }
        else
        {
            console.log('TEXTURE REMOVED');
            shader.removeUniform('tex');
            shader.removeDefine('HAS_TEXTURE_DIFFUSE');
            self.textureUniform=null;
        }
    };

    this.doRender();
};

Ops.Gl.Shader.BasicMaterial.prototype = new Op();


