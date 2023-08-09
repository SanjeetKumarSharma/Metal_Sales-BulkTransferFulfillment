/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType Suitelet
 
 * Created by Centric Consulting
 * Authors: Angela Brazil
 * 
 * Description: 
 * When the "Bulk Fulfill" button is selected in the Transfer Order form, load the line selection form
 */

 CONST_CLIENT_SCRIPT_PATH = './cen_bulkfill_entry_CS.js';

 define(['N/ui/serverWidget'], function(serverWidget) {

    function onRequest(context) {
        var request = context.request;
        var response  = context.response;
    
        var params = {
            item_id : request.parameters.item_id,
            location_id : request.parameters.item_name
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
            var item_id_field = form.addField({ id: 'custpage_item_id', label: "Item",  type: serverWidget.FieldType.SELECT, container: 'custpage_header_group' });
            var from_loc_field = form.addField({ id: 'custpage_location_id', label: "Location",  type: serverWidget.FieldType.SELECT, container: 'custpage_header_group' });
            from_loc_field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
            var to_loc_field = form.addField({ id: 'custpage_location_id', label: "Location",  type: serverWidget.FieldType.SELECT, container: 'custpage_header_group' });
            to_loc_field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
            var total_qty_field = form.addField({id: 'custpage_total_qty', label: "Total Quantity Selected", type: serverWidget.FieldTYpe.FLOAT, container: 'custpage_header_group'});
            total_qty_field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

            form.addSubmitButton({label: 'Save Lines'});
            form.addButton({id: 'btn_cancel', label: 'Cancel', functionName: 'onCancelClick'});

            //Add sublist to show transfer order lines available for selection
            var sublist = form.addSublist({
                id: 'custpage_to_request_lines',
                type: serverWidget.SublistType.LIST,
                label: 'Requested Material Lines',
                tab: 'custpage_to_request_lines'
            });

            //Note: Sublist will have no lines on initial load. Sublist lines will be populated after
            //the user selects an item in the item_id_field (see Client script)
            
        } catch (ex) {
            log.error(title + 'Exception', ex);
        } finally {
            return form;
        }
    }

    return {
        onRequest: onRequest
    };
 });