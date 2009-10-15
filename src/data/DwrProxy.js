Ext.namespace("Ext.ux.data");

/**
 * @class Ext.ux.data.DwrProxy
 * @extends Ext.data.DataProxy
 * @author loeppky
 * An implementation of Ext.data.DataProxy that uses DWR to make a remote call.
 * Not all of Ext.data.DataProxy's configuration options make sense for Ext.ux.data.DwrProxy.
 * The following constructor sample code contains all the available options that can be set:
 * <code><pre>
 *	new Ext.ux.data.DwrProxy({
 *		// Defined by Ext.data.DataProxy
 *		apiActionToHanderMap : {
 *			read : {
 * 				dwrFunction : DwrInterface.read
 *			}, 
 *			create : {
 *				dwrFunction : DwrInterface.create
 *				getDwrArgsFunction : function(trans) {
 *					return [trans.records];
 *				}
 *			}
 *		}
 *	});
 * </pre></code> 
 * @constructor
 * @param {Object} config The config object.
 */
Ext.ux.data.DwrProxy = function(config) {
	// Set apiActionToHandlerMap if its defined.
	// We do this manually since Ext.data.DataProxy doesn't call Ext.apply with the config object.
	if (config && config.apiActionToHandlerMap) {
		this.apiActionToHandlerMap = config.apiActionToHandlerMap;
		
		// Ext.data.DataProxy requires that an API action be defined under the "api" key.
		// If it isn't, an Ext.data.DataProxy.Error is thrown.
		// To avoid this, api is set to apiActionToHandlerMap since they share the same keys ("create", "read", "update", and "destroy").
		config.api = config.apiActionToHandlerMap;
	}
	Ext.ux.data.DwrProxy.superclass.constructor.call(this, config);
};
Ext.extend(Ext.ux.data.DwrProxy, Ext.data.DataProxy, {
	
	/**
	 * @cfg {Object} apiActionToHandlerMap.
	 * A map of {@link Ext.data.Api} action to a handler, where a handler can define:
	 * - dwrFunction : {Function} The DWR-generated function to call for the action.
	 * - getDwrArgsFunction : {Function} Function to call to generate the arguments for the dwrFunction.
	 *   This {@link Function} will be pass a {@link Ext.ux.data.DataProxyTransaction}.
	 *   If getDwrArgsFunction is defined, it is expected to return an Array or arguments in the order that the dwrFunction is needed.
	 *   This class will generate the DWR callback function.
	 * - getDwrArgsScope : {Object} The scope to execute getDwrArgsFunction.  Defaults to "this".
	 */
	apiActionToHandlerMap : {},
	
	/**
	 * DwrProxy implementation of {@link Ext.data.DataProxy#doRequest}.
	 * This implementation attempts to mirror {@link Ext.data.HttpProxy#doRequest} as much as possible.
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
	doRequest : function(action, records, params, reader, callback, scope, options) {
		var trans = new Ext.ux.data.DataProxyTransaction(action, records, params, reader, callback, scope, options);
		var apiActionHandler = this.apiActionToHandlerMap[action];
		if (!apiActionHandler) {
			throw new Exception('No API Action Handler defined for action: ' + action);
		}
		var dwrArgs = [];
		if (apiActionHandler.getDwrArgsFunction) {
			dwrArgs = apiActionHandler.getDwrArgsFunction.call(apiActionHandler.getDwrArgsScope || this, trans) || [];
		}
		dwrArgs.push(this.createCallback(trans));
		apiActionHandler.dwrFunction.apply(Object, dwrArgs); // the scope for calling the dwrFunction doesn't matter, so we simply set it to Object.
	},
	
	/**
	 * Helper method for doRequest which returns a callback function for a DWR request.
	 * The returned callback function in turn invokes the provided callback function.
	 * This mirrors HttpProxy#createCallsback.
	 * DWR is unique though in that it allows one to define a callback function for success and callback function for an exception.
	 * This exceptionHandler callback parallels Ext's "remote exception" case.
	 * This method thus returns two callback functions groupded as a single object that can be appended to the DWR function arguments as required by DWR.
	 * @param {Ext.ux.data.DataProxyTransaction} trans The arguments passed to {@link #doRequest}.
	 * @private
	 */
	createCallback : function(trans) {
		return {
			callback: function(response){
				if (trans.action === Ext.data.Api.actions.read) {
					this.onRead(trans, response);
				} else {
					this.onWrite(trans, response);
				}
			}.createDelegate(this),
			exceptionHandler : function(message, exception) {
				// The event is supposed to pass the response, but since DWR doesn't provide that to us, we pass the message.
				this.fireEvent("exception", this, 'response', trans.action, trans.options, message, exception);
				trans.callback.call(trans.scope, null, trans.options, false);
			}.createDelegate(this)
		};
	},

	/**
	 * Helper method for createCallback for handling the read action.
	 * After creating records from the provided response, it calls the provided callback function.
	 * This mirrors HttpProxy#onRead.
	 * @param {Ext.ux.data.DataProxyTransaction} trans The arguments passed to {@link #doRequest}.
	 * @param {Object} response The response from the DWR call.  This should be an Object which can be converted to {@link Ext.data.Records}.
	 * @private
	 */
	onRead : function(trans, response) {
		var readDataBlock;
		try {
			// Call readRecords verses read because read will attempt to decode the JSON,
			// but as this point DWR has already decoded the JSON.
			readDataBlock = trans.reader.readRecords(response);
		} catch(e) {
			this.fireEvent('exception', this, 'response', trans.action, trans.options, response, e);
			trans.callback.call(trans.scope, null, trans.options, false);
			return;
		}
		var success = readDataBlock[trans.reader.meta.successProperty];
		if (success === false) {
            this.fireEvent('exception', this, 'remote', trans.action, trans.options, response, null);
        } else {
            this.fireEvent("load", this, trans, trans.options);
        }
		trans.callback.call(trans.scope, readDataBlock, trans.options, success);
	},
	
	/**
     * Helper method for createCallback for handling the create, update, and delete actions.
	 * This mirrors HttpProxy#onWrite
     * @param {Ext.ux.data.DataProxyTransaction} trans The arguments passed to {@link #doRequest}.
	 * @param {Object} response The response from the DWR call.  This should be an Object which can be converted to {@link Ext.data.Records}.
     * @private
     */
    onWrite : function(trans, response) {
        var readDataBlock;
        try {
            readDataBlock = trans.reader.readResponse(trans.action, response);
        } catch (e) {
            this.fireEvent('exception', this, 'response', trans.action, trans.options, response, e);
            trans.callback.call(trans.scope, null, trans.options, false);
            return;
        }
		var success = readDataBlock[trans.reader.meta.successProperty];
		var records = readDataBlock[reader.meta.root];
        if (success === false) {
            this.fireEvent('exception', this, 'remote', action, o, res, rs);
        } else {
            this.fireEvent('write', this, action, readDataBlock[reader.meta.root], readDataBlock, trans.records, trans.options);
        }
        callback.call(callbackScope, readDataBlock[reader.meta.root], response, success);
    }
});

/**
 * @class Ext.ux.data.DataProxyTransaction
 * Ecapsolates the parameters passed to {@link Ext.data.DataProxy#request}.
 * @constructor
 * @param {String} action The crud action type (create, read, update, destroy).  Note: only "read" is currently supported.
 * @param {Ext.data.Record/Ext.data.Record[]} records If action is "read", records will be null.
 * @param {Object} params An object containing properties which are to be used as parameters for the request to the remote server.
 * @param {Ext.data.DataReader} reader The {@link Ext.data.DataReader} object which converts the server response into a "readDataBlock" (the result from calling {@link Ext.data.DataReader#read}).
 * @param {Function} callback A function to be called after the request.
 * The callback is passed the following arguments:<ul>
 * <li>readDataBlock: Data object from calling {@link Ext.data.DataReader#read}.</li>
 * <li>options: The options object (see below)</li>
 * <li>success: Boolean success indicator.</li>
 * </ul>
 * @param {Object} scope The scope in which to call the callback.
 * @param {Object} options An optional argument which is passed to the callback as its second parameter.
 */
Ext.ux.data.DataProxyTransaction = function(action, records, params, reader, callback, scope, options) {
	Ext.apply(this, {
        action : action,
		records : records,
		params : params,
		reader: reader,
        callback : callback,
        scope : scope,
        options : options
    });
};