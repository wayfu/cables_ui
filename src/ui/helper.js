
CABLES.UI=CABLES.UI || {};

CABLES.UI.setStatusText=function(txt)
{
    $('#statusbar').html('&nbsp;'+txt);
};

CABLES.UI.togglePortValBool=function(which)
{
    var bool_value = $('#'+which).val() == 'true';
    bool_value=!bool_value;
    $('#'+which).val(bool_value);
    $('#'+which).trigger('input');
};


CABLES.UI.inputIncrement=function(v,dir)
{
    var val=parseFloat(v);
    var add=1;
    if(Math.abs(val)<2) add=0.1;
        else if(Math.abs(val)<100) add=1;
            else add=10;

    return val+add*dir;
};


function mouseEvent(event)
{
    if(!event.offsetX) event.offsetX = event.layerX;//(event.pageX - $(event.target).offset().left);
    if(!event.offsetY) event.offsetY = event.layerY;//(event.pageY - $(event.target).offset().top);
    return event;
}

Handlebars.registerHelper('json', function(context) {
    return JSON.stringify(context);
});

Handlebars.registerHelper('compare', function(left_value, operator, right_value, options) {
    var operators, result;

    if (arguments.length < 4) {
        throw new Error("Handlerbars Helper 'compare' needs 3 parameters, left value, operator and right value");
    }

    operators = {
        '==':       function(l,r) { return l == r; },
        '===':      function(l,r) { return l === r; },
        '!=':       function(l,r) { return l != r; },
        '<':        function(l,r) { return l < r; },
        '>':        function(l,r) { return l > r; },
        '<=':       function(l,r) { return l <= r; },
        '>=':       function(l,r) { return l >= r; },
        'typeof':   function(l,r) { return typeof l == r; }
    };

    if ( ! operators[operator]) {
        throw new Error("Handlerbars Helper 'compare' doesn't know the operator "+ operator);
    }

    result = operators[operator](left_value, right_value);

    if (result === true) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});
