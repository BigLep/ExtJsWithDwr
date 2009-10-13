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
 *	 // Defined by Ext.data.DataProxy
 *	 api : {
 *		 read : DwrInterface.interfaceMethodName
 *	 },
 *	 // Defined by Ext.Observable
 *	 listeners: {
 *		 'beforeload': function(dataProxy, params) {
 *			 // DwrProxy knows to pull parameters for the Dwr call from params[dataProxy.loadArgsKey].
 *			 params[dataProxy.loadArgsKey] = [
 *				 // arg1 for DwrInterface.interfaceMethodName
 *				 // arg2 for DwrInterface.interfaceMethodName
 *				 // etc...
 *			 ];
 *		 }
 *	 },
 *	 // Defined by Ext.ux.data.DwrProxy
 *	 loadArgsKey : 'newLoadArgsKey' // This configuration option should almost never need to be set
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
	 * DwrProxy implementation of DataProxy#doRequest.
	 * This implementation attempts to mirror HttpProxy#doRequest as much as possible.
	 * Requests are done using configured "DWR function" for the provided "action".
	 * In the "read" case, the response data object is read into a block of Ext.data.Records using the passed {@link Ext.data.DataReader},
	 * and the records are then passed using to the provided callback.
	 * @param {String} action The crud action type (create, read, update, destroy).  Note: only "read" is currently supported.
	 * @param {Ext.data.Record/Ext.data.Record[]} records If action is "read", records will be null.
	 * @param {Object} params An object containing properties which are to be used as parameters for the request to the remote server.
	 * Params is an Object, but the "DWR function" needs to be called with arguments in order.
	 * To ensure that one's arguments are passed to their DWR function correctly, a user must either:
	 * 1. call or know that the execute method was called explictly where the "params" argument's properties were added in the order expected by DWR OR
	 * 2. listen to the "beforeload" and/or "beforewrite" events and add a property to params defined by "loadArgsKey" that is an array of the arguments to pass on to DWR.
	 * If there is no property as defined by "loadArgsKey" within "params", then the whole "params" object will be used as the "loadArgs".
	 * If there is a property as defined by "loadArgsKey" within "params", then this property will be used as the "loagArgs".
	 * The "loadArgs" are iterated over to build up the list of arguments to pass to the "DWR function".
	 * @param {Ext.data.DataReader} reader The Reader object which converts the data object into a block of Ext.data.Records.
	 * @param {Function} callback A function to be called after the request.
	 * The callback is passed the following arguments:<ul>
	 * <li>records: Ext.data.Record[] The block of Ext.data.Records handled by the request.</li>
	 * <li>params: The params object passed to this doRequest method</li>
	 * <li>success: Boolean success indicator</li>
	 * </ul>
	 * @param {Object} scope The scope in which to call the callback.
	 * @param {Object} options An optional argument which is passed to the callback as its second parameter.
	 * @private
	 */
	doRequest : function(action, records, params, reader, callback, callbackScope, options) {
		var dataProxy = this;
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
		dwrFunctionArgs.push(this.createCallback(action, params, reader, callback, callbackScope, options));
		this.api.read.apply(Object, dwrFunctionArgs); // the scope for calling the dwrFunction doesn't matter, so we simply set it to Object.
	},
	
	/**
	 * Helper method for doRequest which returns a callback function for a DWR request.
	 * The returned callback function in turn invokes the provided callback function.
	 * This mirrors HttpProxy#createCallsback.
	 * DWR is unique though in that it allows one to define a callback function for success and callback function for an exception.
	 * This exceptionHandler callback parallels Ext's "remote exception" case.
	 * This method thus returns two callback functions groupded as a single object that can be appended to the DWR function arguments as required by DWR.
	 * @param {String} action See doRequest#action.
	 * @param {Ext.data.Record/Ext.data.Record[]} records See doRequest#records.
	 * @param {Object} params See doRequest#params.
	 * @param {Ext.data.DataReader} reader See doRequest#reader.
	 * @param {Function} callback See doRequest#callback.
	 * @param {Object} scope See doRequest#scope.
	 * @param {Object} options See doRequest#options.
	 * @private
	 */
	createCallback : function(action, params, reader, callback, callbackScope, options) {
		return {
			callback: function(response){
				if (action === Ext.data.Api.actions.read) {
					this.onRead(action, params, reader, callback, callbackScope, options, response);
				} else {
					this.onWrite();
				}
			}.createDelegate(this),
			exceptionHandler : function(message, exception) {
				if (action === Ext.data.Api.actions.read) {
					// @deprecated: Fire loadexception for backwards compatibility.
					// The event is supposed to pass the response, but since DWR doesn't provide that to us, we pass the message.
					this.fireEvent("loadexception", this, params, message, exception);
				}
				// The event is supposed to pass the response, but since DWR doesn't provide that to us, we pass the message.
				this.fireEvent("exception", this, 'remote', action, params, message, exception);
				callback.call(callbackScope, null, options, false);
			}.createDelegate(this)
		};
	},

	/**
	 * Helper method for createCallback for handling the read action.
	 * After creating records from the provided response, it calls the provided callback function.
	 * This mirrors HttpProxy#onRead.
	 * @param {String} action See doRequest#action.
	 * @param {Ext.data.Record/Ext.data.Record[]} records See doRequest#records.
	 * @param {Object} params See doRequest#params.
	 * @param {Ext.data.DataReader} reader See doRequest#reader.
	 * @param {Function} callback See doRequest#callback.
	 * @param {Object} scope See doRequest#scope.
	 * @param {Object} options See doRequest#options.
	 * @param {Object} response The response from the DWR call.  This should be an Object which can be converted to Ext.data.Records.
	 * @private
	 */
	onRead : function(action, params, reader, callback, callbackScope, options, response) {
		var records;
		try {
			// Call readRecords verses read because read will attempt to decode the JSON,
			// but as this point DWR has already decoded the JSON.
			records = reader.readRecords(response);
		} catch(e) {
			// @deprecated: Fire loadexception for backwards compatibility.
			this.fireEvent("loadexception", this, params, response, e);
			this.fireEvent('exception', this, 'response', action, params, response, e);
			callback.call(callbackScope, null, options, false);
			return;
		}
		this.fireEvent("load", this, params, options);
		callback.call(callbackScope, records, options, true);
	},
	
	/**
	 * Helper method for createCallback for handling the create, update, and delete actions.
	 * This mirrors HttpProxy#onWrite
	 * TODO: implement
	 * @private
	 */
	onWrite : function() {
		throw new Exception('create, update, and delete actions are not implemented yet.')
	}
});