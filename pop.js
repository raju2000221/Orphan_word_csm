let orginalContent = "";

// Function to fetch the content
function fetch() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: fetchIframeContent,
    });
  });
}



// Save content before switching styles
function saveBeforeSwitch() {
  const mainContent = document.getElementById("mainSiteContent");
  if (mainContent) {
    // Save the current innerHTML of the updateContent div
    const updateContentDiv = document.getElementById("updateContent");
    if (updateContentDiv) {
      orginalContent = updateContentDiv.innerHTML;
    }
  }
}

// Switch to the left-content layout
document.getElementById("leftcontent").addEventListener("click", () => {
  saveBeforeSwitch(); // Save current content before switching
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: leftContent,
    });
  });
});

// Switch to the right-content layout
document.getElementById("rightcontent").addEventListener("click", () => {
  saveBeforeSwitch(); // Save current content before switching
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: rightContent,
    });
  });
});

// Switch to the common layout
document.getElementById("common").addEventListener("click", () => {
  saveBeforeSwitch(); // Save current content before switching
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: common,
    });
  });
});

// Function for common content style
function common() {
  const mainContent = document.getElementById("mainSiteContent");
  if (mainContent) {
    mainContent.innerHTML = "";  
    setTimeout(() => {
      const newContent = `
            <div class="common-sec" spellcheck="false">
                <div class="" id="updateContent" contenteditable="true">
                 ${orginalContent}
                </div>
            </div>
        `;
      mainContent.innerHTML = newContent;

      // Add event listener for 'blur' to save updated content
      const updateContentDiv = document.getElementById("updateContent");
      updateContentDiv.addEventListener("blur", saveContent);
    }, 50); // Wait 50ms to ensure content clearing is complete
  }
}

// Function for right-content style
function rightContent() {
  const mainContent = document.getElementById("mainSiteContent");
  if (mainContent) {
    mainContent.innerHTML = "";  
    setTimeout(() => {
      const newContent = `
            <div class="common-sec" spellcheck="false">
                <div class="row align-items-center">
                    <div class="col-lg-6 order-lg-last">
                        <div class="img-box">
                            <img src="/images/.jpg" alt="" />
                        </div>
                    </div>
                    <div class="col-lg-6" id="updateContent" contenteditable="true">
                        ${orginalContent}
                    </div>
                </div>
            </div>
        `;
      mainContent.innerHTML = newContent;

      // Add event listener for 'blur' to save updated content
      const updateContentDiv = document.getElementById("updateContent");
      updateContentDiv.addEventListener("blur", saveContent);
    }, 50); // Wait 50ms to ensure content clearing is complete
  }
}

// Function for left-content style
function leftContent() {
  const mainContent = document.getElementById("mainSiteContent");
  if (mainContent) {
    mainContent.innerHTML = "";  
    setTimeout(() => {
      const newContent = `
            <div class="common-sec" spellcheck="false">
                <div class="row align-items-center">
                    <div class="col-lg-6">
                        <div class="img-box">
                            <img src="/images/.jpg" alt="" />
                        </div>
                    </div>
                    <div class="col-lg-6" id="updateContent" contenteditable="true">
                        ${orginalContent}
                    </div>
                </div>
            </div>
        `;
      mainContent.innerHTML = newContent;

      // Add event listener for 'blur' to save updated content
      const updateContentDiv = document.getElementById("updateContent");
      updateContentDiv.addEventListener("blur", saveContent);
    }, 50); // Wait 50ms to ensure content clearing is complete
  }
}

// Fetch the editable content from the iframe or div
function fetchIframeContent() {
  const mainContent = document.getElementById("mainSiteContent");
  const updateContent = document.getElementById("updateContent");
  if (mainContent) {
    orginalContent = updateContent ? updateContent.innerHTML : mainContent.innerHTML;
  }
}

// Function to save the updated user-edited content
window.saveContent = function() { // Make saveContent globally accessible
  const mainContent = document.getElementById("updateContent");
  if (mainContent) {
    orginalContent = mainContent.innerHTML; // Update orginalContent with new user input
  }
}

// Call the fetch function to initialize
fetch();