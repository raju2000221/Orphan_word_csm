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
  const images = []; // Array to store unique image details
  const imageSources = new Set(); // Set to track unique image sources
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
    "a",
    "div",
    ".faq-block summary",
    ".faq-block .expand",
  ];

  tagsToCheck.forEach((tag) => {
    let mainsiteContent = document.querySelector("body");
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

      // Handle both text nodes and elements inside divs
      mainsiteContent.querySelectorAll("div").forEach((divElement) => {
        divElement.childNodes.forEach((child) => {
          if (
            child.nodeType === Node.TEXT_NODE &&
            child.nodeValue.trim() !== ""
          ) {
            // Store the original text content of direct text nodes in divs
            if (
              !window.originalContent.some(
                (item) => item.element === divElement
              )
            ) {
              window.originalContent.push({
                element: divElement,
                originalHTML: divElement.innerHTML,
              });
            }
            content.push({ text: child.nodeValue, element: child });
          }
        });
      });

      function formatImageName(name) {
        // Remove hyphens and periods, then remove common image extensions
        return name
          .replace(/[-]/g, " ")
          .replace(/\.(jpg|jpeg|png|svg|gif|bmp|webp|tiff)$/i, "");
      }

      mainsiteContent.querySelectorAll("img").forEach((imgElement) => {
        const imageSrc =
          imgElement.src === "#" || imgElement.src === ""
            ? imgElement.getAttribute("data-src")
            : imgElement.src || "No image source found";

        const altText = imgElement.alt || "No alt text found";
        const imageSource = `${imageSrc}-${altText}`;
        if (
          !imageSources.has(imageSource) &&
          !imageSrc.startsWith("data:image")
        ) {
          imageSources.add(imageSource);
          const imageName = formatImageName(
            imageSrc.split("/").pop() || "Not Found"
          );

          images.push({ src: imageSrc, alt: altText, name: imageName });
          content.push({ text: altText, element: imgElement });
          content.push({ text: imageName, element: imgElement });
        }
      });
    } else {
      window.alert("No content found in the DOM.");
    }
  });

  fetch("http://localhost:3000/spelling-check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: content.map((item) => item.text).join(" ") }),
  })
    .then((response) => response.json())
    .then((data) => {
      highlightSpellingErrors(data.highlightedText, content);
      chrome.runtime.sendMessage({
        action: "updateImages",
        images: images,
        highlightedText: data.highlightedText,
      });
    })
    .catch((error) => console.error("Error:", error))
    .finally(() => {
      chrome.runtime.sendMessage({ action: "resetButton" });
    });

  function highlightSpellingErrors(highlightedText, content) {
    console.log("highlightedText", highlightedText);
    const wrongWords = highlightedText.split(" ").map(cleanWord);
    console.log("wrongWords", wrongWords);
    function cleanWord(word) {
      return word.replace(/[^\w\s]|_/g, "");
    }

    function highlightTextNode(text) {
      const wordsInText = text.split(/\s+/);
      return wordsInText
        .map((word) => {
          const cleanedWord = cleanWord(word);
          return wrongWords.includes(cleanedWord)
            ? `<span style="background-color: yellow; color: red;">${word}</span>`
            : word;
        })
        .join(" ");
    }

    function highlightDirectTextNodes(element) {
      element.childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim()) {
          // Apply highlighting to text directly in text nodes
          const highlightedHTML = highlightTextNode(node.nodeValue);
          const spanWrapper = document.createElement("span");
          spanWrapper.innerHTML = highlightedHTML;
          node.replaceWith(spanWrapper);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          // Recursively handle nested elements
          highlightDirectTextNodes(node);
        }
      });
    }

    content.forEach((item) => {
      if (item.element.nodeType === Node.ELEMENT_NODE) {
        highlightDirectTextNodes(item.element);
      }
    });
  }
}

// Listen for the image data
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "updateImages") {
    const images = message.images;
    const highlightedText = message.highlightedText;

    const imagesContainer = document.getElementById("imagesContainer");
    imagesContainer.innerHTML = "";

    images.forEach((image) => {
      const imageElement = document.createElement("div");

      const highlightedAlt = highlightMisspelledWords(
        image.alt,
        highlightedText
      );
      const highlightedName = highlightMisspelledWords(
        image.name,
        highlightedText
      );

      imageElement.innerHTML = `
       <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 15px;">
        <div>
        <p><strong>Alt Text:</strong> ${highlightedAlt}</p>
        <p><strong>Image Name:</strong> ${highlightedName}
        </div>
        <div><img src="${image.src}" alt="${image.alt}" width=100 height=58></div>
       </div>
        <hr>`;
      imagesContainer.appendChild(imageElement);
    });

    function highlightMisspelledWords(text, highlightedText) {
      const wrongWords = highlightedText.split(" ").map(cleanWord);
      return text
        .split(/\s+/)
        .map((word) =>
          wrongWords.includes(cleanWord(word))
            ? `<span style="background-color: yellow; color: red;">${word}</span>`
            : word
        )
        .join(" ");
    }

    function cleanWord(word) {
      return word.replace(/[^\w\s]|_/g, "");
    }
  }
});

// Function to reset the content to the original HTML
function resetContent() {
  if (window.originalContent) {
    window.originalContent.forEach((item) => {
      if (item.element.nodeType === Node.ELEMENT_NODE) {
        item.element.innerHTML = item.originalHTML;
      } else if (item.element.nodeType === Node.TEXT_NODE) {
        item.element.nodeValue = item.originalHTML;
      }
    });
  }
}

// Listen for message to reset button text in the popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "resetButton") {
    state("Ready to check your content.");
  }
});

document.getElementById("year").innerText = new Date().getFullYear();
