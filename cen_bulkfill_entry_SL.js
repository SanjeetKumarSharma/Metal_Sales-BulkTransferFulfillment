/**
 *@NApiVersion 2.1
 *@NModuleScope Public
 *@NScriptType Suitelet
 
 * Created by Centric Consulting
 * Authors: SanjeetKumar Sharma and Angela Brazil
 * 
 * Description: 
 * When the "Bulk Fulfill" button is selected in the Transfer Order form, load the line selection form.
 * Page also reloads whenever a new Item is selected.
 */
 var CONST_CLIENT_SCRIPT_PATH = 'SuiteScripts/cen_bulkfill_entry_CS.js';
 var clientScriptFileID = 27167004;
 define(['N/ui/serverWidget', 'N/search', 'N/runtime'], 
 function(serverWidget, search, runtime) {
 
    var NEW_ALBANY_LOC = '125';
    
    function onRequest(context) {
         var request = context.request;
         var response = context.response;
 
         var params = {
             item: request.parameters.item,
             from_location: request.parameters.from_location,
             to_location: request.parameters.to_location
         };

         if(params.from_location == NEW_ALBANY_LOC){
            //Only send New Albany as the from location to the search
            //But wrap the value in an array to match the expected input type
            var fromLocList = new Array;
            fromLocList.push(params.from_location);

            //For New Albany, create quantity delta lines for all differences
            params.over_fulfill_margin = 0;
            params.over_fulfill_margin = 0;
         } else {
            //Any corporate location can be selected
            var fromLocList = getCorporateSupplyLocations();

            params.under_fulfill_margin = runtime.getCurrentScript().getParameter({name: 'custscript_underfulfillment_margin'});
            params.over_fulfill_margin = runtime.getCurrentScript().getParameter({name: 'custscript_overfulfillment_margin'});
         }
         params.from_location = fromLocList;
         log.debug('params check', params);
 
         if (request.method === 'GET') {
             try {
                 response.writePage(loadForm(params));
             } catch (ex) {
                 log.error(title + 'Exception', ex);
             }
         } else if (request.method === 'POST') {
             try {
                 response.write('<html><body><script>window.close(); </script></body></html>');
             } catch (ex) {
                 log.error(title + 'Exception', ex);
             }
         }
     }
 
     function loadForm(params) {
 
         var form = serverWidget.createForm({
             title: 'Bulk Transfer Fulfillment Lines',
             hideNavBar: true
         });
         try {
             log.debug('Params', params);
             form.clientScriptModulePath = CONST_CLIENT_SCRIPT_PATH;
 
             //Add header fields. Option to select item is unlocked for entry, other fields are for reference only
             form.addFieldGroup({
                 id: 'custpage_header_group',
                 label: ' '
             });
             var item_field = form.addField({
                 id: 'custpage_item',
                 label: "Item",
                 type: serverWidget.FieldType.SELECT,
                 source : 'item',
                 container: 'custpage_header_group'
             });
             item_field.defaultValue = params.item;

             //If all corporate locations are shown, display that as a text message
             //If only one location is being used, display that location name using the internal id
             if(params.from_location.length > 1){
                var from_loc_field = form.addField({
                    id: 'custpage_from_location_id',
                    label: "From Location",
                    type: serverWidget.FieldType.TEXT,
                    source : 'location',
                    container: 'custpage_header_group'
                });
                from_loc_field.defaultValue = "All Corporate Supply Locations";
             } else {
                //Convert internalid to name by using a select field
                var from_loc_field = form.addField({
                    id: 'custpage_from_location_id',
                    label: "From Location",
                    type: serverWidget.FieldType.SELECT,
                    source : 'location',
                    container: 'custpage_header_group'
                });
                from_loc_field.defaultValue = params.from_location[0];
             }
             from_loc_field.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.INLINE
            });
             
 
             var to_loc_field = form.addField({
                 id: 'custpage_to_location_id',
                 label: "To Location",
                 type: serverWidget.FieldType.SELECT,
                 source : 'location',
                 container: 'custpage_header_group'
             });
             to_loc_field.updateDisplayType({
                 displayType: serverWidget.FieldDisplayType.INLINE
             });
             to_loc_field.defaultValue = params.to_location;
 
             var total_qty_field = form.addField({
                 id: 'custpage_total_qty',
                 label: "Total Quantity Selected",
                 type: serverWidget.FieldType.FLOAT,
                 container: 'custpage_header_group'
             });
             total_qty_field.updateDisplayType({
                 displayType: serverWidget.FieldDisplayType.INLINE
             });
             total_qty_field.defaultValue = 0;

             var underfulfill_field = form.addField({
                id: 'custpage_under_fulfill_margin',
                label: "Underfulfillment Margin",
                type: serverWidget.FieldType.FLOAT,
                container: 'custpage_header_group'
            });
            underfulfill_field.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
            total_qty_field.defaultValue = params.under_fulfill_margin;

            var overfulfill_field = form.addField({
                id: 'custpage_over_fulfill_margin',
                label: "Overfulfillment Margin",
                type: serverWidget.FieldType.FLOAT,
                container: 'custpage_header_group'
            });
            overfulfill_field.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
            total_qty_field.defaultValue = params.over_fulfill_margin;
 
             form.addButton({
                 id: 'btn_cancel',
                 label: 'Cancel',
                 functionName: 'onCancelClick'
             });
 
             if (params.from_location && params.to_location) {
                 if (params.item) {
                     //Do not add the submit button unless all parameters to populate the sublist are provided
                     form.addSubmitButton({
                         label: 'Save Lines'
                     });
 
                     //Add sublist to show transfer order lines available for selection
                     var sublist = form.addSublist({
                         id: 'custpage_to_request_lines',
                         type: serverWidget.SublistType.INLINEEDITOR,
                         label: 'Requested Material Lines'
                     });
 
                     sublist = populateLineItems(sublist, params.item, params.from_location, params.to_location);
 
                 } 
             } else {
                 var sublistMessage = form.addField({
                     id: 'custpage_sublistmessage',
                     type: serverWidget.FieldType.INLINEHTML,
                     label: ' '
                 });
                 sublistMessage.defaultValue = 'Missing location selection(s). Please close this window and return to the Transfer Order page. ' +
                     'On the Transfer Order, select both the origin and destination locations for the material you wish to transfer. ' +
                     'Then select the Bulk Fulfill button to return to this page.';
             }
 
         } catch (ex) {
             log.error(title + 'Exception', ex);
         } finally {
             return form;
         }
     }
 
     /**
      * Search all transfer order lines that match the item, from location and to location
      * Sort by transfer order date, with the oldest results first. Return up to 50 results
      * Populate each result into the sublist, with a checkbox field added so the user can select
      * the lines they wish to copy, and Quantity to Fulfill input field added so the user can
      * override the original quantity. Quantity to Fulfill should default to the original line quantity.
      * @param {object} sublist 
      * @param {internalid} itemId 
      * @param {internalid} fromLocList 
      * @param {internalid} toLoc 
      * @returns modified sublist object
      */
     function populateLineItems(sublist, itemId, fromLocList, toLoc) {
        sublist.addField({
            id: 'custpage_checkbox',
            type: serverWidget.FieldType.CHECKBOX,
            label: 'Include Line'
        });

        //Transfer Order data fields should not be editable
        //Store the creation result so that additional properties can be set
        var toNumField = sublist.addField({
            id: 'custpage_to_number',
            type: serverWidget.FieldType.TEXT,
            label: 'TO #'
        });
        toNumField.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});

        //Internal id and line unique key fields will be used later to link the request and
        //fulfillment TOs together
        var toIdField = sublist.addField({
            id: 'custpage_to_id',
            type: serverWidget.FieldType.TEXT,
            label: 'Transfer Order Id'
        });
        toIdField.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});

        var lineKeyField = sublist.addField({
            id: 'custpage_line_key_ref',
            type: serverWidget.FieldType.TEXT,
            label: 'TO #'
        });
        lineKeyField.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});

        var dateCreatedField = sublist.addField({
            id: 'custpage_date',
            type: serverWidget.FieldType.DATE,
            label: 'Date Created'
        });
        dateCreatedField.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});

        var expectedDateField = sublist.addField({
            id: 'custpage_expected_receipt_date',
            type: serverWidget.FieldType.DATE,
            label: 'Expected Receipt Date'
        });
        expectedDateField.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});

        var originalQuantityField = sublist.addField({
            id: 'custpage_quantity',
            type: serverWidget.FieldType.FLOAT,
            label: 'Quantity Requested'
        });
        originalQuantityField.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
        
        //Quantity to Fulfill is a user entry field. It defaults to the original requested quantity
        sublist.addField({
            id: 'custpage_quantity_to_fullfill',
            type: serverWidget.FieldType.FLOAT,
            label: 'Quantity to Fullfill'
        });

        //Search item on the basis of from location,to location and item

        var transerOrdLineItem = search.create({
            type: "transferorder",
            filters: [
                ["type", "anyof", "TrnfrOrd"], "AND",
                ["status","anyof","TrnfrOrd:B"], "AND", //Pending Fulfillment
                ["mainline", "is", "F"], "AND", 
                ["transactionlinetype","anyof","ITEM"], "AND",
                ["closed", "is", "F"], "AND",
                ["location", "anyof", ...fromLocList],"AND",
                ["transferlocation", "anyof", toLoc],"AND",                
                ["item", "anyof", itemId]
            ],
            columns: [
                "tranid",
                "internalid",
                "lineuniquekey",
                "trandate",
                search.createColumn({name: "expectedreceiptdate",sort: search.Sort.ASC}),
                "quantity"                
            ]
        });

        var resultRange = transerOrdLineItem.run().getRange({start: 0,end: 50});
        log.debug('result count', resultRange.length);

        for (var k = 0; k < resultRange.length; k++) {

            sublist.setSublistValue({
                id: 'custpage_to_number',
                line: k,
                value: resultRange[k].getValue('tranid')
            });
            sublist.setSublistValue({
                id: 'custpage_to_id',
                line: k,
                value: resultRange[k].getValue('internalid')
            });
            sublist.setSublistValue({
                id: 'custpage_line_key_ref',
                line: k,
                value: resultRange[k].getValue('lineuniquekey')
            });
            sublist.setSublistValue({
                id: 'custpage_date',
                line: k,
                value: resultRange[k].getValue('trandate')
            });
            //Note: expected receipt date can be blank. If script tries to set a blank value
            //it stops further execution. Only set the value after validating that it exists.
            var expectedDate = resultRange[k].getValue('expectedreceiptdate');
            if(expectedDate){
                sublist.setSublistValue({
                    id: 'custpage_expected_receipt_date',
                    line: k,
                    value: resultRange[k].getValue('expectedreceiptdate')
                });
            }

            var requestedQuantity = resultRange[k].getValue('quantity');
            log.debug('requestedQuantity', requestedQuantity);
            sublist.setSublistValue({
                id: 'custpage_quantity',
                line: k,
                value: requestedQuantity * -1
            });
            sublist.setSublistValue({
                id: 'custpage_quantity_to_fullfill',
                line: k,
                value: requestedQuantity * -1
            });
        }

        return sublist
     }

     function getCorporateSupplyLocations(){
        var locationList = [];

        var locationResults = search.create({
            type: 'location',
            filters: [
                ["custrecord_corp_supply","is","T"]
            ]
        }).run();

        locationResults.each(function(result){
            locationList.push(result.id);

            //Process next result
            return true
        })

        return locationList
     }
 
     return {
         onRequest: onRequest
     };
 });
