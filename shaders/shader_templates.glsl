//mandelbrot
vec3 f(vec2 pos, inout vec2 z) {
    float n = 0.0;
    for (int i = 0; i < maxIterations; i++) {
        z = powC(z, 2.0) + pos;
        n += 1.0;
        if (length(z) > 2.0) { break; }
    }

    return coloring(n, z);
}
//end

//burningShip
vec3 f(vec2 pos, inout vec2 z) {
    float n = 0.0;
    for (int i = 0; i < maxIterations; i++) {
        z = vec2(abs(z.x), abs(z.y));
        z = powC(z, 2.0) + pos;
        n += 1.0;
        if (length(z) > 2.0) { break; }
    }

    return coloring(n, z);
}
//end

//identity
vec3 f(vec2 c, inout vec2 z) {
    z = z;
    return coloring(0., z);
}
//end

//iterativeFunc1
vec3 f(vec2 pos, inout vec2 z) {
    float n = 0.0;
    for (int i = 0; i < maxIterations; i++) {
        z = z*z*z*z + powC(z, 2.0) / powC(pos, 2.0) + pos;
        n += 1.0;
        if (length(z) > 2.0) { break; }
    }

    return coloring(n, z);
}
//end

//sinZ
vec3 f(vec2 pos, inout vec2 z) {
    z = sinC(z);
    return coloring(0., z);
}
//end


//domainColoring1
// Color gradient based on the return value of the function f(z) (angle and absolute value)
// https://complex-analysis.com/content/domain_coloring.html
vec3 coloring(float n, vec2 z) {
    float v = argC(z); // argC(z) returns the angle (phase) of z in radians from 0 to 2pi
    float length_mask = pow(fract(log(length(z))), 0.2);
    return sin(vec3(1.0, 0.5, 0.0) * (v / TAU)*2.5)*1.2 * length_mask;
}
//end

//iterationColoringBasic
// Color red if the point is stable, otherwise white
vec3 coloring(float n, vec2 z) {
    if (n == float(maxIterations)) {
        return vec3(1.0, 0.0, 0.0);
    }
    else {
        return vec3(1);
    }
}
//end

//iterationColoring1
// Color gradient based on the number of iterations
vec3 coloring(float n, vec2 z) {
    if (n == float(maxIterations)) {
        return vec3(0.0, 0.0, 0.0);  // color black if the point is stable
    }
    n = sqrt(n / float(maxIterations)) * 50.0;
    vec3 col = sin(vec3(2.0, 1.5, 0.2) * n);
    return col * .5 + .5; // normalize color to [0, 1] range
}
//end

//domain-iterationColoring
// Color gradient based on both f(z) and the number of iterations
vec3 coloring(float n, vec2 z) {
    float v = argC(z);
    vec3 phase_col = sin(vec3(1.0, 0.25, 0.0) * (v / TAU) * 2.5)  *.5 +.5;
    float length_mask = pow(fract(log(length(z))), 0.5);
    float alpha = sqrt(n / float(maxIterations))*1.2;
    return (phase_col * length_mask * alpha);
}
//end