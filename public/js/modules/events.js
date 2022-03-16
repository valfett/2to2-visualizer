export default function setupEvents(THREE, uniforms, uArea, isRendering, render, toggleLock) {

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
}

