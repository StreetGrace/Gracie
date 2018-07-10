var async = require("async");

function routeMessage(lib, session, done){
    // Add Routeing logging later
    var context = session.toRecognizeContext();
    lib.recognize(context, function(err, topIntent){
        context.intent = topIntent;
        context.libraryName = lib.name;
        var results = addRouteResult({score: 0.0, libraryName: lib.name});
        async.each(lib.libraryList(), function (lib_sub, cb){
            lib_sub.findRoutes(context, function(err, routes){
                if (!err && routes) {
                    routes.forEach(function (r) { return results = addRouteResult(r, results);});
                }
                cb(err);    
            });

        }, function(err){
            if (!err) {
                var disambiguateRoute = function (session, routes) {
                    var route = bestRouteResult(results, session.dialogStack(), lib.name);
                    if (route) {
                        lib.library(route.libraryName).selectRoute(session, route);
                    }
                    else {
                        session.routeToActiveDialog();
                    }
                };
                //Add customized DisambiguateRoute handle later
                // if (onDisambiguateRoute) {
                //     disambiguateRoute(session, result);
                // }
                disambiguateRoute(session, results);
                //Not sure what done could be
                // done(null);
            }
            else {
                session.error(err);
                // done(err);
            }
        });        
    });
}
exports.routeMessage = routeMessage;

function addRouteResult(route, current){
    if (!current || current.length < 1 || route.score > current[0].score){
        current = [route];
    }
    else if (route.score == current[0].score) {
        current.push(route);
    }
    return current;
}

function bestRouteResult (routes, dialogStack, rootLibraryName) {
    var bestLibrary = rootLibraryName;
    if (dialogStack) {
        dialogStack.forEach(function (entry) {
            var parts = entry.id.split(':');
            for (var i = 0; i < routes.length; i++) {
                if (routes[i].libraryName == parts[0]) {
                    bestLibrary = parts[0];
                    break;
                }
            }
        });
    }
    var best;
    var bestPriority = 5;
    for (var i = 0; i < routes.length; i++) {
        var r = routes[i];
        if (r.score > 0.0) {
            var priority;
            switch (r.routeType) {
                default:
                    priority = 1;
                    break;
                case 'ActiveDialog':
                    priority = 2;
                    break;
                case 'StackAction':
                    priority = 3;
                    break;
                case 'GlobalAction':
                    priority = 4;
                    break;
            }
            if (priority < bestPriority) {
                best = r;
                bestPriority = priority;
            }
            else if (priority == bestPriority) {
                switch (priority) {
                    case 3:
                        if (r.routeData.dialogIndex > best.routeData.dialogIndex) {
                            best = r;
                        }
                        break;
                    case 4:
                        if (bestLibrary && best.libraryName !== bestLibrary && r.libraryName == bestLibrary) {
                            best = r;
                        }
                        break;
                }
            }
        }
    }
    return best;
}