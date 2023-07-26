/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 * 
 * Created by Centric Consulting
 * Authors: Angela Brazil
 * 
 * Description: Provides client script functions for the operation of the bulk transfer fulfillment
 * Suitelet form
 * 
*/

define(['N/runtime', 'N/record', 'N/search'],
function(runtime, record, search) {
    
    function fieldChanged(context){
        try{
            var params = {
            }
            log.debug('Params Check', params);

        
        }catch(e){
            log.error('ERROR', e);
        }        
    }

    return {
        fieldChanged: fieldChanged
    }
});