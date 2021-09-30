// http://html5doctor.com/drag-and-drop-to-server/
import Logger from "../utils/logger";


export default class FileUploader
{
    constructor()
    {
        this._log = new Logger("fileuploader");
        this._uploadDropEvent = null;
        this._uploadDropListener = this.uploadDrop.bind(this);
        this._uploadDragOverListener = this.uploadDragOver.bind(this);
        this._uploadDragLeaveListener = this.uploadDragLeave.bind(this);

        this.bindUploadDragNDrop();
    }

    bindUploadDragNDrop()
    {
        document.body.addEventListener("drop", this._uploadDropListener);
        document.body.addEventListener("dragover", this._uploadDragOverListener);
        document.body.addEventListener("dragleave", this._uploadDragLeaveListener);
    }

    unBindUploadDragNDrop()
    {
        document.body.removeEventListener("drop", this._uploadDropListener);
        document.body.removeEventListener("dragover", this._uploadDragOverListener);
        document.body.removeEventListener("dragleave", this._uploadDragLeaveListener);
    }

    uploadDragOver(event)
    {
        this._uploadDropEvent = event.originalEvent;

        if (CABLES.DragNDrop.internal)
        {
            this._log.error("cancel because internal");
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        const el = document.getElementById("uploadarea");
        if (el)
        {
            if (event.target.classList.contains("uploadarea")) el.classList.add("uploadareaActive");
            else el.classList.remove("uploadareaActive");
        }

        let openDialog = true;

        if (el) openDialog = window.getComputedStyle(el).display === "none";
        if (openDialog) CABLES.CMD.PATCH.uploadFileDialog();

        // jQuery.event.props.push("dataTransfer");
    }

    uploadDragLeave(event)
    {
        event.preventDefault();
        event.stopPropagation();
    }


    uploadFile(file)
    {
        const reader = new FileReader();

        reader.addEventListener("load",
            () =>
            {
                CABLESUILOADER.talkerAPI.send("fileUploadStr",
                    {
                        "fileStr": reader.result,
                        "filename": file.name,
                    },
                    (err, res) =>
                    {
                        this._log.error("file uploaded!");
                    });
            }, false);
        reader.readAsDataURL(file);
    }

    uploadFiles(files)
    {
        if (!window.gui) return;
        gui.jobs().start({ "id": "prepareuploadfiles", "title": "preparing files for upload..." });

        for (let i = 0; i < files.length; i++)
            this.uploadFile(files[i]);

        gui.jobs().finish("prepareuploadfiles");
    }


    uploadDrop(event)
    {
        event.preventDefault();
        event.stopPropagation();

        CABLES.UI.MODAL.hide();

        if (event.dataTransfer.files.length === 0)
        {
            this._log.warn("no files to upload...");
            return;
        }
        const files = event.dataTransfer.files;

        this.uploadFiles(files);
    }

    handleFileInputUpload(files)
    {
        this.uploadFiles(files);
        gui.showFileManager();
    }
}