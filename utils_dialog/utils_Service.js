function fillService (apptService) {
    var has_inout = 0;
    var has_duration = 0;
    var has_addon = 0;
    var complete = 0;
    var flag_addon = 0;
    var flag_rejectOut = 1;

    var inout = '';
    var duration = '';
    var addon = '';


    if (apptService) {
        if (apptService.inout) {
            has_inout = 1;
            inout = apptService.inout;
            if (inout == 'incall') {
                flag_rejectOut = 0;
            }
        }
    
        if (apptService.duration) {
            has_duration = 1;
            duration = apptService.duration;
        }
    
        if (apptService.addon) {
            has_addon = 1;
            flag_addon = 1;
            addon = apptService.addon;
        }
    
        if (apptService.cardate) {
            has_inout = 1;
            has_duration = 1;
            inout = 'outcall';
            duration = '15min';
        }    
    }
    if (has_inout && has_duration && !flag_rejectOut) {
        complete = 1;
    }

    var data = {
        has_inout: has_inout,
        has_duration: has_duration,
        has_addon: has_addon,
        inout: inout,
        duration: duration,
        addon: addon,
        flag_addon: flag_addon,
        flag_rejectOut: flag_rejectOut,
        complete: complete
    };    

    return data;
}
exports.fillService = fillService;

function updateService (service, service_new) {
    var service_out = JSON.parse(JSON.stringify(service));
    if (service_new.has_inout) {
        service_out.has_inout = 1;
        service_out.inout = service_new.inout;
    }
    if (service_new.has_duration) {
        service_out.has_duration = 1;
        service_out.duration = service_new.duration;
    }
    if (service_new.has_addon) {
        service_out.has_addon = 1;
        if (!service_out.flag_addon && service_new.addon != service_out.addon) {
            service_out.flag_addon = 1;
        }
        service_out.addon = service_new.addon;
    }
    if (service_out.inout) {
        service_out.has_inout = 1;
    }  
    service_out.complete = service_out.has_inout && service_out.has_duration && !service_out.flag_rejectOut;
    return service_out;
}
exports.updateService = updateService;