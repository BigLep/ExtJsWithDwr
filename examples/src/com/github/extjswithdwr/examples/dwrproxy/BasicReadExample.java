package com.github.extjswithdwr.examples.dwrproxy;
import java.util.ArrayList;
import java.util.List;

import org.directwebremoting.annotations.RemoteMethod;
import org.directwebremoting.annotations.RemoteProxy;

import com.github.extjswithdwr.JsonReaderResponse;

/**
 * Example DWR handler for the Ext.ux.data.DwrProxy example.
 */
@RemoteProxy(name = "BasicReadExampleInterface")
public class BasicReadExample {

	/**
	 * @param baseString Prefix to use in the dummy data rows generated.
	 * @param numberOfRows The number of dummy rows to generate.
	 * @return An array of first-name/last-name pairs that are consumable by Ext.data.JsonReader.
	 */
	@RemoteMethod
	public JsonReaderResponse<Employee> getGridData(String baseString, int numberOfRows) {
		// Validate the input:
		// Grab the first 10 characters of the baseString.
		baseString = baseString == null ? "" : baseString;
		baseString = baseString.substring(0, Math.min(baseString.length(), 10));
		// Force numberOfRows to a value from 1-1000.
		numberOfRows = Math.max(numberOfRows, 1);
		numberOfRows = Math.min(numberOfRows, 1000);
		List<Employee> employees = new ArrayList<Employee>(numberOfRows);
		// Create dummy objects.
		for (int i = 0; i < numberOfRows; i++) {
			employees.add(new Employee(i, baseString + "FirstName" + i, baseString + "LastName" + i));
		}
		return new JsonReaderResponse<Employee>(employees);
	}
}
