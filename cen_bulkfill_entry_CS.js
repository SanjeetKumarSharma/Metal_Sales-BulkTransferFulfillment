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
            if (context.sublistId == 'custpage_to_request_lines' && (context.fieldId == 'custpage_quantity_to_fullfill' || context.fieldId == 'custpage_checkbox')) {
               var totalQuantity = 0.00;
                //Iterate over the line items to calculate Total Quantity Selected
                //Total Quantity Selected = Sum of Quantity to Fulfill for all lines with the checkbox selected
              var linecount=currRec.getLineCount({sublistId: "custpage_to_request_lines"});
              alert(linecount);
                 for(var i=0; i<linecount; i++){
                   
					 var isSelected = currRec.getSublistValue({
                         sublistId: 'custpage_to_request_lines',
                         fieldId: 'custpage_checkbox',
                         line:i
                        });
                    if(isSelected=='true'){
						var lineQuantityToFulfill = currRec.getSublistValue({
                               sublistId: 'custpage_to_request_lines',
                               fieldId: 'custpage_quantity_to_fullfill',
                              line: i
                             });
                         var fullfillQuantity=lineQuantityToFulfill?lineQuantityToFulfill:0.00;
							 totalQuantity+=fullfillQuantity;
                    }
					
                 
				}
               
                
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
            alert(title);
            try {
                var currRec = currentRecord.get();
                 alert(currRec);
                //Iterate over the lines in the Suitelet
                for (var i = 0; i < currRec.getLineCount({
                        sublistId: "custpage_to_request_lines"
                    }); i++) {
                    //Get the request line data
                    var linesToAdd = [];
                    //** STUB ********** */
                  var isSelected = currRec.getSublistValue({
                         sublistId: 'custpage_to_request_lines',
                         fieldId: 'custpage_checkbox',
                         line:i
                        });
                  var lineQuantityToFulfill = currRec.getSublistValue({
                               sublistId: 'custpage_to_request_lines',
                               fieldId: 'custpage_quantity_to_fullfill',
                              line: i
                             });
                  var originalOpenQuantity=currRec.getSublistValue({
                               sublistId: 'custpage_to_request_lines',
                               fieldId: 'custpage_quantity',
                              line: i
                             });
                  var transferOrderId=currRec.getSublistValue({
                               sublistId: 'custpage_to_request_lines',
                               fieldId: 'custpage_to_number',
                              line: i
                             });
                    if(isSelected==true){
                    //If the "Quantity to Fulfill" value is greater than the original open quantity on the line
                    //populate the original open quantity into the Quantity field when creating the line copy.
                    if (lineQuantityToFulfill > originalOpenQuantity) {
                        //Populate the original open quantity into the first line
                        linesToAdd.push({
                            //*STUB ******************//
                          'tranid':transferOrderId,
                          'quantity':originalOpenQuantity
                        });

                       
                    } else {
                        //Only populate one line, with Quantity to Fulfill in the Quantity field
                        //Note: UE script will handle any negative quantity deltas
                        linesToAdd.push({
                            //*STUB ******************//
                          'tranid':transferOrderId,
                          'quantity':lineQuantityToFulfill
                        });
                    }
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
            alert(title);
            try {
                console.log(title);
              window.location.href = '/app/center/card.nl?sc=-29&whence=';
             // window.close();
             // window.top.close();
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