CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

/* After adding a text add jQuery-hover-definition in ui.js + add data-info="{{ texts.foo }}" to the template */

CABLES.UI.TEXTS = {
    /* Menu ------------------ */
    /* Patch */

    "save_screenshot": "## Save Screenshot\n\nDownload renderer output as an image file",
    "toggle_sound": "## Toggle Sound\n\nTurn sound on or off",
    "toggle_helper": "Enable or disable of showing helper and bounding boxes",
    "canvas_lens": "## Pixel Magnifier\n\nMove over canvas to magnify pixels.\n\n`ctrl/cmd`+`c` copy hovered color to clipboard",

    "canvas_size": "## Canvas Size\n\nCanvas size in pixels\n\nclick to set the canvas manually",
    "canvas_aspect": "## Canvas Aspect ratio\n\nclick to choose an aspect ratio",
    "canvas_zoom": "## Website Zoom\n\nYour browser is zoomed in, use ctrl/cmd and +/- to change zoom",
    "canvas_version": "## WebGl Version",
    "canvas_fps": "## FPS\n\nCurrently number of rendered frames per second",
    "canvas_ms": "## Miliseconds\n\nCurrent amount of time needed to render the mainloop",


    "renderer_patchbg": "## Toggle Patch Background\n\n`cmd/ctrl`+`shift`+`enter` Toggle patch nackground renderer",
    "renderer_maximize": "## Toggle Fullscreen\n\n`cmd/ctrl`+`enter` Toggle Fullscreen",
    "renderer_setsize": "## Canvas Size \n\n* click to set canvas size",
    "infoarea": "## Infoarea\n\nLook here for contextual information",

    "nav_patch_new": "## New Patch\n\nCreates a new patch",
    "nav_patch_open": "## Open Patch\n\nLoad an existing patch",

    "linkAddCircle": "## Link \n\n* `[left click]` - insert op \n* `[right click]` - delete link \n* `[shift+left click]` - insert op",

    "timeLineToggle": "Toggle timeline / keyframing panel",
    "timeLineTime": "* Shows current frame/time in seconds\n\n * Click to enter frame to go to",

    "portFloatInput": "* Use mousewheel or up/down keys to inc/decrement by 0.1",
    "portFloatDrag": "* Hold left mouse button and drag to change value. \n\n* hold shift to for smaller increase.",
    "portUnlink": "Click to unlink port",
    "portCreateOp": "Create and connect new texture op",
    "portAnimKeep": "Keep in keyframing view",
    "portAnimToggle": "Toggle parameter animation. enable to keyframe parameter",

    "portDirIn": "## Input Port \n\n",
    "portDirOut": "## Output Port\n\n",
    "portMouseUnlink": "* press right mouse button to unlink port\n* drag while holding right mouse button to move link\n* `[del]` - delete link\n* [ALT]+drag while holding right mouse button to copy link",
    "portMouseCreate": "* press left mousebutton (or press and drag) to create and link new op",
    "portObjectSnapshot": "see at object data snapshot",

    "patchSelectedMultiOps": "## Selected Multiple Ops\n\n* `d` disable ops and their childs\n* `[a]` align ops left\n* `[c]` center ops\n* `[shift+a]` reduce vertical spacing\n* `[del]` delete selcted ops\n* `[mod] + c`: Copy selected op ",
    "patchSelectedOp": "## Selected Single Op\n\n* `T` set op title\n* `D` disable op and childs\n* `shift`+`D` temporary unlink op \n* `X` unlink op \n* `del` delete op\n* `page up/down` snap to parent/child op",

    "projectSettingsPublic": "make patch public - everyone can see it",
    "projectSettingsTitle": "## Patch Name \n\nIf this is your op, click to edit",
    "projectSettingsExample": "ADMIN: patch will be listed as example",

    "projectExportNotSaved": "patch not saved - save patch before exporting",

    "editor": "## Code editor \n\nHere you can edit the code of your ops, write op descriptions, as well as edit objects / arrays.",
    "patch": "## Patch-Panel \n\nHere you can connect ops and make cables do things. \n\n* `esc` Quick-add op \n* `space` + `mouse drag`: Scroll \n* `[right click] + mouse drag:`: Scroll \n* `mod` + `s`: Save patch \n* `mod` + `v`: Paste \n* `mod` + `a`: Select all ops",
    "canvas": "## Canvas \n\nHere you can see the visual output of your patch.\n\n[CMD] + [ENTER] - Maximize canvas",
    "projectFiles": "## Project Files \n\nOverview over your uploaded files",
    "undevLogo": "## UNDEV \n\nCables was made by **undefined development**, come visit us in our office in Berlin and have a coffee with us! ",

    "minimize_tabpanel": "## Minimize Panel\n\n`ESC` - minimize panel",

    "tab_files": "## Files \n\nUpload and manage your files",
    "tab_code": "## Code\n\noperator code",
    "tab_doc": "## Documentation\n\noperator documentation",
    "tab_preview": "## Preview\n\npreview you generated textures",
    "tab_keyframes": "## Keyframes\n\n",
    "tab_variables": "## Variables\n\n",
    "tab_patchconnection": "## Patch Connection\n\n",
    "tab_profiler": "## Profiler \n\nFind out which ops require most processing time",
    "tab_bookmarks": "## Bookmarks \n\nBookmark ops in a big patch to easily locate them",
    "tab_debug": "## Debug \n\n",
    "tab_screen": "## Screen \n\n",

    "download_screenshot": "## Download screenshot \n\nDownload a HD-image (1920 x 1080) of your patch",
    "minimapContainer": "## Minimap \n\nShows an overview over your patch. Click inside the map to navigate.",
    "project_settings_btn": "## project Settings \n\nEdit project name, make it private / public, add collaborators.",
    "timelineui": "## Timeline \n\nIn the timeline you can animate ports over time.",
    "op_background": "## Op \n\n",
    "op_title": "## Op Title \n\n* click to edit title",

    "bookmark_added": "Bookmark added!",
    "bookmark_removed": "Bookmark removed!",
    "sidebarMenu":
        "## Customize sidebar \n\nOpen the sidebar customizer to add / remove menu items by dragging them to / from the sidebar. \nDrag menu items vertically to change their order. \nYou can also press `cmd + p` to show the command pallet – there you can press the bookmark icon to add / remove menu items as well. ",

    "timeline_overview": "## timeline overview \n\nshows the current visible area\n\ndrag borders to resize\n\n* `[drag left click]` move area\n* `[drag right click]` move area and change time\n* `[double click]` toggle show full project length",
    "timeline_frames": "## timeline \n\n* `[click]` move cursor",
    "timeline_time": "`[click]` jump to frame",
    "timeline_progress": "`[click]` set project duration",
    "timeline_keys": "## timeline  \n\n* `[drag right click]` move visible area\n* `[drag left click]` select keys\n* `[h]` center all keys\n* `[j/k]` jump to next/previous key\n* `[DEL]` delete selected keys",

    "usersettings": "## User Settings\n\nchange editor settings ",
    "texpreview": "## Texture Preview\n\nshows result of last clicked texture outputing operator.\n\nclick to see focus operator\n\nclick patch background to hide",

    "valueChangerHover": "## Number Input \n\n* [drag mouse left right] - change value slowly \n* [shift + drag mouse left right] - change value fast",
    "valueChangerInput": "## Number Input Focussed \n\n* [up / down / mousewheel] - change value +/- 0.1\n* [shift + up / down / mousewheel] - change value +/- 0.01\n* [alt + up / down / mousewheel] - change value +/- 1",
    "open_new_window": "## View Patch\n\nopen patch viewer in new window",
    "settings": "## Patch Settings\n\nrename,publish your patch\n\ninvite users to collaborate",

    "working_connected_to": "to work, this op needs to be a child of: ",
    "working_connected_needs_connections_to": "This op can not do anything without at least connecting those ports: ",

    "notOptimizedBrowser_title": "oops!",
    "notOptimizedBrowser_text": "cables is optimized for firefox and chrome, you are using something else<br/>feel free to continue, but be warned, it might behave strange",

    "filemanager_delete_file": "Delete file",
    "filemanager_file_search": "Search for ops that use this file",
    "filemanager_file_open": "Open file in new window",
    "filemanager_file_download": "Download file",
    "filemanager_file_refresh": "Reload file list",
    "filemanager_file_upload": "Upload new file",
    "filemanager_file_create": "Create a file",

    "editorSaveButton": "Save",
    "editorFormatButton": "Format",

    "cmd_centerpatch": "`c` center patch or selected ops",
    "cmd_zoomin": "`+` Zoom In",
    "cmd_zoomout": "`-` Zoom Out",
    "cmd_savepatch": "`CTRL/CMD`+`S` Save Patch",
    "cmd_addop": "`esc` Add Operator",
    "cmd_patchsettings": "## Open Patch settings",


    "guestHint": "Cables is in Demo mode and has only limited functionality. Please register, it's free!"
};

CABLES.UI.TIPS = [
    {
        "descr":
            "To **add an op** press the `Esc`-key. In the popup you can now enter any text which is part of the op’s namespace (e.g. `MainLoop`). You can now navigate through the result-set using your arrow keys (`↓` and `↑`). \n\nWhen you press `Enter` the selected op will be added to the editor.descr:",
        "img": "a_add_op_new.gif",
    },
    {
        "descr": "To **add another op and connect it** to the one we just added you can now drag out a cable from one of the ports.  ",
        "img": "b_add_op_and_connect_it_new.gif",
    },
    {
        "descr": "To **add an op in between two ops** just press the circle in the middle of the cable (one of the existing ops must be highlighted for this).  ",
        "img": "c_add_op_between_other_ops.gif",
    },
    {
        "descr": "To **change one of the op-parameters** first select the op by clicking on it, then you will see the the op-settings in the pane on the right. To change one of the number value inputs click and drag up or down.",
        "img": "d_change_op_parameter.gif",
    },
    {
        "descr": "To **access an op’s example patch** first select the op, then click **view example patches**.",
        "img": "e_view_example_patch.gif",
    },
    {
        "title": "Delete Links",
        "descr": "To delete a cable just press the `right mouse button` on one of the connected ports.",
        "img": "f_delete_link.gif",
    },
    {
        "descr": "To **reconnect a cable to another port** press and drag with the `right mouse button`.",
        "img": "g_reconnect_link.gif",
    },
    {
        "title": "Copy Paste",
        "descr": "Ops can be duplicated by making a selection with your `left mouse button`, pressing `cmd + c` or `ctrl + c` to copy, followed by `cmd + v` or `ctrl + v` to paste.  ",
        "img": "h_copy_paste_op.gif",
    },
    {
        "title": "Align Ops",
        "descr": "To bring some order into your patch you can align ops by making a selection with your `left mouse button` and pressing `a` to horizontally align or `shift + a` to vertically align.   ",
        "img": "i_align_ops.gif",
    },
    {
        "descr": "To **unlink an op** hold it with the `left mouse button` and shake it.  ",
        "img": "j_disconnect_by_shaking.gif",
    },
    {
        "descr": "You can also unlink ops by selecting them and pressing `x`",
        "img": "k_disconnect_with_x_key.gif",
    },
    {
        "descr": "Drag a cable to the center of an op to see suggestions of fitting ports. if there is only one the link will be connected automatically.",
        "img": "l_connect_with_drag_to_center.gif",
    },
    {
        "descr": "To add an existing op between two other ops, click and drag it to the middle of the cable and release.",
        "img": "m_add_existing_op_between.gif",
    },
    {
        "title": "Duplicating Links",
        "descr": "Duplicate a link by pressing `alt` and the `right-mouse button` and dragging the cable to another port",
        "img": "n_duplicate_link.gif",
    },
    {
        "title": "Flow Mode",
        "descr": "See data and function flow by pressing `f`",
        "img": "o_op_flow_with_f_key.gif",
    },
    {
        "descr": "Disable ops and its children by pressing `d`",
        "img": "p_disable_ops_with_d_key.gif",
    },
    {
        "descr": "Temporarily disconnect/bypass a selected op by pressing `shift+d`, pressing `shift+d` again reconnects the cable",
        "img": "q_disable_op_with_shift_and_d_key.gif",
    },
    {
        "descr": "Upload files by dragging them into the window",
        "img": "r_add_file_drag_and_drop.gif",
    },
    {
        "descr": "access the command palette by pressing `CMD+P` or `CTRL+P`. ",
        "img": "s_command_palette_ctrl_and_p.gif",
    },
    {
        "descr": "set a custom title to an op by clicking the title in the parameter panel (you can also select an op and press `t`)",
        "img": "t_change_op_title.gif",
    },
    {
        "descr": "organize huge patches by putting ops into subpatches",
        "img": "u_create_subpatch.gif",
    },
    {
        "descr": "to find documentation and examples for an op, click on the op and then click the link",
        "img": "v_op_documentation_link.gif",
    },
    {
        "descr": "set colors for ops for easier identification",
        "img": "colormarker.gif",
    },
    {
        "descr": "create and link new op by clicking parameter",
        "img": "linkparameter.gif",
    },
    {
        "descr": "use snap to grid for cleaner looking patches",
        "img": "snaptogrid.gif",
    },
];

// todo tipps: create variable command
// todo tipps: c for centering / shift/alt mods for input fields / up/down in input fields
// todo tipps: attached comments
// todo tipps: youtube channel