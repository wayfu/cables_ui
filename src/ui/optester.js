CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.OpTester=function()
{

};


CABLES.UI.OpTester.prototype.run=function()
{

	var ops=gui.opDocs.getAll();

	console.log(ops);

	for(var i in ops)
	{
		console.log(ops[i].name);
		var opname=ops[i].name;

		gui.serverOps.loadOpLibs(opname,function()
		{
			gui.scene().addOp(opname);
		});


	}


};
