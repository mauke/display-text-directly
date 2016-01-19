'use strict';

Components.utils.import('resource://gre/modules/Services.jsm');

const http_on_examine_response        = 'http-on-examine-response';
const http_on_examine_cached_response = 'http-on-examine-cached-response';
const http_on_examine_merged_response = 'http-on-examine-merged-response';

const NS_PREFBRANCH_PREFCHANGE_TOPIC_ID = 'nsPref:changed';
const MY_PREF_BRANCH = 'extensions.display-text-directly.';
const MY_PREF_OVERRIDES = 'overrides';

const Ci = Components.interfaces;

const me = {
    branch: null,

    target_pattern: /^(?!)/,
    update_pattern: function () {
        let overrides = this.branch.getCharPref(MY_PREF_OVERRIDES);
        let words = overrides.match(/\S+/g) || [];
        let ct_anychar = "[!#$%&'*+\\-.^`|~\\w]";
        let words_trans = words.map(
            function (s)
                s.replace(/([*?]+)|\W/g,
                    function (m0, m1)
                        m1 ? ct_anychar + '{' + (m1.split('?').length - 1) + (m1.indexOf('*') >= 0 ? ',' : '') + '}' :
                        '\\' + m0
                )
        );
        let combined =
            words_trans.length ? '(?:' + words_trans.join('|') + ')(?![^; \\t])' :
            '(?!)';
        this.target_pattern = new RegExp('^' + combined, 'i');
    },

    observe: function (subject, topic, data) {
        switch (topic) {
            case http_on_examine_response:
            case http_on_examine_cached_response:
            case http_on_examine_merged_response:
            {
                let chan = subject.QueryInterface(Ci.nsIHttpChannel);
                try {
                    let ct_old = chan.contentType;
                    let ct_new = ct_old.replace(this.target_pattern, 'text/plain');
                    if (ct_old === ct_new) break;
                    chan.contentType = ct_new;
                } catch (e) {
                }
                break;
            }

            case NS_PREFBRANCH_PREFCHANGE_TOPIC_ID:
                switch (data) {
                    case MY_PREF_OVERRIDES: {
                        this.update_pattern();
                        break;
                    }
                }
                break;
        }
    },
};

function startup(data, reason) {
    let default_prefs = Services.prefs.getDefaultBranch(MY_PREF_BRANCH);
    default_prefs.setCharPref(MY_PREF_OVERRIDES, 'text/x-*');

    me.branch = Services.prefs.getBranch(MY_PREF_BRANCH);
    me.branch.addObserver('', me, /* weak: */ false);
    me.update_pattern();

    Services.obs.addObserver(me, http_on_examine_response,        /* weak: */ false);
    Services.obs.addObserver(me, http_on_examine_cached_response, /* weak: */ false);
    Services.obs.addObserver(me, http_on_examine_merged_response, /* weak: */ false);
}

function shutdown(data, reason) {
    Services.obs.removeObserver(me, http_on_examine_merged_response);
    Services.obs.removeObserver(me, http_on_examine_cached_response);
    Services.obs.removeObserver(me, http_on_examine_response);

    me.branch.removeObserver('', me);
}

function install(data, reason) {
}

function uninstall(data, reason) {
    if (reason === ADDON_UNINSTALL) {
        Services.prefs.deleteBranch(MY_PREF_BRANCH);
    }
}
