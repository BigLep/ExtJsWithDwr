import java.util.ArrayList;
import java.util.List;

import org.directwebremoting.annotations.DataTransferObject;
import org.directwebremoting.annotations.RemoteMethod;
import org.directwebremoting.annotations.RemoteProperty;
import org.directwebremoting.annotations.RemoteProxy;
import org.directwebremoting.convert.ObjectConverter;

/**
 * Example DWR handler for the Ext.ux.data.DwrProxy example.
 */
@RemoteProxy(name = "DwrProxyExampleInterface")
public class DwrProxyExample {

	/**
	 * @param baseString Prefix to use in the dummy data rows generated.
	 * @param numberOfRows The number of dummy rows to generate.
	 * @return An array of first-name/last-name pairs that are consumable by Ext.data.JsonReader.
	 */
	@RemoteMethod
	public ExtJsonReaderInput getGridData(String baseString, int numberOfRows) {
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
			employees.add(new Employee(baseString + "FirstName" + i, baseString + "LastName" + i));
		}
		return new ExtJsonReaderInput(employees);
	}
	
	/**
	 * Dummy class that corresponds with one row in the Ext.grid.GridPanel.
	 */
	@DataTransferObject(converter = ObjectConverter.class)
	public static class Employee {
		
		@RemoteProperty
		public String firstName;
		
		@RemoteProperty
		public String lastName;
		
		public Employee(String firstName, String lastName) {
			this.firstName = firstName;
			this.lastName = lastName;
		}
	}
	
	/**
	 * Wrapper around a {@link List} of {@link Employee}s.
	 * An Ext.data.JsonReader expects an object that as a property called "rows",
	 * which is the array of data to create records from for the Ext.grid.GridPanel.
	 * Example:
	 * {
	 *   rows : [{
	 *     firstName : 'firstName1',
	 *     lastName : 'lastName1'
	 *   }, {
	 *     firstName : 'firstName2',
	 *     lastName : 'lastName2'
	 *   }]
	 * }
	 */
	@DataTransferObject(converter = ObjectConverter.class)
	public static class ExtJsonReaderInput {
		
		@RemoteProperty
		public List<Employee> rows;
		
		public ExtJsonReaderInput(List<Employee> rows) {
			this.rows = rows;
		}
	}
}
