/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 * 
 * Created by Centric Consulting
 * Authors: Angela Brazil and SanjeetKumar Sharma
 * 
 * Description: Provides client script functions for the operation of the bulk transfer fulfillment
 * Suitelet form
 * 
 */
define(['N/currentRecord', 'N/url'],
    function(currentRecord, url) {
         
        function pageInit(context){
            //If the item has not been selected yet, don't display a warning when the page is
            //about to reload
            var currRec = context.currentRecord;
            var itemId = currRec.getValue({fieldId: 'custpage_item'});

            if(!itemId){
                console.log('No item selected. Suppressing page reload warning');
                window.onbeforeunload = null;
            }
        }
        
        function fieldChanged(context) {
            debugger;
            var title = "onFieldChange";
            var currRec = context.currentRecord;
            
            //When the user selects an Item using the dropdown field, reload the Suitelet with the item id
            //included in the parameters of the request
            if (context.fieldId == 'custpage_item') {
                try {
                    console.log(title + ' | custpage_item');

                    //Get the parameter values from the current selections on the page
                    var fromLocation = currRec.getValue({
                        fieldId: 'custpage_from_location_id'
                    });
                    var toLocation = currRec.getValue({
                        fieldId: 'custpage_to_location_id'
                    });
                    var itemId = currRec.getValue({
                        fieldId: 'custpage_item'
                    });

                    //Reload the Suitelet
                    var bulkfill_url = url.resolveScript({
                        scriptId: 'customscript_cen_blk_fulfill',
                        deploymentId: 'customdeploy_cen_bulkfill_suitelet',
                        returnExternalUrl: false,
                        params: {
                            'from_location': fromLocation,
                            'to_location': toLocation,
                            'item': itemId
                        }
                    });
                    window.location.href = bulkfill_url;
                } catch (e) {
                    log.error('ERROR', e);
                }
            }
          
            //When a user selects or deselects a checkbox, or edits a “Quantity to Fulfill” value on a selected line
            //Recalculate the “Total Quantity Selected” value and update the display
            if (context.sublistId == 'custpage_to_request_lines' && (context.fieldId == 'custpage_quantity_to_fullfill' || context.fieldId == 'custpage_checkbox')) {
                //Commit the current line so that the field changes that triggered the recalculation are not lost
                currRec.commitLine({sublistId: 'custpage_to_request_lines'});
                
                var totalQuantity = 0.00;
                //Iterate over the line items to calculate Total Quantity Selected
                //Total Quantity Selected = Sum of Quantity to Fulfill for all lines with the checkbox selected
                var linecount=currRec.getLineCount({sublistId: "custpage_to_request_lines"});
                for(var i=0; i<linecount; i++){
                
                    currRec.selectLine({sublistId: 'custpage_to_request_lines', line: i});
                    var isSelected = currRec.getCurrentSublistValue({
                        sublistId: 'custpage_to_request_lines',
                        fieldId: 'custpage_checkbox'
                    });

                    if(isSelected){
                        var lineQuantityToFulfill = currRec.getCurrentSublistValue({
                            sublistId: 'custpage_to_request_lines',
                            fieldId: 'custpage_quantity_to_fullfill'
                        });
                        console.log('lineQuantity', lineQuantityToFulfill);
                        //var fullfillQuantity=lineQuantityToFulfill?lineQuantityToFulfill:0.00;
                        totalQuantity = totalQuantity + lineQuantityToFulfill;
                    }
                }               
                
                console.log(totalQuantity);
                currRec.setValue({fieldId: 'custpage_total_qty', value: totalQuantity});
            }
           
        }

        /**
         * When the "Save Lines" submit button in the Suitelet, write the data selected back to the
         * triggering Transfer Order.
         * @param {*} context 
         */
        function onSubmitClick() {
          debugger;
            var title = "onSubmitClick";
            try {
                //Get the request line data
                var linesToAdd = [];
                
                var currRec = currentRecord.get();
                var selectedItem = currRec.getValue('custpage_item');
                var underFulfillMargin = currRec.getValue('custpage_under_fulfill_margin');
                var overFulfillMargin = currRec.getValue('custpage_over_fulfill_margin');

                //Iterate over the lines in the Suitelet
                for (var i = 0; i < currRec.getLineCount({sublistId: "custpage_to_request_lines"}); i++) {
                    currRec.selectLine({sublistId: 'custpage_to_request_lines', line: i});

                    var isSelected = currRec.getCurrentSublistValue({
                        sublistId: 'custpage_to_request_lines',
                        fieldId: 'custpage_checkbox',
                        line:i
                    });
                    var lineQuantityToFulfill = currRec.getCurrentSublistValue({
                        sublistId: 'custpage_to_request_lines',
                        fieldId: 'custpage_quantity_to_fullfill',
                        line: i
                    });
                    var originalOpenQuantity=currRec.getCurrentSublistValue({
                        sublistId: 'custpage_to_request_lines',
                        fieldId: 'custpage_quantity',
                        line: i
                    });
                    var transferOrderId=currRec.getCurrentSublistValue({
                        sublistId: 'custpage_to_request_lines',
                        fieldId: 'custpage_to_id',
                        line: i
                    });
                    var lineLinkKey = currRec.getCurrentSublistValue({
                        sublistId: 'custpage_to_request_lines',
                        fieldId: 'custpage_line_key_ref'
                    });

                    if(isSelected){
                        //Calculate the overfulfillment and underfulfillment thresholds
                        var underFulfillThreshold = originalOpenQuantity - (originalOpenQuantity * underFulfillMargin);
                        var overFulfillThreshold = originalOpenQuantity + (originalOpenQuantity * overFulfillMargin);
                        
                        //If the "Quantity to Fulfill" value is greater than the original open quantity on the line
                        //by more than the margin percentage specified in the script configuration
                        //populate the original open quantity into the Quantity field when creating the line copy.
                        var quantityDelta = lineQuantityToFulfill - originalOpenQuantity;
                        if(lineQuantityToFulfill > overFulfillThreshold){
                            //Populate the original open quantity into the first line
                            linesToAdd.push({
                                'item': selectedItem,
                                'quantity': originalOpenQuantity,
                                'custcol_cen_bulkfulfill_requestto': transferOrderId,
                                'custcol_cen_bulkfulfill_linklinekey': lineLinkKey,
                                'custcol_cen_bulkfulfill_isoverfulfill': true
                            });

                            //Populate the quantity overage into an additional line. 
                            //Do not populate the transfer order id or line unique key on the additional line.
                            linesToAdd.push({
                                'item': selectedItem,
                                'quantity': quantityDelta,
                                'custcol_cen_bulkfulfill_isoverfulfill': true
                            });
                        
                        } else if(lineQuantityToFulfill < underFulfillThreshold) {
                            //Only populate one line, with Quantity to Fulfill in the Quantity field
                            //and flag for UE script to handle negative quantity delta
                            linesToAdd.push({
                                'item': selectedItem,
                                'quantity': lineQuantityToFulfill,
                                'custcol_cen_bulkfulfill_requestto': transferOrderId,
                                'custcol_cen_bulkfulfill_linklinekey': lineLinkKey,
                                'custcol_cen_bulkfulfill_isunderfulfil': true
                            });
                        } else {
                            //Ignore any quantity deltas
                            linesToAdd.push({
                                'item': selectedItem,
                                'quantity': lineQuantityToFulfill,
                                'custcol_cen_bulkfulfill_requestto': transferOrderId,
                                'custcol_cen_bulkfulfill_linklinekey': lineLinkKey
                            });
                        }
                    }
                }

                //Write the request line data back to the triggering Transfer Order
                
                window.opener.require(['N/currentRecord'], function(currentRecord){
                    var currRec = currentRecord.get();

                    for (lineIndex in linesToAdd) {
        
                        var lineData = linesToAdd[lineIndex];

                        //Create the line and populate the values
                        console.log(lineData);
                        currRec.selectNewLine('item');
                        for(var field in lineData){
                            currRec.setCurrentSublistValue({
                                sublistId: 'item', 
                                fieldId: field, 
                                value: lineData[field],
                                forceSyncSourcing: true
                            });
                        }
                        currRec.commitLine('item');

                        console.log('line ' + lineIndex + ' added');
                    }
                });

                //Save complete. Close the window
                return true
            } catch (e) {
                console.error(title + ' | Exception: ' + e.toString());
                log.error(title + ' | Exception', e);
                //Save incomplete
                return false
            }
        }

        /**
         * When a user selects the "Cancel" button in the Suitelet, close the window
         */
        function onCancelClick() {
            var title = "onCancelClick";
            try {
                console.log(title);
                window.close();
            } catch (e) {
                console.error(title + ' | Exception: ' + e.toString());
                log.error(title + ' | Exception', e);
            }
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            onCancelClick: onCancelClick,
            saveRecord: onSubmitClick
        }
    });
