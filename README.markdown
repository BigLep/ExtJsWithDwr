## Purpose ##
This project is intended host tools for integrating DWR with ExtJS.

## About this branch ##
This branch corresponds with integrating DWR with ExtJs 2.x.  

Note: there is no "master" branch.  Instead, development is done on the branches that correspond with a specific Ext JS version.
For example, branch "v2" corresponds with work to integrate DWR with Ext JS version 2.x.

## Conventions ##
The project aims to mirror the conventions laid out by ExtJS.  As a result, all JavaScript source is within the "source" directory.  
Examples are within the "example" directory. 

### JavaScript ###
All extensions are prefixed with *Ext.ux*.  If a class extends another class, then the packaging should look similar.  
For example, DwrProxy extends Ext.data.DataProxy, thus its complete path is Ext.ux.data.DwrProxy.  
As with Ext, camel casing is used, even with abbreviations (e.g., DwrProxy instead of DWRProxy).

## Support ##
If you find an issue, please [create a new one](http://github.com/BigLep/ExtJsWithDwr/issues).  
Questions should be raised in the corresponding Ext forum threads:
* Ext.ux.data.DwrProxy: [http://extjs.com/forum/showthread.php?t=23884]

## License ##
The extensions within this project for integrating ExtJS and the corresponding extensions are distributed using the [Apache Software License v2](http://www.apache.org/licenses/LICENSE-2.0.html).  The external jars found with the examples (e.g., DWR and Apache Commons logging) are distributed under their corresponding licenses.

## Donations ##
Donations are gladly accepted through [Pledgie](http://pledgie.com/campaigns/4494).  100% of donations received will in turn be turned into micro-finance loans for the developing world through [Kiva](http://kiva.org) using our [Kiva account](http://www.kiva.org/lender/karaandsteve). 

## Project Links ##
* [DWR](http://directwebremoting.org/)
* [ExtJs](http://extjs.com)
