CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

// -----------------

CABLES.UI.EditorTab=function(options)
{
    this._editor=null;
    this._options=options;

    var icon="file";
    if(options.syntax=='js') icon="code";
    else if(options.syntax=='glsl') icon="aperture";
    // else if(options.syntax=='glsl') icon="sun";

    this._tab=new CABLES.UI.Tab(options.title,{
        "icon":icon,
        "infotext":"a code editor"
    });
    gui.mainTabs.addTab(this._tab);

    this._tab.editorObj=options.editorObj;

    var html='<div id="editorcontent'+this._tab.id+'" style="width:100%;height:100%"></div>';
    this._tab.html(html);

    this._editor=CABLES.UI.createEditor('editorcontent'+this._tab.id);
    this._editor.setValue(options.content,-1);
    this._editor.resize();

    const undoManager = this._editor.session.getUndoManager();
    undoManager.reset();
    this._editor.session.setUndoManager(undoManager);

    this._editor.on("change", function(e) {
        gui.mainTabs.setChanged(this._tab.id,true);
    }.bind(this));

    if(options.syntax=='md') this._editor.session.setMode("ace/mode/Markdown");
    else if(options.syntax=='js') this._editor.session.setMode("ace/mode/javascript");
    else if(options.syntax=='glsl') this._editor.session.setMode("ace/mode/glsl");
    else if(options.syntax=='css') this._editor.session.setMode("ace/mode/css");
    else this._editor.session.setMode("ace/mode/Text");

    this._tab.addButton("save",this.save.bind(this));
    this._tab.addEventListener("onClose",options.onClose);
    this._tab.addEventListener("onActivate",function(){this._editor.focus();}.bind(this));
};


CABLES.UI.EditorTab.prototype.save=function()
{
    function onSaveCb(txt)
    {
        gui.jobs().finish('saveeditorcontent');
        
        if(txt.toLowerCase().indexOf('error')==0) CABLES.UI.notifyError(txt);
        else
        {
            CABLES.UI.notify(txt);
            gui.mainTabs.setChanged(this._tab.id,false);
        }

        this._editor.focus();
        setTimeout(function()
        {
            this._editor.focus();
        }.bind(this),200);
    
    }

    var anns=this._editor.getSession().getAnnotations();
    console.log('annotations',anns);

    if(this._options.onSave)
    {
        gui.jobs().start({id:'saveeditorcontent',title:'saving editor content'});
        this._options.onSave(onSaveCb.bind(this),this._editor.getValue());
        gui.editor().focus();
    }


};

CABLES.UI.createEditor=function(id)
{
    var editor = ace.edit(id);
    editor.setValue('');

    editor.setOptions({
		"fontFamily": "SourceCodePro",
		"fontSize": "14px",
        "enableBasicAutocompletion": true,
        "enableLiveAutocompletion": true,
        "enableSnippets": true,
        "showPrintMargin": false
    });

    if(!CABLES.UI.userSettings.get('theme-bright')) editor.setTheme("ace/theme/cables");

    editor.session.setMode("ace/mode/javascript");
    editor.$blockScrolling = Infinity;

    editor.commands.bindKey("Ctrl-D", "selectMoreAfter");
    editor.commands.bindKey("Cmd-D", "selectMoreAfter");
    editor.commands.bindKey("Cmd-Ctrl-Up", "movelinesup");
    editor.commands.bindKey("Cmd-Ctrl-Down", "movelinesdown");




    var snippetManager = ace.require("ace/snippets").snippetManager;
    var snippets = snippetManager.parseSnippetFile("");
    
    snippets.push(

        {
            content: "op.inTriggerButton(\"${1:name}\")",
            name: "op.inTriggerButton",
        },
        {
            content: "op.inTrigger(\"${1:name}\")",
            name: "op.inTrigger",
        },
        {
            content: "op.outTrigger(\"${1:name}\")",
            name: "op.outTrigger",
        },
        {
            content: "op.inBool(\"${1:name}\",${2:false})",
            name: "op.inBool",
        },
        {
            content: "op.inInt(\"${1:name}\",${2:0})",
            name: "op.inInt",
        },
        {
            content: "op.inFloatSlider(\"${1:name}\",${2:0})",
            name: "op.inFloatSlider",
        },
        {
            content: "op.inFloat(\"${1:name}\",${2:0})",
            name: "op.inFloat",
        },
        {
            content: "op.inDropDown(\"${1:name}\",\"${2:['option a','option b']}\")",
            name: "op.inDropDown",
        },
        {
            content: "op.inStringEditor(\"${1:name}\",\"${2:default}\")",
            name: "op.inStringEditor",
        },
        {
            content: "op.inString(\"${1:name}\",\"${2:default}\")",
            name: "op.inString",
        },
        {
            content: "op.inObject(\"${1:name}\")",
            name: "op.inObject",
        },
        {
            content: "op.inTexture(\"${1:name}\")",
            name: "op.inTexture",
        },
        {
            content: "op.inArray(\"${1:name}\")",
            name: "op.inArray",
        },
        {
            content: "op.inFile(\"${1:name}\")",
            name: "op.inFile",
        },
        {
            content: "op.outNumber(\"${1:name}\")",
            name: "op.outNumber",
        },
        {
            content: "op.outBool(\"${1:name}\")",
            name: "op.outBool",
        },
        {
            content: "op.outString(\"${1:name}\")",
            name: "op.outString",
        },
        {
            content: "op.outObject(\"${1:name}\")",
            name: "op.outObject",
        },
        {
            content: "op.outArray(\"${1:name}\")",
            name: "op.outArray",
        },
        {
            content: "op.outTexture(\"${1:name}\")",
            name: "op.outTexture",
        },
        {
            content: "CABLES.map(${1:name})",
            name: "CABLES.map",
        },
        {
            content: "console.log(\"${1:text}\");",
            name: "console.log",
        },
        {
            content: "op.setPortGroup(\"${1:name}\",[${2:port},${3:port}]);",
            name: "op.setPortGroup",
        },
        {
            content: "CABLES.map(${1:value},${2:oldMin},${3:oldMax},${4:newMin},${5:newMax});",
            name: "CABLES.map",
        },
        {
            content: "op.toWorkPortsNeedToBeLinked(${1:port1},${2:port2});",
            name: "op.toWorkPortsNeedToBeLinked",
        }
    );
    snippetManager.register(snippets, "javascript");

    var staticWordCompleter = {
        getCompletions: function(editor, session, pos, prefix, callback) {
            var wordList = [
                "op.log",
                "onChange=",
                "onTriggered=",
                "onLinkChanged=",
                "op.toWorkNeedsParent",
                // "op.toWorkPortsNeedToBeLinked",
                "setUiAttribs",
                "op.patch.cgl",
                "CABLES.shuffleArray(arr);",
                "Math.seededRandom();",
                "Math.randomSeed=1;",
                "CABLES.now();"
            ];
            callback(null, wordList.map(function(word) {
                return {
                    caption: word,
                    value: word,
                    meta: "static"
                };
            }));
        }
    };

    // or
    editor.completers.push(staticWordCompleter);
    editor.resize();
    editor.focus();
    return editor;

}