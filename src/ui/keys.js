
var CABLES=CABLES||{};
CABLES.UI=CABLES.UI||{};

CABLES.UI.KeyManager=class extends CABLES.EventTarget
{
    constructor()
    {
        super();
        this._keys=[];

        // this.key("a","A key","down","glcanvas",{},()=>
        // {
        //     console.log("A WAS PRESSED!!!");
        // });

        document.addEventListener("keydown", this._onKeyDown.bind(this), false);
    }

    _onKeyDown(e)
    {
        // console.log("checking keys ",this._keys.length);

        console.log('key ', e.key,e);

        for(var i=0;i<this._keys.length;i++)
        {
            const k=this._keys[i];

            // console.log(i, e.key,k.key);
            
            if(k.key!=e.key || k.event!="down")continue;

            // console.log(e.key,k.key,e.target.id,k.target);

            // if (e.ctrlKey || e.metaKey) {
            if(k.options.cmdCtrl) if(!e.ctrlKey && !e.metaKey) return;

            if(!k.target || k.target==e.target.id)
            {
                // console.log("found key! ",k.target);
                if(k.cb)k.cb(e);
                else console.warn("[keys] key event has no callback",k);

                e.preventDefault();

                return;
            }
        }
    }

    key(key,title,event,target,options,cb)
    {
        var k=
        {
            "key":key,
            "title":title,
            "event":event,
            "target":target,
            "options":options,
            "cb":cb,
        };

        this._keys.push(k);

        // console.log("add key",key,this._keys.length)
    }
    
}