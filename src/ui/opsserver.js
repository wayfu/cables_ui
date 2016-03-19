CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

// localStorage.cables=localStorage.cables || {};
// localStorage.cables.editor=localStorage.cables.editor || {};
// localStorage.cables.editor.serverops= [];

CABLES.UI.ServerOps=function(gui)
{
    var ops=[];
    var self=this;
    var storedOps=[];

    function updateStoredOps()
    {
        if(!storedOps)storedOps=[];

        // storedOps = storedOps.slice() // slice makes copy of array before sorting it
        //   .sort()
        //   .reduce(function(a,b){
        //     if (a.slice(-1)[0] !== b) a.push(b); // slice(-1)[0] means last item in array without removing it (like .pop())
        //     return a;
        //   },[]); // this empty array becomes the starting value for a



        localStorage.setItem("cables.editor.serverops",JSON.stringify(storedOps));
        console.log('storedops'+storedOps.length);
        // console.log('storedOps.length',storedOps.length);
    }


    this.load=function(cb)
    {
        CABLES.api.get('ops/',function(res)
        {
            if(res)
            {
                ops=res;
                console.log('loaded ops...',ops);

                if(cb)cb(ops);

                storedOps=JSON.parse(localStorage.getItem("cables.editor.serverops"));
                updateStoredOps();

                if(storedOps && storedOps.length>0)
                {
                    for(var i in storedOps)
                    {
                        self.edit(storedOps[i]);
                    }
                }
            }
        });
    };

    this.showOpInstancingError=function(name,e)
    {
        // console.log('show server op error message modal');

        gui.patch().loadingError=true;

        var msg='<h2><span class="fa fa-exclamation-triangle"></span> cablefail :/</h2>';
        msg+='error creating op: '+name;
        msg+='<br/><pre>'+e+'</pre><br/>';

        if(this.isServerOp(name))
        {
            msg+='<a class="bluebutton" onclick="gui.showEditor();gui.serverOps.edit(\''+name+'\')">edit op</a>';
        }
        if(gui.user.isAdmin)
        {
            msg+=' <a class="bluebutton" onclick="gui.serverOps.pullOp(\''+name+'\')">try to pull</a>';
        }
        CABLES.UI.MODAL.show(msg);

    };

    this.isServerOp=function(name)
    {
        for(var i=0;i<ops.length;i++)
        {
            if(ops[i].name==name)
            {
                return true;
            }
        }

        return false;
    };

    this.create=function(name)
    {
        // console.log('create '+name);

        CABLES.api.get(
            'ops/create/'+name,
            function(res)
            {
                // console.log('res',res);
                self.load(
                function()
                {
                    console.log('now edit...');
                    self.edit(name);
                });
            },
            function(res)
            {
                console.log('err res',res);
            }
        );

    };

    this.execute=function(name)
    {
        // console.log(name);
        CABLES.UI.MODAL.showLoading('executing...');
        var s = document.createElement( 'script' );
        s.setAttribute( 'src', '/api/op/'+name );
        s.onload=function()
        {
            gui.patch().scene.reloadOp(name);
            CABLES.UI.MODAL.hideLoading();
        };
        document.body.appendChild( s );

    };

    this.edit=function(name,readOnly)
    {
        var op=null;

        for(var i=0;i<ops.length;i++)
        {
            if(ops[i].name==name)
            {
                op=ops[i];
            }
        }
        if(!op)
        {
            console.log('server op not found '+name);
            return;
        }
        CABLES.api.get(
            'ops/'+op.name,
            function(res)
            {
                gui.showEditor();
                CABLES.UI.MODAL.hide();

                storedOps.push(name);
                updateStoredOps();

                var html='';
                if(!readOnly) html+='<a class="button" onclick="gui.serverOps.execute(\''+op.name+'\');">execute</a>';

                var save=null;
                if(!readOnly) save=function(setStatus,content)
                    {
                        CABLES.api.put(
                            'ops/'+op.name,
                            {code:content},
                            function(res)
                            {
                                if(!res.success)
                                {
                                    if(res.error) setStatus('error: Line '+res.error.lineNumber+' : '+res.error.description,true);
                                    else setStatus('error: unknown error',true);
                                }
                                else
                                {
                                    if(!gui.patch().scene.getOpClass(op.name))
                                    {
                                        console.log('execute first time...');
                                        gui.serverOps.execute(op.name);
                                    }

                                    // exec ???
                                    setStatus('saved');
                                }
                                console.log('res',res);
                            },
                            function(res)
                            {
                                setStatus('error: not saved');
                                console.log('err res',res);
                            }
                        );
                    };

                gui.editor().addTab(
                {
                    content:res.code,
                    title:op.name,
                    syntax:'js',
                    readOnly:readOnly,
                    toolbarHtml:html,
                    onClose:function(which)
                    {
                        console.log('close tab',which);

                        for(var i=storedOps.length;i>=0;i--)
                        {
                            console.log('-- ', storedOps[i], which.title);

                            if(storedOps[i]==which.title)
                            {
                                console.log('found op to remove');
                                storedOps.splice(i,1);

                            }
                        }
                        updateStoredOps();
                    },
                    onSave:save
                });

            });


    };

    var s = document.createElement( 'script' );
    s.setAttribute( 'src', '/api/ops/code/'+gui.user.username );
    s.onload=function()
    {
        self.load();
        self.loaded=true;
    };
    document.body.appendChild( s );

    this.loaded=false;
    this.finished=function()
    {
        return this.loaded;
    };


};
