**Upgrade Guide for v2 -> v3**

Upgrading to the Ext 3.x compatible version of Ext.ux.data.DwrProxy involves the following steps:

1. 	Download the 3.x compatible version of Ext.ux.data.DataProxy from <http://github.com/BigLep/ExtJsWithDwr/blob/v3/source/data/DwrProxy.js>

2. 	Change references from Ext.ux.data.DWRProxy to Ext.ux.data.DwrProxy.
	The Ext.ux.data.DWRProxy alias has been dropped, although you can add it back with:
	
		Ext.ux.data.DWRProxy = Ext.ux.data.DwrProxy;

3. 	Set the "dwrFunction" by using api.read.  For example:
	A version 2.x contructor would have looked like:
	
		new Ext.ux.data.DwrProxy({
			dwrFunction : DwrInterface.interfaceMethodName
		});
	
	With version 3.x, the constructor should look like:
	
		new Ext.ux.data.DwrProxy({
			api : {
				read : DwrInterface.interfaceMethodName
			}
		});
	
	Adopting Ext's "api" syntax makes adding support for additional CRUD operations in the future easier.