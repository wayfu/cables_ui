import ModalDialog from "./modaldialog";

export default class ModalLoading
{
    constructor(title)
    {
        this._tasks=[];
        this.options={
            "title":title,
            "html":this.getHtml()
        }

        this._dialog=new ModalDialog(this.options);
    }

    getHtml()
    {
        let str="<div class=\"loading\" ><br/><br/></div>";

        if(this._tasks.length>0)
        {
            str+="<div class=\"code\">";
            for(let i=0;i<this._tasks.length;i++)
            {
                str+="- "+this._tasks[i]+"<br/>";
            }
            str+="</div>";

        }

        return str;
    }

    setTask(txt)
    {
        this._tasks.push(txt);
        this._dialog.updateHtml(this.getHtml());
    }

    close()
    {
        this._dialog.close();
        this._dialog=null;
    }
}
