//mandelbrot
vec3 f(vec2 c, inout vec2 z) {
    float n = 0.0;
    for (int i = 0; i < maxIterations; i++) {
        z = powC(z, 2.0) + c;
        n += 1.0;
        if (length(z) > 2.0) { break; }
    }

    return coloring(n, z, c);
}
//end

//mandelbrotAnimate
vec3 f(vec2 c, inout vec2 z) {
    float n = 0.0;
    for (int i = 0; i < maxIterations; i++) {
        z = powC(z, sin(u_time) * 3.0) + c;
        n += 1.0;
        if (length(z) > 2.0) { break; }
    }

    return coloring(n, z, c);
}
//end

//burningShip
vec3 f(vec2 c, inout vec2 z) {
    float n = 0.0;
    for (int i = 0; i < maxIterations; i++) {
        z = vec2(abs(z.x), abs(z.y));
        z = powC(z, 2.0) + c;
        n += 1.0;
        if (length(z) > 2.0) { break; }
    }

    return coloring(n, z, c);
}
//end

//f1
vec3 f(vec2 c, inout vec2 z) {
    float n = 0.0;
    for (int i = 0; i < maxIterations; i++) {
        z = z*z*z*z + powC(z, p) / powC(c, d) + c;
        n += 1.0;
        if (length(z) > radius) { break; }
    }

    return coloring(n, z, c);
}
//end

//identity
vec3 f(vec2 c, inout vec2 z) {
    return z
}
//end


//domainColoring1
vec3 coloring(float n, vec2 z, vec2 c) {
    float a = argC(z);
    float x = pow(fract(log(length(z))), 0.2);
    return sin(vec3(1.0, 0.5, 0.0) * (a / TAU)*2.5)*1.2 * x;
}
//end

//domainColoring2
vec3 coloring(float n, vec2 z, vec2 c) {
    float a = argC(z);
    float x = pow(mod(log(length(z)), 2.0), 0.5);
    return sin(vec3(1.0, 0.25, 0.0) * (a / TAU)*2.5 * sqrt(n / float(maxIterations)))*1.2 * x;
}
//end

//iterationColoring1
vec3 coloring(float n, vec2 z, vec2 c) {
    n = n / float(maxIterations) * 50.0;
    return sin(vec3(2.0, 1.5, 0.2) * n) *.5 + .5;
}
//end

//iterationColoring2
vec3 coloring(float n, vec2 z, vec2 c) {
    if (n == float(maxIterations)) {
        return vec3(0.0, 0.0, 0.1);
    }
    n = sqrt(n / float(maxIterations)) * 42.0;
    return sin(vec3(1.0, 1.0, 0.1) * n) *.5 + .5;
}
//end

//iterationColoring3
vec3 coloring(float n, vec2 z, vec2 c) {
    if (n == float(maxIterations)) {
        return vec3(1.0, 0.0, 0.0);
    }
    else {
        return vec3(1);
    }
}
//end