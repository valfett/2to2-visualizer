precision mediump float;

uniform vec2 u_mouse;
uniform bool u_draw_function_value;
uniform bool u_draw_julia;
varying vec2 v_func_value;

//custom-uniforms

#define PI 3.14159265
#define TAU 6.2831853

// Helper functions for complex values //
vec2 i = vec2(0, 1);
vec2 one = vec2(1, 0);

float Re(vec2 z) {
    return z.x;
}
float Im(vec2 z) {
    return z.y;
}
vec2 expC(vec2 z) {
    return exp(z.x) * vec2(cos(z.y), sin(z.y));
}
vec2 logC(vec2 z) {
    float a = atan(z.y, z.x);
    return vec2(log(length(z)), a);
}
vec2 powC(vec2 z, float n) {
    float a = atan(z.y, z.x);
    return pow(length(z), n) * vec2(cos(n*a), sin(n*a));
}
vec2 mulC(vec2 z1, vec2 z2) {
    return vec2(z1.x*z2.x - z1.y*z2.y, z1.x*z2.y + z1.y*z2.x);
}
vec2 divC(vec2 z1, vec2 z2) {
    return mulC(z1, powC(z2, -1.0));
}
float argC(vec2 z) {
    float a = atan(z.y, z.x); // -pi to pi
    return a + (-step(0.0, a)+1.0)*TAU; // 0 to 2pi
}
vec2 iTimes(vec2 z) {
    return vec2(-z.y, z.x);
}
vec2 sinC(vec2 z) {
    return vec2(sin(z.x)*cosh(z.y), sinh(z.y)*cos(z.x));
}


const int maxIterations = 128;

vec3 coloring(float n, vec2 z, vec2 c) { // not actually used
    return vec3(0);
}

//func-START

void main() {
    if (u_draw_function_value) {
        vec2 uv = u_mouse;
        f(uv, uv);
        v_func_value = uv;

    }

    gl_Position = vec4(position, 1.0);
}