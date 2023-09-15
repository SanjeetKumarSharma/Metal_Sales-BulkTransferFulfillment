/**
* @NApiVersion 2.x
* @NScriptType UserEventScript
*  
* Created by Centric Consulting
* Authors: Angela Brazil
* 
* Description: Performs cross-linkage of bulk fulfillment lines upon record save
*/
define(['N/record'], function(record) {
    function beforeLoad(context){
        try{
            //Note: control is also established by the Audience roles selected in the Deployment 
            if (context.type != context.UserEventType.VIEW){
                addBulkFillButton(context);
            } else {
                log.debug('Skipped adding button', 'Context ' + context.type + ' is out of scope.');
            }
        
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
                        //Loop over the request TO lines until one with the matching unique key is found
                        var lineFound = false;
                        var j=0;
                        while (!lineFound && j < requestTOrec.getLineCount('item')){
                            requestTOrec.selectLine({sublistId: 'item', line: j});

                            var lineUniqueKey = requestTOrec.getCurrentSublistValue({sublistId: 'item', fieldId: 'lineuniquekey'});
                            if(lineUniqueKey != fulfillmentLineData.requestLineUniqueKey){
                                j++
                                continue
                            }

                            lineFound = true;
                            //Once the matching line is found, check the requested quantity to determine if a 
                            //remaining balance will be unfulfilled and needs to be recorded on a new line
                            var requestQty = requestTOrec.getCurrentSublistValue({sublistId: 'item', fieldId: 'quantity'});
                            var newLineQty = 0;
                            if(fulfillmentLineData.quantity != requestQty){
                                requestTOrec.setCurrentSublistValue({sublistId: 'item', fieldId: 'quantity', value: fulfillmentLineData.quantity});
                                newLineQty = requestQty - fulfillmentLineData.quantity;
                            }
        
                            requestTOrec.setCurrentSublistValue({sublistId: 'item',fieldId: 'custcol_cen_bulkfulfill_fulfillto', value: fulfillmentLineData.fulfillmentRecId});
                            requestTOrec.setCurrentSublistValue({sublistId: 'item',fieldId: 'custcol_cen_bulkfulfill_linklinekey', value: fulfillmentLineData.fulfillmentLineUniqueKey});
                            requestTOrec.setCurrentSublistValue({sublistId: 'item', fieldId: 'isclosed', value: true});
                            requestTOrec.commitLine({sublistId: 'item'});
        
                            //If there is remaining quantity to be fulfilled, create a new line to record it
                            if(newLineQty > 0){
                                requestTOrec.selectNewLine({sublistId: 'item'});
                                requestTOrec.setCurrentSublistValue({sublistId: 'item',fieldId: 'item', value: fulfillmentLineData.item});
                                requestTOrec.setCurrentSublistValue({sublistId: 'item',fieldId: 'quantity', value:newLineQty});
                                requestTOrec.commitLine({sublistId: 'item'});
                            } else if (newLineQty < 0){
                                log.error('New Line Qty less than zero', 'Fulfilled value passed exceeded the value of the original request line. '
                                + 'This is an invalid condition and will not be recorded.');
                            }
                        }
                        
                        if(!lineFound){
                            //If no matching line is found in the record after looping over all of the lines, log an error
                            log.error('Request line not found', 'Fulfillment line data ' + JSON.stringify(fulfillmentLineData) + JSON.stringify(e));
                            lineLinkageErrors.push({
                                "fulfillmentLineId": lineNum,
                                "errorMessage": "Request line not found on request TO."
                            });
                        }
                        
                    } catch(e){
                        log.error('Unable to update request line', 'Fulfillment line data ' + JSON.stringify(fulfillmentLineData) + JSON.stringify(e));
                        lineLinkageErrors.push({
                            "fulfillmentLineId": lineNum,
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

    function addBulkFillButton(context){
        context.form.clientScriptModulePath = "SuiteScripts/cen_bulkfill_manage_CS.js" ;        
        context.form.addButton({
            id: "custpage_bulkfulfill",
            label: "Bulk Fulfill",
            functionName: 'bulkFulfillClick()'
        });
    }

    function getRequestTOlines(currRec){
        var requestTOlines = {};

        for(var i=0; i<currRec.getLineCount({sublistId: 'item'}); i++){
            var requestTOid = currRec.getSublistValue({sublistId: 'item', fieldId: 'custcol_cen_bulkfulfill_requestto', line: i});

            if(!requestTOid){
                continue
            }

            //If this request transfer order has not already been recorded in the data object, instantiate it
            if(!requestTOlines[requestTOid]){
                requestTOlines[requestTOid] = {};
            }

            //Add the data about this specific line
            requestTOlines[requestTOid][i] = {
                "requestLineUniqueKey": currRec.getSublistValue({sublistId: 'item', fieldId: 'custcol_cen_bulkfulfill_linklinekey', line: i}),
                "fulfillmentRecId": currRec.id,
                "fulfillmentLineUniqueKey": currRec.getSublistValue({sublistId: 'item', fieldId: 'lineuniquekey', line: i}),
                "quantity": currRec.getSublistValue({sublistId: 'item', fieldId: 'quantity', line: i}),
                "item": currRec.getSublistValue({sublistId: 'item', fieldId: 'quantity', line: i})
            }
        }

        return requestTOlines
    }

    function addRecordLevelError(lineLinkageErrors, fulfillmentLines, e){
        for(lineNum in fulfillmentLines){

            lineLinkageErrors.push({
                "fulfillmentLineId": lineNum,
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

            fulfillmentRec.selectLine({sublistId: 'item', line: fulfillmentLineId});
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
 