/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 * 
 * Created by Centric Consulting
 * Authors: Angela Brazil
 * 
 * Description: Manages client side functions related to bulk fulfillment in the Transfer Order form
 * Adds button to open the Suitelet and controls functionality of lines that have been cross-linked
*/

define(['N/record','N/url','N/ui/dialog','N/currentRecord'],
function(record,url,dialog,currentRecord) {
    
    function pageInit(context){
        //debugger;
        var currRec = context.currentRecord;
        
        var foundLocks = lockAllLinkedLines(currRec);

        if(foundLocks){
            //If at least one line was found and locked, also lock the header location fields
            var locationField = currRec.getField('location');
            locationField.isDisabled = true;

            var toLocField = currRec.getField('transferlocation');
            toLocField.isDisabled = true;
        }
    }

    function fieldChanged(context){
        var currRec = context.currentRecord;
        if(context.sublistId == 'item' && context.fieldId == 'quantity'){
            var initQuantity = currRec.getCurrentSublistValue({sublistId: 'item', fieldId: 'initquantity'});
            var newQuantity = currRec.getCurrentSublistValue({sublistId: 'item', fieldId: 'quantity'});
            console.log('Changed quantity field ' + initQuantity + ' --> ' + newQuantity);
            if(newQuantity != initQuantity){
                dialog.alert({
                    title: 'Bulk Transfer Fulfillment',
                    message: 'This line is linked to a request line on another Transfer Order. Quantity cannot be modified.' 
                });
                currRec.setCurrentSublistValue({sublistId: 'item', fieldId: 'quantity', value: initQuantity});
            }
        }
    }

    function validateDelete(context){
        var currRec = context.currentRecord;
        console.log('Validate Delete');

        if(context.sublistId == 'item'){
            var fulfillmentTOid = currRec.getCurrentSublistValue({sublistId: 'item', fieldId: 'custcol_cen_bulkfulfill_fulfillto'});
            var requestTOid = currRec.getCurrentSublistValue({sublistId: 'item', fieldId: 'custcol_cen_bulkfulfill_requestto'});

            if(fulfillmentTOid){
                //This line is linked to a fulfillment transfer order line
                //Warn the user tha this line has already been fulfilled
                dialog.alert({
                    title: 'Bulk Transfer Fulfillment',
                    message: 'This line is linked to a fulfillment Transfer Order and cannot be modified.' 
                });

                //Do not allow the delete action to proceed
                return false
            } else if(requestTOid){
                //Moved reopen closed line function to beforeSubmit action. 
                //If reopening fails, all record changes will not be saved
                return true
            } else {
                return true
            }
        }
    }

    /**
     * Opens the Bulk Fulfillment line selection Suitelet. Called when the "Bulk Fulfill" button is selected
     */
    function bulkFulfillClick(){
        var currRec = currentRecord.get();
        var fromLocation = currRec.getValue('location');
        var toLocation = currRec.getValue('transferlocation');
        
        var bulkfill_url = url.resolveScript({
            scriptId: 'customscript_cen_blk_fulfill',
            deploymentId: 'customdeploy1',
            returnExternalUrl: false,
            params: {
                'from_location': fromLocation,
                'to_location': toLocation
            }
        });
        window.open(bulkfill_url, "BULK TRANSFER FULFILLMENT", "popup=yes,width=900,height=700");
    }

    /**
     * Prevents changes to any lines on the current record that have been cross-linked during
     * the bulk fulfillment process. If a reference is recorded to either a request or fulfillment
     * transfer order, the line is locked
     * @param {*} currRec 
     */
    function lockAllLinkedLines(currRec){
        var foundLocks = false;
        
        //Iterate through the item sublist on the current record
        for(var i = 0; i<currRec.getLineCount({sublistId: 'item'}); i++){
            //If the Request TO, Fulfillment TO, or Line Unique Key fields are populated, lock the line
            var requestTo= currRec.getSublistValue({sublistId: 'item', fieldId: 'custcol_cen_bulkfulfill_requestto', line: i});
            var fullfillmentTo=currRec.getSublistValue({sublistId: 'item', fieldId: 'custcol_cen_bulkfulfill_fulfillto', line: i});
            var lineUniqueKey=currRec.getSublistValue({sublistId: 'item', fieldId: 'custcol_cen_bulkfulfill_linklinekey', line: i});
            
            if(!isEmpty(requestTo) || !isEmpty(fullfillmentTo) || !isEmpty(lineUniqueKey)){
                foundLocks = true;
                //Loop through the fields in the line and change the display type to Disabled so that no edits can be made
                //var ITEM_FIELD_LIST = ["amount","amounthasbeenset","backordered","billvariancestatusallbook","binitem","commitinventory","commitmentfirm","costingmethod","custcol_cen_bulkfulfill_linklinekey","custcol_cen_bulkfulfill_requestto","custcol_cen_bulkfulfill_requestto_display","custcol_oz_item_class","custcol_oz_itemtype","ddistrib","description","fulfillable","groupclosed","id","includegroupwrapper","initquantity","inventorydetailavail","isclosed","isnoninventory","isnumbered","isserial","item","item_display","itempacked","itempicked","itemtype","line","lineuniquekey","linked","linkedordbill","linkedshiprcpt","locationusesbins","noprint","oldcommitmentfirm","olditemid","onorder","printitems","quantity","quantityavailable","quantitycommitted","quantityfulfilled","quantitypacked","quantitypicked","quantityreceived","rate","sys_id","sys_parentid","unitconversionrate","units","units_display"];
                //var ITEM_FIELD_LIST = ["item", "quantity", "initquantity"];
                //NOTE: setting isDisabled to true on the quantity field appears to have no effect.
                var ITEM_FIELD_LIST = ["item"];
                console.log("Locking line fields for linked Transfer Order: Line " + i + "; Fields: " + JSON.stringify(ITEM_FIELD_LIST));
                
                for (var f in ITEM_FIELD_LIST) {
                    //Access the page elements by field name and line number to avoid locking the sublist field on all lines
                    var targetField = currRec.getSublistField({
                        sublistId: 'item',
                        fieldId: ITEM_FIELD_LIST[f],
                        line: i
                    });

                    if(targetField){
                        targetField.isDisabled = true;
                        console.log('Field locked', ITEM_FIELD_LIST[f] + ' : ' + JSON.stringify(targetField));
                    } else {
                        console.log('Field not found for locking ' + ITEM_FIELD_LIST[f]);
                    }
                    
                }
            }
        }
        return foundLocks            
    }

    function isEmpty(stValue) {
        if ((stValue === '') || (stValue == null) || (stValue == undefined)) {
            return true;
        } else {
            if (typeof stValue == 'string') {
                if ((stValue == '')) {
                    return true;
                }
            } else if (typeof stValue == 'object') {
                if (stValue.length == 0 || stValue.length == 'undefined') {
                    return true;
                }
            }
    
            return false;
        }
    }

    return {
         pageInit: pageInit,
         fieldChanged: fieldChanged,
         validateDelete: validateDelete,
         bulkFulfillClick: bulkFulfillClick
    }
});