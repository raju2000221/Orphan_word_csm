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

// Switch to the left-content layout
document.getElementById("leftcontent").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: leftContent,
    });
  });
});

// Switch to the right-content layout
document.getElementById("rightcontent").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: rightContent,
    });
  });
});

// Switch to the common layout
document.getElementById("common").addEventListener("click", () => {
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
      const newContent = `
            <div class="common-sec" >
                <div class="" id="updateContent">
                 ${orginalContent}
                </div>
            </div>
        `;
      mainContent.innerHTML = newContent;
  }
}

// Function for right-content style
function rightContent() {
  const mainContent = document.getElementById("mainSiteContent");
  if (mainContent) {
    mainContent.innerHTML = "";  

      const newContent = `
            <div class="common-sec" spellcheck="false">
                <div class="row align-items-center">
                    <div class="col-lg-6 order-lg-last">
                        <div class="img-box">
                            <img src="/images/.jpg" alt="" />
                        </div>
                    </div>
                    <div class="col-lg-6" id="updateContent" contenteditable="true" spellcheck="true">
                        ${orginalContent}
                    </div>
                </div>
            </div>
        `;
      mainContent.innerHTML = newContent;
  }
}

// Function for left-content style
function leftContent() {
  const mainContent = document.getElementById("mainSiteContent");
  if (mainContent) {
    mainContent.innerHTML = "";  
      const newContent = `
            <div class="common-sec" spellcheck="false">
                <div class="row align-items-center">
                    <div class="col-lg-6">
                        <div class="img-box">
                            <img src="/images/.jpg" alt="" />
                        </div>
                    </div>
                    <div class="col-lg-6" id="updateContent" contenteditable="true" spellcheck="true">
                        ${orginalContent}
                    </div>
                </div>
            </div>
        `;
      mainContent.innerHTML = newContent;
  }
}

function fetchIframeContent() {
  const mainContent = document.getElementById("mainSiteContent");
  const updateContent = document.getElementById("updateContent");
  if (mainContent) {
    orginalContent = updateContent ? updateContent.innerHTML : mainContent.innerHTML;
  }
}

// Call the fetch function to initialize
fetch();