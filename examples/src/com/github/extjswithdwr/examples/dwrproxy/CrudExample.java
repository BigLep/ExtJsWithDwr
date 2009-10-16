package com.github.extjswithdwr.examples.dwrproxy;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import org.directwebremoting.annotations.RemoteMethod;
import org.directwebremoting.annotations.RemoteProxy;

import com.github.extjswithdwr.JsonReaderResponse;

/**
 * Example DWR handler for the Ext.ux.data.DwrProxy example.
 */
@RemoteProxy(name = "CrudExampleInterface")
public class CrudExample {

	private static final AtomicInteger counter = new AtomicInteger();
	
	/**
	 * @param baseString Prefix to use in the dummy data rows generated.
	 * @param numberOfRows The number of dummy rows to generate.
	 * @return An array of first-name/last-name pairs that are consumable by Ext.data.JsonReader.
	 */
	@RemoteMethod
	public JsonReaderResponse<Employee> read() {
		List<Employee> employees = new ArrayList<Employee>();
		// Create dummy objects.
		for (int i = 0; i < 10; i++) {
			int id = getNextId();
			employees.add(new Employee(id, "FirstName" + id, "LastName" + id));
		}
		return new JsonReaderResponse<Employee>(employees);
	}
	
	@RemoteMethod
	public JsonReaderResponse<Employee> create(List<Employee> employees) {
		for (Employee employee : employees) {
			employee.id = getNextId();
		}
		return new JsonReaderResponse<Employee>(employees);
	}
	
	@RemoteMethod
	public JsonReaderResponse<Employee> update(List<Employee> employees) {
		return new JsonReaderResponse<Employee>(employees);
	}
	
	@RemoteMethod
	public JsonReaderResponse<Employee> destroy(List<Employee> employees) {
		return new JsonReaderResponse<Employee>(employees);
	}
	
	private int getNextId() {
		return counter.getAndIncrement();
	}
}
