'use strict';

Components.utils.import('resource://gre/modules/Services.jsm');

const http_on_examine_response        = 'http-on-examine-response';
const http_on_examine_cached_response = 'http-on-examine-cached-response';
const http_on_examine_merged_response = 'http-on-examine-merged-response';

const Ci = Components.interfaces;

const observer = {
    observe: function (subject, topic, data) {
        switch (topic) {
            case http_on_examine_response:
            case http_on_examine_cached_response:
            case http_on_examine_merged_response:
            {
                let chan = subject.QueryInterface(Ci.nsIHttpChannel);
                try {
                    let ct_old = chan.contentType;
                    let ct_new = ct_old.replace(/^text\/x-[^;]*/i, 'text/plain');
                    if (ct_old === ct_new) break;
                    chan.contentType = ct_new;
                } catch (e) {
                }
                break;
            }
        }
    },
};

function startup(data, reason) {
    Services.obs.addObserver(observer, http_on_examine_response,        /* weak: */ false);
    Services.obs.addObserver(observer, http_on_examine_cached_response, /* weak: */ false);
    Services.obs.addObserver(observer, http_on_examine_merged_response, /* weak: */ false);
}

function shutdown(data, reason) {
    Services.obs.removeObserver(observer, http_on_examine_merged_response);
    Services.obs.removeObserver(observer, http_on_examine_cached_response);
    Services.obs.removeObserver(observer, http_on_examine_response);
}

function install(data, reason) {
}

function uninstall(data, reason) {
}
