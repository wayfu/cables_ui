import ContextMenu from "./elements/contextmenu";
import Bookmarks from "./components/bookmarks";
import GlUiCanvas from "./glpatch/gluicanvas";
import GlPatch from "./glpatch/glpatch";
import CanvasLens from "./components/canvaslens";
import HtmlInspector from "./components/htmlinspect";
import IconBar from "./elements/iconbar";
import Keypresenter from "./components/keypresenter";
import analyzePatch from "./components/analyze_patch";
import gluiconfig from "./glpatch/gluiconfig";
import OpTreeList from "./components/opselect_treelist";
import UiProfiler from "./components/uiperformance";
import UserSettings from "./components/usersettings";
import Api from "./api/api";
import Introduction from "./components/introduction";
import Tipps from "./dialogs/tipps";
import KeyBindingsManager from "./components/keybindingsmanager";
import OpHistory from "./components/ophistory";
import Exporter from "./dialogs/exporter";
import ele from "./utils/ele";
import GradientEditor from "./dialogs/gradienteditor";
import CommandPallete from "./dialogs/commandpalette";
import OpSelect from "./dialogs/opselect";
import initSplitPanes from "./elements/splitpane";
import PatchSaveServer from "./components/patchSaveServer";
import CMD from "./commands/commands";

import TabPanel from "./elements/tabpanel/tabpanel";
import Tab from "./elements/tabpanel/tab";
import MainTabPanel from "./elements/tabpanel/maintabpanel";
import FindTab from "./components/tabs/tab_find";
import SpreadSheetTab from "./components/tabs/tab_spreadsheet";
import WatchArrayTab from "./components/tabs/tab_watcharray";
import WatchVarTab from "./components/tabs/tab_watchvars";


CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};
CABLES.GLGUI = CABLES.GLGUI || {};
CABLES.GLUI = CABLES.GLUI || {};


CABLES.UI.userSettings = new UserSettings();

// CONSTANTS

window.ele = ele;

CABLES.GLGUI.CURSOR_NORMAL = 0;
CABLES.GLGUI.CURSOR_HAND = 1;

// expose global classes
CABLES.GLGUI.GlUiCanvas = GlUiCanvas;
CABLES.GLGUI.GlPatch = GlPatch;
CABLES.GLUI.glUiConfig = gluiconfig;

CABLES.UI.Bookmarks = Bookmarks;
CABLES.UI.CanvasLens = CanvasLens;
CABLES.UI.HtmlInspector = HtmlInspector;
CABLES.UI.IconBar = IconBar;
CABLES.UI.Keypresenter = Keypresenter;
CABLES.UI.OpTreeList = OpTreeList;
CABLES.UI.UiProfiler = UiProfiler;
CABLES.UI.Introduction = Introduction;
CABLES.UI.Tipps = Tipps;
CABLES.UI.KeyBindingsManager = KeyBindingsManager;
CABLES.UI.OpHistory = OpHistory;
CABLES.UI.Exporter = Exporter;
CABLES.UI.CommandPallete = CommandPallete;
CABLES.UI.OpSelect = OpSelect;
CABLES.UI.PatchServer = PatchSaveServer;
CABLES.GradientEditor = GradientEditor;

CABLES.UI.TabPanel = TabPanel;
CABLES.UI.Tab = Tab;
CABLES.UI.MainTabPanel = MainTabPanel;

CABLES.UI.FindTab = FindTab;
CABLES.UI.SpreadSheetTab = SpreadSheetTab;
CABLES.UI.WatchArrayTab = WatchArrayTab;
CABLES.UI.WatchVarTab = WatchVarTab;

// expose global objects


CABLES.api = new Api();
CABLES.contextMenu = new ContextMenu();


// expose global functions
CABLES.UI.analyzePatch = analyzePatch;
CABLES.UI.initSplitPanes = initSplitPanes;

CABLES.CMD = CMD;
