package com.github.extjswithdwr.examples.dwrproxy;

import org.directwebremoting.annotations.DataTransferObject;
import org.directwebremoting.annotations.RemoteProperty;
import org.directwebremoting.convert.ObjectConverter;

/**
 * Dummy class that corresponds with one row in the Ext.grid.GridPanel.
 */
@DataTransferObject(converter = ObjectConverter.class)
public class Employee {
	
	@RemoteProperty
	public int id;
	
	@RemoteProperty
	public String firstName;
	
	@RemoteProperty
	public String lastName;
	
	public Employee(int id, String firstName, String lastName) {
		this.id = id;
		this.firstName = firstName;
		this.lastName = lastName;
	}
}

