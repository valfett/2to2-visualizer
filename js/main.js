import * as THREE from 'three'

async function main(){

// UI

    // split for sidebar
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

    function createCodeUI() {
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

    function createSliderUI() {
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
    
    // fps counter
    let stats = new Stats()
    stats.showPanel(0)
    document.body.append(stats.dom)
    stats.dom.style.left = ""
    stats.dom.style.right = "0px"  
    stats.dom.setAttribute("class", "stats")

    //navbar
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

    //UI helper methods
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

// Init //

    let isRendering = false
    let wheelTimer
    let toggleLock = false
    let grid = true
    let uArea = new THREE.Vector4(0, 0, 1, 1)

    const uniforms = {
        u_time: {value: 0}, 
        u_resolution: {value: new THREE.Vector3()}, 
        u_area: {value: uArea}, 
        u_mouse: {value: new THREE.Vector2()}, 
        u_grid_enabled: {value: grid}, 
        u_draw_julia: {value: false}, 
        u_function_grid: {value: false}, 
        u_draw_function_value: {value: false}
    } 
    function setUniform(name, val) {
        uniforms[name] = {value: val}
    }
    function getUniform(name) {
        return uniforms[name].value
    }
    function deleteUniform(name) {
        delete uniforms[name]
    }

    const canvas = document.querySelector("#canvas")
    const renderer = new THREE.WebGLRenderer({canvas})
    renderer.autoClearColor = false;

    const scene = new THREE.Scene()

    const camera = new THREE.OrthographicCamera(  // 2D
        -1, // left
        1, // right 
        1, // top
        -1, // bottom
        -1, // near,
        1, // far
    );

// Shaders //

    async function loadData(urls) {
        let dataList = []
        for (let url of urls) {
            async function f(url) {

                const res = await fetch(url)
                if (url.includes('.json')) { return await res.json() }
                else { return await res.text() }
            }
            let json = await f(url)
            dataList.push(json)
        }
        if (dataList.length === 1) { return dataList[0] }
        return dataList
    }

    let templates = await loadData(['shaders/shader_templates.json'])
    let template = {
        baseShaderUrls: ["shaders/vertex_shader.glsl", "shaders/frag_shader.glsl"],
        snippets: {
            func: templates.func.mandelbrot, 
            coloring: templates.coloring.domainColoring1
        }
    }

    const defaultShaders = await loadData(['shaders/shader_templates.glsl'])

    function storeEditorCode(snippet, setToDefault=false){

        const name = snippet.className

        if (setToDefault) {  // first time, set to default
            
            // find the correct function within 'shader_templates.glsl'
            const startIndex = defaultShaders.search('//' + name) + name.length + 3
            const endIndex = defaultShaders.slice(startIndex).search("//end") + startIndex
            const text = defaultShaders.slice(startIndex, endIndex)

            localStorage.setItem(name, text)
        }
        else {
            const codeInput = document.getElementsByClassName(name)[0]
            localStorage.setItem(name, codeInput.innerText) // fix escaping
        }
    }
    // get code from localstorage and put it into shader code at given locations
    function insertIntoShaders(shaders) {
        let [vertShader, fragShader] = shaders


        for (let [key, snippet] of Object.entries(template.snippets)) {
            const name = snippet.className
            const code = localStorage.getItem(name)
            const startString = '//' + key + '-START'
            fragShader = fragShader.replace(startString, code)
            
            if (key === "func") { // only insert function (not coloring function) into vertex shader
                vertShader = vertShader.replace(startString, code)
            }
        }
        return [vertShader, fragShader]
    }

    function createShader([vertexShader, fragShader]) {
        const material = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragShader, 
            uniforms: uniforms
        })
        const planeGeo = new THREE.PlaneGeometry(2, 2)
        const plane = new THREE.Mesh(planeGeo, material)

        scene.children.pop()
        scene.add(plane)

        try { renderer.compile(scene, camera) }
        catch(err) { 
            handleShaderErrors(err.message) 
            return false
        }
        clearErrorsUI()
        return true
    }

    function handleShaderErrors(err) {
        // console.log(err)
        let errors = err.match(/ERROR: .*/g)
        let errObject = {}
        for (let error of errors) {
            let errMsg = error.match(/ERROR: 0:(?<lineNum>\d+): (?<msg>.*)/)

            let [lineNum, msg] = [errMsg.groups.lineNum, errMsg.groups.msg]
            if (!errObject[lineNum]) {
                errObject[lineNum] = {messages: []}
            }
            errObject[lineNum].messages.push(msg)

            if (!errObject[lineNum].relevantLine) {
                let relevantLine = err.match(new RegExp(`\n${lineNum}:.*`))
                relevantLine = relevantLine[0].replace(/\n\d+:\s+/, "")
                errObject[lineNum].relevantLine = relevantLine
            }
        }

        createErrorsUI(err, errObject)
    }

    function createErrorsUI(err, errorObject) {
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
    function clearErrorsUI() {
        const errorsSection = document.querySelector(".errors-section")
        console.log(errorsSection)
        if (errorsSection) { errorsSection.style.display = "none" }
    }

    function handleCustomSliders(userCode, bs) {
        let baseShaders = bs

        const sliders = document.querySelectorAll(".slider,.slider-num")

        for (let slider of sliders) {
            if (slider.getAttribute("varName")) {
                const varName = slider.getAttribute("varName")

                let sliderExistsInCode = false
                for (let code of userCode) {
                    if (code.includes(varName)) { 
                        sliderExistsInCode = true 
                    }
                }
                if (sliderExistsInCode) {

                    setUniform(varName, slider.getAttribute("value"))
                    slider.addEventListener("input", () => { 
                        setUniform(varName, slider.getAttribute("value"))
                        toggleRenderingOn()
                    })
                    slider.addEventListener("mouseup", () => {
                        toggleRenderingOff()
                    })

                    if (slider.classList.contains("slider")) { // half
                        console.log(varName + ": slider exists")

                        let newBaseShaders = []
                        for (let baseShader of baseShaders) {
                            const idString = "//custom-uniforms"
                            const insertValue = "\nuniform float " + varName + ";"
                            const insertIndex = baseShader.search(idString) + idString.length
                            let newBaseShader = baseShader.slice(0, insertIndex) + insertValue + baseShader.slice(insertIndex)

                            newBaseShaders.push(newBaseShader)
                        }
                        baseShaders = newBaseShaders //update baseShaders
                    }
                }
            }
        }
        return baseShaders
    }

//

    function reloadShader(storeDefault) {
        console.log("reload ran")
        let snippetCodes = []

        for (let [key, snippet] of Object.entries(template.snippets)) {

            if (storeDefault) { storeEditorCode(snippet, true) }
            else { storeEditorCode(snippet, false) }

            const code = localStorage.getItem(snippet.className)
            snippetCodes.push(code)
        }

        loadData(template.baseShaderUrls).then((baseShaders) => {

            let newBaseShaders = handleCustomSliders(snippetCodes, baseShaders)

            let shaders = insertIntoShaders(newBaseShaders)

            createShader(shaders)
            requestAnimationFrame(render)
        })
    }
    const runBtn = document.getElementById("run-btn")
    runBtn.addEventListener('click', reloadShader)

    function createSceneOnLoad() {
        console.log("createScene ran")

        const mainSection = document.getElementById("main-code-section")
        mainSection.innerHTML = ""
        if (!document.querySelector(".slider")) { createSliderUI() } // might already exist
        createCodeUI()

        for (let [key, snippet] of Object.entries(template.snippets)) {

            if (!localStorage.getItem(snippet.className)) {
                storeEditorCode(snippet, true) // store defaults = true
            }

            const name = snippet.className
            const text = localStorage.getItem(name)
            const codeInput = document.getElementsByClassName(name)[0]

            codeInput.setAttribute("value", text)
            codeInput.connectedCallback()
        }

        reloadShader()
    }
    createSceneOnLoad()

// Event listeners //

    canvas.addEventListener('mousemove', cameraDragMouse)
    canvas.addEventListener("mousemove", displayCoordinates)
    canvas.addEventListener('mouseup', toggleRenderingOff)
    canvas.addEventListener('wheel', cameraZoom)
    canvas.addEventListener('wheel', detectScrollStop)
    window.addEventListener('keydown', keyEventHandler)
    window.addEventListener('keyup', (e) => { 
        if (e.code === 'KeyJ') { toggleJuliaSetOff() }
        if (e.code === 'KeyF') { toggleFunctionDrawOff() }
    })
    
    function keyEventHandler(e) {
        if ((document.activeElement === document.body)) { // only check these if canvas has focus
            if (['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'].includes(e.code)) { cameraDragArrows(e) }
            else if (['KeyQ', 'KeyW'].includes(e.code)) { cameraZoomKeys(e) }
            else if (e.code === 'KeyR') { resetCamera() }
            else if (e.code === 'KeyJ') { toggleJuliaSetOn(e) }
            else if (e.code === 'KeyL') { toggleLockJuliaSet() }
            else if (e.code === 'KeyG') { 
                grid = !grid
                requestAnimationFrame(render)
            }
            else if (e.code === 'KeyH') { 
                uniforms.u_function_grid.value = !uniforms.u_function_grid.value
                requestAnimationFrame(render)
             }
            else if(e.code === 'KeyF') { toggleFunctionDrawOn() }
            else if (e.code === 'KeyU') { toggleUI() }
        }
        if (e.code === 'Enter' && e.ctrlKey) { reloadShader() }
    }

    let uiOn = true
    let uiElems = ["#pos-box", ".stats"]
    function toggleUI() {
        uiOn = !uiOn

        uiElems.forEach((selector) => {
            const el = document.querySelector(selector)
            if (uiOn) { 
                el.style.display = "" 
            }
            if (!uiOn) { 
                grid = false
                el.style.display = "none"
             }
        })
        requestAnimationFrame(render)
    }

    function toggleFunctionDrawOn() {
        uniforms.u_draw_function_value.value = true;
        toggleRenderingOn()
    }
    function toggleFunctionDrawOff() {
        uniforms.u_draw_function_value.value = false
        isRendering = false
    }

    function toggleJuliaSetOn() {
        if (!toggleLock) {
            uniforms.u_draw_julia.value = true;
            toggleRenderingOn()
        }
    }
    function toggleJuliaSetOff() {
        if (!toggleLock) {
            uniforms.u_draw_julia.value = false;
            toggleRenderingOff()
            requestAnimationFrame(render)
        }
    }
    function toggleLockJuliaSet() {
        if (uniforms.u_draw_julia.value) {
            toggleLock = !toggleLock 
            if (!toggleLock) { toggleJuliaSetOff() }
            else { toggleRenderingOff() } // ??
         }
    }

    function displayCoordinates(e) {
        let pos = screenToShaderCoords(e.offsetX, e.offsetY)

        if (!toggleLock) {
            uniforms.u_mouse.value.set(pos.x, pos.y)
        }

        const posBox = document.getElementById("pos-box")
        const x = pos.x.toFixed(-Math.log10(uArea.z) + 3)
        const y = pos.y.toFixed(-Math.log10(uArea.w) + 3)
        posBox.innerHTML = `${x}, ${y}`
    }

    function screenToShaderCoords(x, y) {
        const res = uniforms.u_resolution.value
        const aspect = res.x / res.y

        let uv = new THREE.Vector2(x, y)
        uv.divide(res).subScalar(0.5).multiply(new THREE.Vector2(1, -1))

        let scale = new THREE.Vector2(uArea.z * aspect, uArea.w)
        uv.multiply(scale.multiplyScalar(2.0)).add(new THREE.Vector2(uArea.x, uArea.y))

        return uv
    }

    function resetCamera() {
        uArea.set(0, 0, 1, 1)
        requestAnimationFrame(render)
    }
    function detectScrollStop(e) {
        clearTimeout(wheelTimer)
        wheelTimer = setTimeout(() => {
            toggleRenderingOff()
        }, 50)
    }

    function cameraDragMouse(e) {
        if (e.buttons === 1) {

            const aspect = canvas.width / canvas.height
            const dpr = devicePixelRatio

            let dx = ((e.movementX / canvas.width) * uArea.z * aspect * 2) / dpr
            let dy = ((e.movementY / canvas.height) * uArea.w * 2) / dpr
            uArea.x -= dx
            uArea.y += dy
            
            toggleRenderingOn()
        }
    }
    function cameraDragArrows(e) {
        let stepX = 0
        let stepY = 0

        switch (e.code) {
            case 'ArrowLeft': {stepX = +1; break}
            case 'ArrowRight': {stepX = -1; break}
            case 'ArrowUp': {stepY = +1; break}
            case 'ArrowDown': {stepY = -1; break}
        }

        let dx = stepX * uArea.z * 0.5
        let dy = stepY * uArea.w * 0.5
        uArea.x -= dx
        uArea.y += dy

        toggleRenderingOn()
    }
    function cameraZoom(e) {
        
        let d = e.deltaY * 0.001

        const mousePos = screenToShaderCoords(e.offsetX, e.offsetY)
        const offset = new THREE.Vector2(uArea.x, uArea.y)
        offset.lerp(mousePos, -d)
        uArea.x = offset.x
        uArea.y = offset.y

        uArea.z = (1 + d) * uArea.z
        uArea.w = (1 + d) * uArea.w

        toggleRenderingOn()
    }
    function cameraZoomKeys(e) {
        const s = 0.35
        let dz = 0
        switch(e.code) {
            case 'KeyQ': {dz = +s; break}
            case 'KeyW': {dz = -s; break}
        }
        uArea.z = (1 + dz) * uArea.z
        uArea.w = (1 + dz) * uArea.w

        toggleRenderingOn()
    }

    function toggleRenderingOn() {
        if (!isRendering) {
            isRendering = true
            requestAnimationFrame(render)
        }
    }
    function toggleRenderingOff() {
        isRendering = false
    }
    
// Resizing stuff //

    function resizeCanvas() {
        console.log("resize")
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        renderer.setSize(width, height, false);

        uniforms.u_resolution.value.set(canvas.width, canvas.height)

        requestAnimationFrame(render)
    }
    const resizeObserver = new ResizeObserver(resizeCanvas)
    resizeObserver.observe(canvas)

// Main rendering loop // 

    function render(t) {
        stats.begin()

        // set shader variables
        uniforms.u_area.value = uArea
        uniforms.u_grid_enabled.value = grid

        // render the scene
        renderer.render(scene, camera)

        stats.end()

        // Dont animate unless necessary
        if (isRendering) { 
            requestAnimationFrame(render)
        } 
    } 
    requestAnimationFrame(render)
}
main()
