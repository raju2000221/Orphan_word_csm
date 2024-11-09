document.getElementById("year").innerText = new Date().getFullYear();

let originalContent = []; // Ensure this is accessible globally in your content script

const checkButton = document.getElementById("check");
const resetButton = document.getElementById("reset");
const statusp = document.getElementById("status");

// Event listener for when the user clicks the "Check" button
checkButton.addEventListener("click", () => {
  state("Checking...");

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: fetchContentAndHighlight,
      args: [], // Pass arguments if needed
    });
  });
});

// Event listener for when the user clicks the "Reset" button
resetButton.addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: resetContent,
    });
  });
});

// Function to change the button text and enable/disable reset based on original content
function state(text) {
  statusp.innerHTML = text;
}

// Function to fetch content and highlight spelling errors
function fetchContentAndHighlight() {
  window.originalContent = window.originalContent || [];
  const content = [];
  const tagsToCheck = [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "p",
    "span",
    "li",
    "strong",
    ".faq-block summary",
    ".faq-block .expand",
  ];

  tagsToCheck.forEach((tag) => {
    let mainsiteContent =
      document.getElementById("mainSiteContent") ||
      document.querySelector("main");
    if (mainsiteContent) {
      mainsiteContent.querySelectorAll(tag).forEach((element) => {
        if (!window.originalContent.some((item) => item.element === element)) {
          window.originalContent.push({
            element: element,
            originalHTML: element.innerHTML,
          });
        }

        content.push({ text: element.innerText, element: element });
      });
    } else {
      console.error(
        "Neither #mainSiteContent nor <main> tag was found in the DOM."
      );
    }
  });

  fetch("https://raju.marketalyzer.com/spelling-check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: content.map((item) => item.text).join(" ") }),
  })
    .then((response) => response.json())
    .then((data) => {
      highlightSpellingErrors(data.highlightedText, content);
    })
    .catch((error) => console.error("Error:", error))
    .finally(() => {
      chrome.runtime.sendMessage({ action: "resetButton" });
    });

  function highlightSpellingErrors(highlightedText, content) {
    const wrongWords = highlightedText.split(" ").map(cleanWord);
    function cleanWord(word) {
      return word.replace(/[^\w\s]|_/g, "");
    }
    content.forEach((item) => {
      const cleanedText = item.text.replace(/&nbsp;|[\s]+/g, " ").trim();
      const wordsInElement = cleanedText.split(/\s+/);
      let highlightedTextForElement = "";

      wordsInElement.forEach((word) => {
        const cleanedWord = cleanWord(word);
        highlightedTextForElement += wrongWords.includes(cleanedWord)
          ? ` <span style="background-color: yellow; color: red;">${word}</span>`
          : ` ${word}`;
      });

      item.element.innerHTML = highlightedTextForElement.trim();
    });
  }
}

// Function to reset the content to the original HTML
function resetContent() {
  if (window.originalContent) {
    window.originalContent.forEach((item) => {
      item.element.innerHTML = item.originalHTML;
    });
  }
}

// Listen for message to reset button text in the popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "resetButton") {
    state("Ready to check your content.");
  }
});
