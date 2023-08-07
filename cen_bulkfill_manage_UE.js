/**
* @NApiVersion 2.x
* @NScriptType UserEventScript
*  
* Created by Centric Consulting
* Authors: Angela Brazil
* 
* Description: Performs cross-linkage of bulk fulfillment lines upon record save
 test comment 7th august
*/
define(['N/record'], function(record) {
    
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
                        requestTOrec.selectLine({}); //STUB***********
                        //Record the requested quantity to determine if a remaining balance will be unfulfilled
                        //and needs to be recorded on a new line
                        var requestQty = requestTOrec.getCurrentSublistValue({sublistId: 'item', fieldId: 'quantity'});
                        var newLineQty = 0;
                        if(fulfillmentLineData.quantity != requestQty){
                            requestTOrec.setCurrentSublistValue({sublistId: 'item', fieldId: 'quantity', value: fulfillmentLineData.quantity});
                            newLineQty = requestQty - fulfillmentLineData.quantity;
                        }
    
                        requestTOrec.setCurrentSublistValue({}); //STUB***************Fulfillment TO
                        requestTOrec.setCurrentSublistValue({}); //STUB***************Fulfillment TO unique key
                        requestTOrec.setCurrentSublistValue({sublistId: 'item', fieldId: 'closed', value: true}); //STUB***************
                        requestTOrec.commitLine({sublistId: 'item'});
    
                        //If there is remaining quantity to be fulfilled, create a new line to record it
                        if(newLineQty > 0){
                            requestTOrec.selectNewLine({sublistId: 'item'});
                            requestTOrec.setCurrentSublistValue({}); //STUB***************Item
                            requestTOrec.setCurrentSublistValue({}); //STUB***************Quantity
                            requestTOrec.commitLine({sublistId: 'item'});
                        } else if (newLineQty < 0){
                            log.error('New Line Qty less than zero', 'Fulfilled value passed exceeded the value of the original request line. '
                            + 'This is an invalid condition and will not be recorded.');
                        }
                    } catch(e){
                        log.error('Unable to update request line', 'Fulfillment line data ' + JSON.stringify(fulfillmentLineData) + JSON.stringify(e));
                        lineLinkageErrors.push({
                            "fulfillmentLineId": '', //STUB**********
                            "errorMessage": e.message
                        });
                    }
                }
    
                try{
                    requestTOrec.save();
                } catch(e){
                    log.error('Failed to save request record', JSON.stringify(e) + ' Line Data: ' + JSON.stringify(requestTOlines[requestTOid]));
                    //Update all the lines for this request TO with the error message
                    lineLinkageErrors = addRecordLevelError(lineLinkageErrors, requestTOlines[requestTOid], e);
                }
            }

            if(lineLinkageErrors.length > 0){
                populateLineLinkageErrors(currRec, lineLinkageErrors);
            }

        } catch(e){
            log.error('Unable to complete cross-linkage', e);
        }
	}

    function getRequestTOlines(currRec){
        var requestTOlines = {};

        for(var i=0; i<currRec.getLineCount({sublistId: 'item'}); i++){
            var requestTOid = ''; //STUB

            //If this request transfer order has not already been recorded in the data object, instantiate it
            if(!requestTOlines[requestTOid]){
                requestTOlines[requestTOid] = {};
            }

            //Add the data about this specific line
            requestTOlines[requestTOid][i] = {
                "fulfillmentRecId": '',
                "fulfillmentLineId": i, //source line id on the fulfillment TO
                "fulfillmentLineIdUniqueKey": '', //STUB**********
                "quantity": '' //STUB************
            }
        }

        return requestTOlines
    }

    function addRecordLevelError(lineLinkageErrors, fulfillmentLines, e){
        for(lineNum in fulfillmentLines){
            var fulfillmentLineData = fulfillmentLines[lineNum];

            lineLinkageErrors.push({
                "fulfillmentLineId": '', //STUB**********
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

            fulfillmentRec.selectLine({}); //*STUB***********
            fulfillmentRec.setCurrentSublistValue({}); //*STUB**********
            fulfillmentRec.commitLine({sublistId: 'item'});
        }

        fulfillmentRec.save();
    }

    return {
        afterSubmit: afterSubmit
    };
});
 