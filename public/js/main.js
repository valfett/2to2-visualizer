import * as THREE from '/third_party/three.module.js'
import * as UI from './modules/ui.js'
import setupEvents from './modules/events.js'

async function main(){

// UI

    UI.createSideBarUI()
    UI.createNavbarUI()
    let stats = UI.createFpsUI()

// Init //

    let isRendering = false
    let wheelTimer
    let toggleLock = false
    let uArea = new THREE.Vector4(0, 0, 1, 1)

    const uniforms = {
        u_time: {value: 0}, 
        u_resolution: {value: new THREE.Vector3()}, 
        u_area: {value: uArea}, 
        u_mouse: {value: new THREE.Vector2()}, 
        u_grid_enabled: {value: true}, 
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
        UI.clearErrorsUI()
        console.log("no errors compiling shaders")
        return true
    }

    function handleShaderErrors(err) {
 
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

        UI.createErrorsUI(err, errObject)
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
                        if (!isRendering) {
                            isRendering = true
                            requestAnimationFrame(render)
                        }
                    })
                    slider.addEventListener("mouseup", () => {
                        isRendering = false
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
        if (!document.querySelector(".slider")) { UI.createSliderUI() } // might already exist
        UI.createCodeUI(template, templates, createSceneOnLoad, storeEditorCode)

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

function setupEvents() {

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
                setUniform("u_grid_enabled", !getUniform("u_grid_enabled"))
                requestAnimationFrame(render)
            }
            else if (e.code === 'KeyH') { 
                setUniform("u_function_grid", !getUniform("u_function_grid"))
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
                setUniform("u_grid_enabled", false)
                el.style.display = "none"
             }
        })
        requestAnimationFrame(render)
    }
    
    function toggleFunctionDrawOn() {
        setUniform("u_draw_function_value", true)
        toggleRenderingOn()
    }
    function toggleFunctionDrawOff() {
        setUniform("u_draw_function_value", false)
        isRendering = false
    }
    
    function toggleJuliaSetOn() {
        if (!toggleLock) {
            setUniform("u_draw_julia", true)
            toggleRenderingOn()
        }
    }
    function toggleJuliaSetOff() {
        if (!toggleLock) {
            setUniform("u_draw_julia", false)
            toggleRenderingOff()
            requestAnimationFrame(render)
        }
    }
    function toggleLockJuliaSet() {
        if (getUniform("u_draw_julia")) {
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
}
setupEvents()

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
