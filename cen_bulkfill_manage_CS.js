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
 * 
*/

define(['N/runtime'],
function(runtime) {
    
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
        }            
    }

    return {
        pageInit: pageInit
    }
});