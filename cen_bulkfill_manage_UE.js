/**
* @NApiVersion 2.x
* @NScriptType UserEventScript
*  
* Created by Centric Consulting
* Authors: Angela Brazil
* 
* Description: Performs cross-linkage of bulk fulfillment lines upon record save
*/
define(['N/record', 'N/error'], function(record, error) {
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

    function beforeSubmit(context){
        
        if(context.type == 'create'){
            //No need to consider line deletions on new records
            return
        }
        
        //If the user has deleted any lines that are linked to request Transfer Orders,
        //reopen the request lines
        var newRec = context.newRecord;
        var oldRec = context.oldRecord;

        //Compare the request TO line data in the old and new records.
        var originalLines = getRequestTOlines(oldRec);
        log.debug('originalLines', originalLines);
        var remainingLines = getRequestTOlines(newRec);
        log.debug('remainingLines', remainingLines);
        //Keep any lines that existed in the old record but not in the new record.
        var linesToReopen = {};
        for(requestTOid in originalLines){
            if(originalLines[requestTOid] == remainingLines[requestTOid]){
                //No action required if data did not change
            } else {
                linesToReopen[requestTOid] = {};
                //Dig into the line data to see which lines for the TO group are missing in the new record
                for(oldLineNum in originalLines[requestTOid]){
                    targetLineKey = originalLines[requestTOid][oldLineNum].requestLineUniqueKey;
                    //Loop through the remaining lines for this TO group until the lineuniquekey value matches the target linkedLineKey
                    var lineFound = false;
                    for(lineNum in remainingLines[requestTOid]){
                        evalLineKey = remainingLines[requestTOid][lineNum].requestLineUniqueKey;
                        if(evalLineKey==targetLineKey){
                            lineFound = true;
                        }
                    }

                    if(!lineFound){
                        //Add it to the list of lines to reopen
                        linesToReopen[requestTOid][oldLineNum] = originalLines[requestTOid][oldLineNum];
                    }
                }
                //If no missing lines were found, the remove the key for this requestTOid
                if(Object.keys(linesToReopen[requestTOid]).length == 0){
                    delete linesToReopen[requestTOid];
                }
            }
        }
        log.debug('linesToReopen', linesToReopen);

        for(requestTOid in linesToReopen){
            try{
                var requestTOrec = record.load({
                    type: 'transferorder',
                    id: requestTOid,
                    isDynamic: true
                });

                for(lineNum in linesToReopen[requestTOid]){
                    var fulfillmentLineData = linesToReopen[requestTOid][lineNum];
                    //Reopen the closed line on the request TO
                    reopenClosedLine(requestTOrec, fulfillmentLineData.requestLineUniqueKey);
                }

                requestTOrec.save();
            } catch(e){
                log.error('Unable to reopen closed request line', e);
                throw error.create({
                    name: 'UNABLE_TO_REOPEN_REQUEST_LINE',
                    message: 'You have attempted to delete a line that is linked to a request Transfer Order and the script was '
                    + 'unable to update the closed line on that request. Please try again or contact your Administrator.'
                });
            }
        }

        //If all reopening actions complete, allow the save to proceed.
        return true
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
                    log.debug('fulfillmentLineData', fulfillmentLineData);

                    try{
                        //Loop over the request TO lines until one with the matching unique key is found
                        var lineFound = false;
                        var j=0;
                        while (!lineFound && j < requestTOrec.getLineCount('item')){
                            requestTOrec.selectLine({sublistId: 'item', line: j});

                            var lineUniqueKey = requestTOrec.getCurrentSublistValue({sublistId: 'item', fieldId: 'lineuniquekey'});
                            if(lineUniqueKey != fulfillmentLineData.requestLineUniqueKey){
                                //log.debug('Searching ' + requestTOid, lineUniqueKey + ' != ' + fulfillmentLineData.requestLineUniqueKey);
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
                                log.debug('Line Delta', requestQty + ' - ' + fulfillmentLineData.quantity + ' = ' + newLineQty);
                            }
        
                            requestTOrec.setCurrentSublistValue({sublistId: 'item',fieldId: 'custcol_cen_bulkfulfill_fulfillto', value: fulfillmentLineData.fulfillmentRecId});
                            requestTOrec.setCurrentSublistValue({sublistId: 'item',fieldId: 'custcol_cen_bulkfulfill_linklinekey', value: fulfillmentLineData.fulfillmentLineUniqueKey});
                            requestTOrec.setCurrentSublistValue({sublistId: 'item', fieldId: 'isclosed', value: true});
                            requestTOrec.commitLine({sublistId: 'item'});
                            log.debug('Update committed', fulfillmentLineData);
        
                            //If there is remaining quantity to be fulfilled, create a new line to record it
                            if(newLineQty > 0 && fulfillmentLineData.isUnderfulfill){
                                requestTOrec.selectNewLine({sublistId: 'item'});
                                requestTOrec.setCurrentSublistValue({sublistId: 'item',fieldId: 'item', value: fulfillmentLineData.item});
                                requestTOrec.setCurrentSublistValue({sublistId: 'item',fieldId: 'quantity', value: newLineQty});
                                requestTOrec.commitLine({sublistId: 'item'});
                                log.debug('Underfulfillment delta committed', newLineQty);
                            } else if (newLineQty < 0){
                                log.error('New Line Qty less than zero', 'Fulfilled value passed exceeded the value of the original request line. '
                                + 'This is an invalid condition and will not be recorded.');
                            }
                        }
                        
                        if(!lineFound){
                            //If no matching line is found in the record after looping over all of the lines, log an error
                            log.error('Request line not found', 'Fulfillment line data ' + JSON.stringify(fulfillmentLineData));
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
                "item": currRec.getSublistValue({sublistId: 'item', fieldId: 'item', line: i}),
                "quantity": currRec.getSublistValue({sublistId: 'item', fieldId: 'quantity', line: i}),
                "requestLineUniqueKey": currRec.getSublistValue({sublistId: 'item', fieldId: 'custcol_cen_bulkfulfill_linklinekey', line: i}),
                "fulfillmentRecId": currRec.id,
                "fulfillmentLineUniqueKey": currRec.getSublistValue({sublistId: 'item', fieldId: 'lineuniquekey', line: i}),
                "isUnderfulfill": currRec.getSublistValue({sublistId: 'item', fieldId: 'custcol_cen_bulkfulfill_isunderfulfil', line: i})
            }
        }

        return requestTOlines
    }

    /**
     * When a fulfillment line is deleted, use the line unique key value to identify the original request
     * line and reopen that line on the requesting TO
     * @param {*} requestTOrec 
     * @param {*} linkedLineKey 
     */
    function reopenClosedLine(requestTOrec, linkedLineKey){

        //Loop through the item sublist until the lineuniquekey value matches the target linkedLineKey
        //Once the line is found, mark it as open (closed = false)
        var lineFound = false;
        var j=0;
        while (!lineFound && j < requestTOrec.getLineCount('item')){
            requestTOrec.selectLine({sublistId: 'item', line: j});
            var lineUniqueKey=requestTOrec.getCurrentSublistValue({sublistId: 'item', fieldId: 'lineuniquekey'});
            log.debug('lineUniqueKey', lineUniqueKey);
            if(lineUniqueKey==linkedLineKey){
                lineFound = true;
                requestTOrec.setCurrentSublistValue({sublistId: 'item', fieldId: 'isclosed', line: j, value: false});
                requestTOrec.commitLine({sublistId: 'item'});
            }
            j++;
        }

        if(!lineFound){
            log.error('Request line not found', 'User deleted fulfillment TO line which was tied to '
            +'unique key ' + linkedLineKey + ' on TO ' + requestTOid);
        }
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
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
});
 