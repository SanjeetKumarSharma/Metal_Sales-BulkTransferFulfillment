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

define(['N/runtime','N/record','N/url','N/error','N/ui/dialog'],
function(runtime,record,url,error,dialog) {
    
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

    function validateDelete(context){
        var currRec = context.currentRecord;

        if(context.sublistId == 'item'){
            var fulfillmentTOid = currRec.getCurrentSublistValue({sublistId: 'item', fieldId: 'custcol_cen_bulkfulfill_fulfillto'});
            var requestTOid = currRec.getCurrentSublistValue({sublistId: 'item', fieldId: 'custcol_cen_bulkfulfill_requestto'});

            if(fulfillmentTOid){
                //This line is linked to a fulfillment transfer order line
                //Warn the user tha this line has already been fulfilled
                //*STUB********
                /*throw error.create({
                    name: 'LINKED_TO_FULFILLMENT_TO',
                    message: 'This line has already fulfilled'
                 });*/
                 dialog.alert({
                    title: 'Linekd to Fulfillment Transfer Order',
                    message: 'This line has already fulfilled.' 
                }).then(success).catch(failure);

                //Do not allow the delete action to proceed
                return false
            } else if(requestTOid){
                try{
                    //Reopen the closed line on the request TO
                    var linkedLineKey = currRec.getCurrentSublistValue({sublistId: 'item', fieldId: 'custcol_cen_bulkfulfill_linklinekey'});
                    reopenClosedLine(requestTOid, linkedLineKey);

                    //Allow the deletion action to complete
                    return true
                } catch(e){
                    log.error('Unable to reopen closed request line', e);
                    return false
                }
            }
        }
    }

    /**
     * Add a button with the label "Bulk Fulfill" to the Item sublist. Clicking calls the bulkFulfillClick
     * function defined below
     * @param {*} context 
     */
    function addBulkFillButton(context){
        //STUB****************
    }

    /**
     * Opens the Bulk Fulfillment line selection suitelet. Called when the "Bulk Fulfill" button is selected
     * @param {*} fromLocation 
     * @param {*} toLocation 
     */
    function bulkFulfillClick(fromLocation, toLocation){
        var bulkfill_url = url.resolveScript({
            scriptId: 'customscript_bulkfill_manage_sl',
            deploymentId: 'customdeploy_cen_bulkfill_manage_sl',
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
        //Iterate through the item sublist on the current record
        for(var i = 0; i<currRec.getLineCount({sublistId: 'item'}); i++){
            //If the Request TO, Fulfillment TO, or Line Unique Key fields are populated, lock the line
            //STUB************
           var requestTo= currRec.getSublistValue({sublistId: 'item', fieldId: 'custcol_cen_bulkfulfill_requestto', line: i});
           var fullfillmentTo=currRec.getSublistValue({sublistId: 'item', fieldId: 'custcol_cen_bulkfulfill_fulfillto', line: i});
           var lineUniqueKey=currRec.getSublistValue({sublistId: 'item', fieldId: 'custcol_cen_bulkfulfill_linklinekey', line: i});
           if(!isEmpty(requestTo) || !isEmpty(fullfillmentTo) || !isEmpty(lineUniqueKey)){
            currRec.setSublistValue({sublistId: 'item', fieldId: 'closed', line: i, value: true});
           }
        }            
    }

    /**
     * When a fulfillment line is deleted, use the line unique key value to identify the original request
     * line and reopen that line on the requesting TO
     * @param {*} requestTOid 
     * @param {*} linkedLineKey 
     */
    function reopenClosedLine(requestTOid, linkedLineKey){
        var requestTOrec = record.load({
            type: 'transferorder',
            id: requestTOid,
            isDynamic: true
        });

        //Loop through the item sublist until the lineuniquekey value matches the target linkedLineKey
        //Once the line is found, mark it as open (closed = false)
        //STUB*************
        for(var i = 0; i<requestTOrec.getLineCount({sublistId: 'item'}); i++){
            var lineUniqueKey=requestTOrec.getSublistValue({sublistId: 'item', fieldId: 'custcol_cen_bulkfulfill_linklinekey', line: i});
            if(lineUniqueKey==linkedLineKey){
                requestTOrec.setSublistValue({sublistId: 'item', fieldId: 'closed', line: i, value: false});
            }
        }

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
        validateDelete: validateDelete
    }
});