'use strict';

const SETTINGS_CONTENT_TYPES_KEY = 'content_types';
const FAIL_RE = /^(?!)/;

let Current_content_type_re = FAIL_RE;

function regex_from_content_type_globs(patterns) {
    const any_char   = "[!#$%&'*+\\-.^`|~\\w]";
    const end_of_str = '(?![^; \\t])';
    function tr_simple_chunk(pat) {
        return pat.replace(/\W/g,
            m0 => m0 === '?'
                ? any_char
                : '\\' + m0
        );
    }

    if (!patterns || patterns.length === 0) return FAIL_RE;

    let n_group = 1;
    let regex = '';
    for (const pat_raw of patterns) {
        const pat = pat_raw.replace(/[*?]{2,}/g,
            m0 => m0.replace(/[^?]+/g, '') + (/\*/.test(m0) ? '*' : '')
        );
        if (regex) regex += '|';
        regex += pat.replace(/\W[^*]*/g, (m0, mp, ms) => {
            if (m0.charAt(0) !== '*') return tr_simple_chunk(m0);
            const eos = mp + m0.length === ms.length ? end_of_str : '';
            return '(?=(' + any_char + '*?' + tr_simple_chunk(m0.substr(1)) + eos + '))\\' + n_group++;
        });
    }

    return new RegExp('^(?:' + regex + ')' + end_of_str, 'i');
}

function update_content_type_regex(value) {
    const patterns = (value || '').match(/\S+/g);
    Current_content_type_re = regex_from_content_type_globs(patterns);
}

browser.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (!changes[SETTINGS_CONTENT_TYPES_KEY]) return;
    update_content_type_regex(changes[SETTINGS_CONTENT_TYPES_KEY].newValue);
});

browser.webRequest.onHeadersReceived.addListener(
    (details) => {
        const headers = details.responseHeaders;
        for (const header of headers) {
            if (header.name.toLowerCase() === 'content-type') {
                const old_value = header.value;
                if (old_value) {
                    const new_value = old_value.replace(Current_content_type_re, 'text/plain');
                    if (new_value !== old_value) {
                        header.value = new_value;
                        return { responseHeaders: headers };
                    }
                }
                break;
            }
        }
        return {};
    },
    {
        urls:  ['*://*/*'],
        types: ['main_frame', 'sub_frame']
    },
    ['blocking', 'responseHeaders']
);

function log_error(e) {
    console.log('Error: ' + e);
}

browser.storage.local.get(SETTINGS_CONTENT_TYPES_KEY).then(
    (result) => {
        if (result[SETTINGS_CONTENT_TYPES_KEY]) {
            update_content_type_regex(result[SETTINGS_CONTENT_TYPES_KEY]);
        } else {
            browser.storage.local.set({ [SETTINGS_CONTENT_TYPES_KEY]: 'text/x-*' }).then(null, log_error);
        }
    },
    log_error
);
