let originalContent = [];
const checkButton = document.getElementById("check"),
  resetButton = document.getElementById("reset"),
  statusp = document.getElementById("status");
function state(e) {
  statusp.innerHTML = e;
}
function fetchContentAndHighlight() {
  window.originalContent = window.originalContent || [];
  const e = [],
    t = [],
    n = new Set();
  [
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
  ].forEach((o) => {
    let i = document.querySelector("body");
    if (i) {
      i.querySelectorAll(o).forEach((t) => {
        window.originalContent.some((e) => e.element === t) ||
          window.originalContent.push({
            element: t,
            originalHTML: t.innerHTML,
          }),
          e.push({ text: t.innerText, element: t });
      }),
        i.querySelectorAll("div").forEach((t) => {
          t.childNodes.forEach((n) => {
            n.nodeType === Node.TEXT_NODE &&
              "" !== n.nodeValue.trim() &&
              (window.originalContent.some((e) => e.element === t) ||
                window.originalContent.push({
                  element: t,
                  originalHTML: t.innerHTML,
                }),
              e.push({ text: n.nodeValue, element: n }));
          });
        }),
        i.querySelectorAll("img").forEach((o) => {
          const i =
              "#" === o.src || "" === o.src
                ? o.getAttribute("data-src")
                : o.src || "No image source found",
            r = o.alt || "No alt text found",
            a = `${i}-${r}`;
          if (!n.has(a) && !i.startsWith("data:image")) {
            n.add(a);
            const c = (i.split("/").pop() || "Not Found")
              .replace(/[-]/g, " ")
              .replace(/\.(jpg|jpeg|png|svg|gif|bmp|webp|tiff)$/i, "");
            t.push({ src: i, alt: r, name: c }),
              e.push({ text: r, element: o }),
              e.push({ text: c, element: o });
          }
        });
    } else window.alert("No content found in the DOM.");
  }),
    fetch("http://localhost:3000/spelling-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: e.map((e) => e.text).join(" ") }),
    })
      .then((e) => e.json())
      .then((n) => {
        !(function (e, t) {
          console.log("highlightedText", e);
          const n = e.split(" ").map(o);
          function o(e) {
            return e.replace(/[^\w\s]|_/g, "");
          }
          function i(e) {
            return e
              .split(/\s+/)
              .map((e) => {
                const t = o(e);
                return n.includes(t)
                  ? `<span style="background-color: yellow; color: red;">${e}</span>`
                  : e;
              })
              .join(" ");
          }
          function r(e) {
            e.childNodes.forEach((e) => {
              if (e.nodeType === Node.TEXT_NODE && e.nodeValue.trim()) {
                const t = i(e.nodeValue),
                  n = document.createElement("span");
                (n.innerHTML = t), e.replaceWith(n);
              } else e.nodeType === Node.ELEMENT_NODE && r(e);
            });
          }
          console.log("wrongWords", n),
            t.forEach((e) => {
              e.element.nodeType === Node.ELEMENT_NODE && r(e.element);
            });
        })(n.highlightedText, e),
          chrome.runtime.sendMessage({
            action: "updateImages",
            images: t,
            highlightedText: n.highlightedText,
          });
      })
      .catch((e) => console.error("Error:", e))
      .finally(() => {
        chrome.runtime.sendMessage({ action: "resetButton" });
      });
}
function resetContent() {
  window.originalContent &&
    window.originalContent.forEach((e) => {
      e.element.nodeType === Node.ELEMENT_NODE
        ? (e.element.innerHTML = e.originalHTML)
        : e.element.nodeType === Node.TEXT_NODE &&
          (e.element.nodeValue = e.originalHTML);
    });
}
checkButton.addEventListener("click", () => {
  state("PLease wait. Checking..."),
    chrome.tabs.query({ active: !0, currentWindow: !0 }, (e) => {
      chrome.scripting.executeScript({
        target: { tabId: e[0].id },
        func: fetchContentAndHighlight,
        args: [],
      });
    });
}),
  resetButton.addEventListener("click", () => {
    chrome.tabs.query({ active: !0, currentWindow: !0 }, (e) => {
      chrome.scripting.executeScript({
        target: { tabId: e[0].id },
        func: resetContent,
      });
    });
  }),
  chrome.runtime.onMessage.addListener((e) => {
    if ("updateImages" === e.action) {
      const o = e.images,
        i = e.highlightedText,
        r = document.getElementById("imagesContainer");
      function t(e, t) {
        const o = t.split(" ").map(n);
        return e
          .split(/\s+/)
          .map((e) =>
            o.includes(n(e))
              ? `<span style="background-color: yellow; color: red;">${e}</span>`
              : e
          )
          .join(" ");
      }
      function n(e) {
        return e.replace(/[^\w\s]|_/g, "");
      }
      (r.innerHTML = ""),
        o.forEach((e) => {
          const n = document.createElement("div"),
            o = t(e.alt, i),
            a = t(e.name, i);
          (n.innerHTML = `\n       <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 15px;">\n        <div>\n        <p><strong>Alt Text:</strong> ${o}</p>\n        <p><strong>Image Name:</strong> ${a}\n        </div>\n        <div><img src="${e.src}" alt="${e.alt}" width=100 height=58></div>\n       </div>\n        <hr>`),
            r.appendChild(n);
        });
    }
  }),
  chrome.runtime.onMessage.addListener((e) => {
    "resetButton" === e.action && state("Ready to check your content.");
  }),
  (document.getElementById("year").innerText = new Date().getFullYear());
