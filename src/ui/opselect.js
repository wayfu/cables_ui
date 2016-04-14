CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};
CABLES.UI.OPSELECT=CABLES.UI.OPSELECT || {};

CABLES.UI.OPSELECT.linkNewLink=null;
CABLES.UI.OPSELECT.linkNewOpToPort=null;
CABLES.UI.OPSELECT.linkNewOpToOp=null;
CABLES.UI.OPSELECT.newOpPos={x:0,y:0};

CABLES.UI.OPSELECT.showOpSelect=function(pos,linkOp,linkPort,link)
{
    CABLES.UI.OPSELECT.linkNewLink=link;
    CABLES.UI.OPSELECT.linkNewOpToPort=linkPort;
    CABLES.UI.OPSELECT.linkNewOpToOp=linkOp;
    CABLES.UI.OPSELECT.newOpPos=pos;

    var self=this;
    this.opDocs=[];

    CABLES.api.get(
        'doc/ops/all',
        function(res)
        {
            console.log('loaded '+res.length+' op docs.');
            self.opDocs=res;
            updateInfo();
        },
        function(res){ console.log('err',res); }
        );


    var html = CABLES.UI.getHandleBarHtml('op_select',{ops: CABLES.UI.OPSELECT.getOpList() });
    CABLES.UI.MODAL.show(html);

    $('#opsearch').focus();
    $('#opsearch').on('input',function(e)
    {
        var searchFor= $('#opsearch').val();

        if(!searchFor)
            $('#search_style').html('.searchable:{display:block;}');
        else
            $('#search_style').html(".searchable:not([data-index*=\"" + searchFor.toLowerCase() + "\"]) { display: none; }");

        // if(gui.user.isAdmin && $('#opsearch').val() && ($('#opsearch').val().startsWith('Ops.') || $('#opsearch').val().startsWith('Op.'))   )
        {
            $('#opOptions').html('<i class="fa fa-lock"/> <a onclick="gui.serverOps.create(\''+$('#opsearch').val()+'\');">create op</a>');
        }

    });

    $( ".searchresult:first" ).addClass( "selected" );

    var displayBoxIndex=0;
    var Navigate = function(diff)
    {
        displayBoxIndex += diff;

        if (displayBoxIndex < 0) displayBoxIndex = 0;
        var oBoxCollection = $(".searchresult:visible");
        var oBoxCollectionAll = $(".searchresult");
        if (displayBoxIndex >= oBoxCollection.length) displayBoxIndex = 0;
        if (displayBoxIndex < 0) displayBoxIndex = oBoxCollection.length - 1;

        var cssClass = "selected";

        oBoxCollectionAll.removeClass(cssClass);
        oBoxCollection.removeClass(cssClass).eq(displayBoxIndex).addClass(cssClass);

        updateInfo();
    };

    var infoTimeout=-1;
    var lastInfoOpName='';
    function updateInfo()
    {
        var opname=$('.selected').data('opname');
        var htmlFoot='';

        if(opname)
        {
            if(gui.user.isAdmin && gui.serverOps.isServerOp(opname))
            {
                htmlFoot+='<hr/><i class="fa fa-lock"/> <a onclick="gui.serverOps.edit(\''+opname+'\');">edit serverOp</a>';
            }

            $('#searchinfo').html('');

            var content='No docs found';
            for(var i=0;i<self.opDocs.length;i++)
            {
                if(self.opDocs[i].name==opname)
                {
                    content=self.opDocs[i].content;
                    break;
                }
            }
            $('#searchinfo').html(content+htmlFoot);


            // if(infoTimeout!=-1)clearTimeout(infoTimeout);
            // infoTimeout = setTimeout(function()
            // {
            //     lastInfoOpName=$('.selected').data('opname');
            //
            //     CABLES.api.getCached(
            //         'doc/ops/'+opname,
            //         function(res)
            //         {
            //             // if(res.content)
            //             $('#searchinfo').html(res.content+htmlFoot);
            //                 // else $('#searchinfo').html(res.content+htmlFoot);
            //         },
            //         function(res){ console.log('err',res); }
            //         );
            //     // console.log('opname',opname);
            //
            // }, 300);

        }
    }

    function onInput(e)
    {
        // $(".searchresult:visible").first().addClass( "selected" );
        displayBoxIndex=0;
        Navigate(0);
        updateInfo();
    }

    $('#opsearch').on('input',onInput);

    $('#opsearch').keydown(function(e)
    {
        switch(e.which)
        {
            case 13:
                var opname=$('.selected').data('opname');
                CABLES.UI.MODAL.hide();
                gui.scene().addOp(opname);
            break;

            case 8:
                onInput();
                return true;


            case 38: // up
                $('.selected').removeClass('selected');
                Navigate(-1);
            break;

            case 37: // left
            break;

            case 39: // right
            break;

            case 40: // down
                $('.selected').removeClass('selected');
                Navigate(1);
            break;

            default: return; // exit this handler for other keys
        }
        e.preventDefault(); // prevent the default action (scroll / move caret)
    });

    setTimeout(function(){$('#opsearch').focus();},100);

};

CABLES.UI.OPSELECT.getOpList=function()
{
    var ops=[];

    function getop(ns,val,parentname)
    {
        if (Object.prototype.toString.call(val) === '[object Object]')
        {
            for (var propertyName in val)
            {
                if (val.hasOwnProperty(propertyName))
                {
                    var html='';
                    var opname=ns+'.'+ parentname + propertyName + '';

                    var isOp=false;
                    var isFunction=false;
                    if(eval('typeof('+opname+')')=="function") isFunction=true;

                    var parts=opname.split('.');
                    var shortName=parts[parts.length-1];
                    parts.length=parts.length-1;
                    var nameSpace=parts.join('.');

                    if(isFunction)
                    {
                        // console.log(opname);
                        if(eval('typeof('+opname+'.v2)')=="function")
                        {
                            opname=opname+'.v2';
                        }

                        var op=
                        {
                            "isOp":isOp,
                            "name":opname,
                            "shortName":shortName,
                            "nameSpace":nameSpace,
                            lowercasename:opname.toLowerCase()
                        };
                        ops.push(op);
                    }

                    found=getop(ns,val[propertyName],parentname+propertyName+'.');
                }
            }
        }
    }

    getop('Ops',Ops,'');
    // getop('Op',CABLES.Op,'');

    ops.sort(function(a, b)
    {
        return a.name.length - b.name.length; // ASC -> a - b; DESC -> b - a
    });


    return ops;
};
