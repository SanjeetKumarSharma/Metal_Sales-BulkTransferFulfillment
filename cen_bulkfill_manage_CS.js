/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 * 
 * Created by Centric Consulting
 * Authors: Angela Brazil
 * 
 * Description: 
 * 
*/

define(['N/runtime', 'N/record', 'N/search'],
function(runtime, record, search) {
    
    function pageInit(context){
        try{
            var params = {
                bulkFillRoles: runtime.getCurrentScript().getParameter({name: 'custscript_bulkfill_roles'}),
                userRole: runtime.getCurrentUser().role
            }
            log.debug('Params Check', params);

            if(bulkFillRoles.indexOf(userRole) >= 0 ){
                addBulkFillButton(context);
            }

            var currRec = context.currentRecord;
            lockAllLinkedLines(currRec);
        
        }catch(e){
            log.error('ERROR', e);
        }        
    }

    function addBulkFillButton(context){
        try {
            if ((_current_record.type != TRANS_UTILS.TRANSACTION_TYPES.SALES_ORDER) && (_current_record.type != TRANS_UTILS.TRANSACTION_TYPES.QUOTE)) {
                console.log(title + ' Un-Applicable Transction Type, EXIT');
                return;
            }

            var $ = jQuery,
            tr = $('#item_buttons > table > tbody > tr'),
            td = $('<td>').appendTo(tr),
            btnConf = $('<button type="button" class="btn-edit-config">').text('*NEW EDIT*').appendTo(td);

            btnConf.click(function () {
                bulkFulfillClick();
            });
        } catch (ex) {
            console.log(title + 'Exception: ' + ex.toString());
            log.error(title + 'Exception', ex);
        } finally {
            
        }
        
        var itemList = context.form.getSublist('item');
        
        itemList.addButton({
            id:'custpage_add_bulkfill_lines',
            label:'Bulk Fulfill',
            functionName:'addLines()'
        });
    }

    function bulkFulfillClick(item_id, item_name){
        var bulkfill_url = url.resolveScript({
            scriptId: 'customscript_bulkfill_manage_sl',
            deploymentId: 'customdeploy_cen_bulkfill_manage_sl',
            returnExternalUrl: false,
            params: {
                'item_id': item_id,
                'location_id': item_name
            }
        });
        window.open(bulkfill_url, "BULK TRANSFER FULFILLMENT", "popup=yes,width=900,height=700");
    }

    function lockAllLinkedLines(currRec){
        //STUB**********//
    }

    return {
        pageInit: pageInit
    }
});