//http://k3d.ivank.net/K3D.js
//http://fhtr.blogspot.de/2009/12/3d-models-and-parsing-binary-data-with.html
//https://github.com/gpjt/webgl-lessons/blob/master/lesson05/index.html

Ops.Gl={};
var GL=null;
var GL=null;

var currentShader=null;

var mvMatrix = mat4.create();
var pMatrix = mat4.create();

Ops.Gl.Renderer = function()
{
    Op.apply(this, arguments);
    var self=this;

    var simpleShader=new CGL.Shader();
 

    this.name='WebGL Renderer';

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var initTranslate=vec3.create();
    vec3.set(initTranslate, 0,0,-2);

    this.onAnimFrame=function(time)
    {
        currentShader=simpleShader;
        gl.enable(gl.DEPTH_TEST);
        GL.clearColor(0,0,0,1);
        GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
        gl.viewport(0,0,self.canvas.clientWidth,self.canvas.clientHeight);
        mat4.perspective(pMatrix,45, self.canvas.clientWidth/self.canvas.clientHeight, 0.01, 1100.0);
        mat4.identity(mvMatrix);
        mat4.translate(mvMatrix,mvMatrix, initTranslate);

        GL.enable(GL.BLEND);
        GL.blendFunc(GL.SRC_ALPHA,GL.ONE_MINUS_SRC_ALPHA);

        self.trigger.call();
    };

    this.canvas = document.getElementById("glcanvas");
    GL = this.canvas.getContext("experimental-webgl");
    gl = this.canvas.getContext("experimental-webgl");

};

Ops.Gl.Renderer.prototype = new Op();




// --------------------------------------------------------------------------


Ops.Gl.ClearColor = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='ClearColor';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.r=this.addInPort(new Port(this,"r"));
    this.g=this.addInPort(new Port(this,"g"));
    this.b=this.addInPort(new Port(this,"b"));

    this.render.onTriggered=function()
    {
        GL.clearColor(self.r.val,self.g.val,self.b.val,1);
        GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

        self.trigger.call();
    };

};

Ops.Gl.ClearColor.prototype = new Op();




// --------------------------------------------------------------------------


Ops.Gl.ClearDepth = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='ClearDepth';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.render.onTriggered=function()
    {
        GL.clear(GL.DEPTH_BUFFER_BIT);
        self.trigger.call();
    };
};

Ops.Gl.ClearDepth.prototype = new Op();

// --------------------------------------------------------------------------


    
Ops.Gl.Texture = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='texture';
    this.filename=this.addInPort(new Port(this,"file",OP_PORT_TYPE_VALUE));
    this.textureOut=this.addOutPort(new Port(this,"texture",OP_PORT_TYPE_TEXTURE));
    
    this.filename.onValueChanged=function()
    {
        console.log('load texture...');
        self.tex=CGL.Texture.load(self.filename.val);
        self.textureOut.val=self.tex.tex;
    };

    this.filename.val='assets/skull.png';
    // this.filename.onValueChanged();
    // this.textureOut.val=this.tex.tex;
};

Ops.Gl.Texture.prototype = new Op();


// --------------------------------------------------------------------------


Ops.Gl.Meshes={};



Ops.Gl.Meshes.Rectangle = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='rectangle';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.render.onTriggered=function()
    {
        // currentShader.setAttributeVertex( self.squareVertexPositionBuffer.itemSize);
        gl.vertexAttribPointer(currentShader.getAttrVertexPos(),self.squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        currentShader.bind();
        gl.bindBuffer(gl.ARRAY_BUFFER, self.squareVertexPositionBuffer);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, self.squareVertexPositionBuffer.numItems);

        self.trigger.call();
    };

    this.squareVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.squareVertexPositionBuffer);
    this.vertices = [
         1.0,  1.0,  0.0,
        -1.0,  1.0,  0.0,
         1.0, -1.0,  0.0,
        -1.0, -1.0,  0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
    this.squareVertexPositionBuffer.itemSize = 3;
    this.squareVertexPositionBuffer.numItems = 4;
};

Ops.Gl.Meshes.Rectangle.prototype = new Op();






Ops.Gl.Meshes.ObjMesh = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='OBJ Mesh';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.mesh=null;

    this.render.onTriggered=function()
    {
        if(self.mesh)
        {
            self.mesh.render(currentShader);
        }

        self.trigger.call();
    };


    ajaxRequest('assets/skull.obj',function(response)
    {
        console.log(response);
                
        var r=parseOBJ(response);

unwrap = function(ind, crd, cpi)
{
    var ncrd = new Array(Math.floor(ind.length/3)*cpi);
    for(var i=0; i<ind.length; i++)
    {
        for(var j=0; j<cpi; j++)
        {
            ncrd[i*cpi+j] = crd[ind[i]*cpi+j];
        }
    }
    return ncrd;
};

var l=r.verticesIndices.length;
        r.vertices = unwrap(r.verticesIndices, r.vertices, 3);
        r.texCoords = unwrap(r.texCoordsIndices  , r.texCoords  , 2);
        r.verticesIndices = [];
        for(var i=0; i<l; i++) r.verticesIndices.push(i);

        
        self.mesh=new CGL.Mesh(r);
    });



};

Ops.Gl.Meshes.ObjMesh.prototype = new Op();





// ----------------------------------------------------------------


Ops.Gl.Meshes.Cube = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Cube';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.mesh=null;

    this.render.onTriggered=function()
    {
        if(self.mesh!==null)
        {
            self.mesh.render(currentShader);
        }

        self.trigger.call();
    };


    var geom=new CGL.Geometry();

            geom.vertices = [
            // Front face
            -1.0, -1.0,  1.0,
             1.0, -1.0,  1.0,
             1.0,  1.0,  1.0,
            -1.0,  1.0,  1.0,
            // Back face
            -1.0, -1.0, -1.0,
            -1.0,  1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0, -1.0, -1.0,
            // Top face
            -1.0,  1.0, -1.0,
            -1.0,  1.0,  1.0,
             1.0,  1.0,  1.0,
             1.0,  1.0, -1.0,
            // Bottom face
            -1.0, -1.0, -1.0,
             1.0, -1.0, -1.0,
             1.0, -1.0,  1.0,
            -1.0, -1.0,  1.0,
            // Right face
             1.0, -1.0, -1.0,
             1.0,  1.0, -1.0,
             1.0,  1.0,  1.0,
             1.0, -1.0,  1.0,
            // Left face
            -1.0, -1.0, -1.0,
            -1.0, -1.0,  1.0,
            -1.0,  1.0,  1.0,
            -1.0,  1.0, -1.0,
        ];

        geom.texCoords = [
          // Front face
          0.0, 0.0,
          1.0, 0.0,
          1.0, 1.0,
          0.0, 1.0,
          // Back face
          1.0, 0.0,
          1.0, 1.0,
          0.0, 1.0,
          0.0, 0.0,
          // Top face
          0.0, 1.0,
          0.0, 0.0,
          1.0, 0.0,
          1.0, 1.0,
          // Bottom face
          1.0, 1.0,
          0.0, 1.0,
          0.0, 0.0,
          1.0, 0.0,
          // Right face
          1.0, 0.0,
          1.0, 1.0,
          0.0, 1.0,
          0.0, 0.0,
          // Left face
          0.0, 0.0,
          1.0, 0.0,
          1.0, 1.0,
          0.0, 1.0,
        ];

        geom.verticesIndices = [
            0, 1, 2,      0, 2, 3,    // Front face
            4, 5, 6,      4, 6, 7,    // Back face
            8, 9, 10,     8, 10, 11,  // Top face
            12, 13, 14,   12, 14, 15, // Bottom face
            16, 17, 18,   16, 18, 19, // Right face
            20, 21, 22,   20, 22, 23  // Left face
        ];



    this.mesh=new CGL.Mesh(geom);



};

Ops.Gl.Meshes.Cube.prototype = new Op();





// ----------------------------------------------------------------


Ops.Gl.Meshes.Plotter = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Plotter';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.v=this.addInPort(new Port(this,"value"));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.render.onTriggered=function()
    {
        // currentShader.setAttributeVertex( self.buffer.itemSize);
        gl.vertexAttribPointer(currentShader.getAttrVertexPos(),self.buffer.itemSize, gl.FLOAT, false, 0, 0);
        currentShader.bind();
        gl.bindBuffer(gl.ARRAY_BUFFER, self.buffer);
        gl.drawArrays(gl.LINE_STRIP, 0, self.buffer.numItems);

        self.trigger.call();
    };

    this.buffer = gl.createBuffer();
    
    var num=50;
    this.vertices = [];
    for(var i=0;i<num;i++)
    {
        this.vertices.push(1/num*i);
        this.vertices.push(Math.random()-0.5);
        this.vertices.push(0);
    }

    function bufferData()
    {
        gl.lineWidth(4);

        gl.bindBuffer(gl.ARRAY_BUFFER, self.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(self.vertices), gl.STATIC_DRAW);
        self.buffer.itemSize = 3;
        self.buffer.numItems = num;
    }
    bufferData();

    this.v.onValueChanged=function()
    {
        self.vertices.splice(0,3);
        self.vertices.push(1);
        self.vertices.push(self.v.val);
        self.vertices.push(0);

        for(var i=0;i<num*3;i+=3)
        {
            self.vertices[i]=1/num*i;
        }

        bufferData();
    };


};

Ops.Gl.Meshes.Plotter.prototype = new Op();


// ----------------------------------------------------------------

Ops.Gl.Meshes.Triangle = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Triangle';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.render.onTriggered=function()
    {
        // currentShader.setAttributeVertex( self.squareVertexPositionBuffer.itemSize);
        // gl.vertexAttribPointer(shader.getAttrVertexPos(),self.squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
        // gl.vertexAttribPointer(currentShader.getAttrVertexPos(),self.squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);


        // currentShader.bind();
        self.mesh.render(currentShader);
        // gl.bindBuffer(gl.ARRAY_BUFFER, self.squareVertexPositionBuffer);
        // gl.drawArrays(gl.TRIANGLE_STRIP, 0, self.squareVertexPositionBuffer.numItems);

        self.trigger.call();
    };


    var geom=new CGL.Geometry();
    geom.vertices = [
         0.0,  1.0,  0.0,
        -1.0,  -1.0,  0.0,
         1.0, -1.0,  0.0
    ];

    geom.verticesIndices = [
        0, 1, 2
    ];
    this.mesh=new CGL.Mesh(geom);



};

Ops.Gl.Meshes.Triangle.prototype = new Op();

// --------------------------------------------------------------------------


Ops.Gl.Shader={};

Ops.Gl.Shader.BasicMaterial = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='BasicMaterial';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));

    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));


    this.doRender=function()
    {
        currentShader=shader;

        if(self.texture.val)
        {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, self.texture.val);
        }

        self.trigger.call();
    };

    var srcFrag=''+
        'precision highp float;\n'+
        '#ifdef HAS_TEXTURES\n'+
        '  varying vec2 texCoord;\n'+
        '  uniform sampler2D tex;\n'+
        '#endif\n'+
        'uniform float r;\n'+
        'uniform float g;\n'+
        'uniform float b;\n'+
        'uniform float a;\n'+
        '\n'+
        'void main()\n'+
        '{\n'+
        'vec4 col=vec4(r,g,b,a);\n'+
        '#ifdef HAS_TEXTURES\n'+
        '   col=texture2D(tex,texCoord);\n'+
        '#endif\n'+
        'gl_FragColor = col;\n'+
        
        '}\n';


    var shader=new CGL.Shader();
    shader.setSource(shader.getDefaultVertexShader(),srcFrag);




    this.r=this.addInPort(new Port(this,"r"));
    this.r.onValueChanged=function()
    {
        if(!self.r.uniform) self.r.uniform=new CGL.Uniform(shader,'f','r',self.r.val);
        else self.r.uniform.setValue(self.r.val);
    };

    this.g=this.addInPort(new Port(this,"g"));
    this.g.onValueChanged=function()
    {
        if(!self.g.uniform) self.g.uniform=new CGL.Uniform(shader,'f','g',self.g.val);
        else self.g.uniform.setValue(self.g.val);
    };

    this.b=this.addInPort(new Port(this,"b"));
    this.b.onValueChanged=function()
    {
        if(!self.b.uniform) self.b.uniform=new CGL.Uniform(shader,'f','b',self.b.val);
        else self.b.uniform.setValue(self.b.val);
    };

    this.a=this.addInPort(new Port(this,"a"));
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
    this.texture.onValueChanged=function()
    {
        if(self.texture.val)
        {
                    console.log('TEXTURE ADDED');
                    
            self.textureUniform=new CGL.Uniform(shader,'t','tex',0);
        }
        else
        {
        }
    };

    this.doRender();
};

Ops.Gl.Shader.BasicMaterial.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.Shader.Schwurbel = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Schwurbel';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.timer=this.addInPort(new Port(this,"time"));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.doRender=function()
    {
        currentShader=shader;
        if(!self.timer.uniLoc)
        {
            shader.bind();
            self.timer.uniLoc=gl.getUniformLocation(shader.getProgram(), "time");
        }
        gl.uniform1f(self.timer.uniLoc, self.timer.val);

        self.trigger.call();
    };

    var srcFrag=''+
        'precision mediump float;\n'+
        'uniform float time;\n'+
        '\n'+
        'void main()\n'+
        '{\n'+
        'float c=sqrt(sin(time*0.02)*cos((time+gl_FragCoord.y)*0.02)+sin(time+gl_FragCoord.x*0.02)*sin(time+gl_FragCoord.y*0.02));\n'+
        'gl_FragColor = vec4( c,c,c,1.0);\n'+
        '}\n';

    var shader=new CGL.Shader();
    shader.compile(shader.getDefaultVertexShader(),srcFrag);

    this.doRender();
    this.render.onTriggered=this.doRender;
};

Ops.Gl.Shader.Schwurbel.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.Shader.Noise = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='Noise';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    var timeUniform=-1;
    var timeStart=-1;

    this.doRender=function()
    {
        if(timeUniform==-1)
        {
            timeStart=Date.now();
            shader.bind();
            timeUniform=gl.getUniformLocation(shader.getProgram(), "time");
        }

        gl.uniform1f(timeUniform, (Date.now()-timeStart)/1000);
        currentShader=shader;

        self.trigger.call();
    };

    var srcFrag=''+
        'precision mediump float;\n'+
        'uniform float time;\n'+
        '\n'+
        'float random(vec2 co)\n'+
        '{\n'+
        '   return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);\n'+
        '}\n'+
        'void main()\n'+
        '{\n'+
        '   float c=random(time*gl_FragCoord.xy);'+
        '   gl_FragColor = vec4( c,c,c,1.0);\n'+
        '}\n';


    var shader=new CGL.Shader();
    shader.compile(shader.getDefaultVertexShader(),srcFrag);

    this.doRender();
    this.render.onTriggered=this.doRender;
};

Ops.Gl.Shader.Noise.prototype = new Op();

// --------------------------------------------------------------------------


Ops.Gl.Matrix={};


Ops.Gl.Matrix.Translate = function()
{
    Op.apply(this, arguments);
    var self=this;

    this.name='translate';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.x=this.addInPort(new Port(this,"x"));
    this.y=this.addInPort(new Port(this,"y"));
    this.z=this.addInPort(new Port(this,"z"));
    this.x.val=0.0;
    this.y.val=0.0;
    this.z.val=0.0;
    
    var vec=vec3.create();

    this.render.onTriggered=function()
    {
        vec3.set(vec, self.x.val,self.y.val,self.z.val);

        mat4.translate(mvMatrix,mvMatrix, vec);
        self.trigger.call();
    };

};

Ops.Gl.Matrix.Translate.prototype = new Op();

// --------------------------------------------------------------------------

Ops.Gl.Matrix.Scale = function()
{
    Op.apply(this, arguments);
    var self=this;
    var DEG2RAD = 3.14159/180.0;
    this.name='scale';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.scale=this.addInPort(new Port(this,"scale"));
    
    var vScale=vec3.create();
    var oldMatrix = mat4.create();
    var transMatrix = mat4.create();
    mat4.identity(transMatrix);

    var doScale=false;

    this.render.onTriggered=function()
    {
        mat4.copy(oldMatrix, mvMatrix);

        mat4.multiply(mvMatrix,mvMatrix,transMatrix);

        self.trigger.call();

        mat4.copy(mvMatrix,oldMatrix);
    };

    var updateMatrix=function()
    {
        mat4.identity(transMatrix);
        mat4.scale(transMatrix,transMatrix, vScale);
    };

    this.scaleChanged=function()
    {
        doScale=false;
        //if(self.scaleX.val!==0.0 || self.scaleY.val!==0.0 || self.scaleZ.val!==0.0)doScale=true;
        vec3.set(vScale, self.scale.val,self.scale.val,self.scale.val);
        updateMatrix();
    };

    this.scale.onValueChanged=this.scaleChanged;

    this.scale.val=1.0;

    updateMatrix();
};

Ops.Gl.Matrix.Scale.prototype = new Op();

// --------------------------------------------------------------------------


Ops.Gl.Matrix.Transform = function()
{
    Op.apply(this, arguments);
    var self=this;
    var DEG2RAD = 3.14159/180.0;
    this.name='transform';
    this.render=this.addInPort(new Port(this,"render",OP_PORT_TYPE_FUNCTION));
    this.trigger=this.addOutPort(new Port(this,"trigger",OP_PORT_TYPE_FUNCTION));

    this.posX=this.addInPort(new Port(this,"posX"));
    this.posY=this.addInPort(new Port(this,"posY"));
    this.posZ=this.addInPort(new Port(this,"posZ"));

    this.scaleX=this.addInPort(new Port(this,"scaleX"));
    this.scaleY=this.addInPort(new Port(this,"scaleY"));
    this.scaleZ=this.addInPort(new Port(this,"scaleZ"));

    this.rotX=this.addInPort(new Port(this,"rotX"));
    this.rotY=this.addInPort(new Port(this,"rotY"));
    this.rotZ=this.addInPort(new Port(this,"rotZ"));
    
    var vPos=vec3.create();
    var vScale=vec3.create();
    var oldMatrix = mat4.create();
    var transMatrix = mat4.create();
    mat4.identity(transMatrix);

    var doScale=false;
    var doTranslate=false;

    this.render.onTriggered=function()
    {
        mat4.copy(oldMatrix, mvMatrix);

        mat4.multiply(mvMatrix,mvMatrix,transMatrix);

        self.trigger.call();

        mat4.copy(mvMatrix,oldMatrix);
    };

    var updateMatrix=function()
    {
        mat4.identity(transMatrix);
        if(doTranslate)mat4.translate(transMatrix,transMatrix, vPos);

        if(self.rotX.val!==0)mat4.rotateX(transMatrix,transMatrix, self.rotX.val*DEG2RAD);
        if(self.rotY.val!==0)mat4.rotateY(transMatrix,transMatrix, self.rotY.val*DEG2RAD);
        if(self.rotZ.val!==0)mat4.rotateZ(transMatrix,transMatrix, self.rotZ.val*DEG2RAD);

        if(doScale)mat4.scale(transMatrix,transMatrix, vScale);
    };

    this.translateChanged=function()
    {
        doTranslate=false;
        if(self.posX.val!==0.0 || self.posY.val!==0.0 || self.posZ.val!==0.0)doTranslate=true;
        vec3.set(vPos, self.posX.val,self.posY.val,self.posZ.val);
        updateMatrix();
    };

    this.scaleChanged=function()
    {
        doScale=false;
        if(self.scaleX.val!==0.0 || self.scaleY.val!==0.0 || self.scaleZ.val!==0.0)doScale=true;
        vec3.set(vScale, self.scaleX.val,self.scaleY.val,self.scaleZ.val);
        updateMatrix();
    };

    this.rotChanged=function()
    {
        updateMatrix();
    };

    this.rotX.onValueChanged=this.rotChanged;
    this.rotY.onValueChanged=this.rotChanged;
    this.rotZ.onValueChanged=this.rotChanged;

    this.scaleX.onValueChanged=this.scaleChanged;
    this.scaleY.onValueChanged=this.scaleChanged;
    this.scaleZ.onValueChanged=this.scaleChanged;

    this.posX.onValueChanged=this.translateChanged;
    this.posY.onValueChanged=this.translateChanged;
    this.posZ.onValueChanged=this.translateChanged;

    this.rotX.val=0.0;
    this.rotY.val=0.0;
    this.rotZ.val=0.0;

    this.scaleX.val=1.0;
    this.scaleY.val=1.0;
    this.scaleZ.val=1.0;

    this.posX.val=0.0;
    this.posY.val=0.0;
    this.posZ.val=0.0;

    updateMatrix();
};

Ops.Gl.Matrix.Transform.prototype = new Op();





