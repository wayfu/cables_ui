
var CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};



CABLES.UI.inputListenerCursorKeys = function (e)
{
    switch (e.which) {
        case 38: // up
            this.value = CABLES.UI.inputIncrement(this.value, 1, e);
            $(this).trigger('input');
            return false;
            break;

        case 40: // down
            this.value = CABLES.UI.inputIncrement(this.value, -1, e);
            $(this).trigger('input');
            return false;
            break;

        default: return; // exit this handler for other keys
    }
    e.preventDefault(); // prevent the default action (scroll / move caret)
}

CABLES.UI.inputListenerMousewheel = function (event, delta)
{
    if ($(this).is(":focus"))
    {
        if (delta > 0) {
            if (event.shiftKey) this.value = CABLES.UI.inputIncrement(this.value, 0.1, event);
            else this.value = CABLES.UI.inputIncrement(this.value, 1, event);
        }
        else {
            if (event.shiftKey) this.value = CABLES.UI.inputIncrement(this.value, -0.1, event);
            else this.value = CABLES.UI.inputIncrement(this.value, -1, event);
        }

        $(this).trigger('input');
        return false;
    }
}

CABLES.UI.bindInputListeners = function ()
{
    // setTimeout(function(){
    //     var perf = CABLES.uiperf.start('bindInputListeners');

    //     $("#options input").keydown(CABLES.UI.inputListenerCursorKeys);
    //     $("#options input").bind("mousewheel", CABLES.UI.inputListenerMousewheel);

    //     perf.finish();

    // },20);
}


CABLES.UI.checkDefaultValue=function (op, index) {
    if (op.portsIn[index].defaultValue !== undefined && op.portsIn[index].defaultValue !== null) {
        var titleEl = $('#portTitle_in_' + index);
        if (op.portsIn[index].val != op.portsIn[index].defaultValue) {
            if (!titleEl.hasClass('nonDefaultValue')) titleEl.addClass('nonDefaultValue');
        } else {
            if (titleEl.hasClass('nonDefaultValue')) titleEl.removeClass('nonDefaultValue');
        }
    }

}

CABLES.UI.watchColorPickerPort = function (thePort)
{
    var ignoreColorChanges = true;
    var colors;

    function updateColorPickerButton(id) {
        var splits = id.split('_');
        var portNum = parseInt(splits[splits.length - 1]);

        var c1 = Math.round(255 * $('#portval_' + portNum).val());
        var c2 = Math.round(255 * $('#portval_' + (portNum + 1)).val());
        var c3 = Math.round(255 * $('#portval_' + (portNum + 2)).val());

        $(id).css('background-color', 'rgb(' + c1 + ',' + c2 + ',' + c3 + ')');
    }

    var id = '#watchcolorpick_' + thePort.watchId;
    updateColorPickerButton(id);

    $(id).colorPicker({
        opacity: true,
        animationSpeed: 0,
        margin: '-80px -40px 0',
        doRender: 'div div',
        renderCallback: function (res, toggled) {
            var id = res[0].id;
            var splits = id.split('_');
            var portNum = parseInt(splits[splits.length - 1]);

            if (toggled === false) {
                ignoreColorChanges = true;
            }
            if (toggled === true) {
                updateColorPickerButton(id);
                colors = this.color.colors;
                ignoreColorChanges = false;
            }

            if (!ignoreColorChanges) {
                $('#portval_' + portNum + '').val(colors.rgb.r).trigger('input');
                $('#portval_' + (portNum + 1) + '').val(colors.rgb.g).trigger('input');
                $('#portval_' + (portNum + 2) + '').val(colors.rgb.b).trigger('input');
            } else {
                updateColorPickerButton(id);
            }

            modes = {
                r: Math.round(colors.rgb.r * 255),
                g: Math.round(colors.rgb.g * 255),
                b: Math.round(colors.rgb.b * 255),
                h: colors.hsv.h,
                s: colors.hsv.s,
                v: colors.hsv.v,
                HEX: this.color.colors.HEX
            };

            $('input', '.cp-panel').each(function () {
                this.value = modes[this.className.substr(3)];
            });

        },
        buildCallback: function ($elm) {
            var colorInstance = this.color,
                colorPicker = this;

            $elm.prepend('<div class="cp-panel">' +
                'R <input type="text" class="cp-r" /><br>' +
                'G <input type="text" class="cp-g" /><br>' +
                'B <input type="text" class="cp-b" /><hr>' +
                'H <input type="text" class="cp-h" /><br>' +
                'S <input type="text" class="cp-s" /><br>' +
                'B <input type="text" class="cp-v" /><hr>' +
                '<input type="text" class="cp-HEX" />' +
                '</div>')
                .on('change', 'input',
                    function (e) {
                        var value = this.value,
                            className = this.className,
                            type = className.split('-')[1],
                            color = {};

                        color[type] = value;
                        colorInstance.setColor(type === 'HEX' ? value : color,
                            type === 'HEX' ? 'HEX' : /(?:r|g|b)/.test(type) ? 'rgb' : 'hsv');
                        colorPicker.render();
                        this.blur();
                    });
        }
    });


}


CABLES.UI.initPortInputListener=function(op,index)
{
    CABLES.UI.checkDefaultValue(op, index);
    var ele = $('#portval_' + index);
    ele.on('input', function (e)
    {
        var v = '' + ele.val();

        if (!op.portsIn[index].uiAttribs.type || op.portsIn[index].uiAttribs.type == 'number') {
            if (isNaN(v) || v === '') {
                ele.addClass('invalid');
                return;
            } else {
                ele.removeClass('invalid');
                v = parseFloat(v);
            }
        }

        if (op.portsIn[index].uiAttribs.type == 'int') {
            if (isNaN(v) || v === '') {
                ele.addClass('invalid');
                return;
            } else {
                ele.removeClass('invalid');
                v = parseInt(v, 10);
            }
        }

        if (op.portsIn[index].uiAttribs.display == 'bool') {
            if (v != 'true' && v != 'false') {
                v = false;
                ele.val('false');
            }
            if (v == 'true') v = true;
            else v = false;
        }

        op.portsIn[index].set(v);
        gui.patchConnection.send(CABLES.PACO_VALUECHANGE, {
            "op": op.id,
            "port": op.portsIn[index].name,
            "v": v
        });

        CABLES.UI.checkDefaultValue(op, index);

        if (op.portsIn[index].isAnimated()) gui.timeLine().scaleHeightDelayed();
    });
}


CABLES.UI.initPortClickListener=function(op,index)
{
    if (op.portsIn[index].isAnimated()) $('#portanim_in_' + index).addClass('timingbutton_active');
    if (op.portsIn[index].isAnimated() && op.portsIn[index].anim.stayInTimeline) $('#portgraph_in_' + index).addClass('timingbutton_active');

    $('#portTitle_in_' + index).on('click', function (e) {
        const p = op.portsIn[index];
        if (!p.uiAttribs.hidePort)
            gui.opSelect().show(
                {
                    x: p.parent.uiAttribs.translate.x + (index * (CABLES.UI.uiConfig.portSize + CABLES.UI.uiConfig.portPadding)),
                    y: p.parent.uiAttribs.translate.y - 50,
                }, op, p);
    });

    $('#portCreateOp_in_' + index).on('click', function (e) {
        var thePort = op.portsIn[index];
        if (thePort.type == CABLES.OP_PORT_TYPE_TEXTURE) {
            gui.scene().addOp('Ops.Gl.Texture', {}, function (newop) {
                gui.scene().link(op, thePort.name, newop, newop.getFirstOutPortByType(thePort.type).name);
            });

        }
    });

    $('#portedit_in_' + index).on('click', function (e) {
        var thePort = op.portsIn[index];
        // console.log('thePort.uiAttribs.editorSyntax',thePort.uiAttribs.editorSyntax);

        gui.patch().openParamEditor(op.id, op.portsIn[index].name)

        // gui.showEditor();
        // gui.editor().addTab({
        //     content: op.portsIn[index].get() + '',
        //     title: '' + op.portsIn[index].name,
        //     syntax: thePort.uiAttribs.editorSyntax,
        //     onSave: function(setStatus, content) {
        //         // console.log('setvalue...');
        //         gui.setStateUnsaved();
        //         gui.jobs().finish('saveeditorcontent');
        //         thePort.set(content);
        //     }
        // });
    });

    $('#portbutton_' + index).on('click', function (e) {
        op.portsIn[index]._onTriggered();
    });


    $('#portgraph_in_' + index).on('click', function (e) {
        if (op.portsIn[index].isAnimated()) {
            op.portsIn[index].anim.stayInTimeline = !op.portsIn[index].anim.stayInTimeline;
            $('#portgraph_in_' + index).toggleClass('timingbutton_active');
            gui.patch().timeLine.setAnim(op.portsIn[index].anim, {
                name: op.portsIn[index].name,
                defaultValue: parseFloat($('#portval_' + index).val())
            });
        }
    });

    $('#portanim_in_' + index).on('click', function (e) {
        if ($('#portanim_in_' + index).hasClass('timingbutton_active')) {
            var val = gui.patch().timeLine.removeAnim(op.portsIn[index].anim);
            op.portsIn[index].setAnimated(false);

            gui.patch().timeLine.setAnim(null);
            // op.portsIn[index].anim=null;
            $('#portanim_in_' + index).removeClass('timingbutton_active');
            $('#portval_' + index).val(val);
            $('#portval_' + index).trigger('input');
            $('#portval_' + index).focus();
            return;
        }

        $('#portanim_in_' + index).addClass('timingbutton_active');

        op.portsIn[index].toggleAnim();
        gui.patch().timeLine.setAnim(op.portsIn[index].anim, {
            name: op.portsIn[index].name,
            defaultValue: parseFloat($('#portval_' + index).val())
        });
    });
}

