// content_script.js


chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    // 可以在这里对消息进行处理
    if (message.name === "from_pupop_get_storages") {
        
        const allLocalStorage = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            allLocalStorage[key] = value;
        }

        // 获取所有sessionStorage键值对
        const allSessionStorage = {};
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            const value = sessionStorage.getItem(key);
            allSessionStorage[key] = value;
        }

        sendResponse({
            local: allLocalStorage,
            session: allSessionStorage,
        })
    }

    if (message.name === "from_pupop_send_local_storage") {
        console.log('from_pupop_send_local_storage', message.value);
        for (const key in message.value) {
            if (Object.hasOwnProperty.call(message.value, key)) {
                const element = message.value[key];
                localStorage.setItem(key, element)
            }
        }
    }

    if (message.name === "from_pupop_send_session_storage") {
        console.log('from_pupop_send_session_storage', message.value);

        for (const key in message.value) {
            if (Object.hasOwnProperty.call(message.value, key)) {
                const element = message.value[key];
                sessionStorage.setItem(key, element)
            }
        }
    }

    if (message.name === "from_pupop_clear_storages") {
        console.log('from_pupop_clear_storages', message.value);

        if (message.value.includes('sessionStorage')) {
            sessionStorage.clear();
        }
        if (message.value.includes('localStorage')) {
            localStorage.clear();
        }
    }

    // 如果需要，可以向popup.js发送回复消息
    // sendResponse({ received: true });
});
