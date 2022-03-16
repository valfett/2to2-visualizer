// codeInput
// by WebCoder49
// Based on a CSS-Tricks Post
// Needs Prism.js

var codeInput = {
  update: function(text, code_input) {
    //code_input.setAttribute("value", text);
    let result_element = code_input.getElementsByClassName("editor-code")[0];
    // Handle final newlines (see article)
    if(text[text.length-1] == "\n") {
      text += " ";
    }
    // Update code
    result_element.innerHTML = text.replace("&gt;", ">").replace("&lt;", "<")
    // Syntax Highlight
    Prism.highlightElement(result_element);
  },

  sync_scroll: function(element, code_input) {
    /* Scroll result to scroll coords of event - sync with textarea */
    let result_element = code_input.getElementsByClassName("editor-pre")[0];
    // Get and set x and y
    result_element.scrollTop = element.scrollTop;
    result_element.scrollLeft = element.scrollLeft;
  }

//   check_tab: function(element, event) {
//     let code = element.value;
//     console.log(element)
//     if(event.key == "Tab") {
//       /* Tab key pressed */
//       event.preventDefault(); // stop normal
//       let before_tab = code.slice(0, element.selectionStart); // text before tab
//       let after_tab = code.slice(element.selectionEnd, element.value.length); // text after tab
//       let cursor_pos = element.selectionEnd + 2; // after tab placed, where cursor moves to - 2 for 2 spaces
//       code = before_tab + "  " + after_tab; // add tab char - 2 spaces

//       // move cursor
//       element.selectionStart = cursor_pos;
//       element.selectionEnd = cursor_pos;

//       let result_element = element.parentElement.getElementsByClassName("editor-code")[0];
//       result_element.innerHTML = code
//       Prism.highlightElement(result_element)
//     }
//   }
}

class CodeInput extends HTMLElement { // Create code input element
  constructor() {
    super(); // Element
  }
  connectedCallback() {
    
    /* Defaults */
    let lang = this.getAttribute("lang") || "glsl";
    let placeholder = this.getAttribute("placeholder") || "Enter " + this.lang + " Source Code";
    let value = this.getAttribute("value") || this.innerHTML;
    
    this.innerHTML = ""; // Clear Content
    
    /* Create Textarea */
    let textarea = document.createElement("textarea");
    textarea.placeholder = placeholder;
    textarea.value = value;
    textarea.className = "editor-textarea";
    textarea.setAttribute("spellcheck", "false");
    
    textarea.setAttribute("oninput", "codeInput.update(this.value, this.parentElement); codeInput.sync_scroll(this, this.parentElement);");
    textarea.setAttribute("onscroll", "codeInput.sync_scroll(this, this.parentElement);");
    // textarea.setAttribute("onkeydown", "codeInput.check_tab(this, event);");
    
    this.append(textarea);
 
    /* Create pre code */
    let code = document.createElement("code");
    code.className = "editor-code language-" + lang; // Language for Prism.js
    code.innerText = value;
    
    let pre = document.createElement("pre");
    pre.className = "editor-pre";
    pre.append(code);
    this.append(pre);
    
    /* Add code from value attribute - useful for loading from backend */
    let text = value;
    let result_element = code
    
    // Handle final newlines (see article)
    if(text[text.length-1] == "\n") {
      text += " ";
    }
    
    // Update code
    result_element.innerHTML = text
    // Syntax Highlight
    Prism.highlightElement(result_element);
  }
  static get observedAttributes() {
    return ["value", "placeholder"]; // Attributes to monitor
  }
}

customElements.define("code-input", CodeInput); // Set tag
