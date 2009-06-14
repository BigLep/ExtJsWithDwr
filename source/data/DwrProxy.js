Ext.namespace("Ext.ux.data");

/**
 * @class Ext.ux.data.DwrProxy
 * @extends Ext.data.DataProxy
 * @author loeppky
 * An implementation of Ext.data.DataProxy that uses DWR to make a remote call.
 * Not all of Ext.data.DataProxy's configuration options make sense for Ext.ux.data.DwrProxy.
 * The following constructor sample code contains all the available options that can be set:
 * <code><pre>
 * new Ext.ux.data.DwrProxy({
 *     // Defined by Ext.data.DataProxy
 *     api : {
 *         read : DwrInterface.interfaceMethodName
 *     },
 *     // Defined by Ext.Observable
 *     listeners: {
 *         'beforeload': function(dataProxy, params) {
 *             // DwrProxy knows to pull parameters for the Dwr call from params[dataProxy.loadArgsKey].
 *             params[dataProxy.loadArgsKey] = [
 *                 // arg1 for DwrInterface.interfaceMethodName
 *                 // arg2 for DwrInterface.interfaceMethodName
 *                 // etc...
 *             ];
 *         }
 *     },
 *     // Defined by Ext.ux.data.DwrProxy
 *     loadArgsKey : 'newLoadArgsKey' // This configuration option should almost never need to be set
 * });
 * </pre></code>
 * Note that currently only the "read" operation is supported.  Support for the rest of the CRUD options will be added soon.   
 * @constructor
 * @param {Object} config A configuration object where the following can be set:
 * - api: as defined in {@link Ext.data.HttpProxy#api}.  This is where the DWR function for a given CRUD operation is specified.
 * Note: only "read" is currently supported.
 * - listeners: as defined in {@link Ext.Observable#listeners}
 * - loadArgsKey: as defined in {@link Ext.ux.data.DwrProxy#loadArgsKey}
 */
Ext.ux.data.DwrProxy = function(config) {
	// Set loadArgsKey if its defined.
	// We do this manually since Ext.data.DataProxy doesn't call Ext.apply with the config object.
	if (config && config.loadArgsKey) {
		this.loadArgsKey = config.loadArgsKey;
	}
	Ext.ux.data.DwrProxy.superclass.constructor.call(this, config);
};
Ext.extend(Ext.ux.data.DwrProxy, Ext.data.DataProxy, {
	
	/**
	 * @cfg {String} loadArgsKey Defines where in the params object passed to the load method
	 * that this class should look for arguments to pass to the "dwrFunction".
	 * The order of arguments passed to a DWR function matters.
	 * Must be set before calling load.
	 * See the explanation of the "params" parameter for the load function for further explanation.
	 */
	loadArgsKey: 'dwrFunctionArgs',
	
	/**
	 * Load data from the configured "dwrFunction",
	 * read the data object into a block of Ext.data.Records using the passed {@link Ext.data.DataReader} implementation,
	 * and process that block using the passed callback.
	 * @param {Object} params An object containing properties which are to be used for the request to the remote server.
	 * Params is an Object, but the "DWR function" needs to be called with arguments in order.
	 * To ensure that one's arguments are passed to their DWR function correctly, a user must either:
	 * 1. call or know that the load method was called explictly where the "params" argument's properties were added in the order expected by DWR OR
	 * 2. listen to the "beforeload" event and add a property to params defined by "loadArgsKey" that is an array of the arguments to pass on to DWR.
	 * If there is no property as defined by "loadArgsKey" within "params", then the whole "params" object will be used as the "loadArgs".
	 * If there is a property as defined by "loadArgsKey" within "params", then this property will be used as the "loagArgs".
	 * The "loadArgs" are iterated over to build up the list of arguments to pass to the "dwrFunction".
	 * @param {Ext.data.DataReader} reader The Reader object which converts the data object into a block of Ext.data.Records.
	 * @param {Function} callback The function into which to pass the block of Ext.data.Records.
	 * The function must be passed <ul>
	 * <li>The Record block object</li>
	 * <li>The "arg" argument from the load function</li>
	 * <li>A boolean success indicator</li>
	 * </ul>
	 * @param {Object} scope The scope in which to call the callback
	 * @param {Object} arg An optional argument which is passed to the callback as its second parameter.
	 */
	load: function(params, reader, loadCallback, scope, arg){
		var dataProxy = this;
		if (dataProxy.fireEvent("beforeload", dataProxy, params) !== false) {
			var loadArgs = params[this.loadArgsKey] || params; // the Array or Object to build up the "dwrFunctionArgs"
			var dwrFunctionArgs = []; // the arguments that will be passed to the dwrFunction
			if (loadArgs instanceof Array) {
				// Note: can't do a foreach loop over arrays because Ext added the "remove" method to Array's prototype.
				// This "remove" method gets added as an argument unless we explictly use numeric indexes.
				for (var i = 0; i < loadArgs.length; i++) {
					dwrFunctionArgs.push(loadArgs[i]);
				}
			} else { // loadArgs should be an Object
				for (var loadArgName in loadArgs) {
					dwrFunctionArgs.push(loadArgs[loadArgName]);
				}
			}
			dwrFunctionArgs.push({
				callback: function(response){
					// call readRecords verses read because read will attempt to decode the JSON,
					// but as this point DWR has already decoded the JSON.
					var records = reader.readRecords(response);
					dataProxy.fireEvent("load", dataProxy, response, loadCallback);
					loadCallback.call(scope, records, arg, true);
				},
				exceptionHandler: function(message, exception){
					// the event is supposed to pass the response, but since DWR doesn't provide that to us, we pass the message.
					dataProxy.fireEvent("loadexception", dataProxy, message, loadCallback, exception);
					loadCallback.call(scope, null, arg, false);
				}
			});
			this.api.read.apply(Object, dwrFunctionArgs); // the scope for calling the dwrFunction doesn't matter, so we simply set it to Object.
		} else { // the beforeload event was vetoed
			callback.call(scope || this, null, arg, false);
		}
	}
});