chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'fetchTags') {
        const { postId } = message;

        console.log(`Fetching tags for post ID: ${postId}`);
        
        // Get cookies for the request
        chrome.cookies.getAll({ url: "https://rule34.xxx" }, async (cookies) => {
            try {
                // Build the Cookie header
                const cookieHeader = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join("; ");

                // Fetch the page with cookies included
                const response = await fetch(`https://rule34.xxx/index.php?page=post&s=view&id=${postId}`, {
                    headers: {
                        "Cookie": cookieHeader
                    }
                });

                // Check if the response is OK
                if (!response.ok) {
                    console.error(`Failed to fetch the page. Status: ${response.status}`);
                    sendResponse({ success: false, error: `HTTP error ${response.status}` });
                    return;
                }

                // Get the response text
                const text = await response.text();

                // Parse the page content
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, 'text/html');

                // Find the tag sidebar
                const tagSidebar = doc.querySelector('#tag-sidebar');
                if (!tagSidebar) {
                    console.error('Tag sidebar not found in the response.');
                    sendResponse({ success: false, error: 'Tag sidebar not found.' });
                    return;
                }

                // Parse the tags into categories
                const categories = {
                    Copyright: [],
                    Character: [],
                    Artist: [],
                    General: [],
                    Meta: []
                };

                tagSidebar.querySelectorAll('li').forEach((tagItem) => {
                    const tagText = tagItem.textContent.replace(/\s+/g, ' ').trim(); // Clean up text
                    if (tagItem.classList.contains('tag-type-copyright')) {
                        categories.Copyright.push(tagText);
                    } else if (tagItem.classList.contains('tag-type-character')) {
                        categories.Character.push(tagText);
                    } else if (tagItem.classList.contains('tag-type-artist')) {
                        categories.Artist.push(tagText);
                    } else if (tagItem.classList.contains('tag-type-general')) {
                        categories.General.push(tagText);
                    } else if (tagItem.classList.contains('tag-type-metadata')) {
                        categories.Meta.push(tagText);
                    }
                });

                console.log('Parsed and cleaned categories:', categories);
                sendResponse({ success: true, categories });
            } catch (error) {
                console.error('Error while fetching or parsing tags:', error.message);
                sendResponse({ success: false, error: error.message });
            }
        });

        // Return true to indicate async response
        return true;
    }
});
