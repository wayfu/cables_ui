//http://html5doctor.com/drag-and-drop-to-server/


CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};
CABLES.UI.MODAL=CABLES.UI.MODAL || {};

CABLES.UI.MODAL.hide=function()
{
    mouseNewOPX=0;
    mouseNewOPY=0;

    $('#modalcontent').html('');
    $('#modalcontent').hide();
    $('#modalbg').hide();
    $('.tooltip').hide();
    
};

CABLES.UI.MODAL.show=function(content)
{
    $('#modalcontent').html('<div class="modalclose"><a class="button fa fa-times" onclick="CABLES.UI.MODAL.hide();"></a></div>');
    $('#modalcontent').append(content);
    $('#modalcontent').show();
    $('#modalbg').show();

    $('#modalbg').on('click',function(){
        CABLES.UI.MODAL.hide();
    });
};


CABLES.UI.MODAL.showLoading=function(title,content)
{
    $('#modalcontent').html('<div style="text-align:center;"><h3>'+title+'</h3><i class="fa fa-4x fa-cog fa-spin"></i><br/><br/><div>');
    $('#modalcontent').append(content);
    $('#modalcontent').show();
    $('#modalbg').show();
};

CABLES.UI.MODAL.showError=function(title,content)
{

$('#modalcontent').html('<div class="modalclose"><a class="button fa fa-times" onclick="CABLES.UI.MODAL.hide();"></a></div>');
    $('#modalcontent').append('<h2><span class="fa fa-exclamation-triangle"></span>&nbsp;'+title+'</h2>');
    $('#modalcontent').append(content);
    $('#modalcontent').show();
    $('#modalbg').show();

    $('#modalbg').on('click',function(){
        CABLES.UI.MODAL.hide();
    });
};

