export function createSideBarUI() {

    let sizes = localStorage.getItem('split-sizes')
    if (sizes) {
        sizes = JSON.parse(sizes)
    } else {
        sizes = [50, 50] // default sizes
    }

    const sidebar = document.querySelector("#sidebar")
    let instance = Split(['#sidebar', '#main'], {
        minSize: [0, 0], 
        sizes: sizes, 
        onDragEnd: (sizes) => {
            if (sizes[0] < 30) {
                instance.setSizes([0, 100])
                sidebar.style.display = "none"
            }
            localStorage.setItem("split-sizes", JSON.stringify(instance.getSizes()))
        }, 
        onDragStart: (sizes) => {
            if (sizes[0] < 1) { // är aldrig exakt 0 av någon anledning
                instance.setSizes([30, 70])
                sidebar.style.display = ""
            }
        }
    })
    if (instance.getSizes()[0] < 1) { //rember hidden sidebar onload
        sidebar.style.display = "none" 
    }
}

export function createNavbarUI() {

    const navbar = document.querySelector(".navbar")
    navbar.addEventListener("click", (e) => { activateNavItem(e.target) })

    function activateNavItem(item) {
        if (item.classList.contains("nav-item")) {
            const currentActive = item

            const lastActive = document.querySelector(".active")
            lastActive.classList.remove("active")
            currentActive.classList.add("active")
    
            lastActive.style.backgroundColor = ""
            currentActive.style.backgroundColor = "rgb(78, 112, 112)"
    
            const lastActiveRelated = getRelatedSection(lastActive)
            const currentActiveRelated = getRelatedSection(currentActive)
    
            lastActiveRelated.style.display = "none"
            currentActiveRelated.style.display = ""
        }
    }

    // set default active tab
    for(let navItem of document.getElementsByClassName("nav-item")) {
        if (!navItem.classList.contains("active")) {
            const relatedSection = getRelatedSection(navItem)
            relatedSection.style.display = "none"
        }
    }
    function getRelatedSection(el) {
        const relId = el.id.slice(0, -4) // remove "-tab"
        return document.getElementById(relId)
    }
}

export function createFpsUI() {

    let stats = new Stats()
    const statsDom = stats.domElement
    document.body.append(statsDom)
    statsDom.style.left = ""
    statsDom.style.right = "0px"  
    statsDom.setAttribute("class", "stats")

    return stats
}

export function createCodeUI(template, templates, createSceneOnLoad, storeEditorCode) {
    for (let [key, snippet] of Object.entries(template.snippets)) {
        const name = snippet.className

        const mainSection = qs("#main-code-section")

        const overEditor = addElement("div", {class: "over-editor"}, mainSection)
        const dropdown = addElement("div", {class: "dropdown"}, overEditor)
        const dropdownContent = addElement("div", {class: "dropdown-content"}, dropdown)
        const switchButton = addElement("button", {}, dropdown, snippet.name)
        const resetButton = addElement("button", {}, overEditor, "Reset to default")

        const editorDiv = addElement("div", {class: "editor"}, mainSection)
        const codeInput = addElement("code-input", {lang: "glsl", class: name}, editorDiv)

        resetButton.addEventListener("click", ()=> {
            storeEditorCode(snippet, true) //fix
            createSceneOnLoad()
        })

        for (const [temName, tem] of Object.entries(templates[key])) {
            const link = addElement("a", {id: tem.className}, dropdownContent, tem.name)

            link.addEventListener("click", (e)=> { // change template and update
                template.snippets[key] = templates[key][tem.className]
                createSceneOnLoad()
            })
        }
    }
}

export function createSliderUI() {
    const allSliders = JSON.parse(localStorage.getItem("allSliders")) || []
    for (let [id, sliderAttrs] of Object.entries(allSliders)) {
        createCustomVarUI(sliderAttrs)
    }

    const xMarks = document.querySelectorAll(".close-btn")
    for (let xMark of xMarks) {
        xMark.addEventListener("click", (e) => { 
            const relSlider = e.target.closest(".c1").querySelector("[name='var-value']")
            if (!relSlider.getAttribute("varName")) { return }
            deleteUniform(relSlider.getAttribute("varName"))
        })
    }
}

export function createErrorsUI(err, errorObject) {
    clearErrorsUI()

    const mainCodeSection = qs("#main-code-section")
    const errorsSection = addElement("div", {class: 'errors-section'})
    mainCodeSection.prepend(errorsSection)
    addElement("h1", {}, errorsSection, "Errors: ")

    for (let [lineNum, value] of Object.entries(errorObject)) {
        let [messages, relevantLine] = [value.messages, value.relevantLine]
        const errorContainer = addElement("div", {class: "error-container"}, errorsSection)

        const pre = addElement("pre", {class: "error-line-code"}, errorContainer)
        const codeErrorLine = addElement("code", {class: "language-glsl"}, pre, relevantLine)
        Prism.highlightElement(codeErrorLine)

        for (let message of messages) {
            addElement("div", {class: "error-msg"}, errorContainer, message)
        }
    }
}
export function clearErrorsUI() {
    const errorsSection = document.querySelector(".errors-section")
    console.log(errorsSection)
    if (errorsSection) { errorsSection.style.display = "none" }
}

// Helper functions
function addElement(tag, attrs, parent, innerHTML) {
    const el = document.createElement(tag)
    if (attrs) {
        for (let [attr, val] of Object.entries(attrs)) { el.setAttribute(attr, val) }
    }
    el.innerHTML = innerHTML || ""

    if (parent) { parent.appendChild(el) }
    return el
}
function qs(query) {
    const res =  document.querySelectorAll(query)
    if (res.length === 1) { return res[0] }
    if (res.length === 0) { return null }
    return res
}
