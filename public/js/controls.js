function saveCustomVar(attrs) {
    const allSliders = JSON.parse(localStorage.getItem("allSliders")) || {}

    allSliders[Number(attrs.varId.value)] = Object.fromEntries(Array.from(attrs).map((a) => [a.name, a.value]));

    localStorage.setItem("allSliders", JSON.stringify(allSliders))
}

let idCount = 0

function createCustomVarUI(sliderData) {
    const varArea = qs(".var-area")
    const varContainer = addElement("div", {class: "varContainer"}, varArea)
    const container1 = addElement("div", {class: "c1"}, varContainer)
    const container2 = addElement("div", {class: "c2"}, varContainer)

    const nameData = {
        class: "unset-default", 
        name: "var-name", type: "text", placeholder: "x"
    }
    if (sliderData) { 
        nameData.value = sliderData.varname || ""
        console.log(sliderData)
    }

    const varName = addElement("input", nameData, container1)
    varName.addEventListener("input", () => { fitToContent(varName) })
    function fitToContent(e) { // passa bredd till content
        e.size = Math.max(e.value.length - 4, 1)
    }
    fitToContent(varName)

    const eq = addElement("span", {}, container1, innerHTML="  =    ")

    let varData
    let varId = 0
    if (!sliderData) {
        const allSliders = JSON.parse(localStorage.getItem("allSliders"))
        if (allSliders) {
            varId = Number(Object.keys(allSliders).slice(-1)) + 1
        }
        varData = {
            class: "slider-num", varId: varId,
            type: "number", name: "var-value", value: 1, min: -20, max: 20, step: 0.01
        }
        idCount += 1
    }
    else {
        varData = sliderData
        varData.type = "number"
        varData.class = "slider-num"
    }

    const sliderNum = addElement("input", varData, container1)

    const dropDown = addElement("div", {class: "controls dropdown"}, container2)
    const caret = addElement("i", {class: "bi bi-caret-down"}, dropDown)
    const ddContent = addElement("div", {class: "controls dropdown-content"}, dropDown)
    const knobs = {
        "min": varData.min, "max": varData.max, "step": varData.step
    }
    for (let [name, value] of Object.entries(knobs)) {
        const knob = addElement("div", {class: "knob-container"}, ddContent)
        const data = { class: "knob-input", type: "number", name: name, value: value, step: 1 }
        if (name === "step") { data.step = 0.1 }
        const label = addElement("label", {class: "knob-label"}, knob, name)
        const input = addElement("input", data, knob)
        input.addEventListener("input", (e) =>  {
            inp = e.target
            const slider = inp.closest(".c2").querySelector(".slider")
            const sliderNum = inp.closest(".varContainer").querySelector(".slider-num")
            slider.setAttribute(name, inp.value)
            sliderNum.setAttribute(name, inp.value)
        })
    }

    varData.type = "range"
    varData.class = "slider"
    const slider = addElement("input", varData, container2)

    updateRelatedValue(slider, sliderNum)
    
    saveCustomVar(slider.attributes)

    slider.addEventListener("input", sliderInput)
    sliderNum.addEventListener("input", sliderInput)
    function sliderInput(e) {
        e.target.setAttribute("value", e.target.value)
        saveCustomVar(e.target.attributes)
    }

    varName.addEventListener("input", () => {
        slider.setAttribute("varName", varName.value)
        sliderNum.setAttribute("varName", varName.value)
        saveCustomVar(slider.attributes)
    })

    const xMark = addElement("i", {class: "close-btn bi bi-x-circle"}, container1)
    xMark.addEventListener("click", (e) => {
       const slider = e.target.closest(".c1").querySelector("[name='var-value']")
       const varContainer = e.target.parentElement.parentElement
       varContainer.remove()
       
       const allSliders = JSON.parse(localStorage.getItem("allSliders")) || []
       delete allSliders[slider.getAttribute("varId")]
       console.log(allSliders)
       localStorage.setItem("allSliders", JSON.stringify(allSliders))

    //    idCount -= 1
    })
}

const newVarButton = qs(".new-var-btn")
newVarButton.addEventListener("click", () => {
    console.log("click")
    createCustomVarUI()
})

function updateRelatedValue(elA, elB) {
    elA.addEventListener("input", () => {
        elB.value = elA.value
    })
    elB.addEventListener("input", () => {
        elA.value = elB.value
    })
}

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
    return res
}