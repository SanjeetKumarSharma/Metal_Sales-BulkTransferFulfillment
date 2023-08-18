/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType Suitelet
 
 * Created by Centric Consulting
 * Authors: Angela Brazil
 * 
 * Description: 
 * When the "Bulk Fulfill" button is selected in the Transfer Order form, load the line selection form.
 * Page also reloads whenever a new Item is selected.
 */

 CONST_CLIENT_SCRIPT_PATH = './cen_bulkfill_entry_CS.js';

 define(['N/ui/serverWidget'], function(serverWidget) {

    function onRequest(context) {
        var request = context.request;
        var response  = context.response;
    
        var params = {
            item : request.parameters.item,
            from_location : request.parameters.from_location,
            to_location: request.parameters.to_location
        };

        if (request.method === 'GET') {
            try {
                response.writePage(loadForm(params));
            } catch (ex) {
                log.error(title + 'Exception', ex);
            }
        } else if (request.method === 'POST') {
            try{
                response.write('<html><body><script>window.close(); </script></body></html>');
            } catch(ex){
                log.error(title + 'Exception', ex);
            }
        }
    }

    function loadForm(params) {

        var form = serverWidget.createForm({ title: 'Bulk Transfer Fulfillment Lines', hideNavBar: true });
        try {
            log.debug('Params', params);
            form.clientScriptModulePath = CONST_CLIENT_SCRIPT_PATH;

            //Add header fields. Option to select item is unlocked for entry, other fields are for reference only
            form.addFieldGroup({ id: 'custpage_header_group', label: ' ' });
            var item_field = form.addField({ id: 'custpage_item', label: "Item",  type: serverWidget.FieldType.SELECT, container: 'custpage_header_group' });
            item_field.defaultValue = params.item;
            
            var from_loc_field = form.addField({ id: 'custpage_location_id', label: "Location",  type: serverWidget.FieldType.SELECT, container: 'custpage_header_group' });
            from_loc_field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
            from_loc_field.defaultValue = params.from_location;
            
            var to_loc_field = form.addField({ id: 'custpage_location_id', label: "Location",  type: serverWidget.FieldType.SELECT, container: 'custpage_header_group' });
            to_loc_field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
            to_loc_field.defaultValue = params.to_location;
            
            var total_qty_field = form.addField({id: 'custpage_total_qty', label: "Total Quantity Selected", type: serverWidget.FieldTYpe.FLOAT, container: 'custpage_header_group'});
            total_qty_field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
            total_qty_field.defaultValue = 0;

            form.addButton({id: 'btn_cancel', label: 'Cancel', functionName: 'onCancelClick'});

            if(params.from_location && params.to_location){
                if(params.item){
                    //Do not add the submit button unless all parameters to populate the sublist are provided
                    form.addSubmitButton({label: 'Save Lines'});
                    
                    //Add sublist to show transfer order lines available for selection
                    var sublist = form.addSublist({
                        id: 'custpage_to_request_lines',
                        type: serverWidget.SublistType.LIST,
                        label: 'Requested Material Lines',
                        tab: 'custpage_to_request_lines'
                    });
                    
                    sublist = populateLineItems(sublist, params.item, params.from_location, params.to_location);
                } else {
                    var sublistMessage = form.addField({id: 'custpage_sublistmessage', type: serverWidget.FieldType.INLINEHTML, label: ''});
                    sublistMessage.defaultValue = 'Please select an Item from the dropdown.'
                }
            } else {
                var sublistMessage = form.addField({id: 'custpage_sublistmessage', type: serverWidget.FieldType.INLINEHTML, label: ''});
                sublistMessage.defaultValue = 'Missing location selection(s). Please close this window and return to the Transfer Order page. '
                + 'On the Transfer Order, select both the origin and destination locations for the material you wish to transfer. '
                + 'Then select the Bulk Fulfill button to return to this page.';                
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
     * @param {internalid} fromLoc 
     * @param {internalid} toLoc 
     * @returns modified sublist object
     */
    function populateLineItems(sublist, itemId, fromLoc, toLoc){

        //STUB
        //I will start from today onwards.

        return sublist
    }

    return {
        onRequest: onRequest
    };
 });