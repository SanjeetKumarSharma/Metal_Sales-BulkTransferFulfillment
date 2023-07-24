/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType Suitelet
 
 * Created by Centric Consulting
 * Authors: Angela Brazil
 * 
 * Description: 
 * 
 */

 CONST_CLIENT_SCRIPT_PATH = ''; //*****STUB */

 define(['N/log', 'N/ui/serverWidget', './msmc_lib_cutlist_configurator'], function(log, serverWidget, CLC_UTILS) {

    function onRequest(context) {
        var request = context.request;
        var response  = context.response;
    
        var params = {
            item_id : request.parameters.item_id,
            location_id : request.parameters.item_name
        };

        if (request.method === 'GET') {
            try {
                response.writePage(loadForm(params));
            } catch (ex) {
                log.error(title + 'Exception', ex);
            }
        } else if (request.method === 'POST') {
            try{
                response.write('<html><body><script>window.close(); </script></body></html>');
            } catch(ex){
                log.error(title + 'Exception', ex);
            }
        }
    }

    function loadForm(params) {

        var form = serverWidget.createForm({ title: 'Bulk Transfer Fulfillment Lines', hideNavBar: true });
        try {
            log.debug('Params', params);
            form.clientScriptModulePath = CONST_CLIENT_SCRIPT_PATH;

            var fields = CLC_UTILS.getFieldProperties(params.config_group_id);
            log.debug(title + 'Fields', fields);

            var button = form.addSubmitButton({ label: 'Save' });

            // if (message) {
            //     var msg = form.addField({ id: 'custpage_message', type: serverWidget.FieldType.LABEL, label: 'Message: ' + message });
            // }

            var header_group = form.addFieldGroup({ id: 'custpage_header_group', label: ' ' });
            // form.addField({ id: 'custpage_item', label: 'Item: ' + params.item_display,  type: serverWidget.FieldType.LABEL, container: 'custpage_header_group' });
            // form.addField({ id: 'custpage_config_group', label: 'Config Type: ' + params.config_group_name,  type: serverWidget.FieldType.LABEL, container: 'custpage_header_group' });
            //var location_id_field = form.addField({ id: 'custpage_location_id', label: location_id,  type: serverWidget.FieldType.LABEL, container: 'custpage_header_group' });//.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
            form.addField({ id: 'custpage_field_defs', label: JSON.stringify(fields), type: serverWidget.FieldType.TEXT, container: 'custpage_header_group' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.NODISPLAY });

            // var testing_group = form.addFieldGroup({ id: 'custpage_testing_group', label: 'TESTING' });
            // var cl1 = form.addField({ id: 'custpage_cl1', label: 'Cutlist 1', type: serverWidget.FieldType.TEXTAREA, container: 'custpage_header_group' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
            // if (params.cutlist1) {
            //     cl1.defaultValue = params.cutlist1;
            // }     
            // var cl2 = form.addField({ id: 'custpage_cl2', label: 'Cutlist 2', type: serverWidget.FieldType.TEXTAREA, container: 'custpage_header_group' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
            // if (params.cutlist2) {
            //     cl2.defaultValue = params.cutlist2;
            // }
            // var cl3 = form.addField({ id: 'custpage_cl3', label: 'Cutlist 3', type: serverWidget.FieldType.TEXTAREA, container: 'custpage_header_group' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
            // if (params.cutlist3) {
            //     cl3.defaultValue = params.cutlist3;
            // }

            var quantity = form.addField({ id: 'custpage_quantity', label: 'Quantity', type: serverWidget.FieldType.TEXT, container: 'custpage_header_group' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
            // if (params.quantity) {
            //     quantity.defaultValue = params.quantity;
            // }
            var string_length = form.addField({ id: 'custpage_string_length', label: 'Total String Length', type: serverWidget.FieldType.TEXT, container: 'custpage_header_group' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
            // if (params.quantity) {
            //     // quantity.defaultValue = params.quantity;
            // }
            // form.addButton({ id: 'btn_string_to_table', label: 'Unbuild Cutlist', container: 'custpage_testing_group', functionName: 'onUnbuildCutlistClick' });

            var mfg_details = form.addField({ id: 'custpage_mfg_details', label: 'Mfg Item Details', type: serverWidget.FieldType.TEXT, container: 'custpage_header_group' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
            if (params.mfg_item_details) {
                mfg_details.defaultValue = params.mfg_item_details;
            }

            var apply_all_group = form.addFieldGroup({ id: 'custpage_apply_all_group', label: 'Apply All' });
            // form.addButton({ id: 'btn_apply_all', label: 'Apply All', container: 'custpage_apply_all_group', functionName: 'onApplyAllClick' });

            //var apply_all = form.addSublist({ id: 'custpage_apply_all', type: serverWidget.SublistType.INLINEEDITOR, label: 'Apply All' });
            
            // var cuts_group = form.addFieldGroup({ id: 'custpage_cuts_group', label: '.' });
            var cuts_list = form.addSublist({ id: 'custpage_cuts', type: serverWidget.SublistType.INLINEEDITOR, label: ' ' });
            
            if ((fields.pieces == CLC_UTILS.FIELD_DISPLAY_TYPE.SHOW) || (fields.pieces == CLC_UTILS.FIELD_DISPLAY_TYPE.REQUIRED)) {
                var lbl_pieces = 'Pieces'.concat((fields.pieces == CLC_UTILS.FIELD_DISPLAY_TYPE.REQUIRED) ? '**' : '');
                //apply_all.addField({ id: 'apply_pieces', label: 'Pieces', type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
                cuts_list.addField({ id: 'pieces', label: lbl_pieces, type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
            }
            if ((fields.length_ft == CLC_UTILS.FIELD_DISPLAY_TYPE.SHOW) || (fields.length_ft == CLC_UTILS.FIELD_DISPLAY_TYPE.REQUIRED)) {
                var lbl_len_ft = 'Length (ft.)'.concat((fields.length_ft == CLC_UTILS.FIELD_DISPLAY_TYPE.REQUIRED) ? '**' : '');
                //apply_all.addField({ id: 'apply_length_ft', label: 'Length (ft.)', type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
                cuts_list.addField({ id: 'length_ft', label: lbl_len_ft, type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
            }
            if ((fields.length_in == CLC_UTILS.FIELD_DISPLAY_TYPE.SHOW) || (fields.length_in == CLC_UTILS.FIELD_DISPLAY_TYPE.REQUIRED)) {
                var lbl_len_in = 'Length (in.)'.concat((fields.length_in == CLC_UTILS.FIELD_DISPLAY_TYPE.REQUIRED) ? '**' : '');
                //apply_all.addField({ id: 'apply_length_in', label: 'Length (in.)', type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
                cuts_list.addField({ id: 'length_in', label: lbl_len_in, type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
            }
            if ((fields.piecemark == CLC_UTILS.FIELD_DISPLAY_TYPE.SHOW) || (fields.piecemark == CLC_UTILS.FIELD_DISPLAY_TYPE.REQUIRED)) {
                var lbl_piecemark = 'Piecemark'.concat((fields.piecemark == CLC_UTILS.FIELD_DISPLAY_TYPE.REQUIRED) ? '**' : '');
                form.addField({ id: 'apply_piecemark', label: 'Piecemark', type: serverWidget.FieldType.TEXT, container: 'custpage_apply_all_group' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
                cuts_list.addField({ id: 'piecemark', label: lbl_piecemark, type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
            }
            if ((fields.notch == CLC_UTILS.FIELD_DISPLAY_TYPE.SHOW) || (fields.notch == CLC_UTILS.FIELD_DISPLAY_TYPE.REQUIRED)) {
                var lbl_notch = 'Notch'.concat((fields.notch == CLC_UTILS.FIELD_DISPLAY_TYPE.REQUIRED) ? '**' : '');
                var notch_apply = form.addField({ id: 'apply_notch', label: 'Notch', type: serverWidget.FieldType.SELECT, container: 'custpage_apply_all_group' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
                var notch = cuts_list.addField({ id: 'notch', label: lbl_notch, type: serverWidget.FieldType.SELECT }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
                notch.addSelectOption({value : '', text : ''});
                notch_apply.addSelectOption({value : '', text : ''});
                for (var notch_val in CLC_UTILS.NOTCH_PUNCH_VALUES) {
                    notch.addSelectOption({ value: CLC_UTILS.NOTCH_PUNCH_VALUES[notch_val], text: notch_val });
                    notch_apply.addSelectOption({ value: CLC_UTILS.NOTCH_PUNCH_VALUES[notch_val], text: notch_val });
                }
            }
            if ((fields.punch == CLC_UTILS.FIELD_DISPLAY_TYPE.SHOW) || (fields.punch == CLC_UTILS.FIELD_DISPLAY_TYPE.REQUIRED)) {
                var lbl_punch = 'Punch'.concat((fields.punch == CLC_UTILS.FIELD_DISPLAY_TYPE.REQUIRED) ? '**' : '');
                var punch_apply = form.addField({ id: 'apply_punch', label: 'Punch', type: serverWidget.FieldType.SELECT, container: 'custpage_apply_all_group' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
                var punch = cuts_list.addField({ id: 'punch', label: lbl_punch, type: serverWidget.FieldType.SELECT }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
                punch.addSelectOption({value : '', text : ''});
                punch_apply.addSelectOption({value : '', text : ''});
                for (var punch_val in CLC_UTILS.NOTCH_PUNCH_VALUES) {
                    punch.addSelectOption({ value: CLC_UTILS.NOTCH_PUNCH_VALUES[punch_val], text: punch_val });
                    punch_apply.addSelectOption({ value: CLC_UTILS.NOTCH_PUNCH_VALUES[punch_val], text: punch_val });
                }
            }
            if ((fields.punch_pattern == CLC_UTILS.FIELD_DISPLAY_TYPE.SHOW) || (fields.punch_pattern == CLC_UTILS.FIELD_DISPLAY_TYPE.REQUIRED)) {
                var lbl_punch_pattern = 'Punch Pattern'.concat((fields.punch_pattern == CLC_UTILS.FIELD_DISPLAY_TYPE.REQUIRED) ? '**' : '');
                form.addField({ id: 'apply_punch_pattern', label: 'Punch Pattern', type: serverWidget.FieldType.TEXT, container: 'custpage_apply_all_group' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
                cuts_list.addField({ id: 'punch_pattern', label: lbl_punch_pattern, type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
            }
            if ((fields.bundling == CLC_UTILS.FIELD_DISPLAY_TYPE.SHOW) || (fields.bundling == CLC_UTILS.FIELD_DISPLAY_TYPE.REQUIRED)) {
                var lbl_bundling = 'Bundling'.concat((fields.bundling == CLC_UTILS.FIELD_DISPLAY_TYPE.REQUIRED) ? '**' : '');
                var bundle_apply = form.addField({ id: 'apply_bundling', label: 'Bundling', type: serverWidget.FieldType.SELECT, container: 'custpage_apply_all_group' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
                var bundle = cuts_list.addField({ id: 'bundling', label: lbl_bundling, type: serverWidget.FieldType.SELECT }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
                bundle.addSelectOption({value : '', text : ''});
                bundle_apply.addSelectOption({value : '', text : ''});
                for (var i = 0; i < CLC_UTILS.BUNDLE_VALUES.length; i++) {
                    bundle.addSelectOption({ value: CLC_UTILS.BUNDLE_VALUES[i], text: CLC_UTILS.BUNDLE_VALUES[i] });
                    bundle_apply.addSelectOption({ value: CLC_UTILS.BUNDLE_VALUES[i], text: CLC_UTILS.BUNDLE_VALUES[i] });
                }
            }
            if ((fields.pitch == CLC_UTILS.FIELD_DISPLAY_TYPE.SHOW) || (fields.pitch == CLC_UTILS.FIELD_DISPLAY_TYPE.REQUIRED)) {
                var lbl_pitch = 'Pitch/Angle'.concat((fields.pitch == CLC_UTILS.FIELD_DISPLAY_TYPE.REQUIRED) ? '**' : '');
                form.addField({ id: 'apply_pitch', label: 'Pitch/Angle', type: serverWidget.FieldType.TEXT, container: 'custpage_apply_all_group' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
                cuts_list.addField({ id: 'pitch', label: lbl_pitch, type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
            }
            if ((fields.radius == CLC_UTILS.FIELD_DISPLAY_TYPE.SHOW) || (fields.radius == CLC_UTILS.FIELD_DISPLAY_TYPE.REQUIRED)) {
                var lbl_radius = 'Curved Radius'.concat((fields.radius == CLC_UTILS.FIELD_DISPLAY_TYPE.REQUIRED) ? '**' : '');
                form.addField({ id: 'apply_radius', label: 'Curved Radius', type: serverWidget.FieldType.TEXT, container: 'custpage_apply_all_group' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
                cuts_list.addField({ id: 'radius', label: lbl_radius, type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
            }
            cuts_list.addField({ id: 'cut_string', label: 'Cut String', type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
            cuts_list.addField({ id: 'string_length', label: 'String Length', type: serverWidget.FieldType.TEXT }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

            cuts_list.addButton({ id: 'btn_list_apply_all', label: 'Apply All', functionName: 'onApplyAllClick' });

            form.addButton({ id: 'btn_cancel', label: 'Cancel', functionName: 'onCancelClick' });

        } catch (ex) {
            log.error(title + 'Exception', ex);
        } finally {
            return form;
        }
    }

    // function loadFieldList(config_group_id) {
    //     var title = "loadFieldList | ";
    //     log.debug(title + 'Config Group ID', config_group_id);
    //     var fields = {};
    //     try {
    //         // var search_id = runtime.getCurrentScript().getParameter({ name: 'custscript_nomi_inv_count_items_search' });
            
    //         var filters = [];

    //         filters.push(["internalid", "anyof", config_group_id]);
    //         //filters.push("AND", ["custentity_nomi_external_user_password", "is", password]);
    //         // log.debug(title + 'Filters', filters);

    //         var fields_search = search.create({
    //             type: 'customrecord_msmc_cutlist_configurator',
    //             filters: filters,
    //             columns: [
    //                 search.createColumn({ name:"internalid" }),
    //                 search.createColumn({ name:"custrecord_msmc_cutlist_config_group" }),
    //                 search.createColumn({ name:"custrecord_msmc_cutlist_config_pieces" }),
    //                 search.createColumn({ name:"custrecord_msmc_cutlist_config_len_ft" }),
    //                 search.createColumn({ name:"custrecord_msmc_cutlist_config_len_in" }),
    //                 search.createColumn({ name:"custrecord_msmc_cutlist_config_pmark" }),
    //                 search.createColumn({ name:"custrecord_msmc_cutlist_config_notch" }),
    //                 search.createColumn({ name:"custrecord_msmc_cutlist_config_punch" }),
    //                 search.createColumn({ name:"custrecord_msmc_cutlist_config_ppattern" }),
    //                 search.createColumn({ name:"custrecord_msmc_cutlist_config_bundling" }),
    //                 search.createColumn({ name:"custrecord_msmc_cutlist_config_pitch" }),
    //                 search.createColumn({ name:"custrecord_msmc_cutlist_config_radius" })
    //             ]
    //         });
        
    //         var fields_results = fields_search.run().getRange({ start: 0, end: 10 });
    //         // log.debug(title + 'Fields Search Results', fields_results.length);
            
    //         if (fields_results.length == 1) {
	// 			fields = {
	// 				"internalid":fields_results[0].getValue({ name:"internalid" }), 
	// 				"group_name":fields_results[0].getText({ name:"custrecord_msmc_cutlist_config_group" }), 
    //                 "pieces":fields_results[0].getValue({ name:"custrecord_msmc_cutlist_config_pieces" }),
	// 				"length_ft":fields_results[0].getValue({ name:"custrecord_msmc_cutlist_config_len_ft" }),
	// 				"length_in":fields_results[0].getValue({ name:"custrecord_msmc_cutlist_config_len_in" }), 
	// 				"piecemark":fields_results[0].getValue({ name:"custrecord_msmc_cutlist_config_pmark" }), 
	// 				"notch":fields_results[0].getValue({ name:"custrecord_msmc_cutlist_config_notch" }),
	// 				"punch":fields_results[0].getValue({ name:"custrecord_msmc_cutlist_config_punch" }),
	// 				"punch_pattern":fields_results[0].getValue({ name:"custrecord_msmc_cutlist_config_ppattern" }),
	// 				"bundling":fields_results[0].getValue({ name:"custrecord_msmc_cutlist_config_bundling" }),
	// 				"pitch":fields_results[0].getValue({ name:"custrecord_msmc_cutlist_config_pitch" }),
	// 				"radius":fields_results[0].getValue({ name:"custrecord_msmc_cutlist_config_radius" })
	// 			};
	// 		}
    //     } catch (ex) {
    //         log.error(title + 'Exception', ex);
    //     } finally {
    //         return fields;     
    //     }
    // }

    return {
        onRequest: onRequest
    };
 });