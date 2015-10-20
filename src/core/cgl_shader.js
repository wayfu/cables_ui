var CGL=CGL || {};

// ---------------------------------------------------------------------------

CGL.Uniform=function(_shader,_type,_name,_value)
{
    var self=this;
    var loc=-1;
    var name=_name;
    var type=_type;
    var value=0;
    var shader=_shader;
    this.needsUpdate=true;

    shader.addUniform(this);

    this.getType=function() {return type;};
    this.getName=function() {return name;};
    this.getValue=function() {return value;};
    this.resetLoc=function() { loc=-1;};

    this.updateValueF=function()
    {
        if(loc==-1) loc=shader.getCgl().gl.getUniformLocation(shader.getProgram(), name);
        shader.getCgl().gl.uniform1f(loc, value);
    };

    this.bindTextures=function()
    {

    };

    this.setValueF=function(v)
    {
        if(v!=value)
        {
            self.needsUpdate=true;
            value=v;
        }
    };


    this.updateValue4F=function()
    {
        if(loc==-1) loc=shader.getCgl().gl.getUniformLocation(shader.getProgram(), name);
        shader.getCgl().gl.uniform4f(loc, value[0],value[1],value[2],value[3]);
    };

    this.setValue4F=function(v)
    {
        self.needsUpdate=true;
        value=v;
    };


    this.updateValueT=function()
    {
        if(loc==-1)
        {
            loc=shader.getCgl().gl.getUniformLocation(shader.getProgram(), name);
            if(loc==-1) console.log('texture loc unknown!!');
        }

        shader.getCgl().gl.uniform1i(loc, value);
    };

    this.setValueT=function(v)
    {
        self.needsUpdate=true;
        value=v;
    };

    if(type=='f')
    {
        this.setValue=this.setValueF;
        this.updateValue=this.updateValueF;
    }

    if(type=='4f')
    {
        this.setValue=this.setValue4F;
        this.updateValue=this.updateValue4F;
    }

    if(type=='t')
    {
        this.setValue=this.setValueT;
        this.updateValue=this.updateValueT;
    }

    this.setValue(_value);
};

// ---------------------------------------------------------------------------

CGL.Shader=function(_cgl)
{
    if(!_cgl) throw "shader constructed without cgl";
    var self=this;
    var program=null;
    var uniforms=[];
    var defines=[];
    var needsRecompile=true;
    var infoLog='';
    var cgl=_cgl;
    var projMatrixUniform=null;
    var mvMatrixUniform=null;
    var normalMatrixUniform=null;
    var attrVertexPos = -1;

    this.getCgl=function()
    {
        return cgl;
    };

    this.define=function(name,value)
    {
        if(!value)value='';
        // for(var i in defines)
        for(var i=0;i<defines.length;i++)
        {
            if(defines[i][0]==name)
            {
                defines[i][1]=value;
                needsRecompile=true;
                return;
            }
        }
        defines.push([name,value]);
        needsRecompile=true;
    };

    this.removeDefine=function(name,value)
    {
        for(var i=0;i<defines.length;i++)
        {
            if(defines[i][0]==name)
            {
                defines.splice(i,1);
                needsRecompile=true;
                return;
            }
        }
                
    };

    this.removeUniform=function(name)
    {
        for(var i=0;i<uniforms.length;i++)
        {
            if(uniforms[i].getName()==name)
            {
                uniforms.splice(i,1);
            }
        }
        needsRecompile=true;
    };

    this.addUniform=function(uni)
    {
        uniforms.push(uni);
        needsRecompile=true;
    };

    this.getDefaultVertexShader=function()
    {
        return ''
        .endl()+'attribute vec3 vPosition;'
        .endl()+'attribute vec2 attrTexCoord;'
        .endl()+'attribute vec3 attrVertNormal;'
        .endl()+'varying vec2 texCoord;'
        .endl()+'varying vec3 norm;'
        .endl()+'uniform mat4 projMatrix;'
        .endl()+'uniform mat4 mvMatrix;'
        .endl()+'uniform mat4 normalMatrix;'
        
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   texCoord=attrTexCoord;'
        .endl()+'   norm=attrVertNormal;'
        .endl()+'   gl_Position = projMatrix * mvMatrix * vec4(vPosition,  1.0);'
        .endl()+'}';
    };

    this.getDefaultFragmentShader=function()
    {
        return ''
        .endl()+'precision mediump float;'
        .endl()+'varying vec3 norm;'
        .endl()+'void main()'
        .endl()+'{'

        .endl()+'   gl_FragColor = vec4(0.5,0.5,0.5,1.0);'
        // '   gl_FragColor = vec4(norm.x,norm.y,1.0,1.0);\n'+
        .endl()+'}';
    };

    this.getErrorFragmentShader=function()
    {
        return ''
        .endl()+'precision mediump float;'
        .endl()+'varying vec3 norm;'
        .endl()+'void main()'
        .endl()+'{'
        .endl()+'   gl_FragColor = vec4(1.0,0.0,0.0,1.0);'
        .endl()+'}';
    };

    this.srcVert=this.getDefaultVertexShader();
    this.srcFrag=this.getDefaultFragmentShader();

    this.setSource=function(srcVert,srcFrag)
    {
        this.srcVert=srcVert;
        this.srcFrag=srcFrag;
    };


    this.getAttrVertexPos=function(){return attrVertexPos;};

    this.hasTextureUniforms=function()
    {
        for(var i=0;i<uniforms.length;i++)
        {
            if(uniforms[i].getType()=='t') return true;
        }
        return false;
    };

    this.compile=function()
    {
        var definesStr='';
        var i=0;
        for(i=0;i<defines.length;i++)
        {
            definesStr+='#define '+defines[i][0]+' '+defines[i][1]+''.endl();
        }

        if(self.hasTextureUniforms()) definesStr+='#define HAS_TEXTURES'.endl();



        // console.log('shader compile...');
        // console.log('has textures: '+self.hasTextureUniforms() );

        var vs=definesStr+self.srcVert;
        var fs=definesStr+self.srcFrag;


        var srcHeadVert='';
        var srcHeadFrag='';
        for(i=0;i<moduleNames.length;i++)
        {
            var srcVert='';
            var srcFrag='';

            for(var j=0;j<modules.length;j++)
            {
                if(modules[j].name==moduleNames[i])
                {
                    srcVert+=modules[j].srcBodyVert || '';
                    srcFrag+=modules[j].srcBodyFrag || '';
                    srcHeadVert+=modules[j].srcHeadVert || '';
                    srcHeadFrag+=modules[j].srcHeadFrag || '';

                    srcVert=srcVert.replace(/{{mod}}/g,modules[j].prefix);
                    srcFrag=srcFrag.replace(/{{mod}}/g,modules[j].prefix);
                    srcHeadVert=srcHeadVert.replace(/{{mod}}/g,modules[j].prefix);
                    srcHeadFrag=srcHeadFrag.replace(/{{mod}}/g,modules[j].prefix);
                }
            }

            vs=vs.replace('{{'+moduleNames[i]+'}}',srcVert);
            fs=fs.replace('{{'+moduleNames[i]+'}}',srcFrag);
        }
        vs=vs.replace('{{MODULES_HEAD}}',srcHeadVert);
        fs=fs.replace('{{MODULES_HEAD}}',srcHeadFrag);


        if(!program)
        {
            program=createProgram(vs,fs, program);
        }
        else
        {
            // self.vshader=createShader(vs, gl.VERTEX_SHADER, self.vshader );
            // self.fshader=createShader(fs, gl.FRAGMENT_SHADER, self.fshader );
            // linkProgram(program);
            program=createProgram(vs,fs, program);
            
            mvMatrixUniform=null;

            for(i=0;i<uniforms.length;i++)
                uniforms[i].resetLoc();
        }

        needsRecompile=false;
    };

    // var lastPMatrix=mat4.create();

    this.bind=function()
    {
        if(!program || needsRecompile) self.compile();
        
        if(!mvMatrixUniform)
        {
            attrVertexPos = cgl.gl.getAttribLocation(program, 'vPosition');
            projMatrixUniform = cgl.gl.getUniformLocation(program, "projMatrix");
            mvMatrixUniform = cgl.gl.getUniformLocation(program, "mvMatrix");
            normalMatrixUniform = cgl.gl.getUniformLocation(program, "normalMatrix");
        }

        cgl.gl.useProgram(program);

        for(var i=0;i<uniforms.length;i++)
        {
            if(uniforms[i].needsUpdate)uniforms[i].updateValue();
        }


        // if( lastPMatrix[0]!=cgl.pMatrix[0] || lastPMatrix[1]!=cgl.pMatrix[1] || lastPMatrix[2]!=cgl.pMatrix[2] || lastPMatrix[3]!=cgl.pMatrix[3] || lastPMatrix[4]!=cgl.pMatrix[4] || lastPMatrix[5]!=cgl.pMatrix[5] || lastPMatrix[6]!=cgl.pMatrix[6] || lastPMatrix[7]!=cgl.pMatrix[7] || lastPMatrix[8]!=cgl.pMatrix[8] || lastPMatrix[9]!=cgl.pMatrix[9] || lastPMatrix[10]!=cgl.pMatrix[10] || lastPMatrix[11]!=cgl.pMatrix[11] || lastPMatrix[12]!=cgl.pMatrix[12] || lastPMatrix[13]!=cgl.pMatrix[13] || lastPMatrix[14]!=cgl.pMatrix[14] || lastPMatrix[15]!=cgl.pMatrix[15] )
        {
            cgl.gl.uniformMatrix4fv(projMatrixUniform, false, cgl.pMatrix);
            // mat4.copy(lastPMatrix,cgl.pMatrix);
        }

        cgl.gl.uniformMatrix4fv(mvMatrixUniform, false, cgl.mvMatrix);
        
        if(normalMatrixUniform)
        {
            var normalMatrix = mat4.create();
            mat4.invert(normalMatrix,cgl.mvMatrix);
            mat4.transpose(normalMatrix, normalMatrix);

            cgl.gl.uniformMatrix4fv(normalMatrixUniform, false, normalMatrix);
        }

    };

    this.getProgram=function()
    {
        return program;
    };

    var createShader =function(str, type,_shader)
    {

        function getBadLines(infoLog)
        {
            var basLines=[];
            var lines=infoLog.split('\n');
            for(var i in lines)
            {
                var divide=lines[i].split(':');

                if(parseInt(divide[2],10))
                    basLines.push(parseInt( divide[2],10) );
            }
            // console.log('lines ',lines.length);
            return basLines;
        }

        var shader = _shader || cgl.gl.createShader(type);
        cgl.gl.shaderSource(shader, str);
        cgl.gl.compileShader(shader);
        if (!cgl.gl.getShaderParameter(shader, cgl.gl.COMPILE_STATUS))
        {
            console.log('compile status: ');

            if(type==cgl.gl.VERTEX_SHADER)console.log('VERTEX_SHADER');
            if(type==cgl.gl.FRAGMENT_SHADER)console.log('FRAGMENT_SHADER');
            
            console.warn( cgl.gl.getShaderInfoLog(shader) );


            var infoLog=cgl.gl.getShaderInfoLog(shader);
            var badLines=getBadLines(infoLog);
            var htmlWarning='<div class="shaderErrorCode">';
            var lines = str.match(/^.*((\r\n|\n|\r)|$)/gm);

            for(var i in lines)
            {
                var j=parseInt(i,10)+1;
                var line=j+': '+lines[i];
                console.log(line);

                var isBadLine=false;
                for(var bj in badLines) if(badLines[bj]==j) isBadLine=true;

        
                if(isBadLine) htmlWarning+='<span class="error">';
                htmlWarning+=line;
                if(isBadLine) htmlWarning+='</span>';
            }
            
            console.warn( infoLog );

            infoLog=infoLog.replace(/\n/g,'<br/>');

            htmlWarning=infoLog+'<br/>'+htmlWarning+'<br/><br/>';

            CABLES.UI.MODAL.showError('shader error',htmlWarning);

            htmlWarning+='</div>';

            self.setSource(self.getDefaultVertexShader(),self.getErrorFragmentShader());

        }
        return shader;
    };

    linkProgram=function(program)
    {
        cgl.gl.linkProgram(program);
        if (!cgl.gl.getProgramParameter(program, cgl.gl.LINK_STATUS))
        {
            self.setSource(self.getDefaultVertexShader(),self.getErrorFragmentShader());
        }
    };

    createProgram=function(vstr, fstr)
    {
        var program = cgl.gl.createProgram();
        self.vshader = createShader(vstr, cgl.gl.VERTEX_SHADER);
        self.fshader = createShader(fstr, cgl.gl.FRAGMENT_SHADER);
        cgl.gl.attachShader(program, self.vshader);
        cgl.gl.attachShader(program, self.fshader);

        linkProgram(program);
        return program;
    };

    var moduleNames=[];
    var modules=[];
    var moduleNumId=0;
    
    this.removeModule=function(mod)
    {
        for(var i=0;i<modules.length;i++)
        {
            if(modules[i].id==mod.id)
            {
                modules.splice(i,1);
                break;
            }
        }
        needsRecompile=true;
    };

    this.addModule=function(mod)
    {
        mod.id=generateUUID();
        mod.numId=moduleNumId;
        mod.prefix='mod'+moduleNumId;

        modules.push(mod);
        needsRecompile=true;
        moduleNumId++;

        return mod;
    };

    this.setModules=function(names)
    {
        moduleNames=names;
    };


};


