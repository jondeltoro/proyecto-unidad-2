function ExecuteD3() {
    var m = [30, 10, 10, 10],
        w = 450 - m[1] - m[3],
        h = 600 - m[0] - m[2];
    var x = d3.scale.ordinal().rangePoints([0, w], .5),
        y = {};
    var line = d3.svg.line(),
        axis = d3.svg.axis().orient("left"),
        background,
        foreground;
    var svg = d3.select("#body-d3").append("svg")
        .attr("id", "3dID")
        .attr("width", w + m[1] + m[3])
        .attr("height", h + m[0] + m[2])
        .append("g")
        .attr("transform", "translate(" + m[3] + "," + m[0] + ")");
    d3.csv("https://gist.githubusercontent.com/jondeltoro/c43a741a33192966a1af72b83604627a/raw/19f5e9c44debfd7c33fb53a7316955c7c58bccda/cost-of-living.csv", function (error, cities) {
        if (error) throw error;
        // Extract the list of dimensions and create a scale for each.
        x.domain(dimensions = d3.keys(cities[0]).filter(function (d) {
            return d != "City" && (y[d] = d3.scale.linear()
                .domain(d3.extent(cities, function (p) {
                    return +p[d];
                }))
                .range([h, 0]));
        }));
        // Add grey background lines for context.
        background = svg.append("g")
            .attr("class", "background")
            .selectAll("path")
            .data(cities)
            .enter().append("path")
            .attr("d", path);
        // Add blue foreground lines for focus.
        foreground = svg.append("g")
            .attr("class", "foreground")
            .selectAll("path")
            .data(cities)
            .enter().append("path")
            .attr("d", path);
        // Add a group element for each dimension.
        var g = svg.selectAll(".dimension")
            .data(dimensions)
            .enter().append("g")
            .attr("class", "dimension")
            .attr("transform", function (d) {
                return "translate(" + x(d) + ")";
            });
        // Add an axis and title.
        g.append("g")
            .attr("class", "axis")
            .each(function (d) {
                d3.select(this).call(axis.scale(y[d]));
            })
            .append("text")
            .attr("text-anchor", "middle")
            .attr("y", -9)
            .text(String);
        // Add and store a brush for each axis.
        g.append("g")
            .attr("class", "brush")
            .each(function (d) {
                d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brush", brush));
            })
            .selectAll("rect")
            .attr("x", -8)
            .attr("width", 16);
    });

    // Returns the path for a given data point.
    function path(d) {
        return line(dimensions.map(function (p) {
            return [x(p), y[p](d[p])];
        }));
    }

    // Handles a brush event, toggling the display of foreground lines.
    function brush() {
        var actives = dimensions.filter(function (p) {
                return !y[p].brush.empty();
            }),
            extents = actives.map(function (p) {
                return y[p].brush.extent();
            });
        foreground.style("display", function (d) {
            return actives.every(function (p, i) {
                return extents[i][0] <= d[p] && d[p] <= extents[i][1];
            }) ? null : "none";
        });
    }
}

var keys = [
    "nombre",
    "correo",
    "medio",
    "servicios",
    "comentarios",
    "publicidad",
];

var timeoutHandler = null;

function showForm() {
    hideSavedForms();
    document.querySelector("section#body").classList.add("hidden");
    document.querySelector("section#form").classList.remove("hidden");
}

function saveForm(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();
    var form = event.target;
    if (form && form.reset) {
        var data = keys.reduce(function (acc, el) {
            acc[el] = $('.data-' + el).val();
            if (el === 'publicidad') {
                acc[el] = $('.data-' + el).prop("checked");
            }
            return acc;
        }, {});
        if (data && data['nombre']) {
            var newPostKey = firebase.database().ref().child('informes').push().key;
            var updates = {};
            updates['/informes/' + newPostKey] = data;
            firebase.database().ref().update(updates);
        }
        form.reset();
    }

    document.querySelector("section#form-fields").classList.add("hidden");
    document.querySelector("section#form-sent").classList.remove("hidden");
    var showMain = function () {
        hideForm();
    }
    timeoutHandler = setTimeout(showMain, 4000);

    return false;
}

function hideForm() {
    clearTimeout(timeoutHandler);
    document.querySelector("section#form-fields").classList.remove("hidden");
    document.querySelector("section#form-sent").classList.add("hidden");
    document.querySelector("section#body").classList.remove("hidden");
    document.querySelector("section#form").classList.add("hidden");
}

function goHome() {
    hideForm();
    hideSavedForms();
}

function goSavedForms() {
    hideForm();
    showSavedForms();
}

function showSavedForms() {
    firebase.database().ref('informes').once('value').then(function (snapshot) {
        var datos = snapshot.toJSON();
        if (datos && typeof(datos) === 'object') {
            var table = $('tbody#saved-records');
            table.empty();
            var rows = Object.keys(datos);
            rows.forEach(function (row) {
                var registro = datos[row];
                var tr = $('<tr></tr>')
                var campos = Object.keys(registro);
                campos && keys.forEach(function (campo) {
                    var dato = registro[campo];
                    if (campo !== 'servicios' && campo !== 'publicidad') {
                        tr.append($('<td>' + dato + '</td>'));
                    } else if (campo === 'servicios') {
                        var servKeys = dato ? Object.keys(dato) : [];
                        var servicios = servKeys.reduce(function (acc, el) {
                            acc.push(dato[el])
                            return acc;
                        }, []).join(', ');
                        tr.append($('<td>' + servicios + '</td>'));
                    } else if (campo === 'publicidad') {
                        tr.append($('<td>' + (dato ? 'si' : 'no') + '</td>'));
                    }
                });
                table.append(tr);
            });
        }


        // ...
    });
    document.querySelector("section#body").classList.add("hidden");
    document.querySelector("section#savedforms").classList.remove("hidden");
}

function hideSavedForms() {
    document.querySelector("section#body").classList.remove("hidden");
    document.querySelector("section#savedforms").classList.add("hidden");
}

/* polyfills */
// 1. String.prototype.trim polyfill
if (!"".trim) String.prototype.trim = function () {
    return this.replace(/^[\s﻿]+|[\s﻿]+$/g, '');
};
(function (window) {
    "use strict"; // prevent global namespace pollution
    function checkIfValidClassListEntry(O, V) {
        if (V === "") throw new DOMException(
            "Failed to execute '" + O + "' on 'DOMTokenList': The token provided must not be empty.");
        if ((wsI = V.search(wsRE)) !== -1) throw new DOMException("Failed to execute '" + O + "' on 'DOMTokenList': " +
            "The token provided ('" + V[wsI] + "') contains HTML space characters, which are not valid in tokens.");
    }

// 2. Implement the barebones DOMTokenList livelyness polyfill
    if (typeof DOMTokenList !== "function") (function (window) {
        var document = window.document, Object = window.Object, hasOwnProp = Object.prototype.hasOwnProperty;
        var defineProperty = Object.defineProperty, allowTokenListConstruction = 0, skipPropChange = 0;
        var Element = window.Element, wsI = 0, wsRE = /[\11\12\14\15\40]/; // WhiteSpace Regular Expression
        function DOMTokenList() {
            if (!allowTokenListConstruction) throw TypeError("Illegal constructor"); // internally let it through
        }

        DOMTokenList.prototype.toString = DOMTokenList.prototype.toLocaleString = function () {
            return this.value
        };
        DOMTokenList.prototype.add = function () {
            a: for (var v = 0, argLen = arguments.length, val = "", ele = this["uCL"], proto = ele[" uCLp"]; v !== argLen; ++v) {
                val = arguments[v] + "", checkIfValidClassListEntry("add", val);
                for (var i = 0, Len = proto.length, resStr = val; i !== Len; ++i)
                    if (this[i] === val) continue a; else resStr += " " + this[i];
                this[Len] = val, proto.length += 1, proto.value = resStr;
            }
            skipPropChange = 1, ele.className = proto.value, skipPropChange = 0;
        };
        DOMTokenList.prototype.remove = function () {
            for (var v = 0, argLen = arguments.length, val = "", ele = this["uCL"], proto = ele[" uCLp"]; v !== argLen; ++v) {
                val = arguments[v] + "", checkIfValidClassListEntry("remove", val);
                for (var i = 0, Len = proto.length, resStr = "", is = 0; i !== Len; ++i)
                    if (is) {
                        this[i - 1] = this[i]
                    } else {
                        if (this[i] !== val) {
                            resStr += this[i] + " ";
                        } else {
                            is = 1;
                        }
                    }
                if (!is) continue;
                delete this[Len], proto.length -= 1, proto.value = resStr;
            }
            skipPropChange = 1, ele.className = proto.value, skipPropChange = 0;
        };
        window.DOMTokenList = DOMTokenList;

        function whenPropChanges() {
            var evt = window.event, prop = evt.propertyName;
            if (!skipPropChange && (prop === "className" || (prop === "classList" && !defineProperty))) {
                var target = evt.srcElement, protoObjProto = target[" uCLp"], strval = "" + target[prop];
                var tokens = strval.trim().split(wsRE),
                    resTokenList = target[prop === "classList" ? " uCL" : "classList"];
                var oldLen = protoObjProto.length;
                a: for (var cI = 0, cLen = protoObjProto.length = tokens.length, sub = 0; cI !== cLen; ++cI) {
                    for (var innerI = 0; innerI !== cI; ++innerI) if (tokens[innerI] === tokens[cI]) {
                        sub++;
                        continue a;
                    }
                    resTokenList[cI - sub] = tokens[cI];
                }
                for (var i = cLen - sub; i < oldLen; ++i) delete resTokenList[i]; //remove trailing indexs
                if (prop !== "classList") return;
                skipPropChange = 1, target.classList = resTokenList, target.className = strval;
                skipPropChange = 0, resTokenList.length = tokens.length - sub;
            }
        }

        function polyfillClassList(ele) {
            if (!ele || !("innerHTML" in ele)) throw TypeError("Illegal invocation");
            srcEle.detachEvent("onpropertychange", whenPropChanges); // prevent duplicate handler infinite loop
            allowTokenListConstruction = 1;
            try {
                function protoObj() {
                }

                protoObj.prototype = new DOMTokenList();
            }
            finally {
                allowTokenListConstruction = 0
            }
            var protoObjProto = protoObj.prototype, resTokenList = new protoObj();
            a: for (var toks = ele.className.trim().split(wsRE), cI = 0, cLen = toks.length, sub = 0; cI !== cLen; ++cI) {
                for (var innerI = 0; innerI !== cI; ++innerI) if (toks[innerI] === toks[cI]) {
                    sub++;
                    continue a;
                }
                this[cI - sub] = toks[cI];
            }
            protoObjProto.length = Len - sub, protoObjProto.value = ele.className, protoObjProto[" uCL"] = ele;
            if (defineProperty) {
                defineProperty(ele, "classList", { // IE8 & IE9 allow defineProperty on the DOM
                    enumerable: 1, get: function () {
                        return resTokenList
                    },
                    configurable: 0, set: function (newVal) {
                        skipPropChange = 1, ele.className = protoObjProto.value = (newVal += ""), skipPropChange = 0;
                        var toks = newVal.trim().split(wsRE), oldLen = protoObjProto.length;
                        a: for (var cI = 0, cLen = protoObjProto.length = toks.length, sub = 0; cI !== cLen; ++cI) {
                            for (var innerI = 0; innerI !== cI; ++innerI) if (toks[innerI] === toks[cI]) {
                                sub++;
                                continue a;
                            }
                            resTokenList[cI - sub] = toks[cI];
                        }
                        for (var i = cLen - sub; i < oldLen; ++i) delete resTokenList[i]; //remove trailing indexs
                    }
                });
                defineProperty(ele, " uCLp", { // for accessing the hidden prototype
                    enumerable: 0, configurable: 0, writeable: 0, value: protoObj.prototype
                });
                defineProperty(protoObjProto, " uCL", {
                    enumerable: 0, configurable: 0, writeable: 0, value: ele
                });
            } else {
                ele.classList = resTokenList, ele[" uCL"] = resTokenList, ele[" uCLp"] = protoObj.prototype;
            }
            srcEle.attachEvent("onpropertychange", whenPropChanges);
        }

        try { // Much faster & cleaner version for IE8 & IE9:
            // Should work in IE8 because Element.prototype instanceof Node is true according to the specs
            window.Object.defineProperty(window.Element.prototype, "classList", {
                enumerable: 1, get: function (val) {
                    if (!hasOwnProp.call(ele, "classList")) polyfillClassList(this);
                    return this.classList;
                },
                configurable: 0, set: function (val) {
                    this.className = val
                }
            });
        } catch (e) { // Less performant fallback for older browsers (IE 6-8):
            window[" uCL"] = polyfillClassList;
            // the below code ensures polyfillClassList is applied to all current and future elements in the doc.
            document.documentElement.firstChild.appendChild(document.createElement('style')).styleSheet.cssText = (
                '_*{x-uCLp:expression(!this.hasOwnProperty("classList")&&window[" uCL"](this))}' + //  IE6
                '[class]{x-uCLp/**/:expression(!this.hasOwnProperty("classList")&&window[" uCL"](this))}' //IE7-8
            );
        }
    })();
// 3. Patch in unsupported methods in DOMTokenList
    (function (DOMTokenListProto, testClass) {
        if (!DOMTokenListProto.item) DOMTokenListProto.item = function (i) {
            function NullCheck(n) {
                return n === void 0 ? null : n
            }

            return NullCheck(this[i]);
        };
        if (!DOMTokenListProto.toggle || testClass.toggle("a", 0) !== false) DOMTokenListProto.toggle = function (val) {
            if (arguments.length > 1) return (this[arguments[1] ? "add" : "remove"](val), !!arguments[1]);
            var oldValue = this.value;
            return (this.remove(oldToken), oldValue === this.value && (this.add(val), true) /*|| false*/);
        };
        if (!DOMTokenListProto.replace || typeof testClass.replace("a", "b") !== "boolean")
            DOMTokenListProto.replace = function (oldToken, newToken) {
                checkIfValidClassListEntry("replace", oldToken), checkIfValidClassListEntry("replace", newToken);
                var oldValue = this.value;
                return (this.remove(oldToken), this.value !== oldValue && (this.add(newToken), true));
            };
        if (!DOMTokenListProto.contains) DOMTokenListProto.contains = function (value) {
            for (var i = 0, Len = this.length; i !== Len; ++i) if (this[i] === value) return true;
            return false;
        };
        if (!DOMTokenListProto.forEach) DOMTokenListProto.forEach = function (f) {
            if (arguments.length === 1) for (var i = 0, Len = this.length; i !== Len; ++i) f(this[i], i, this);
            else for (var i = 0, Len = this.length, tArg = arguments[1]; i !== Len; ++i) f.call(tArg, this[i], i, this);
        };
        if (!DOMTokenListProto.entries) DOMTokenListProto.entries = function () {
            var nextIndex = 0, that = this;
            return {
                next: function () {
                    return nextIndex < that.length ? {value: [nextIndex, that[nextIndex]], done: false} : {done: true};
                }
            };
        };
        if (!DOMTokenListProto.values) DOMTokenListProto.values = function () {
            var nextIndex = 0, that = this;
            return {
                next: function () {
                    return nextIndex < that.length ? {value: that[nextIndex], done: false} : {done: true};
                }
            };
        };
        if (!DOMTokenListProto.keys) DOMTokenListProto.keys = function () {
            var nextIndex = 0, that = this;
            return {
                next: function () {
                    return nextIndex < that.length ? {value: nextIndex, done: false} : {done: true};
                }
            };
        };
    })(window.DOMTokenList.prototype, window.document.createElement("div").classList);
})(window);