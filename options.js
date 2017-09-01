'use strict';
const SETTINGS_CONTENT_TYPES_KEY = 'content_types';
const content_types_field = document.getElementById('content_types');

function log_error(e) {
    console.log('Error: ' + e);
}

function update_form(value) {
    content_types_field.value = value;
}

document.getElementById('options').addEventListener('submit', (e) => {
    e.preventDefault();
    const content_types = content_types_field.value;
    browser.storage.local.set({ [SETTINGS_CONTENT_TYPES_KEY]: content_types }).then(null, log_error);
});

browser.storage.local.get(SETTINGS_CONTENT_TYPES_KEY).then(
    (result) => {
        update_form(result[SETTINGS_CONTENT_TYPES_KEY] || '');
        content_types_field.disabled = false;
        document.getElementById('save').disabled = false;
    },
    log_error
);
