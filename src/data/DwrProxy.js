Ext.namespace("Ext.ux.data");

/**
 * @class Ext.ux.data.DwrProxy
 * @extends Ext.data.DataProxy
 * @author loeppky
 * An implementation of Ext.data.DataProxy that uses DWR to make a remote call.
 * Note that not all of Ext.data.DataProxy's configuration options make sense for Ext.ux.data.DwrProxy.
 * The following constructor sample code contains all the available options that can be set:
 * <code><pre>
 *	new Ext.ux.data.DwrProxy({
 *		// Defined by Ext.data.DataProxy
 *		apiActionToHanderMap : {
 *			read : {
 * 				dwrFunction : DwrInterface.read,
 *				// Define a custom function that passes the paging parameters to DWR.
 *				getDwrArgsFunction : function(trans) {
 *					var pagingParamNames = this.store.paramNames;
 *					var params = trans.params;
 *					return [params[pagingParamNames.start], params[pagingParamNames.limit]];
 *				},
 *				// The scope is set to "this" so that this store's paging parameter names can be accessed.
 *				getDwrArgsScope : this
 *			},
 *			// These aren't needed if only doing reading.
 *			create : {
 *				// Use the default function which will set the DWR args to an array of all the objects to create.
 *				dwrFunction : DwrInterface.create
 *			}, 
 *			update : {
 *				dwrFunction : DwrInterface.update
 *			}, 
 *			destroy : {
 *				dwrFunction : DwrInterface.destroy,
 *				// Define a custom funciton to pass a login and password, in addition to the objects to delete.
 *				getDwrArgsFunction : function(trans, recordDataArray) {
 *					return [recordDataArray, this.login, this.password];
 *				}
 *				getDwrArgsScope : this
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
	 * - dwrFunction : {Function} [Required] The DWR-generated function to call for the action. 
	 * - getDwrArgsFunction : {Function} [Optional] Function to call to generate the arguments for the dwrFunction.
	 *   This {@link Function} will be passed a {@link Ext.ux.data.DataProxyTransaction},
	 *   and if it's a write action, also the {@link Ext.data.Record#data} to write.
	 *   This getDwrArgsFunction must return an Array of arguments in the order needed by the dwrFunction.
	 *   This class will generate the DWR callback function (the final argument passed to the dwrFunction).
	 *   If no getDwrArgsFunction is defined, then for the read case no arguments will be passed to the dwrFunction.
	 *   In the write case, the array of {@link Ext.data.Record#data} will be passed.
	 * - getDwrArgsScope : {Object} [Optional] The scope to execute getDwrArgsFunction.  Defaults to "Object".
	 */
	apiActionToHandlerMap : {},
	
	/**
	 * DwrProxy implementation of {@link Ext.data.DataProxy#doRequest}.
	 * This implementation attempts to mirror {@link Ext.data.HttpProxy#doRequest} as much as possible.
	 * The getDwrArgsFunction is called for the corresponding action, 
	 * and then a request is made for the dwrFunction that corresponds with the provided action..
	 * @param {String} action See {@link Ext.data.DataProxy#request}.
	 * @param {Ext.data.Record/Ext.data.Record[]} records See {@link Ext.data.DataProxy#request}.
	 * @param {Object} params See {@link Ext.data.DataProxy#request}.
	 * @param {Ext.data.DataReader} reader See {@link Ext.data.DataProxy#request}.
	 * @param {Function} callback See {@link Ext.data.DataProxy#request}.
	 * @param {Object} scope See {@link Ext.data.DataProxy#request}.
	 * @param {Object} options See {@link Ext.data.DataProxy#request}.
	 * @private
	 */
	doRequest : function(action, records, params, reader, callback, scope, options) {
		var trans = new Ext.ux.data.DataProxyTransaction(action, records, params, reader, callback, scope, options);
		var apiActionHandler = this.apiActionToHandlerMap[action];
		if (!apiActionHandler) {
			throw new Exception('No API Action Handler defined for action: ' + action);
		}
		// Determing the getDwrArgsFunction to use, either a user-provided function or  a default function.
		var getDwrArgsFunction;
		var getDwrArgsScope = Object;
		if (apiActionHandler.getDwrArgsFunction) {
			getDwrArgsFunction = apiActionHandler.getDwrArgsFunction;
			getDwrArgsScope = apiActionHandler.getDwrArgsScope;
		} else {
			if (action === Ext.data.Api.actions.read) {
				getDwrArgsFunction = this.defaultGetDwrArgsFunctionForRead;
			} else {
				getDwrArgsFunction = this.defaultGetDwrArgsFunctionForWrite;
			}
		}
		var dwrArgs = getDwrArgsFunction.call(getDwrArgsScope, trans, this.getRecordDataArray(records)) || [];
		dwrArgs.push(this.createCallback(trans));
		apiActionHandler.dwrFunction.apply(Object, dwrArgs); // the scope for calling the dwrFunction doesn't matter, so we simply set it to Object.
	},
	
	defaultGetDwrArgsFunctionForRead : function(trans, recordDataArray) {
		return [];
	},
	
	defaultGetDwrArgsFunctionForWrite : function(trans, recordDataArray) {
		return [recordDataArray];
	},
	
	/**
	 * @param {Ext.data.Record[]} records
	 * @return {Object[]} Array containing the result of {@link Ext.data.Record#data}.
	 */
	getRecordDataArray : function(records) {
		var recordDataArray = [];
		Ext.each(records, function(record) {
			recordDataArray.push(record.data);
		});
		return recordDataArray;
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
		var readRecords = readDataBlock[trans.reader.meta.root];
		if (success === false) {
			this.fireEvent('exception', this, 'remote', trans.action, trans.options, response, trans.records);
		} else {
			this.fireEvent('write', this, trans.action, readRecords, readDataBlock, trans.records, trans.options);
		}
		trans.callback.call(trans.scope, readRecords, response, success);
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