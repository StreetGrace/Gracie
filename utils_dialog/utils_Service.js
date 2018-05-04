function fillService (apptService) {
    var has_inout = 0;
    var has_duration = 0;
    var has_addon = 0;
    var if_pickup = 0;
    var complete = 0;

    var inout = '';
    var duration = '';
    var addon = '';


    if (apptService) {
        if (apptService.inout) {
            has_inout = 1;
            inout = apptService.inout;
        }
    
        if (apptService.duration) {
            has_duration = 1;
            duration = apptService.duration;
        }
    
        if (apptService.addon) {
            has_addon = 1;
            addon = apptService.addon;
        }
    
        if (apptService.cardate) {
            has_inout = 1;
            has_duration = 1;
            inout = 'outcall';
            duration = '15min';
        }    
    }
    if (has_inout && has_duration && (inout == 'incall' || if_pickup)) {
        complete = 1;
    }

    var data = {
        has_inout: has_inout,
        has_duration: has_duration,
        has_addon: has_addon,
        if_pickup: if_pickup,
        inout: inout,
        duration: duration,
        addon: addon,
        complete: complete
    };    

    return data;
}
exports.fillService = fillService;

function updateService (service, service_new) {
    if (service_new.has_inout) {
        service.has_inout = 1;
        service.inout = service_new.inout;
    }
    if (service_new.has_duration) {
        service.has_duration = 1;
        service.duration = service_new.duration;
    }
    if (service_new.has_addon) {
        service.has_addon = 1;
        service.addon = service_new.addon;
    } 
    service.complete = service.has_inout && service.has_duration;
    return service;
}
exports.updateService = updateService;