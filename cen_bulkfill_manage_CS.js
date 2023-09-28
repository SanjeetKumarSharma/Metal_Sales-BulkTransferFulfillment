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

define(['N/url','N/ui/dialog','N/currentRecord'],
function(url,dialog,currentRecord) {
    
    //Global objects used to revert item sublist selections on linked lines
    var ITEM_MEMORY = {};
    var QUANTITY_MEMORY = {};
    
    function pageInit(context){
        //debugger;
        var currRec = context.currentRecord;

        if(foundLinkedLines(currRec)){
            //If at least one line was found and locked, also lock "to location" header field
            //Do not lock from location, because fulfillment source may change
            var toLocField = currRec.getField('transferlocation');
            toLocField.isDisabled = true;

            populateSublistMemory(currRec, ITEM_MEMORY, QUANTITY_MEMORY);
        }
    }

    function fieldChanged(context){
        var currRec = context.currentRecord;
        if(context.sublistId == 'item'){
            var linkedLineKey=currRec.getCurrentSublistValue({sublistId: 'item', fieldId: 'custcol_cen_bulkfulfill_linklinekey'});
            
            if(isEmpty(linkedLineKey)){
                //Do not protect any fields on lines that aren't linked to another transfer order
                return
            }

            if(context.fieldId == 'item'){
                origItem = ITEM_MEMORY[linkedLineKey];
                newItem = currRec.getCurrentSublistValue({sublistId: 'item', fieldId: 'item'});
                console.log('Changed item field ' + origItem + ' --> ' + newItem);
                if(origItem && newItem != origItem){
                    dialog.alert({
                        title: 'Bulk Transfer Fulfillment',
                        message: 'This line is linked to a request line on another Transfer Order. Item cannot be modified.' 
                    });
                    currRec.setCurrentSublistValue({sublistId: 'item', fieldId: 'item', value: origItem});
                }
            }
            
            if(context.fieldId == 'quantity'){
                var initQuantity = QUANTITY_MEMORY[linkedLineKey];
                var newQuantity = currRec.getCurrentSublistValue({sublistId: 'item', fieldId: 'quantity'});
                console.log('Changed quantity field ' + initQuantity + ' --> ' + newQuantity);
                if(initQuantity && newQuantity != initQuantity){
                    dialog.alert({
                        title: 'Bulk Transfer Fulfillment',
                        message: 'This line is linked to a request line on another Transfer Order. Quantity cannot be modified.' 
                    });
                    currRec.setCurrentSublistValue({sublistId: 'item', fieldId: 'quantity', value: initQuantity});
                }
            }
            
            if(context.fieldId == 'custcol_cen_bulkfulfill_linklinekey'){
                //When a new linked line is added, remember the item selected at the time of addition
                var selectedItem = currRec.getCurrentSublistValue({sublistId: 'item', fieldId: 'item'});
                var selectedQuantity = currRec.getCurrentSublistValue({sublistId: 'item', fieldId: 'quantity'});
                ITEM_MEMORY[linkedLineKey] = selectedItem;
                QUANTITY_MEMORY[linkedLineKey] = selectedQuantity;
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
     * Detects if one or more lines in the record is linked to another transfer order
     * @param {*} currRec 
     */
    function foundLinkedLines(currRec){
        
        //Iterate through the item sublist on the current record until at least one linked line is found
        for(var i = 0; i<currRec.getLineCount({sublistId: 'item'}); i++){
            //If the Request TO, Fulfillment TO, or Line Unique Key fields are populated, consider it a linked line
            var requestTo= currRec.getSublistValue({sublistId: 'item', fieldId: 'custcol_cen_bulkfulfill_requestto', line: i});
            var fullfillmentTo=currRec.getSublistValue({sublistId: 'item', fieldId: 'custcol_cen_bulkfulfill_fulfillto', line: i});
            var lineUniqueKey=currRec.getSublistValue({sublistId: 'item', fieldId: 'custcol_cen_bulkfulfill_linklinekey', line: i});
            
            if(!isEmpty(requestTo) || !isEmpty(fullfillmentTo) || !isEmpty(lineUniqueKey)){
                return true
            }
        }
        
        //No linked lines found
        return false            
    }

    function populateSublistMemory(currRec, ITEM_MEMORY, QUANTITY_MEMORY){
        //Iterate through the item sublist on the current record and document the item field selections to be preserved
        for(var i = 0; i<currRec.getLineCount({sublistId: 'item'}); i++){
            var linkedLineKey=currRec.getSublistValue({sublistId: 'item', fieldId: 'custcol_cen_bulkfulfill_linklinekey', line: i});
            
            if(!isEmpty(linkedLineKey)){
                //For any linked lines found, record the starting item selection
                var selectedItem = currRec.getSublistValue({sublistId: 'item', fieldId: 'item', line: i});
                var selectedQuantity = currRec.getSublistValue({sublistId: 'item', fieldId: 'quantity', line: i});
                ITEM_MEMORY[linkedLineKey] = selectedItem;
                QUANTITY_MEMORY[linkedLineKey] = selectedQuantity;
            }
        }
        console.log('Item Memory: ' + JSON.stringify(ITEM_MEMORY));
        console.log('Quantity Memory: ' + JSON.stringify(QUANTITY_MEMORY));
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