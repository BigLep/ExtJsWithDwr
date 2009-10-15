package com.github.extjswithdwr;

import java.util.List;

import org.directwebremoting.annotations.DataTransferObject;
import org.directwebremoting.annotations.RemoteProperty;
import org.directwebremoting.convert.ObjectConverter;

/**
 * Creates a response that can be consumed by an Ext.data.JsonReader.
 * The client-side Ext.data.JsonReader must have the "root" property set to "objectsToConvertToRecords".
 * Note: Ext documentation often uses "rows" for this property, but "objectsToConvertToRecords" is more clear.
 * Example Ext.data.JsonReader configuration:
 * {
 * 	root : 'objectsToConvertToRecords'
 * }
 * If the parameterized type has two properties "field1" and "field2", then when an instance of this class is read by the client,
 * it will look like:
 *	{
 *		objectsToConvertToRecords : [
 *			{
 *				field1 : 'value',
 *				field2 : 'value',
 *			}, {
 *				field1 : 'value',
 *				field2 : 'value',
 *			}
 *		],
 *		success : true
 * }
 * @param <T> Type of Objects that will be converted to Ext.data.Records by the client-side Ext.data.DataReader.
 */
@DataTransferObject(converter = ObjectConverter.class)
public class JsonReaderResponse<T> {

	@RemoteProperty
	public List<T> objectsToConvertToRecords;
	
	/**
	 * This property name corresponds with the default for Ext.data.JsonReader.successProperty.
	 */
	@RemoteProperty
	public boolean success;
	
	public JsonReaderResponse(List<T> objectsToConvertToRecords) {
		this.objectsToConvertToRecords = objectsToConvertToRecords;
		success = true;
	}
	
	public JsonReaderResponse() {
		this.objectsToConvertToRecords = null;
		success = false;
	}
}
