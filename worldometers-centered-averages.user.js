// ==UserScript==
// @name         worldometers centered averages
// @match        https://www.worldometers.info/coronavirus/country/*/
// @grant        unsafeWindow
// @run-at      document-start
// ==/UserScript==

// polyfill for onbeforescriptexecute event handler
// https://github.com/jspenguin2017/Snippets/tree/master
// Library code, licensed under MIT
(() => {
    "use strict";

    const Event = class {
        constructor(script, target) {
            this.script = script;
            this.target = target;

            this._cancel = false;
            this._replace = null;
            this._stop = false;
        }

        preventDefault() {
            this._cancel = true;
        }
        stopPropagation() {
            this._stop = true;
        }
        replacePayload(payload) {
            this._replace = payload;
        }
    };

    let callbacks = [];
    unsafeWindow.addBeforeScriptExecuteListener = (f) => {
        if (typeof f !== "function") {
            throw new Error("Event handler must be a function.");
        }
        callbacks.push(f);
    };
    unsafeWindow.removeBeforeScriptExecuteListener = (f) => {
        let i = callbacks.length;
        while (i--) {
            if (callbacks[i] === f) {
                callbacks.splice(i, 1);
            }
        }
    };

    const dispatch = (script, target) => {
        if (script.tagName !== "SCRIPT") {
            return;
        }

        const e = new Event(script, target);

        if (typeof unsafeWindow.onbeforescriptexecute === "function") {
            try {
                unsafeWindow.onbeforescriptexecute(e);
            } catch (err) {
                console.error(err);
            }
        }

        for (const func of callbacks) {
            if (e._stop) {
                break;
            }
            try {
                func(e);
            } catch (err) {
                console.error(err);
            }
        }

        if (e._cancel) {
            script.textContent = "";
            script.remove();
        } else if (typeof e._replace === "string") {
            script.textContent = e._replace;
        }
    };
    const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
            for (const n of m.addedNodes) {
                dispatch(n, m.target);
            }
        }
    });
    observer.observe(document, {
        childList: true,
        subtree: true,
    });

    console.log("polyfill");
})();
// end polyfill


// https://stackoverflow.com/questions/18120809/equivalent-of-onbeforescriptexecute-in-chrome
// https://stackoverflow.com/questions/22141205/intercept-and-alter-a-sites-javascript-using-greasemonkey

(function() {
    'use strict';

    unsafeWindow.onbeforescriptexecute = function(e)
    {
        var content = e.script.textContent;

        var chart_ids = ["graph-cases-daily", "graph-deaths-daily"];
        var right_script = chart_ids.find((id) => content.search(id) != -1);
        if (right_script === undefined) return;

        console.log("found " + right_script);

        // centering the box filter (phase)
        var replacements = { // key: shift (back)
            '3-day moving average': 1,
            '7-day moving average': 3,
            'Daily Cases': null, // just filter negatives; special feature because their y ranging sucks
        };

        for (let [key,shift] of Object.entries(replacements))
        {
            var regex = new RegExp(String.raw`(name: '${key}',\s*(?:\w+: [^,]+,\s*)*?)data: \[([^\]]+)\]`);
            content = content.replace(regex, (match, g1, g2) => {
                console.log("matching", key, "shift", shift);
                g2 = g2.split(",");

                if (shift === null)
                    g2 = g2.map(el => parseInt(el) >= 0 ? el : "0"); // filter negatives
                else
                    g2 = g2.slice(shift); // shift left

                g2 = g2.join(",");
                return g1 + "data: [" + g2 + "]";
            });
        }

        e.script.textContent = content;
        console.log("replaced");
    };
})();