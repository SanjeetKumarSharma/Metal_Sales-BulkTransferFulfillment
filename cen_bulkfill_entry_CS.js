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
                    //** STUB ********** */
                    var fromLocation = currRec.getValue({
                        fieldId: 'custpage_from_location_id'
                    });
                    var toLocation = currRec.getValue({
                        fieldId: 'custpage_to_location_id'
                    });
                    var ItemId = currRec.getValue({
                        fieldId: 'custpage_item'
                    });
                    //alert(ItemId);
                    var serverUrl = '/app/site/hosting/scriptlet.nl?script=3071&deploy=1&from_location=' + fromLocation + '&to_location=' + toLocation + '&item=' + ItemId;
                    // alert(serverUrl);
                    window.location.href = serverUrl;
                    //Reload the Suitelet
                    //** STUB ********** */
                } catch (e) {
                    log.error('ERROR', e);
                }
            }
            //When a user selects or deselects a checkbox, or edits a “Quantity to Fulfill” value on a selected line
        //Recalculate the “Total Quantity Selected” value and update the display
        if(context.sublistId == 'custpage_to_request_lines'){
            if(context.fieldId == 'custpage_checkbox' || context.fieldId == 'custpage_quantity_to_fullfill'){
                var totalQuantity = 0;
                //Iterate over the line items to calculate Total Quantity Selected
                //Total Quantity Selected = Sum of Quantity to Fulfill for all lines with the checkbox selected
                for(var i=0; i<currRec.getLineCount({sublistId: "custpage_to_request_lines"}); i++){
                //  alert(currRec.getLineCount({sublistId: "custpage_to_request_lines"}));
                    var isSelected = currRec.getSublistValue({
                         sublistId: 'custpage_to_request_lines',
                         fieldId: 'custpage_checkbox',
                         line:i
                        });
                  //alert(isSelected);
                    if(isSelected==true || isSelected==false){
                        var lineQuantityToFulfill = currRec.getSublistValue({
                               sublistId: 'custpage_to_request_lines',
                               fieldId: 'custpage_quantity_to_fullfill',
                              line: i
                             });
                      alert(lineQuantityToFulfill);
                        totalQuantity += lineQuantityToFulfill;
                    }
                }
               // alert(totalQuantity);

                //Populate the Total Quantity Selected back to the header field of the Suitelet
                currRec.setValue({fieldId: 'custpage_total_qty', value: totalQuantity});
            }
        }
        }
       
       /* function sublistChanged(context) {
			try{
            var currRec = context.currentRecord;
            var sublistName = context.sublistId;
            var line = context.line;
            var valueCheck = currRec.getCurrentSublistValue({
                sublistId: 'custpage_to_request_lines',
                fieldId: 'custpage_checkbox',
                line: line
            });
            var totalQty = currRec.getValue({
                fieldId: 'custpage_total_qty'
            });
            if (sublistName == 'custpage_to_request_lines' && valueCheck == true) {
                
                    var quantityToFullfill = currRec.getCurrentSublistValue({
                        sublistId: 'custpage_to_request_lines',
                        fieldId: 'custpage_quantity_to_fullfill',
                        line: line
                    });
                    totalQty += quantityToFullfill;
                } else if (sublistName == 'custpage_to_request_lines' && valueCheck == false) {
                    var quantityToFullfill = currRec.getCurrentSublistValue({
                        sublistId: 'custpage_to_request_lines',
                        fieldId: 'custpage_quantity_to_fullfill',
                        line: line
                    });
                    totalQty -= quantityToFullfill;
                }
					currRec.setValue({
						fieldId: 'custpage_total_qty',
						value: totalQty
					});
            }catch (error) {
                log.error('ERROR', error);
            } 
        }*/

        /**
         * When the "Save Lines" submit button in the Suitelet, write the data selected back to the
         * triggering Transfer Order.
         * @param {*} context 
         */
        function onSubmitClick() {
            var title = "onCancelClick";
            try {
                var currRec = currentRecord.get();

                //Iterate over the lines in the Suitelet
                for (var i = 0; i < currRec.getLineCount({
                        sublistId: "custpage_to_request_lines"
                    }); i++) {
                    //Get the request line data
                    var linesToAdd = [];
                    //** STUB ********** */

                    //If the "Quantity to Fulfill" value is greater than the original open quantity on the line
                    //populate the original open quantity into the Quantity field when creating the line copy.
                    var quantityDelta = ''; //*STUB*********/
                    if (quantityDelta > 0) {
                        //Populate the original open quantity into the first line
                        linesToAdd.push({
                            //*STUB ******************//
                        });

                        //Populate the quantity overage into an additional line. 
                        //Do not populate the transfer order id or line unique key on the additional line.
                        linesToAdd.push({
                            //*STUB ******************//
                        });
                    } else {
                        //Only populate one line, with Quantity to Fulfill in the Quantity field
                        //Note: UE script will handle any negative quantity deltas
                        linesToAdd.push({
                            //*STUB ******************//
                        });
                    }
                }

                //Write the request line data back to the triggering Transfer Order
                for (lineIndex in linesToAdd) {
                    var lineData = linesToAdd[lineIndex];

                    //Create the line and populate the values
                    //***STUB************ */
                }

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
            fieldChanged: fieldChanged,
            onCancelClick: onCancelClick,
            saveRecord: onSubmitClick
            //sublistChanged: sublistChanged
        }
    });