/**
* @NApiVersion 2.x
* @NScriptType UserEventScript
*  
* Created by Centric Consulting
* Authors: Angela Brazil
* 
* Description: Performs cross-linkage of bulk fulfillment lines upon record save
*/
define(['N/record', 'N/runtime','N/currentRecord'], function(record, runtime,currentRecord) {
    function beforeLoad(context)
    {
        try{
            if (context.type == context.UserEventType.EDIT){
               var  bulkFillRoles =runtime.getCurrentScript().getParameter({name: 'custscript_bulkfill_roles'});
              log.debug('roles',bulkFillRoles);
               if(isEmpty(bulkFillRoles)){return;}
               var  userRole = runtime.getCurrentUser().role;
               var fromlocation= context.newRecord.getValue('location');
               var toLocation=context.newRecord.getValue('transferlocation');
            if(bulkFillRoles.indexOf(userRole) >= 0  ){ 
                addBulkFillButton(context,fromlocation,toLocation);                
            }
        }
           // var currRec = context.currentRecord;
           // lockAllLinkedLines(currRec);
        
        }catch(e){
            log.error('ERROR', e);
        }        
    }
    function afterSubmit(context) {
        try{
            var currRec = context.newRecord;
            
            //Iterate through the new Item sublist and collect the line item data
            //for any line with a request TO reference. Group the lines by request TO
            var requestTOlines = getRequestTOlines(currRec);
            var lineLinkageErrors = [];

            //Iterate through the request TOs in the line data
            for(requestTOid in requestTOlines){
                try{
                    requestTOrec = record.load({
                        type: 'transferorder',
                        id: requestTOid,
                        isDynamic: true
                    });
                } catch(e){
                    log.error('Failed to load request record', JSON.stringify(e) + ' Line Data: ' + JSON.stringify(requestTOlines[requestTOid]));
                    //Update all the lines for this request TO with the error message
                    lineLinkageErrors = addRecordLevelError(lineLinkageErrors, requestTOlines[requestTOid], e);
                }
    
                //Update the corresponding lines on the request TO to complete the cross-linkage
                for(lineNum in requestTOlines[requestTOid]){
                    var fulfillmentLineData = requestTOlines[requestTOid][lineNum];

                    try{
                        requestTOrec.selectLine({sublistId: 'item',line:lineNum}); //STUB***********
                        //Record the requested quantity to determine if a remaining balance will be unfulfilled
                        //and needs to be recorded on a new line
                        var requestQty = requestTOrec.getCurrentSublistValue({sublistId: 'item', fieldId: 'quantity'});
                        var newLineQty = 0;
                        if(fulfillmentLineData.quantity != requestQty){
                            requestTOrec.setCurrentSublistValue({sublistId: 'item', fieldId: 'quantity', value: fulfillmentLineData.quantity});
                            newLineQty = requestQty - fulfillmentLineData.quantity;
                        }
    
                        requestTOrec.setCurrentSublistValue({sublistId: 'item',fieldId: 'custcol_cen_bulkfulfill_fulfillto', value: fulfillmentLineData.fulfillmentRecId}); //STUB***************Fulfillment TO
                        requestTOrec.setCurrentSublistValue({sublistId: 'item',fieldId: 'custcol_cen_bulkfulfill_linklinekey', value: fulfillmentLineData.fulfillmentLineIdUniqueKey}); //STUB***************Fulfillment TO unique key
                        requestTOrec.setCurrentSublistValue({sublistId: 'item', fieldId: 'closed', value: true}); //STUB***************
                        requestTOrec.commitLine({sublistId: 'item'});
    
                        //If there is remaining quantity to be fulfilled, create a new line to record it
                        if(newLineQty > 0){
                            requestTOrec.selectNewLine({sublistId: 'item'});
                            requestTOrec.setCurrentSublistValue({sublistId: 'item',fieldId: 'item', value: fulfillmentLineData.item}); //STUB***************Item
                            requestTOrec.setCurrentSublistValue({sublistId: 'item',fieldId: 'quantity', value:newLineQty}); //STUB***************Quantity
                            requestTOrec.commitLine({sublistId: 'item'});
                        } else if (newLineQty < 0){
                            log.error('New Line Qty less than zero', 'Fulfilled value passed exceeded the value of the original request line. '
                            + 'This is an invalid condition and will not be recorded.');
                        }
                    } catch(e){
                        log.error('Unable to update request line', 'Fulfillment line data ' + JSON.stringify(fulfillmentLineData) + JSON.stringify(e));
                        lineLinkageErrors.push({
                            "fulfillmentLineId": requestTOrec.getSublistValue({sublistId: 'item', fieldId: 'line'}),//STUB**********
                            "errorMessage": e.message
                        });
                    }
                }
    
                try{
                    requestTOrec.save();
                } catch(e){
                    log.error('Failed to save request record', JSON.stringify(e) + ' Line Data: ' + JSON.stringify(requestTOlines[requestTOid]));
                    //Update all the lines for this request TO with the error message
                    lineLinkageErrors = addRecordLevelError(lineLinkageErrors, requestTOlines[requestTOid], e,requestTOrec);
                }
            }

            if(lineLinkageErrors.length > 0){
                populateLineLinkageErrors(currRec, lineLinkageErrors);
            }

        } catch(e){
            log.error('Unable to complete cross-linkage', e);
        }
	}
    function addBulkFillButton(context,fromlocation,toLocation)
    {
        context.form.clientScriptModulePath = "SuiteScripts/cen_bulkfill_manage_CS.js" ;        
        context.form.addButton({
                    id: "custpage_bulkfulfill",
                    label: "Bulk Fulfill",
                    functionName: 'bulkFulfillClick("' + fromlocation + '","' + toLocation +'")'
                }); 
           
    }
    function getRequestTOlines(currRec){
        var requestTOlines = {};

        for(var i=0; i<currRec.getLineCount({sublistId: 'item'}); i++){
            var requestTOid = currRec.getSublistValue({sublistId: 'item', fieldId: 'custcol_cen_bulkfulfill_requestto', line: i});

            //If this request transfer order has not already been recorded in the data object, instantiate it
            if(!requestTOlines[requestTOid]){
                requestTOlines[requestTOid] = {};
            }

            //Add the data about this specific line
            requestTOlines[requestTOid][i] = {
                "fulfillmentRecId": currRec.getSublistValue({sublistId: 'item', fieldId: 'custcol_cen_bulkfulfill_fulfillto', line: i}),
                "fulfillmentLineId": i, //currRec.getSublistValue({sublistId: 'item', fieldId: 'line', line: i}),
                "fulfillmentLineIdUniqueKey": currRec.getSublistValue({sublistId: 'item', fieldId: 'custcol_cen_bulkfulfill_linklinekey', line: i}),
                "quantity": currRec.getSublistValue({sublistId: 'item', fieldId: 'quantity', line: i}),
                'item':currRec.getSublistValue({sublistId: 'item', fieldId: 'item', line: i})
            }
        }

        return requestTOlines
    }

    function addRecordLevelError(lineLinkageErrors, fulfillmentLines, e,requestTOrec){
        for(lineNum in fulfillmentLines){
            var fulfillmentLineData = fulfillmentLines[lineNum];

            lineLinkageErrors.push({
                "fulfillmentLineId": requestTOrec.getSublistValue({sublistId: 'item', fieldId: 'line', line: lineNum}),
                "errorMessage": e.message
            });
        }
        
        return lineLinkageErrors
    }

    function populateLineLinkageErrors(currRec, lineLinkageErrors){
        //Load the source fulfillment record for editing
        var fulfillmentRec = record.load({
            type: 'transferorder',
            id: currRec.id,
            isDynamic: true
        });

        //Iterate through the errors and set the error values on the indicated lines
        for(var e in lineLinkageErrors){
            var fulfillmentLineId = lineLinkageErrors[e]["fulfillmentLineId"];
            var errorMessage = lineLinkageErrors[e]["errorMessage"];

            fulfillmentRec.selectLine({sublistId: 'item', line: i});
            fulfillmentRec.setCurrentSublistValue({sublistId: 'item', fieldId: 'custcol_cen_bulkfulfill_linkageerr', value: errorMessage});
            fulfillmentRec.commitLine({sublistId: 'item'});
        }

        fulfillmentRec.save();
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
        beforeLoad:beforeLoad,
        afterSubmit: afterSubmit
    };
});
 