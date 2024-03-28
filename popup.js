const copyContentSet = new Set(['localStorage', 'sessionStorage', 'cookies']);

// When the popup Paste Button is clicked
const onCopyButtonClick = () => {
    chrome.tabs.query(
        {
            status: 'complete',
            windowId: chrome.windows.WINDOW_ID_CURRENT,
            active: true,
        },
        tab => {
            chrome.tabs.sendMessage(tab[0].id, { name: "from_pupop_get_storages" }, function(response) {
                if (response) {
                    localStorage.copyStorageData = JSON.stringify(response)
                }
            });

            chrome.cookies.getAll({ url: tab[0].url }, cookie => {
                localStorage.copyCookieData = JSON.stringify(cookie);
                setTimeout(() => handlePopupUI('copy'), 100);
            });
        },
    );
};

const removeOldCookies = (cookies, index, url) => {
    if (!cookies[index]) return;

    try {
        chrome.cookies.remove({
            url: url + cookies[index].path,
            name: cookies[index].name,
        }, () => removeOldCookies(cookies, index + 1, url));
    } catch (e) {
        console.error(`There was an error removing the cookies: ${error}`, cookies[index].name);
    }
};

const clearStorages = () => {
    chrome.tabs.query(
        {
            status: 'complete',
            windowId: chrome.windows.WINDOW_ID_CURRENT,
            active: true,
        },
        tab => {
            chrome.tabs.sendMessage(tab[0].id, { name: "from_pupop_clear_storages", value: Array.from(copyContentSet.values()).join(',') }, function(response) {
                document
                    .getElementById('clearButton').innerHTML = '已清除'
            });

            if (copyContentSet.has('cookies')) {
                chrome.cookies.getAll({ url: tab[0].url }, cookies => {
                    removeOldCookies(cookies, 0, tab[0].url);
                });
            }
        },
    );
}

// When the popup Paste Button is clicked
const onPasteButtonClick = async () => {
    let copyCookieData;
    let copyStorageData
    try {
        copyCookieData = localStorage.copyCookieData
            ? JSON.parse(localStorage.copyCookieData)
            : null;
        copyStorageData = localStorage.copyStorageData
            ? JSON.parse(localStorage.copyStorageData)
            : null;
    } catch (e) {
        return alert('Error parsing cookies. Please try again.');
    }

    if (!copyCookieData)
        return alert('Uh-Oh! You need to copy the cookies first.');

    chrome.tabs.query(
        {
            status: 'complete',
            windowId: chrome.windows.WINDOW_ID_CURRENT,
            active: true,
        },
        tab => {
            if (!tab?.[0]?.url) {
                return alert('Uh-Oh! Tab with invalid URL.');
            }

            if (copyContentSet.has('cookies')) {
                chrome.cookies.getAll({ url: tab[0].url }, cookies => {
                    copyCookieData.forEach(({ name, value, path }) => {
                        try {
                            chrome.cookies.set({
                                url: tab[0].url,
                                name,
                                value,
                            });
                        } catch (error) {
                            console.error(`There was an error: ${error}`);
                        }
                    });
                    onResetButtonClick('paste');
                });
            }

            if (copyContentSet.has('localStorage')) {
                chrome.tabs.sendMessage(tab[0].id, { name: "from_pupop_send_local_storage", value: copyStorageData.local });
            }

            if (copyContentSet.has('sessionStorage')) {
                chrome.tabs.sendMessage(tab[0].id, { name: "from_pupop_send_session_storage", value: copyStorageData.session });
            }
        }
    );
};

// When the popup Reset Button is clicked
const onResetButtonClick = action => {
    localStorage.removeItem('copyCookieData');
    handlePopupUI(action);
};

const handlePopupUI = action => {
    const copyCookieData = localStorage.copyCookieData;
    const containerElement = document.getElementById('container');
    containerElement.setAttribute('class', '');

    if (copyCookieData) {
        containerElement.classList.add('container2');
    } else {
        containerElement.classList.add('container1');
    }

    const successPasteLabel = document.getElementById('successPasteLabel');
    const welcomeLabel = document.getElementById('welcomeLabel');
    if (action === 'paste') {
        successPasteLabel.setAttribute('style', 'display: block');
    } else {
        successPasteLabel.setAttribute('style', 'display: none');
    }
};

// When the popup HTML has loaded
window.addEventListener('load', () => {
    handlePopupUI();

    document
        .getElementById('copyButton')
        .addEventListener('click', onCopyButtonClick);
    document
        .getElementById('clearButton')
        .addEventListener('click', clearStorages);
    document
        .getElementById('pasteButton')
        .addEventListener('click', onPasteButtonClick);
    document
        .getElementById('resetButton')
        .addEventListener('click', () => onResetButtonClick('reset'));

    const radios = document
    .getElementsByClassName('radio')

    for (let index = 0; index < radios.length; index++) {
        const element = radios[index];
        element.checked = true;
        element.parentElement.addEventListener('click', (evt) => {
            if (copyContentSet.has(element.value)) {
                copyContentSet.delete(element.value)
                element.checked = false
                element.removeAttribute('checked')
            } else {
                copyContentSet.add(element.value)
                element.checked = true
            }
        })
    }
});
