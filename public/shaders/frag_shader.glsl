precision mediump float;

uniform vec2 u_resolution;
uniform vec4 u_area;
uniform vec2 u_mouse;
uniform bool u_grid_enabled;
uniform bool u_draw_julia;
uniform bool u_function_grid;
uniform bool u_draw_function_value;
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

//coloring-START

//func-START

float smoothbump(float m, float d, float blur, float x) {
    float L1 = d/2.0 + blur;
    float L2 = d/2.0;
    return smoothstep(m - L1, m - L2, x) - smoothstep(m + L2, m + L1, x);
}

float create_grid(vec2 uv, vec2 offset, vec2 spacing, float lw, float blur) {

    //uv = vec2(length(uv), atan(uv.y, uv.x));  //polar (fix)
    uv = mod(uv - offset, spacing);
    uv = min(uv, spacing - uv);

    //float grid = smoothstep(-lw-blur, -lw, min(uv.x, uv.y)) - smoothstep(lw, lw+blur, min(uv.x, uv.y));
    float grid = smoothbump(0.0, lw, blur, min(uv.x, uv.y));
    return grid;
}

float circle(vec2 uv, vec2 center, float r, float blur) {
    return -smoothstep(r-blur, r+blur, length(uv - center)) + 1.0;
}

vec3 add_mask(vec3 col, float mask, vec3 mask_col) {
    return (1.0 - mask)*col + (mask_col * mask);
}

void main() {
    vec2 norm_pos = (gl_FragCoord.xy / u_resolution.xy) - 0.5;  // -0.5 to 0.5

    float aspect = u_resolution.x / u_resolution.y;
    // scale, offset, aspect ratio
    vec2 uv = u_area.xy + norm_pos * vec2(u_area.z * aspect, u_area.w) * 2.0;

    vec3 col;
    vec2 uv_before = uv;

    if (u_draw_julia) {
        vec2 start = u_mouse;
        col = f(start, uv);
    }
    else {col = f(uv, uv); }

    if (u_draw_function_value) {
        float r = u_area.z * 0.03;
        float value_circle = circle(uv_before, v_func_value, r, r*0.1);
        vec3 circle_color = vec3(1);
        col = add_mask(col, value_circle, circle_color);
    }

    if (!u_function_grid) { uv = uv_before; } // draw grid based on domain space (not warped)
    if (u_grid_enabled) {
        vec2 offset = vec2(0, 0);
        vec2 spacing = vec2(1, 1) * exp(-ceil(-log(u_area.zw)));
        float lw = 0.004 * u_area.w;  // line width
        float blur = 0.004 * u_area.w; //smoothness

        // vec3 bg_color = vec3(0.4392, 0.4392, 0.4392);
        // vec3 og_color = vec3(0.1216, 0.1216, 0.1216);
        // float og = smoothbump(0.0, lw, blur, min(abs(uv.x), abs(uv.y)));

        vec3 grid_col = vec3(0.3333, 0.3333, 0.3333);
        vec3 xaxis_col = vec3(1.0, 0.0, 0.0);
        vec3 yaxis_col = vec3(0.1176, 1.0, 0.0);

        float xaxis = smoothbump(0.0, lw, blur, abs(uv.y));
        float yaxis = smoothbump(0.0, lw, blur, abs(uv.x));

        grid_col = add_mask(grid_col, xaxis, xaxis_col);
        grid_col = add_mask(grid_col, yaxis, yaxis_col);

        float grid = create_grid(uv, offset, spacing, lw, blur);

        // vec3 grid_color = add_mask(bg_color, og, og_color);


        col = add_mask(col, grid, grid_col);
    }

    vec2 p = gl_PointCoord;
    
    gl_FragColor = vec4(col, 1.0);
}